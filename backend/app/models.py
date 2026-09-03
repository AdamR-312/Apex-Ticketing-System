import enum
from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .db import Base


class Role(str, enum.Enum):
    user = "user"
    agent = "agent"
    admin = "admin"


class Status(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(Role), default=Role.user, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    tickets_created = relationship(
        "Ticket", back_populates="creator", foreign_keys="Ticket.created_by_id"
    )
    tickets_assigned = relationship(
        "Ticket", back_populates="assignee", foreign_keys="Ticket.assigned_to_id"
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(Status), default=Status.open, nullable=False)
    priority = Column(Enum(Priority), default=Priority.medium, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_at = Column(DateTime, nullable=True)
    tags = Column(JSON, nullable=False, default=list)
    watcher_ids = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship(
        "User", back_populates="tickets_created", foreign_keys=[created_by_id]
    )
    assignee = relationship(
        "User", back_populates="tickets_assigned", foreign_keys=[assigned_to_id]
    )
    comments = relationship(
        "Comment", back_populates="ticket", cascade="all, delete-orphan"
    )
    activity = relationship(
        "TicketActivity", back_populates="ticket", cascade="all, delete-orphan"
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    is_internal = Column(Boolean, nullable=False, default=False)
    mentioned_user_ids = Column(JSON, nullable=False, default=list)
    attachment_url = Column(String, nullable=True)
    attachment_name = Column(String, nullable=True)
    emailed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="comments")
    author = relationship("User")


class TicketActivity(Base):
    __tablename__ = "ticket_activity"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="activity")
    actor = relationship("User")


class AppSettings(Base):
    __tablename__ = "app_settings"

    # Single-row table (id is always 1) — there's only ever one site config.
    id = Column(Integer, primary_key=True)
    site_name = Column(String, nullable=False, default="Apex Ticketing")
    support_email = Column(String, nullable=False, default="support@example.com")
    default_priority = Column(Enum(Priority), default=Priority.medium, nullable=False)


class Macro(Base):
    __tablename__ = "macros"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
