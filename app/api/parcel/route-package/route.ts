import { NextResponse } from "next/server";
import { db } from "@/db";
import { hubs } from "@/db/schema";
import axios from "axios";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { seller_city, buyer_city, weight_kg, priority } = body;

    if (!seller_city || !buyer_city) {
      return NextResponse.json({ error: "seller_city and buyer_city are required" }, { status: 400 });
    }

    // Fetch live hub loads from DB
    const allHubs = await db.select().from(hubs);
    const hub_loads:   Record<string, number> = {};
    const hub_weather: Record<string, number> = {};

    for (const h of allHubs) {
      const city = h.city!;
      hub_loads[city]   = (h.current_load ?? 0) / (h.capacity ?? 1);
      // Map hub status → weather_score for ML predict (0=clear, 1=rain, 2=heavy_rain, 3=storm)
      hub_weather[city] =
        h.status === "storm"     ? 3 :
        h.status === "overloaded"? 1 :
        h.status === "warning"   ? 1 : 0;
    }

    const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "http://localhost:8000";

    try {
      const res = await axios.post(`${ML_URL}/parcel-route`, {
        seller_city,
        buyer_city,
        weight_kg:   weight_kg  ?? 1.0,
        priority:    priority   ?? "standard",
        hub_loads,
        hub_weather,
      }, { timeout: 8000 }); // 8 second timeout

      return NextResponse.json(res.data);
    } catch (apiErr) {
      console.warn("Parcel ML Backend unreachable, using fallback routing");
      
      // Fallback: A simple direct path for demo purposes if backend is down
      const fallbackResult = {
        routes: [
          {
            path: [seller_city, "Mumbai Hub", buyer_city],
            distance_km: 1240,
            estimated_hours: 22,
            rank_label: "Fallback Route (Standard)",
            cost_breakdown: { total_inr: 450, fuel_inr: 300, toll_inr: 100, hub_fees_inr: 50 },
            delay_risk: { probability: 0.1, category: "low" }
          }
        ],
        overloaded_hubs: []
      };
      return NextResponse.json(fallbackResult);
    }
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Routing system error" }, { status: 500 });
  }
}
