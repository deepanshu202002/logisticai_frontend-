import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, trackingEvents } from "@/db/schema";
import { format } from "date-fns";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { seller_city, buyer_city, route, priority, weight_kg, eta_date, type } = body;

    // 1. Generate Tracking ID: HBS-YYYYMMDD-XXXXX
    const dateStr = format(new Date(), "yyyyMMdd");
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const trackingId = `HBS-${dateStr}-${randomSuffix}`;
    
    console.log(`[BOOKING] Creating new shipment: ${trackingId} for ${seller_city} -> ${buyer_city}`);

    // 2. Create Booking
    await db.insert(bookings).values({
      id: trackingId,
      type: type || 'parcel',
      seller_city,
      buyer_city,
      route,
      priority,
      weight_kg: weight_kg || 5,
      eta_date: new Date(eta_date),
      status: "booked",
    });

    console.log(`[BOOKING] Successfully saved booking ${trackingId}`);

    // 3. Initial Tracking Event
    await db.insert(trackingEvents).values({
      booking_id: trackingId,
      status: "BOOKED",
      location: seller_city,
      message: `Shipment order created and confirmed for routing via ${route.path.length} hubs.`,
    });

    return NextResponse.json({ 
      success: true, 
      tracking_id: trackingId,
      message: "Shipment booked successfully!" 
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}
