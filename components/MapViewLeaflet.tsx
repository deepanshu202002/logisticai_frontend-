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

export default function MapViewLeaflet({ markers = [], routes = [], center = [20.5937, 78.9629], zoom = 5 }: MapProps) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%", zIndex: 0 }}>
      {/* Dark theme tiles */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {routes.map((r, i) => (
        <Polyline key={i} positions={r.positions} pathOptions={{ color: r.color, weight: r.weight || 3 }} />
      ))}

      {markers.map((m) => {
        const hexColor = colorMap[m.color || ""] || m.color || "#3b82f6";

        // Use a div icon for colored dots
        const customIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color:${hexColor}; width:16px; height:16px; border-radius:50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
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
  );
}
