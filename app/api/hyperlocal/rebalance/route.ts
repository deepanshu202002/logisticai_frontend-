import { NextResponse } from "next/server";
import { db } from "@/db";
import { zones, alerts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST() {
  try {
    const allZones = await db.select().from(zones);
    const stressed = allZones.filter(z => z.status === "critical");
    const calm = allZones.filter(z => z.status === "normal");
    
    let moved = 0;
    for (const sz of stressed) {
      if (calm.length > 0) {
        const cz = calm[0];
        if ((cz.available_riders || 0) > 1) {
          await db.update(zones).set({ available_riders: (cz.available_riders || 0) - 1 }).where(eq(zones.id, cz.id));
          await db.update(zones).set({ available_riders: (sz.available_riders || 0) + 1, status: "normal" }).where(eq(zones.id, sz.id));
          moved++;
          cz.available_riders = (cz.available_riders || 0) - 1;

          await db.update(alerts)
            .set({ resolved: true })
            .where(and(eq(alerts.entity_id, sz.id), eq(alerts.resolved, false)));
        }
      }
    }
    return NextResponse.json({ message: `Reassigned ${moved} riders.` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
