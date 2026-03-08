"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useI18n } from "@/lib/i18n/context";
import {
  Sprout,
  Plus,
  Calendar,
  Ruler,
  Trash2,
  Check,
  Leaf,
  AlertCircle,
  MapPin,
  Map,
  RotateCcw,
} from "lucide-react";
import type { MapCenter, BoundaryPoint } from "@/components/FarmMapEditor";

function FarmMapEditorLoading() {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-kh-border bg-kh-surface flex items-center justify-center text-kh-text-dim text-body-sm" style={{ height: "320px" }}>
      {t.farm.loadingMap}
    </div>
  );
}

const FarmMapEditor = dynamic(() => import("@/components/FarmMapEditor"), {
  ssr: false,
  loading: () => <FarmMapEditorLoading />,
});

interface CropZone {
  id: string;
  name: string;
  crop: string;
  area: string;
  unit: "acres" | "hectares";
  /** Optional: expected harvest in kg (legacy or computed from qty+unit). */
  expectedYieldKg?: string;
  /** Optional: expected yield quantity (number of kg / quintals / plants). */
  expectedYieldQty?: string;
  /** Optional: unit for expectedYieldQty. */
  expectedYieldUnit?: ExpectedYieldUnit;
  plantingDate: string;
  expectedHarvest: string;
  health: "healthy" | "attention" | "critical";
  notes: string;
  boundary?: BoundaryPoint[];
}

interface FarmProfile {
  totalArea: string;
  unit: "acres" | "hectares";
  location: string;
  zones: CropZone[];
  mapCenter: MapCenter;
  boundary: BoundaryPoint[];
  boundarySaved?: boolean;
}

const DEFAULT_MAP_CENTER: MapCenter = { lat: 20.5937, lng: 78.9629 };

const FARM_KEY = "khethai-farm-data";
const defaultFarm: FarmProfile = {
  totalArea: "",
  unit: "acres",
  location: "",
  zones: [],
  mapCenter: DEFAULT_MAP_CENTER,
  boundary: [],
};

function getHealthConfig(t: ReturnType<typeof useI18n>["t"]) {
  return {
    healthy: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", label: t.farm.healthy, dot: "bg-emerald-400" },
    attention: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", label: t.farm.attention, dot: "bg-amber-400" },
    critical: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", label: t.farm.critical, dot: "bg-red-400" },
  };
}

const crops = ["Rice", "Wheat", "Cotton", "Sugarcane", "Maize", "Tomato", "Potato", "Onion", "Soybean", "Groundnut"];

/** Township-style: crop label + color for plot cards and selector */
const CROP_META: Record<string, { color: string; short?: string }> = {
  Rice: { color: "#84cc16", short: "Rice" },
  Wheat: { color: "#eab308", short: "Wheat" },
  Cotton: { color: "#a78bfa", short: "Cotton" },
  Sugarcane: { color: "#f97316", short: "Sugarcane" },
  Maize: { color: "#facc15", short: "Maize" },
  Tomato: { color: "#ef4444", short: "Tomato" },
  Potato: { color: "#78716c", short: "Potato" },
  Onion: { color: "#fbbf24", short: "Onion" },
  Soybean: { color: "#22c55e", short: "Soybean" },
  Groundnut: { color: "#d97706", short: "Groundnut" },
};

/** Typical yield (tonnes per hectare) for Indian conditions – for estimated value. */
const CROP_YIELD_T_PER_HA: Record<string, number> = {
  Rice: 4,
  Wheat: 3,
  Cotton: 0.4,
  Sugarcane: 70,
  Maize: 3,
  Tomato: 25,
  Potato: 22,
  Onion: 16,
  Soybean: 1.2,
  Groundnut: 1.5,
};

/** Approximate kg per plant/unit for "number of crops" → yield. */
const CROP_KG_PER_PLANT: Record<string, number> = {
  Rice: 0.02,
  Wheat: 0.05,
  Cotton: 0.15,
  Sugarcane: 0.5,
  Maize: 0.25,
  Tomato: 0.15,
  Potato: 0.5,
  Onion: 0.1,
  Soybean: 0.01,
  Groundnut: 0.02,
};

const EXPECTED_YIELD_UNITS = ["kg", "quintals", "plants"] as const;
type ExpectedYieldUnit = (typeof EXPECTED_YIELD_UNITS)[number];

function getZoneProgress(zone: CropZone): { progressPct: number; hasDates: boolean } {
  if (!zone.plantingDate || !zone.expectedHarvest) return { progressPct: 0, hasDates: false };
  const start = new Date(zone.plantingDate).getTime();
  const end = new Date(zone.expectedHarvest).getTime();
  const now = Date.now();
  if (end <= start) return { progressPct: 100, hasDates: true };
  if (now <= start) return { progressPct: 0, hasDates: true };
  if (now >= end) return { progressPct: 100, hasDates: true };
  const progressPct = Math.round(((now - start) / (end - start)) * 100);
  return { progressPct, hasDates: true };
}

function areaToHectares(areaStr: string, unit: "acres" | "hectares"): number {
  const a = parseFloat(areaStr?.replace(/,/g, "") || "0");
  if (!a || isNaN(a)) return 0;
  return unit === "hectares" ? a : a * 0.404686;
}

/** Yield in kg for a zone: from expectedYieldQty+Unit, else expectedYieldKg (legacy), else area × yield per ha. */
function getYieldKgForZone(zone: CropZone): number {
  if (zone.expectedYieldUnit) {
    // Use displayed quantity (qty input or legacy kg) so unit dropdown always affects the result
    const raw = (zone.expectedYieldQty ?? zone.expectedYieldKg ?? "").replace(/,/g, "").trim();
    const q = parseFloat(raw || "0");
    if (q <= 0) return 0;
    if (zone.expectedYieldUnit === "kg") return q;
    if (zone.expectedYieldUnit === "quintals") return q * 100;
    if (zone.expectedYieldUnit === "plants") return q * (CROP_KG_PER_PLANT[zone.crop] ?? 0.2);
    return 0;
  }
  const manual = parseFloat(zone.expectedYieldKg?.replace(/,/g, "") || "0");
  if (manual > 0) return manual;
  const ha = areaToHectares(zone.area, zone.unit);
  const yieldT = CROP_YIELD_T_PER_HA[zone.crop];
  if (!ha || !yieldT) return 0;
  return ha * yieldT * 1000;
}

interface MandiPriceRow {
  crop: string;
  modal_price: number;
}

export default function FarmPage() {
  const { t } = useI18n();
  const [farm, setFarm] = useState<FarmProfile>(defaultFarm);
  const healthConfig = getHealthConfig(t);
  const [showAdd, setShowAdd] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [mandiPrices, setMandiPrices] = useState<MandiPriceRow[]>([]);
  const [mandiLoading, setMandiLoading] = useState(false);
  const [newZone, setNewZone] = useState({
    name: "",
    crop: "",
    area: "",
    unit: "acres" as const,
    expectedYieldQty: "",
    expectedYieldUnit: "plants" as ExpectedYieldUnit,
    plantingDate: "",
    expectedHarvest: "",
    health: "healthy" as const,
    notes: "",
    boundary: [] as BoundaryPoint[],
  });
  const [cropYieldOverride, setCropYieldOverride] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const s = localStorage.getItem(FARM_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        setFarm({
          ...defaultFarm,
          ...parsed,
          mapCenter: parsed.mapCenter || defaultFarm.mapCenter,
          boundary: Array.isArray(parsed.boundary) ? parsed.boundary : [],
          boundarySaved: !!parsed.boundarySaved,
          zones: (parsed.zones || []).map((z: CropZone) => ({
            ...z,
            boundary: Array.isArray(z.boundary) ? z.boundary : [],
          })),
        });
      }
    } catch {}
    setMounted(true);
  }, []);

  const fetchMandiPrices = useCallback(async () => {
    if (farm.zones.length === 0) return;
    setMandiLoading(true);
    try {
      const res = await fetch("/api/mandi");
      const data = await res.json();
      if (data?.prices?.length) {
        setMandiPrices(data.prices.map((p: { crop: string; modal_price: number }) => ({ crop: p.crop, modal_price: p.modal_price })));
      }
    } catch {
      setMandiPrices([]);
    } finally {
      setMandiLoading(false);
    }
  }, [farm.zones.length]);

  useEffect(() => {
    if (mounted && farm.zones.length > 0 && mandiPrices.length === 0 && !mandiLoading) {
      fetchMandiPrices();
    }
  }, [mounted, farm.zones.length, mandiPrices.length, mandiLoading, fetchMandiPrices]);

  function getPriceForCrop(cropName: string): number | null {
    const c = cropName.toLowerCase();
    const alias: Record<string, string[]> = {
      rice: ["rice", "paddy"],
      wheat: ["wheat"],
      cotton: ["cotton", "kapas"],
      sugarcane: ["sugarcane", "sugar"],
      maize: ["maize", "corn"],
      tomato: ["tomato"],
      potato: ["potato"],
      onion: ["onion"],
      soybean: ["soybean", "soya"],
      groundnut: ["groundnut", "peanut", "moongphali"],
    };
    const keys = alias[c] || [c];
    const found = mandiPrices.find((p) => keys.some((k) => p.crop.toLowerCase().includes(k)));
    return found ? found.modal_price : null;
  }

  function getEstimatedValue(zone: CropZone): number | null {
    const yieldKg = getYieldKgForZone(zone);
    if (!yieldKg) return null;
    const price = getPriceForCrop(zone.crop);
    if (price == null) return null;
    return Math.round(yieldKg * price);
  }

  const save = useCallback((f: FarmProfile) => {
    setFarm(f);
    try { localStorage.setItem(FARM_KEY, JSON.stringify(f)); } catch {}
  }, []);

  const addZone = () => {
    if (!newZone.name || !newZone.crop || newZone.boundary.length < 3) return;
    const { boundary, ...rest } = newZone;
    save({
      ...farm,
      zones: [...farm.zones, { ...rest, id: `z-${Date.now()}`, boundary }],
    });
    setNewZone({
      name: "",
      crop: "",
      area: "",
      unit: "acres",
      expectedYieldQty: "",
      expectedYieldUnit: "plants",
      plantingDate: "",
      expectedHarvest: "",
      health: "healthy",
      notes: "",
      boundary: [],
    });
  };

  const deleteZone = (id: string) => save({ ...farm, zones: farm.zones.filter((z) => z.id !== id) });
  const updateHealth = (id: string, h: CropZone["health"]) => save({ ...farm, zones: farm.zones.map((z) => z.id === id ? { ...z, health: h } : z) });
  const updateZone = (id: string, patch: Partial<CropZone>) =>
    save({ ...farm, zones: farm.zones.map((z) => z.id === id ? { ...z, ...patch } : z) });

  // Yield (kg) and value by crop; support per-crop override for "reduce and check"
  const computedYieldKgByCrop: Record<string, number> = {};
  const computedValueByCrop: Record<string, number> = {};
  for (const z of farm.zones) {
    const yieldKg = getYieldKgForZone(z);
    const v = getEstimatedValue(z);
    if (yieldKg > 0) computedYieldKgByCrop[z.crop] = (computedYieldKgByCrop[z.crop] ?? 0) + yieldKg;
    if (v != null) computedValueByCrop[z.crop] = (computedValueByCrop[z.crop] ?? 0) + v;
  }
  const cropList = Array.from(new Set(farm.zones.map((z) => z.crop)));
  const hasZonesWithAreaAndCrop = farm.zones.some((z) => {
    const hasQty = z.expectedYieldQty != null && z.expectedYieldUnit && parseFloat(z.expectedYieldQty || "0") > 0;
    const hasKg = parseFloat(z.expectedYieldKg || "0") > 0;
    return (areaToHectares(z.area, z.unit) && CROP_YIELD_T_PER_HA[z.crop]) || hasQty || hasKg;
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-kh-bg pb-28 relative overflow-hidden">
      <div className="orb w-[300px] h-[300px] bg-violet-600/20 -top-28 -left-16 animate-glow" />

      <header className="relative z-10 px-6 pt-6 pb-2">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Sprout size={20} className="text-violet-400" />
          </div>
          <h1 className="font-display text-display-sm text-kh-text">{t.farm.title}</h1>
        </div>
      </header>

      <div className="relative z-10 max-w-lg mx-auto px-6 mt-4 space-y-3">
        {/* Step 1: Draw & save farm boundary */}
        <div className="glow-card glow-violet bg-kh-card p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-body-xs text-kh-text-dim uppercase tracking-wider flex items-center gap-2">
              <Map size={14} />
              {farm.boundarySaved ? "Your farm" : "1. Draw farm boundary"}
            </h2>
            {farm.boundarySaved && (
              <span className="px-2.5 py-1 rounded-full text-body-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Check size={12} /> Saved
              </span>
            )}
          </div>
          {!farm.boundarySaved ? (
            <>
              <p className="text-body-xs text-kh-text-dim mb-3">
                Use &quot;Use my location&quot;, then tap the map to add points. Drag to move; tap a point to remove. Need at least 3 points, then <strong className="text-kh-text">Save boundary</strong>.
              </p>
              <FarmMapEditor
                center={farm.mapCenter}
                boundary={farm.boundary}
                onCenterChange={(c) => save({ ...farm, mapCenter: c })}
                onBoundaryChange={(b) => save({ ...farm, boundary: b })}
                onRemovePoint={(index) => save({ ...farm, boundary: farm.boundary.filter((_, i) => i !== index) })}
                zoneBoundaries={[]}
                height="280px"
                isDrawing={true}
                boundaryLocked={false}
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" variant="secondary" onClick={() => {
                  if (!navigator.geolocation) { setLocationStatus("error"); return; }
                  setLocationStatus("loading");
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      save({ ...farm, mapCenter: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
                      setLocationStatus("success");
                      setTimeout(() => setLocationStatus("idle"), 3000);
                    },
                    () => { setLocationStatus("error"); setTimeout(() => setLocationStatus("idle"), 4000); },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                  );
                }} icon={<MapPin size={14} />}>
                  {locationStatus === "loading" ? "Finding…" : "Use my location"}
                </Button>
                {farm.boundary.length > 0 && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => save({ ...farm, boundary: farm.boundary.slice(0, -1) })} icon={<RotateCcw size={14} />}>Undo</Button>
                    <Button size="sm" variant="ghost" onClick={() => save({ ...farm, boundary: [] })} icon={<Trash2 size={14} />}>Clear</Button>
                  </>
                )}
                {farm.boundary.length >= 3 && (
                  <Button size="sm" variant="primary" onClick={() => save({ ...farm, boundarySaved: true })} icon={<Check size={14} />}>
                    Save boundary
                  </Button>
                )}
              </div>
              {locationStatus === "success" && <p className="text-body-xs text-emerald-400 mt-2">Location updated.</p>}
              {locationStatus === "error" && <p className="text-body-xs text-amber-400 mt-2">Allow location access and try again.</p>}
              {farm.boundary.length > 0 && farm.boundary.length < 3 && (
                <p className="text-body-xs text-kh-text-dim mt-2">Add {3 - farm.boundary.length} more point{farm.boundary.length === 2 ? "" : "s"} to save.</p>
              )}
            </>
          ) : (
            <>
              <p className="text-body-xs text-kh-text-dim mb-3">Your saved farm on the map. Edit boundary below to change it.</p>
              <FarmMapEditor
                center={farm.mapCenter}
                boundary={farm.boundary}
                onCenterChange={(c) => save({ ...farm, mapCenter: c })}
                onBoundaryChange={() => {}}
                zoneBoundaries={[]}
                height="280px"
                isDrawing={false}
                boundaryLocked={true}
                fitBoundsToBoundary={true}
                planViewOnly={false}
              />
              <Button size="sm" variant="ghost" className="mt-3" onClick={() => save({ ...farm, boundarySaved: false })} icon={<RotateCcw size={14} />}>
                Edit boundary
              </Button>
            </>
          )}
        </div>

        {/* Step 2: Plan crops — fixed outline on black, place dots on outline */}
        <div className="glow-card bg-kh-card p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-body-xs text-kh-text-dim uppercase tracking-wider">2. Plan your crops</h2>
            {farm.boundarySaved && (
              <div className="flex gap-2">
                {showAdd ? (
                  <Button size="sm" variant="secondary" onClick={() => setShowAdd(false)}>Done</Button>
                ) : (
                  <Button size="sm" variant="primary" onClick={() => setShowAdd(true)} icon={<Plus size={14} />}>Add crop area</Button>
                )}
              </div>
            )}
          </div>
          {!farm.boundarySaved ? (
            <p className="text-body-sm text-kh-text-dim py-4 text-center">Save your farm boundary above first, then you can add crop areas here.</p>
          ) : showAdd ? (
            /* Add flow: draw area on map → choose crop (color) → save. Then add another or Done. */
            <div className="space-y-5 animate-slide-up">
              <p className="text-body-xs text-kh-text-dim">Draw an area (boundary) for this crop, choose the crop type (each has a different color), then save. You can add multiple areas — one per crop or several for the same crop.</p>
              <div>
                <h3 className="text-body-sm font-semibold text-kh-text mb-1">1. Draw the area on the map</h3>
                <p className="text-body-xs text-kh-text-dim mb-2">Tap on the map inside the green farm boundary to add points (at least 3). The dashed shape is the area you’re adding.</p>
                <FarmMapEditor
                  center={farm.mapCenter}
                  boundary={farm.boundary}
                  onCenterChange={(c) => save({ ...farm, mapCenter: c })}
                  onBoundaryChange={() => {}}
                  activeZoneBoundary={newZone.boundary}
                  onActiveZoneBoundaryChange={(b) => setNewZone((prev) => ({ ...prev, boundary: b }))}
                  zoneBoundaries={farm.zones.filter((z) => z.boundary && z.boundary.length >= 3).map((z) => ({ id: z.id, name: z.name, crop: z.crop, boundary: z.boundary!, health: z.health }))}
                  height="220px"
                  isDrawing={false}
                  isDrawingZone={true}
                  boundaryLocked={true}
                  fitBoundsToBoundary={true}
                  planViewOnly={true}
                />
                {newZone.boundary.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap items-center">
                    <button type="button" onClick={() => setNewZone((prev) => ({ ...prev, boundary: prev.boundary.slice(0, -1) }))} className="text-body-xs text-kh-text-dim hover:text-kh-text">Undo</button>
                    <button type="button" onClick={() => setNewZone((prev) => ({ ...prev, boundary: [] }))} className="text-body-xs text-amber-400 hover:underline">Clear</button>
                    <span className="text-body-xs text-kh-text-dim">{newZone.boundary.length} points</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-body-sm font-semibold text-kh-text mb-2">2. Choose crop (color identifies it on the map)</h3>
                <Input label="Area name" placeholder="e.g. North field" value={newZone.name} onChange={(e) => setNewZone((prev) => ({ ...prev, name: e.target.value }))} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                  {crops.map((c) => {
                    const meta = CROP_META[c] || { color: "#64748b" };
                    const selected = newZone.crop === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewZone((prev) => ({ ...prev, crop: c }))}
                        className={`rounded-xl p-3 text-left border-2 transition-all flex items-center gap-2
                          ${selected ? "border-kh-accent bg-emerald-500/15 shadow-lg shadow-emerald-500/10" : "border-kh-border bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"}`}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                        <span className={`text-body-sm font-medium truncate ${selected ? "text-kh-text" : "text-kh-text-muted"}`}>{c}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-body-xs text-kh-text-dim mb-1 block">Area (optional)</label>
                  <input type="number" placeholder="0" value={newZone.area} onChange={(e) => setNewZone((prev) => ({ ...prev, area: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-kh-surface border border-kh-border rounded-lg text-body-sm text-kh-text min-h-[44px]" />
                </div>
                <div>
                  <label className="text-body-xs text-kh-text-dim mb-1 block">Unit</label>
                  <select value={newZone.unit} onChange={(e) => setNewZone((prev) => ({ ...prev, unit: e.target.value as "acres" | "hectares" }))}
                    className="w-full px-3 py-2.5 bg-kh-surface border border-kh-border rounded-lg text-body-sm text-kh-text min-h-[44px] [color-scheme:dark]">
                    <option value="acres">acres</option>
                    <option value="hectares">hectares</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-body-xs text-kh-text-dim mb-1 block">{t.farm.expectedYield} (optional)</label>
                <div className="flex gap-2">
                  <input type="number" min={0} placeholder="e.g. 100" value={newZone.expectedYieldQty} onChange={(e) => setNewZone((prev) => ({ ...prev, expectedYieldQty: e.target.value }))}
                    className="flex-1 px-3 py-2.5 bg-kh-surface border border-kh-border rounded-lg text-body-sm text-kh-text min-h-[44px] [color-scheme:dark]" />
                  <select value={newZone.expectedYieldUnit} onChange={(e) => setNewZone((prev) => ({ ...prev, expectedYieldUnit: e.target.value as ExpectedYieldUnit }))}
                    className="px-3 py-2.5 bg-kh-surface border border-kh-border rounded-lg text-body-sm text-kh-text min-h-[44px] [color-scheme:dark]">
                    <option value="kg">{t.farm.unitKg}</option>
                    <option value="quintals">{t.farm.unitQuintals}</option>
                    <option value="plants">{t.farm.unitPlants}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-body-xs text-kh-text-dim mb-1 block">Planted (optional)</label>
                  <input type="date" value={newZone.plantingDate} onChange={(e) => setNewZone((prev) => ({ ...prev, plantingDate: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-kh-surface border border-kh-border rounded-lg text-body-sm text-kh-text min-h-[44px] [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-body-xs text-kh-text-dim mb-1 block">Expected harvest (optional)</label>
                  <input type="date" value={newZone.expectedHarvest} onChange={(e) => setNewZone((prev) => ({ ...prev, expectedHarvest: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-kh-surface border border-kh-border rounded-lg text-body-sm text-kh-text min-h-[44px] [color-scheme:dark]" />
                </div>
              </div>
              <Button fullWidth onClick={addZone} icon={<Check size={14} />} disabled={!newZone.name || !newZone.crop || newZone.boundary.length < 3}>
                Save this crop area
              </Button>
            </div>
          ) : (
            <>
              {/* Fixed outline on black (second view) — always show when boundary saved */}
              <div className="mb-4">
                <FarmMapEditor
                  center={farm.mapCenter}
                  boundary={farm.boundary}
                  onCenterChange={(c) => save({ ...farm, mapCenter: c })}
                  onBoundaryChange={() => {}}
                  zoneBoundaries={farm.zones.filter((z) => z.boundary && z.boundary.length >= 3).map((z) => ({ id: z.id, name: z.name, crop: z.crop, boundary: z.boundary!, health: z.health }))}
                  height="220px"
                  isDrawing={false}
                  boundaryLocked={true}
                  fitBoundsToBoundary={true}
                  planViewOnly={true}
                />
              </div>
              {farm.zones.length === 0 ? (
                <div className="py-6 text-center">
                  <h3 className="font-display text-display-sm text-kh-text mb-2">Add crop areas</h3>
                  <p className="text-body-sm text-kh-text-dim mb-6 max-w-[260px] mx-auto">Draw an area for each crop. Each crop has a different color so you can see Rice, Wheat, etc. on the map.</p>
                  <Button onClick={() => setShowAdd(true)} icon={<Plus size={14} />}>Add crop area</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {farm.zones.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 py-2 px-3 rounded-lg bg-kh-surface/60 border border-kh-border">
                      <span className="text-body-xs text-kh-text-dim w-full sm:w-auto">Crop colors:</span>
                      {Array.from(new Set(farm.zones.map((z) => z.crop))).map((crop) => {
                        const meta = CROP_META[crop] || { color: "#64748b" };
                        return (
                          <span key={crop} className="text-body-xs text-kh-text-muted flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                            {crop}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {farm.zones.length > 0 && mandiPrices.length === 0 && !mandiLoading && (
                    <div className="flex items-center justify-between gap-2 mb-2 p-3 rounded-lg bg-kh-surface/80 border border-kh-border">
                      <span className="text-body-xs text-kh-text-muted">{t.farm.loadPricesToSeeValue}</span>
                      <button type="button" onClick={fetchMandiPrices} disabled={mandiLoading}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-kh-accent/20 text-kh-accent text-body-xs font-medium hover:bg-kh-accent/30">
                        {t.farm.loadPrices}
                      </button>
                    </div>
                  )}
                  {hasZonesWithAreaAndCrop && (
                    <div className="mb-3 p-3 rounded-xl border border-kh-border bg-kh-surface/60">
                      <h4 className="text-body-sm font-semibold text-kh-text mb-2">{t.farm.estValueByCrop}</h4>
                      {cropList.length > 0 ? (
                        <div className="space-y-3">
                          {cropList.map((crop) => {
                            const meta = CROP_META[crop] || { color: "#64748b" };
                            const computedKg = Math.round(computedYieldKgByCrop[crop] ?? 0);
                            const overrideStr = cropYieldOverride[crop]?.trim();
                            const effectiveKg = overrideStr ? (parseFloat(overrideStr) || 0) : computedKg;
                            const price = getPriceForCrop(crop);
                            const value = price != null && effectiveKg > 0 ? Math.round(effectiveKg * price) : null;
                            return (
                              <div key={crop} className="flex flex-wrap items-center gap-2">
                                <span className="text-body-xs text-kh-text-muted flex items-center gap-1.5 shrink-0">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                                  {crop}
                                </span>
                                <label className="flex items-center gap-1.5 text-body-xs text-kh-text-dim shrink-0">
                                  {t.farm.yieldKg}:
                                  <input
                                    type="number"
                                    min={0}
                                    step={100}
                                    placeholder={String(computedKg)}
                                    value={overrideStr}
                                    onChange={(e) => setCropYieldOverride((prev) => ({ ...prev, [crop]: e.target.value }))}
                                    className="w-20 px-2 py-1 bg-kh-surface border border-kh-border rounded text-kh-text text-body-xs [color-scheme:dark]"
                                  />
                                </label>
                                {value != null ? (
                                  <span className="text-body-sm font-semibold text-kh-accent ml-auto">₹{value.toLocaleString("en-IN")}</span>
                                ) : (
                                  <span className="text-body-xs text-kh-text-dim ml-auto">{t.farm.priceNotAvailable}</span>
                                )}
                              </div>
                            );
                          })}
                          {cropList.length > 1 && (() => {
                            let totalVal = 0;
                            for (const crop of cropList) {
                              const overrideStr = cropYieldOverride[crop]?.trim();
                              const effectiveKg = overrideStr ? parseFloat(overrideStr) : (computedYieldKgByCrop[crop] ?? 0);
                              const price = getPriceForCrop(crop);
                              if (price != null && effectiveKg > 0) totalVal += Math.round(effectiveKg * price);
                            }
                            return (
                              <div className="flex items-center justify-between gap-2 pt-1.5 mt-1.5 border-t border-kh-border">
                                <span className="text-body-xs font-medium text-kh-text">{t.farm.total}</span>
                                <span className="text-body-sm font-semibold text-kh-accent">₹{totalVal.toLocaleString("en-IN")}</span>
                              </div>
                            );
                          })()}
                        </div>
                      ) : mandiPrices.length === 0 ? (
                        <button type="button" onClick={fetchMandiPrices} disabled={mandiLoading}
                          className="text-body-xs text-kh-accent hover:underline font-medium">
                          {t.farm.loadPrices} → {t.farm.estValueByCrop}
                        </button>
                      ) : (
                        <p className="text-body-xs text-kh-text-dim">{t.farm.priceNotAvailable}</p>
                      )}
                    </div>
                  )}
                  {farm.zones.map((zone, i) => {
                    const meta = CROP_META[zone.crop] || { color: "#64748b" };
                    const { progressPct, hasDates } = getZoneProgress(zone);
                    return (
                      <div key={zone.id} className="rounded-xl border border-kh-border bg-kh-surface/50 overflow-hidden animate-scale-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="h-1.5 w-full" style={{ backgroundColor: meta.color }} />
                        <div className="p-4 flex items-start justify-between gap-3">
                          <div className="flex gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: meta.color + "20" }}>
                              <Leaf size={18} style={{ color: meta.color }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <input value={zone.name} onChange={(e) => updateZone(zone.id, { name: e.target.value })}
                                className="text-body-md font-semibold text-kh-text bg-transparent border-b border-transparent hover:border-kh-border focus:border-kh-accent outline-none w-full mb-0.5" placeholder={t.farm.zoneName} />
                              <select value={zone.crop} onChange={(e) => updateZone(zone.id, { crop: e.target.value })}
                                className="text-body-sm text-kh-text-muted bg-kh-surface/80 border border-kh-border rounded-lg px-2 py-1 pr-6 [color-scheme:dark]">
                                {crops.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                  <label className="text-[10px] text-kh-text-dim block mb-0.5">{t.farm.area}</label>
                                  <input type="text" inputMode="decimal" value={zone.area} onChange={(e) => updateZone(zone.id, { area: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-kh-surface border border-kh-border rounded-lg text-body-xs text-kh-text [color-scheme:dark]" />
                                </div>
                                <div>
                                  <label className="text-[10px] text-kh-text-dim block mb-0.5">{t.farm.unit}</label>
                                  <select value={zone.unit} onChange={(e) => updateZone(zone.id, { unit: e.target.value as "acres" | "hectares" })}
                                    className="w-full px-2 py-1.5 bg-kh-surface border border-kh-border rounded-lg text-body-xs text-kh-text [color-scheme:dark]">
                                    <option value="acres">{t.farm.acres}</option>
                                    <option value="hectares">{t.farm.hectares}</option>
                                  </select>
                                </div>
                              </div>
                              <div className="mt-2">
                                <label className="text-[10px] text-kh-text-dim block mb-0.5">{t.farm.expectedYield} (optional)</label>
                                <div className="flex gap-1.5">
                                  <input type="text" inputMode="decimal" placeholder="—" value={zone.expectedYieldQty ?? zone.expectedYieldKg ?? ""} onChange={(e) => updateZone(zone.id, { expectedYieldQty: e.target.value, expectedYieldUnit: zone.expectedYieldUnit ?? (zone.expectedYieldKg ? "kg" : "plants") })}
                                    className="flex-1 min-w-0 px-2 py-1.5 bg-kh-surface border border-kh-border rounded-lg text-body-xs text-kh-text [color-scheme:dark]" />
                                  <select value={zone.expectedYieldUnit ?? (zone.expectedYieldKg ? "kg" : "plants")} onChange={(e) => updateZone(zone.id, { expectedYieldUnit: e.target.value as ExpectedYieldUnit })}
                                    className="shrink-0 px-2 py-1.5 bg-kh-surface border border-kh-border rounded-lg text-body-xs text-kh-text [color-scheme:dark]">
                                    <option value="kg">{t.farm.unitKg}</option>
                                    <option value="quintals">{t.farm.unitQuintals}</option>
                                    <option value="plants">{t.farm.unitPlants}</option>
                                  </select>
                                </div>
                              </div>
                              {(() => {
                                const zoneValue = getEstimatedValue(zone);
                                if (zoneValue != null) {
                                  return (
                                    <p className="text-body-xs text-kh-accent font-medium mt-2">
                                      {t.farm.estHarvestValue}: ₹{zoneValue.toLocaleString("en-IN")} {t.farm.atCurrentPrice}
                                    </p>
                                  );
                                }
                                return null;
                              })()}
                              <div className="flex gap-3 mt-1.5 text-body-xs text-kh-text-dim">
                                {zone.plantingDate && <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(zone.plantingDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>}
                              </div>
                              {hasDates ? (
                                <div className="mt-3">
                                  <div className="flex justify-between text-body-xs text-kh-text-dim mb-1">
                                    <span>{t.farm.seasonProgress}</span>
                                    <span className="font-medium text-kh-text-muted">{progressPct}%</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-kh-border overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, backgroundColor: meta.color }} />
                                  </div>
                                  <div className="flex justify-between mt-0.5 text-[10px] text-kh-text-dim">
                                    <span>{t.farm.planted}</span>
                                    <span>{t.farm.harvest}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3">
                                  <p className="text-body-xs text-kh-text-dim mb-2">{t.farm.setDates}</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[10px] text-kh-text-dim block mb-0.5">{t.farm.plantingDate}</label>
                                      <input type="date" value={zone.plantingDate || ""} onChange={(e) => updateZone(zone.id, { plantingDate: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-kh-surface border border-kh-border rounded-lg text-body-xs text-kh-text [color-scheme:dark]" />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-kh-text-dim block mb-0.5">{t.farm.expectedHarvest}</label>
                                      <input type="date" value={zone.expectedHarvest || ""} onChange={(e) => updateZone(zone.id, { expectedHarvest: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-kh-surface border border-kh-border rounded-lg text-body-xs text-kh-text [color-scheme:dark]" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {(["healthy", "attention", "critical"] as const).map((h) => (
                              <button key={h} onClick={() => updateHealth(zone.id, h)}
                                className={`w-3 h-3 rounded-full transition-all ${healthConfig[h].dot} ${zone.health === h ? "scale-110 ring-2 ring-offset-1 ring-offset-kh-card" : "opacity-30 hover:opacity-60"}`} title={healthConfig[h].label} />
                            ))}
                            <button onClick={() => deleteZone(zone.id)} className="p-2 rounded-lg text-kh-text-dim hover:text-red-400 hover:bg-red-500/10">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {farm.zones.length > 0 && (
          <div className="glow-card bg-kh-card p-4">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={14} className="text-blue-400 mt-0.5 shrink-0" />
              <p className="text-body-xs text-kh-text-dim">Data stored locally. Will sync to cloud when AWS backend is connected.</p>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
