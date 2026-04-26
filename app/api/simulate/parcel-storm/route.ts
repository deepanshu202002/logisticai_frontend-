import { NextResponse } from "next/server";
import { db } from "@/db";
import { hubs } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { detectAllDisruptions } from "@/lib/disruptionEngine";

// Simulates a hub-level weather storm: raises load + marks status "storm"
// on major transit hubs so parcel delay risk scores shoot up
const STORM_HUBS = ["HUB_DEL", "HUB_MUM", "HUB_NGP"];

export async function POST() {
  await db.update(hubs)
    .set({ status: "storm" })
    .where(inArray(hubs.id, STORM_HUBS));

  await detectAllDisruptions();
  return NextResponse.json({
    message: "Hub storm simulated! Delhi, Mumbai & Nagpur hubs disrupted.",
    affected_hubs: ["Delhi", "Mumbai", "Nagpur"],
  });
}
