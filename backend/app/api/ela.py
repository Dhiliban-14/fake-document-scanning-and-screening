import io
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image, ImageChops, ImageEnhance
import numpy as np
import cv2

router = APIRouter()

def compute_ela(image: Image.Image, quality: int = 90, scale: int = 15) -> Image.Image:
    """Computes Error Level Analysis (ELA) map for an image.
    Resaves image at target JPEG quality, calculates difference, scales contrast,
    and applies a false-color heatmap.
    """
    # 1. Resave at specified JPEG quality level in memory
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)
    resaved = Image.open(buffer).convert("RGB")

    # 2. Compute absolute difference between original and resaved
    diff = ImageChops.difference(image.convert("RGB"), resaved)

    # 3. Scale difference contrast
    extrema = diff.getextrema()
    max_diff = max([ex[1] for ex in extrema]) or 1
    scale_factor = 255.0 / max_diff if max_diff > 0 else scale
    
    enhancer = ImageEnhance.Brightness(diff)
    ela_img = enhancer.enhance(scale_factor * (scale / 10.0))

    # 4. Apply OpenCV JET heatmap color map for visual clarity
    ela_np = np.array(ela_img)
    gray = cv2.cvtColor(ela_np, cv2.COLOR_RGB2GRAY)
    heatmap = cv2.applyColorMap(gray, cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

    return Image.fromarray(heatmap_rgb)

@router.post("/ela")
async def generate_ela_heatmap(file: UploadFile = File(...)):
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported for ELA.")
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to open image: {e}")

    # Compute ELA heatmap
    ela_result = compute_ela(img, quality=90, scale=15)

    # Output as PNG stream
    out_buffer = io.BytesIO()
    ela_result.save(out_buffer, format="PNG")
    out_buffer.seek(0)
    return StreamingResponse(out_buffer, media_type="image/png")
