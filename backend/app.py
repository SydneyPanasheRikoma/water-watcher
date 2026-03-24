from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from db import init_pool
from routes.public import public_bp
from routes.simulation import simulation_bp


def create_app() -> Flask:
  config = Config()
  app = Flask(__name__)

  CORS(
    app,
    resources={r"/api/*": {"origins": config.cors_origins if config.cors_origins else "*"}},
  )

  init_pool(config.database_url)

  app.register_blueprint(public_bp)
  app.register_blueprint(simulation_bp)

  @app.get("/")
  def index():
    return jsonify(
      {
        "service": "water-watcher-backend",
        "status": "running",
        "endpoints": [
          "/api/health",
          "/api/dashboard",
          "/api/companies",
          "/api/companies/<id>",
          "/api/community",
          "/api/simulation/readings",
          "/api/simulation/readings/bulk",
        ],
      }
    )

  @app.errorhandler(404)
  def not_found(_):
    return jsonify({"error": "Not found"}), 404

  @app.errorhandler(500)
  def server_error(_):
    return jsonify({"error": "Internal server error"}), 500

  return app


if __name__ == "__main__":
  config = Config()
  app = create_app()
  app.run(host=config.host, port=config.port, debug=config.debug, use_reloader=False)
