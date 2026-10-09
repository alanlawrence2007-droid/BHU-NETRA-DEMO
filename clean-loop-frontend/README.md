# Clean Loop – Frontend

React + TypeScript + Vite UI for the Clean Loop FastAPI backend (`clean-loop/`).

## Run

```bash
npm install
cp .env.example .env     # optional
npm run dev              # http://localhost:5173
```

In dev, `/api` is proxied to `http://localhost:8000` (change with `VITE_PROXY_TARGET`), so no CORS setup is needed.
For production: `npm run build`, set `VITE_API_URL` to the full API URL (e.g. `https://api.example.com/api/v1`), and add the site's origin to the backend `CORS_ORIGINS`.

## Deploy on Vercel

1. Push this folder to GitHub and import it in Vercel (framework: Vite; `vercel.json` is included and handles SPA routing).
2. In Project Settings -> Environment Variables add `VITE_API_URL` = your deployed backend, e.g. `https://your-api.example.com/api/v1`, then redeploy.
3. In the backend `.env`, add your Vercel URL to `CORS_ORIGINS` (JSON list).

Vercel can't reach a backend on your own `localhost`; the default in `.env.production` only works when you open the deployed site from the same machine that runs the backend.

## What maps to what

| Screen | Route | Backend endpoints | Roles |
|---|---|---|---|
| Sign in / register | `/login` | `POST /auth/login` (form-encoded), `POST /auth/register`, `GET /auth/me` | public |
| Dashboard | `/` | `GET /complaints/mine`, `GET /analytics/overview` | all (city overview: staff/admin) |
| Waste guide | `/waste-guide` | `GET /waste/categories`, `POST /waste/classify`, `GET /waste/rules` | all |
| Facilities | `/facilities` | `GET /facilities`, `GET /facilities/nearby` | all |
| Report an issue | `/complaints/new` | `GET /waste/categories`, `POST /complaints`, `POST /sync/complaints` | all |
| My complaints | `/complaints/mine` | `GET /complaints/mine` | all |
| Complaint detail | `/complaints/:id` | `GET /complaints/{id}`, `PATCH /complaints/{id}/status`, `POST /complaints/{id}/feedback` | owner / staff |
| All complaints | `/manage/complaints` | `GET /complaints` | staff, admin |
| Analytics | `/manage/analytics` | `GET /analytics/overview`, `GET /analytics/hotspots` | staff, admin |

Behaviour worth knowing:
- **Offline**: complaints filed offline are stored on the device with a `client_generated_id` and pushed through `/sync/complaints` when the browser is back online (or via "Sync now"). The backend de-duplicates on that id.
- **Feedback** is only offered on complaints in `resolved` status, because that is what the API accepts.
- **Role-aware UI**: staff/admin get the Municipal nav, status updates and analytics; a 401 signs the user out.

## Backend issues found while building this (backend not changed)

These will break the real API regardless of the frontend:
1. `app/api/v1/endpoints/auth.py` calls `create_access_token(subject=..., role=..., expires_delta=...)`, but `app/core/security.py` defines `create_access_token(data: dict, expires_delta=None)` -> login raises `TypeError`.
2. `auth.py` uses `settings.ACCESS_TOKEN_EXPIRE_MINUTES` and `app/utils/deps.py` uses `settings.API_V1_STR`; `config.py` only defines `access_token_expire_minutes` (and no `API_V1_STR`) -> `AttributeError`.
3. `app/main.py` passes `settings.cors_origins` (a JSON string) to `CORSMiddleware`; it should be `settings.cors_origins_list`.
4. `analytics_service.get_overview` builds `status` with `str(enum)`, which can yield `"ComplaintStatus.PENDING"`; the UI normalises this, but `row[0].value` is cleaner.
5. `update_complaint_status` wraps everything in `except Exception`, so a 404 comes back as a 400.
