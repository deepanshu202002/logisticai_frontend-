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

    const res = await axios.post(`${ML_URL}/parcel-route`, {
      seller_city,
      buyer_city,
      weight_kg:   weight_kg  ?? 1.0,
      priority:    priority   ?? "standard",
      hub_loads,
      hub_weather,
    });

    return NextResponse.json(res.data);
  } catch (e: any) {
    console.error(e?.response?.data ?? e);
    return NextResponse.json({ error: "Routing failed" }, { status: 500 });
  }
}
