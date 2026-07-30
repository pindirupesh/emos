from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models.db_models import User, Meeting, Commitment
from ..services.ai_service import extract_meeting_data
from ..services.commitment_service import update_overdue_status, get_blocked_commitments

router = APIRouter(prefix="/meetings", tags=["Meetings"])

# ---- Get User Profile ----
@router.get("/user/{user_id}")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    meeting_count = db.query(Meeting).filter(Meeting.user_id == user_id).count()
    commitment_count = db.query(Commitment).join(Meeting).filter(Meeting.user_id == user_id).count()
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "meeting_count": meeting_count,
        "commitment_count": commitment_count
    }

# ---- Delete a Meeting ----
@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Delete associated commitments first
    db.query(Commitment).filter(Commitment.meeting_id == meeting_id).delete()
    db.delete(meeting)
    db.commit()
    
    return {"message": "Meeting deleted successfully!"}

# ---- Toggle Commitment Status (Pending <-> Done) ----
@router.patch("/commitments/{commitment_id}/toggle")
def toggle_commitment(commitment_id: int, db: Session = Depends(get_db)):
    commitment = db.query(Commitment).filter(Commitment.id == commitment_id).first()
    if not commitment:
        raise HTTPException(status_code=404, detail="Commitment not found")
    
    if commitment.status == "Done":
        commitment.status = "Pending"
    elif commitment.status in ("Pending", "Overdue"):
        commitment.status = "Done"
    
    db.commit()
    return {"id": commitment.id, "status": commitment.status}

# ---- Upload a Meeting Transcript ----
@router.post("/upload")
async def upload_meeting(
    user_id: int = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 2. Read the uploaded file content
    content = await file.read()
    transcript_text = content.decode("utf-8")
    
    # 3. Call Fireworks AI to extract structured data
    structured_data = await extract_meeting_data(transcript_text)
    
    # 4. Extract the summary from the AI response
    summary = structured_data.get("summary", "No summary generated.")
    
    # 5. Save the meeting to the database
    meeting = Meeting(
        user_id=user_id,
        title=title,
        transcript_text=transcript_text,
        summary=summary,
        structured_data=structured_data
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    # 6. Save commitments from the AI output
    commitments_list = structured_data.get("commitments", [])
    for comm in commitments_list:
        deadline_str = comm.get("by_when", "")
        deadline = None
        if deadline_str and deadline_str != "No deadline specified":
            try:
                deadline = datetime.strptime(deadline_str, "%Y-%m-%d")
            except:
                deadline = None
        
        new_commitment = Commitment(
            meeting_id=meeting.id,
            task=comm.get("what", "Unnamed task"),
            owner=comm.get("who", "Unknown"),
            deadline=deadline,
            priority="Medium",
            status="Pending",
            dependencies=[]
        )
        db.add(new_commitment)
    
    db.commit()
    
    return {
        "meeting_id": meeting.id,
        "summary": summary,
        "structured_data": structured_data,
        "message": "Meeting uploaded and processed successfully!"
    }

# ---- Get All Commitments for a User ----
@router.get("/commitments/{user_id}")
def get_commitments(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update overdue status first
    update_overdue_status(db)
    
    # Find commitments from meetings owned by this user
    commitments = db.query(Commitment).join(Meeting).filter(Meeting.user_id == user_id).all()
    
    result = []
    for c in commitments:
        meeting = db.query(Meeting).filter(Meeting.id == c.meeting_id).first()
        result.append({
            "id": c.id,
            "task": c.task,
            "owner": c.owner,
            "deadline": c.deadline.isoformat() if c.deadline else None,
            "status": c.status,
            "priority": c.priority,
            "meeting_title": meeting.title if meeting else "Unknown",
            "dependencies": c.dependencies
        })
    
    return result

# ---- Get Full Meeting Detail (commitments, decisions, risks, etc.) ----
@router.get("/{meeting_id}/detail")
def get_meeting_detail(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    commitments = db.query(Commitment).filter(Commitment.meeting_id == meeting_id).all()
    
    structured = meeting.structured_data or {}
    
    return {
        "id": meeting.id,
        "title": meeting.title,
        "summary": meeting.summary or "",
        "meeting_date": meeting.meeting_date.isoformat() if meeting.meeting_date else None,
        "created_at": meeting.created_at.isoformat() if meeting.created_at else None,
        "decisions": structured.get("decisions", []),
        "action_items": structured.get("action_items", []),
        "risks": structured.get("risks", []),
        "dependencies": structured.get("dependencies", []),
        "questions": structured.get("questions", []),
        "commitments": [
            {
                "id": c.id,
                "task": c.task,
                "owner": c.owner,
                "deadline": c.deadline.isoformat() if c.deadline else None,
                "status": c.status,
                "priority": c.priority,
            }
            for c in commitments
        ],
    }


# ---- Get Blocked Tasks for a User ----
@router.get("/blocked/{user_id}")
def get_blocked_tasks(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_overdue_status(db)
    blocked = get_blocked_commitments(db)
    
    # Filter to only blocked tasks owned by this user
    user_blocked = [b for b in blocked if user.name.lower() in b.get("blocked_owner", "").lower()]
    
    return user_blocked


# ---- Get All Meetings for a User (full list, not just last 5) ----
@router.get("/list/{user_id}")
def get_all_meetings(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    meetings = db.query(Meeting).filter(Meeting.user_id == user_id).order_by(Meeting.meeting_date.desc()).all()
    
    result = []
    for m in meetings:
        commitment_count = db.query(Commitment).filter(Commitment.meeting_id == m.id).count()
        structured = m.structured_data or {}
        result.append({
            "id": m.id,
            "title": m.title,
            "summary": m.summary or "",
            "meeting_date": m.meeting_date.isoformat() if m.meeting_date else None,
            "commitment_count": commitment_count,
            "decisions_count": len(structured.get("decisions", [])),
        })
    
    return result


# ---- Full Dashboard Data for a User ----
@router.get("/dashboard/{user_id}")
def get_dashboard(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update overdue status
    update_overdue_status(db)
    
    # Get all commitments from meetings owned by this user
    all_commits = db.query(Commitment).join(Meeting).filter(Meeting.user_id == user_id).all()
    
    pending = [c for c in all_commits if c.status == "Pending"]
    overdue = [c for c in all_commits if c.status == "Overdue"]
    done = [c for c in all_commits if c.status == "Done"]
    
    # Get recent meetings (last 5)
    recent_meetings = db.query(Meeting).filter(Meeting.user_id == user_id).order_by(Meeting.meeting_date.desc()).limit(5).all()
    
    # Get blocked tasks
    blocked = get_blocked_commitments(db)
    user_blocked = [b for b in blocked if user.name.lower() in b.get("blocked_owner", "").lower()]
    
    return {
        "user_name": user.name,
        "stats": {
            "pending": len(pending),
            "overdue": len(overdue),
            "done": len(done),
            "total": len(all_commits)
        },
        "pending_commitments": [
            {"id": c.id, "task": c.task, "deadline": c.deadline.isoformat() if c.deadline else None}
            for c in pending[:5]
        ],
        "overdue_commitments": [
            {"id": c.id, "task": c.task, "deadline": c.deadline.isoformat() if c.deadline else None}
            for c in overdue
        ],
        "blocked_tasks": user_blocked[:5],
        "recent_meetings": [
            {"id": m.id, "title": m.title, "summary": m.summary or "", "meeting_date": m.meeting_date.isoformat()}
            for m in recent_meetings
        ]
    }