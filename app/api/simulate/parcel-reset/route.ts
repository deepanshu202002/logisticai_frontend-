import { NextResponse } from "next/server";
import { db } from "@/db";
import { hubs } from "@/db/schema";
import { inArray } from "drizzle-orm";

// Resets hub statuses back to normal after parcel storm simulation
const STORM_HUBS = ["HUB_DEL", "HUB_MUM", "HUB_NGP"];

export async function POST() {
  await db.update(hubs)
    .set({ status: "normal" })
    .where(inArray(hubs.id, STORM_HUBS));

  return NextResponse.json({ message: "Hub weather cleared. All hubs back to normal." });
}
