BEGIN;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS areas (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  area_type TEXT NOT NULL CHECK (area_type IN ('village', 'district', 'zone')),
  lat NUMERIC(9, 6),
  lng NUMERIC(9, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('safe', 'warning', 'critical')),
  area_id BIGINT REFERENCES areas(id) ON DELETE SET NULL,
  lat NUMERIC(9, 6),
  lng NUMERIC(9, 6),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulation_sources (
  id BIGSERIAL PRIMARY KEY,
  source_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulation_readings (
  id BIGSERIAL PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES simulation_sources(id) ON DELETE CASCADE,
  external_event_id TEXT,
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  area_id BIGINT REFERENCES areas(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL CHECK (
    metric_type IN (
      'industrial_usage_mld',
      'natural_recharge_mld',
      'groundwater_level_m',
      'water_quality_index',
      'pressure_psi',
      'flow_rate_lps'
    )
  ),
  metric_value DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_metrics_daily (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  daily_usage_mld DOUBLE PRECISION NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  alerts_count INTEGER NOT NULL DEFAULT 0 CHECK (alerts_count >= 0),
  violations_count INTEGER NOT NULL DEFAULT 0 CHECK (violations_count >= 0),
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, metric_date)
);

CREATE TABLE IF NOT EXISTS area_metrics_daily (
  id BIGSERIAL PRIMARY KEY,
  area_id BIGINT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  population INTEGER NOT NULL CHECK (population >= 0),
  groundwater_level_m DOUBLE PRECISION NOT NULL,
  trend TEXT NOT NULL CHECK (trend IN ('rising', 'stable', 'falling')),
  status TEXT NOT NULL CHECK (status IN ('safe', 'warning', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (area_id, metric_date)
);

CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  area_id BIGINT REFERENCES areas(id) ON DELETE SET NULL,
  event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS violations (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  area_id BIGINT REFERENCES areas(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'reviewing', 'resolved')) DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS water_credits_ledger (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  delta_credits INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_area_id ON companies(area_id);

CREATE INDEX IF NOT EXISTS idx_simulation_sources_active ON simulation_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_simulation_readings_recorded_at ON simulation_readings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_readings_company_recorded ON simulation_readings(company_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_readings_area_recorded ON simulation_readings(area_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_readings_metric_type ON simulation_readings(metric_type);
CREATE UNIQUE INDEX IF NOT EXISTS uq_simulation_readings_source_external
ON simulation_readings(source_id, external_event_id)
WHERE external_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_company_metrics_date ON company_metrics_daily(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_area_metrics_date ON area_metrics_daily(metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_event_at ON alerts(event_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON alerts(resolved_at) WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_violations_company ON violations(company_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);

CREATE INDEX IF NOT EXISTS idx_water_credits_company_event ON water_credits_ledger(company_id, event_at DESC);

DROP TRIGGER IF EXISTS trg_areas_set_updated_at ON areas;
CREATE TRIGGER trg_areas_set_updated_at
BEFORE UPDATE ON areas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_companies_set_updated_at ON companies;
CREATE TRIGGER trg_companies_set_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_simulation_sources_set_updated_at ON simulation_sources;
CREATE TRIGGER trg_simulation_sources_set_updated_at
BEFORE UPDATE ON simulation_sources
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_simulation_readings_set_updated_at ON simulation_readings;
CREATE TRIGGER trg_simulation_readings_set_updated_at
BEFORE UPDATE ON simulation_readings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_company_metrics_set_updated_at ON company_metrics_daily;
CREATE TRIGGER trg_company_metrics_set_updated_at
BEFORE UPDATE ON company_metrics_daily
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_area_metrics_set_updated_at ON area_metrics_daily;
CREATE TRIGGER trg_area_metrics_set_updated_at
BEFORE UPDATE ON area_metrics_daily
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_alerts_set_updated_at ON alerts;
CREATE TRIGGER trg_alerts_set_updated_at
BEFORE UPDATE ON alerts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_violations_set_updated_at ON violations;
CREATE TRIGGER trg_violations_set_updated_at
BEFORE UPDATE ON violations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_water_credits_set_updated_at ON water_credits_ledger;
CREATE TRIGGER trg_water_credits_set_updated_at
BEFORE UPDATE ON water_credits_ledger
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE VIEW v_latest_company_metrics AS
SELECT c.id AS company_id,
       c.name AS company_name,
       c.industry,
       c.status,
       m.metric_date,
       m.daily_usage_mld,
       m.score,
       m.alerts_count,
       m.violations_count,
       m.credits
FROM companies c
LEFT JOIN LATERAL (
  SELECT *
  FROM company_metrics_daily m
  WHERE m.company_id = c.id
  ORDER BY m.metric_date DESC
  LIMIT 1
) m ON TRUE;

CREATE OR REPLACE VIEW v_latest_area_metrics AS
SELECT a.id AS area_id,
       a.name AS area_name,
       a.area_type,
       m.metric_date,
       m.population,
       m.groundwater_level_m,
       m.trend,
       m.status
FROM areas a
LEFT JOIN LATERAL (
  SELECT *
  FROM area_metrics_daily m
  WHERE m.area_id = a.id
  ORDER BY m.metric_date DESC
  LIMIT 1
) m ON TRUE;

COMMIT;
