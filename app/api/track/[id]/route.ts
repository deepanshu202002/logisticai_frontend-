import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, trackingEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trackingId = id.toUpperCase();
    console.log(`[TRACKING] Searching for ID: ${trackingId}`);

    // 1. Fetch Booking
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, trackingId));
    
    if (!booking) {
      console.warn(`[TRACKING] ID ${trackingId} not found in database.`);
      return NextResponse.json({ error: "Tracking ID not found" }, { status: 404 });
    }

    console.log(`[TRACKING] Found booking ${trackingId}. Fetching events...`);

    // 2. Fetch Events
    const events = await db
      .select()
      .from(trackingEvents)
      .where(eq(trackingEvents.booking_id, trackingId))
      .orderBy(desc(trackingEvents.timestamp));

    return NextResponse.json({
      booking,
      events,
      current_status: events[0]?.status || "BOOKED",
      last_update: events[0]?.timestamp,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Tracking lookup failed" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trackingId = id.toUpperCase();
    console.log(`[TRACKING] Simulation for ID: ${trackingId}`);
    
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, trackingId));
    
    if (!booking) {
      console.warn(`[TRACKING] ID ${trackingId} not found for simulation.`);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const events = await db
      .select()
      .from(trackingEvents)
      .where(eq(trackingEvents.booking_id, trackingId))
      .orderBy(desc(trackingEvents.timestamp));

    const currentStatus = events[0]?.status || "BOOKED";
    const route = (booking.route as any).path || [];
    
    let nextStatus = "";
    let nextLocation = "";
    let nextMessage = "";

    // Status progression: BOOKED -> PICKED_UP -> ARRIVED_HUB_1 -> DEPARTED_HUB_1 ... -> OUT_FOR_DELIVERY -> DELIVERED
    if (currentStatus === "BOOKED") {
      nextStatus = "PICKED_UP";
      nextLocation = booking.seller_city || "";
      nextMessage = "Parcel picked up from sender and is moving towards the first sorting facility.";
    } else if (currentStatus === "PICKED_UP") {
      nextStatus = `ARRIVED_${route[0] || 'HUB'}`;
      nextLocation = route[0] || "";
      nextMessage = `Shipment arrived at ${nextLocation} Hub for processing.`;
    } else if (currentStatus.startsWith("ARRIVED_")) {
      const hub = currentStatus.replace("ARRIVED_", "");
      nextStatus = `DEPARTED_${hub}`;
      nextLocation = hub;
      nextMessage = `Processed and departed ${hub} Hub.`;
    } else if (currentStatus.startsWith("DEPARTED_")) {
      const hub = currentStatus.replace("DEPARTED_", "");
      const hubIndex = route.indexOf(hub);
      if (hubIndex !== -1 && hubIndex < route.length - 1) {
        const nextHub = route[hubIndex + 1];
        nextStatus = `ARRIVED_${nextHub}`;
        nextLocation = nextHub;
        nextMessage = `En route to next facility. Arrived at ${nextHub} Hub.`;
      } else {
        nextStatus = "OUT_FOR_DELIVERY";
        nextLocation = booking.buyer_city || "";
        nextMessage = `Shipment reached final sorting area. Out for delivery to ${nextLocation}.`;
      }
    } else if (currentStatus === "OUT_FOR_DELIVERY") {
      nextStatus = "DELIVERED";
      nextLocation = booking.buyer_city || "";
      nextMessage = "Delivered successfully! Package handed over to recipient.";
    } else {
      return NextResponse.json({ message: "Already delivered" });
    }

    await db.insert(trackingEvents).values({
      booking_id: trackingId,
      status: nextStatus,
      location: nextLocation,
      message: nextMessage,
    });

    return NextResponse.json({ success: true, nextStatus });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Simulation failed" }, { status: 500 });
  }
}
