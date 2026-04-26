import { NextResponse } from "next/server";
import { db } from "@/db";
import { zones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { detectAllDisruptions } from "@/lib/disruptionEngine";

export async function POST() {
  await db.update(zones).set({ active_orders: 80, available_riders: 1, avg_delivery_minutes: 35, status: "critical" }).where(eq(zones.name, "Koramangala"));
  await db.update(zones).set({ active_orders: 60, available_riders: 1, status: "critical" }).where(eq(zones.name, "HSR Layout"));
  await detectAllDisruptions();
  return NextResponse.json({ message: "Lunch rush simulated!" });
}
