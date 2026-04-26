import { NextResponse } from "next/server";
import { db } from "@/db";
import { trucks } from "@/db/schema";
import axios from "axios";

export async function GET() {
  try {
    const allTrucks = await db.select().from(trucks);
    const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "http://localhost:8000";

    const results = await Promise.all(allTrucks.map(async (t) => {
      const weatherMap: Record<string, number> = { "clear": 0, "rain": 1, "heavy_rain": 2, "storm": 3 };
      const trafficMap: Record<string, number> = { "low": 0, "medium": 1, "high": 2, "blocked": 3 };

      const feat = {
        distance_km: 500,
        weather_score: weatherMap[t.weather_condition || "clear"] ?? 0,
        traffic_score: trafficMap[t.traffic_level || "low"] ?? 0,
        time_of_day: new Date().getHours(),
        day_of_week: new Date().getDay(),
        weight_tons: Number(t.weight_tons) || 15,
        hub_load_pct: 0.4
      };

      try {
        const predRes = await axios.post(`${ML_URL}/predict`, feat);
        return { ...t, prediction: predRes.data };
      } catch (e) {
        return { ...t, prediction: { delay_probability: 0, delay_category: "none", model_used: "fallback" } };
      }
    }));

    return NextResponse.json(results);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
