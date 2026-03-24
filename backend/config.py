import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
  database_url: str = os.getenv(
    "DATABASE_URL",
    "postgresql://waterwatcher:waterwatcher@localhost:5432/waterwatcher",
  )
  cors_origins: list[str] = field(
    default_factory=lambda: [
      origin.strip()
      for origin in os.getenv("CORS_ORIGINS", "*").split(",")
      if origin.strip()
    ]
  )
  host: str = os.getenv("FLASK_HOST", "0.0.0.0")
  port: int = int(os.getenv("FLASK_PORT", "5000"))
  debug: bool = os.getenv("FLASK_ENV", "development") == "development"
