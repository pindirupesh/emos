from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db, SessionLocal
from .models.db_models import User
from .routes import auth, meetings, chat
import shutil
from pathlib import Path

# Auto-create .env from .env.example if missing
backend_dir = Path(__file__).resolve().parent.parent
env_file = backend_dir / ".env"
example_file = backend_dir / ".env.example"
if not env_file.exists() and example_file.exists():
    shutil.copy(example_file, env_file)
    print("Created .env from .env.example - please add your FIREWORKS_API_KEY!")

# Create the FastAPI application
app = FastAPI(
    title="EMOS Backend API",
    description="Enterprise Memory Operating System - Backend",
    version="1.0.0"
)

# Allow the frontend (Next.js running on port 3000) to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all the route files (auth, meetings, chat)
app.include_router(auth.router)
app.include_router(meetings.router)
app.include_router(chat.router)

# When the server starts, initialize the database (create tables)
@app.on_event("startup")
def startup_event():
    init_db()
    print("Database initialized successfully!")
    # Create a default user if none exists (frontend hardcodes USER_ID=1)
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.id == 1).first():
            default_user = User(id=1, email="demo@emos.com", name="Demo User", password_hash="demo123")
            db.add(default_user)
            db.commit()
            print("Default user created (id=1, email=demo@emos.com)")
    finally:
        db.close()

# A simple test endpoint to check if the backend is running
@app.get("/")
def root():
    return {"message": "EMOS Backend is running!"}

# Health check endpoint for Docker
@app.get("/health")
def health():
    return {"status": "healthy"}