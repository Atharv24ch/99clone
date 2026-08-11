"use client";

import React, { useEffect, useRef, useState } from "react";
import type { PropertyListItem } from "@/types/property";
import { formatPrice } from "@/types/property";

interface MapViewProps {
  properties: PropertyListItem[];
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  onPropertyClick?: (property: PropertyListItem) => void;
  className?: string;
}

/**
 * MapView — Mapbox GL JS integration.
 * Loaded dynamically (mapbox-gl is browser-only).
 * Renders property markers with popup previews.
 */
export function MapView({
  properties,
  center = [77.2090, 28.6139], // Default: New Delhi
  zoom = 11,
  onPropertyClick,
  className = "",
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Dynamically import mapbox-gl to avoid SSR issues
    import("mapbox-gl").then((mapboxgl) => {
      const MapboxGL = mapboxgl.default;
      MapboxGL.accessToken = process.env["NEXT_PUBLIC_MAPBOX_TOKEN"] ?? "";

      const map = new MapboxGL.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center,
        zoom,
        attributionControl: false,
      });

      map.addControl(new MapboxGL.NavigationControl(), "top-right");
      map.addControl(new MapboxGL.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }), "top-right");

      map.on("load", () => {
        setIsLoaded(true);
      });

      mapRef.current = map;
      // Return cleanup; map.remove() handles teardown
      return () => { (mapRef.current as { remove: () => void } | null)?.remove(); };
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add/update markers when properties change
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    import("mapbox-gl").then((mapboxgl) => {
      const MapboxGL = mapboxgl.default;
      const map = mapRef.current as InstanceType<typeof MapboxGL.Map>;

      // Remove old markers
      (markersRef.current as Array<{ remove: () => void }>).forEach((m) => m.remove());
      markersRef.current = [];

      // Add new markers
      properties.forEach((prop) => {
        if (!prop.latitude || !prop.longitude) return;

        const lat = parseFloat(prop.latitude);
        const lng = parseFloat(prop.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        // Price pill element
        const el = document.createElement("div");
        el.className = [
          "cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5",
          "text-xs font-bold text-white shadow-lg",
          "bg-brand-500 hover:bg-brand-600",
          "border-2 border-white",
          "transition-transform duration-150 hover:scale-110 hover:-translate-y-0.5",
        ].join(" ");
        el.textContent = formatPrice(prop.price);
        el.setAttribute("data-property-id", prop.id);

        // Popup
        const popup = new MapboxGL.Popup({
          offset: 25,
          closeButton: false,
          className: "property-popup",
          maxWidth: "280px",
        }).setHTML(`
          <a href="/property/${prop.slug}" class="block p-3 no-underline">
            <p class="font-bold text-slate-900 text-sm">${formatPrice(prop.price)}</p>
            <p class="text-xs text-slate-600 mt-0.5 line-clamp-2">${prop.title}</p>
            <p class="text-xs text-slate-400 mt-1">${prop.locality}, ${prop.city}</p>
            ${prop.bedrooms ? `<p class="text-xs text-slate-500 mt-1">${prop.bedrooms} BHK · ${prop.propertyType.replace(/_/g, " ")}</p>` : ""}
          </a>
        `);

        const marker = new MapboxGL.Marker({ element: el, anchor: "bottom" })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map as Parameters<typeof MapboxGL.Marker.prototype.addTo>[0]);

        el.addEventListener("click", () => {
          onPropertyClick?.(prop);
        });

        (markersRef.current as unknown[]).push(marker);
      });
    }).catch(console.error);
  }, [properties, isLoaded, onPropertyClick]);

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-slate-200 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
            <p className="text-sm">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
