import { NextResponse } from "next/server";
import { db } from "@/db";
import { trucks, hubs, packages, riders, zones, alerts } from "@/db/schema";
import { eq } from "drizzle-orm";

export const revalidate = 10; // Cache stats for 10 seconds

export async function GET() {
  const tRes = await db.select().from(trucks);
  const total_trucks = tRes.length;
  const delayed_trucks = tRes.filter(t => t.status === "delayed").length;
  const critical_trucks = tRes.filter(t => t.status === "critical").length;

  const hRes = await db.select().from(hubs);
  const total_hubs = hRes.length;
  const overloaded_hubs = hRes.filter(h => (h.current_load || 0) / (h.capacity || 1) > 0.9).length;

  const pRes = await db.select().from(packages);
  const total_packages = pRes.length;
  const stuck_packages = pRes.filter(p => p.status === "stuck").length;

  const rRes = await db.select().from(riders);
  const total_riders = rRes.length;
  const active_riders = rRes.filter(r => r.status === "delivering").length;

  const zRes = await db.select().from(zones);
  const critical_zones = zRes.filter(z => z.status === "critical").length;

  const aRes = await db.select().from(alerts).where(eq(alerts.resolved, false));
  const total_alerts = aRes.length;

  return NextResponse.json({
    total_trucks, delayed_trucks, critical_trucks,
    avg_delay_minutes: 45,
    on_time_pct: ((total_trucks - delayed_trucks - critical_trucks) / Math.max(total_trucks, 1)) * 100,
    total_hubs, overloaded_hubs,
    total_packages, stuck_packages,
    total_riders, active_riders,
    critical_zones, total_alerts
  });
}
