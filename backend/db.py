from contextlib import contextmanager
from typing import Generator
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor

_pool: SimpleConnectionPool | None = None


def init_pool(database_url: str) -> None:
  global _pool
  if _pool is None:
    _pool = SimpleConnectionPool(
      minconn=1,
      maxconn=10,
      dsn=database_url,
      cursor_factory=RealDictCursor,
    )


def close_pool() -> None:
  global _pool
  if _pool is not None:
    _pool.closeall()
    _pool = None


@contextmanager
def get_conn() -> Generator:
  if _pool is None:
    raise RuntimeError("Database pool not initialized")

  conn = _pool.getconn()
  try:
    yield conn
  finally:
    _pool.putconn(conn)
