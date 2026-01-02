"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CameraStatus = "idle" | "requesting" | "active" | "denied" | "error";
type LightLevel = "Dim" | "Soft" | "Bright" | "Radiant" | "Unknown";
type ColorTone = "Muted" | "Balanced" | "Vibrant" | "Unknown";
type ColorTemperature = "Warm" | "Neutral" | "Cool" | "Unknown";

type CameraSensorState = {
  status: CameraStatus;
  lightLevel: LightLevel;
  colorTone: ColorTone;
  colorTemperature: ColorTemperature;
  mood: string;
  averageColor: string;
  brightness: number | null;
  error: string | null;
  requestAccess: () => Promise<void>;
  stop: () => void;
};

const SAMPLE_SIZE = 24;
const UPDATE_INTERVAL_MS = 600;

const toHex = (value: number) =>
  Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");

const classifyLight = (brightness: number): LightLevel => {
  if (brightness < 0.25) {
    return "Dim";
  }
  if (brightness < 0.5) {
    return "Soft";
  }
  if (brightness < 0.78) {
    return "Bright";
  }
  return "Radiant";
};

const classifyTone = (saturation: number): ColorTone => {
  if (saturation < 0.2) {
    return "Muted";
  }
  if (saturation < 0.45) {
    return "Balanced";
  }
  return "Vibrant";
};

const classifyTemperature = (red: number, blue: number): ColorTemperature => {
  if (red - blue > 18) {
    return "Warm";
  }
  if (blue - red > 18) {
    return "Cool";
  }
  return "Neutral";
};

const deriveMood = (
  light: LightLevel,
  tone: ColorTone,
  temperature: ColorTemperature,
): string => {
  if (light === "Dim" && temperature === "Warm") {
    return "Cozy";
  }
  if (light === "Dim" && temperature === "Cool") {
    return "Moody";
  }
  if (light === "Radiant" && temperature === "Warm") {
    return "Uplifting";
  }
  if ((light === "Bright" || light === "Radiant") && temperature === "Cool") {
    return "Focused";
  }
  if (light === "Soft" && tone === "Muted") {
    return "Calm";
  }
  if (tone === "Vibrant") {
    return "Energetic";
  }
  return "Balanced";
};

export const useCameraSensor = (): CameraSensorState => {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [lightLevel, setLightLevel] = useState<LightLevel>("Unknown");
  const [colorTone, setColorTone] = useState<ColorTone>("Unknown");
  const [colorTemperature, setColorTemperature] =
    useState<ColorTemperature>("Unknown");
  const [mood, setMood] = useState("Unknown");
  const [averageColor, setAverageColor] = useState("#9ca3af");
  const [brightness, setBrightness] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  const stop = useCallback(() => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    videoRef.current = null;
    canvasRef.current = null;
    setStatus((prev) => (prev === "active" ? "idle" : prev));
  }, []);

  const sample = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      rafRef.current = window.requestAnimationFrame(sample);
      return;
    }

    const now = Date.now();
    if (now - lastUpdateRef.current < UPDATE_INTERVAL_MS) {
      rafRef.current = window.requestAnimationFrame(sample);
      return;
    }
    lastUpdateRef.current = now;

    const context = canvas.getContext("2d");
    if (!context) {
      rafRef.current = window.requestAnimationFrame(sample);
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    context.drawImage(video, 0, 0, width, height);
    const { data } = context.getImageData(0, 0, width, height);

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let totalSaturation = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalR += r;
      totalG += g;
      totalB += b;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      totalSaturation += saturation;
    }

    const pixelCount = data.length / 4 || 1;
    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;
    const avgSaturation = totalSaturation / pixelCount;
    const nextBrightness =
      (0.2126 * avgR + 0.7152 * avgG + 0.0722 * avgB) / 255;

    const nextLight = classifyLight(nextBrightness);
    const nextTone = classifyTone(avgSaturation);
    const nextTemperature = classifyTemperature(avgR, avgB);
    const nextMood = deriveMood(nextLight, nextTone, nextTemperature);
    const nextColor = `#${toHex(avgR)}${toHex(avgG)}${toHex(avgB)}`;

    setBrightness(nextBrightness);
    setLightLevel(nextLight);
    setColorTone(nextTone);
    setColorTemperature(nextTemperature);
    setMood(nextMood);
    setAverageColor(nextColor);

    rafRef.current = window.requestAnimationFrame(sample);
  }, []);

  const requestAccess = useCallback(async () => {
    if (status === "requesting" || status === "active") {
      return;
    }

    setStatus("requesting");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      const video = document.createElement("video");
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = SAMPLE_SIZE;
      canvas.height = SAMPLE_SIZE;

      videoRef.current = video;
      canvasRef.current = canvas;

      setStatus("active");
      lastUpdateRef.current = 0;
      rafRef.current = window.requestAnimationFrame(sample);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Camera access failed.";
      setError(message);
      setStatus(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "denied"
          : "error",
      );
      stop();
    }
  }, [sample, status, stop]);

  useEffect(() => stop, [stop]);

  return {
    status,
    lightLevel,
    colorTone,
    colorTemperature,
    mood,
    averageColor,
    brightness,
    error,
    requestAccess,
    stop,
  };
};
