# LogisticAI 🚛

> **Predict. Reroute. Deliver.**

AI-powered supply chain intelligence that predicts delivery delays before they cascade and automatically reroutes shipments to minimize cost — built for the Google Solution Challenge 2026.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-logisticai--frontend.vercel.app-blue)](https://logisticai-frontend.vercel.app)
[![API Docs](https://img.shields.io/badge/API%20Docs-Swagger%20UI-green)](https://logisticai-ml-backend.onrender.com/docs)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-3%20Minutes-red)](https://drive.google.com/file/d/1C2Q9V9VFoSYso0PIVyCWEJESm3LcDw83/view?usp=drive_link)

---

## The Problem

Modern supply chains manage millions of shipments across volatile, complex networks. Existing tools like FedEx Tracking and SAP TM only detect delays **after** they've already cascaded — by then, cargo is spoiled, customers are upset, and emergency rerouting costs are sky-high. Global supply chain disruptions cost companies **$184 billion annually**, most of it preventable.

## The Solution

LogisticAI flips the model from **reactive** to **predictive**. It scores delay risk in real time, reroutes automatically, and lets Google Gemini explain every decision in plain English.

### Three Logistics Layers

| Layer | Status | Description |
|---|---|---|
| Bulk Freight | ✅ Live | Long-haul truck fleet monitoring + ML delay prediction + cost-aware rerouting |
| Parcel Distribution | ✅ Live | Hub-to-hub package routing with capacity-aware path optimization |
| Hyperlocal | 🔜 Planned | Quick-commerce layer for dark store routing and rider rebalancing |

---

## Key Features

- **XGBoost delay prediction** — scores each truck 0–100% using 7 features: cargo type, weight, weather severity, traffic index, route history, time-of-day, hub utilization
- **Custom Dijkstra routing** — finds the cheapest path in INR across a 20-city India road network, with exact cost breakdown (fuel + tolls + driver wages + delay penalty)
- **Cargo-aware pricing** — perishables = ₹3,500/hr delay penalty vs. machinery = ₹400/hr; same storm, different rerouting decision
- **Hub overload prevention** — auto-reroutes parcels when any hub exceeds 95% capacity
- **Gemini AI Co-Pilot** — reads live network state, recommends optimal routes in plain English, auto-drafts customer SMS alerts
- **Live simulation** — Storm, Peak Sale, and Lunch Rush buttons trigger the full prediction-reroute-notify pipeline in under 3 seconds
- **Real-time Supabase updates** — truck status rows flip live during demo (on_time → critical → rerouted)

## Proven Impact

> One storm. One electronics truck. One reroute.

| | Original Route | LogisticAI Reroute |
|---|---|---|
| Path | Delhi → Agra → Mumbai | Delhi → Jaipur → Ahmedabad → Mumbai |
| Cost | ₹16.8L | ₹84K |
| Time | 777 hours | 32 hours |
| **Savings** | — | **94.7% cost reduction** |

---

## Tech Stack

### Frontend
- **Next.js 14** + React + Tailwind CSS
- **Leaflet.js** — interactive India map with live truck tracking
- **Recharts** + shadcn/ui — cost analytics dashboards

### Backend
- **Python FastAPI** — ML computation, routing engine, disruption rules
- **XGBoost** + Scikit-learn — delay probability model (500 training samples)
- **Custom Dijkstra** — INR cost-aware graph routing

### Data & Infrastructure
- **Supabase** (PostgreSQL) + Drizzle ORM — real-time state management
- **Vercel** — frontend hosting (free tier)
- **Render.com** — FastAPI ML service (free tier)

### AI
- **Google Gemini Flash 1.5** — route recommendations + customer SMS drafting
- **Google AI Studio** — API key management

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase account (free)
- Google AI Studio API key (free)

### Environment Variables

Create a `.env.local` in the frontend root:

```env
DATABASE_URL=your_supabase_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ML_URL=https://your-render-backend.onrender.com
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend Setup

```bash
git clone https://github.com/deepanshu202002/logisticai_frontend-
cd logisticai_frontend-
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The FastAPI Swagger UI will be available at `http://localhost:8000/docs`.

---

## Project Structure

```
logisticai/
├── app/                    # Next.js 14 app router
│   ├── bulk-freight/       # Truck fleet dashboard
│   ├── parcel/             # Parcel distribution dashboard
│   └── api/                # Gemini API routes
├── components/             # Reusable UI components
├── lib/                    # Supabase client + utilities
├── backend/                # FastAPI ML service
│   ├── main.py             # API endpoints
│   ├── ml_model.py         # XGBoost delay prediction
│   └── routing.py          # Dijkstra routing engine
└── db/                     # Drizzle ORM schema
```

---

## Live Links

| Resource | URL |
|---|---|
| Live App | https://logisticai-frontend.vercel.app |
| API Swagger UI | https://logisticai-ml-backend.onrender.com/docs |
| Demo Video (3 min) | https://drive.google.com/file/d/1C2Q9V9VFoSYso0PIVyCWEJESm3LcDw83/view?usp=drive_link |

> **Note:** The ML backend on Render may take 1–2 minutes to wake from inactivity on the free tier. If predictions don't load immediately, wait a moment and retry.

---

## Google Solution Challenge 2026

This project was built for the **Google Solution Challenge 2026** under the **Build with AI** track. It uses Google Gemini Flash as a core part of the solution — not as a wrapper, but as a reasoning layer that reads live logistics state and produces actionable decisions in natural language.

**Team:** LogisticAI  
**Team Leader:** Nikhil Saraf

---

## License

MIT License — see [LICENSE](LICENSE) for details.
