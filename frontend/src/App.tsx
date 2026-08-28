import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import {
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  FileText,
  Eye,
  Sliders,
  Sparkles,
  Activity,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Cpu,
  Layers,
  FileSpreadsheet,
  MousePointer,
  Camera,
  Flame,
  Columns,
  Download,
  X,
  Files,
  FileCheck,
  FileWarning,
  UserCheck,
  UserX,
  HelpCircle,
  MapPin,
  AlertOctagon,
  QrCode,
  FileCheck2,
  Check,
  Image as ImageIcon,
  Crosshair,
  Info,
  ShieldQuestion,
  ListFilter,
  Dna,
  GitCompare,
  Fingerprint,
  Network,
  GitFork,
  Users,
  AlertCircle,
  Binary,
  Award,
  FileKey2,
  FileBadge2,
  Briefcase,
  FolderOpen,
  Send,
  Save,
  PlusCircle,
  Clock,
  Printer,
  Trash2,
  CheckSquare,
  Square
} from "lucide-react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/api";

type SuspiciousRegion = {
  region_id: string;
  location_label: string;
  bbox: { x: number; y: number; width: number; height: number };
  suspicion_score: number;
  potential_manipulation: "HIGH" | "MEDIUM" | "LOW";
  indicators: string[];
  explanation: string;
};

type DetectionResult = {
  manipulated: boolean;
  bbox: { x: number; y: number; width: number; height: number };
  confidence: number;
  explanation: string;
  risk_score: number;
  image_quality?: {
    overall_score: number;
    sharpness: number;
    contrast: number;
    brightness: number;
    resolution: string;
    status: string;
  };
  metadata_forensics?: {
    has_exif: boolean;
    software_detected: string | null;
    anomaly_flag: boolean;
    indicators: string[];
    exif_summary: Record<string, string>;
  };
  compression_forensics?: {
    mean_error_level: number;
    std_error_level: number;
    anomaly_flag: boolean;
    compression_variance_score: number;
  };
  noise_forensics?: {
    anomaly_detected: boolean;
    anomaly_score: number;
    patches_count: number;
  };
  suspicious_regions?: SuspiciousRegion[];
  detected_indicators?: string[];
  forensic_status?: "HIGH_INVESTIGATION_RISK" | "REVIEW_REQUIRED" | "LOW_RISK";
};

type DocumentDNA = {
  dna_id: string;
  visual_fingerprint: string;
  layout_fingerprint: string;
  ocr_structure: string;
  metadata_fingerprint: string;
  dimensions: string;
  aspect_ratio: number;
  layout_details?: {
    aspect_ratio: number;
    horizontal_bands: number[];
    vertical_bands: number[];
  };
};

type DnaComparison = {
  doc_a_name: string;
  doc_a_dna_id: string;
  doc_b_name: string;
  doc_b_dna_id: string;
  overall_similarity: number;
  visual_similarity: number;
  layout_similarity: number;
  classification: "EXACT_DUPLICATE" | "POTENTIAL_DOCUMENT_REUSE" | "SIMILAR_TEMPLATE" | "DISTINCT_DOCUMENTS";
  is_reuse_suspected: boolean;
  explanation: string;
};

type GraphNode = {
  id: string;
  label: string;
  type: "person" | "document" | "name" | "dob" | "docno" | "photo" | "address";
  is_conflict?: boolean;
  metadata?: Record<string, any>;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  is_conflict?: boolean;
};

type IdentityConflict = {
  field: string;
  type: string;
  severity: string;
  doc_a: string;
  val_a: string;
  doc_b: string;
  val_b: string;
  explanation: string;
};

type SuspiciousCluster = {
  cluster_id: string;
  documents: string[];
  shared_characteristics: string[];
  suspicion_note: string;
};

type ForensicReasoning = {
  finding: string;
  evidence_type: string;
  primary_indicator: string;
  scientific_basis: string[];
  confidence: number;
  recommended_action: string;
};

type SecurityFeatureReport = {
  mrz: {
    has_mrz: boolean;
    format?: string;
    line1?: string;
    line2?: string;
    parsed_fields?: {
      document_number: string;
      document_number_valid: boolean;
      document_number_check_digit: string;
      date_of_birth_mrz: string;
      date_of_birth_valid: boolean;
      date_of_birth_check_digit: string;
      expiry_mrz: string;
      expiry_valid: boolean;
      mrz_name: string;
    };
    cross_check?: {
      visual_name: string;
      mrz_name: string;
      name_match: boolean;
      checksum_status: string;
    };
    overall_status: string;
    explanation?: string;
  };
  qr_code: {
    detected: boolean;
    payload_length?: number;
    payload_snippet?: string;
    match_visual: boolean;
    details: string;
  };
  government_seal: {
    label: string;
    confidence: number;
    present: boolean;
  };
  signature: {
    label: string;
    confidence: number;
    present: boolean;
  };
  microprint_guilloche: {
    texture_energy: number;
    status: string;
  };
};

type RiskContribution = {
  category: string;
  points: number;
  reason: string;
  jump_target: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
};

type CaseDossier = {
  case_id: string;
  title: string;
  created_at: string;
  assigned_investigator: string;
  status: "OPEN_INVESTIGATION" | "UNDER_REVIEW" | "EVIDENCE_FLAGGED" | "VERIFIED_AUTHENTIC" | "SUSPECTED_FRAUD_ESCALATED" | "CLOSED_RESOLVED";
  risk_score: number;
  risk_level: string;
  notes: string;
  documents: string[];
  audit_trail: Array<{
    timestamp: string;
    action: string;
    performed_by: string;
  }>;
};

type AuditLog = {
  timestamp: string;
  action: string;
  status: "info" | "success" | "warning" | "error";
};

type BatchDoc = {
  id: string;
  file: File;
  previewUrl: string;
  highlightUrl: string;
  elaUrl: string;
  ocrText: string;
  detection: DetectionResult | null;
  dna: DocumentDNA | null;
  security: SecurityFeatureReport | null;
  reasoning: ForensicReasoning[];
  rect: { x: number; y: number; width: number; height: number };
  status: "pending" | "scanning" | "completed" | "error";
};

type IdentityCompareResult = {
  odd_document_index: number;
  odd_document_name: string | null;
  discrepancy_type: string;
  mismatched_field: string;
  location_label: string;
  consensus_value: string;
  outlier_value: string;
  why_mismatch: string;
  explanation: string;
  field_matrix: {
    filenames: string[];
    photos?: string[];
    photo_confidences?: number[];
    names: string[];
    name_confidences: number[];
    dobs: string[];
    dob_confidences: number[];
    addresses?: string[];
    addr_confidences?: number[];
    phone_numbers?: string[];
    phone_confidences?: number[];
    co_names?: string[];
    co_confidences?: number[];
    qr_codes?: string[];
    qr_confidences?: number[];
    signatures?: string[];
    signature_confidences?: number[];
    government_seals?: string[];
    seal_confidences?: number[];
  };
};

const generateSampleCleanImage = (name = "ALEXANDRA RIVERA", dob = "14/08/1998", docNo = "ID-8849201-X"): string => {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 360;
  const ctx = canvas.getContext("2d")!;
  
  const grad = ctx.createLinearGradient(0, 0, 600, 360);
  grad.addColorStop(0, "#1e293b");
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 360);

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 580, 340);

  ctx.fillStyle = "#0284c7";
  ctx.fillRect(10, 10, 580, 60);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("STATE IDENTITY AUTHORITY", 30, 48);

  ctx.fillStyle = "#334155";
  ctx.fillRect(40, 90, 140, 180);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("PASSPORT PHOTO", 45, 185);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(`NAME: ${name}`, 210, 120);
  ctx.fillText(`DOB: ${dob}`, 210, 160);
  ctx.fillText(`DOC NO: ${docNo}`, 210, 200);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(440, 230, 100, 100);

  return canvas.toDataURL("image/png");
};

const generateSampleManipulatedImage = (): string => {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 360;
  const ctx = canvas.getContext("2d")!;
  
  const grad = ctx.createLinearGradient(0, 0, 600, 360);
  grad.addColorStop(0, "#1e293b");
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 360);

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 580, 340);

  ctx.fillStyle = "#0284c7";
  ctx.fillRect(10, 10, 580, 60);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("STATE IDENTITY AUTHORITY", 30, 48);

  ctx.fillStyle = "#334155";
  ctx.fillRect(40, 90, 140, 180);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("PASSPORT PHOTO", 45, 185);

  // Clean authentic fields
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("DOB: 12/05/2005", 210, 160);
  ctx.fillText("DOC NO: ID-9948211-M", 210, 200);

  // Spliced Name field with localized background disparity & font artifact
  ctx.fillStyle = "#2a1520";
  ctx.fillRect(205, 95, 285, 42);
  ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(205, 95, 285, 42);

  ctx.fillStyle = "#fca5a5";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("NAME: RAHUL KUMAR [MODIFIED]", 210, 122);

  // Add realistic local compression and noise artifact to the spliced patch
  try {
    const patchData = ctx.getImageData(205, 95, 285, 42);
    for (let i = 0; i < patchData.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 35;
      patchData.data[i] = Math.max(0, Math.min(255, patchData.data[i] + n));
      patchData.data[i + 1] = Math.max(0, Math.min(255, patchData.data[i + 1] + n));
      patchData.data[i + 2] = Math.max(0, Math.min(255, patchData.data[i + 2] + n));
    }
    ctx.putImageData(patchData, 205, 95);
  } catch (e) {}

  return canvas.toDataURL("image/png");
};

const generateSampleMrzPassport = (isTampered = false): string => {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 360;
  const ctx = canvas.getContext("2d")!;
  
  const grad = ctx.createLinearGradient(0, 0, 600, 360);
  grad.addColorStop(0, "#1e293b");
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 360);

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 580, 340);

  ctx.fillStyle = "#0284c7";
  ctx.fillRect(10, 10, 580, 55);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("INTERNATIONAL PASSPORT AUTHORITY", 30, 42);

  ctx.fillStyle = "#334155";
  ctx.fillRect(40, 75, 130, 150);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("PASSPORT PHOTO", 45, 155);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("NAME: ANNA MARIA ERIKSSON", 195, 100);
  ctx.fillText("DOB: 12/08/1974", 195, 135);
  ctx.fillText("DOC NO: L898902C3", 195, 170);
  ctx.fillText("NATIONALITY: UTO", 195, 205);

  ctx.fillStyle = "#020617";
  ctx.fillRect(15, 245, 570, 95);

  ctx.fillStyle = isTampered ? "#fca5a5" : "#38bdf8";
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.fillText("P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<", 25, 280);
  
  const line2 = isTampered 
    ? "L898902C39UTO7408122F1204159ZE184226B<<<<<10"
    : "L898902C36UTO7408122F1204159ZE184226B<<<<<10";
  ctx.fillText(line2, 25, 315);

  return canvas.toDataURL("image/png");
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

function App() {
  const [batchDocs, setBatchDocs] = useState<BatchDoc[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [identityCompare, setIdentityCompare] = useState<IdentityCompareResult | null>(null);
  const [dnaComparisons, setDnaComparisons] = useState<DnaComparison[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[]; conflicts: IdentityConflict[]; suspicious_clusters: SuspiciousCluster[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  // Feature 10 & 11: Explainable Risk Breakdown & Case Dossier
  const [currentCase, setCurrentCase] = useState<CaseDossier>({
    case_id: "CASE-2026-0842",
    title: "Live Forensic Identity Examination",
    created_at: new Date().toLocaleTimeString(),
    assigned_investigator: "Senior Forensic Examiner",
    status: "OPEN_INVESTIGATION",
    risk_score: 0,
    risk_level: "LOW_RISK",
    notes: "Document intake initialized. Awaiting multi-layer forensic and cryptographic screening.",
    documents: [],
    audit_trail: [{
      timestamp: new Date().toLocaleTimeString(),
      action: "Investigation workspace created.",
      performed_by: "System"
    }]
  });
  const [tempNotes, setTempNotes] = useState<string>(currentCase.notes);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"regions" | "timeline" | "case" | "security" | "reasoning" | "graph" | "dna" | "ocr" | "audit">("regions");
  const [ocrSearch, setOcrSearch] = useState<string>("");
  const [viewMode, setViewMode] = useState<"original" | "analyzed" | "suspicious_regions" | "heatmap" | "ela">("suspicious_regions");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Feature 13: Live Camera Glare and Blur State
  const [isWebcamOpen, setIsWebcamOpen] = useState<boolean>(false);
  const [cameraFocusScore, setCameraFocusScore] = useState<number>(0);
  const [isCameraBlurry, setIsCameraBlurry] = useState<boolean>(false);
  const [hasCameraGlare, setHasCameraGlare] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const cameraIntervalRef = useRef<any>(null);

  // Feature 14: Printable Forensic Report State
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Document Management Feature: Selection & Removal State
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "single" | "selected" | "all";
    targetDocId?: string;
    count: number;
    docNames: string[];
  }>({
    isOpen: false,
    type: "single",
    count: 0,
    docNames: []
  });

  // Keyboard accessibility: Escape closes modal or exits selection mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteModal.isOpen) {
          setDeleteModal({ isOpen: false, type: "single", count: 0, docNames: [] });
        } else if (isSelectMode) {
          setIsSelectMode(false);
          setSelectedDocIds([]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteModal.isOpen, isSelectMode]);

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const selectAllDocs = () => {
    if (selectedDocIds.length === batchDocs.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(batchDocs.map((d) => d.id));
    }
  };

  const promptDeleteSingleDoc = (id: string) => {
    const doc = batchDocs.find((d) => d.id === id);
    if (!doc) return;
    setDeleteModal({
      isOpen: true,
      type: "single",
      targetDocId: id,
      count: 1,
      docNames: [doc.file.name]
    });
  };

  const promptDeleteSelectedDocs = () => {
    if (selectedDocIds.length === 0) return;
    const names = batchDocs.filter((d) => selectedDocIds.includes(d.id)).map((d) => d.file.name);
    setDeleteModal({
      isOpen: true,
      type: "selected",
      count: selectedDocIds.length,
      docNames: names
    });
  };

  const promptRemoveAllDocs = () => {
    if (batchDocs.length === 0) return;
    const names = batchDocs.map((d) => d.file.name);
    setDeleteModal({
      isOpen: true,
      type: "all",
      count: batchDocs.length,
      docNames: names
    });
  };

  const confirmDeleteAction = () => {
    const timeStr = new Date().toLocaleTimeString();

    if (deleteModal.type === "all") {
      const count = batchDocs.length;
      setBatchDocs([]);
      setActiveDocId(null);
      setSelectedDocIds([]);
      setIsSelectMode(false);
      setIdentityCompare(null);
      setDnaComparisons([]);
      setGraphData(null);
      setSelectedRegionId(null);

      // Preserve Case ID and notes, update documents and audit trail
      setCurrentCase((prev) => ({
        ...prev,
        documents: [],
        audit_trail: [
          {
            timestamp: timeStr,
            action: `ALL_DOCUMENTS_REMOVED: All ${count} documents removed from case by examiner.`,
            performed_by: prev.assigned_investigator
          },
          ...prev.audit_trail
        ]
      }));

      addAuditLog(`ALL_DOCUMENTS_REMOVED: Cleared all ${count} document(s) from case ${currentCase.case_id}`, "warning");
    } else if (deleteModal.type === "single" && deleteModal.targetDocId) {
      const targetId = deleteModal.targetDocId;
      const targetDoc = batchDocs.find((d) => d.id === targetId);
      const remaining = batchDocs.filter((d) => d.id !== targetId);

      setBatchDocs(remaining);
      setSelectedDocIds((prev) => prev.filter((id) => id !== targetId));

      if (activeDocId === targetId) {
        setActiveDocId(remaining.length > 0 ? remaining[0].id : null);
        setSelectedRegionId(null);
      }

      setCurrentCase((prev) => ({
        ...prev,
        documents: remaining.map((d) => d.file.name),
        audit_trail: [
          {
            timestamp: timeStr,
            action: `DOCUMENT_REMOVED: ${targetDoc?.file.name || targetId} (${targetDoc?.dna?.dna_id || "N/A"}) removed by examiner.`,
            performed_by: prev.assigned_investigator
          },
          ...prev.audit_trail
        ]
      }));

      addAuditLog(`DOCUMENT_REMOVED: ${targetDoc?.file.name || targetId}`, "info");

      if (remaining.length >= 2) {
        runIdentityCompare(remaining);
        runDnaCompare(remaining);
        runGraphAnalysis(remaining);
      } else {
        setIdentityCompare(null);
        setDnaComparisons([]);
        setGraphData(null);
      }
    } else if (deleteModal.type === "selected") {
      const idsToRemove = new Set(selectedDocIds);
      const count = idsToRemove.size;
      const removedDocs = batchDocs.filter((d) => idsToRemove.has(d.id));
      const remaining = batchDocs.filter((d) => !idsToRemove.has(d.id));

      setBatchDocs(remaining);
      setSelectedDocIds([]);
      setIsSelectMode(false);

      if (activeDocId && idsToRemove.has(activeDocId)) {
        setActiveDocId(remaining.length > 0 ? remaining[0].id : null);
        setSelectedRegionId(null);
      }

      setCurrentCase((prev) => ({
        ...prev,
        documents: remaining.map((d) => d.file.name),
        audit_trail: [
          {
            timestamp: timeStr,
            action: `DOCUMENTS_BULK_REMOVED: ${count} documents removed from case by examiner.`,
            performed_by: prev.assigned_investigator
          },
          ...prev.audit_trail
        ]
      }));

      addAuditLog(`DOCUMENTS_BULK_REMOVED: ${count} document(s) removed (${removedDocs.map(d => d.file.name).join(", ")})`, "info");

      if (remaining.length >= 2) {
        runIdentityCompare(remaining);
        runDnaCompare(remaining);
        runGraphAnalysis(remaining);
      } else {
        setIdentityCompare(null);
        setDnaComparisons([]);
        setGraphData(null);
      }
    }

    setDeleteModal({ isOpen: false, type: "single", count: 0, docNames: [] });
  };

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeDoc = batchDocs.find((d) => d.id === activeDocId) || (batchDocs.length > 0 ? batchDocs[0] : null);

  const addAuditLog = (action: string, status: AuditLog["status"] = "info") => {
    const time = new Date().toLocaleTimeString();
    setAuditLogs((prev) => [{ timestamp: time, action, status }, ...prev.slice(0, 24)]);
  };

  useEffect(() => {
    addAuditLog("Digital Case CASE-2026-0842 initialized.", "info");
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processBatchFiles(files);
    }
  };

  const processBatchFiles = async (files: File[]) => {
    addAuditLog(`Received ${files.length} document(s) for forensic acquisition & analysis.`, "info");
    
    const newItems: BatchDoc[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      highlightUrl: "",
      elaUrl: "",
      ocrText: "",
      detection: null,
      dna: null,
      security: null,
      reasoning: [],
      rect: { x: 0, y: 0, width: 0, height: 0 },
      status: "pending",
    }));

    const updatedBatch = [...batchDocs, ...newItems];
    setBatchDocs(updatedBatch);
    setActiveDocId(newItems[0].id);

    // Update case documents
    setCurrentCase((prev) => ({
      ...prev,
      documents: updatedBatch.map((d) => d.file.name)
    }));

    for (const item of newItems) {
      await analyzeSingleDoc(item);
    }

    if (updatedBatch.length >= 2) {
      await runIdentityCompare(updatedBatch);
      await runDnaCompare(updatedBatch);
      await runGraphAnalysis(updatedBatch);
    }
  };

  const analyzeSingleDoc = async (item: BatchDoc) => {
    setIsScanning(true);
    addAuditLog(`Executing multi-layer forensic, DNA & Security analysis on: ${item.file.name}...`, "info");
    
    setBatchDocs((prev) =>
      prev.map((d) => (d.id === item.id ? { ...d, status: "scanning" } : d))
    );

    try {
      const form = new FormData();
      form.append("file", item.file);

      await axios.post(`${API_URL}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const detectRes = await axios.post(`${API_URL}/detect`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const detectionData = detectRes.data as DetectionResult;

      let dnaData: DocumentDNA | null = null;
      try {
        const dnaRes = await axios.post(`${API_URL}/dna`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        dnaData = dnaRes.data as DocumentDNA;
      } catch (e) {}

      let secData: SecurityFeatureReport | null = null;
      let reasoningData: ForensicReasoning[] = [];
      try {
        const secRes = await axios.post(`${API_URL}/security/audit`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        secData = secRes.data.security_features as SecurityFeatureReport;
        reasoningData = secRes.data.forensic_reasoning as ForensicReasoning[];
      } catch (e) {}

      let elaUrl = "";
      try {
        const elaRes = await axios.post(`${API_URL}/ela`, form, {
          responseType: "blob",
          headers: { "Content-Type": "multipart/form-data" },
        });
        elaUrl = URL.createObjectURL(elaRes.data);
      } catch (e) {}

      const firstRegionBbox = detectionData.suspicious_regions?.[0]?.bbox || (detectionData.bbox?.width > 0 ? detectionData.bbox : { x: 0, y: 0, width: 0, height: 0 });

      setBatchDocs((prev) =>
        prev.map((d) => {
          if (d.id === item.id) {
            return {
              ...d,
              detection: detectionData,
              dna: dnaData,
              security: secData,
              reasoning: reasoningData,
              elaUrl,
              rect: { ...firstRegionBbox },
              status: "completed",
            };
          }
          return d;
        })
      );

      if (detectionData.suspicious_regions && detectionData.suspicious_regions.length > 0) {
        setSelectedRegionId(detectionData.suspicious_regions[0].region_id);
        addAuditLog(`Flagged ${detectionData.suspicious_regions.length} suspicious region(s) in ${item.file.name}.`, "warning");
      } else {
        setSelectedRegionId(null);
        addAuditLog(`No suspicious regions in ${item.file.name}. Image appears coherent.`, "success");
      }

      if (secData?.mrz.has_mrz) {
        if (secData.mrz.overall_status === "POTENTIAL_MRZ_INCONSISTENCY") {
          addAuditLog(`⚠️ MRZ CHECKSUM ANOMALY detected on ${item.file.name}!`, "warning");
        } else {
          addAuditLog(`MRZ Checksum verified authentic for ${item.file.name}.`, "success");
        }
      }
    } catch (err: any) {
      addAuditLog(`Error analyzing ${item.file.name}: ${err.message}`, "error");
    } finally {
      setIsScanning(false);
    }
  };

  const runIdentityCompare = async (currentDocs: BatchDoc[]) => {
    addAuditLog("Cross-referencing 9-point security layers across queue...", "info");
    try {
      const form = new FormData();
      currentDocs.forEach((d) => form.append("files", d.file));

      const res = await axios.post(`${API_URL}/identity-compare`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const result = res.data as IdentityCompareResult;
      setIdentityCompare(result);

      if (result.discrepancy_type === "LOW_CONFIDENCE_REVIEW") {
        addAuditLog(`⚠️ LOW CONFIDENCE: High-certainty fraud claim suspended due to unreadable fields (<50% Conf).`, "warning");
      } else if (result.odd_document_index !== -1) {
        addAuditLog(`⚠️ ODD DOCUMENT OUT DETECTED: ${result.odd_document_name} (${result.explanation})`, "warning");
      } else {
        addAuditLog("9-Point Cross-Check Complete: All high-confidence attributes match consistently.", "success");
      }
    } catch (err: any) {
      addAuditLog(`Identity Compare Failed: ${err.message}`, "error");
    }
  };

  const runDnaCompare = async (currentDocs: BatchDoc[]) => {
    addAuditLog("Executing Document DNA cross-comparison & template reuse search...", "info");
    try {
      const form = new FormData();
      currentDocs.forEach((d) => form.append("files", d.file));

      const res = await axios.post(`${API_URL}/dna/compare`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const comparisons = res.data.pairwise_comparisons as DnaComparison[];
      setDnaComparisons(comparisons);

      const highReuse = comparisons.find((c) => c.is_reuse_suspected);
      if (highReuse) {
        addAuditLog(`⚠️ POTENTIAL DOCUMENT REUSE: ${highReuse.doc_a_name} ↔ ${highReuse.doc_b_name} (${highReuse.overall_similarity}% DNA Similarity)`, "warning");
      }
    } catch (err: any) {
      addAuditLog(`DNA Compare Failed: ${err.message}`, "error");
    }
  };

  const runGraphAnalysis = async (currentDocs: BatchDoc[]) => {
    addAuditLog("Building Identity Relationship Graph and checking conflict matrix...", "info");
    try {
      const form = new FormData();
      currentDocs.forEach((d) => form.append("files", d.file));

      const res = await axios.post(`${API_URL}/identity/graph`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setGraphData(res.data);
      if (res.data.conflicts && res.data.conflicts.length > 0) {
        addAuditLog(`⚠️ POTENTIAL IDENTITY CONFLICT: ${res.data.conflicts.length} cross-document conflict(s) detected.`, "warning");
      }
      if (res.data.suspicious_clusters && res.data.suspicious_clusters.length > 0) {
        addAuditLog(`⚠️ SUSPICIOUS CLUSTER: ${res.data.suspicious_clusters.length} correlated document cluster(s) detected.`, "warning");
      }
    } catch (err: any) {
      addAuditLog(`Identity Graph Build Failed: ${err.message}`, "error");
    }
  };

  // Additive Risk Breakdown Calculation (Feature 10)
  const calculateRiskBreakdown = (): { total: number; level: string; breakdown: RiskContribution[] } => {
    const items: RiskContribution[] = [];
    let total = 0;

    if (activeDoc?.detection) {
      const compVar = activeDoc.detection.compression_forensics?.compression_variance_score || 0;
      if (compVar > 20) {
        const pts = Math.min(25, Math.round(compVar * 0.4));
        total += pts;
        items.push({
          category: "COMPRESSION FORENSICS",
          points: pts,
          reason: `High ELA compression variance (${compVar}%) in localized regions`,
          jump_target: "ela",
          severity: "HIGH"
        });
      }

      if (activeDoc.detection.noise_forensics?.anomaly_detected) {
        total += 20;
        items.push({
          category: "SENSOR NOISE",
          points: 20,
          reason: "Background sensor noise inconsistency (>2.8σ variance across patches)",
          jump_target: "regions",
          severity: "HIGH"
        });
      }

      if (activeDoc.detection.metadata_forensics?.software_detected) {
        total += 15;
        items.push({
          category: "METADATA EXIF",
          points: 15,
          reason: `Editing tool signature detected: ${activeDoc.detection.metadata_forensics.software_detected}`,
          jump_target: "metadata",
          severity: "MEDIUM"
        });
      }
    }

    if (activeDoc?.security?.mrz.has_mrz && activeDoc.security.mrz.overall_status === "POTENTIAL_MRZ_INCONSISTENCY") {
      total += 25;
      items.push({
        category: "SECURITY FEATURES",
        points: 25,
        reason: "ICAO 9303 MRZ modulus 10 check digit cryptographic failure",
        jump_target: "security",
        severity: "CRITICAL"
      });
    }

    const hasReuse = dnaComparisons.some((c) => c.is_reuse_suspected && (c.doc_a_name === activeDoc?.file.name || c.doc_b_name === activeDoc?.file.name));
    if (hasReuse) {
      total += 15;
      items.push({
        category: "DOCUMENT DNA",
        points: 15,
        reason: "Cross-document structural DNA template reuse detected (≥80% similarity)",
        jump_target: "dna",
        severity: "MEDIUM"
      });
    }

    if (graphData?.conflicts && graphData.conflicts.length > 0) {
      total += 20;
      items.push({
        category: "IDENTITY CONFLICT",
        points: 20,
        reason: `Cross-document identity inconsistency in ${graphData.conflicts[0].field}`,
        jump_target: "graph",
        severity: "HIGH"
      });
    }

    const capped = Math.min(100, total);
    const level = capped >= 61 ? "HIGH_INVESTIGATION_RISK" : capped >= 26 ? "REVIEW_REQUIRED" : "LOW_RISK";

    return { total: capped, level, breakdown: items };
  };

  const riskResult = calculateRiskBreakdown();

  const handleJumpToEvidence = (target: string) => {
    if (target === "ela") {
      setViewMode("ela");
      setActiveTab("regions");
      addAuditLog("Jumped to ELA Forensic Heatmap from Risk Breakdown.", "info");
    } else if (target === "suspicious_regions") {
      setViewMode("suspicious_regions");
      setActiveTab("regions");
      addAuditLog("Jumped to Suspicious Region Viewer from Risk Breakdown.", "info");
    } else if (target === "security") {
      setActiveTab("security");
      addAuditLog("Jumped to Security Feature Intelligence from Risk Breakdown.", "info");
    } else if (target === "dna") {
      setActiveTab("dna");
      addAuditLog("Jumped to Document DNA Tab from Risk Breakdown.", "info");
    } else if (target === "graph") {
      setActiveTab("graph");
      addAuditLog("Jumped to Identity Relationship Graph from Risk Breakdown.", "info");
    }
  };

  const updateCaseStatus = async (newStatus: CaseDossier["status"]) => {
    addAuditLog(`Updating case status to: ${newStatus}`, "info");
    const nowStr = new Date().toLocaleTimeString();
    setCurrentCase((prev) => ({
      ...prev,
      status: newStatus,
      audit_trail: [
        {
          timestamp: nowStr,
          action: `Status transitioned to ${newStatus}.`,
          performed_by: prev.assigned_investigator
        },
        ...prev.audit_trail
      ]
    }));
  };

  const saveCaseNotes = () => {
    const nowStr = new Date().toLocaleTimeString();
    setCurrentCase((prev) => ({
      ...prev,
      notes: tempNotes,
      audit_trail: [
        {
          timestamp: nowStr,
          action: "Investigator remarks saved.",
          performed_by: prev.assigned_investigator
        },
        ...prev.audit_trail
      ]
    }));
    addAuditLog("Case notes updated.", "success");
  };

  const loadCleanDemo = () => {
    const doc = dataURLtoFile(generateSampleCleanImage("ALEXANDRA RIVERA", "14/08/1998", "PASS-8849201"), "Clean_Passport_Sample.png");
    processBatchFiles([doc]);
  };

  const loadManipulatedDemo = () => {
    const doc = dataURLtoFile(generateSampleManipulatedImage(), "Manipulated_ID_Card_Sample.png");
    processBatchFiles([doc]);
  };

  const loadMrzValidDemo = () => {
    const doc = dataURLtoFile(generateSampleMrzPassport(false), "Passport_Valid_MRZ.png");
    processBatchFiles([doc]);
  };

  const loadMrzTamperedDemo = () => {
    const doc = dataURLtoFile(generateSampleMrzPassport(true), "Passport_Tampered_MRZ.png");
    processBatchFiles([doc]);
  };

  const loadIdentityConflictDemo = () => {
    const doc1 = dataURLtoFile(generateSampleCleanImage("RAHUL KUMAR", "14/08/1998", "PASS-99201"), "Doc_A_Passport.png");
    const doc2 = dataURLtoFile(generateSampleCleanImage("RAHUL KUMAR", "02/11/2005", "DL-88492"), "Doc_B_Driver_License.png");
    processBatchFiles([doc1, doc2]);
  };

  const loadDnaReuseDemo = () => {
    const doc1 = dataURLtoFile(generateSampleCleanImage("RAHUL KUMAR", "12/05/2005", "ID-8849201-A"), "Template_Master_A.png");
    const doc2 = dataURLtoFile(generateSampleCleanImage("VIKRAM SINGH", "12/05/2005", "ID-8849201-B"), "Reused_Template_B.png");
    processBatchFiles([doc1, doc2]);
  };

  const loadDemo3Queue = () => {
    const doc1 = dataURLtoFile(generateSampleCleanImage("ALEXANDRA RIVERA", "14/08/1998", "PASS-8849201"), "Queue_1_Passport.png");
    const doc2 = dataURLtoFile(generateSampleCleanImage("ALEXANDRA RIVERA", "14/08/1998", "PAN-9920192"), "Queue_2_PAN_Card.png");
    const doc3 = dataURLtoFile(generateSampleCleanImage("ALEXANDRA RIVERA", "02/11/2005", "DL-1029384"), "Queue_3_Driver_License_OddOut.png");

    processBatchFiles([doc1, doc2, doc3]);
  };

  const openWebcam = async () => {
    setIsWebcamOpen(true);
    addAuditLog("Initializing camera stream with optical glare & focus pre-screening...", "info");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      addAuditLog("Live camera stream active. Frame analyzer engaged.", "success");

      // Start live glare & focus analyzer
      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = 160;
      sampleCanvas.height = 100;
      const sampleCtx = sampleCanvas.getContext("2d");

      if (cameraIntervalRef.current) clearInterval(cameraIntervalRef.current);
      cameraIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !sampleCtx) return;
        try {
          sampleCtx.drawImage(videoRef.current, 0, 0, 160, 100);
          const imgData = sampleCtx.getImageData(0, 0, 160, 100);
          const data = imgData.data;
          let totalLuma = 0;
          let glarePixels = 0;
          let diffSum = 0;

          for (let i = 0; i < data.length; i += 4) {
            const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            totalLuma += luma;
            if (luma > 240) glarePixels++;

            // Simple adjacent edge diff
            if (i > 4) {
              const prevLuma = 0.299 * data[i - 4] + 0.587 * data[i - 3] + 0.114 * data[i - 2];
              diffSum += Math.abs(luma - prevLuma);
            }
          }

          const pixelCount = 160 * 100;
          const glareFraction = glarePixels / pixelCount;
          const focusMetric = Math.round((diffSum / pixelCount) * 10);

          setCameraFocusScore(focusMetric);
          setIsCameraBlurry(focusMetric < 45);
          setHasCameraGlare(glareFraction > 0.08);
        } catch (e) {}
      }, 300);

    } catch (err: any) {
      addAuditLog(`Camera Access Error: ${err.message}`, "error");
    }
  };

  const closeWebcam = () => {
    if (cameraIntervalRef.current) {
      clearInterval(cameraIntervalRef.current);
      cameraIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsWebcamOpen(false);
    addAuditLog("Camera closed.", "info");
  };

  const captureWebcamFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `webcam_scan_${Date.now()}.png`, { type: "image/png" });
        closeWebcam();
        processBatchFiles([file]);
      }
    }, "image/png");
  };

  const runOcrForActive = async () => {
    if (!activeDoc) return;
    addAuditLog(`Running Tesseract OCR for ${activeDoc.file.name}...`, "info");
    try {
      const form = new FormData();
      form.append("file", activeDoc.file);
      const res = await axios.post(`${API_URL}/ocr`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const text = res.data.extracted_text;
      setBatchDocs((prev) =>
        prev.map((d) => (d.id === activeDoc.id ? { ...d, ocrText: text } : d))
      );
      addAuditLog("OCR Text extracted successfully.", "success");
    } catch (err: any) {
      addAuditLog(`OCR Failed: ${err.message}`, "error");
    }
  };

  const updateActiveRect = (newRect: Partial<BatchDoc["rect"]>) => {
    if (!activeDoc) return;
    const updatedRect = { ...activeDoc.rect, ...newRect };
    setBatchDocs((prev) =>
      prev.map((d) => (d.id === activeDoc.id ? { ...d, rect: updatedRect } : d))
    );
  };

  const selectRegion = (region: SuspiciousRegion) => {
    const regId = region.region_id || region.id;
    setSelectedRegionId(regId);
    const b = region.bbox || { x: region.x, y: region.y, width: region.width, height: region.height };
    updateActiveRect(b);
    setViewMode("suspicious_regions");
    setActiveTab("regions");
    setZoomLevel(1.55);

    if (canvasRef.current) {
      const cW = canvasRef.current.width;
      const cH = canvasRef.current.height;
      const regCenterX = b.x + b.width / 2;
      const regCenterY = b.y + b.height / 2;
      setPanOffset({
        x: Math.round((cW / 2 - regCenterX) * 0.45),
        y: Math.round((cH / 2 - regCenterY) * 0.45),
      });
    }

    addAuditLog(`Focused inspection on Potentially Manipulated Region ${regId} (${region.location_label || region.field})`, "warning");
  };

  // Render Canvas with Multi-Mode Overlays
  useEffect(() => {
    if (!activeDoc?.previewUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = activeDoc.previewUrl;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      if (viewMode === "original") {
        return;
      }

      if (viewMode === "analyzed") {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
        ctx.lineWidth = 1;
        const step = 40;
        for (let x = 0; x < canvas.width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(8, 8, 300, 26);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        ctx.fillText(`DNA: ${activeDoc.dna?.dna_id || "EXTRACTING"} | MESH: ${activeDoc.detection?.image_quality?.resolution || `${img.width}x${img.height}`}`, 16, 25);
      }

      if (viewMode === "heatmap") {
        if (activeDoc.elaUrl) {
          const elaImg = new Image();
          elaImg.src = activeDoc.elaUrl;
          const drawHeat = () => {
            ctx.drawImage(elaImg, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
            ctx.fillRect(8, 8, 350, 26);
            ctx.fillStyle = "#f59e0b";
            ctx.font = "bold 11px 'JetBrains Mono', monospace";
            ctx.fillText("AUTHENTIC ELA COMPRESSION HEATMAP (COLORMAP JET)", 14, 25);
          };
          if (elaImg.complete) {
            drawHeat();
          } else {
            elaImg.onload = drawHeat;
          }
        }
      }

      if (viewMode === "suspicious_regions") {
        const regions = activeDoc.detection?.suspicious_regions || [];
        const hasRegions = regions.length > 0;
        const rectsToDraw = hasRegions ? regions : (activeDoc.rect.width > 0 ? [{
          id: "region_01",
          region_id: "REGION #01",
          field: "Manual Area",
          location_label: "Custom Region",
          x: activeDoc.rect.x,
          y: activeDoc.rect.y,
          width: activeDoc.rect.width,
          height: activeDoc.rect.height,
          bbox: activeDoc.rect,
          suspicion_score: 85,
          severity: "HIGH" as const,
          potential_manipulation: "HIGH" as const,
          indicators: ["User flagged region"],
          explanation: "Custom manual bounding box"
        }] : []);

        if (rectsToDraw.length > 0) {
          ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          rectsToDraw.forEach((r) => {
            const b = r.bbox || { x: r.x, y: r.y, width: r.width, height: r.height };
            const rId = r.region_id || r.id;
            const isSelected = selectedRegionId === rId || (!hasRegions && rId === "REGION #01");

            // Clear original image beneath
            ctx.drawImage(img, b.x, b.y, b.width, b.height, b.x, b.y, b.width, b.height);

            // Red semi-transparent fill
            ctx.fillStyle = isSelected ? "rgba(244, 63, 94, 0.22)" : "rgba(244, 63, 94, 0.12)";
            ctx.fillRect(b.x, b.y, b.width, b.height);

            // Red Border / Rectangle
            ctx.strokeStyle = isSelected ? "#ef4444" : "#f43f5e";
            ctx.lineWidth = isSelected ? 4 : 3;
            ctx.strokeRect(b.x, b.y, b.width, b.height);

            // Corner grip anchor handles
            const gripSize = isSelected ? 9 : 7;
            ctx.fillStyle = isSelected ? "#ffffff" : "#fca5a5";
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 1.5;

            const corners = [
              [b.x - gripSize/2, b.y - gripSize/2],
              [b.x + b.width - gripSize/2, b.y - gripSize/2],
              [b.x - gripSize/2, b.y + b.height - gripSize/2],
              [b.x + b.width - gripSize/2, b.y + b.height - gripSize/2],
            ];
            corners.forEach(([cx, cy]) => {
              ctx.fillRect(cx, cy, gripSize, gripSize);
              ctx.strokeRect(cx, cy, gripSize, gripSize);
            });

            // Floating Red Badge
            const bannerHeight = 24;
            const labelY = b.y > (bannerHeight + 6) ? b.y - (bannerHeight + 6) : b.y + b.height + 4;
            const labelText = `⚠️ POTENTIALLY MANIPULATED: ${rId} (${r.location_label || r.field}) • ${r.suspicion_score || 91}%`;
            ctx.font = "bold 11px 'JetBrains Mono', monospace";
            const textMetrics = ctx.measureText(labelText);
            const bannerWidth = Math.max(b.width, textMetrics.width + 16);

            ctx.fillStyle = isSelected ? "#ef4444" : "rgba(225, 29, 72, 0.95)";
            ctx.fillRect(b.x, labelY, bannerWidth, bannerHeight);

            ctx.fillStyle = "#ffffff";
            ctx.fillText(labelText, b.x + 8, labelY + 16);
          });
        }
      }
    };
  }, [activeDoc?.previewUrl, activeDoc?.rect, activeDoc?.elaUrl, viewMode, selectedRegionId, activeDoc?.detection, activeDoc?.dna]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rectBounds = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rectBounds.width;
    const scaleY = canvasRef.current.height / rectBounds.height;
    const x = Math.round((e.clientX - rectBounds.left) * scaleX);
    const y = Math.round((e.clientY - rectBounds.top) * scaleY);
    return { x: Math.max(0, Math.min(x, canvasRef.current.width)), y: Math.max(0, Math.min(y, canvasRef.current.height)) };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    // Interactive Hit-Testing against existing suspicious regions
    const regions = activeDoc?.detection?.suspicious_regions || [];
    const clickedRegion = regions.find((r) => {
      const b = r.bbox || { x: r.x, y: r.y, width: r.width, height: r.height };
      return (
        coords.x >= b.x - 8 &&
        coords.x <= b.x + b.width + 8 &&
        coords.y >= b.y - 8 &&
        coords.y <= b.y + b.height + 8
      );
    });

    if (clickedRegion) {
      selectRegion(clickedRegion);
      return;
    }

    setIsDrawing(true);
    setDragStart(coords);
    updateActiveRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setCursorPos(coords);

    if (isDrawing && dragStart) {
      const x = Math.min(dragStart.x, coords.x);
      const y = Math.min(dragStart.y, coords.y);
      const width = Math.abs(coords.x - dragStart.x);
      const height = Math.abs(coords.y - dragStart.y);
      updateActiveRect({ x, y, width, height });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setDragStart(null);
    }
  };

  const exportBatchReport = () => {
    const reportData = {
      title: "AI Document Forensic & Identity Investigation Report",
      timestamp: new Date().toISOString(),
      caseDetails: currentCase,
      totalDocuments: batchDocs.length,
      additiveRisk: riskResult,
      securityFeatures: activeDoc?.security || null,
      forensicReasoning: activeDoc?.reasoning || [],
      identityConflicts: graphData?.conflicts || [],
      suspiciousClusters: graphData?.suspicious_clusters || [],
      documentDNA: activeDoc?.dna || null,
      dnaComparisons,
      suspiciousRegions: activeDoc?.detection?.suspicious_regions || [],
      fieldMatrix: identityCompare?.field_matrix || {},
      auditLogs
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `case_${currentCase.case_id}_dossier_${Date.now()}.json`;
    a.click();
    addAuditLog(`Case Dossier ${currentCase.case_id} exported as JSON.`, "success");
  };

  const strokeDashoffset = 340 - (340 * riskResult.total) / 100;
  const riskColor = riskResult.total > 60 ? "#f43f5e" : riskResult.total > 25 ? "#f59e0b" : "#10b981";
  const selectedRegion = activeDoc?.detection?.suspicious_regions?.find((r) => r.region_id === selectedRegionId) || activeDoc?.detection?.suspicious_regions?.[0] || null;

  return (
    <div className="app-container">
      {/* Live Webcam Modal */}
      {isWebcamOpen && (
        <div className="modal-overlay">
          <div className="webcam-modal-content">
            <div className="card-title" style={{ width: "100%", margin: 0 }}>
              <span className="icon-heading">
                <Camera size={20} className="text-emerald-400" /> Live Webcam Document Scanner
              </span>
              <button className="btn-secondary" onClick={closeWebcam}>
                <X size={16} /> Close
              </button>
            </div>

            <div className="webcam-viewport">
              {/* Feature 13: Live Camera HUD */}
              <div className="camera-hud">
                <div className={`camera-hud-badge ${hasCameraGlare ? "alert" : "success"}`}>
                  {hasCameraGlare ? (
                    <>
                      <AlertTriangle size={14} /> GLARE / SPECULAR REFLECTION: TILT DOC
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> LIGHTING BALANCED
                    </>
                  )}
                </div>

                <div className={`camera-hud-badge ${isCameraBlurry ? "warning" : "success"}`}>
                  {isCameraBlurry ? (
                    <>
                      <AlertCircle size={14} /> MOTION BLUR (FOCUS: {cameraFocusScore})
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> SHARP FOCUS ({cameraFocusScore})
                    </>
                  )}
                </div>
              </div>

              <video ref={videoRef} autoPlay playsInline className="webcam-video" />
              <div className="reticle-guide">
                <span className="reticle-guide-text">ALIGN IDENTITY DOCUMENT WITHIN GUIDE</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn-primary" onClick={captureWebcamFrame}>
                <Camera size={18} /> Capture & Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 14: Forensic Investigation Printable Report Modal */}
      {isReportOpen && (
        <div className="modal-overlay">
          <div className="report-modal-content">
            <div className="report-header-banner">
              <div>
                <div className="report-lab-title">NATIONAL IDENTITY FORENSICS LABORATORY</div>
                <div className="report-lab-subtitle">AUTOMATED DOCUMENT FRAUD SCREENING & AUDIT DOSSIER</div>
              </div>
              <div className="no-print" style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn-primary" onClick={() => window.print()}>
                  <Printer size={15} /> Print / Save PDF
                </button>
                <button className="btn-secondary" onClick={() => setIsReportOpen(false)}>
                  <X size={15} /> Close
                </button>
              </div>
            </div>

            <div className="report-grid-meta">
              <div><strong>Case Identifier:</strong> {currentCase.case_id}</div>
              <div><strong>Examination Date:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
              <div><strong>Lead Examiner:</strong> {currentCase.assigned_investigator}</div>
              <div><strong>Case Status:</strong> {currentCase.status}</div>
              <div><strong>Total Documents Examined:</strong> {batchDocs.length}</div>
              <div><strong>Primary Target:</strong> {activeDoc?.file.name || "None"}</div>
            </div>

            <div className="report-section-title">
              <span>Executive Risk Verdict</span>
              <span style={{ color: riskColor, fontWeight: "bold" }}>{riskResult.total} / 100 [{riskResult.level}]</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#334155", marginBottom: "1rem" }}>
              The automated multi-layer forensic examination engine evaluated optical texture, discrete cosine compression variances, high-frequency sensor noise, ICAO 9303 cryptographic check digits, and cross-document relational consistency.
            </p>

            <div className="report-section-title">Itemized Additive Risk Breakdown</div>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Forensic Evidence Finding</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {riskResult.breakdown.length > 0 ? (
                  riskResult.breakdown.map((b, i) => (
                    <tr key={i}>
                      <td><strong>{b.category}</strong></td>
                      <td>{b.reason}</td>
                      <td style={{ fontWeight: "bold", color: "#e11d48" }}>+{b.points}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "#16a34a" }}>0 Anomalies Flagged. Document passes all forensic checks.</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={2}><strong>Total Additive Risk Score</strong></td>
                  <td style={{ fontWeight: "bold", color: riskColor }}>= {riskResult.total} / 100</td>
                </tr>
              </tbody>
            </table>

            {/* Security Features Check */}
            {activeDoc?.security && (
              <>
                <div className="report-section-title">Cryptographic Security Features (ICAO 9303 / QR)</div>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Extracted Value / Checksum</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>ICAO 9303 MRZ Optical Zone</td>
                      <td>{activeDoc.security.mrz.has_mrz ? `${activeDoc.security.mrz.line1} | ${activeDoc.security.mrz.line2}` : "No MRZ on Document"}</td>
                      <td style={{ fontWeight: "bold", color: activeDoc.security.mrz.overall_status === "VERIFIED_AUTHENTIC" ? "#16a34a" : "#e11d48" }}>
                        {activeDoc.security.mrz.has_mrz ? activeDoc.security.mrz.overall_status : "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td>Machine Readable QR / Barcode</td>
                      <td>{activeDoc.security.qr_code.detected ? activeDoc.security.qr_code.details : "No Machine Readable Code"}</td>
                      <td style={{ fontWeight: "bold" }}>{activeDoc.security.qr_code.detected ? "DETECTED" : "ABSENT"}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {/* Examiner Remarks */}
            <div className="report-section-title">Investigator Remarks & Chain of Custody</div>
            <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.85rem", marginBottom: "1rem" }}>
              <strong>Notes:</strong> {currentCase.notes}
            </div>

            {/* Disclaimer */}
            <div className="report-disclaimer-box">
              <strong>OFFICIAL FORENSIC DISCLAIMER:</strong> This examination report is an automated intelligence decision-support document generated by the AI Document Forensic Investigation Engine. Findings represent mathematical, statistical, and cryptographic risk markers and should be corroborated with physical document examination by certified forensic document examiners prior to adverse administrative or legal action.
            </div>
          </div>
        </div>
      )}

      {/* Document Management: Deletion Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ isOpen: false, type: "single", count: 0, docNames: [] })}>
          <div
            className="cyber-card"
            style={{
              maxWidth: "480px",
              width: "90%",
              background: "#0f172a",
              border: "1px solid rgba(244, 63, 94, 0.4)",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.85)",
              padding: "1.5rem"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", color: "#f43f5e" }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                {deleteModal.type === "all"
                  ? "Remove All Documents?"
                  : deleteModal.type === "selected"
                  ? `Delete ${deleteModal.count} Selected Documents?`
                  : "Delete Document?"}
              </h3>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "0.8rem" }}>
              {deleteModal.type === "all" ? (
                <>
                  You are about to remove all <strong>{deleteModal.count} document(s)</strong> from current investigation <strong>{currentCase.case_id}</strong>.
                  <br /><br />
                  Associated forensic analysis, suspicious-region displays, and document-level results will no longer be available in this investigation view. This action cannot be undone.
                </>
              ) : (
                <>
                  You are about to remove <strong>{deleteModal.count} document(s)</strong> from this investigation.
                  <br /><br />
                  This will also remove their associated analysis results, OCR extractions, and risk contributions from the current investigation view.
                </>
              )}
            </p>

            {deleteModal.docNames.length > 0 && (
              <div style={{ background: "rgba(0, 0, 0, 0.35)", borderRadius: "6px", padding: "0.5rem 0.8rem", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "#94a3b8", maxHeight: "90px", overflowY: "auto", marginBottom: "1.2rem", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                {deleteModal.docNames.map((name, i) => (
                  <div key={i} style={{ padding: "2px 0" }}>• {name}</div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.8rem" }}>
              <button
                className="btn-secondary"
                onClick={() => setDeleteModal({ isOpen: false, type: "single", count: 0, docNames: [] })}
              >
                Cancel
              </button>
              <button
                className="btn-secondary danger"
                style={{ background: "#e11d48", color: "#ffffff", borderColor: "#e11d48", fontWeight: 700 }}
                onClick={confirmDeleteAction}
              >
                <Trash2 size={14} /> {deleteModal.type === "all" ? "Remove All" : "Remove Documents"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="header-bar">
        <div className="brand-section">
          <div className="brand-icon">
            <Cpu size={24} />
          </div>
          <div className="brand-text">
            <h1>AI Forensic Investigator</h1>
            <p>Identity & Document Fraud Screening Platform</p>
          </div>
        </div>

        {/* Feature 11 & 14: Case Management Header Bar */}
        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
          <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "0.3rem 0.8rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Briefcase size={14} className="text-cyan-400" />
            <span style={{ fontSize: "0.82rem", fontWeight: "bold", fontFamily: "var(--font-mono)", color: "#38bdf8" }}>
              {currentCase.case_id}
            </span>
            <span style={{ color: "var(--border-color)" }}>|</span>
            <select
              value={currentCase.status}
              onChange={(e) => updateCaseStatus(e.target.value as CaseDossier["status"])}
              style={{ background: "transparent", color: currentCase.status === "SUSPECTED_FRAUD_ESCALATED" ? "#f43f5e" : currentCase.status === "VERIFIED_AUTHENTIC" ? "#10b981" : "#f59e0b", border: "none", fontSize: "0.75rem", fontWeight: "bold", cursor: "pointer", outline: "none" }}
            >
              <option value="OPEN_INVESTIGATION" style={{ background: "#0f172a", color: "#f8fafc" }}>OPEN INVESTIGATION</option>
              <option value="UNDER_REVIEW" style={{ background: "#0f172a", color: "#f8fafc" }}>UNDER REVIEW</option>
              <option value="EVIDENCE_FLAGGED" style={{ background: "#0f172a", color: "#f8fafc" }}>EVIDENCE FLAGGED</option>
              <option value="VERIFIED_AUTHENTIC" style={{ background: "#0f172a", color: "#10b981" }}>VERIFIED AUTHENTIC</option>
              <option value="SUSPECTED_FRAUD_ESCALATED" style={{ background: "#0f172a", color: "#f43f5e" }}>SUSPECTED FRAUD ESCALATED</option>
              <option value="CLOSED_RESOLVED" style={{ background: "#0f172a", color: "#94a3b8" }}>CLOSED RESOLVED</option>
            </select>
          </div>

          <button className="btn-primary" onClick={() => setIsReportOpen(true)}>
            <Printer size={15} /> Forensic Report (Print / PDF)
          </button>

          {batchDocs.length > 0 && (
            <button className="btn-secondary" onClick={exportBatchReport}>
              <Download size={15} /> Export JSON
            </button>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <div className="main-grid">
        {/* Left Column - Document Ingestion & Interactive Forensic Viewer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Upload & Demo Presets */}
          <div className="cyber-card">
            <div className="card-title">
              <span className="icon-heading">
                <UploadCloud size={20} className="text-cyan-400" /> Document Acquisition
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Drag & Drop or Live Scan</span>
            </div>

            <label className="dropzone">
              <input type="file" accept="image/*" multiple className="file-input-hidden" onChange={handleFileChange} />
              <div className="dropzone-icon">
                <UploadCloud size={28} />
              </div>
              <div className="dropzone-text">Click or Drag & Drop Documents for Forensic Analysis</div>
              <div className="dropzone-subtext">Supports Passports (MRZ), IDs, PAN Card, Driving License</div>
            </label>

            <div className="upload-actions-row">
              <button className="btn-secondary btn-camera" style={{ width: "100%" }} onClick={openWebcam}>
                <Camera size={16} /> Open Live Cam Scanner
              </button>
            </div>

            <div className="sample-presets">
              <span className="sample-label">Synthetic Test Scenarios:</span>
              <button className="preset-btn" onClick={loadCleanDemo}>
                <CheckCircle2 size={14} className="text-emerald-400" /> Scenario 1: Clean Document (0 Regions)
              </button>
              <button className="preset-btn tampered" style={{ borderColor: "#f43f5e" }} onClick={loadManipulatedDemo}>
                <Crosshair size={14} className="text-rose-400" /> Scenario 2: Synthetically Altered (Spliced Name)
              </button>
              <button className="preset-btn tampered" style={{ borderColor: "#f43f5e" }} onClick={loadMrzTamperedDemo}>
                <FileKey2 size={14} className="text-rose-400" /> Scenario 3: Passport MRZ Tampering
              </button>
              <button className="preset-btn tampered" style={{ borderColor: "#38bdf8" }} onClick={loadDnaReuseDemo}>
                <Dna size={14} className="text-cyan-400" /> Scenario 4: Template Reuse Ring (DNA)
              </button>
              <button className="preset-btn tampered" style={{ borderColor: "#f59e0b" }} onClick={loadIdentityConflictDemo}>
                <UserX size={14} className="text-amber-400" /> Scenario 5: Identity Conflict (DOB Mismatch)
              </button>
            </div>
          </div>

          {/* Batch Document Queue Cards */}
          {batchDocs.length === 0 ? (
            <div className="cyber-card">
              <div className="batch-empty-card">
                <FileText size={44} style={{ color: "var(--text-muted)", opacity: 0.6 }} />
                <h4>No Documents in Investigation</h4>
                <p>No documents are currently attached to this case. Upload or scan document images above to begin forensic fraud screening.</p>
                <label htmlFor="file-upload-input" className="btn-primary" style={{ cursor: "pointer", display: "inline-flex" }}>
                  <UploadCloud size={16} /> Upload Document
                </label>
              </div>
            </div>
          ) : (
            <div className="cyber-card">
              <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem" }}>
                <span className="icon-heading">
                  <Files size={20} /> Investigation Documents ({batchDocs.length})
                </span>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {!isSelectMode ? (
                    <>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
                        onClick={() => setIsSelectMode(true)}
                        title="Enter document selection mode"
                      >
                        <CheckSquare size={13} /> Select
                      </button>
                      <button
                        className="btn-secondary danger"
                        style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
                        onClick={promptRemoveAllDocs}
                        title="Remove all documents from current investigation"
                      >
                        <Trash2 size={13} /> Remove All
                      </button>
                    </>
                  ) : (
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.78rem", color: "#38bdf8", fontFamily: "var(--font-mono)", fontWeight: 700, marginRight: "0.3rem" }}>
                        {selectedDocIds.length} of {batchDocs.length} selected
                      </span>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: "0.72rem", padding: "0.3rem 0.6rem" }}
                        onClick={selectAllDocs}
                      >
                        {selectedDocIds.length === batchDocs.length ? "Deselect All" : "Select All"}
                      </button>
                      <button
                        className="btn-secondary danger"
                        style={{ fontSize: "0.72rem", padding: "0.3rem 0.6rem" }}
                        disabled={selectedDocIds.length === 0}
                        onClick={promptDeleteSelectedDocs}
                      >
                        <Trash2 size={13} /> Delete Selected ({selectedDocIds.length})
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: "0.72rem", padding: "0.3rem 0.6rem" }}
                        onClick={() => {
                          setIsSelectMode(false);
                          setSelectedDocIds([]);
                        }}
                      >
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="batch-grid">
                {batchDocs.map((item, index) => {
                  const isOddDoc = identityCompare?.odd_document_index === index && identityCompare.discrepancy_type !== "LOW_CONFIDENCE_REVIEW";
                  const isMrzBad = item.security?.mrz?.has_mrz && item.security.mrz.overall_status === "POTENTIAL_MRZ_INCONSISTENCY";
                  const isTampered = item.detection?.manipulated || item.rect.width > 0 || isOddDoc || isMrzBad;
                  const isActive = item.id === activeDoc?.id;
                  const isDocSelected = selectedDocIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`batch-card ${isActive ? "active" : ""} ${isDocSelected ? "selected" : ""} ${isTampered ? "tampered" : "clean"}`}
                      onClick={() => {
                        if (isSelectMode) {
                          toggleSelectDoc(item.id);
                        } else {
                          setActiveDocId(item.id);
                        }
                      }}
                      style={{ position: "relative" }}
                    >
                      {/* Top Action Overlay: Select Checkbox & Individual Delete Button */}
                      <div
                        className="batch-card-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isSelectMode ? (
                          <label className="doc-select-checkbox-container" title={isDocSelected ? "Deselect" : "Select"}>
                            <input
                              type="checkbox"
                              checked={isDocSelected}
                              onChange={() => toggleSelectDoc(item.id)}
                              className="doc-select-checkbox"
                            />
                          </label>
                        ) : <div />}

                        <button
                          className="doc-card-delete-btn"
                          title="Remove this document from investigation"
                          onClick={(e) => {
                            e.stopPropagation();
                            promptDeleteSingleDoc(item.id);
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      <img src={item.previewUrl} alt={item.file.name} className="batch-thumb" />
                      <div className="batch-name" title={item.file.name}>{item.file.name}</div>
                      <div style={{ fontSize: "0.65rem", color: "#38bdf8", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                        {item.dna?.dna_id || "DNA SCANNING"}
                      </div>
                      <div className={`batch-badge ${isTampered ? "tampered" : "clean"}`}>
                        {isMrzBad ? "⚠️ MRZ ANOMALY" : isOddDoc ? "⚠️ ODD OUTLIER" : isTampered ? "POTENTIAL MANIPULATION" : "AUTHENTIC"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Forensic Image Viewer */}
          {activeDoc ? (
            <div className="cyber-card">
              <div className="card-title">
                <span className="icon-heading">
                  <Eye size={20} /> Forensic Viewer – <span style={{ color: "var(--accent-cyan)" }}>{activeDoc.file.name}</span>
                </span>
                <div className="mode-toggles">
                  <button
                    className={`toggle-btn ${viewMode === "original" ? "active" : ""}`}
                    onClick={() => setViewMode("original")}
                  >
                    ORIGINAL
                  </button>
                  <button
                    className={`toggle-btn ${viewMode === "suspicious_regions" ? "active" : ""}`}
                    onClick={() => setViewMode("suspicious_regions")}
                    style={{
                      borderColor: viewMode === "suspicious_regions" ? "#f43f5e" : undefined,
                      color: viewMode === "suspicious_regions" ? "#f43f5e" : undefined
                    }}
                  >
                    <Crosshair size={13} className="text-rose-400" /> POTENTIALLY MANIPULATED REGIONS
                  </button>
                  {activeDoc.elaUrl && (
                    <button
                      className={`toggle-btn ${viewMode === "ela" ? "active" : ""}`}
                      onClick={() => setViewMode("ela")}
                    >
                      <Flame size={13} className="text-amber-400" /> FORENSIC / ELA VIEW
                    </button>
                  )}
                  <button
                    className={`toggle-btn ${viewMode === "heatmap" ? "active" : ""}`}
                    onClick={() => setViewMode("heatmap")}
                  >
                    HEATMAP
                  </button>
                </div>
              </div>

              <div className="inspector-viewport">
                {isScanning && <div className="scanning-line" />}
                
                {viewMode === "ela" ? (
                  <img src={activeDoc.elaUrl} alt="ELA Heatmap" style={{ maxHeight: "460px", borderRadius: "6px" }} />
                ) : (
                  <div className="canvas-wrapper" style={{ transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`, transformOrigin: "center", transition: "transform 0.2s ease-out" }}>
                    <canvas
                      ref={canvasRef}
                      className="inspector-canvas"
                      style={{ cursor: "crosshair" }}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                    />
                  </div>
                )}
              </div>

              <div className="viewer-controls">
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button className="btn-secondary" onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5))}>
                    <ZoomIn size={14} /> Zoom In
                  </button>
                  <button className="btn-secondary" onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75))}>
                    <ZoomOut size={14} /> Zoom Out
                  </button>
                  <button className="btn-secondary" onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}>
                    <RotateCcw size={14} /> Reset
                  </button>
                </div>
                <div className="pixel-coords">
                  X: {cursorPos.x}px | Y: {cursorPos.y}px | Zoom: {Math.round(zoomLevel * 100)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="cyber-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
              <FileText size={40} style={{ margin: "0 auto 0.75rem", color: "var(--text-muted)", opacity: 0.6 }} />
              <h3 style={{ fontSize: "1.1rem", color: "var(--text-main)", marginBottom: "0.4rem" }}>No Document Selected</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "420px", margin: "0 auto" }}>
                Select a document from the investigation queue above or upload a new identity document to begin forensic inspection.
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Forensics Analysis & Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Active Document Risk Gauge Card */}
          <div className="cyber-card">
            <div className="card-title">
              <span className="icon-heading">
                <Activity size={20} /> Explainable Risk Assessment
              </span>
              <span style={{ fontSize: "0.75rem", color: riskColor, fontWeight: "bold" }}>
                {riskResult.level}
              </span>
            </div>

            <div className="risk-meter-container">
              <div className="score-circle-wrapper">
                <svg className="score-circle-svg" viewBox="0 0 120 120">
                  <circle className="score-circle-bg" cx="60" cy="60" r="54" />
                  <circle
                    className="score-circle-bar"
                    cx="60"
                    cy="60"
                    r="54"
                    stroke={riskColor}
                    strokeDasharray="340"
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="score-center-text">
                  <span className="score-number" style={{ color: riskColor }}>
                    {riskResult.total}
                  </span>
                  <span className="score-label">RISK SCORE</span>
                </div>
              </div>

              {activeDoc ? (
                <div className={`verdict-badge ${riskResult.total > 25 ? "tampered" : "clean"}`}>
                  {riskResult.total > 25 ? (
                    <>
                      <AlertTriangle size={16} /> POTENTIAL MANIPULATION
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> VERIFIED COHERENT
                    </>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Upload documents to view risk verdict
                </div>
              )}
            </div>

            {/* Feature 10: Explainable Additive Risk Breakdown Table */}
            <div style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "bold", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                <span>Itemized Risk Breakdown (Click row to inspect)</span>
                <span>Points</span>
              </div>
              {riskResult.breakdown.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {riskResult.breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleJumpToEvidence(item.jump_target)}
                      style={{
                        background: "rgba(15, 23, 42, 0.6)",
                        border: "1px solid var(--border-color)",
                        borderRadius: 6,
                        padding: "0.5rem 0.7rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "#38bdf8"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#f8fafc" }}>
                          {item.reason}
                        </span>
                        <span style={{ fontSize: "0.68rem", color: "#38bdf8", textTransform: "uppercase" }}>
                          {item.category} • Click to inspect layer ➔
                        </span>
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#f43f5e", fontFamily: "var(--font-mono)" }}>
                        +{item.points}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "bold", color: riskColor, borderTop: "1px dashed var(--border-color)", paddingTop: "0.4rem", marginTop: "0.2rem" }}>
                    <span>Total Additive Risk</span>
                    <span>= {riskResult.total} / 100</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "0.78rem", color: "var(--accent-emerald)", padding: "0.5rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: 6, textAlign: "center" }}>
                  0 Risk Flags Detected. Document passes all forensic and cryptographic layers.
                </div>
              )}
            </div>
          </div>

          {/* Console Tabs Card */}
          <div className="cyber-card">
            <div className="tabs-header">
              <button
                className={`tab-btn ${activeTab === "regions" ? "active" : ""}`}
                onClick={() => setActiveTab("regions")}
                style={{
                  borderColor: (activeDoc?.detection?.suspicious_regions?.length || 0) > 0 ? "rgba(244, 63, 94, 0.4)" : undefined,
                  color: (activeDoc?.detection?.suspicious_regions?.length || 0) > 0 ? "#fca5a5" : undefined
                }}
              >
                <Crosshair size={14} className={(activeDoc?.detection?.suspicious_regions?.length || 0) > 0 ? "text-rose-400" : ""} />
                Potentially Manipulated Regions {(activeDoc?.detection?.suspicious_regions?.length || 0) > 0 ? `(${activeDoc?.detection?.suspicious_regions?.length})` : ""}
              </button>
              <button
                className={`tab-btn ${activeTab === "timeline" ? "active" : ""}`}
                onClick={() => setActiveTab("timeline")}
              >
                <Clock size={14} /> Timeline
              </button>
              <button
                className={`tab-btn ${activeTab === "case" ? "active" : ""}`}
                onClick={() => setActiveTab("case")}
              >
                <Briefcase size={14} /> Case Dossier
              </button>
              <button
                className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
                onClick={() => setActiveTab("security")}
              >
                <FileKey2 size={14} /> Security
              </button>
              <button
                className={`tab-btn ${activeTab === "reasoning" ? "active" : ""}`}
                onClick={() => setActiveTab("reasoning")}
              >
                <Award size={14} /> Reasoning
              </button>
              <button
                className={`tab-btn ${activeTab === "graph" ? "active" : ""}`}
                onClick={() => setActiveTab("graph")}
              >
                <Network size={14} /> Graph
              </button>
              <button
                className={`tab-btn ${activeTab === "dna" ? "active" : ""}`}
                onClick={() => setActiveTab("dna")}
              >
                <Dna size={14} /> DNA
              </button>
              <button
                className={`tab-btn ${activeTab === "ocr" ? "active" : ""}`}
                onClick={() => setActiveTab("ocr")}
              >
                <FileText size={14} /> OCR
              </button>
              <button
                className={`tab-btn ${activeTab === "audit" ? "active" : ""}`}
                onClick={() => setActiveTab("audit")}
              >
                <Activity size={14} /> Audit
              </button>
            </div>

            {/* Tab 1: Potentially Manipulated Regions */}
            {activeTab === "regions" && (
              <div>
                {activeDoc?.detection?.suspicious_regions && activeDoc.detection.suspicious_regions.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Flagged Suspicious Regions ({activeDoc.detection.suspicious_regions.length})
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#f43f5e", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        CLICK TO ZOOM & INSPECT
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {activeDoc.detection.suspicious_regions.map((region) => {
                        const rId = region.region_id || region.id;
                        const isCurSelected = selectedRegionId === rId;
                        return (
                          <button
                            key={rId}
                            className={`preset-btn ${isCurSelected ? "tampered" : ""}`}
                            style={{
                              borderColor: isCurSelected ? "#ef4444" : "var(--border-color)",
                              background: isCurSelected ? "rgba(244, 63, 94, 0.25)" : "rgba(30, 41, 59, 0.6)",
                              boxShadow: isCurSelected ? "0 0 10px rgba(244, 63, 94, 0.4)" : "none"
                            }}
                            onClick={() => selectRegion(region)}
                          >
                            <Crosshair size={12} className="text-rose-400" /> {rId}: {region.location_label || region.field}
                          </button>
                        );
                      })}
                    </div>

                    {selectedRegion && (
                      <div className="manipulated-region-detail">
                        <div className="region-header-row">
                          <span className="region-id-badge">
                            {selectedRegion.region_id || selectedRegion.id}
                          </span>
                          <span className={`severity-badge ${(selectedRegion.severity || selectedRegion.potential_manipulation || "HIGH").toLowerCase()}`}>
                            Potential Manipulation: {selectedRegion.severity || selectedRegion.potential_manipulation}
                          </span>
                        </div>

                        <div className="detail-row">
                          <span className="detail-label">Suspicion Score:</span>
                          <span className="score-value">{selectedRegion.suspicion_score || 91} / 100</span>
                        </div>
                        <div className="score-bar-track">
                          <div className="score-bar-fill" style={{ width: `${selectedRegion.suspicion_score || 91}%` }} />
                        </div>

                        <div className="detail-row">
                          <span className="detail-label">Location:</span>
                          <span className="location-value">{selectedRegion.location_label || `${selectedRegion.field} field`}</span>
                        </div>

                        <div className="detail-row">
                          <span className="detail-label">Original Image Coordinates:</span>
                          <span className="coords-value">
                            x: {selectedRegion.x || selectedRegion.bbox?.x}, y: {selectedRegion.y || selectedRegion.bbox?.y}, w: {selectedRegion.width || selectedRegion.bbox?.width}, h: {selectedRegion.height || selectedRegion.bbox?.height}
                          </span>
                        </div>

                        <div className="evidence-section">
                          <strong>Evidence:</strong>
                          <ul>
                            {selectedRegion.indicators && selectedRegion.indicators.length > 0 ? (
                              selectedRegion.indicators.map((ind, i) => (
                                <li key={i}>• {ind}</li>
                              ))
                            ) : (
                              <li>• Local compression inconsistency</li>
                            )}
                          </ul>
                        </div>

                        <div className="interpretation-box">
                          <strong>Interpretation:</strong>
                          <p>
                            "{selectedRegion.explanation || 'This region contains image characteristics that differ from nearby regions and should be reviewed for possible manipulation.'}"
                          </p>
                        </div>

                        <button
                          className="btn-secondary"
                          style={{ width: "100%", justifyContent: "center", borderColor: "rgba(244, 63, 94, 0.4)", color: "#fca5a5" }}
                          onClick={() => selectRegion(selectedRegion)}
                        >
                          <ZoomIn size={14} /> Zoom & Center in Forensic Viewer
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="clean-document-banner">
                    <CheckCircle2 size={36} className="text-emerald-400" />
                    <h4>No Major Manipulation Indicators Detected</h4>
                    <p>
                      Forensic inspection indicates consistent discrete cosine compression, uniform background sensor noise, and coherent document substrate.
                    </p>
                    <div className="badge-clean">AUTHENTIC DOCUMENT BASELINE</div>
                  </div>
                )}
              </div>
            )}

            {/* Feature 12: Forensic Investigation Timeline */}
            {activeTab === "timeline" && (
              <div style={{ maxHeight: "380px", overflowY: "auto", paddingRight: "0.5rem" }}>
                <div className="forensic-timeline">
                  {/* Step 1: Document Acquisition */}
                  <div className="timeline-node">
                    <div className="timeline-marker verified">
                      <Check size={12} className="text-emerald-400" />
                    </div>
                    <div className="timeline-header">
                      <span className="timeline-title">1. Document Acquisition</span>
                      <span className="timeline-badge verified">ACQUIRED</span>
                    </div>
                    <div className="timeline-body">
                      Source: {activeDoc?.file.name || "Queue"} | Resolution: {activeDoc?.detection?.image_quality?.resolution || "Standard"} | Ingestion: Local File / Webcam Stream
                    </div>
                  </div>

                  {/* Step 2: Image Quality Assessment */}
                  <div className="timeline-node">
                    <div className="timeline-marker verified">
                      <Check size={12} className="text-emerald-400" />
                    </div>
                    <div className="timeline-header">
                      <span className="timeline-title">2. Optical Quality & Sharpness</span>
                      <span className="timeline-badge verified">PRE-SCREENED</span>
                    </div>
                    <div className="timeline-body">
                      Sharpness: {activeDoc?.detection?.image_quality?.sharpness || 85}% | Contrast: {activeDoc?.detection?.image_quality?.contrast || 65}% | Brightness: {activeDoc?.detection?.image_quality?.brightness || 120}
                    </div>
                  </div>

                  {/* Step 3: EXIF Metadata Analysis */}
                  <div className="timeline-node">
                    <div className={`timeline-marker ${activeDoc?.detection?.metadata_forensics?.software_detected ? "anomaly" : "verified"}`}>
                      {activeDoc?.detection?.metadata_forensics?.software_detected ? <AlertTriangle size={12} className="text-rose-400" /> : <Check size={12} className="text-emerald-400" />}
                    </div>
                    <div className="timeline-header">
                      <span className="timeline-title">3. EXIF & Software Signatures</span>
                      <span className={`timeline-badge ${activeDoc?.detection?.metadata_forensics?.software_detected ? "anomaly" : "verified"}`}>
                        {activeDoc?.detection?.metadata_forensics?.software_detected ? "TOOL DETECTED" : "UNALTERED EXIF"}
                      </span>
                    </div>
                    <div className="timeline-body">
                      Software Tag: {activeDoc?.detection?.metadata_forensics?.software_detected || "None (Hardware Camera RAW/Direct)"}
                    </div>
                  </div>

                  {/* Step 4: Localized Compression & Noise */}
                  <div className="timeline-node">
                    <div className={`timeline-marker ${(activeDoc?.detection?.compression_forensics?.compression_variance_score || 0) > 25 || activeDoc?.detection?.noise_forensics?.anomaly_detected ? "anomaly" : "verified"}`}>
                      {(activeDoc?.detection?.compression_forensics?.compression_variance_score || 0) > 25 || activeDoc?.detection?.noise_forensics?.anomaly_detected ? <AlertTriangle size={12} className="text-rose-400" /> : <Check size={12} className="text-emerald-400" />}
                    </div>
                    <div className="timeline-header">
                      <span className="timeline-title">4. Compression & Noise Forensics</span>
                      <span className={`timeline-badge ${(activeDoc?.detection?.compression_forensics?.compression_variance_score || 0) > 25 ? "anomaly" : "verified"}`}>
                        {(activeDoc?.detection?.compression_forensics?.compression_variance_score || 0) > 25 ? "ELA ANOMALY" : "HOMOGENEOUS"}
                      </span>
                    </div>
                    <div className="timeline-body">
                      ELA Compression Variance: {activeDoc?.detection?.compression_forensics?.compression_variance_score || 0}% | Sensor Noise Anomaly: {activeDoc?.detection?.noise_forensics?.anomaly_detected ? "Detected (>2.8σ)" : "Nominal"}
                    </div>
                  </div>

                  {/* Step 5: OCR Extraction */}
                  <div className="timeline-node">
                    <div className="timeline-marker verified">
                      <Check size={12} className="text-emerald-400" />
                    </div>
                    <div className="timeline-header">
                      <span className="timeline-title">5. OCR Extraction & Fields</span>
                      <span className="timeline-badge verified">EXTRACTED</span>
                    </div>
                    <div className="timeline-body">
                      Status: {activeDoc?.ocrText ? "Tesseract OCR Completed" : "Visual bounding box mapped"}
                    </div>
                  </div>

                  {/* Step 6: Security Features & Checksum */}
                  <div className="timeline-node">
                    <div className={`timeline-marker ${activeDoc?.security?.mrz.overall_status === "POTENTIAL_MRZ_INCONSISTENCY" ? "anomaly" : "verified"}`}>
                      {activeDoc?.security?.mrz.overall_status === "POTENTIAL_MRZ_INCONSISTENCY" ? <AlertTriangle size={12} className="text-rose-400" /> : <Check size={12} className="text-emerald-400" />}
                    </div>
                    <div className="timeline-header">
                      <span className="timeline-title">6. Cryptographic Security (ICAO MRZ)</span>
                      <span className={`timeline-badge ${activeDoc?.security?.mrz.overall_status === "POTENTIAL_MRZ_INCONSISTENCY" ? "anomaly" : "verified"}`}>
                        {activeDoc?.security?.mrz.has_mrz ? activeDoc.security.mrz.overall_status : "PASSED (NON-MRZ)"}
                      </span>
                    </div>
                    <div className="timeline-body">
                      Modulus 10 Checksum: {activeDoc?.security?.mrz.parsed_fields?.document_number_valid ? "Valid" : "Failed check digit calculation"}
                    </div>
                  </div>

                  {/* Step 7: Document DNA & Template Reuse */}
                  <div className="timeline-node">
                    <div className="timeline-marker verified">
                      <Check size={12} className="text-emerald-400" />
                    </div>
                    <div className="timeline-header">
                      <span className="timeline-title">7. Document DNA Fingerprinting</span>
                      <span className="timeline-badge verified">INDEXED</span>
                    </div>
                    <div className="timeline-body">
                      Visual Hash: {activeDoc?.dna?.visual_fingerprint?.substring(0, 16) || "Extracted"}...
                    </div>
                  </div>

                  {/* Step 8: Additive Risk Scoring */}
                  <div className="timeline-node">
                    <div className={`timeline-marker ${riskResult.total > 25 ? "anomaly" : "verified"}`}>
                      {riskResult.total > 25 ? <AlertTriangle size={12} className="text-rose-400" /> : <Check size={12} className="text-emerald-400" />}
                    </div>
                    <div className="timeline-header">
                      <span className="timeline-title">8. Risk Engine Evaluation</span>
                      <span className={`timeline-badge ${riskResult.total > 60 ? "anomaly" : riskResult.total > 25 ? "warning" : "verified"}`}>
                        {riskResult.level}
                      </span>
                    </div>
                    <div className="timeline-body">
                      Final Score: {riskResult.total} / 100 ({riskResult.breakdown.length} risk factor contributions itemized)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Digital Case Management Dossier (Feature 11) */}
            {activeTab === "case" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "0.8rem", fontSize: "0.8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.4rem", marginBottom: "0.4rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Case Identifier:</span>
                    <span style={{ fontWeight: "bold", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>{currentCase.case_id}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.4rem", marginBottom: "0.4rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Lead Examiner:</span>
                    <span style={{ fontWeight: "bold", color: "var(--text-main)" }}>{currentCase.assigned_investigator}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.4rem", marginBottom: "0.4rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Intake Date:</span>
                    <span>{currentCase.created_at}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Documents in Queue:</span>
                    <span style={{ fontWeight: "bold", color: "#a5f3fc" }}>{currentCase.documents.length} item(s)</span>
                  </div>
                </div>

                {/* Notes Input Area */}
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.3rem" }}>
                    Examiner Field Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    style={{ width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid var(--border-color)", borderRadius: 6, color: "#f8fafc", padding: "0.5rem", fontSize: "0.8rem", outline: "none", resize: "vertical" }}
                    placeholder="Enter observations, suspected forgery mechanics, or physical inspection notes..."
                  />
                  <button className="btn-secondary" style={{ marginTop: "0.4rem", width: "100%" }} onClick={saveCaseNotes}>
                    <Save size={14} /> Save Examiner Remarks to Case Dossier
                  </button>
                </div>

                {/* Case Audit History */}
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>
                    Case Audit Chain of Custody:
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", maxHeight: "120px", overflowY: "auto" }}>
                    {currentCase.audit_trail.map((at, idx) => (
                      <div key={idx} style={{ background: "rgba(15, 23, 42, 0.5)", border: "1px solid var(--border-color)", padding: "0.4rem 0.6rem", borderRadius: 4, fontSize: "0.72rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-dim)", marginBottom: "0.1rem" }}>
                          <span>{at.performed_by}</span>
                          <span>{at.timestamp}</span>
                        </div>
                        <div style={{ color: "var(--text-main)" }}>{at.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Security Features */}
            {activeTab === "security" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {activeDoc?.security ? (
                  <>
                    <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "0.8rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#38bdf8", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Binary size={16} /> ICAO 9303 Machine Readable Zone (MRZ)
                        </span>
                        <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: 8, fontWeight: "bold", background: activeDoc.security.mrz.overall_status === "VERIFIED_AUTHENTIC" ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)", color: activeDoc.security.mrz.overall_status === "VERIFIED_AUTHENTIC" ? "#10b981" : "#f43f5e" }}>
                          {activeDoc.security.mrz.has_mrz ? activeDoc.security.mrz.overall_status : "NO MRZ DETECTED"}
                        </span>
                      </div>

                      {activeDoc.security.mrz.has_mrz && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.78rem" }}>
                          <div style={{ background: "#020617", padding: "0.4rem", borderRadius: 4, fontFamily: "var(--font-mono)", color: "#a5f3fc" }}>
                            <div>{activeDoc.security.mrz.line1}</div>
                            <div>{activeDoc.security.mrz.line2}</div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginTop: "0.2rem" }}>
                            <div>Doc Num Valid: <strong style={{ color: activeDoc.security.mrz.parsed_fields?.document_number_valid ? "#10b981" : "#f43f5e" }}>{activeDoc.security.mrz.parsed_fields?.document_number_valid ? "VALID" : "INVALID"}</strong></div>
                            <div>DOB Checksum: <strong style={{ color: activeDoc.security.mrz.parsed_fields?.date_of_birth_valid ? "#10b981" : "#f43f5e" }}>{activeDoc.security.mrz.parsed_fields?.date_of_birth_valid ? "VALID" : "INVALID"}</strong></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
                    Inspecting Security Features...
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: AI Evidence Reasoning */}
            {activeTab === "reasoning" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {activeDoc?.reasoning && activeDoc.reasoning.length > 0 ? (
                  activeDoc.reasoning.map((r, i) => (
                    <div key={i} style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: 10, padding: "0.8rem", fontSize: "0.8rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <span style={{ fontWeight: "bold", color: "#38bdf8", fontSize: "0.85rem" }}>
                          {r.finding}
                        </span>
                        <span style={{ background: "rgba(56, 189, 248, 0.2)", color: "#a5f3fc", padding: "2px 6px", borderRadius: 6, fontWeight: "bold", fontSize: "0.72rem" }}>
                          CONFIDENCE: {r.confidence}%
                        </span>
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                        {r.scientific_basis.join(" ")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
                    No anomalous forensic findings registered for this document.
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Identity Relationship Graph */}
            {activeTab === "graph" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {graphData && graphData.nodes.length > 0 ? (
                  <div style={{ height: "200px", background: "rgba(10, 15, 29, 0.9)", borderRadius: 10, border: "1px solid var(--border-color)" }}>
                    <svg width="100%" height="100%" viewBox="0 0 400 200">
                      {graphData.nodes.map((n, idx) => (
                        <circle
                          key={n.id}
                          cx={idx % 2 === 0 ? 100 : 300}
                          cy={40 + (idx * 20)}
                          r={10}
                          fill={n.is_conflict ? "#f43f5e" : "#38bdf8"}
                        />
                      ))}
                    </svg>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
                    Upload 2+ documents to view Identity Graph.
                  </div>
                )}
              </div>
            )}

            {/* Tab 6: Document DNA */}
            {activeTab === "dna" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {activeDoc?.dna ? (
                  <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: 10, padding: "0.8rem", fontSize: "0.8rem" }}>
                    <div style={{ color: "#38bdf8", fontWeight: "bold", marginBottom: "0.4rem" }}>{activeDoc.dna.dna_id}</div>
                    <code style={{ fontSize: "0.72rem", color: "#a5f3fc" }}>{activeDoc.dna.visual_fingerprint}</code>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>Generating Document DNA...</div>
                )}
              </div>
            )}

            {/* Tab 7: OCR Analysis */}
            {activeTab === "ocr" && (
              <div>
                <button className="btn-primary" style={{ width: "100%", marginBottom: "1rem" }} onClick={runOcrForActive} disabled={!activeDoc}>
                  <FileText size={16} /> Extract OCR Text (Tesseract)
                </button>
                {activeDoc?.ocrText && <div className="ocr-box">{activeDoc.ocrText}</div>}
              </div>
            )}

            {/* Tab 8: Audit Logs */}
            {activeTab === "audit" && (
              <div className="audit-list">
                {auditLogs.map((log, index) => (
                  <div key={index} className={`audit-item ${log.status === "error" ? "error" : ""}`}>
                    <span className="audit-msg">{log.action}</span>
                    <span className="audit-time">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
