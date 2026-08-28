import io
import re
import hashlib
from typing import List, Dict, Any
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import numpy as np
import cv2

from .identity_compare import (
    enhance_image_multi_pass,
    parse_full_name,
    parse_date_of_birth,
    parse_phone_number,
    parse_address,
    detect_photo_presence
)
from .dna import extract_document_dna, calculate_dna_similarity
import pytesseract

router = APIRouter()

def parse_doc_identifier(text: str) -> str:
    """Extracts document identifier (Passport, PAN, Driver License, Aadhaar, or ID Number)."""
    pan_match = re.search(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", text)
    if pan_match:
        return pan_match.group(0)
    
    pass_match = re.search(r"\b[A-Z][0-9]{7,8}\b", text)
    if pass_match:
        return pass_match.group(0)
    
    custom_id = re.search(r"(?:ID|DOC|NO|NUMBER)[:\s\-]+([A-Z0-9\-]{6,16})", text, re.IGNORECASE)
    if custom_id:
        return custom_id.group(1).upper()
        
    return "UNKNOWN-ID"

@router.post("/identity/graph")
async def build_identity_graph(files: List[UploadFile] = File(...)):
    """Constructs an interactive Identity Entity-Relationship Graph and detects cross-document conflicts."""
    if len(files) < 1:
        raise HTTPException(status_code=400, detail="At least 1 document is required to build the identity graph.")

    doc_entities = []

    for idx, f in enumerate(files):
        content = await f.read()
        pil_img = Image.open(io.BytesIO(content)).convert("RGB")
        cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        # 1. OCR Extraction
        ocr_variants = enhance_image_multi_pass(pil_img)
        combined_text = ""
        for v in ocr_variants:
            try:
                t = pytesseract.image_to_string(v, config="--psm 6")
                combined_text += " " + t
            except Exception:
                pass

        name, name_conf = parse_full_name(combined_text)
        dob, dob_conf = parse_date_of_birth(combined_text)
        phone, phone_conf = parse_phone_number(combined_text)
        address, addr_conf = parse_address(combined_text)
        doc_no = parse_doc_identifier(combined_text)
        photo_label, photo_conf = detect_photo_presence(cv_img)
        dna = extract_document_dna(pil_img, combined_text)

        doc_entities.append({
            "doc_id": f"doc-{idx + 1}",
            "filename": f.filename or f"Document_{idx+1}.png",
            "name": name if name_conf > 40 else f"NAME_DOC_{idx+1}",
            "dob": dob if dob_conf > 40 else "UNREADABLE",
            "phone": phone if phone_conf > 40 else "NOT_DETECTED",
            "address": address if addr_conf > 40 else "NOT_DETECTED",
            "doc_no": doc_no,
            "photo_label": photo_label,
            "dna": dna
        })

    # 2. Build Graph Nodes & Edges
    nodes = []
    edges = []
    node_set = set()

    def add_node(node_id: str, label: str, node_type: str, metadata: Dict[str, Any] = None, is_conflict: bool = False):
        if node_id not in node_set:
            node_set.add(node_id)
            nodes.append({
                "id": node_id,
                "label": label,
                "type": node_type,
                "is_conflict": is_conflict,
                "metadata": metadata or {}
            })

    def add_edge(source: str, target: str, label: str, is_conflict: bool = False):
        edges.append({
            "id": f"edge-{len(edges)+1}",
            "source": source,
            "target": target,
            "label": label,
            "is_conflict": is_conflict
        })

    # Master Person Node
    primary_name = doc_entities[0]["name"]
    person_node_id = "person-master"
    add_node(person_node_id, f"PERSON: {primary_name}", "person")

    # Cross-document conflict detection
    conflicts = []
    names_seen = {}
    dobs_seen = {}
    doc_nos_seen = {}

    for doc in doc_entities:
        doc_node_id = doc["doc_id"]
        add_node(doc_node_id, f"DOC: {doc['filename']}", "document", {"filename": doc["filename"], "dna_id": doc["dna"]["dna_id"]})
        add_edge(person_node_id, doc_node_id, "HAS_DOCUMENT")

        # Name
        name_node_id = f"name-{hashlib.md5(doc['name'].encode()).hexdigest()[:6]}"
        add_node(name_node_id, f"NAME: {doc['name']}", "name")
        add_edge(doc_node_id, name_node_id, "CONTAINS_NAME")

        if doc["name"] != "UNREADABLE":
            names_seen.setdefault(doc["name"], []).append(doc["filename"])

        # DOB
        if doc["dob"] != "UNREADABLE":
            dob_node_id = f"dob-{hashlib.md5(doc['dob'].encode()).hexdigest()[:6]}"
            add_node(dob_node_id, f"DOB: {doc['dob']}", "dob")
            add_edge(doc_node_id, dob_node_id, "CONTAINS_DOB")
            dobs_seen.setdefault(doc["dob"], []).append(doc["filename"])

        # Document Number
        if doc["doc_no"] != "UNKNOWN-ID":
            docno_node_id = f"id-{hashlib.md5(doc['doc_no'].encode()).hexdigest()[:6]}"
            add_node(docno_node_id, f"ID: {doc['doc_no']}", "docno")
            add_edge(doc_node_id, docno_node_id, "CONTAINS_ID")
            doc_nos_seen.setdefault(doc["doc_no"], []).append(doc["filename"])

        # Photo
        photo_node_id = f"photo-{doc_node_id}"
        add_node(photo_node_id, f"PHOTO: {doc['photo_label']}", "photo")
        add_edge(doc_node_id, photo_node_id, "CONTAINS_PHOTO")

        # Address
        if doc["address"] != "NOT_DETECTED":
            addr_node_id = f"addr-{hashlib.md5(doc['address'].encode()).hexdigest()[:6]}"
            add_node(addr_node_id, f"ADDR: {doc['address']}", "address")
            add_edge(doc_node_id, addr_node_id, "CONTAINS_ADDRESS")

    # Detect Inconsistencies across documents
    if len(dobs_seen) > 1:
        dob_keys = list(dobs_seen.keys())
        conflicts.append({
            "field": "DATE_OF_BIRTH",
            "type": "IDENTITY_DOB_CONFLICT",
            "severity": "HIGH",
            "doc_a": dobs_seen[dob_keys[0]][0],
            "val_a": dob_keys[0],
            "doc_b": dobs_seen[dob_keys[1]][0],
            "val_b": dob_keys[1],
            "explanation": f"Conflicting Date of Birth values ({dob_keys[0]} vs {dob_keys[1]}) for same identity profile."
        })
        # Mark conflict in graph
        for n in nodes:
            if n["type"] == "dob":
                n["is_conflict"] = True

    if len(names_seen) > 1:
        name_keys = list(names_seen.keys())
        conflicts.append({
            "field": "FULL_NAME",
            "type": "IDENTITY_NAME_CONFLICT",
            "severity": "HIGH",
            "doc_a": names_seen[name_keys[0]][0],
            "val_a": name_keys[0],
            "doc_b": names_seen[name_keys[1]][0],
            "val_b": name_keys[1],
            "explanation": f"Conflicting Name records ({name_keys[0]} vs {name_keys[1]}) linked to target individual."
        })
        for n in nodes:
            if n["type"] == "name":
                n["is_conflict"] = True

    # 3. Detect Suspicious Clusters
    clusters = []
    if len(doc_entities) >= 2:
        for i in range(len(doc_entities)):
            for j in range(i + 1, len(doc_entities)):
                d_a = doc_entities[i]
                d_b = doc_entities[j]
                sim = calculate_dna_similarity(d_a["dna"], d_b["dna"])
                if sim["overall_similarity"] >= 80.0:
                    clusters.append({
                        "cluster_id": f"CLUSTER-0{len(clusters)+1}",
                        "documents": [d_a["filename"], d_b["filename"]],
                        "shared_characteristics": [
                            f"High Document DNA similarity ({sim['overall_similarity']}%)",
                            f"Layout template alignment ({sim['layout_similarity']}%)",
                            f"Identical aspect ratio ({d_a['dna']['aspect_ratio']})"
                        ],
                        "suspicion_note": "Visual & layout fingerprint correlation indicates potential template duplication or cloned document reuse."
                    })

    return JSONResponse(content={
        "nodes": nodes,
        "edges": edges,
        "conflicts": conflicts,
        "suspicious_clusters": clusters,
        "total_documents": len(doc_entities),
        "total_conflicts": len(conflicts),
        "total_clusters": len(clusters)
    })
