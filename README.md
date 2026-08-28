# Identity Fraud Engine

## Overview
A prototype backend (FastAPI) for uploading documents, running OCR, and serving uploaded files.

## Prerequisites
- **Python 3.12+**
- **Tesseract OCR** (required for the `/api/ocr` endpoint)

## Installing Tesseract on Windows
1. Download the installer from the official repo: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer (choose the default options).
3. Add the installation directory (e.g., `C:\Program Files\Tesseract-OCR`) to your system `PATH` environment variable.
   - Open *System Properties* → *Advanced* → *Environment Variables*.
   - In *System variables* edit `Path` and add the folder.
4. Verify the installation:
   ```bash
   tesseract --version
   ```
   You should see the version output.

## Setup
```bash
# Navigate to the backend folder
cd backend
# Install Python dependencies
pip install -r requirements.txt
```

## Running the server
```bash
python run.py
```
The server will start at `http://127.0.0.1:8000`.

Start the backend in one terminal:
```bash
cd backend
pip install -r requirements.txt
```

Start the frontend in a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://127.0.0.1:5173/` while both terminals remain running.
## API Endpoints
- `GET /health` – health check
- `POST /api/upload` – upload a document (saved in `uploads/`)
- `GET /api/files/{filename}` – retrieve an uploaded file
- `POST /api/ocr` – upload an image and get extracted text (requires Tesseract)

## Testing OCR
You can generate a simple test image with the provided script:
```bash
python scratch/generate_test_image.py
```
Then call the OCR endpoint:
```bash
curl -F "file=@scratch/hello.png" http://127.0.0.1:8000/api/ocr
```
The response will contain the extracted text.
