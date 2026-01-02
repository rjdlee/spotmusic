"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type LocationStatus =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "error"
  | "unsupported";

type LocationCoords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

type LocationSensorState = {
  status: LocationStatus;
  coords: LocationCoords | null;
  error: string | null;
  requestAccess: () => void;
  stop: () => void;
};

export const useLocationSensor = (): LocationSensorState => {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setStatus((prev) =>
      prev === "active" || prev === "requesting" ? "idle" : prev,
    );
  }, []);

  const requestAccess = useCallback(() => {
    if (status === "requesting" || status === "active") {
      return;
    }

    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setStatus("requesting");
    setError(null);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy)
            ? position.coords.accuracy
            : null,
          timestamp: position.timestamp,
        });
        setStatus("active");
      },
      (err) => {
        const message =
          err instanceof GeolocationPositionError && err.message
            ? err.message
            : "Location access failed.";
        setError(message);
        setStatus(
          err instanceof GeolocationPositionError &&
            err.code === err.PERMISSION_DENIED
            ? "denied"
            : "error",
        );
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 15_000,
      },
    );

    watchIdRef.current = watchId;
  }, [status]);

  useEffect(() => stop, [stop]);

  return {
    status,
    coords,
    error,
    requestAccess,
    stop,
  };
};
