import { NextResponse } from "next/server";
import { db } from "@/db";
import { packages } from "@/db/schema";

export async function GET() {
  try {
    const result = await db.select().from(packages);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Packages fetch error:", e);
    return NextResponse.json([]);
  }
}
