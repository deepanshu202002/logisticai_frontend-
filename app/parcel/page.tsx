"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Package, ArrowRight, Zap, DollarSign, Clock, AlertTriangle, RefreshCcw, Bell, CheckCircle, Settings2, Cloud, Bot, Calendar, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import MapView from "@/components/MapView";
import StatsPanel from "@/components/StatsPanel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { calculateETA } from "@/lib/etaUtils";
import { format } from "date-fns";

const API_BASE = "/api";

const HUB_CITIES = [
  "Delhi","Mumbai","Bangalore","Chennai","Hyderabad",
  "Jaipur","Surat","Indore","Bhopal","Nagpur",
  "Kochi","Patna","Bhubaneswar","Visakhapatnam",
  "Kolkata","Pune","Ahmedabad",
];

const CITY_COORDS: Record<string, [number, number]> = {
  "Delhi":[28.6139,77.2090],"Mumbai":[19.0760,72.8777],"Bangalore":[12.9716,77.5946],
  "Chennai":[13.0827,80.2707],"Hyderabad":[17.3850,78.4867],"Jaipur":[26.9124,75.7873],
  "Surat":[21.1702,72.8311],"Indore":[22.7196,75.8577],"Bhopal":[23.2599,77.4126],
  "Nagpur":[21.1458,79.0882],"Kochi":[9.9312,76.2673],"Patna":[25.5941,85.1376],
  "Bhubaneswar":[20.2961,85.8245],"Visakhapatnam":[17.6868,83.2185],
  "Kolkata":[22.5726,88.3639],"Pune":[18.5204,73.8567],"Ahmedabad":[23.0225,72.5714],
  "Delhi North":[28.7500,77.1200],"Delhi South":[28.5200,77.2100],
  "Mumbai West":[19.1000,72.8200],"Bangalore East":[12.9800,77.6500],
  "Mumbai Hub":[19.0760,72.8777],"Delhi Hub":[28.6139,77.2090],
  "Chennai Hub":[13.0827,80.2707],"Bangalore Hub":[12.9716,77.5946],
};

const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function ParcelPage() {
  const [hubs, setHubs]               = useState<any[]>([]);
  const [packages, setPackages]       = useState<any[]>([]);
  const [sellerCity, setSellerCity]   = useState("Delhi");
  const [buyerCity, setBuyerCity]     = useState("Chennai");
  const [weightKg, setWeightKg]       = useState(2);
  const [priority, setPriority]       = useState<"express"|"standard">("standard");
  const [routeResult, setRouteResult] = useState<any>(null);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [stormActive, setStormActive] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [rebalancingFlows, setRebalancingFlows] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const fetchData = async () => {
    try {
      const [hRes, pRes] = await Promise.all([
        axios.get(`${API_BASE}/parcel/hubs`),
        axios.get(`${API_BASE}/parcel/packages`),
      ]);
      setHubs(hRes.data);
      setPackages(pRes.data);
    } catch(e) {
      toast.error("Failed to fetch live network data. Showing cached state.");
    }
  };

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 30000);
    return () => clearInterval(inv);
  }, []);

  const findRoute = async () => {
    if (sellerCity === buyerCity) {
      toast.error("Seller and buyer must be in different cities");
      return;
    }
    setLoading(true);
    setRouteResult(null);
    setSelectedRoute(null);
    try {
      const res = await axios.post(`${API_BASE}/parcel/route-package`, {
        seller_city: sellerCity,
        buyer_city:  buyerCity,
        weight_kg:   weightKg,
        priority,
      });
      setRouteResult(res.data);
      setSelectedRoute(res.data.routes?.[0] ?? null);
      
      // Auto-scroll on mobile
      if (window.innerWidth < 1024) {
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }

      // Fetch AI Recommendation
      try {
        setAiRecommendation(null);
        const aiRes = await axios.post(`${API_BASE}/ai/analyze`, {
          mode: "parcel",
          context: { 
             routes: res.data.routes, 
             seller_city: sellerCity, 
             buyer_city: buyerCity, 
             weight_kg: weightKg, 
             priority,
             overloaded_hubs: res.data.overloaded_hubs
          }
        });
        setAiRecommendation(aiRes.data.analysis);
      } catch(e) {
        setAiRecommendation("AI analysis unavailable.");
      }

    } catch(e) {
      toast.error("Routing failed — check that the Python server is running");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (route: any) => {
    setIsBooking(true);
    setBookingResult(null);
    try {
      const eta = calculateETA(route.distance_km, priority, route.path, hubs);
      const res = await axios.post("/api/parcel/book", {
        type: 'parcel',
        seller_city: sellerCity,
        buyer_city: buyerCity,
        route,
        priority,
        weight_kg: weightKg,
        eta_date: eta.arrivalDate
      });
      setBookingResult(res.data);
    } catch (err) {
      toast.error("Booking failed. Please try again.");
      setIsBooking(false);
    }
  };

  const autoRebalance = async () => {
    setIsOptimizing(true);
    try {
      const res = await axios.post(`${API_BASE}/parcel/rebalance`);
      toast.success(res.data.message);
      
      // Visual feedback: Show flows for 3 seconds
      const overloaded = hubs.filter(h => (h.current_load / h.capacity) > 0.9);
      if (overloaded.length > 0) {
        const flows = overloaded.map(h => ({
          positions: [CITY_COORDS[h.id] || [0,0], CITY_COORDS["Delhi"] || [0,0]], 
          color: "#3b82f6"
        }));
        setRebalancingFlows(flows);
      }

      setTimeout(() => {
        setRebalancingFlows([]);
        setIsOptimizing(false);
        fetchData();
      }, 3000);
    } catch(e) { 
      toast.error("Rebalance failed"); 
      setIsOptimizing(false);
    }
  };

  const simPeakSale = async () => {
    await axios.post(`${API_BASE}/simulate/peak_sale`);
    toast.error("Peak sale volume activated!");
    fetchData();
  };

  const simHubStorm = async () => {
    try {
      const res = await axios.post(`${API_BASE}/simulate/parcel-storm`);
      toast.error(`🌩 ${res.data.message}`);
      setStormActive(true);
      fetchData();
    } catch(e) { toast.error("Storm simulation failed"); }
  };

  const clearStorm = async () => {
    try {
      const res = await axios.post(`${API_BASE}/simulate/parcel-reset`);
      toast.success(res.data.message);
      setStormActive(false);
      fetchData();
    } catch(e) { toast.error("Reset failed"); }
  };

  // Map elements
  const hubMarkers = hubs.map(h => {
    const loadPct = (h.current_load ?? 0) / (h.capacity ?? 1);
    const color = loadPct > 0.95 ? "#ef4444" : loadPct > 0.85 ? "#f97316" : "#22c55e";
    return {
      id: h.id, lat: h.lat, lng: h.lng, color,
      onClick: () => {},
      popup: <div className="text-gray-900 font-bold">{h.city}<br/>Load: {(loadPct*100).toFixed(0)}%</div>
    };
  });

  const routeLines = selectedRoute
    ? [{
        positions: selectedRoute.path
          .map((c: string) => CITY_COORDS[c])
          .filter(Boolean) as [number,number][],
        color: priority === "express" ? "#f59e0b" : "#3b82f6",
      }]
    : [];

  const overloadedHubs = hubs.filter(h => (h.current_load/h.capacity) > 0.85);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-gray-950 text-white">

      {/* TOP: Hub Status Strip */}
      <div className="h-16 border-b border-gray-800 bg-gray-900 flex items-center px-4 gap-3 shrink-0 overflow-x-auto">
        <span className="text-xs text-gray-500 font-semibold uppercase shrink-0">Hub Network:</span>
        {hubs.filter(h => !h.city.includes("North") && !h.city.includes("South") && !h.city.includes("West") && !h.city.includes("East"))
          .map(h => {
          const pct = (h.current_load / h.capacity) * 100;
          return (
            <div key={h.id} className="flex flex-col items-center shrink-0 cursor-default" title={`${h.city}: ${pct.toFixed(0)}%`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[9px] font-bold relative
                ${h.status === "storm"    ? "border-blue-400 bg-blue-900/60 text-blue-100 animate-pulse" :
                  pct > 95              ? "border-red-500 bg-red-900/40 text-red-200" :
                  pct > 85              ? "border-orange-400 bg-orange-900/40 text-orange-200" :
                                         "border-green-500 bg-green-900/30 text-green-200"}`}>
                {Math.round(pct)}
              </div>
              <span className="text-[8px] text-gray-500 mt-0.5 max-w-[40px] truncate">{h.city.split(" ")[0]}</span>
            </div>
          );
        })}
        <div className="ml-auto flex gap-2 shrink-0">
          <Button size="sm" variant="destructive" onClick={simPeakSale} className="text-xs h-7"><Bell size={12} className="mr-1"/>Peak Sale</Button>
          {!stormActive
            ? <Button size="sm" onClick={simHubStorm} className="text-xs h-7 bg-blue-700 hover:bg-blue-600">
                <Cloud size={12} className="mr-1"/>Simulate Storm
              </Button>
            : <Button size="sm" onClick={clearStorm} className="text-xs h-7 bg-sky-600 hover:bg-sky-500 animate-pulse">
                <Cloud size={12} className="mr-1"/>Clear Storm ⚡
              </Button>
          }
          {overloadedHubs.length > 0 &&
            <Button size="sm" onClick={autoRebalance} className="text-xs h-7 bg-orange-600 hover:bg-orange-500">
              <RefreshCcw size={12} className="mr-1"/>Rebalance
            </Button>
          }
        </div>
      </div>

      {/* MAIN: Responsive Layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* LEFT: Route Planner */}
        <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-gray-800 flex flex-col bg-gray-900 shrink-0 h-auto lg:h-full">
          <div className="p-4 border-b border-gray-800 bg-gray-950">
            <h2 className="font-bold flex items-center gap-2"><Package size={16} className="text-emerald-400"/>Parcel Router</h2>
            <p className="text-xs text-gray-500 mt-1">Find the fastest & cheapest delivery path</p>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* From */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Seller City (From)</label>
              <select value={sellerCity} onChange={e => setSellerCity(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none">
                {HUB_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* To */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Buyer City (To)</label>
              <select value={buyerCity} onChange={e => setBuyerCity(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none">
                {HUB_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Weight */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Weight (kg)</label>
              <input type="number" min={0.1} step={0.5} value={weightKg}
                onChange={e => setWeightKg(parseFloat(e.target.value) || 1)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"/>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Priority</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setPriority("standard")}
                  className={`py-2 rounded text-sm font-medium transition-colors ${priority === "standard" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                  Standard
                </button>
                <button onClick={() => setPriority("express")}
                  className={`py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1 ${priority === "express" ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                  <Zap size={13}/> Express
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {priority === "express" ? "Skips overloaded hubs • optimises for time" : "Uses cheapest path • tolerates delays"}
              </p>
            </div>

            <Button onClick={findRoute} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold">
              {loading ? "Calculating..." : "Find Best Routes →"}
            </Button>

            {/* Overload warning */}
            {overloadedHubs.length > 0 && (
              <div className="bg-orange-950/40 border border-orange-500/40 rounded p-3 text-xs">
                <div className="flex items-center gap-1 text-orange-400 font-semibold mb-1">
                  <AlertTriangle size={12}/> {overloadedHubs.length} hub{overloadedHubs.length > 1 ? "s" : ""} overloaded
                </div>
                <div className="text-gray-400">{overloadedHubs.map(h => h.city).join(", ")}</div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Map */}
        <div className="flex-1 relative min-h-[350px] lg:min-h-0 border-b lg:border-b-0 border-gray-800">
          {selectedRoute && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-gray-900/90 backdrop-blur border border-gray-700 rounded-full px-4 py-1.5 text-sm flex items-center gap-2 max-w-[90vw] overflow-x-auto whitespace-nowrap scrollbar-hide">
              {selectedRoute.path.map((c: string, i: number) => (
                <React.Fragment key={i}>
                  <span className={i === 0 || i === selectedRoute.path.length-1 ? "font-bold text-white" : "text-gray-300"}>{c}</span>
                  {i < selectedRoute.path.length-1 && <ArrowRight size={12} className="text-gray-500"/>}
                </React.Fragment>
              ))}
            </div>
          )}
          <MapView 
            markers={hubMarkers} 
            routes={routeLines} 
            activeFlows={rebalancingFlows}
            center={[20.5, 78.5]} 
            zoom={5}
          />
          
          {/* Optimization Overlay */}
          {isOptimizing && (
            <div className="absolute inset-0 z-30 bg-blue-900/10 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-500">
              <div className="bg-gray-900/90 border border-blue-500/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.3)] flex flex-col items-center gap-4 max-w-xs text-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <RefreshCcw size={24} className="absolute inset-0 m-auto text-blue-400 animate-pulse"/>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Optimizing Network</h3>
                  <p className="text-xs text-blue-300/70 font-medium uppercase tracking-widest mt-1">Rebalancing Cargo Loads</p>
                </div>
                <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full animate-[progress_3s_ease-in-out]"></div>
                </div>
                <p className="text-[10px] text-gray-500 italic">Redistributing pending parcels to underutilized hubs...</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Route Results */}
        <div ref={resultsRef} className="w-full lg:w-80 border-l-0 lg:border-l border-gray-800 flex flex-col bg-gray-900 shrink-0 h-auto lg:h-full overflow-y-auto min-h-[300px]">
          <div className="p-4 border-b border-gray-800 bg-gray-950">
            <h2 className="font-bold text-sm">Route Options</h2>
            {routeResult && (
              <p className="text-xs text-gray-500 mt-0.5">
                {sellerCity} → {buyerCity} • {weightKg}kg • {priority}
                {routeResult.overloaded_hubs?.length > 0 &&
                  <span className="text-orange-400 ml-1">({routeResult.overloaded_hubs.length} hubs avoided)</span>
                }
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!routeResult && !loading && (
              <div className="text-center py-12 text-gray-600 text-sm">
                <Package size={32} className="mx-auto mb-3 opacity-30"/>
                Select cities and click<br/>"Find Best Routes"
              </div>
            )}
            
            {/* AI Advisor for Parcel */}
            {routeResult && !loading && (
              <div className="bg-emerald-900/10 p-4 rounded border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-sm">
                  <Bot size={16} /> AI Routing Advisor
                </div>
                {aiRecommendation ? (
                  <p className="text-sm text-gray-300 leading-relaxed">{aiRecommendation}</p>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                    <div className="w-4 h-4 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin"></div>
                    Analyzing route options...
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="text-center py-12 text-gray-500 text-sm animate-pulse">
                Calculating optimal routes...
              </div>
            )}
            {routeResult?.error && (
              <div className="text-red-400 text-sm p-3 bg-red-950/30 rounded border border-red-500/30">
                {routeResult.error}
              </div>
            )}
            {routeResult?.routes?.map((r: any, i: number) => {
              const isSelected = selectedRoute?.rank_label === r.rank_label;
              return (
                <div key={i} onClick={() => setSelectedRoute(r)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${isSelected ? "border-emerald-500 bg-emerald-900/20 ring-1 ring-emerald-500/50" : "border-gray-700 bg-gray-800/60 hover:border-gray-500"}`}>

                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-yellow-400 text-sm">🥇</span>}
                      {i === 1 && <span className="text-gray-400 text-sm">🥈</span>}
                      {i === 2 && <span className="text-amber-600 text-sm">🥉</span>}
                      <span className="font-semibold text-sm">{r.rank_label}</span>
                    </div>
                    {isSelected && <CheckCircle size={14} className="text-emerald-400"/>}
                  </div>

                  {/* Path */}
                  <div className="flex flex-wrap gap-1 items-center text-xs mb-3">
                    {r.path.map((city: string, j: number) => (
                      <React.Fragment key={j}>
                        <span className={j === 0 || j === r.path.length-1 ? "text-white font-semibold" : "text-gray-400"}>{city}</span>
                        {j < r.path.length-1 && <ArrowRight size={10} className="text-gray-600"/>}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-900 rounded p-2">
                      <div className="flex items-center gap-1 text-gray-500 mb-0.5"><Clock size={10}/> Time</div>
                      <span className="text-white font-semibold">{r.estimated_hours}h</span>
                    </div>
                    <div className="bg-gray-900 rounded p-2">
                      <div className="flex items-center gap-1 text-gray-500 mb-0.5"><DollarSign size={10}/> Cost</div>
                      <span className="text-white font-semibold">{fmt(r.cost_breakdown.total_inr)}</span>
                    </div>
                    <div className="bg-gray-900 rounded p-2">
                      <div className="text-gray-500 mb-0.5">Distance</div>
                      <span className="text-white">{r.distance_km} km</span>
                    </div>
                    <div className="bg-gray-900 rounded p-2">
                      <div className="text-gray-500 mb-0.5">Hub Stops</div>
                      <span className="text-white">{r.hub_stops}</span>
                    </div>
                  </div>

                  {/* ETA Display - Timeline Stepper */}
                  {(() => {
                    const eta = calculateETA(r.distance_km, priority, r.path, hubs, r.delay_minutes || 0);
                    return (
                      <div className="mt-3 bg-gray-950/60 border border-gray-800 rounded-xl p-3 space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-1.5 mb-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Transit Timeline</span>
                          <span className="text-[10px] text-blue-400 font-bold">{eta.days} Days</span>
                        </div>

                        <div className="relative space-y-4">
                          <div className="absolute left-[5px] top-1 bottom-1 w-[1px] bg-gray-800"></div>
                          
                          <div className="relative flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-gray-950 z-10"></div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-gray-500 leading-none mb-0.5">START: DEPARTURE</span>
                              <span className="text-[11px] text-white font-semibold leading-none">{format(new Date(), "MMM d, HH:mm")}</span>
                            </div>
                          </div>

                          <div className="relative flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-gray-950 z-10"></div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-emerald-500 leading-none mb-0.5">END: EST. ARRIVAL</span>
                              <span className="text-[11px] text-white font-bold leading-none">{eta.formattedArrival}</span>
                            </div>
                          </div>
                        </div>

                        {eta.weatherDelay && (
                          <div className="text-[9px] text-amber-400 flex items-center gap-1.5 pt-1">
                            <AlertTriangle size={10}/> Factors: Weather Disruptions
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Cost breakdown */}
                  <div className="mt-2 text-[10px] text-gray-500 border-t border-gray-700 pt-2 space-y-0.5">
                    <div className="flex justify-between"><span>Freight</span><span className="text-gray-300">{fmt(r.cost_breakdown.freight_inr)}</span></div>
                    <div className="flex justify-between"><span>Hub Handling</span><span className="text-gray-300">{fmt(r.cost_breakdown.handling_inr)}</span></div>
                  </div>

                  {/* Delay Risk — XGBoost */}
                  {r.delay_risk && (
                    <div className="mt-2 bg-gray-900/80 rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Settings2 size={9} className="text-purple-400"/> XGBoost Delay Risk
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize
                          ${ r.delay_risk.category === "critical" ? "bg-red-900/60 text-red-300" :
                             r.delay_risk.category === "major"    ? "bg-orange-900/60 text-orange-300" :
                             r.delay_risk.category === "minor"    ? "bg-yellow-900/60 text-yellow-300" :
                                                                    "bg-green-900/60 text-green-300" }`}>
                          {r.delay_risk.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all
                              ${ r.delay_risk.probability > 0.7 ? "bg-red-500" :
                                 r.delay_risk.probability > 0.4 ? "bg-yellow-400" :
                                                                   "bg-green-500" }`}
                            style={{ width: `${(r.delay_risk.probability * 100).toFixed(1)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-300 shrink-0">
                          {(r.delay_risk.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {r.skipped_hubs?.length > 0 && (
                    <div className="mt-2 text-[10px] text-green-400">
                      ✓ Avoided overloaded: {r.skipped_hubs.join(", ")}
                    </div>
                  )}

                  {isSelected && (
                    <Button 
                      onClick={(e) => { e.stopPropagation(); handleBook(r); }}
                      className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 shadow-lg shadow-emerald-950/20"
                    >
                      <Package size={14} className="mr-2"/> Book This Route
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <StatsPanel stats={[
        { label: "Total Packages", value: packages.length },
        { label: "In Transit",     value: packages.filter(p => p.status==="in_transit").length },
        { label: "Stuck",          value: packages.filter(p => p.status==="stuck").length, color: "text-red-400" },
        { label: "Hub Cities",     value: HUB_CITIES.length },
      ]}/>

      {/* Booking Modal */}
      {isBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
             {!bookingResult ? (
               <div className="text-center py-8">
                 <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                 <h2 className="text-xl font-bold text-white">Confirming Booking...</h2>
                 <p className="text-gray-400 mt-2">Securing slot in sorting facilities.</p>
               </div>
             ) : (
               <div className="space-y-6">
                 <div className="flex justify-between items-start">
                   <div className="bg-emerald-500/20 p-3 rounded-full">
                     <CheckCircle size={32} className="text-emerald-500"/>
                   </div>
                   <button onClick={() => setIsBooking(false)} className="text-gray-500 hover:text-white"><X/></button>
                 </div>
                 
                 <div>
                   <h2 className="text-2xl font-bold text-white">Parcel Registered!</h2>
                   <p className="text-gray-400">Your shipment is ready for pickup.</p>
                 </div>

                 <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 space-y-3">
                   <div>
                     <div className="text-xs text-gray-500 uppercase">Tracking ID</div>
                     <div className="text-lg font-mono font-bold text-emerald-400 tracking-wider">{bookingResult.tracking_id}</div>
                   </div>
                   <div className="flex justify-between border-t border-gray-800 pt-3 text-sm">
                     <div>
                       <div className="text-xs text-gray-500 uppercase">Est. Delivery</div>
                       <div className="font-semibold text-white">
                         {calculateETA(selectedRoute.distance_km, priority, selectedRoute.path, hubs).formattedArrival}
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-xs text-gray-500 uppercase">Status</div>
                       <div className="font-semibold text-emerald-400 px-2 py-0.5 bg-emerald-900/30 rounded">Booked</div>
                     </div>
                   </div>
                 </div>

                 <button 
                  onClick={() => window.location.href = `/track?id=${bookingResult.tracking_id}`}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2"
                 >
                   Go to Live Tracking <ArrowRight size={18}/>
                 </button>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
