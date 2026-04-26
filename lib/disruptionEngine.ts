import { db } from "@/db";
import { trucks, hubs, packages, riders, zones, alerts } from "@/db/schema";

export async function detectAllDisruptions() {
  const newAlerts = [];

  const allTrucks = await db.select().from(trucks);
  for (const t of allTrucks) {
    const delay = t.delay_minutes || 0;
    if (delay > 240) {
      newAlerts.push({ severity: "critical", entity_type: "truck", entity_id: t.id, alert_type: "delay", message: `Truck ${t.id} delayed ${delay}min on ${t.origin}→${t.destination}` });
    } else if (delay > 120) {
      newAlerts.push({ severity: "warning", entity_type: "truck", entity_id: t.id, alert_type: "delay", message: `Truck ${t.id} delayed ${delay}min on ${t.origin}→${t.destination}` });
    }
    
    if (t.weather_condition === "storm") {
      newAlerts.push({ severity: "critical", entity_type: "truck", entity_id: t.id, alert_type: "weather", message: `Storm alert on ${t.origin}→${t.destination} route. Reroute recommended.` });
    }
    
    if (t.traffic_level === "blocked") {
      newAlerts.push({ severity: "critical", entity_type: "truck", entity_id: t.id, alert_type: "reroute", message: `Route blocked for ${t.id}. Auto rerouting available.` });
    }
  }

  const allHubs = await db.select().from(hubs);
  for (const h of allHubs) {
    const loadPct = (h.current_load || 0) / (h.capacity || 1);
    if (loadPct > 0.95) {
      newAlerts.push({ severity: "critical", entity_type: "hub", entity_id: h.id, alert_type: "overload", message: `Hub ${h.city} at ${(loadPct*100).toFixed(0)}% capacity. Immediate diversion needed.` });
    } else if (loadPct > 0.85) {
      newAlerts.push({ severity: "warning", entity_type: "hub", entity_id: h.id, alert_type: "overload", message: `Hub ${h.city} at ${(loadPct*100).toFixed(0)}% capacity. Monitor.` });
    }
  }

  const allPkgs = await db.select().from(packages);
  for (const p of allPkgs.filter(p => p.status === "stuck")) {
    const stuck = p.stuck_hours || 0;
    if (stuck > 6) {
      newAlerts.push({ severity: "critical", entity_type: "package", entity_id: p.id, alert_type: "delay", message: `Package ${p.id} stuck for ${stuck}hrs at ${p.current_hub}` });
    } else if (stuck > 3) {
      newAlerts.push({ severity: "warning", entity_type: "package", entity_id: p.id, alert_type: "delay", message: `Package ${p.id} stuck for ${stuck}hrs at ${p.current_hub}` });
    }
  }

  const allZones = await db.select().from(zones);
  for (const z of allZones) {
    const avg = z.avg_delivery_minutes || 0;
    if (avg > 20) {
      newAlerts.push({ severity: "critical", entity_type: "zone", entity_id: z.id, alert_type: "delay", message: `Zone ${z.name} avg delivery ${avg}min. Rider rebalance needed.` });
    }
    if ((z.available_riders || 0) < 2 && (z.active_orders || 0) > 20) {
      newAlerts.push({ severity: "critical", entity_type: "zone", entity_id: z.id, alert_type: "overload", message: `Zone ${z.name} critically understaffed: ${z.available_riders} riders for ${z.active_orders} orders` });
    }
  }

  if (newAlerts.length > 0) {
    await db.insert(alerts).values(newAlerts);
  }
}
