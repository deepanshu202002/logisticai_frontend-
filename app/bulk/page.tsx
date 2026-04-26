"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { CloudRain, CloudLightning, ShieldAlert, Navigation, Settings2, Truck as TruckIcon, X, CheckCircle, RefreshCcw, Bot, MessageSquare, Copy, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import MapView from "@/components/MapView";
import RouteCard from "@/components/RouteCard";
import StatsPanel from "@/components/StatsPanel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// API calls now route through the Next.js local server
const API_BASE = "/api";

const CITY_COORDS: Record<string, [number, number]> = {
  "Delhi":         [28.6139, 77.2090], "Mumbai":        [19.0760, 72.8777],
  "Chennai":       [13.0827, 80.2707], "Bangalore":     [12.9716, 77.5946],
  "Kolkata":       [22.5726, 88.3639], "Hyderabad":     [17.3850, 78.4867],
  "Pune":          [18.5204, 73.8567], "Ahmedabad":     [23.0225, 72.5714],
  "Jaipur":        [26.9124, 75.7873], "Chandigarh":    [30.7333, 76.7794],
  "Agra":          [27.1767, 78.0081], "Lucknow":       [26.8467, 80.9462],
  "Surat":         [21.1702, 72.8311], "Indore":        [22.7196, 75.8577],
  "Bhopal":        [23.2599, 77.4126], "Nagpur":        [21.1458, 79.0882],
  "Kochi":         [9.9312,  76.2673], "Patna":         [25.5941, 85.1376],
  "Bhubaneswar":   [20.2961, 85.8245], "Visakhapatnam": [17.6868, 83.2185],
};

export default function BulkPage() {
  const [trucks, setTrucks] = useState<any[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<any>(null);
  const [truckDetails, setTruckDetails] = useState<any>(null);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [customerDraft, setCustomerDraft] = useState<string | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);

  const fetchTrucks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/bulk/trucks`);
      setTrucks(res.data);
    } catch(e) { }
  };

  useEffect(() => {
    fetchTrucks();
    const inv = setInterval(fetchTrucks, 5000);
    return () => clearInterval(inv);
  }, []);

  const selectTruck = async (t: any) => {
    setSelectedTruck(t);
    setAiRecommendation(null);
    setCustomerDraft(null);
    try {
      const res = await axios.get(`${API_BASE}/bulk/trucks/${t.id}`);
      setTruckDetails(res.data);
      
      // Fetch AI Recommendation
      try {
        const aiRes = await axios.post(`${API_BASE}/ai/analyze`, {
          mode: "bulk",
          context: { ...t, route_options: res.data.route_options }
        });
        setAiRecommendation(aiRes.data.analysis);
      } catch(e) {
        setAiRecommendation("AI analysis unavailable.");
      }
    } catch(e) {}
  };

  const clearSelection = () => {
    setSelectedTruck(null);
    setTruckDetails(null);
    setAiRecommendation(null);
    setCustomerDraft(null);
  };

  const applyReroute = async () => {
    if (!truckDetails) return;
    try {
      const res = await axios.post(`${API_BASE}/bulk/reroute/${truckDetails.id}`);
      toast.success("Reroute applied successfully");
      fetchTrucks();
      selectTruck(truckDetails);
    } catch(e) {
      toast.error("Failed to apply reroute");
    }
  };

  const simStorm = async () => {
    await axios.post(`${API_BASE}/simulate/storm`);
    toast.error("Storm simulation activated");
    fetchTrucks();
  };

  const simReset = async () => {
    await axios.post(`${API_BASE}/simulate/reset`);
    toast.success("System reset to seed state");
    fetchTrucks();
    clearSelection();
  };

  const generateCustomerDraft = async () => {
    if (!selectedTruck) return;
    setGeneratingDraft(true);
    try {
      const res = await axios.post(`${API_BASE}/ai/analyze`, {
        mode: "customer_update",
        context: selectedTruck
      });
      setCustomerDraft(res.data.analysis);
      toast.success("Draft generated!");
    } catch (e) {
      toast.error("Failed to generate draft");
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Build Map elements
  const markers = Object.keys(CITY_COORDS).map(c => ({
    id: c, lat: CITY_COORDS[c][0], lng: CITY_COORDS[c][1], color: "#4b5563",
    popup: <div className="text-gray-900 font-bold">{c}</div>
  })).concat(trucks.map(t => ({
    id: t.id, lat: t.current_lat, lng: t.current_lng, color: t.status,
    onClick: () => selectTruck(t)
  })));

  const routes = trucks.map(t => {
    const routeArr = t.status === "rerouted" ? t.rerouted_route : t.current_route;
    const pathPositions = routeArr.map((c: string) => CITY_COORDS[c]).filter(Boolean);
    let color = "#22c55e"; // green
    if (t.status === "critical") color = "#ef4444";
    if (t.status === "rerouted") color = "#3b82f6";
    if (t.status === "delayed") color = "#eab308";
    return { positions: pathPositions, color };
  });

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden bg-gray-950 text-white">
      {/* LEFT COLUMN */}
      <div className="w-80 border-r border-gray-800 flex flex-col bg-gray-900 z-10 shadow-xl">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
          <h2 className="font-bold flex items-center gap-2"><TruckIcon size={18} className="text-blue-500"/> Bulk Logistics</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {trucks.map(t => (
            <div 
              key={t.id} 
              onClick={() => selectTruck(t)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTruck?.id === t.id ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold">{t.id}</span>
                <Badge variant="outline" className={`
                  ${t.status === 'on_time' ? 'text-green-400 border-green-500/30' : ''}
                  ${t.status === 'delayed' ? 'text-yellow-400 border-yellow-500/30' : ''}
                  ${t.status === 'critical' ? 'text-red-400 border-red-500/30' : ''}
                  ${t.status === 'rerouted' ? 'text-blue-400 border-blue-500/30' : ''}
                `}>{t.status.toUpperCase()}</Badge>
              </div>
              <div className="text-xs text-gray-400 mb-2 truncate">
                {t.origin} → {t.destination} <br/> Driver: {t.driver_name}
              </div>
              <div className="flex gap-2">
                {t.weather_condition === "storm" && <CloudLightning size={14} className="text-red-400"/>}
                {t.weather_condition === "rain" && <CloudRain size={14} className="text-blue-300"/>}
                {t.traffic_level === "blocked" && <ShieldAlert size={14} className="text-red-500"/>}
                {t.delay_minutes > 0 && <span className="text-xs text-red-400">{t.delay_minutes}m delay</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-800 bg-gray-950">
           <StatsPanel stats={[
             { label: "Total", value: trucks.length },
             { label: "Delayed", value: trucks.filter(t=>t.status==='delayed' || t.status==='critical').length, color: 'text-red-400'}
           ]} />
        </div>
      </div>

      {/* CENTER MAP */}
      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <Button variant="destructive" onClick={simStorm} className="shadow-lg"><CloudLightning size={16} className="mr-2"/> Simulate Storm</Button>
          <Button onClick={simReset} className="shadow-lg bg-gray-700 hover:bg-gray-600"><RefreshCcw size={16} className="mr-2"/> Reset</Button>
        </div>
        <MapView markers={markers} routes={routes} center={[21.0, 78.0]} zoom={5} />
      </div>

      {/* RIGHT PANEL */}
      {selectedTruck && (
        <div className="w-96 border-l border-gray-800 bg-gray-900 z-10 shadow-bl overflow-y-auto w-[400px]">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950 sticky top-0 z-10">
             <h2 className="font-bold">{selectedTruck.id} Details</h2>
             <button onClick={clearSelection} className="text-gray-400 hover:text-white"><X size={18}/></button>
          </div>
          
          <div className="p-5 space-y-6">
             {/* General Info */}
             <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Cargo:</span> <br/>{selectedTruck.cargo}</div>
                <div><span className="text-gray-500">Weight:</span> <br/>{selectedTruck.weight_tons}t</div>
                <div><span className="text-gray-500">Weather:</span> <br/><span className="capitalize">{selectedTruck.weather_condition}</span></div>
                <div><span className="text-gray-500">Traffic:</span> <br/><span className="capitalize">{selectedTruck.traffic_level}</span></div>
             </div>

             {/* ML Prediction */}
             {selectedTruck.prediction && (
               <div className="bg-gray-800/80 p-4 rounded border border-gray-700/50">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-sm font-semibold flex items-center gap-2"><Settings2 size={14} className="text-purple-400"/> XGBoost Analysis</span>
                   <Badge variant="outline" className={`${selectedTruck.prediction.delay_category === 'critical' ? 'text-red-400 border-red-500' : 'text-gray-300'}`}>
                     {selectedTruck.prediction.delay_category.toUpperCase()}
                   </Badge>
                 </div>
                 <div className="text-xs text-gray-400 mb-1 flex justify-between">
                   <span>Delay Probability</span>
                   <span>{(selectedTruck.prediction.delay_probability * 100).toFixed(1)}%</span>
                 </div>
                 <Progress value={selectedTruck.prediction.delay_probability * 100} className="h-2 bg-gray-700" 
                    indicatorcolor={selectedTruck.prediction.delay_probability > 0.7 ? "bg-red-500" : "bg-blue-500"} />
               </div>
             )}

             {/* AI Advisor */}
             <div className="bg-blue-900/10 p-4 rounded border border-blue-500/30">
               <div className="flex items-center gap-2 mb-2 text-blue-400 font-semibold text-sm">
                 <Bot size={16} /> AI Route Advisor
               </div>
               {aiRecommendation ? (
                 <p className="text-sm text-gray-300 leading-relaxed">{aiRecommendation}</p>
               ) : (
                 <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                   <div className="w-4 h-4 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin"></div>
                   Analyzing truck & route data...
                 </div>
               )}
             </div>

             {/* Customer Update Section (Only for Delayed/Critical) */}
             {(selectedTruck.status === 'delayed' || selectedTruck.status === 'critical') && (
               <div className="bg-gray-800/50 p-4 rounded border border-gray-700/50">
                 <div className="flex justify-between items-center mb-3">
                   <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                     <MessageSquare size={14} className="text-indigo-400"/> Customer Update
                   </h3>
                   <Button size="sm" variant="outline" className="h-7 text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/30" onClick={generateCustomerDraft} disabled={generatingDraft}>
                     {generatingDraft ? "Drafting..." : "Generate AI Draft"}
                   </Button>
                 </div>
                 
                 {customerDraft && (
                   <div className="relative group mt-2">
                     <div className="bg-gray-900 text-gray-300 text-xs p-3 rounded border border-gray-700 whitespace-pre-wrap leading-relaxed pb-8">
                       {customerDraft}
                     </div>
                     <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => { navigator.clipboard.writeText(customerDraft); toast.success("Copied to clipboard!"); }}
                         className="p-1.5 bg-gray-800 rounded text-gray-400 hover:text-white border border-gray-600 flex items-center gap-1 text-[10px]"
                         title="Copy"
                       >
                         <Copy size={12} />
                       </button>
                       <a 
                         href={`mailto:customer@example.com?subject=${encodeURIComponent(`Update on your ${selectedTruck.cargo} delivery (Truck ${selectedTruck.id})`)}&body=${encodeURIComponent(customerDraft)}`}
                         className="p-1.5 bg-indigo-600 rounded text-white hover:bg-indigo-500 border border-indigo-500 flex items-center gap-1 text-[10px]"
                         title="Send Email"
                       >
                         <Mail size={12} /> Send
                       </a>
                     </div>
                   </div>
                 )}
               </div>
             )}

             {/* Routes */}
             {truckDetails && truckDetails.route_options && (
               <div>
                  <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Navigation</h3>
                  <RouteCard routeData={truckDetails.route_options} onApply={applyReroute} isApplied={truckDetails.status === 'rerouted'} />
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
