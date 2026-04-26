import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

  let mode = "unknown";
  let context: any = {};

  try {
    const body = await request.json();
    mode = body.mode;
    context = body.context;

    let prompt = "";

    if (mode === "bulk") {
      const t = context;
      prompt = `You are LogisticAI's route intelligence system for a bulk freight company in India.
Analyze this truck's situation and give a concise operational recommendation.

Truck ID: ${t.id}
Driver: ${t.driver_name}
Route: ${t.origin} → ${t.destination}
Cargo: ${t.cargo} (${t.weight_tons} tons)
Status: ${t.status}
Weather: ${t.weather_condition}
Traffic: ${t.traffic_level}
Current Delay: ${t.delay_minutes} minutes
XGBoost Delay Risk: ${t.prediction ? (t.prediction.delay_probability * 100).toFixed(1) + "% (" + t.prediction.delay_category + ")" : "N/A"}
${t.route_options ? `
Reroute Available: ${t.route_options.recommendation}
Reroute Path: ${t.route_options.primary?.path?.join(" → ") || "N/A"}
Cost Saving: ₹${t.route_options.cost_saving_inr} (${t.route_options.cost_saving_pct}%)
Reroute Time: ${t.route_options.primary?.estimated_time_hours}h
Disruptions Avoided: ${t.route_options.disruptions_avoided?.join(", ") || "none"}
` : ""}

Give a 2-3 sentence operational recommendation. Be direct, specific, and use Indian logistics context.
Mention the key risk and the best immediate action. Do NOT use bullet points or markdown headers.`;

    } else if (mode === "parcel") {
      const { routes, seller_city, buyer_city, weight_kg, priority, overloaded_hubs } = context;
      const top = routes?.[0];
      const second = routes?.[1];

      prompt = `You are LogisticAI's parcel routing AI for an e-commerce delivery network in India.

Parcel: ${seller_city} → ${buyer_city}
Weight: ${weight_kg}kg | Priority: ${priority}
Overloaded hubs: ${overloaded_hubs?.join(", ") || "none"}

Top Route (${top?.rank_label}): ${top?.path?.join(" → ")}
Distance: ${top?.distance_km}km | Time: ${top?.estimated_hours}h | Cost: ₹${top?.cost_breakdown?.total_inr}
Delay Risk: ${top?.delay_risk ? (top.delay_risk.probability * 100).toFixed(1) + "% (" + top.delay_risk.category + ")" : "N/A"}
${second ? `
Alternative (${second?.rank_label}): ${second?.path?.join(" → ")}
Distance: ${second?.distance_km}km | Time: ${second?.estimated_hours}h | Cost: ₹${second?.cost_breakdown?.total_inr}
Delay Risk: ${second?.delay_risk ? (second.delay_risk.probability * 100).toFixed(1) + "% (" + second.delay_risk.category + ")" : "N/A"}
` : ""}

Give a 2-3 sentence delivery recommendation. Explain which route is better and why, considering the delay risk and cost.
Be specific and mention the trade-offs. Do NOT use bullet points or markdown headers.`;
    } else if (mode === "customer_update") {
      const t = context;
      prompt = `You are an automated customer service assistant for an Indian logistics company.
Write a short, polite, and empathetic SMS/Email update (max 3 sentences) to a customer whose cargo is delayed.

Cargo: ${t.cargo}
Route: ${t.origin} → ${t.destination}
Delay Reason: ${t.weather_condition === 'storm' ? 'Severe weather/Storm' : t.weather_condition === 'rain' ? 'Heavy rain' : 'Traffic/Logistics bottleneck'}
Current Delay: ${t.delay_minutes} minutes

The message should apologize for the delay, briefly mention the reason without sounding like an excuse, and assure them we are actively routing around it. Do not include subject lines or placeholders like [Customer Name]. Keep it ready to send.`;
    }

    if (!prompt) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ analysis: text, model: "gemini-1.5-flash" });
  } catch (e: any) {
    // console.error("Gemini error:", e?.message ?? e); // Muted to keep terminal clean during mock fallback mode

    // Fallback Mock Response for demo purposes if API key is invalid/missing
    let mockText = "AI analysis temporarily unavailable.";

    if (mode === "bulk") {
      const t = context;
      mockText = t.prediction?.delay_probability > 0.5
        ? `High risk of delay detected due to ${t.weather_condition}. Recommend rerouting immediately to avoid the impacted zones.`
        : `Route is currently stable. Proceed on the current path, but monitor traffic near ${t.destination}.`;
    } else if (mode === "parcel") {
      const top = context?.routes?.[0];
      mockText = top?.delay_risk?.probability > 0.5
        ? `The primary route has high delay risk. Consider the alternative path to ensure on-time delivery despite the higher cost.`
        : `The primary route through ${top?.path?.[1] || 'hub'} is optimal. It offers the best balance of low risk and cost efficiency.`;
    } else if (mode === "customer_update") {
      const t = context;
      mockText = `We apologize for the delay of your ${t.cargo} shipment to ${t.destination}. It is currently facing a slight delay due to ${t.weather_condition}. Our team is actively managing the route to ensure it reaches you safely and as soon as possible.`;
    }

    return NextResponse.json({
      analysis: `${mockText} (Simulated Analysis - Invalid API Key)`,
      model: "mock-gemini"
    });
  }
}
