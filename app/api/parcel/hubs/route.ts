import { NextResponse } from "next/server";
import { db } from "@/db";
import { hubs } from "@/db/schema";

export async function GET() {
  try {
    const result = await db.select().from(hubs);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Hubs fetch error:", e);
    return NextResponse.json([]);
  }
}
