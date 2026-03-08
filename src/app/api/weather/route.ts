import { NextRequest, NextResponse } from "next/server";

const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;
const DEFAULT_LAT = 17.385;
const DEFAULT_LON = 78.4867;

function mapIcon(owmIcon: string): string {
  const code = owmIcon.replace(/[dn]$/, "");
  const map: Record<string, string> = {
    "01": "sun",
    "02": "cloud-sun",
    "03": "cloud",
    "04": "cloud",
    "09": "drizzle",
    "10": "rain",
    "11": "thunder",
    "13": "snow",
    "50": "cloud",
  };
  return map[code] || "cloud-sun";
}

function getDayName(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-IN", { weekday: "short" });
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || String(DEFAULT_LAT));
  const lon = parseFloat(searchParams.get("lon") || String(DEFAULT_LON));

  if (OWM_API_KEY) {
    try {
      const [currentRes, forecastRes] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_API_KEY}`
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_API_KEY}`
        ),
      ]);

      if (!currentRes.ok || !forecastRes.ok) {
        throw new Error("OpenWeatherMap API error");
      }

      const currentData = await currentRes.json();
      const forecastData = await forecastRes.json();

      const dailyMap = new Map<string, { temps: number[]; descriptions: string[]; icons: string[]; humidity: number[]; wind: number[]; rain: number[] }>();

      for (const item of forecastData.list) {
        const dateKey = new Date(item.dt * 1000).toDateString();
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { temps: [], descriptions: [], icons: [], humidity: [], wind: [], rain: [] });
        }
        const day = dailyMap.get(dateKey)!;
        day.temps.push(item.main.temp);
        day.descriptions.push(item.weather[0].description);
        day.icons.push(item.weather[0].icon);
        day.humidity.push(item.main.humidity);
        day.wind.push(item.wind.speed * 3.6);
        day.rain.push(item.pop * 100);
      }

      const forecast = Array.from(dailyMap.entries())
        .slice(0, 7)
        .map(([dateStr, data]) => ({
          date: formatDate(new Date(dateStr).getTime() / 1000),
          dayName: getDayName(new Date(dateStr).getTime() / 1000),
          temp_max: Math.round(Math.max(...data.temps)),
          temp_min: Math.round(Math.min(...data.temps)),
          description: data.descriptions[Math.floor(data.descriptions.length / 2)],
          icon: mapIcon(data.icons[Math.floor(data.icons.length / 2)]),
          humidity: Math.round(data.humidity.reduce((a, b) => a + b) / data.humidity.length),
          wind_speed: Math.round(data.wind.reduce((a, b) => a + b) / data.wind.length),
          rain_chance: Math.round(Math.max(...data.rain)),
        }));

      return NextResponse.json({
        current: {
          temp: currentData.main.temp,
          feels_like: currentData.main.feels_like,
          description: currentData.weather[0].description,
          icon: mapIcon(currentData.weather[0].icon),
          humidity: currentData.main.humidity,
          wind_speed: Math.round(currentData.wind.speed * 3.6),
          visibility: Math.round((currentData.visibility || 10000) / 1000),
          sunrise: formatTime(currentData.sys.sunrise),
          sunset: formatTime(currentData.sys.sunset),
          location: `${currentData.name}, ${currentData.sys.country}`,
        },
        forecast,
      });
    } catch (error) {
      console.error("Weather API error:", error);
    }
  }

  return NextResponse.json(
    {
      error:
        "Real weather data requires OPENWEATHER_API_KEY. Add it to .env.local (get a free key at openweathermap.org).",
    },
    { status: 503 }
  );
}
