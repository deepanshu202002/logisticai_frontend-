"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AlertData {
  id: number;
  severity: string;
  entity_type: string;
  entity_id: string;
  alert_type: string;
  message: string;
  resolved: boolean;
}

const API_BASE = "/api";

export default function AlertBanner() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [expanded, setExpanded] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/alerts`);
      setAlerts(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const inv = setInterval(fetchAlerts, 5000);
    return () => clearInterval(inv);
  }, []);

  const resolveAlert = async (id: number) => {
    try {
      await axios.post(`${API_BASE}/alerts/${id}/resolve`);
      toast.success("Alert resolved");
      fetchAlerts();
    } catch (e) {
      toast.error("Failed to resolve alert");
    }
  };

  if (alerts.length === 0) return null;

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  if (criticalCount === 0 && !expanded) return null; // Show only if critical or user expanded (but if no critical we might not even show top bar)

  return (
    <div className="w-full relative z-50">
      <div 
        className={`w-full ${criticalCount > 0 ? "bg-red-600/90 hover:bg-red-600 cursor-pointer" : "bg-orange-600/90"} transition-colors text-white py-2 px-6 flex justify-between items-center`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 font-bold animate-pulse">
          <AlertCircle size={20} />
          {criticalCount > 0 ? `⚠ ${criticalCount} Critical Disruptions Detected` : `${alerts.length} Active Alerts`}
        </div>
        <div>
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </div>
      </div>

      {expanded && (
        <div className="absolute top-full left-0 w-full bg-gray-900 border-b border-red-500 shadow-2xl max-h-96 overflow-y-auto">
          <div className="p-4 flex flex-col gap-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-md border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${a.severity === "critical" ? "bg-red-500" : "bg-orange-500"}`} />
                  <div>
                    <div className="text-sm text-gray-400 capitalize">{a.alert_type} • {a.entity_type} {a.entity_id}</div>
                    <div className="font-medium text-white">{a.message}</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-gray-600 hover:bg-green-600" onClick={(e) => { e.stopPropagation(); resolveAlert(a.id); }}>
                  <CheckCircle className="mr-2" size={16} /> Resolve
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
