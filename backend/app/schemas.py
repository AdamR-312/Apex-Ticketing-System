from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from .models import Priority, Role, Status


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    role: Role = Role.user


class UserOut(UserBase):
    id: int
    role: Role

    model_config = ConfigDict(from_attributes=True)


class TicketBase(BaseModel):
    title: str
    description: str
    priority: Priority = Priority.medium


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    status: Optional[Status] = None
    priority: Optional[Priority] = None
    assigned_to_id: Optional[int] = None
    due_at: Optional[datetime] = None
    tags: Optional[List[str]] = None


class TicketOut(TicketBase):
    id: int
    status: Status
    created_by_id: int
    assigned_to_id: Optional[int]
    due_at: Optional[datetime]
    tags: List[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommentCreate(BaseModel):
    body: str
    is_internal: bool = False
    mentioned_user_ids: List[int] = []


class CommentOut(BaseModel):
    id: int
    ticket_id: int
    author_id: int
    body: str
    is_internal: bool
    mentioned_user_ids: List[int]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityOut(BaseModel):
    id: int
    ticket_id: int
    actor_id: int
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SettingsOut(BaseModel):
    site_name: str
    support_email: EmailStr
    default_priority: Priority

    model_config = ConfigDict(from_attributes=True)


class SettingsUpdate(BaseModel):
    site_name: Optional[str] = None
    support_email: Optional[EmailStr] = None
    default_priority: Optional[Priority] = None


class MacroCreate(BaseModel):
    title: str
    body: str


class MacroUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None


class MacroOut(BaseModel):
    id: int
    title: str
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
