import requests
import cv2
import numpy as np

BASE = "http://127.0.0.1:8000/api"

def run_suite():
    print("=== STARTING END-TO-END INTEGRATION TEST SUITE ===")

    # 1. Health check
    r = requests.get("http://127.0.0.1:8000/health")
    assert r.status_code == 200, "Health check failed"
    print("[PASS] 1. Root Health Check: 200 OK")

    # Create synthetic test image
    img = np.zeros((300, 500, 3), dtype=np.uint8)
    cv2.rectangle(img, (20, 20), (480, 280), (255, 255, 255), -1)
    cv2.putText(img, "STATE IDENTITY CARD", (40, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
    cv2.putText(img, "NAME: ANNA ERIKSSON", (40, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    cv2.putText(img, "DOB: 12/08/1974", (40, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    cv2.putText(img, "DOC NO: L898902C3", (40, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    cv2.putText(img, "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<", (30, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)
    cv2.putText(img, "L898902C36UTO7408122F1204159ZE184226B<<<<<10", (30, 265), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)
    _, buf = cv2.imencode(".png", img)
    file_bytes = buf.tobytes()

    # 2. Upload API
    r = requests.post(f"{BASE}/upload", files={"file": ("test.png", file_bytes, "image/png")})
    assert r.status_code == 200, "Upload failed"
    print("[PASS] 2. Upload API: 200 OK")

    # 3. Detect API
    r = requests.post(f"{BASE}/detect", files={"file": ("test.png", file_bytes, "image/png")})
    assert r.status_code == 200, "Detect failed"
    det = r.json()
    assert "image_quality" in det
    assert "compression_forensics" in det
    assert "noise_forensics" in det
    assert "suspicious_regions" in det
    print(f"[PASS] 3. Forensic Detection API: 200 OK (Quality: {det['image_quality']['sharpness']}%, Regions: {len(det['suspicious_regions'])})")

    # 4. Document DNA API
    r = requests.post(f"{BASE}/dna", files={"file": ("test.png", file_bytes, "image/png")})
    assert r.status_code == 200, "DNA failed"
    dna = r.json()
    assert "dna_id" in dna
    print(f"[PASS] 4. Document DNA API: 200 OK (DNA ID: {dna['dna_id']}, Hash: {dna['visual_fingerprint'][:12]}...)")

    # 5. Security Audit API
    r = requests.post(f"{BASE}/security/audit", files={"file": ("test.png", file_bytes, "image/png")})
    assert r.status_code == 200, "Security audit failed"
    sec = r.json()
    assert "security_features" in sec
    assert "forensic_reasoning" in sec
    print(f"[PASS] 5. Security Feature & AI Reasoning API: 200 OK (MRZ Status: {sec['security_features']['mrz']['overall_status']}, Reasoning Items: {len(sec['forensic_reasoning'])})")

    # 6. Digital Case Management API
    case_payload = {
        "title": "Automated End-to-End Forensic Dossier",
        "documents": ["test.png"],
        "risk_score": 15,
        "risk_level": "LOW_RISK",
        "risk_breakdown": [{"category": "BASELINE", "points": 15, "reason": "Automated verification pass"}],
        "notes": "Integration test verified."
    }
    r = requests.post(f"{BASE}/cases/create", json=case_payload)
    assert r.status_code == 200, "Case creation failed"
    c = r.json()
    case_id = c["case_id"]
    print(f"[PASS] 6. Digital Case Management API: 200 OK (Created: {case_id})")

    # 7. Identity Graph API
    r = requests.post(f"{BASE}/identity/graph", files=[("files", ("doc1.png", file_bytes, "image/png")), ("files", ("doc2.png", file_bytes, "image/png"))])
    assert r.status_code == 200, "Identity Graph failed"
    g = r.json()
    print(f"[PASS] 7. Identity Graph API: 200 OK (Nodes: {len(g['nodes'])}, Edges: {len(g['edges'])})")

    print("=== ALL 7 BACKEND SUBSYSTEM TESTS PASSED WITH 100% SUCCESS ===")

if __name__ == "__main__":
    run_suite()
