# Ticket System

A helpdesk-style support ticket system. Users submit tickets; agents track status, priority, and assignment.

## Stack
- **Backend:** FastAPI + SQLAlchemy + SQLite (dev)
- **Frontend:** React + Vite

## Backend setup
```
cd backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\python -m uvicorn app.main:app --reload
```
API runs at http://127.0.0.1:8000, docs at `/docs`.

## Frontend setup
```
cd frontend
npm install
npm run dev
```
App runs at http://127.0.0.1:5173.

## Roadmap
- [x] Scaffold backend + frontend, basic ticket create/list
- [ ] Auth (register/login, JWT, role-based access)
- [ ] Full ticket CRUD (status/assignee updates from the UI)
- [ ] Comments on tickets
- [ ] Filtering/search, dashboard, deployment
