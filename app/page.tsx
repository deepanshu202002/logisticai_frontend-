"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Truck, Package } from "lucide-react";
import StatsPanel from "@/components/StatsPanel";

const API_BASE = "/api";

export default function Home() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    const inv = setInterval(fetchStats, 10000);
    return () => clearInterval(inv);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`);
      setStats(res.data);
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  const statItems = stats ? [
    { label: "Total Trucks", value: stats.total_trucks, trend: `${stats.critical_trucks} Critical`, color: stats.critical_trucks > 0 ? "text-red-400" : "text-green-400" },
    { label: "Hub Limits", value: `${stats.overloaded_hubs} Overloaded`, color: stats.overloaded_hubs > 0 ? "text-red-400" : "text-green-400" },
    { label: "Active Riders", value: stats.active_riders, trend: `${stats.critical_zones} Zones Critical` },
    { label: "System Alerts", value: stats.total_alerts, color: stats.total_alerts > 0 ? "text-orange-400" : "text-green-400" },
  ] : [];

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black p-6">
      
      <div className="text-center mb-16 space-y-4 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          LogisticAI
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 font-light">
          Predict. Reroute. Deliver.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-16">
        <Link href="/bulk" className="group">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-blue-500 rounded-xl p-8 flex flex-col items-center justify-center gap-6 transition-all hover:scale-105 h-full cursor-pointer">
            <div className="p-4 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
              <Truck size={48} className="text-blue-400" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Bulk Logistics</h2>
              <p className="text-gray-400 text-sm font-medium">Inter-city Freight & Convoy Routing</p>
            </div>
          </div>
        </Link>
        <Link href="/parcel" className="group">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-emerald-500 rounded-xl p-8 flex flex-col items-center justify-center gap-6 transition-all hover:scale-105 h-full cursor-pointer">
            <div className="p-4 bg-emerald-500/10 rounded-full group-hover:bg-emerald-500/20 transition-colors">
              <Package size={48} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Parcel Network</h2>
              <p className="text-gray-400 text-sm font-medium">Hub Routing & Delivery Optimization</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="w-full absolute bottom-0 left-0">
        {stats && <StatsPanel stats={statItems} />}
      </div>
    </div>
  );
}
