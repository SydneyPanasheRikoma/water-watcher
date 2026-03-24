# Backend (Flask)

Flask API for Water Watcher with:

- Public dashboard endpoints (`/api/dashboard`, `/api/companies`, `/api/community`)
- Real-time simulation ingestion endpoints (`/api/simulation/readings`, `/api/simulation/readings/bulk`)

## 1) Start PostgreSQL

From repo root:

```bash
docker compose -f docker-compose.db.yml up -d
```

## 2) Create Python environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## 3) Run backend

```bash
python app.py
```

The API starts at `http://localhost:5000`.

## 4) Connect frontend

Set frontend env in repo root:

```bash
echo "VITE_API_BASE_URL=http://localhost:5000" > .env.local
```

Then run frontend (`npm run dev`).

## Deploy on Render (backend + frontend separately)

The repo includes a Render blueprint in [render.yaml](../render.yaml) that creates:

- `water-watcher-backend` (Python web service)
- `water-watcher-frontend` (Static site)
- `water-watcher-db` (managed PostgreSQL)

### Deploy steps

1. Push this repository to GitHub.
2. In Render, create a **Blueprint** service from the repository.
3. After services are created, set service environment variables:

- Backend (`water-watcher-backend`):
  - `CORS_ORIGINS=https://YOUR-FRONTEND.onrender.com`
- Frontend (`water-watcher-frontend`):
  - `VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com`

4. Redeploy both services once env vars are set.

The backend pre-deploy step runs `python scripts/bootstrap_db.py` to initialize schema and seed once.

## Simulation feed payload (single)

POST `/api/simulation/readings`

```json
{
  "sourceKey": "simulation-panel-main",
  "externalEventId": "evt-10001",
  "companyName": "AquaChem Industries",
  "areaName": "Chandpur",
  "metricType": "industrial_usage_mld",
  "metricValue": 4.37,
  "unit": "MLD",
  "recordedAt": "2026-03-24T10:00:00Z",
  "payload": {
    "sensor": "pump-4",
    "quality": "good"
  }
}
```

## Simulation feed payload (bulk)

POST `/api/simulation/readings/bulk`

```json
{
  "events": [
    {
      "sourceKey": "simulation-panel-main",
      "externalEventId": "evt-10002",
      "companyName": "SteelForge Ltd",
      "areaName": "Rampur",
      "metricType": "industrial_usage_mld",
      "metricValue": 6.51,
      "unit": "MLD"
    },
    {
      "sourceKey": "simulation-panel-main",
      "externalEventId": "evt-10003",
      "areaName": "Rampur",
      "metricType": "groundwater_level_m",
      "metricValue": 18.95,
      "unit": "m"
    }
  ]
}
```
