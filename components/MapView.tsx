"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MapViewLeaflet = dynamic(() => import("./MapViewLeaflet"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full bg-gray-900" />
});

export default function MapView(props: any) {
  return <MapViewLeaflet {...props} />;
}
