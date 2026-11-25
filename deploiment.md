# EcoTrack — Hybrid Local-Cloud Deployment Guide (`deploiment.md`)

Architecture for academic testing across **Vercel (Web)** and **Physical Android Devices (Standalone `.apk`)** connected to a **local Docker + Backend stack** exposed via a **static HTTPS tunnel**.

---

## Architecture Overview

```text
┌───────────────────────────┐        ┌──────────────────────────────────────┐
│  Vercel Web App (React)   │        │  Android Physical Phone (.apk)       │
│  https://*.vercel.app     │        │  Expo SDK 58 Standalone Build        │
└─────────────┬─────────────┘        └──────────────────┬───────────────────┘
              │ HTTPS (VITE_API_URL)                    │ HTTPS (EXPO_PUBLIC_API_URL)
              └────────────────────┬────────────────────┘
                                   ▼
                 ┌───────────────────────────────────┐
                 │  Static HTTPS Tunnel              │
                 │  (Ngrok Static Domain / Cloudflared)
                 └─────────────────┬─────────────────┘
                                   ▼
                 ┌───────────────────────────────────┐
                 │  Nginx API Gateway (Docker :8090) │
                 │  CORS + /api/v1/* Reverse Proxy   │
                 └─────────────────┬─────────────────┘
                                   ▼
        ┌────────────────────────────────────────────────────┐
        │  Microservices (3001..3004) + Internal Docker Net  │
        │  MongoDB · PostgreSQL · Redis · RabbitMQ · MinIO   │
        └────────────────────────────────────────────────────┘
```

---

## Step 1: Local Docker + Static HTTPS Tunnel (`docker-compose.yml`)

Keep internal services (`mongodb`, `postgres`, `redis`, `rabbitmq`, `minio`) on `ecotrack-network` without exposing them publicly.

> **Note:** If the 4 Node microservices (`identity-api`, `report-api`, `workflow-api`, `audit-api`) continue running directly on the Windows host, bind database ports to `127.0.0.1` (e.g., `"127.0.0.1:27017:27017"`) so they stay unreachable from the LAN/internet while remaining accessible locally.

Add a `tunnel` service to `docker-compose.yml` pointing to `api-gateway:80`:

### Option A — Ngrok (Static Domain)
```yaml
  tunnel:
    image: ngrok/ngrok:latest
    container_name: ecotrack-tunnel
    restart: unless-stopped
    command:
      - "http"
      - "--url=${NGROK_STATIC_DOMAIN}"
      - "api-gateway:80"
    environment:
      NGROK_AUTHTOKEN: ${NGROK_AUTHTOKEN}
    depends_on:
      - api-gateway
    networks:
      - ecotrack-network
```

### Option B — Cloudflare Tunnel (`cloudflared`)
```yaml
  tunnel:
    image: cloudflare/cloudflared:latest
    container_name: ecotrack-tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on:
      - api-gateway
    networks:
      - ecotrack-network
```

---

## Step 2: Backend CORS & Tunnel Headers (`deploy/docker/nginx.conf`)

Centralize CORS and preflight (`OPTIONS`) handling inside the Nginx `api-gateway` (`server { ... }`) so all 4 microservices (`identity-api`, `report-api`, `workflow-api`, `audit-api`) work uniformly from Vercel and mobile clients:

```nginx
# Allow Vercel production/preview domains and local dev
map $http_origin $cors_origin {
    default "";
    "~^https://.*\.vercel\.app$" $http_origin;
    "~^http://localhost:(3000|5173)$" $http_origin;
}
```

Inside `server { ... }` / `location /api/`:
```nginx
add_header Access-Control-Allow-Origin $cors_origin always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, ngrok-skip-browser-warning" always;
add_header Access-Control-Allow-Credentials "true" always;

if ($request_method = OPTIONS) {
    return 204;
}
```

---

## Step 3: React Web App — Vercel Ready (`apps/web-react`)

1. **API Base URL & Tunnel Header (`apps/web-react/src/services/apiClient.ts`):**
   - Replace hardcoded relative `/api/v1/...` calls in `authApi.ts`, `reportApi.ts`, and `RegisterModal.tsx` with a shared helper reading `import.meta.env.VITE_API_URL` (empty string locally so Vite's dev proxy still works).
   - Include `'ngrok-skip-browser-warning': 'true'` in request headers when targeting an Ngrok domain.

   ```ts
   const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

   export function apiUrl(path: string): string {
     return `${API_ORIGIN}${path}`;
   }

   export function defaultHeaders(extra: Record<string, string> = {}): Record<string, string> {
     return {
       'ngrok-skip-browser-warning': 'true',
       ...extra,
     };
   }
   ```

2. **SPA Routing (`apps/web-react/vercel.json`):**
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

3. **Vercel Environment Variable:**
   - In Vercel Project Settings → Environment Variables, set:
     `VITE_API_URL=https://<your-static-tunnel-domain>`

---

## Step 4: Expo Mobile App — Standalone Android `.apk` (`apps/mobile`)

1. **Static HTTPS Endpoint (`apps/mobile/src/config/env.ts`):**
   - Point `EXPO_PUBLIC_API_URL` to your static `https://` tunnel URL (no `localhost` or LAN IP references in release builds).
   - Add `'ngrok-skip-browser-warning': 'true'` to default fetch headers in `authApi.ts`, `reportApi.ts`, and `interventionApi.ts` if using Ngrok.

2. **EAS Build Profile (`apps/mobile/eas.json`):**
   ```json
   {
     "cli": {
       "version": ">= 12.0.0"
     },
     "build": {
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         },
         "env": {
           "EXPO_PUBLIC_API_URL": "https://<your-static-tunnel-domain>"
         }
       },
       "production": {
         "android": {
           "buildType": "app-bundle"
         },
         "env": {
           "EXPO_PUBLIC_API_URL": "https://<your-static-tunnel-domain>"
         }
       }
     }
   }
   ```

3. **Build the Installable `.apk`:**
   ```bash
   cd apps/mobile
   npx eas login
   npx eas build -p android --profile preview
   ```
   Download the generated `.apk` from the EAS link and install it directly on physical Android phones.
