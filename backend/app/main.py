from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .db import Base, engine
from .routers import tickets, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ticket System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(tickets.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
