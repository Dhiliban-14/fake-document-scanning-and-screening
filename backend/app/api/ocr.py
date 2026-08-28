import io
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
import cv2
import numpy as np

router = APIRouter()

POSSIBLE_TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
    os.path.expanduser(r"~\AppData\Local\Tesseract-OCR\tesseract.exe"),
]

def get_tesseract_path():
    for p in POSSIBLE_TESSERACT_PATHS:
        if os.path.exists(p):
            return p
    return None

OCR_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "ocr_uploads"
OCR_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def preprocess_image_for_ocr(pil_img: Image.Image) -> Image.Image:
    """Preprocesses image using OpenCV thresholding & contrast scaling to maximize OCR accuracy."""
    cv_img = cv2.cvtColor(np.array(pil_img.convert("RGB")), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    
    # Scale contrast
    gray = cv2.equalizeHist(gray)
    
    # Apply Otsu binarization
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    return Image.fromarray(thresh)

@router.post("/ocr")
async def ocr_document(file: UploadFile = File(...)):
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported for OCR.")
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to open image: {e}")

    tess_path = get_tesseract_path()
    if tess_path:
        pytesseract.pytesseract.tesseract_cmd = tess_path

    # Try OCR on raw image first, then fallback to preprocessed thresholded image
    text = ""
    try:
        text = pytesseract.image_to_string(image, config="--psm 6")
        if len(text.strip()) < 10:
            preprocessed = preprocess_image_for_ocr(image)
            text = pytesseract.image_to_string(preprocessed, config="--psm 6")
    except Exception:
        preprocessed = preprocess_image_for_ocr(image)
        try:
            text = pytesseract.image_to_string(preprocessed)
        except Exception as e:
            text = f"[OCR Processing Warning]: {e}"

    # Save uploaded file
    uid = uuid.uuid4().hex
    ext = Path(file.filename or "file.jpg").suffix or ".jpg"
    saved_path = OCR_UPLOAD_DIR / f"{uid}{ext}"
    with open(saved_path, "wb") as out_f:
        out_f.write(contents)

    return JSONResponse(content={
        "filename": file.filename,
        "saved_path": str(saved_path),
        "extracted_text": text.strip()
    })
