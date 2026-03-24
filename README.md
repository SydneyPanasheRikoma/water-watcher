# Water Watcher

Public dashboard and data platform for industrial water transparency.

## Database (ready to run)

A PostgreSQL setup is included for storing companies, areas, alerts, violations, and real-time simulation readings.

### Start

```bash
docker compose -f docker-compose.db.yml up -d
```

### Stop

```bash
docker compose -f docker-compose.db.yml down
```

### Reset data

```bash
docker compose -f docker-compose.db.yml down -v
```

### Connection

- Host: `localhost`
- Port: `5432`
- Database: `waterwatcher`
- User: `waterwatcher`
- Password: `waterwatcher`

Schema and seed files are in `database/init`.
More details: `database/README.md`.

## Backend (Flask)

Backend API code is in `backend/`.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```

Set frontend API base URL:

```bash
echo "VITE_API_BASE_URL=http://localhost:5000" > .env.local
```

## Deploy Frontend on Render (separate service)

This repo includes a Render blueprint (`render.yaml`) for the frontend static site.

### Option A: Deploy with `render.yaml`

1. Push this repo to GitHub.
2. In Render, create a **Blueprint** service from your repository.
3. Render will detect the frontend static service and deploy it.
4. In the service environment variables, set:

```bash
VITE_API_BASE_URL=https://YOUR-BACKEND-URL.onrender.com
```

5. Redeploy after setting the variable.

### Option B: Deploy manually as Static Site

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://YOUR-BACKEND-URL.onrender.com`
- Rewrite rule for SPA: `/*` -> `/index.html`

### Important when backend is deployed separately

On the backend service, allow CORS from your frontend Render domain so browser requests are accepted.

## Deploy Full Stack on Render (frontend + backend separated)

Use the blueprint in [render.yaml](render.yaml) to provision both services and a managed PostgreSQL database.

### What gets created

- `water-watcher-backend` (Python web service)
- `water-watcher-frontend` (Static site)
- `water-watcher-db` (PostgreSQL)

### Required environment variables after provisioning

- Backend service: `CORS_ORIGINS=https://YOUR-FRONTEND.onrender.com`
- Frontend service: `VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com`

Redeploy both services after setting these values.
