from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import health, upload, ocr, files, highlight, detect, ela, identity_compare, dna, graph, security_features, cases

app = FastAPI(title="Identity Fraud Engine Backend")

# Allow frontend dev server to call
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(ocr.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(highlight.router, prefix="/api")
app.include_router(detect.router, prefix="/api")
app.include_router(ela.router, prefix="/api")
app.include_router(identity_compare.router, prefix="/api")
app.include_router(dna.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(security_features.router, prefix="/api")
app.include_router(cases.router, prefix="/api")

# Simple health check endpoint at root
@app.get("/health")
async def root_health():
    return {"status": "ok"}
