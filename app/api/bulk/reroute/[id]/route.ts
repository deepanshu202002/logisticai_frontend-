import { NextResponse } from "next/server";
import { db } from "@/db";
import { trucks, routeHistories, alerts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import axios from "axios";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const tList = await db.select().from(trucks).where(eq(trucks.id, params.id));
    if (tList.length === 0) return NextResponse.json({ error: "Truck not found" }, { status: 404 });
    let t = tList[0];

    const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "http://localhost:8000";

    const disruptions = [];
    if (t.weather_condition === "storm")   disruptions.push({ edge: [t.origin, t.destination], reason: "storm" });
    if (t.traffic_level   === "blocked")  disruptions.push({ edge: [t.origin, t.destination], reason: "blocked" });

    const routeRes = await axios.post(`${ML_URL}/reroute`, {
      origin:           t.origin,
      destination:      t.destination,
      disruptions,
      cargo_type:       t.cargo    ?? "default",
      weight_tons:      t.weight_tons ?? 15,
      current_weather:  t.weather_condition ?? "clear",
      current_traffic:  t.traffic_level     ?? "medium",
    });
    const routes = routeRes.data;

    // Only apply if the engine recommends reroute OR user force-applied
    let newStatus = t.status;
    if (newStatus === "critical" || newStatus === "delayed") newStatus = "rerouted";

    await db.update(trucks).set({
      rerouted_route: routes.primary.path,
      status: newStatus
    }).where(eq(trucks.id, t.id));

    await db.insert(routeHistories).values({
      truck_id:             t.id,
      original_route:       t.current_route,
      optimized_route:      routes.primary.path,
      distance_km:          routes.primary.distance_km,
      estimated_time_hours: routes.primary.estimated_time_hours,
      disruptions_avoided:  routes.disruptions_avoided,
      applied: true
    });

    await db.update(alerts)
      .set({ resolved: true })
      .where(and(eq(alerts.entity_id, t.id), eq(alerts.resolved, false)));

    return NextResponse.json({
      message:           "Reroute applied successfully",
      new_route:         routes.primary.path,
      recommendation:    routes.recommendation,
      cost_saving_inr:   routes.cost_saving_inr,
      cost_saving_pct:   routes.cost_saving_pct,
      cost_breakdown:    routes.primary.cost_breakdown,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
