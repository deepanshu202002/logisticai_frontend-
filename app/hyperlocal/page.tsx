"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Zap, MapPin, Bike, CheckCircle, Clock, Search, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MapView from "@/components/MapView";
import StatsPanel from "@/components/StatsPanel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const API_BASE = "/api";

export default function HyperlocalPage() {
  const [riders, setRiders] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [rRes, zRes, aRes] = await Promise.all([
        axios.get(`${API_BASE}/hyperlocal/riders`),
        axios.get(`${API_BASE}/hyperlocal/zones`),
        axios.get(`${API_BASE}/alerts`)
      ]);
      setRiders(rRes.data);
      setZones(zRes.data);
      setAlerts(aRes.data.filter((a: any) => a.entity_type === 'zone' || a.entity_type === 'rider'));
    } catch(e) {}
  };

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 5000);
    return () => clearInterval(inv);
  }, []);

  const applyRebalance = async () => {
    try {
      const res = await axios.post(`${API_BASE}/hyperlocal/rebalance`);
      toast.success(res.data.message);
      fetchData();
    } catch(e) { toast.error("Rebalance failed"); }
  };

  const simLunchRush = async () => {
    await axios.post(`${API_BASE}/simulate/lunch_rush`);
    toast.error("Lunch rush conditions activated in key zones!");
    fetchData();
  };

  const simReset = async () => {
    await axios.post(`${API_BASE}/simulate/reset`);
    toast.success("System reset to seed state");
    fetchData();
  };

  const markers = riders.map(r => ({
    id: r.id, lat: r.current_lat, lng: r.current_lng, color: r.status,
    popup: (
      <div className="font-bold text-gray-900">
        {r.name} <br/> {r.status} <br/> ETA: {r.eta_minutes}m
      </div>
    )
  }));

  const avgDelivery = zones.length ? (zones.reduce((acc, z) => acc + z.avg_delivery_minutes, 0) / zones.length).toFixed(1) : 0;
  const criticalCount = zones.filter(z => z.status === 'critical').length;

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] overflow-hidden bg-gray-950 text-white">
      <StatsPanel stats={[
        { label: "Avg Delivery", value: `${avgDelivery}m`, color: Number(avgDelivery) > 20 ? "text-red-400" : "text-green-400" },
        { label: "Active Riders", value: riders.filter(r=>r.status==='delivering').length },
        { label: "Stressed Zones", value: criticalCount, color: criticalCount > 0 ? "text-red-400" : "text-green-400" },
        { label: "On-Time Rate", value: "92%" } // Mocked KPI
      ]} />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COMPONENT */}
        <div className="w-72 border-r border-gray-800 bg-gray-900 z-10 flex flex-col shadow-lg">
          <div className="p-4 border-b border-gray-800 flex justify-between bg-gray-950">
             <h2 className="font-bold flex items-center gap-2"><MapPin size={18} className="text-amber-500"/> Zone Health</h2>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
             {zones.map(z => (
               <div key={z.id} className={`p-4 rounded-lg border ${z.status==='critical'?'border-red-500 bg-red-950/20':'border-gray-700 bg-gray-800/50'}`}>
                 <div className="flex justify-between items-start mb-2">
                   <span className="font-semibold">{z.name}</span>
                   <Badge variant="outline" className={z.status==='critical'?'border-red-500 text-red-500':z.status==='stressed'?'border-orange-500 text-orange-500':'border-green-500 text-green-500'}>
                     {z.status.toUpperCase()}
                   </Badge>
                 </div>
                 <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
                    <div>Avg Time: <span className={z.avg_delivery_minutes > 20 ? "text-red-400" : "text-white"}>{z.avg_delivery_minutes}m</span></div>
                    <div>Traffic: <span className="capitalize">{z.traffic_level}</span></div>
                 </div>
                 <div className="text-xs text-gray-400 mb-1">Orders/Rider Ratio</div>
                 <div className="w-full h-2 bg-gray-700 rounded overflow-hidden flex">
                    <div className="bg-amber-500" style={{ width: `${Math.min(100, (z.active_orders / Math.max(1, z.available_riders))*10)}%` }}></div>
                 </div>
                 <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
                    <span>{z.active_orders} Orders</span>
                    <span>{z.available_riders} Avail. Riders</span>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* MAP */}
        <div className="flex-1 relative">
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            <Button variant="destructive" onClick={simLunchRush} className="shadow-lg"><Zap size={16} className="mr-2"/> Simulate Lunch Rush</Button>
            <Button variant="outline" onClick={simReset} className="bg-gray-800 border-gray-600"><RefreshCcw size={16} className="mr-2"/> Reset</Button>
          </div>
          {/* Centered on Bangalore */}
          <MapView markers={markers} center={[12.95, 77.63]} zoom={12} />
        </div>

        {/* RIGHT COMPONENT */}
        <div className="w-72 border-l border-gray-800 bg-gray-900 z-10 flex flex-col shadow-lg">
          <div className="p-4 border-b border-gray-800 bg-gray-950">
             <h2 className="font-bold flex items-center gap-2"><Bike size={18} className="text-blue-400"/> Active Fleet</h2>
          </div>
          
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
            {criticalCount > 0 && (
              <div className="bg-amber-950/40 p-4 border border-amber-500/50 rounded-lg text-sm text-amber-200">
                <h3 className="font-bold mb-2">Rebalance Suggested</h3>
                <p className="text-xs mb-3 text-amber-300">Move idle riders from normal zones to critical zones to reduce ETA.</p>
                <Button onClick={applyRebalance} size="sm" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium">Apply Rebalancing</Button>
              </div>
            )}

            <div className="space-y-2">
               {riders.map(r => (
                 <div key={r.id} className="p-3 border border-gray-800 bg-gray-800/40 rounded flex items-center justify-between text-sm">
                   <div className="flex flex-col">
                     <span className="font-medium text-gray-200">{r.name}</span>
                     <span className="text-xs text-gray-500">{r.zone}</span>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className={`text-xs uppercase font-bold 
                        ${r.status === 'delivering' ? 'text-amber-400' : 'text-green-400'}`}>
                       {r.status}
                     </span>
                     {r.status === 'delivering' && <span className={`text-xs ${r.eta_minutes > 20 ? 'text-red-400 font-bold' : 'text-gray-400'}`}>{r.eta_minutes}m ETA</span>}
                   </div>
                 </div>
               ))}
            </div>
            
            {alerts.length > 0 && (
              <div className="mt-4 border-t border-gray-800 pt-4">
                 <h3 className="font-bold text-sm mb-3 text-gray-400">Zone Alerts</h3>
                 <div className="space-y-2">
                   {alerts.map(a => (
                     <div key={a.id} className="text-xs p-2 bg-red-950/20 border-l-2 border-red-500 text-gray-300">
                       {a.message}
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
