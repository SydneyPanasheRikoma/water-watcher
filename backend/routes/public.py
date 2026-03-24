from datetime import datetime, timezone
from flask import Blueprint, jsonify
from db import get_conn

public_bp = Blueprint("public", __name__)


def _to_company_payload(row: dict, history: list[dict] | None = None) -> dict:
  return {
    "id": str(row["id"]),
    "name": row["name"],
    "industry": row["industry"],
    "dailyUsageMLD": float(row.get("daily_usage_mld") or 0),
    "score": int(row.get("score") or 0),
    "alerts": int(row.get("alerts_count") or 0),
    "violations": int(row.get("violations_count") or 0),
    "credits": int(row.get("credits") or 0),
    "status": row["status"],
    "lat": float(row["lat"] or 0),
    "lng": float(row["lng"] or 0),
    "history": history or [],
  }


def _get_latest_company_rows(cur) -> list[dict]:
  cur.execute(
    """
    SELECT c.id,
           c.name,
           c.industry,
           c.status,
           c.lat,
           c.lng,
           m.daily_usage_mld,
           m.score,
           m.alerts_count,
           m.violations_count,
           m.credits
    FROM companies c
    LEFT JOIN LATERAL (
      SELECT m.daily_usage_mld,
             m.score,
             m.alerts_count,
             m.violations_count,
             m.credits
      FROM company_metrics_daily m
      WHERE m.company_id = c.id
      ORDER BY m.metric_date DESC
      LIMIT 1
    ) m ON TRUE
    WHERE c.is_active = TRUE
    ORDER BY c.name ASC
    """
  )
  return cur.fetchall()


@public_bp.get("/api/health")
def health():
  return jsonify({"status": "ok", "service": "water-watcher-backend"})


@public_bp.get("/api/companies")
def companies():
  with get_conn() as conn:
    with conn.cursor() as cur:
      rows = _get_latest_company_rows(cur)
      payload = [_to_company_payload(row) for row in rows]
      return jsonify(payload)


@public_bp.get("/api/companies/<company_id>")
def company_by_id(company_id: str):
  with get_conn() as conn:
    with conn.cursor() as cur:
      cur.execute(
        """
        SELECT c.id,
               c.name,
               c.industry,
               c.status,
               c.lat,
               c.lng,
               m.daily_usage_mld,
               m.score,
               m.alerts_count,
               m.violations_count,
               m.credits
        FROM companies c
        LEFT JOIN LATERAL (
          SELECT m.daily_usage_mld,
                 m.score,
                 m.alerts_count,
                 m.violations_count,
                 m.credits
          FROM company_metrics_daily m
          WHERE m.company_id = c.id
          ORDER BY m.metric_date DESC
          LIMIT 1
        ) m ON TRUE
        WHERE c.id = %s
        LIMIT 1
        """,
        (company_id,),
      )
      row = cur.fetchone()
      if not row:
        return jsonify(None), 404

      cur.execute(
        """
        SELECT TO_CHAR(DATE_TRUNC('month', m.metric_date), 'Mon') AS month,
               ROUND(AVG(m.daily_usage_mld)::numeric, 2) AS usage
        FROM company_metrics_daily m
        WHERE m.company_id = %s
          AND m.metric_date >= (CURRENT_DATE - INTERVAL '12 months')
        GROUP BY DATE_TRUNC('month', m.metric_date)
        ORDER BY DATE_TRUNC('month', m.metric_date)
        """,
        (company_id,),
      )
      history_rows = cur.fetchall()
      history = [
        {
          "month": h["month"].strip(),
          "usage": float(h["usage"]),
        }
        for h in history_rows
      ]

      payload = _to_company_payload(row, history)
      return jsonify(payload)


@public_bp.get("/api/community")
def community_snapshot():
  with get_conn() as conn:
    with conn.cursor() as cur:
      cur.execute(
        """
        SELECT a.id,
               a.name,
               a.lat,
               a.lng,
               COALESCE(m.population, 0) AS population,
               COALESCE(m.groundwater_level_m, 0) AS groundwater_level_m,
               COALESCE(m.trend, 'stable') AS trend,
               COALESCE(m.status, 'safe') AS status
        FROM areas a
        LEFT JOIN LATERAL (
          SELECT m.population,
                 m.groundwater_level_m,
                 m.trend,
                 m.status
          FROM area_metrics_daily m
          WHERE m.area_id = a.id
          ORDER BY m.metric_date DESC
          LIMIT 1
        ) m ON TRUE
        WHERE a.area_type = 'village'
        ORDER BY a.name ASC
        """
      )
      villages_rows = cur.fetchall()
      villages = [
        {
          "id": str(v["id"]),
          "name": v["name"],
          "population": int(v["population"]),
          "groundwaterLevel": float(v["groundwater_level_m"]),
          "trend": v["trend"],
          "status": v["status"],
          "lat": float(v["lat"] or 0),
          "lng": float(v["lng"] or 0),
        }
        for v in villages_rows
      ]

      companies_rows = _get_latest_company_rows(cur)
      companies = [_to_company_payload(row) for row in companies_rows]

      return jsonify({"villages": villages, "companies": companies})


@public_bp.get("/api/dashboard")
def dashboard_snapshot():
  with get_conn() as conn:
    with conn.cursor() as cur:
      cur.execute(
        """
        SELECT
          COALESCE(SUM(m.daily_usage_mld), 0) AS extracted_today,
          COALESCE(AVG(am.groundwater_level_m), 0) AS groundwater_avg,
          COUNT(DISTINCT c.id) AS active_companies,
          COALESCE(SUM(CASE WHEN a.type IN ('warning', 'critical') AND a.resolved_at IS NULL THEN 1 ELSE 0 END), 0) AS alerts_count,
          COALESCE(AVG(m.score), 0) AS avg_score
        FROM companies c
        LEFT JOIN LATERAL (
          SELECT m.daily_usage_mld,
                 m.score
          FROM company_metrics_daily m
          WHERE m.company_id = c.id
          ORDER BY m.metric_date DESC
          LIMIT 1
        ) m ON TRUE
        LEFT JOIN LATERAL (
          SELECT am.groundwater_level_m
          FROM area_metrics_daily am
          WHERE am.area_id = c.area_id
          ORDER BY am.metric_date DESC
          LIMIT 1
        ) am ON TRUE
        LEFT JOIN alerts a ON a.company_id = c.id
        WHERE c.is_active = TRUE
        """
      )
      stats_row = cur.fetchone()

      extracted_today = float(stats_row["extracted_today"] or 0)
      groundwater_avg = float(stats_row["groundwater_avg"] or 0)
      active_companies = int(stats_row["active_companies"] or 0)
      alerts_count = int(stats_row["alerts_count"] or 0)
      avg_score = float(stats_row["avg_score"] or 0)

      groundwater_component = max(0.0, min(100.0, 100.0 - (groundwater_avg * 4.0)))
      wqi = round(max(0.0, min(100.0, (avg_score * 0.7) + (groundwater_component * 0.3))), 1)

      cur.execute(
        """
        SELECT a.id,
               a.type,
               a.message,
               c.name AS company,
               a.event_at
        FROM alerts a
        LEFT JOIN companies c ON c.id = a.company_id
        ORDER BY a.event_at DESC
        LIMIT 10
        """
      )
      alert_rows = cur.fetchall()
      alerts = [
        {
          "id": str(a["id"]),
          "type": a["type"],
          "message": a["message"],
          "company": a["company"],
          "timestamp": a["event_at"].isoformat() if a["event_at"] else datetime.now(timezone.utc).isoformat(),
        }
        for a in alert_rows
      ]

      cur.execute(
        """
        WITH month_buckets AS (
          SELECT DATE_TRUNC('month', CURRENT_DATE) - (INTERVAL '1 month' * g.i) AS bucket
          FROM GENERATE_SERIES(11, 0, -1) AS g(i)
        ),
        industrial AS (
          SELECT DATE_TRUNC('month', metric_date) AS bucket,
                 SUM(daily_usage_mld) AS industrial
          FROM company_metrics_daily
          GROUP BY 1
        ),
        groundwater AS (
          SELECT DATE_TRUNC('month', metric_date) AS bucket,
                 AVG(groundwater_level_m) AS groundwater
          FROM area_metrics_daily
          GROUP BY 1
        ),
        recharge AS (
          SELECT DATE_TRUNC('month', recorded_at) AS bucket,
                 AVG(metric_value) AS natural
          FROM simulation_readings
          WHERE metric_type = 'natural_recharge_mld'
          GROUP BY 1
        )
        SELECT TO_CHAR(m.bucket, 'Mon') AS month,
               COALESCE(i.industrial, 0) AS industrial,
               COALESCE(r.natural, COALESCE(i.industrial, 0) * 1.15) AS natural,
               COALESCE(g.groundwater, 0) AS groundwater
        FROM month_buckets m
        LEFT JOIN industrial i ON i.bucket = m.bucket
        LEFT JOIN groundwater g ON g.bucket = m.bucket
        LEFT JOIN recharge r ON r.bucket = m.bucket
        ORDER BY m.bucket
        """
      )
      trend_rows = cur.fetchall()
      trend_data = [
        {
          "month": t["month"].strip(),
          "industrial": round(float(t["industrial"] or 0), 2),
          "natural": round(float(t["natural"] or 0), 2),
          "groundwater": round(float(t["groundwater"] or 0), 2),
        }
        for t in trend_rows
      ]

      companies_rows = _get_latest_company_rows(cur)
      companies = [_to_company_payload(row) for row in companies_rows]

      return jsonify(
        {
          "wqi": wqi,
          "stats": {
            "extractedToday": round(extracted_today, 2),
            "groundwaterAvg": round(groundwater_avg, 2),
            "activeCompanies": active_companies,
            "alertsCount": alerts_count,
          },
          "alerts": alerts,
          "trendData": trend_data,
          "companies": companies,
        }
      )
