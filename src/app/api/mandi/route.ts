import { NextRequest, NextResponse } from "next/server";

interface CropPriceData {
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
  category: string;
}

const DATA_GOV_API_KEY = process.env.DATA_GOV_IN_API_KEY;
// data.gov.in: "Current Daily Price of Various Commodities from Various Markets (Mandi)"
// Source: AGMARKNET. Prices in the API are always per QUINTAL (100 kg). We convert to per kg by dividing by 100.
const MANDI_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const LIMIT_PER_REQUEST = 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const state = searchParams.get("state")?.trim();

  if (!DATA_GOV_API_KEY) {
    return NextResponse.json({
      prices: [],
      lastUpdated: "",
      error:
        "Live mandi prices require DATA_GOV_IN_API_KEY. Add it in .env.local (get a free API key at data.gov.in).",
    });
  }

  try {
    const offsets = [0, LIMIT_PER_REQUEST, LIMIT_PER_REQUEST * 2, LIMIT_PER_REQUEST * 3];
    const allRecords: Record<string, unknown>[] = [];
    const stateFilter = state && state !== "All India" ? state : null;
    for (const offset of offsets) {
      let url = `https://api.data.gov.in/resource/${MANDI_RESOURCE_ID}?api-key=${encodeURIComponent(DATA_GOV_API_KEY)}&format=json&limit=${LIMIT_PER_REQUEST}&offset=${offset}`;
      if (stateFilter) {
        url += `&filters[state_name]=${encodeURIComponent(stateFilter)}`;
      }
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) {
        const text = await res.text();
        console.error("data.gov.in mandi API error:", res.status, text);
        if (offset === 0) {
          return NextResponse.json({
            prices: [],
            lastUpdated: "",
            error: "Could not fetch live mandi data. Check DATA_GOV_IN_API_KEY or try again later.",
          });
        }
        break;
      }
      const json = await res.json();
      const records = json?.records || [];
      if (records.length === 0) break;
      allRecords.push(...records);
    }
    const today = new Date().toLocaleDateString("en-IN");

    const categoryMap: Record<string, string> = {
      rice: "cereals",
      wheat: "cereals",
      maize: "cereals",
      cotton: "oilseeds",
      soybean: "oilseeds",
      groundnut: "oilseeds",
      mustard: "oilseeds",
      tomato: "vegetables",
      onion: "vegetables",
      potato: "vegetables",
      chana: "pulses",
      tur: "pulses",
      moong: "pulses",
      banana: "fruits",
      mango: "fruits",
      chilli: "spices",
      turmeric: "spices",
    };

    const field = (r: Record<string, unknown>, ...keys: string[]) => {
      for (const k of keys) {
        const v = r[k];
        if (v !== undefined && v !== null) return String(v).trim();
      }
      return "";
    };
    const num = (r: Record<string, unknown>, ...keys: string[]) => {
      for (const k of keys) {
        const v = r[k];
        if (v !== undefined && v !== null) return Number(v) || 0;
      }
      return 0;
    };

    // Govt API (AGMARKNET) always reports prices per quintal (100 kg). Convert to per kg.
    const toPerKg = (n: number) => Math.round((n / 100) * 100) / 100;

    const seen = new Set<string>();
    const prices: CropPriceData[] = [];
    for (let i = 0; i < allRecords.length; i++) {
      const r = allRecords[i] as Record<string, unknown>;
      const cropName = field(r, "commodity", "Commodity", "crop") || "Crop";
      const marketName = field(r, "market", "Market", "district_name", "District") || "Market";
      const stateName = field(r, "state_name", "state", "State") || "India";
      const min = num(r, "min_price", "Min_Price", "minimum_price") || 0;
      const max = num(r, "max_price", "Max_Price", "maximum_price") || 0;
      const modalVal = num(r, "modal_price", "Modal_Price") || (min + max) / 2 || 0;
      const commodity = cropName.toLowerCase();
      const cat = Object.entries(categoryMap).find(([k]) => commodity.includes(k))?.[1] || "cereals";
      const key = `${stateName}|${marketName}|${cropName}`;
      if (seen.has(key)) continue;
      seen.add(key);
      prices.push({
        id: `m-${i}-${Date.now()}`,
        crop: cropName,
        variety: field(r, "variety", "Variety") || "—",
        market: marketName,
        state: stateName,
        min_price: toPerKg(min),
        max_price: toPerKg(max),
        modal_price: toPerKg(modalVal),
        change_pct: 0,
        unit: "kg",
        date: today,
        category: cat,
      });
    }

    let filtered = prices;
    if (stateFilter) {
      filtered = filtered.filter((p) => p.state.toLowerCase().includes(stateFilter.toLowerCase()));
    }
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }
    filtered = filtered.slice(0, 80);

    return NextResponse.json({
      prices: filtered,
      lastUpdated: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    });
  } catch (err) {
    console.error("Mandi API error:", err);
    return NextResponse.json({
      prices: [],
      lastUpdated: "",
      error: "Could not fetch mandi prices. Check your API key and try again.",
    });
  }
}
