import { NextResponse } from "next/server";
import { db } from "@/db";
import { hubs } from "@/db/schema";

export async function GET() {
  const result = await db.select().from(hubs);
  return NextResponse.json(result);
}
