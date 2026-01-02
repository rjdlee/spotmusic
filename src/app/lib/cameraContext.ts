"use client";

type CameraStatus = "idle" | "requesting" | "active" | "denied" | "error";
type LightLevel = "Dim" | "Soft" | "Bright" | "Radiant" | "Unknown";
type ColorTone = "Muted" | "Balanced" | "Vibrant" | "Unknown";
type ColorTemperature = "Warm" | "Neutral" | "Cool" | "Unknown";

export const getCameraStatusLabel = (status: CameraStatus) =>
  status === "active"
    ? "Active"
    : status === "requesting"
      ? "Requesting"
      : status === "denied"
        ? "Denied"
        : status === "error"
          ? "Error"
          : "Off";

export const getLightingValue = (
  status: CameraStatus,
  lightLevel: LightLevel,
) =>
  status === "active"
    ? lightLevel
    : status === "denied"
      ? "Permission denied"
      : status === "error"
        ? "Unavailable"
        : "Off";

export const getColorToneValue = (
  status: CameraStatus,
  colorTemperature: ColorTemperature,
  colorTone: ColorTone,
) =>
  status === "active"
    ? `${colorTemperature} · ${colorTone}`
    : status === "denied"
      ? "Permission denied"
      : status === "error"
        ? "Unavailable"
        : "Off";

export const getMoodValue = (status: CameraStatus, mood: string) =>
  status === "active"
    ? mood
    : status === "denied"
      ? "Permission denied"
      : status === "error"
        ? "Unavailable"
        : "Off";
