from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime
import random
import os
import json

router = APIRouter()

CASES_DB: Dict[str, Dict[str, Any]] = {}

class CreateCaseRequest(BaseModel):
    title: str
    documents: List[str]
    risk_score: int
    risk_level: str
    risk_breakdown: List[Dict[str, Any]]
    notes: Optional[str] = ""
    assigned_investigator: Optional[str] = "Senior Forensic Examiner"

class UpdateStatusRequest(BaseModel):
    status: str
    investigator_note: Optional[str] = ""

class UpdateNotesRequest(BaseModel):
    notes: str

def generate_case_id() -> str:
    year = datetime.now().year
    suffix = random.randint(1000, 9999)
    return f"CASE-{year}-{suffix}"

@router.post("/cases/create")
async def create_case(req: CreateCaseRequest):
    case_id = generate_case_id()
    while case_id in CASES_DB:
        case_id = generate_case_id()

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    case_obj = {
        "case_id": case_id,
        "title": req.title,
        "created_at": now_str,
        "assigned_investigator": req.assigned_investigator,
        "status": "OPEN_INVESTIGATION",
        "risk_score": req.risk_score,
        "risk_level": req.risk_level,
        "risk_breakdown": req.risk_breakdown,
        "notes": req.notes or "Initial document acquisition logged.",
        "documents": req.documents,
        "audit_trail": [
            {
                "timestamp": now_str,
                "action": "Case opened with initial forensic screening.",
                "performed_by": req.assigned_investigator or "System"
            }
        ]
    }

    CASES_DB[case_id] = case_obj
    return JSONResponse(content=case_obj)

@router.get("/cases")
async def list_cases():
    return JSONResponse(content=list(CASES_DB.values()))

@router.get("/cases/{case_id}")
async def get_case(case_id: str):
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found.")
    return JSONResponse(content=CASES_DB[case_id])

@router.patch("/cases/{case_id}/status")
async def update_case_status(case_id: str, req: UpdateStatusRequest):
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found.")
    
    valid_statuses = [
        "OPEN_INVESTIGATION",
        "UNDER_REVIEW",
        "EVIDENCE_FLAGGED",
        "VERIFIED_AUTHENTIC",
        "SUSPECTED_FRAUD_ESCALATED",
        "CLOSED_RESOLVED"
    ]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    case = CASES_DB[case_id]
    old_status = case["status"]
    case["status"] = req.status
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    action_msg = f"Status updated from {old_status} to {req.status}."
    if req.investigator_note:
        action_msg += f" Note: {req.investigator_note}"

    case["audit_trail"].insert(0, {
        "timestamp": now_str,
        "action": action_msg,
        "performed_by": case["assigned_investigator"]
    })

    return JSONResponse(content=case)

@router.patch("/cases/{case_id}/notes")
async def update_case_notes(case_id: str, req: UpdateNotesRequest):
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found.")

    case = CASES_DB[case_id]
    case["notes"] = req.notes
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    case["audit_trail"].insert(0, {
        "timestamp": now_str,
        "action": "Investigator notes updated.",
        "performed_by": case["assigned_investigator"]
    })

    return JSONResponse(content=case)
