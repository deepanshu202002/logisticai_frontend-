"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Truck, Package } from "lucide-react";
import StatsPanel from "@/components/StatsPanel";

const API_BASE = "/api";

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchBookings();
    const inv = setInterval(() => {
      fetchStats();
      fetchBookings();
    }, 30000);
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

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/bookings`);
      setRecentBookings(res.data.slice(0, 5)); // Only show last 5
    } catch (e) {
      console.error("Failed to fetch bookings", e);
    } finally {
      setLoadingBookings(false);
    }
  };

  const statItems = stats ? [
    { label: "Total Trucks", value: stats.total_trucks, trend: `${stats.critical_trucks} Critical`, color: stats.critical_trucks > 0 ? "text-red-400" : "text-green-400" },
    { label: "Hub Limits", value: `${stats.overloaded_hubs} Overloaded`, color: stats.overloaded_hubs > 0 ? "text-red-400" : "text-green-400" },
    { label: "Active Riders", value: stats.active_riders, trend: `${stats.critical_zones} Zones Critical` },
    { label: "System Alerts", value: stats.total_alerts, color: stats.total_alerts > 0 ? "text-orange-400" : "text-green-400" },
  ] : [];

  return (
    <div className="flex-1 flex flex-col items-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black p-4 lg:p-10 overflow-y-auto">

      <div className="text-center mb-10 lg:mb-12 space-y-3 lg:space-y-4 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          LogisticAI Dashboard
        </h1>
        <p className="text-md md:text-xl text-gray-400 font-light px-4">
          Autonomous Logistics Management & Routing
        </p>
      </div>

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-12">
        <Link href="/bulk" className="group">
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 hover:border-blue-500/50 rounded-2xl p-6 lg:p-10 flex flex-col items-center justify-center gap-6 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] h-full cursor-pointer">
            <div className="p-5 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
              <Truck size={40} className="text-blue-400" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Bulk Logistics</h2>
              <p className="text-gray-400 text-sm">Predictive Routing for Heavy Freight</p>
            </div>
          </div>
        </Link>
        <Link href="/parcel" className="group">
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 hover:border-emerald-500/50 rounded-2xl p-6 lg:p-10 flex flex-col items-center justify-center gap-6 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] h-full cursor-pointer">
            <div className="p-5 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
              <Package size={40} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Parcel Network</h2>
              <p className="text-gray-400 text-sm">Hub-to-Hub Delivery Optimization</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Bookings Section */}
      <div className="w-full max-w-4xl mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Live Parcel Shipments
          </h3>
          <Link href="/track" className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest">View All Tracking</Link>
        </div>

        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-md">
          {recentBookings.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {recentBookings.map((b) => (
                <Link key={b.id} href={`/track?id=${b.id}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                      {b.type === 'bulk' ? <Truck size={20} /> : <Package size={20} />}
                    </div>
                    <div>
                      <div className="text-sm font-mono font-bold text-white">{b.id}</div>
                      <div className="text-xs text-gray-500">{b.seller_city} → {b.buyer_city}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border mb-1 inline-block
                      ${b.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                      {b.status}
                    </div>
                    <div className="text-[10px] text-gray-600 font-medium">ETA: {new Date(b.eta_date).toLocaleDateString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-600 italic text-sm">
              {loadingBookings ? "Connecting to logistics database..." : "No active shipments found. Start by booking a route."}
            </div>
          )}
        </div>
      </div>

      <div className="w-full fixed bottom-0 left-0 bg-gray-950/80 backdrop-blur-xl border-t border-white/5 z-20">
        {stats && <StatsPanel stats={statItems} />}
      </div>
    </div>
  );
}
