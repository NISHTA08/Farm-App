"use client";

import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import {
  TrendingUp,
  Minus,
  Search,
  MapPin,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";

interface CropPrice {
  id: string;
  crop: string;
  variety: string;
  market: string;
  state: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  change_pct: number;
  unit: string;
  date: string;
}

interface MandiData {
  prices: CropPrice[];
  lastUpdated: string;
  error?: string;
}

const categories = [
  { id: "all", label: "All" },
  { id: "cereals", label: "Cereals" },
  { id: "pulses", label: "Pulses" },
  { id: "vegetables", label: "Vegs" },
  { id: "fruits", label: "Fruits" },
  { id: "spices", label: "Spices" },
  { id: "oilseeds", label: "Oilseeds" },
];

const STATES = [
  "All India",
  "Andhra Pradesh",
  "Bihar",
  "Gujarat",
  "Haryana",
  "Karnataka",
  "Madhya Pradesh",
  "Maharashtra",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
];

export default function MandiPage() {
  const [data, setData] = useState<MandiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [location, setLocation] = useState("All India");

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (location && location !== "All India") params.set("state", location);
      const res = await fetch(`/api/mandi?${params.toString()}`);
      const data = await res.json();
      if (data?.error) {
        setError(data.error);
        setData({ prices: [], lastUpdated: "" });
        return;
      }
      setData(data);
    } catch {
      setError("Could not load market prices");
    }
    finally { setLoading(false); }
  }, [activeCategory, location]);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  const filtered = data?.prices.filter((p) =>
    p.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.market.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-kh-bg pb-28 relative overflow-hidden">
      <div className="orb w-[300px] h-[300px] bg-amber-600/20 -top-28 -right-16 animate-glow" />

      <header className="relative z-10 px-6 pt-6 pb-2">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <TrendingUp size={20} className="text-amber-400" />
              </div>
              <div>
                <h1 className="font-display text-display-sm text-kh-text">Mandi Prices</h1>
                <p className="text-body-xs text-kh-text-dim">
                  {data ? `Updated ${data.lastUpdated} · data.gov.in` : "Loading..."}
                </p>
              </div>
            </div>
            <button onClick={fetchPrices} disabled={loading}
              className="p-2 rounded-lg text-kh-text-dim hover:text-kh-text-muted hover:bg-white/5 transition-all disabled:opacity-40">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Location filter */}
          <div className="mb-3">
            <label className="text-body-xs text-kh-text-dim mb-1.5 block flex items-center gap-1">
              <MapPin size={12} /> Location (state)
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 bg-kh-surface border border-kh-border rounded-xl text-body-sm text-kh-text
                focus:outline-none focus:border-amber-500/50 transition-all [color-scheme:dark]"
            >
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-kh-text-dim" />
            <input
              type="text"
              placeholder="Search crop or market..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-kh-surface border border-kh-border rounded-xl
                text-body-sm text-kh-text placeholder-kh-text-dim
                focus:outline-none focus:border-kh-accent/50 focus:ring-1 focus:ring-kh-accent/30 transition-all"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-body-xs font-medium whitespace-nowrap transition-all shrink-0
                  ${activeCategory === cat.id
                    ? "gradient-accent text-black"
                    : "bg-white/[0.04] text-kh-text-dim hover:text-kh-text-muted hover:bg-white/[0.06]"
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-lg mx-auto px-6 mt-3">
        {loading ? (
          <div className="space-y-2 animate-fade-in">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-kh-card border border-kh-border shimmer" />
            ))}
          </div>
        ) : error ? (
          <div className="glow-card bg-kh-card p-10 text-center">
            <TrendingUp size={36} className="text-kh-text-dim mx-auto mb-3" />
            <p className="text-body-md text-kh-text-muted mb-4">{error}</p>
            <button onClick={fetchPrices} className="text-body-sm text-kh-accent font-medium">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glow-card bg-kh-card p-10 text-center">
            <Filter size={32} className="text-kh-text-dim mx-auto mb-3" />
            <p className="text-body-md text-kh-text-muted">No results found</p>
          </div>
        ) : (
          <div className="space-y-2 animate-fade-in">
            {filtered.map((price, i) => (
              <div key={price.id}
                className="glow-card bg-kh-card p-4 animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-body-md font-semibold text-kh-text leading-tight">{price.crop}</h3>
                    {price.variety && <p className="text-body-xs text-kh-text-dim">{price.variety}</p>}
                  </div>
                  <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-body-xs font-semibold
                    ${price.change_pct > 0 ? "bg-emerald-500/10 text-emerald-400"
                      : price.change_pct < 0 ? "bg-red-500/10 text-red-400"
                      : "bg-white/5 text-kh-text-dim"}`}>
                    {price.change_pct > 0 ? <ArrowUpRight size={11} /> : price.change_pct < 0 ? <ArrowDownRight size={11} /> : <Minus size={11} />}
                    {Math.abs(price.change_pct).toFixed(1)}%
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-body-lg font-semibold text-kh-text">
                      {fmt(price.modal_price)}
                      <span className="text-body-xs text-kh-text-dim font-normal">/kg</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-kh-text-dim">{fmt(price.min_price)} – {fmt(price.max_price)}/kg</p>
                    <div className="flex items-center gap-0.5 text-[10px] text-kh-text-dim mt-0.5 justify-end">
                      <MapPin size={8} /> {price.market}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
