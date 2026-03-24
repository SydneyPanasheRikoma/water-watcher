# Water Watcher Database

This folder contains a ready-to-run PostgreSQL setup for the Water Watcher platform.

## What is included

- `init/001_schema.sql` – full schema, constraints, indexes, and helper views
- `init/002_seed.sql` – starter data (areas, companies, metrics, alerts, violations, credits, and sample simulation readings)
- `../docker-compose.db.yml` – local PostgreSQL container

## Run database

From repository root:

```bash
docker compose -f docker-compose.db.yml up -d
```

Check health:

```bash
docker compose -f docker-compose.db.yml ps
```

Connect with psql:

```bash
docker exec -it waterwatcher-postgres psql -U waterwatcher -d waterwatcher
```

Stop database:

```bash
docker compose -f docker-compose.db.yml down
```

Reset database (delete all data):

```bash
docker compose -f docker-compose.db.yml down -v
```

## Core real-time ingestion table

Simulation panel data should be inserted into:

- `simulation_readings`

Recommended insert shape:

```sql
INSERT INTO simulation_readings (
  source_id,
  external_event_id,
  company_id,
  area_id,
  metric_type,
  metric_value,
  unit,
  recorded_at,
  payload
)
VALUES (
  1,
  'sim-event-12345',
  2,
  1,
  'industrial_usage_mld',
  3.91,
  'MLD',
  NOW(),
  '{"sensor":"pump-4","quality":"good"}'::jsonb
)
ON CONFLICT (source_id, external_event_id)
WHERE external_event_id IS NOT NULL
DO NOTHING;
```

## Useful views for backend APIs

- `v_latest_company_metrics`
- `v_latest_area_metrics`

These make it easier to build endpoints for dashboard snapshots.
