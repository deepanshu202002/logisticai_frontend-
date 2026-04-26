import { NextResponse } from "next/server";
import { db } from "@/db";
import { trucks } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { detectAllDisruptions } from "@/lib/disruptionEngine";

export async function POST() {
  await db.update(trucks).set({ weather_condition: "storm", status: "critical", delay_minutes: 300 }).where(inArray(trucks.id, ["TRK001", "TRK003", "TRK005"]));
  await detectAllDisruptions();
  return NextResponse.json({ message: "Storm simulated!" });
}
