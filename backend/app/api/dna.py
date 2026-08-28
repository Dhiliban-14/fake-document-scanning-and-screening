import io
import os
import hashlib
from typing import Dict, Any, List, Tuple
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import numpy as np
import cv2

router = APIRouter()

def _compute_phash(gray_img: np.ndarray) -> str:
    """Computes a 64-bit Perceptual Hash (pHash) via 2D Discrete Cosine Transform (DCT)."""
    resized = cv2.resize(gray_img, (32, 32), interpolation=cv2.INTER_AREA)
    float_img = np.float32(resized)
    dct = cv2.dct(float_img)
    # Extract top-left 8x8 low-frequency components (excluding DC component at [0,0])
    dct_low = dct[:8, :8]
    med = float(np.median(dct_low))
    # Generate 64-bit hash
    bits = (dct_low > med).flatten()
    hash_hex = "".join([f"{int(b)}" for b in bits])
    # Convert binary string to 16-character hex
    hex_str = f"{int(hash_hex, 2):016x}".upper()
    return hex_str

def _compute_dhash(gray_img: np.ndarray) -> str:
    """Computes a 64-bit Difference Hash (dHash) tracking horizontal intensity gradients."""
    resized = cv2.resize(gray_img, (9, 8), interpolation=cv2.INTER_AREA)
    diff = resized[:, 1:] > resized[:, :-1]
    bits = diff.flatten()
    hash_hex = "".join([f"{int(b)}" for b in bits])
    hex_str = f"{int(hash_hex, 2):016x}".upper()
    return hex_str

def _compute_layout_fingerprint(gray_img: np.ndarray) -> Tuple[str, Dict[str, Any]]:
    """Calculates spatial projection profiles to fingerprint layout geometry and text band positions."""
    h, w = gray_img.shape
    # Horizontal projection (row density)
    h_proj = np.sum(255 - gray_img, axis=1) / (w * 255.0)
    # Vertical projection (column density)
    v_proj = np.sum(255 - gray_img, axis=0) / (h * 255.0)

    # Downsample projections to 16 discrete bins each
    h_bins = cv2.resize(h_proj.reshape(-1, 1), (1, 16), interpolation=cv2.INTER_AREA).flatten()
    v_bins = cv2.resize(v_proj.reshape(-1, 1), (1, 16), interpolation=cv2.INTER_AREA).flatten()

    combined_vec = np.concatenate([h_bins, v_bins])
    norm_vec = combined_vec / (np.linalg.norm(combined_vec) + 1e-6)
    
    # Hash layout vector
    hash_bytes = hashlib.sha256(norm_vec.tobytes()).hexdigest()[:16].upper()
    
    return hash_bytes, {
        "aspect_ratio": round(w / float(h), 3),
        "horizontal_bands": [round(float(x), 3) for x in h_bins[:6]],
        "vertical_bands": [round(float(x), 3) for x in v_bins[:6]]
    }

def _compute_ocr_structure_fingerprint(ocr_text: str) -> str:
    """Fingerprints structural characteristics of extracted text (lines, token count, punctuation)."""
    if not ocr_text or len(ocr_text.strip()) == 0:
        return "0000000000000000"
    lines = [line.strip() for line in ocr_text.splitlines() if len(line.strip()) > 0]
    token_lengths = [len(token) for token in ocr_text.split()]
    
    struct_str = f"L:{len(lines)}_T:{len(token_lengths)}_AVG:{round(np.mean(token_lengths) if token_lengths else 0, 1)}"
    return hashlib.sha256(struct_str.encode()).hexdigest()[:16].upper()

def _compute_metadata_fingerprint(pil_img: Image.Image) -> str:
    """Fingerprints non-sensitive image format properties (color mode, compression, quantization)."""
    format_str = f"{pil_img.format}_{pil_img.mode}_{pil_img.size}_{len(pil_img.getexif())}"
    return hashlib.sha256(format_str.encode()).hexdigest()[:16].upper()

def extract_document_dna(pil_img: Image.Image, ocr_text: str = "") -> Dict[str, Any]:
    """Generates complete Document DNA structure for a single document."""
    cv_img = cv2.cvtColor(np.array(pil_img.convert("RGB")), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    phash = _compute_phash(gray)
    dhash = _compute_dhash(gray)
    visual_fingerprint = f"{phash[:8]}-{dhash[:8]}"
    
    layout_fingerprint, layout_meta = _compute_layout_fingerprint(gray)
    ocr_fingerprint = _compute_ocr_structure_fingerprint(ocr_text)
    metadata_fingerprint = _compute_metadata_fingerprint(pil_img)

    # Master DNA ID
    composite_seed = f"{visual_fingerprint}_{layout_fingerprint}_{ocr_fingerprint}"
    dna_id = f"DOC-DNA-{hashlib.sha256(composite_seed.encode()).hexdigest()[:6].upper()}"

    return {
        "dna_id": dna_id,
        "visual_fingerprint": visual_fingerprint,
        "layout_fingerprint": layout_fingerprint,
        "ocr_structure": ocr_fingerprint,
        "metadata_fingerprint": metadata_fingerprint,
        "phash_raw": phash,
        "dhash_raw": dhash,
        "dimensions": f"{w}x{h}",
        "aspect_ratio": layout_meta["aspect_ratio"],
        "layout_details": layout_meta
    }

def calculate_dna_similarity(dna_a: Dict[str, Any], dna_b: Dict[str, Any]) -> Dict[str, Any]:
    """Compares Document DNA between two documents and calculates similarity metrics."""
    # 1. Visual Hash Hamming Distance (pHash)
    hash_a = int(dna_a.get("phash_raw", "0000000000000000"), 16)
    hash_b = int(dna_b.get("phash_raw", "0000000000000000"), 16)
    xor_diff = hash_a ^ hash_b
    hamming_dist = bin(xor_diff).count("1")  # Max 64
    visual_similarity = max(0.0, min(100.0, (1.0 - (hamming_dist / 64.0)) * 100.0))

    # 2. Layout Fingerprint Match
    layout_match = dna_a.get("layout_fingerprint") == dna_b.get("layout_fingerprint")
    aspect_diff = abs(dna_a.get("aspect_ratio", 1.0) - dna_b.get("aspect_ratio", 1.0))
    layout_similarity = 100.0 if layout_match else max(0.0, (1.0 - min(1.0, aspect_diff)) * 85.0)

    # 3. Overall Weighted DNA Similarity
    overall_similarity = round((visual_similarity * 0.65) + (layout_similarity * 0.35), 1)

    # Classification
    if overall_similarity >= 98.0:
        classification = "EXACT_DUPLICATE"
        is_reuse_suspected = True
        explanation = "The two documents share virtually identical visual, perceptual, and layout structures (potential exact duplicate)."
    elif overall_similarity >= 82.0:
        classification = "POTENTIAL_DOCUMENT_REUSE"
        is_reuse_suspected = True
        explanation = "The two documents share strong visual and structural layout characteristics (potential template reuse or modified copy)."
    elif overall_similarity >= 65.0:
        classification = "SIMILAR_TEMPLATE"
        is_reuse_suspected = False
        explanation = "Documents share general layout framing but contain distinct visual content."
    else:
        classification = "DISTINCT_DOCUMENTS"
        is_reuse_suspected = False
        explanation = "Distinct visual structure and layout characteristics observed."

    return {
        "overall_similarity": overall_similarity,
        "visual_similarity": round(visual_similarity, 1),
        "layout_similarity": round(layout_similarity, 1),
        "classification": classification,
        "is_reuse_suspected": is_reuse_suspected,
        "explanation": explanation
    }

@router.post("/dna")
async def generate_document_dna(file: UploadFile = File(...), ocr_text: str = ""):
    """Generate Document DNA fingerprint for an uploaded document."""
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image format.")
    
    content = await file.read()
    try:
        pil_img = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")
    
    dna_result = extract_document_dna(pil_img, ocr_text)
    return JSONResponse(content=dna_result)

@router.post("/dna/compare")
async def compare_documents_dna(files: List[UploadFile] = File(...)):
    """Compare Document DNA fingerprints across multiple documents in the queue."""
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 documents are required for DNA comparison.")
    
    dna_records = []
    for f in files:
        content = await f.read()
        pil_img = Image.open(io.BytesIO(content)).convert("RGB")
        dna = extract_document_dna(pil_img)
        dna["filename"] = f.filename
        dna_records.append(dna)

    # Pairwise comparison
    comparisons = []
    for i in range(len(dna_records)):
        for j in range(i + 1, len(dna_records)):
            doc_a = dna_records[i]
            doc_b = dna_records[j]
            cmp_res = calculate_dna_similarity(doc_a, doc_b)
            comparisons.append({
                "doc_a_name": doc_a["filename"],
                "doc_a_dna_id": doc_a["dna_id"],
                "doc_b_name": doc_b["filename"],
                "doc_b_dna_id": doc_b["dna_id"],
                **cmp_res
            })

    return JSONResponse(content={
        "documents_dna": dna_records,
        "pairwise_comparisons": comparisons
    })
