"use client";

type MicrophoneStatus = "idle" | "requesting" | "active" | "denied" | "error";
type NoiseLevel = "Quiet" | "Moderate" | "Loud" | "Unknown";

export const getMicrophoneStatusLabel = (status: MicrophoneStatus) =>
  status === "active"
    ? "Active"
    : status === "requesting"
      ? "Requesting"
      : status === "denied"
        ? "Denied"
        : status === "error"
          ? "Error"
          : "Off";

export const getAmbientNoiseValue = (
  status: MicrophoneStatus,
  noiseLevel: NoiseLevel,
) =>
  status === "active"
    ? noiseLevel
    : status === "denied"
      ? "Permission denied"
      : status === "error"
        ? "Unavailable"
        : "Off";

export const getAmbientTempoValue = (
  status: MicrophoneStatus,
  bpm: number | null,
) =>
  status === "active"
    ? bpm !== null
      ? `${bpm} BPM`
      : "Listening..."
    : status === "denied"
      ? "Permission denied"
      : status === "error"
        ? "Unavailable"
        : "Off";
