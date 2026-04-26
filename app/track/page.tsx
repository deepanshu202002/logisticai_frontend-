"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Package, Truck, Factory, Bike, CheckCircle, Search, ArrowRight, MapPin, Clock, Calendar, RefreshCcw, Share2, ChevronRight, AlertCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

function TrackContent() {
  const searchParams = useSearchParams();
  const [trackingId, setTrackingId] = useState(searchParams.get("id") || "");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(0);

  const fetchTracking = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/track/${id}`);
      setData(res.data);
      setLastUpdated(0);
    } catch (err) {
      toast.error("Tracking ID not found");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const advanceStatus = async () => {
    if (!data?.booking?.id) return;
    setAdvancing(true);
    try {
      await axios.post(`/api/track/${data.booking.id}`);
      await fetchTracking(data.booking.id);
      toast.success("Shipment moved to next milestone!");
    } catch (err) {
      toast.error("Could not advance status");
    } finally {
      setAdvancing(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("id")) {
      fetchTracking(searchParams.get("id")!);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!data?.booking?.id) return;
    const interval = setInterval(() => {
      setLastUpdated(prev => prev + 1);
      if (lastUpdated > 30) {
        fetchTracking(data.booking.id);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [data, lastUpdated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = trackingId.trim().toUpperCase();
    if (cleanId) {
      setTrackingId(cleanId);
      fetchTracking(cleanId);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/track?id=${trackingId}`;
    navigator.clipboard.writeText(url);
    toast.success("Tracking link copied!");
  };

  const getStatusIcon = (status: string) => {
    if (status === "BOOKED") return <Package size={18}/>;
    if (status === "PICKED_UP") return <Truck size={18}/>;
    if (status.startsWith("ARRIVED") || status.startsWith("DEPARTED")) return <Factory size={18}/>;
    if (status === "OUT_FOR_DELIVERY") return <Bike size={18}/>;
    if (status === "DELIVERED") return <CheckCircle size={18}/>;
    return <Package size={18}/>;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header & Search */}
        <div className="text-center space-y-4">
          <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1 border-blue-500/30">
            Real-time Logistics Tracking
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Track Your Shipment
          </h1>
          
          <form onSubmit={handleSearch} className="max-w-md mx-auto relative group">
            <input 
              type="text" 
              placeholder="Enter Tracking ID (e.g. HBS-2025...)" 
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-800 rounded-xl py-4 pl-12 pr-24 focus:ring-2 focus:ring-blue-500 outline-none transition-all group-hover:border-gray-700 font-mono text-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-bold text-xs transition-all"
            >
              {loading ? "SEARCHING..." : "TRACK NOW"}
            </button>
          </form>
        </div>

        {data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Left: Summary Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Status</div>
                      <Badge className={`${data.current_status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'} border-none px-3`}>
                        {data.current_status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <button onClick={copyLink} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                      <Share2 size={18}/>
                    </button>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Route</div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {data.booking.seller_city} <ArrowRight size={14} className="text-gray-600"/> {data.booking.buyer_city}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">ETA</div>
                      <div className="text-sm font-bold text-white">{format(new Date(data.booking.eta_date), "MMM d, yyyy")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Weight</div>
                      <div className="text-sm font-bold text-white">{data.booking.weight_kg} kg</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>Last updated {lastUpdated}s ago</span>
                      <button onClick={() => fetchTracking(data.booking.id)} className="flex items-center gap-1 hover:text-white">
                        <RefreshCcw size={10} className={loading ? "animate-spin" : ""}/> Refresh
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulation Box (Demo Only) */}
              <div className="bg-amber-900/10 border border-amber-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-sm mb-4">
                  <Play size={16}/> Demo Simulation
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Manually advance this shipment through its logistics milestones to demonstrate the real-time tracking engine.
                </p>
                <Button 
                  onClick={advanceStatus} 
                  disabled={advancing || data.current_status === 'DELIVERED'}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold h-11"
                >
                  {advancing ? "ADVANCING..." : "ADVANCE STATUS →"}
                </Button>
              </div>
            </div>

            {/* Right: Timeline Stepper */}
            <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                <Clock className="text-blue-500" size={20}/> Shipment Timeline
              </h3>

              <div className="relative space-y-0">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 via-blue-500/20 to-gray-800"></div>

                {data.events.map((event: any, i: number) => {
                  const isLatest = i === 0;
                  return (
                    <div key={event.id} className={`relative pl-12 pb-10 group animate-in slide-in-from-left-4 duration-300 delay-${i * 100}`}>
                      {/* Icon Bubble */}
                      <div className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all border-4 border-gray-950
                        ${isLatest ? 'bg-blue-600 text-white scale-110 shadow-[0_0_15px_rgba(37,99,235,0.4)] animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
                        {getStatusIcon(event.status)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className={`font-bold transition-colors ${isLatest ? 'text-white text-lg' : 'text-gray-400'}`}>
                            {event.status.replace(/_/g, " ")}
                          </h4>
                          <span className="text-[10px] text-gray-600 font-mono bg-gray-950 px-2 py-0.5 rounded border border-gray-800">
                            {format(new Date(event.timestamp), "HH:mm:ss")}
                          </span>
                        </div>
                        <p className={`text-sm leading-relaxed ${isLatest ? 'text-blue-200' : 'text-gray-500'}`}>
                          {event.message}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                          <MapPin size={12}/> {event.location || 'In Transit'}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Planned Steps (Future) */}
                {data.current_status !== 'DELIVERED' && (
                  <div className="relative pl-12 pb-6 opacity-30 grayscale">
                    <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-gray-800 border-4 border-gray-950 flex items-center justify-center">
                      <ChevronRight size={18}/>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-500">Next Milestone</h4>
                      <p className="text-sm text-gray-600 italic">Calculating next logistics hop...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          !loading && (
            <div className="bg-gray-900/30 border border-gray-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-gray-600"/>
              </div>
              <h2 className="text-2xl font-bold text-gray-400">Ready to track?</h2>
              <p className="text-gray-500 max-w-sm mx-auto">
                Enter your HBS tracking identifier to see the real-time status and ETA of your shipment.
              </p>
            </div>
          )
        )}

      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading Tracker...</div>}>
      <TrackContent />
    </Suspense>
  );
}
