import React from "react";
import { ArrowRight, MapPin, CheckCircle, TrendingDown, IndianRupee, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RouteCard({
  routeData,
  onApply,
  isApplied = false
}: {
  routeData: any,
  onApply: () => void,
  isApplied?: boolean
}) {
  if (!routeData || !routeData.primary) return null;

  const { primary, baseline, alternatives, disruptions_avoided, recommendation, cost_saving_inr, cost_saving_pct } = routeData;

  const isRerouted    = disruptions_avoided && disruptions_avoided.length > 0;
  const shouldReroute = recommendation === "reroute";
  const shouldWait    = recommendation === "wait";

  const fmt = (n: number) => `₹${n?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-4">

      {/* Recommendation Banner */}
      {shouldReroute && !isApplied && (
        <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/30 rounded-lg px-3 py-2 text-sm">
          <TrendingDown size={14} className="text-green-400 shrink-0" />
          <span className="text-green-300">
            Rerouting saves <span className="font-bold text-green-200">{fmt(cost_saving_inr)}</span>
            {" "}({cost_saving_pct}%) vs storm route
          </span>
        </div>
      )}
      {shouldReroute && isApplied && (
        <div className="flex items-center gap-2 bg-green-900/50 border border-green-500/50 rounded-lg px-3 py-2 text-sm">
          <CheckCircle size={14} className="text-green-400 shrink-0" />
          <span className="text-green-300">
            Successfully rerouted, saving <span className="font-bold text-green-200">{fmt(cost_saving_inr)}</span>
          </span>
        </div>
      )}
      {recommendation === "continue" && !isRerouted && (
        <div className="flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 rounded-lg px-3 py-2 text-sm">
          <CheckCircle size={14} className="text-blue-400 shrink-0" />
          <span className="text-blue-300">Route is optimal — no disruptions</span>
        </div>
      )}
      {recommendation === "continue" && isRerouted && (
        <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-500/30 rounded-lg px-3 py-2 text-sm">
          <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
          <span className="text-yellow-300">
            Detour costs <span className="font-bold text-yellow-200">{fmt(Math.abs(cost_saving_inr))}</span> MORE — original route is cheaper
          </span>
        </div>
      )}
      {shouldWait && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/30 rounded-lg px-3 py-2 text-sm">
          <AlertTriangle size={14} className="text-red-400 shrink-0" />
          <span className="text-red-300">No alternate path available — consider waiting</span>
        </div>
      )}

      {/* Primary Route */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-blue-400" />
            {shouldReroute ? "Recommended Route" : "Current Route"}
          </h3>
          {isRerouted && shouldReroute && <Badge variant="destructive" className="text-xs">Diverted</Badge>}
        </div>

        {/* Path */}
        <div className="flex items-center flex-wrap gap-1 text-sm text-gray-300">
          {primary.path.map((city: string, idx: number) => (
            <React.Fragment key={idx}>
              <span className={idx === 0 || idx === primary.path.length - 1 ? "font-bold text-white" : "text-gray-300"}>
                {city}
              </span>
              {idx < primary.path.length - 1 && <ArrowRight size={12} className="text-gray-500" />}
            </React.Fragment>
          ))}
        </div>

        {/* Distance + Time */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-900 p-2 rounded">
          <div>
            <span className="text-gray-500 block">Distance</span>
            <span className="text-white text-sm">{primary.distance_km} km</span>
          </div>
          <div>
            <span className="text-gray-500 block">Est. Time</span>
            <span className="text-white text-sm">{primary.estimated_time_hours?.toFixed(1)} hrs</span>
          </div>
        </div>

        {/* Cost Breakdown */}
        {primary.cost_breakdown && (
          <div className="bg-gray-900/80 rounded p-2 space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
              <IndianRupee size={11} /> Cost Breakdown
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
              <div className="flex justify-between text-gray-400"><span>Fuel</span><span className="text-gray-200">{fmt(primary.cost_breakdown.fuel_inr)}</span></div>
              <div className="flex justify-between text-gray-400"><span>Toll</span><span className="text-gray-200">{fmt(primary.cost_breakdown.toll_inr)}</span></div>
              <div className="flex justify-between text-gray-400"><span>Driver</span><span className="text-gray-200">{fmt(primary.cost_breakdown.driver_inr)}</span></div>
              <div className="flex justify-between text-gray-400"><span>Delay</span><span className="text-yellow-300">{fmt(primary.cost_breakdown.delay_inr)}</span></div>
            </div>
            <div className="border-t border-gray-700 mt-1 pt-1 flex justify-between text-xs font-semibold">
              <span className="text-gray-300">Total Cost</span>
              <span className="text-white">{fmt(primary.cost_breakdown.total_inr)}</span>
            </div>
          </div>
        )}

        {/* Disruptions Avoided */}
        {isRerouted && shouldReroute && (
          <div className="text-xs space-y-1">
            <div className="text-gray-400">Disruptions Avoided:</div>
            <ul className="list-disc pl-4 text-green-400">
              {disruptions_avoided.map((d: string, i: number) => (
                <li key={i} className="capitalize">{d}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Apply Button */}
        {shouldReroute && !isApplied && (
          <button
            onClick={onApply}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <CheckCircle size={15} /> Apply Reroute — Save {fmt(cost_saving_inr)}
          </button>
        )}
        {shouldReroute && isApplied && (
          <div className="w-full bg-green-900/20 border border-green-500/30 text-green-400 font-medium py-2 px-4 rounded flex items-center justify-center gap-2 text-sm">
            <CheckCircle size={15} /> Reroute Applied Successfully
          </div>
        )}
      </div>

      {/* Baseline / Alternative (collapsed) */}
      {baseline && shouldReroute && (
        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800 space-y-2">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Original Route (Storm)</div>
          <div className="flex items-center flex-wrap gap-1 text-xs text-gray-500">
            {baseline.path.map((city: string, idx: number) => (
              <React.Fragment key={idx}>
                <span>{city}</span>
                {idx < baseline.path.length - 1 && <ArrowRight size={10} className="text-gray-700" />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>{baseline.distance_km} km</span>
            <span>{baseline.estimated_time_hours?.toFixed(1)} hrs</span>
            {baseline.cost_breakdown && <span className="text-red-400">{fmt(baseline.cost_breakdown.total_inr)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
