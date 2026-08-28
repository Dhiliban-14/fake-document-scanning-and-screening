from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter()

# Directory where uploaded files are stored (same as used in upload endpoint)
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"

@router.get("/files/{filename}")
async def get_uploaded_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=file_path, media_type="application/octet-stream")
