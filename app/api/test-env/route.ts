// /app/api/test-env/route.js

export async function GET() {
  return Response.json({
    gemini: process.env.GEMINI_API_KEY ? "ok" : "missing",
    db: process.env.DATABASE_URL ? "ok" : "missing",
    ml: process.env.NEXT_PUBLIC_ML_URL ? "ok" : "missing",
  });
}