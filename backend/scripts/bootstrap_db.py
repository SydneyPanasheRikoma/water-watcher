import os
from pathlib import Path

import psycopg2

SEED_VERSION = "v1"


def run_sql_file(cursor, path: Path) -> None:
  sql = path.read_text(encoding="utf-8")
  cursor.execute(sql)


def main() -> None:
  database_url = os.getenv("DATABASE_URL")
  if not database_url:
    raise RuntimeError("DATABASE_URL is required")

  repo_root = Path(__file__).resolve().parents[2]
  schema_file = repo_root / "database" / "init" / "001_schema.sql"
  seed_file = repo_root / "database" / "init" / "002_seed.sql"

  if not schema_file.exists() or not seed_file.exists():
    raise FileNotFoundError("Schema/seed SQL files not found in database/init")

  with psycopg2.connect(database_url) as conn:
    conn.autocommit = True
    with conn.cursor() as cursor:
      cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS app_bootstrap_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
      )

      cursor.execute(
        "SELECT value FROM app_bootstrap_meta WHERE key = 'db_seed_version' LIMIT 1"
      )
      row = cursor.fetchone()
      if row and row[0] == SEED_VERSION:
        print("Database already bootstrapped; skipping schema/seed.")
        return

      print("Applying schema...")
      run_sql_file(cursor, schema_file)

      print("Applying seed data...")
      run_sql_file(cursor, seed_file)

      cursor.execute(
        """
        INSERT INTO app_bootstrap_meta (key, value)
        VALUES ('db_seed_version', %s)
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        """,
        (SEED_VERSION,),
      )

      print("Database bootstrap complete.")


if __name__ == "__main__":
  main()
