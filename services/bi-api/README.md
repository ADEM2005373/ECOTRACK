# bi-api: Power BI Embed Token API (ECO-42 / SCRUM-53)

Express + TypeScript service (port **3006**, Nx project `@ecotrack/bi-api`). It issues a
short-lived Power BI **embed token** with Row-Level Security for the 4 official
reports shown in the web portal (`/admin/analytics`).

> The ticket named `services/bi-etl/controllers/bi_embed.controller.ts`. `bi-etl` is the
> Python ETL worker (ECO-24) and must not expose a public HTTP API, so the controller
> lives here: `src/controllers/bi-embed.controller.ts`.

## Endpoint

`GET /api/v1/bi/embed-token?report=<key>` with `Authorization: Bearer <identity-api access token>`

| `report` key          | Env variable                            |
| --------------------- | --------------------------------------- |
| `operationnel`        | `POWERBI_REPORT_ID_OPERATIONNEL`        |
| `mlops`               | `POWERBI_REPORT_ID_MLOPS`               |
| `performance-equipes` | `POWERBI_REPORT_ID_PERFORMANCE_EQUIPES` |
| `sla`                 | `POWERBI_REPORT_ID_SLA`                 |

`200` returns `{ reportId, embedUrl, accessToken, expiresAt }` with `Cache-Control: no-store`.

| Status | `error`                                                         | Cause                                                                                      |
| ------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 401    | `UNAUTHORIZED`                                                  | missing or invalid token (RS256 only, `iss`, `exp`, `sub`, `role` checked)                 |
| 403    | `FORBIDDEN`                                                     | CITOYEN/OUVRIER, or role absent from `POWERBI_RLS_ROLE_MAP` (fail closed)                  |
| 400    | `UNKNOWN_REPORT`                                                | key not in the whitelist                                                                   |
| 503    | `REPORT_NOT_CONFIGURED`                                         | report ID env variable empty                                                               |
| 503    | `REPORT_NOT_FOUND`, `POWERBI_THROTTLED` (+ `Retry-After`)       | Power BI 404 / 429                                                                         |
| 502    | `POWERBI_ACCESS_DENIED`, `AZURE_AUTH_FAILED`, `POWERBI_UNAVAILABLE`, `POWERBI_REQUEST_REJECTED`, `POWERBI_INVALID_RESPONSE` | Microsoft 401/403, MSAL failure, 5xx/network, other 4xx, unexpected payload or `embedUrl` not on `https://app.powerbi.com` |
| 504    | `UPSTREAM_TIMEOUT`                                              | Azure AD or Power BI call over 10 s                                                        |

Microsoft response bodies are never forwarded or logged; logs contain event names and codes only.

## Flow

1. Verify the user JWT with `JWT_PUBLIC_KEY` (`node:crypto`, no extra dependency).
2. Map the EcoTrack role to Power BI RLS roles (`POWERBI_RLS_ROLE_MAP`).
3. MSAL `ConfidentialClientApplication.acquireTokenByClientCredential` with scope
   `https://analysis.windows.net/powerbi/api/.default` (MSAL in-memory cache).
4. `GET https://api.powerbi.com/v1.0/myorg/groups/{workspaceId}/reports/{reportId}` for `embedUrl` and `datasetId`.
5. `POST https://api.powerbi.com/v1.0/myorg/GenerateToken` (V2, view-only by default, no `accessLevel`):
   `{ reports:[{id}], datasets:[{id}], identities:[{ username: <token sub>, roles, datasets:[datasetId] }] }`.

## Environment

See [.env.example](.env.example). Required: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`,
`AZURE_CLIENT_SECRET`, `POWERBI_WORKSPACE_ID`, `JWT_PUBLIC_KEY`, `POWERBI_RLS_ROLE_MAP`.
Optional: `PORT` (3006) and the 4 report IDs.

| Variable                 | Format                                   |
| ------------------------ | ---------------------------------------- |
| `AZURE_*_ID`, `POWERBI_*_ID` | GUID                                 |
| `AZURE_CLIENT_SECRET`    | Azure AD client secret                   |
| `JWT_PUBLIC_KEY`         | RSA PEM (identity-api's key), `\n` escapes allowed |
| `POWERBI_RLS_ROLE_MAP`   | JSON, keys `ADMIN` / `AGENT`, e.g. `{"ADMIN":["Direction_Generale_DGS"]}` |

## Azure / Power BI prerequisites

- Azure AD app registration (Service Principal) with a client secret. A **certificate is
  recommended** over a secret for production.
- Power BI Admin portal > Tenant settings > Developer settings: enable
  **"Service principals can use Fabric/Power BI APIs"** (formerly "Allow service principals to use Power BI APIs")
  and **"Embed content in apps"**, ideally scoped to a security group containing the service principal.
- Add the service principal (or its group) as **Member or Admin** of the workspace. "My workspace" is not supported.
- Production needs a **capacity** (Power BI Embedded / Fabric); without one, embed tokens are trial-limited.
- The dataset must define the RLS roles used in `POWERBI_RLS_ROLE_MAP` (ECO-41: `Direction_Generale_DGS`,
  `Mairie_Arrondissement`, `Chef_Equipe_Proprete`).

## Commands

```powershell
npm install                              # from the repository root
npx nx test @ecotrack/bi-api             # unit + HTTP tests (MSAL and Power BI mocked in tests only)
npx nx build @ecotrack/bi-api            # tsc -> services/bi-api/dist
cd services/bi-api; npm run dev          # build, then start with services/bi-api/.env
npm run start                            # start dist/main.js with variables from the environment
```

## Known gaps

- The RLS `username` is the opaque user ID (`sub`). `Mairie_Arrondissement` and
  `Chef_Equipe_Proprete` filter on `USERPRINCIPALNAME()` = district / team code, and users
  have no such field yet, so only `ADMIN` -> `Direction_Generale_DGS` is meaningful today.
  Changing the claim is a one-line change in `src/rls.ts` (`rlsUsername`).
- The nginx gateway route `/api/v1/bi` -> `:3006` and the OpenAPI path are not added by this ticket.
