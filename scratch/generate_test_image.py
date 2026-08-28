from PIL import Image, ImageDraw, ImageFont
import pathlib

# Create a white 200x100 image
img = Image.new('RGB', (200, 100), color='white')
draw = ImageDraw.Draw(img)
# Use default font
text = "Hello"
bbox = draw.textbbox((0, 0), text)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
# Center text
x = (200 - text_width) // 2
y = (100 - text_height) // 2
draw.text((x, y), text, fill='black')
# Save to file
out_path = pathlib.Path(r"C:/Users/dhili/.gemini/antigravity/brain/a0e392cc-077f-48bd-b46a-61af7bf66e83/scratch/identity_fraud_engine/scratch/hello.png")
out_path.parent.mkdir(parents=True, exist_ok=True)
img.save(out_path)
print(f"Saved test image to {out_path}")
