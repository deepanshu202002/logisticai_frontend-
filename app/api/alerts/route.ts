import { NextResponse } from "next/server";
import { db } from "@/db";
import { alerts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const result = await db.select().from(alerts).where(eq(alerts.resolved, false)).orderBy(desc(alerts.created_at));
  return NextResponse.json(result);
}
