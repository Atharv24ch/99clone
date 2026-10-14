"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import type { PropertyListItem } from "@/types/property";
import { formatListingPrice } from "@/types/property";

interface MapViewProps {
  properties: PropertyListItem[];
  selectedId?: string | null;
  onSelect?: (property: PropertyListItem) => void;
  className?: string;
}

const TOKEN = process.env["NEXT_PUBLIC_MAPBOX_TOKEN"] ?? "";
const HAS_TOKEN = TOKEN.startsWith("pk.") && !TOKEN.includes("your-");
const INDIA_CENTER: [number, number] = [78.9629, 22.5937];

function priceTag(prop: PropertyListItem): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className =
    "map-tag tabular whitespace-nowrap rounded-[3px] border border-ink/70 bg-[rgb(var(--sheet))] px-2 py-1 text-[12px] font-semibold text-[rgb(var(--ink))] shadow-sm transition-colors";
  el.textContent = formatListingPrice(prop.price, prop.listingType);
  el.setAttribute("aria-label", `${prop.title}, ${el.textContent}`);
  return el;
}

/**
 * MapView — Mapbox GL with price tags. Selecting a listing (here or in the
 * list) isolates its tag and dims the rest.
 */
export function MapView({ properties, selectedId, onSelect, className = "" }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Map<string, { marker: Marker; el: HTMLButtonElement }>>(new Map());
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!HAS_TOKEN || !containerRef.current) return;
    let cancelled = false;

    import("mapbox-gl")
      .then(({ default: mapboxgl }) => {
        if (cancelled || !containerRef.current) return;
        mapboxgl.accessToken = TOKEN;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: INDIA_CENTER,
          zoom: 4,
          attributionControl: true,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
        map.on("load", () => !cancelled && setReady(true));
        map.on("error", () => !cancelled && setFailed(true));
        mapRef.current = map;
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers with the current results
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();

      const bounds = new mapboxgl.LngLatBounds();
      for (const prop of properties) {
        const lat = Number(prop.latitude);
        const lng = Number(prop.longitude);
        if (!prop.latitude || !prop.longitude || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;

        const el = priceTag(prop);
        el.addEventListener("click", () => onSelectRef.current?.(prop));
        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat([lng, lat]).addTo(map);
        markersRef.current.set(prop.id, { marker, el });
        bounds.extend([lng, lat]);
      }
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 600 });
    });
  }, [properties, ready]);

  // Isolate the selected listing
  useEffect(() => {
    markersRef.current.forEach(({ el, marker }, id) => {
      const active = id === selectedId;
      el.style.opacity = selectedId && !active ? "0.45" : "1";
      el.style.background = active ? "rgb(var(--seal))" : "rgb(var(--sheet))";
      el.style.color = active ? "#fff" : "rgb(var(--ink))";
      el.style.zIndex = active ? "2" : "1";
      marker.getElement().style.zIndex = active ? "2" : "1";
    });
  }, [selectedId, properties, ready]);

  if (!HAS_TOKEN || failed) {
    return (
      <div className={`flex items-center justify-center bg-paper-deep p-8 text-center ${className}`}>
        <div className="max-w-xs">
          <p className="font-display text-xl text-ink">Map unavailable</p>
          <p className="mt-2 text-sm text-ink-soft">
            {HAS_TOKEN ? "The map could not load. The list still shows every result." : "Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map view."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-paper-deep ${className}`}>
      {!ready && <div className="skeleton absolute inset-0 !rounded-none" aria-hidden="true" />}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
