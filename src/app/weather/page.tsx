"use client";

import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import {
  CloudSun,
  Droplets,
  Wind,
  Eye,
  Thermometer,
  MapPin,
  RefreshCw,
  Sunrise,
  Sunset,
  CloudRain,
  Cloud,
  Sun,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
} from "lucide-react";

interface WeatherDay {
  date: string;
  dayName: string;
  temp_max: number;
  temp_min: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  rain_chance: number;
}

interface CurrentWeather {
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  visibility: number;
  sunrise: string;
  sunset: string;
  location: string;
}

interface WeatherData {
  current: CurrentWeather;
  forecast: WeatherDay[];
}

function WeatherIcon({ icon, size = 24 }: { icon: string; size?: number }) {
  const props = { size, strokeWidth: 1.5 };
  switch (icon) {
    case "sun": return <Sun {...props} className="text-yellow-400" />;
    case "cloud-sun": return <CloudSun {...props} className="text-amber-300" />;
    case "cloud": return <Cloud {...props} className="text-gray-400" />;
    case "rain": return <CloudRain {...props} className="text-blue-400" />;
    case "drizzle": return <CloudDrizzle {...props} className="text-blue-300" />;
    case "thunder": return <CloudLightning {...props} className="text-yellow-500" />;
    case "snow": return <CloudSnow {...props} className="text-blue-200" />;
    default: return <CloudSun {...props} className="text-kh-text-muted" />;
  }
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWeather = useCallback(async (lat?: number, lon?: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (lat && lon) { params.set("lat", lat.toString()); params.set("lon", lon.toString()); }
      const res = await fetch(`/api/weather?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Could not load weather");
        return;
      }
      setWeather(data);
    } catch { setError("Could not load weather data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather()
      );
    } else { fetchWeather(); }
  }, [fetchWeather]);

  return (
    <div className="min-h-screen bg-kh-bg pb-28 relative overflow-hidden">
      <div className="orb w-[350px] h-[350px] bg-blue-600/20 -top-32 -left-20 animate-glow" />

      <header className="relative z-10 px-6 pt-6 pb-2">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <CloudSun size={20} className="text-blue-400" />
            </div>
            <div>
              <h1 className="font-display text-display-sm text-kh-text">Weather</h1>
              {weather && (
                <div className="flex items-center gap-1 text-body-xs text-kh-text-dim">
                  <MapPin size={10} /> {weather.current.location}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => fetchWeather()} disabled={loading}
            className="p-2 rounded-lg text-kh-text-dim hover:text-kh-text-muted hover:bg-white/5 transition-all disabled:opacity-40">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-lg mx-auto px-6 mt-4">
        {loading ? (
          <div className="space-y-3 animate-fade-in">
            {[160, 80, 80, 80].map((h, i) => (
              <div key={i} className="rounded-3xl bg-kh-card border border-kh-border shimmer" style={{ height: h }} />
            ))}
          </div>
        ) : error ? (
          <div className="glow-card bg-kh-card p-10 text-center">
            <CloudSun size={36} className="text-kh-text-dim mx-auto mb-3" />
            <p className="text-body-md text-kh-text-muted mb-4">{error}</p>
            <button onClick={() => fetchWeather()} className="text-body-sm text-kh-accent font-medium">Retry</button>
          </div>
        ) : weather ? (
          <div className="space-y-3 animate-fade-in">
            {/* Current weather hero */}
            <div className="glow-card glow-blue bg-kh-card p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-body-xs text-kh-text-dim uppercase tracking-wider mb-3">Right Now</p>
                  <div className="flex items-end gap-1">
                    <span className="font-display text-hero text-kh-text leading-none">
                      {Math.round(weather.current.temp)}°
                    </span>
                  </div>
                  <p className="text-body-sm text-kh-text-muted capitalize mt-2">{weather.current.description}</p>
                  <p className="text-body-xs text-kh-text-dim mt-1">Feels like {Math.round(weather.current.feels_like)}°</p>
                </div>
                <div className="mt-2">
                  <WeatherIcon icon={weather.current.icon} size={52} />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: Droplets, value: `${weather.current.humidity}%`, label: "Humidity", color: "text-blue-400" },
                  { icon: Wind, value: `${weather.current.wind_speed}`, label: "km/h", color: "text-teal-400" },
                  { icon: Eye, value: `${weather.current.visibility}`, label: "km vis", color: "text-purple-400" },
                  { icon: Thermometer, value: `${Math.round(weather.current.feels_like)}°`, label: "Feels", color: "text-orange-400" },
                ].map((s, i) => (
                  <div key={i} className="text-center p-2 rounded-xl bg-white/[0.03]">
                    <s.icon size={14} className={`${s.color} mx-auto mb-1`} />
                    <p className="text-body-sm font-semibold text-kh-text">{s.value}</p>
                    <p className="text-[10px] text-kh-text-dim">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-kh-border">
                <div className="flex items-center gap-1.5 text-body-xs text-kh-text-dim">
                  <Sunrise size={13} className="text-orange-400" /> {weather.current.sunrise}
                </div>
                <div className="flex items-center gap-1.5 text-body-xs text-kh-text-dim">
                  <Sunset size={13} className="text-indigo-400" /> {weather.current.sunset}
                </div>
              </div>
            </div>

            {/* 7-day forecast */}
            <div className="glow-card bg-kh-card p-5">
              <h2 className="text-body-xs text-kh-text-dim uppercase tracking-wider mb-4">7-Day Forecast</h2>
              <div className="space-y-1">
                {weather.forecast.map((day, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-kh-border last:border-0">
                    <div className="w-12 shrink-0">
                      <p className="text-body-sm font-medium text-kh-text">{i === 0 ? "Today" : day.dayName}</p>
                    </div>
                    <WeatherIcon icon={day.icon} size={18} />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-xs text-kh-text-dim truncate capitalize">{day.description}</p>
                    </div>
                    {day.rain_chance > 20 && (
                      <div className="flex items-center gap-0.5 text-[10px] text-blue-400">
                        <Droplets size={10} /> {day.rain_chance}%
                      </div>
                    )}
                    <div className="text-right shrink-0 w-14">
                      <span className="text-body-sm font-medium text-kh-text">{Math.round(day.temp_max)}°</span>
                      <span className="text-body-xs text-kh-text-dim ml-1">{Math.round(day.temp_min)}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <BottomNav />
    </div>
  );
}
