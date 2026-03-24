BEGIN;

INSERT INTO areas (name, area_type, lat, lng)
VALUES
  ('Chandpur', 'village', 19.060000, 72.890000),
  ('Lakshminagar', 'village', 19.130000, 72.840000),
  ('Rampur', 'village', 19.040000, 72.930000),
  ('Govindpuri', 'village', 19.090000, 72.910000),
  ('Neelgaon', 'village', 19.070000, 72.870000)
ON CONFLICT (name) DO NOTHING;

INSERT INTO companies (name, industry, status, area_id, lat, lng)
SELECT data.name,
       data.industry,
       data.status,
       a.id,
       data.lat,
       data.lng
FROM (
  VALUES
    ('AquaChem Industries', 'Chemical Manufacturing', 'warning', 'Chandpur', 19.080000, 72.880000),
    ('GreenTex Fabrics', 'Textile', 'safe', 'Lakshminagar', 19.120000, 72.850000),
    ('SteelForge Ltd', 'Steel Manufacturing', 'critical', 'Rampur', 19.050000, 72.920000),
    ('PurePharm Solutions', 'Pharmaceuticals', 'safe', 'Govindpuri', 19.100000, 72.900000),
    ('AgriGrow Exports', 'Agriculture', 'warning', 'Neelgaon', 19.070000, 72.860000),
    ('CoolBreeze HVAC', 'Manufacturing', 'safe', 'Lakshminagar', 19.110000, 72.870000)
) AS data(name, industry, status, area_name, lat, lng)
LEFT JOIN areas a ON a.name = data.area_name
ON CONFLICT (name) DO NOTHING;

INSERT INTO simulation_sources (source_key, name, description)
VALUES
  ('simulation-panel-main', 'Simulation Panel Main Feed', 'Primary event stream from the simulation panel')
ON CONFLICT (source_key) DO NOTHING;

INSERT INTO company_metrics_daily (company_id, metric_date, daily_usage_mld, score, alerts_count, violations_count, credits)
SELECT c.id,
       CURRENT_DATE,
       data.daily_usage_mld,
       data.score,
       data.alerts_count,
       data.violations_count,
       data.credits
FROM (
  VALUES
    ('AquaChem Industries', 4.2, 72, 2, 1, 15),
    ('GreenTex Fabrics', 2.8, 88, 0, 0, 42),
    ('SteelForge Ltd', 6.1, 45, 5, 3, 0),
    ('PurePharm Solutions', 1.9, 91, 0, 0, 58),
    ('AgriGrow Exports', 3.5, 67, 1, 1, 8),
    ('CoolBreeze HVAC', 1.2, 94, 0, 0, 65)
) AS data(company_name, daily_usage_mld, score, alerts_count, violations_count, credits)
JOIN companies c ON c.name = data.company_name
ON CONFLICT (company_id, metric_date) DO NOTHING;

INSERT INTO area_metrics_daily (area_id, metric_date, population, groundwater_level_m, trend, status)
SELECT a.id,
       CURRENT_DATE,
       data.population,
       data.groundwater_level_m,
       data.trend,
       data.status
FROM (
  VALUES
    ('Chandpur', 3200, 12.4, 'falling', 'warning'),
    ('Lakshminagar', 5600, 8.2, 'stable', 'safe'),
    ('Rampur', 2100, 18.7, 'falling', 'critical'),
    ('Govindpuri', 4400, 10.1, 'stable', 'safe'),
    ('Neelgaon', 1800, 15.3, 'falling', 'warning')
) AS data(area_name, population, groundwater_level_m, trend, status)
JOIN areas a ON a.name = data.area_name
ON CONFLICT (area_id, metric_date) DO NOTHING;

INSERT INTO alerts (type, message, company_id, area_id, event_at)
SELECT data.type,
       data.message,
       c.id,
       a.id,
       NOW() - data.minutes_ago * INTERVAL '1 minute'
FROM (
  VALUES
    ('critical', 'Groundwater level in Rampur dropped below safe threshold', 'SteelForge Ltd', 'Rampur', 12),
    ('warning', 'AquaChem exceeded daily extraction limit by 8%', 'AquaChem Industries', 'Chandpur', 45),
    ('warning', 'Chandpur groundwater trend shows accelerated decline', NULL, 'Chandpur', 120),
    ('info', 'PurePharm Solutions earned 5 new water credits', 'PurePharm Solutions', NULL, 180),
    ('critical', 'SteelForge Ltd recorded 3rd violation this quarter', 'SteelForge Ltd', NULL, 300)
) AS data(type, message, company_name, area_name, minutes_ago)
LEFT JOIN companies c ON c.name = data.company_name
LEFT JOIN areas a ON a.name = data.area_name;

INSERT INTO violations (company_id, area_id, category, severity, description, occurred_at, status)
SELECT c.id,
       a.id,
       data.category,
       data.severity,
       data.description,
       NOW() - data.days_ago * INTERVAL '1 day',
       data.status
FROM (
  VALUES
    ('SteelForge Ltd', 'Rampur', 'extraction-limit', 'high', 'Exceeded extraction threshold by repeated margin', 7, 'open'),
    ('AquaChem Industries', 'Chandpur', 'reporting-delay', 'medium', 'Late submission of extraction telemetry', 15, 'reviewing')
) AS data(company_name, area_name, category, severity, description, days_ago, status)
JOIN companies c ON c.name = data.company_name
LEFT JOIN areas a ON a.name = data.area_name;

INSERT INTO water_credits_ledger (company_id, delta_credits, reason, reference_type, reference_id, event_at)
SELECT c.id,
       data.delta_credits,
       data.reason,
       data.reference_type,
       data.reference_id,
       NOW() - data.days_ago * INTERVAL '1 day'
FROM (
  VALUES
    ('PurePharm Solutions', 5, 'Monthly conservation bonus', 'monthly_bonus', 'MB-2026-03', 3),
    ('AgriGrow Exports', -2, 'Penalty from warning-level overuse', 'penalty', 'PEN-2026-03', 1)
) AS data(company_name, delta_credits, reason, reference_type, reference_id, days_ago)
JOIN companies c ON c.name = data.company_name;

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
SELECT s.id,
       data.external_event_id,
       c.id,
       a.id,
       data.metric_type,
       data.metric_value,
       data.unit,
       NOW() - data.minutes_ago * INTERVAL '1 minute',
       jsonb_build_object('seed', true, 'source', 'initial-bootstrap')
FROM (
  VALUES
    ('evt-001', 'AquaChem Industries', 'Chandpur', 'industrial_usage_mld', 4.30, 'MLD', 5),
    ('evt-002', 'SteelForge Ltd', 'Rampur', 'industrial_usage_mld', 6.45, 'MLD', 4),
    ('evt-003', NULL, 'Rampur', 'groundwater_level_m', 18.80, 'm', 3),
    ('evt-004', 'PurePharm Solutions', 'Govindpuri', 'water_quality_index', 84.00, 'WQI', 2)
) AS data(external_event_id, company_name, area_name, metric_type, metric_value, unit, minutes_ago)
JOIN simulation_sources s ON s.source_key = 'simulation-panel-main'
LEFT JOIN companies c ON c.name = data.company_name
LEFT JOIN areas a ON a.name = data.area_name
ON CONFLICT DO NOTHING;

COMMIT;
