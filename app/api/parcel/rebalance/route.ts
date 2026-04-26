import { NextResponse } from "next/server";
import { db } from "@/db";
import { hubs, alerts } from "@/db/schema";
import { sql, eq, and } from "drizzle-orm";

export async function POST() {
  try {
    const allHubs = await db.select().from(hubs);
    const overloaded = allHubs.filter(h => (h.current_load || 0) / (h.capacity || 1) > 0.9);
    
    let transferred = 0;
    for (const hub of overloaded) {
      const free_hubs = allHubs.filter(h => (h.capacity || 0) - (h.current_load || 0) > 2000);
      if (free_hubs.length > 0) {
        const target = free_hubs[0];
        const transfer_amount = Math.floor((hub.current_load || 0) - ((hub.capacity || 0) * 0.7));
        
        if (transfer_amount > 0) {
          // Update Hubs
          await db.update(hubs).set({
            current_load: (hub.current_load || 0) - transfer_amount,
            status: "normal"
          }).where(eq(hubs.id, hub.id));
          
          await db.update(hubs).set({
            current_load: (target.current_load || 0) + transfer_amount
          }).where(eq(hubs.id, target.id));
          
          transferred += transfer_amount;

          // Resolve Alerts
          await db.update(alerts)
            .set({ resolved: true })
            .where(and(eq(alerts.entity_id, hub.id), eq(alerts.resolved, false)));
            
          target.current_load = (target.current_load || 0) + transfer_amount;
        }
      }
    }
    
    return NextResponse.json({ message: `Rebalanced ${transferred} packages across hubs.` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
