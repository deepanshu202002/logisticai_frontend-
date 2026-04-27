"use client";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default icons
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapProps {
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    color?: string; // e.g. "red", "green", "blue"
    popup?: React.ReactNode;
    onClick?: () => void;
  }>;
  routes?: Array<{
    positions: [number, number][];
    color: string;
    weight?: number;
  }>;
  center?: [number, number];
  zoom?: number;
  activeFlows?: Array<{
    positions: [number, number][];
    color: string;
  }>;
}

const colorMap: Record<string, string> = {
  on_time: "#22c55e",
  delayed: "#eab308",
  critical: "#ef4444",
  rerouted: "#3b82f6",
  normal: "#22c55e",
  warning: "#f97316",
  overloaded: "#ef4444",
  idle: "#22c55e",
  delivering: "#eab308",
  returning: "#3b82f6"
};

export default function MapViewLeaflet({ markers = [], routes = [], activeFlows = [], center = [20.5937, 78.9629], zoom = 5 }: MapProps) {
  return (
    <div className="relative w-full h-full group">
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .flow-line {
          animation: dash 1s linear infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.33); opacity: 0; }
          80%, 100% { opacity: 0; }
        }
        .pulse-marker::before {
          content: '';
          position: absolute;
          width: 300%;
          height: 300%;
          left: -100%;
          top: -100%;
          border-radius: 50%;
          background-color: currentColor;
          animation: pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
      `}</style>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%", zIndex: 0 }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {routes.map((r, i) => (
          <Polyline key={`route-${i}`} positions={r.positions} pathOptions={{ color: r.color, weight: r.weight || 3, opacity: 0.6 }} />
        ))}

        {activeFlows.map((f, i) => (
          <Polyline 
            key={`flow-${i}`} 
            positions={f.positions} 
            pathOptions={{ 
              color: f.color, 
              weight: 4, 
              dashArray: '10, 10',
              className: 'flow-line'
            }} 
          />
        ))}

        {markers.map((m) => {
          const hexColor = colorMap[m.color || ""] || m.color || "#3b82f6";
          const isCritical = m.color === 'critical' || m.color === 'overloaded';

          const customIcon = L.divIcon({
            className: `custom-div-icon ${isCritical ? 'pulse-marker' : ''}`,
            html: `<div style="background-color:${hexColor}; color:${hexColor}; width:16px; height:16px; border-radius:50%; border: 2px solid white; box-shadow: 0 0 10px ${hexColor};"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          return (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={customIcon}
              eventHandlers={{
                click: () => m.onClick && m.onClick()
              }}
            >
              {m.popup && <Popup>{m.popup}</Popup>}
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
