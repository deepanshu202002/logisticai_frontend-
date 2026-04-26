import { NextResponse } from "next/server";
import { db } from "@/db";
import { alerts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await db.update(alerts).set({ resolved: true }).where(eq(alerts.id, Number(params.id)));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
