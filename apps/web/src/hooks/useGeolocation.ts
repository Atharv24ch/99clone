"use client";

import { useState, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * useGeolocation — wraps the browser Geolocation API.
 * Requests location on mount (or on demand via `request()`).
 */
export function useGeolocation(auto = false): GeolocationState & {
  request: () => void;
} {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: false,
  });

  const request = () => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, error: "Geolocation not supported" }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
          isLoading: false,
        });
      },
      (err) => {
        setState((s) => ({
          ...s,
          error: err.message,
          isLoading: false,
        }));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  };

  useEffect(() => {
    if (auto) request();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  return { ...state, request };
}
