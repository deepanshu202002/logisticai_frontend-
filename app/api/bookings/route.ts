import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.created_at));
      
    return NextResponse.json(list);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
