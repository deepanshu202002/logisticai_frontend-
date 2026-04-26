import { NextResponse } from "next/server";
import { db } from "@/db";
import { trucks } from "@/db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const tList = await db.select().from(trucks).where(eq(trucks.id, params.id));
    if (tList.length === 0) return NextResponse.json({ error: "Truck not found" }, { status: 404 });
    const t = tList[0];

    const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "http://localhost:8000";

    const disruptions = [];
    if (t.weather_condition === "storm") disruptions.push({ edge: [t.origin, t.destination], reason: "storm" });
    if (t.traffic_level === "blocked") disruptions.push({ edge: [t.origin, t.destination], reason: "blocked" });

    let route_options = null;
    try {
      const routeRes = await axios.post(`${ML_URL}/reroute`, {
        origin:           t.origin,
        destination:      t.destination,
        disruptions,
        cargo_type:       t.cargo    ?? "default",
        weight_tons:      t.weight_tons ?? 15,
        current_weather:  t.weather_condition ?? "clear",
        current_traffic:  t.traffic_level     ?? "medium",
      });
      route_options = routeRes.data;
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({ ...t, route_options });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
