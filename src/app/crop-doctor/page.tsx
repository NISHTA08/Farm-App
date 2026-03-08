"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import Button from "@/components/ui/Button";
import {
  Camera,
  Upload,
  Leaf,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Microscope,
  Sparkles,
  History,
  Trash2,
  Clock,
} from "lucide-react";

interface DiagnosisResult {
  disease: string;
  confidence: number;
  crop: string;
  severity: "low" | "moderate" | "severe";
  description: string;
  symptoms: string[];
  treatment: {
    immediate: string[];
    organic: string[];
    chemical: string[];
    prevention: string[];
  };
}

interface ScanRecord {
  id: string;
  timestamp: number;
  thumbnail: string;
  result: DiagnosisResult;
}

const HISTORY_KEY = "khethai-scan-history";

function loadHistory(): ScanRecord[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}

function saveHistory(records: ScanRecord[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, 20))); } catch {}
}

export default function CropDoctorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>("immediate");
  const [tab, setTab] = useState<"scan" | "history">("scan");
  const [history, setHistory] = useState<ScanRecord[]>([]);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setImage(ev.target?.result as string); setResult(null); setError(""); };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!image) return;
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/analyze-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Analysis failed. Please try again.");
        return;
      }
      setResult(data);

      const canvas = document.createElement("canvas");
      canvas.width = 120; canvas.height = 90;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, 120, 90);
        const thumb = canvas.toDataURL("image/jpeg", 0.5);
        const record: ScanRecord = { id: `s-${Date.now()}`, timestamp: Date.now(), thumbnail: thumb, result: data };
        const updated = [record, ...loadHistory()].slice(0, 20);
        saveHistory(updated);
        setHistory(updated);
      };
      img.src = image;
    } catch {
      setError("Could not analyze. Check connection and try again.");
    } finally { setAnalyzing(false); }
  }, [image]);

  const handleReset = () => { setImage(null); setResult(null); setError(""); };

  const severityConfig = {
    low: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Low" },
    moderate: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Moderate" },
    severe: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Severe" },
  };

  const treatmentSections = [
    { key: "immediate" as const, label: "Immediate Actions", icon: "🚨" },
    { key: "organic" as const, label: "Organic Treatment", icon: "🌿" },
    { key: "chemical" as const, label: "Chemical Treatment", icon: "🧪" },
    { key: "prevention" as const, label: "Prevention", icon: "🛡️" },
  ];

  return (
    <div className="min-h-screen bg-kh-bg pb-28 relative overflow-hidden">
      <div className="orb w-[350px] h-[350px] bg-emerald-600/20 -top-40 -right-20 animate-glow" />

      <header className="relative z-10 px-6 pt-6 pb-2">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Microscope size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="font-display text-display-sm text-kh-text">AI Crop Doctor</h1>
            <p className="text-body-xs text-kh-text-dim flex items-center gap-1">
              <Sparkles size={10} className="text-kh-accent" />
              Powered by Groq AI
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="relative z-10 max-w-lg mx-auto px-6 mt-4 mb-4">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04]">
          <button onClick={() => setTab("scan")}
            className={`flex-1 py-2 rounded-lg text-body-sm font-medium transition-all ${tab === "scan" ? "gradient-accent text-black" : "text-kh-text-dim hover:text-kh-text-muted"}`}>
            Scan
          </button>
          <button onClick={() => setTab("history")}
            className={`flex-1 py-2 rounded-lg text-body-sm font-medium transition-all flex items-center justify-center gap-1.5 ${tab === "history" ? "gradient-accent text-black" : "text-kh-text-dim hover:text-kh-text-muted"}`}>
            <History size={14} /> History {history.length > 0 && <span className="text-body-xs">({history.length})</span>}
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6">
        {tab === "history" ? (
          <div className="animate-fade-in">
            {history.length === 0 ? (
              <div className="glow-card bg-kh-card p-10 text-center">
                <Clock size={32} className="text-kh-text-dim mx-auto mb-3" />
                <p className="text-body-md text-kh-text-muted mb-1">No scan history</p>
                <p className="text-body-xs text-kh-text-dim">Your past diagnoses will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((rec, i) => {
                  const sev = severityConfig[rec.result.severity];
                  return (
                    <div key={rec.id} className="glow-card bg-kh-card p-3.5 flex items-center gap-3 animate-scale-in" style={{ animationDelay: `${i * 40}ms` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={rec.thumbnail} alt="" className="w-14 h-11 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-body-sm font-semibold text-kh-text truncate">{rec.result.disease}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-body-xs text-kh-text-dim">{rec.result.crop}</span>
                          <span className={`text-body-xs font-medium ${sev.color}`}>{rec.result.confidence}%</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${sev.bg} ${sev.color}`}>
                          {sev.label}
                        </span>
                        <p className="text-[10px] text-kh-text-dim mt-1">{new Date(rec.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => { saveHistory([]); setHistory([]); }}
                  className="w-full py-3 text-body-xs text-kh-text-dim hover:text-red-400 flex items-center justify-center gap-1.5 transition-colors">
                  <Trash2 size={12} /> Clear History
                </button>
              </div>
            )}
          </div>
        ) : !image ? (
          <div className="animate-fade-in">
            {/* Upload area */}
            <div className="glow-card glow-green bg-kh-card p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
                <Leaf size={32} className="text-emerald-400 animate-float" />
              </div>
              <h2 className="font-display text-display-md text-kh-text mb-2">
                Scan Your Crop
              </h2>
              <p className="text-body-sm text-kh-text-dim mb-8 max-w-[240px] mx-auto">
                Take a clear photo of the affected leaf or plant
              </p>

              <div className="flex flex-col gap-3">
                <Button fullWidth size="lg" onClick={() => cameraInputRef.current?.click()} icon={<Camera size={18} />}>
                  Open Camera
                </Button>
                <Button fullWidth size="lg" variant="outline" onClick={() => fileInputRef.current?.click()} icon={<Upload size={18} />}>
                  Upload Photo
                </Button>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-4 glow-card bg-kh-card p-5">
              <h3 className="text-body-xs text-kh-text-dim uppercase tracking-wider mb-3">Tips for best results</h3>
              <div className="grid grid-cols-2 gap-3">
                {["Natural light", "Focus on leaf", "Include healthy parts", "6-12 inch distance"].map((tip, i) => (
                  <div key={i} className="flex items-center gap-2 text-body-xs text-kh-text-muted">
                    <CheckCircle size={12} className="text-kh-accent shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in space-y-4">
            {/* Image preview */}
            <div className="glow-card bg-kh-card overflow-hidden">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Crop photo" className="w-full aspect-[4/3] object-cover" />
                {analyzing && (
                  <div className="absolute inset-0 bg-kh-bg/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-2 border-kh-accent/20 rounded-full" />
                      <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-kh-accent rounded-full animate-spin" />
                      <Sparkles size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-kh-accent" />
                    </div>
                    <p className="text-body-md text-kh-text font-medium">Analyzing with AI...</p>
                    <p className="text-body-xs text-kh-text-dim">This may take a few seconds</p>
                  </div>
                )}
              </div>
            </div>

            {!result && !analyzing && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset} icon={<RotateCcw size={16} />}>Retake</Button>
                <Button fullWidth onClick={handleAnalyze} icon={<Sparkles size={16} />}>Analyze with AI</Button>
              </div>
            )}

            {error && (
              <div className="glow-card bg-red-500/5 p-4 border border-red-500/20 rounded-2xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-body-sm text-red-400">{error}</p>
                    <button onClick={handleAnalyze} className="text-body-xs text-red-400/70 hover:text-red-400 underline mt-1">Try again</button>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-3 animate-slide-up">
                {/* Disease header */}
                <div className={`glow-card bg-kh-card p-5 ${result.severity === "severe" ? "glow-amber" : "glow-green"}`}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-body-xs text-kh-text-dim uppercase tracking-wider mb-1">Detected Disease</p>
                      <h3 className="font-display text-display-md text-kh-text">{result.disease}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-body-xs font-semibold uppercase border ${severityConfig[result.severity].bg} ${severityConfig[result.severity].color}`}>
                      {severityConfig[result.severity].label}
                    </span>
                  </div>
                  <div className="flex gap-6 text-body-sm">
                    <div><span className="text-kh-text-dim">Crop</span> <span className="text-kh-text ml-1">{result.crop}</span></div>
                    <div><span className="text-kh-text-dim">Confidence</span> <span className="text-kh-accent font-semibold ml-1">{result.confidence}%</span></div>
                  </div>
                </div>

                <div className="glow-card bg-kh-card p-5">
                  <p className="text-body-sm text-kh-text-secondary leading-relaxed">{result.description}</p>
                </div>

                {result.symptoms.length > 0 && (
                  <div className="glow-card bg-kh-card p-5">
                    <h4 className="text-body-sm font-semibold text-kh-text mb-3">Symptoms</h4>
                    <ul className="space-y-2">
                      {result.symptoms.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-body-sm text-kh-text-muted">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {treatmentSections.map(({ key, label, icon }) => {
                  const items = result.treatment[key];
                  if (!items.length) return null;
                  const isOpen = expandedSection === key;
                  return (
                    <button key={key} onClick={() => setExpandedSection(isOpen ? null : key)} className="w-full glow-card bg-kh-card p-5 text-left transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-body-md">{icon}</span>
                          <h4 className="text-body-sm font-semibold text-kh-text">{label}</h4>
                        </div>
                        {isOpen ? <ChevronUp size={16} className="text-kh-text-dim" /> : <ChevronDown size={16} className="text-kh-text-dim" />}
                      </div>
                      {isOpen && (
                        <ul className="mt-3 space-y-2">
                          {items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-body-sm text-kh-text-muted">
                              <CheckCircle size={13} className="text-kh-accent mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  );
                })}

                <Button fullWidth variant="outline" onClick={handleReset} icon={<RotateCcw size={16} />}>Scan Another Crop</Button>
              </div>
            )}
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />

      <BottomNav />
    </div>
  );
}
