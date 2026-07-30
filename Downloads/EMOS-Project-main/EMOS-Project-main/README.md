# EMOS – Enterprise Memory Operating System

## What is EMOS?

EMOS is an AI-powered organizational memory platform that transforms meetings into actionable, searchable, and continuously evolving knowledge.

Instead of just summarizing meetings, EMOS **remembers every decision, every commitment, every task, and every discussion** – allowing organizations to retrieve and act on information long after the meeting has ended.

## Key Features

- **Daily AI Brief** – Start your day with a snapshot of pending tasks, overdue commitments, and recent meetings
- **Meeting Workspace** – Upload transcripts and get AI-generated summaries, commitments, decisions, and risks instantly
- **Commitment Engine** – Track every promise made in meetings with status toggling (Pending / Done / Overdue)
- **Accountability Dashboard** – Donut & bar charts, blocked tasks, and overdue tracking
- **AI Chat** – Ask natural language questions about your meetings and get answers from your meeting history
- **Dark Mode** – Full dark/light theme toggle with smooth transitions
- **Auth System** – Login and signup with persistent sessions

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI, SQLAlchemy, SQLite
- **AI**: Fireworks AI (GLM-5P1 model)
- **Design**: Levels Design System (Inter + JetBrains Mono)

## Prerequisites

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- A [Fireworks AI](https://fireworks.ai) account and API key

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SaiArnav/EMOS-Project.git
cd EMOS-Project
```

### 2. Backend Setup

Open a terminal and run:

```bash
cd backend
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` folder:

```
FIREWORKS_API_KEY=your_fireworks_api_key_here
FIREWORKS_MODEL=accounts/fireworks/models/glm-5p1
DATABASE_URL=sqlite:///./emos.db
```

Replace `your_fireworks_api_key_here` with your actual key from [fireworks.ai](https://fireworks.ai).

Start the backend server:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Wait until you see:

```
Database initialized successfully!
Uvicorn running on http://127.0.0.1:8000
```

Keep this terminal running.

### 3. Frontend Setup

Open a **second terminal** and run:

```bash
cd frontend
```

Install Node dependencies:

```bash
npm install
```

Start the frontend dev server:

```bash
npm run dev
```

Wait until you see:

```
Ready on http://localhost:3000
```

### 4. Open the App

Go to [http://localhost:3000](http://localhost:3000) in your browser.

**Sign up** with any name, email, and password. Or use the demo account:

- Email: `demo@emos.com`
- Password: `demo123`

### 5. Upload a Meeting

1. Go to **Workspace** from the top navigation
2. Enter a meeting title (e.g., "Sprint Planning")
3. Select a `.txt` file with your meeting transcript
4. Click **Upload**
5. Wait for the AI to process (10-30 seconds)

### 6. Check the Dashboard

Go to **Dashboard** from the top navigation. You will see:

- Greeting with your name
- Donut and bar charts showing task breakdown
- Stat cards (Total, Pending, Overdue, Done)
- Pending and overdue task lists with toggle buttons
- Recent meetings list

## How It Works

1. **Upload** a meeting transcript (`.txt` file)
2. **AI extracts** commitments, decisions, risks, action items, and dependencies
3. **Dashboard** shows your task overview with charts and stats
4. **Workspace** lets you expand each meeting to see full details
5. **Toggle tasks** as Done by clicking the circle icon next to any commitment
6. **Overdue detection** happens automatically when deadlines pass
7. **AI Chat** answers questions about your meeting history

## Project Structure

```
EMOS-Project/
  backend/
    app/
      main.py              # FastAPI app entry point
      database.py           # SQLAlchemy setup (SQLite)
      models/db_models.py   # User, Meeting, Commitment models
      routes/
        auth.py             # Login and signup endpoints
        meetings.py         # Upload, dashboard, meeting detail endpoints
        chat.py             # AI chat endpoint
      services/
        ai_service.py       # Fireworks AI integration
        commitment_service.py  # Overdue detection, blocked tasks
        prompts.py          # AI extraction prompt
    requirements.txt
    .env                    # Your API key (not in git)
  frontend/
    app/
      layout.tsx            # Nav bar, theme toggle, auth provider
      globals.css           # Design tokens, dark/light theme, animations
      page.tsx              # Root redirect
      login/page.tsx        # Login and signup form
      dashboard/page.tsx    # Charts, stats, task lists
      workspace/page.tsx    # Upload, meeting list, expandable detail
      chat/page.tsx         # AI chat interface
      contexts/AuthContext.tsx  # Auth state management
    package.json
```
