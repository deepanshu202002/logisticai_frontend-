import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatItem {
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

export default function StatsPanel({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 w-full bg-gray-950 border-t border-gray-800">
      {stats.map((s, i) => (
        <Card key={i} className="bg-gray-900 border-none">
          <CardContent className="p-4 flex flex-col justify-center items-center">
            <div className="text-sm text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color || "text-white"}`}>{s.value}</div>
            {s.trend && <div className="text-xs text-gray-500 mt-1">{s.trend}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
