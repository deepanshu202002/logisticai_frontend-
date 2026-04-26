import { NextResponse } from "next/server";
import { db } from "@/db";
import { riders } from "@/db/schema";

export async function GET() {
  const result = await db.select().from(riders);
  return NextResponse.json(result);
}
