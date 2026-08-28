from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
import random

def calculate_additive_risk(
    manipulated: bool,
    compression_variance: float,
    noise_anomaly: bool,
    software_detected: Optional[str],
    has_mrz: bool,
    mrz_valid: bool,
    is_dna_reuse: bool,
    dna_similarity: float,
    has_identity_conflict: bool,
    conflict_field: Optional[str] = None
) -> Dict[str, Any]:
    """Computes an explainable additive risk score with itemized point contributions."""
    breakdown = []
    total_score = 0

    # 1. Compression Variance (ELA)
    if compression_variance > 25.0:
        pts = min(25, int(compression_variance * 0.4))
        total_score += pts
        breakdown.append({
            "category": "COMPRESSION_FORENSICS",
            "points": pts,
            "reason": f"High ELA compression variance ({round(compression_variance, 1)}%) indicative of regional resaving",
            "jump_target": "suspicious_regions",
            "severity": "HIGH"
        })

    # 2. Sensor Noise Inconsistency
    if noise_anomaly:
        total_score += 20
        breakdown.append({
            "category": "SENSOR_NOISE",
            "points": 20,
            "reason": "Background sensor noise inconsistency (>2.8σ variance across patches)",
            "jump_target": "regions",
            "severity": "HIGH"
        })

    # 3. Cryptographic Checksum Failure (MRZ)
    if has_mrz and not mrz_valid:
        total_score += 25
        breakdown.append({
            "category": "SECURITY_FEATURES",
            "points": 25,
            "reason": "ICAO 9303 MRZ modulus 10 check digit calculation failure",
            "jump_target": "security",
            "severity": "CRITICAL"
        })

    # 4. Document DNA Reuse
    if is_dna_reuse and dna_similarity >= 80.0:
        pts = 15
        total_score += pts
        breakdown.append({
            "category": "DOCUMENT_DNA",
            "points": pts,
            "reason": f"High Document DNA correlation ({dna_similarity}%) to queued template",
            "jump_target": "dna",
            "severity": "MEDIUM"
        })

    # 5. Cross-Document Identity Conflict
    if has_identity_conflict:
        total_score += 20
        breakdown.append({
            "category": "IDENTITY_INTELLIGENCE",
            "points": 20,
            "reason": f"Cross-document identity conflict in {conflict_field or 'identity attributes'}",
            "jump_target": "graph",
            "severity": "HIGH"
        })

    # 6. EXIF Editing Tool Signature
    if software_detected:
        total_score += 15
        breakdown.append({
            "category": "METADATA_EXIF",
            "points": 15,
            "reason": f"Editing software signature ({software_detected}) found in EXIF tags",
            "jump_target": "metadata",
            "severity": "MEDIUM"
        })

    # Cap at 100
    capped_score = min(100, total_score)

    if capped_score >= 61:
        risk_level = "HIGH_INVESTIGATION_RISK"
    elif capped_score >= 26:
        risk_level = "REVIEW_REQUIRED"
    else:
        risk_level = "LOW_RISK"

    return {
        "total_risk_score": capped_score,
        "risk_level": risk_level,
        "breakdown": breakdown
    }
