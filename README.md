# Connectify

WhatsApp-style messaging app with real-time chat, social feed, friends, voice/video calls, and presence.

## Live links

| Service | URL |
|---------|-----|
| **Frontend (production)** | [https://easy-connectify.vercel.app](https://easy-connectify.vercel.app) |
| **Backend API & Socket** | [https://easyconnectify.duckdns.org](https://easyconnectify.duckdns.org) |

## Features

- Real-time messaging (Socket.IO / WebSocket)
- Online / offline presence & typing indicators
- News feed with posts, comments, and likes
- Friend requests & user discovery
- Audio / video calls (ZEGOCLOUD)
- Profile management & avatar uploads
- Responsive layout (mobile + desktop)

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS
- **Data:** TanStack React Query
- **Realtime:** Socket.IO Client
- **Calls:** ZEGOCLOUD WebRTC
- **Deploy:** Vercel (frontend), VPS + nginx + PM2 (backend)

## Prerequisites

- Node.js 20+
- npm
- Running [chatting-app-backend](../chatting-app-backend) for local development (default port `8081`)

## Local development

```bash
# Install dependencies
npm install

# Copy env and adjust if needed
cp .env.example .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Local `.env.local` (backend on your machine)

```env
NEXT_PUBLIC_API_URL=/api
BACKEND_PROXY_URL=http://localhost:8081
NEXT_PUBLIC_SOCKET_URL=http://localhost:8081
NEXT_PUBLIC_UPLOADS_URL=http://localhost:8081
```

### Local dev against the live backend

```env
NEXT_PUBLIC_API_URL=/api
BACKEND_PROXY_URL=https://easyconnectify.duckdns.org
NEXT_PUBLIC_SOCKET_URL=https://easyconnectify.duckdns.org
NEXT_PUBLIC_SOCKET_PATH=/socket.io
NEXT_PUBLIC_UPLOADS_URL=https://easyconnectify.duckdns.org
```

Restart the dev server after changing env vars.

## Environment variables

| Variable | Description | Production example |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_API_URL` | Browser API base (use `/api` for Next.js proxy) | `/api` |
| `BACKEND_PROXY_URL` | Server-side rewrite target (no trailing slash) | `https://easyconnectify.duckdns.org` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO host origin | `https://easyconnectify.duckdns.org` |
| `NEXT_PUBLIC_SOCKET_PATH` | Socket.IO path on the API host | `/socket.io` |
| `NEXT_PUBLIC_UPLOADS_URL` | Base URL for uploaded media | `https://easyconnectify.duckdns.org` |

> **Important:** The production API uses `/api` and `/socket.io` at the **root** — not `/connectify/...`.

## Vercel deployment

1. Push this repo to GitHub and import the project in [Vercel](https://vercel.com).
2. Add the environment variables from the table above under **Settings → Environment Variables** (Production + Preview).
3. Redeploy after any env change.

Required on the **backend** (all PM2 instances):

```env
CLIENT_URL=http://localhost:3000,https://easy-connectify.vercel.app,https://easyconnectify.duckdns.org
```

## Socket.IO (production)

- Frontend: `https://easy-connectify.vercel.app` (HTTPS)
- Socket server: `wss://easyconnectify.duckdns.org/socket.io`
- Auth: JWT sent in `auth.token` after login
- Transport: WebSocket only in production builds

Verify in browser DevTools → **Network → WS** after logging in:

```
wss://easyconnectify.duckdns.org/socket.io/?EIO=4&transport=websocket
```

Status should be **101 Switching Protocols**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
├── app/              # Next.js pages (login, chat, feed, friends, …)
├── components/       # UI components
├── context/          # Auth, chat, call providers
├── hooks/            # React Query hooks
└── lib/              # API client, socket, utilities
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Server error (404)** on Vercel | Set `BACKEND_PROXY_URL=https://easyconnectify.duckdns.org` and redeploy |
| **Socket not connecting** | Ensure `NEXT_PUBLIC_SOCKET_URL` is `https://` and backend `CLIENT_URL` includes the Vercel domain |
| **Works on localhost, not Vercel** | HTTPS frontend cannot use `http://` sockets — use the DuckDNS HTTPS URL |
| **Env changes not applied** | Restart dev server locally; redeploy on Vercel |

## License

Private project.
