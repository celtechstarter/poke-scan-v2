
from .config import create_app
from .routes import register_routes

app = create_app()
register_routes(app)

