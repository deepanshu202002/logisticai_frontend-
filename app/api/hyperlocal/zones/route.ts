import { NextResponse } from "next/server";
import { db } from "@/db";
import { zones } from "@/db/schema";

export async function GET() {
  const result = await db.select().from(zones);
  return NextResponse.json(result);
}
