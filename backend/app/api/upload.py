from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import uuid
from pathlib import Path

router = APIRouter()

# Define upload directory relative to this file
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    # Simple validation
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    # Save with a safe unique name preserving extension
    suffix = Path(file.filename).suffix.lower()
    safe_name = f"{uuid.uuid4().hex}{suffix}"
    file_path = UPLOAD_DIR / safe_name
    try:
        with open(file_path, "wb") as out_file:
            content = await file.read()
            out_file.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"filename": safe_name, "saved_path": str(file_path)}
