import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models
from .db import Base, engine, run_light_migrations
from .routers import macros, settings, tickets, users, webhooks

Base.metadata.create_all(bind=engine)
run_light_migrations()

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

app = FastAPI(title="Ticket System API")

default_origins = "http://localhost:5173,https://adamr-312.github.io"
allowed_origins = os.environ.get("ALLOWED_ORIGINS", default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.include_router(users.router)
app.include_router(tickets.router)
app.include_router(settings.router)
app.include_router(macros.router)
app.include_router(webhooks.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
