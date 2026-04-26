import { NextResponse } from "next/server";

export async function POST() {
  // Normally we would call seed function here, but Next.js API limits making system calls or long seeds without dedicated queue.
  // We'll instruct the UI to show a message or just execute a child process.
  return NextResponse.json({ message: "Reset requested. Please run `npm run db:seed` in the terminal for full reset." });
}
