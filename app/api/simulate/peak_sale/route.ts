import { NextResponse } from "next/server";
import { db } from "@/db";
import { hubs } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { detectAllDisruptions } from "@/lib/disruptionEngine";

export async function POST() {
  const allHubs = await db.select().from(hubs).where(inArray(hubs.id, ["HUB_DEL", "SUB_DEL_N"]));
  for (const h of allHubs) {
    await db.update(hubs).set({ current_load: h.capacity }).where(inArray(hubs.id, ["HUB_DEL", "SUB_DEL_N"]));
  }
  await detectAllDisruptions();
  return NextResponse.json({ message: "Peak sale simulated!" });
}
