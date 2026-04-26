import { NextResponse } from "next/server";
import { db } from "@/db";
import { alerts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(alerts).where(eq(alerts.resolved, false)).orderBy(desc(alerts.created_at));
    return NextResponse.json(result);
  } catch (e) {
    console.error("Alerts fetch error:", e);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of 500 for demo resilience
  }
}
