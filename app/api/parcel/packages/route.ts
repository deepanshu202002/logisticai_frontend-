import { NextResponse } from "next/server";
import { db } from "@/db";
import { packages } from "@/db/schema";

export async function GET() {
  const result = await db.select().from(packages);
  return NextResponse.json(result);
}
