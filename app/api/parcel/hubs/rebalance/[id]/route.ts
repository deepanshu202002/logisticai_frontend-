import { NextResponse } from "next/server";
import { db } from "@/db";
import { hubs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hubId = id.toUpperCase();

    // 1. Fetch Hub
    const [hub] = await db.select().from(hubs).where(eq(hubs.id, hubId));
    if (!hub) return NextResponse.json({ error: "Hub not found" }, { status: 404 });

    // 2. Rebalance Logic (Simulated)
    // We reduce the current_load to 70% of capacity to bring it out of Overloaded status (>90%)
    const targetLoad = Math.floor((hub.capacity || 1000) * 0.7);
    
    await db.update(hubs)
      .set({ 
        current_load: targetLoad,
        status: "normal"
      })
      .where(eq(hubs.id, hubId));

    console.log(`[HUB REBALANCE] Hub ${hubId} rebalanced. Load reduced from ${hub.current_load} to ${targetLoad}`);

    return NextResponse.json({
      message: `Hub ${hubId} rebalanced successfully`,
      new_load: targetLoad,
      status: "normal"
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Failed to rebalance hub" }, { status: 500 });
  }
}
