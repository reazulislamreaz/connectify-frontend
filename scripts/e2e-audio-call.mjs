/**
 * Two-browser audio call smoke test against production (or local).
 *
 * Usage:
 *   node scripts/e2e-audio-call.mjs
 *
 * Local backend + frontend:
 *   API_BASE=http://localhost:5001/api APP_URL=http://localhost:3000 node scripts/e2e-audio-call.mjs
 *
 * Slow VPS / duckdns (default timeouts are raised; retries enabled):
 *   API_TIMEOUT_MS=90000 API_RETRIES=5 node scripts/e2e-audio-call.mjs
 */
import { chromium } from "playwright";

const API = (process.env.API_BASE || "https://easyconnectify.duckdns.org/api").replace(
  /\/$/,
  "",
);
const APP = process.env.APP_URL || "https://easy-connectify.vercel.app";
const API_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS) || 90_000;
const API_RETRIES = Number(process.env.API_RETRIES) || 5;
const stamp = Date.now();

function apiHealthUrl() {
  const origin = API.replace(/\/api$/i, "");
  return `${origin}/health`;
}

async function fetchApi(url, options) {
  let lastError;
  for (let attempt = 1; attempt <= API_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const code = err.cause?.code || "";
      const retryable =
        code === "UND_ERR_CONNECT_TIMEOUT" ||
        code === "ECONNRESET" ||
        code === "ETIMEDOUT" ||
        err.name === "AbortError" ||
        /fetch failed/i.test(String(err.message));
      if (attempt < API_RETRIES && retryable) {
        const waitMs = 2000 * attempt;
        console.warn(
          `API request failed (attempt ${attempt}/${API_RETRIES}, ${code || err.message}). Retrying in ${waitMs / 1000}s…`,
        );
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
    }
  }
  const hint = [
    `Cannot reach API at ${API}`,
    `Health check: curl -sS --max-time 60 ${apiHealthUrl()}`,
    "If the VPS is slow or down, wait and retry, or run against local API:",
    "  API_BASE=http://localhost:5001/api APP_URL=http://localhost:3000 node scripts/e2e-audio-call.mjs",
  ].join("\n  ");
  const wrapped = new Error(hint);
  wrapped.cause = lastError;
  throw wrapped;
}

async function ensureApiReachable() {
  console.log("Checking API:", apiHealthUrl());
  const res = await fetchApi(apiHealthUrl(), { method: "GET" });
  if (!res.ok) {
    throw new Error(`API health returned ${res.status} — is the backend running?`);
  }
  const health = await res.json().catch(() => ({}));
  console.log("API OK:", health.message || "running", health.zego ? `(zego appId ${health.zego.appId})` : "");
}

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetchApi(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${json.message || JSON.stringify(json)}`);
  }
  return json;
}

async function registerUser(label) {
  const email = `calltest_${label}_${stamp}@example.com`;
  const password = "TestPass123!";
  const reg = await api("/auth/register", {
    method: "POST",
    auth: false,
    body: { name: `CallTest ${label}`, email, password },
  });
  return { email, password, token: reg.data.token, user: reg.data.user };
}

async function makeFriends(a, b) {
  const sent = await api("/friend-requests", {
    method: "POST",
    token: a.token,
    body: { receiverId: b.user.id },
  });
  const requestId = sent.data._id || sent.data.id;
  await api(`/friend-requests/${requestId}/respond`, {
    method: "PATCH",
    token: b.token,
    body: { action: "accept" },
  });
}

function watchPage(page, label) {
  const logs = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (/zego|Zego|publish|room|call|error|Error/i.test(text)) {
      logs.push(`[${label} console] ${text}`);
    }
  });
  return logs;
}

/**
 * Sign in through the UI so AuthContext gets user state from /auth/login
 * (injecting localStorage alone races the 10s /auth/me timeout on slow VPS).
 */
async function loginSession(page, { email, password, token }, label = "user") {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await page.addInitScript((t) => localStorage.setItem("token", t), token);

    await page.goto(`${APP}/login`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    try {
      await page.waitForURL(/\/dashboard/, { timeout: API_TIMEOUT_MS });
      await page.waitForTimeout(1500);
      return;
    } catch {
      if (attempt === maxAttempts) {
        const hint = await page
          .locator("body")
          .innerText()
          .then((t) => t.replace(/\s+/g, " ").slice(0, 250))
          .catch(() => "");
        throw new Error(
          `Login failed for ${label} (stuck at ${page.url()}). ${hint || "Check Vercel BACKEND_PROXY_URL and API health."}`,
        );
      }
      console.warn(
        `Login attempt ${attempt}/${maxAttempts} for ${label} timed out — retrying…`,
      );
      await page.waitForTimeout(3000 * attempt);
    }
  }
}

async function run() {
  console.log("API:", API, `(timeout ${API_TIMEOUT_MS / 1000}s, retries ${API_RETRIES})`);
  console.log("APP:", APP);

  await ensureApiReachable();

  const userA = await registerUser("a");
  const userB = await registerUser("b");
  await makeFriends(userA, userB);
  console.log("Users:", userA.user.id, userB.user.id);

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });

  const ctxA = await browser.newContext({ permissions: ["microphone"] });
  const ctxB = await browser.newContext({ permissions: ["microphone"] });
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();
  const logsA = watchPage(pageA, "A");
  const logsB = watchPage(pageB, "B");

  console.log("Logging in callee via UI…");
  await loginSession(pageB, userB, "callee");
  console.log("Logging in caller via UI…");
  await loginSession(pageA, userA, "caller");

  if (pageB.url().includes("/login") || pageA.url().includes("/login")) {
    throw new Error("A test user is still on /login — API or Vercel proxy too slow");
  }

  // Callee chat first so socket is up before the caller rings
  await pageB.goto(`${APP}/chat/${userA.user.id}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await pageA.goto(`${APP}/chat/${userB.user.id}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  console.log("Waiting for sockets to connect…");
  await pageB.waitForTimeout(6000);
  await pageA.waitForTimeout(3000);

  const urlA = pageA.url();
  const titleA = await pageA.title();
  const bodySnippet = await pageA.locator("body").innerText().then((t) => t.slice(0, 500)).catch(() => "");
  console.log("Caller page:", urlA, titleA);
  console.log("Caller body snippet:", bodySnippet.replace(/\s+/g, " ").slice(0, 300));

  const callerBtn = pageA.getByRole("button", { name: "Voice call" });
  const btnCount = await callerBtn.count();
  console.log("Voice call buttons found:", btnCount);
  if (btnCount === 0) {
    await pageA.screenshot({ path: "/tmp/call-test-caller.png", fullPage: true });
    console.log("Screenshot: /tmp/call-test-caller.png");
  }
  await callerBtn.click({ timeout: 15_000 });
  console.log("Caller: clicked Voice call");

  const acceptBtn = pageB.getByRole("button", { name: "Accept" });
  await acceptBtn.waitFor({ state: "visible", timeout: 45_000 });
  await acceptBtn.click();
  console.log("Callee: clicked Accept");

  await pageA.waitForTimeout(15_000);
  await pageB.waitForTimeout(15_000);

  const toastA = await pageA.locator("[class*='toast'], [role='status']").allTextContents().catch(() => []);
  const toastB = await pageB.locator("[class*='toast'], [role='status']").allTextContents().catch(() => []);
  const onCallA = await pageA.getByText("On call").isVisible().catch(() => false);
  const onCallB = await pageB.getByText("On call").isVisible().catch(() => false);
  const errA = await pageA.getByText(/Could not connect|Timed out|Microphone blocked|Zego error/i).isVisible().catch(() => false);
  const errB = await pageB.getByText(/Could not connect|Timed out|Microphone blocked|Zego error/i).isVisible().catch(() => false);

  console.log("\n--- Caller ---");
  console.log("On call UI:", onCallA, "Error visible:", errA);
  console.log("Toasts:", toastA.join(" | ") || "(none captured)");
  logsA.forEach((l) => console.log(l));

  console.log("\n--- Callee ---");
  console.log("On call UI:", onCallB, "Error visible:", errB);
  console.log("Toasts:", toastB.join(" | ") || "(none captured)");
  logsB.forEach((l) => console.log(l));

  await browser.close();

  const allLogs = [...logsA, ...logsB].join("\n");
  const zegoAuthFailure =
    /200101|auth failure|LOGIN_FAILED|52200101|1002099/.test(allLogs);

  if (onCallA && onCallB && !errA && !errB) {
    console.log("\nRESULT: PASS — both sides reached active call");
    process.exit(0);
  }

  console.log("\nRESULT: FAIL — call did not connect on both sides");
  if (zegoAuthFailure) {
    console.log(`
ZEGO ROOT CAUSE: token rejected (error 200101 / LOGIN_FAILED).
Signaling works; media login fails. Fix on the VPS (not in the browser):

  1. Open https://console.zegocloud.com → project App ID 1050554753
  2. Copy Server Secret (32 characters only — NOT the 64-char App Sign)
  3. Set ZEGOCLOUD_SERVER_SECRET on the VPS .env to that value
  4. Restart the API (pm2 restart …)
  5. Compare fingerprints:
       node scripts/zego-check.mjs          # in chatting-app-backend
       curl -sS https://easyconnectify.duckdns.org/health
     secretFingerprint must match on local and production after deploy.

  Optional: enable "Token authentication" in the Zego console if it is off.
`);
  }
  process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
