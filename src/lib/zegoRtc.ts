import type { ZegoTokenResponse } from "@/types/call";

type ZegoEngine = InstanceType<
  typeof import("zego-express-engine-webrtc").ZegoExpressEngine
>;
type ZegoLocalStream = import("zego-express-engine-webrtc/sdk/code/zh/ZegoLocalStream.web").default;

let engine: ZegoEngine | null = null;
let localZegoStream: ZegoLocalStream | null = null;
let publishStreamId: string | null = null;
let activeRoomId: string | null = null;
const playingStreamIds = new Set<string>();
const remoteAudioElements = new Map<string, HTMLAudioElement>();

function formatZegoError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object") {
    const o = err as { errorCode?: number; code?: number; message?: string; msg?: string };
    const code = o.errorCode ?? o.code;
    const msg = o.message ?? o.msg;
    if (code && msg) return `Zego error ${code}: ${msg}`;
    if (msg) return msg;
    if (code) return `Zego error ${code}`;
  }
  return "Could not connect audio call";
}

function roomLoginError(errorCode: number, extendedData: string): Error {
  const serverCode =
    extendedData && /server_code["']?\s*:\s*(\d+)/.exec(extendedData)?.[1];
  const authFailure =
    errorCode === 1002099 ||
    serverCode === "52200101" ||
    /auth failure|LOGIN_FAILED/i.test(extendedData);
  if (errorCode === 1002034 || authFailure) {
    return new Error(
      "Zego rejected the call token — on your VPS set ZEGOCLOUD_SERVER_SECRET to the 32-character Server Secret from the ZEGOCLOUD console (same project as your App ID), then restart the API",
    );
  }
  return new Error(
    `Room connection failed (${errorCode})${extendedData ? `: ${extendedData}` : ""}`,
  );
}

function waitForRoomConnected(
  zg: ZegoEngine,
  roomId: string,
  timeoutMs = 25_000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      zg.off("roomStateUpdate", onRoomState);
      reject(new Error("Timed out joining Zego room"));
    }, timeoutMs);

    const onRoomState = (
      roomID: string,
      state: string,
      errorCode: number,
      extendedData: string,
    ) => {
      if (roomID !== roomId) return;
      if (state === "CONNECTED") {
        window.clearTimeout(timer);
        zg.off("roomStateUpdate", onRoomState);
        resolve();
      } else if (
        state === "LOGIN_FAILED" ||
        (state === "DISCONNECTED" && errorCode !== 0)
      ) {
        window.clearTimeout(timer);
        zg.off("roomStateUpdate", onRoomState);
        reject(roomLoginError(errorCode, extendedData));
      }
    };

    zg.on("roomStateUpdate", onRoomState);
  });
}

function waitForPublishReady(
  zg: ZegoEngine,
  streamID: string,
  timeoutMs = 12_000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      zg.off("publisherStateUpdate", onPublish);
      reject(new Error("Timed out publishing audio — check Zego credentials on the server"));
    }, timeoutMs);

    const onPublish = (result: {
      streamID: string;
      state: string;
      errorCode: number;
      extendedData?: string;
    }) => {
      if (result.streamID !== streamID) return;
      if (
        result.state === "PUBLISHING" ||
        result.state === "PUBLISH_REQUESTING"
      ) {
        window.clearTimeout(timer);
        zg.off("publisherStateUpdate", onPublish);
        resolve();
      } else if (result.state === "NO_PUBLISH" && result.errorCode !== 0) {
        window.clearTimeout(timer);
        zg.off("publisherStateUpdate", onPublish);
        const hint =
          result.errorCode === 1103044
            ? "Audio stream error — check microphone permission and try again"
            : result.extendedData || `Publish failed (${result.errorCode})`;
        reject(new Error(hint));
      }
    };

    // Must register before startPublishingStream or we can miss a fast PUBLISHING event.
    zg.on("publisherStateUpdate", onPublish);
  });
}
export async function joinAudioRoom(params: {
  appId: number;
  serverUrl: string;
  roomId: string;
  token: string;
  userId: string;
  userName: string;
  onRemoteStream: (streamId: string) => void;
}): Promise<ZegoEngine> {
  const { ZegoExpressEngine } = await import("zego-express-engine-webrtc");

  if (engine) {
    await leaveAudioRoom();
  }

  const zg = new ZegoExpressEngine(params.appId, params.serverUrl, {
    scenario: 4,
  });
  engine = zg;
  activeRoomId = params.roomId;

  const systemCheck = await zg.checkSystemRequirements();
  if (!systemCheck.webRTC) {
    engine = null;
    activeRoomId = null;
    throw new Error("This browser does not support WebRTC calls");
  }

  zg.on(
    "roomStreamUpdate",
    async (roomID, updateType, streamList: { streamID: string }[]) => {
      if (roomID !== params.roomId) return;

      if (updateType === "ADD") {
        for (const stream of streamList) {
          if (stream.streamID === publishStreamId) continue;
          await playRemoteAudio(zg, stream.streamID);
          params.onRemoteStream(stream.streamID);
        }
      } else if (updateType === "DELETE") {
        for (const stream of streamList) {
          stopRemoteAudio(stream.streamID);
        }
      }
    },
  );

  zg.on("tokenWillExpire", async () => {
    try {
      const renewed = await fetchFreshToken(params.roomId);
      zg.renewToken(renewed.token);
    } catch {
      // Token renewal failed; call may drop when token expires.
    }
  });

  const roomConnected = waitForRoomConnected(zg, params.roomId);

  const loggedIn = await zg.loginRoom(
    params.roomId,
    params.token,
    { userID: params.userId, userName: params.userName },
    { userUpdate: true },
  );

  if (!loggedIn) {
    engine = null;
    activeRoomId = null;
    throw new Error(
      "Failed to join Zego room — verify ZEGOCLOUD_APP_ID and SERVER_SECRET on the backend",
    );
  }

  try {
    await roomConnected;
    // SDK 3.x: must use createZegoStream (createStream / raw getUserMedia break publish)
    localZegoStream = await zg.createZegoStream({
      camera: { video: false, audio: true },
    });

    publishStreamId = `audio_${params.userId}`;
    const publishReady = waitForPublishReady(zg, publishStreamId);
    const published = zg.startPublishingStream(publishStreamId, localZegoStream);
    if (!published) {
      throw new Error("Failed to start publishing audio");
    }

    await publishReady;
  } catch (err) {
    await leaveAudioRoom();
    if (err instanceof Error && /permission|notallowed|denied/i.test(err.message)) {
      throw new Error(
        "Microphone blocked — allow mic access in the browser and try again",
      );
    }
    throw err instanceof Error ? err : new Error(formatZegoError(err));
  }

  return zg;
}

async function fetchFreshToken(roomId: string): Promise<ZegoTokenResponse> {
  const { api } = await import("@/lib/api");
  const res = await api<{ success: boolean; data: ZegoTokenResponse }>(
    "/calls/token",
    {
      method: "POST",
      body: JSON.stringify({ roomId }),
    },
  );
  return res.data;
}

async function playRemoteAudio(zg: ZegoEngine, streamId: string): Promise<void> {
  if (playingStreamIds.has(streamId)) return;

  const mediaStream = await zg.startPlayingStream(streamId);

  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.srcObject = mediaStream;
  audio.setAttribute("playsinline", "true");
  document.body.appendChild(audio);

  void audio.play().catch(() => {
    // Autoplay blocked until further user interaction
  });

  playingStreamIds.add(streamId);
  remoteAudioElements.set(streamId, audio);
}

function stopRemoteAudio(streamId: string): void {
  if (engine) {
    engine.stopPlayingStream(streamId);
  }
  const el = remoteAudioElements.get(streamId);
  if (el) {
    el.srcObject = null;
    el.remove();
    remoteAudioElements.delete(streamId);
  }
  playingStreamIds.delete(streamId);
}

export function setLocalAudioMuted(muted: boolean): void {
  if (!engine || !localZegoStream) return;
  engine.mutePublishStreamAudio(localZegoStream, muted);
}

export async function leaveAudioRoom(): Promise<void> {
  if (!engine) return;

  const zg = engine;
  const roomId = activeRoomId;

  if (publishStreamId) {
    zg.stopPublishingStream(publishStreamId);
    publishStreamId = null;
  }

  if (localZegoStream) {
    zg.destroyStream(localZegoStream);
    localZegoStream = null;
  }

  for (const streamId of [...playingStreamIds]) {
    stopRemoteAudio(streamId);
  }

  if (roomId) {
    zg.logoutRoom(roomId);
  } else {
    zg.logoutRoom();
  }

  engine = null;
  activeRoomId = null;
}
