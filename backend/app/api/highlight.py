from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image, ImageDraw
import io

router = APIRouter()

@router.post("/highlight")
async def highlight_image(
    file: UploadFile = File(...),
    x: int = 0,
    y: int = 0,
    width: int = 0,
    height: int = 0,
):
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported.")
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to open image: {e}")

    # Clip coordinates safely within image bounds
    if img.width > 0 and img.height > 0 and width > 0 and height > 0:
        clamp_x = max(0, min(x, img.width - 1))
        clamp_y = max(0, min(y, img.height - 1))
        clamp_x2 = max(clamp_x + 1, min(img.width, clamp_x + width))
        clamp_y2 = max(clamp_y + 1, min(img.height, clamp_y + height))

        draw = ImageDraw.Draw(img)
        draw.rectangle([clamp_x, clamp_y, clamp_x2, clamp_y2], outline="red", width=4)

    # Return image as PNG stream
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="image/png")
