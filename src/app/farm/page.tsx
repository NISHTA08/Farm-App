"use client";

import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Sprout,
  Plus,
  Calendar,
  Ruler,
  Trash2,
  X,
  Check,
  Wheat,
  Leaf,
  AlertCircle,
} from "lucide-react";

interface CropZone {
  id: string;
  name: string;
  crop: string;
  area: string;
  unit: "acres" | "hectares";
  plantingDate: string;
  expectedHarvest: string;
  health: "healthy" | "attention" | "critical";
  notes: string;
}

interface FarmProfile {
  totalArea: string;
  unit: "acres" | "hectares";
  location: string;
  zones: CropZone[];
}

const FARM_KEY = "khethai-farm-data";
const defaultFarm: FarmProfile = { totalArea: "", unit: "acres", location: "", zones: [] };

const healthConfig = {
  healthy: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", label: "Healthy", dot: "bg-emerald-400" },
  attention: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", label: "Attention", dot: "bg-amber-400" },
  critical: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", label: "Critical", dot: "bg-red-400" },
};

const crops = ["Rice", "Wheat", "Cotton", "Sugarcane", "Maize", "Tomato", "Potato", "Onion", "Soybean", "Groundnut"];

export default function FarmPage() {
  const [farm, setFarm] = useState<FarmProfile>(defaultFarm);
  const [showAdd, setShowAdd] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newZone, setNewZone] = useState({ name: "", crop: "", area: "", unit: "acres" as const, plantingDate: "", expectedHarvest: "", health: "healthy" as const, notes: "" });

  useEffect(() => {
    try { const s = localStorage.getItem(FARM_KEY); if (s) setFarm(JSON.parse(s)); } catch {}
    setMounted(true);
  }, []);

  const save = useCallback((f: FarmProfile) => {
    setFarm(f);
    try { localStorage.setItem(FARM_KEY, JSON.stringify(f)); } catch {}
  }, []);

  const addZone = () => {
    if (!newZone.name || !newZone.crop) return;
    save({ ...farm, zones: [...farm.zones, { ...newZone, id: `z-${Date.now()}` }] });
    setNewZone({ name: "", crop: "", area: "", unit: "acres", plantingDate: "", expectedHarvest: "", health: "healthy", notes: "" });
    setShowAdd(false);
  };

  const deleteZone = (id: string) => save({ ...farm, zones: farm.zones.filter((z) => z.id !== id) });
  const updateHealth = (id: string, h: CropZone["health"]) => save({ ...farm, zones: farm.zones.map((z) => z.id === id ? { ...z, health: h } : z) });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-kh-bg pb-28 relative overflow-hidden">
      <div className="orb w-[300px] h-[300px] bg-violet-600/20 -top-28 -left-16 animate-glow" />

      <header className="relative z-10 px-6 pt-6 pb-2">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Sprout size={20} className="text-violet-400" />
          </div>
          <h1 className="font-display text-display-sm text-kh-text">My Farm</h1>
        </div>
      </header>

      <div className="relative z-10 max-w-lg mx-auto px-6 mt-4 space-y-3">
        {/* Farm details */}
        <div className="glow-card glow-violet bg-kh-card p-5">
          <h2 className="text-body-xs text-kh-text-dim uppercase tracking-wider mb-4">Farm Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-body-xs text-kh-text-dim mb-1.5 block">Total Area</label>
              <div className="flex gap-2">
                <input type="number" placeholder="0" value={farm.totalArea}
                  onChange={(e) => save({ ...farm, totalArea: e.target.value })}
                  className="flex-1 px-3 py-2.5 bg-kh-surface border border-kh-border rounded-lg text-body-sm text-kh-text focus:outline-none focus:border-violet-500/50 transition-all min-h-[44px]" />
                <select value={farm.unit} onChange={(e) => save({ ...farm, unit: e.target.value as "acres" | "hectares" })}
                  className="px-2 py-2.5 bg-kh-surface border border-kh-border rounded-lg text-body-sm text-kh-text focus:outline-none focus:border-violet-500/50 transition-all min-h-[44px]">
                  <option value="acres">Acres</option>
                  <option value="hectares">Ha</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-body-xs text-kh-text-dim mb-1.5 block">Location</label>
              <input type="text" placeholder="Village/District" value={farm.location}
                onChange={(e) => save({ ...farm, location: e.target.value })}
                className="w-full px-3 py-2.5 bg-kh-surface border border-kh-border rounded-lg text-body-sm text-kh-text placeholder-kh-text-dim focus:outline-none focus:border-violet-500/50 transition-all min-h-[44px]" />
            </div>
          </div>
        </div>

        {/* Zone header */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-body-md font-semibold text-kh-text">Crop Zones ({farm.zones.length})</h2>
          <Button size="sm" variant={showAdd ? "ghost" : "primary"} onClick={() => setShowAdd(!showAdd)}
            icon={showAdd ? <X size={14} /> : <Plus size={14} />}>
            {showAdd ? "Cancel" : "Add"}
          </Button>
        </div>

        {/* Add zone form */}
        {showAdd && (
          <div className="glow-card bg-kh-card p-5 space-y-4 animate-slide-up" style={{ boxShadow: "0 0 60px -15px rgba(139,92,246,0.15)" }}>
            <Input label="Zone Name" placeholder="e.g., North Field" value={newZone.name} onChange={(e) => setNewZone({ ...newZone, name: e.target.value })} />
            <div>
              <label className="text-body-xs text-kh-text-dim mb-2 block">Select Crop</label>
              <div className="flex flex-wrap gap-1.5">
                {crops.map((c) => (
                  <button key={c} onClick={() => setNewZone({ ...newZone, crop: c })}
                    className={`px-3 py-1.5 rounded-full text-body-xs font-medium transition-all
                      ${newZone.crop === c ? "gradient-accent text-black" : "bg-white/[0.04] text-kh-text-dim hover:text-kh-text-muted"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-body-xs text-kh-text-dim mb-1.5 block">Area</label>
                <input type="number" placeholder="0" value={newZone.area}
                  onChange={(e) => setNewZone({ ...newZone, area: e.target.value })}
                  className="w-full px-3 py-2.5 bg-kh-surface border border-kh-border rounded-lg text-body-sm text-kh-text focus:outline-none focus:border-kh-accent/50 transition-all min-h-[44px]" />
              </div>
              <div>
                <label className="text-body-xs text-kh-text-dim mb-1.5 block">Planted</label>
                <input type="date" value={newZone.plantingDate}
                  onChange={(e) => setNewZone({ ...newZone, plantingDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-kh-surface border border-kh-border rounded-lg text-body-sm text-kh-text focus:outline-none focus:border-kh-accent/50 transition-all min-h-[44px] [color-scheme:dark]" />
              </div>
            </div>
            <Button fullWidth onClick={addZone} icon={<Check size={14} />}>Add Zone</Button>
          </div>
        )}

        {/* Empty state */}
        {farm.zones.length === 0 && !showAdd && (
          <div className="glow-card bg-kh-card p-10 text-center">
            <Wheat size={36} className="text-kh-text-dim mx-auto mb-4 animate-float" />
            <h3 className="font-display text-display-sm text-kh-text mb-2">No Zones Yet</h3>
            <p className="text-body-sm text-kh-text-dim mb-6 max-w-[220px] mx-auto">
              Add your first crop zone to start tracking
            </p>
            <Button onClick={() => setShowAdd(true)} icon={<Plus size={14} />}>Add First Zone</Button>
          </div>
        )}

        {/* Zone list */}
        {farm.zones.map((zone, i) => {
          const hc = healthConfig[zone.health];
          return (
            <div key={zone.id} className="glow-card bg-kh-card p-5 animate-scale-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-body-md font-semibold text-kh-text">{zone.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Leaf size={12} className="text-kh-accent" />
                    <span className="text-body-sm text-kh-text-muted">{zone.crop}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-body-xs font-medium border ${hc.bg} ${hc.text}`}>
                  {hc.label}
                </span>
              </div>

              <div className="flex gap-4 text-body-xs text-kh-text-dim mb-3">
                {zone.area && <span className="flex items-center gap-1"><Ruler size={11} /> {zone.area} {zone.unit}</span>}
                {zone.plantingDate && <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(zone.plantingDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-kh-border">
                <div className="flex gap-2">
                  {(["healthy", "attention", "critical"] as const).map((h) => (
                    <button key={h} onClick={() => updateHealth(zone.id, h)}
                      className={`w-3.5 h-3.5 rounded-full transition-all ${healthConfig[h].dot}
                        ${zone.health === h ? "scale-110 ring-2 ring-offset-1 ring-offset-kh-card ring-current" : "opacity-30 hover:opacity-60"}`}
                      title={healthConfig[h].label} />
                  ))}
                </div>
                <button onClick={() => deleteZone(zone.id)}
                  className="p-2 rounded-lg text-kh-text-dim hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}

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
