export type CallPhase =
  | "idle"
  | "outgoing"
  | "incoming"
  | "connecting"
  | "active"
  | "ending";

export type CallType = "audio" | "video";

export interface IncomingCallPayload {
  callId: string;
  roomId: string;
  callerId: string;
  callerName: string;
  callType?: CallType;
}

export interface ZegoCallConfig {
  appId: number;
  serverUrl: string;
}

export interface ZegoTokenResponse {
  token: string;
  roomId: string;
  appId: number;
  serverUrl: string;
  userId: string;
}
