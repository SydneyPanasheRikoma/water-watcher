from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from psycopg2 import IntegrityError
from db import get_conn

simulation_bp = Blueprint("simulation", __name__)

ALLOWED_METRICS = {
  "industrial_usage_mld",
  "natural_recharge_mld",
  "groundwater_level_m",
  "water_quality_index",
  "pressure_psi",
  "flow_rate_lps",
}


def _parse_recorded_at(value: str | None) -> datetime:
  if not value:
    return datetime.now(timezone.utc)

  try:
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)
  except ValueError as error:
    raise ValueError("recordedAt must be valid ISO-8601") from error


def _resolve_source_id(cur, source_key: str) -> int:
  cur.execute(
    """
    INSERT INTO simulation_sources (source_key, name, description, last_seen_at)
    VALUES (%s, %s, %s, NOW())
    ON CONFLICT (source_key)
    DO UPDATE SET last_seen_at = NOW()
    RETURNING id
    """,
    (source_key, source_key, "Auto-created simulation feed source"),
  )
  row = cur.fetchone()
  return int(row["id"])


def _resolve_entity_id(cur, table: str, entity_id, entity_name) -> int | None:
  if entity_id is not None:
    return int(entity_id)

  if entity_name:
    cur.execute(f"SELECT id FROM {table} WHERE name = %s LIMIT 1", (entity_name,))
    row = cur.fetchone()
    return int(row["id"]) if row else None

  return None


def _validate_event(event: dict) -> tuple[bool, str | None]:
  required = ["sourceKey", "metricType", "metricValue", "unit"]
  missing = [field for field in required if field not in event]
  if missing:
    return False, f"Missing required fields: {', '.join(missing)}"

  if event["metricType"] not in ALLOWED_METRICS:
    return False, f"metricType must be one of: {', '.join(sorted(ALLOWED_METRICS))}"

  return True, None


def _insert_reading(cur, event: dict) -> dict:
  source_id = _resolve_source_id(cur, event["sourceKey"])
  company_id = _resolve_entity_id(cur, "companies", event.get("companyId"), event.get("companyName"))
  area_id = _resolve_entity_id(cur, "areas", event.get("areaId"), event.get("areaName"))
  recorded_at = _parse_recorded_at(event.get("recordedAt"))

  cur.execute(
    """
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
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (source_id, external_event_id)
    WHERE external_event_id IS NOT NULL
    DO NOTHING
    RETURNING id, ingested_at
    """,
    (
      source_id,
      event.get("externalEventId"),
      company_id,
      area_id,
      event["metricType"],
      float(event["metricValue"]),
      event["unit"],
      recorded_at,
      event.get("payload"),
    ),
  )

  inserted = cur.fetchone()
  if inserted:
    return {
      "id": int(inserted["id"]),
      "status": "inserted",
      "ingestedAt": inserted["ingested_at"].isoformat(),
    }

  return {
    "id": None,
    "status": "duplicate",
    "ingestedAt": datetime.now(timezone.utc).isoformat(),
  }


@simulation_bp.post("/api/simulation/readings")
def ingest_simulation_reading():
  payload = request.get_json(silent=True) or {}
  is_valid, error_message = _validate_event(payload)
  if not is_valid:
    return jsonify({"error": error_message}), 400

  try:
    with get_conn() as conn:
      with conn.cursor() as cur:
        result = _insert_reading(cur, payload)
        conn.commit()
        return jsonify(result), 201 if result["status"] == "inserted" else 200
  except ValueError as error:
    return jsonify({"error": str(error)}), 400
  except IntegrityError as error:
    return jsonify({"error": f"integrity-error: {str(error)}"}), 409


@simulation_bp.post("/api/simulation/readings/bulk")
def ingest_simulation_readings_bulk():
  payload = request.get_json(silent=True) or {}
  events = payload.get("events", [])

  if not isinstance(events, list) or len(events) == 0:
    return jsonify({"error": "events must be a non-empty array"}), 400

  results = []
  inserted_count = 0
  duplicate_count = 0

  try:
    with get_conn() as conn:
      with conn.cursor() as cur:
        for index, event in enumerate(events):
          is_valid, error_message = _validate_event(event)
          if not is_valid:
            conn.rollback()
            return jsonify({"error": f"events[{index}]: {error_message}"}), 400

          result = _insert_reading(cur, event)
          results.append(result)
          if result["status"] == "inserted":
            inserted_count += 1
          else:
            duplicate_count += 1

        conn.commit()

    return jsonify(
      {
        "inserted": inserted_count,
        "duplicates": duplicate_count,
        "total": len(events),
        "results": results,
      }
    ), 201
  except ValueError as error:
    return jsonify({"error": str(error)}), 400
  except IntegrityError as error:
    return jsonify({"error": f"integrity-error: {str(error)}"}), 409
