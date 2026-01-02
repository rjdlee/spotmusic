"use client";

import type { RefObject } from "react";
import SwitchToggle from "./SwitchToggle";
import Tooltip from "./Tooltip";

type MicrophoneStatus = "idle" | "requesting" | "active" | "denied" | "error";

type MicrophoneContextWidgetProps = {
  status: MicrophoneStatus;
  error: string | null;
  ambientNoiseValue: string;
  ambientTempoValue: string;
  onRequestAccess: () => void;
  onStop: () => void;
  waveformRef: RefObject<HTMLCanvasElement>;
  soundLevelRef: RefObject<HTMLCanvasElement>;
};

export default function MicrophoneContextWidget({
  status,
  error,
  ambientNoiseValue,
  ambientTempoValue,
  onRequestAccess,
  onStop,
  waveformRef,
  soundLevelRef,
}: MicrophoneContextWidgetProps) {
  const isActive = status === "active";
  const isRequesting = status === "requesting";

  return (
    <div>
      <div className="flex w-full flex-wrap items-center justify-between gap-5">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--mix-ink-soft)]">
            Input
          </div>
          <h5>
            Microphone
          </h5>
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-5 text-xs text-[color:var(--mix-ink-soft)]">
          <SwitchToggle
            label={isActive ? "On" : "Off"}
            isOn={isActive}
            onToggle={isActive ? onStop : onRequestAccess}
            disabled={isRequesting}
            ariaLabel={`Microphone ${isActive ? "on" : "off"}`}
          />
          {error ? (
            <span className="text-[color:var(--mix-danger)]">{error}</span>
          ) : null}
        </div>
      </div>

      <div className="mixer-panel mt-5 px-4 py-3">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--mix-ink-soft)]">
          <span>Ambient readout</span>
          <div className="flex items-center gap-2">
            <span>{status === "active" ? "Live" : "Idle"}</span>
            <Tooltip
              content={
                status === "active"
                  ? "Ambient noise and tempo derived from the live input."
                  : "Enable the microphone to detect ambient noise and tempo."
              }
              ariaLabel="Ambient readout info"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[color:var(--mix-ink-soft)]">
              Ambient noise
            </span>
            <span className="font-medium text-[color:var(--mix-ink)]">
              {ambientNoiseValue}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[color:var(--mix-ink-soft)]">
              Ambient tempo
            </span>
            <span className="font-medium text-[color:var(--mix-ink)]">
              {ambientTempoValue}
            </span>
          </div>
        </div>
      </div>

      <div className="mixer-panel mt-5 px-4 py-3">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--mix-ink-soft)]">
          <span>Mic waveform</span>
          <div className="flex items-center gap-2">
            <span>{status === "active" ? "Live" : "Idle"}</span>
            <Tooltip
              content={
                status === "active"
                  ? "Listening to the room in real time."
                  : "Enable the microphone to visualize ambient sound."
              }
              ariaLabel="Mic waveform info"
            />
          </div>
        </div>
        <canvas
          ref={waveformRef}
          className="mt-3 h-24 w-full rounded-xl border border-[color:var(--mix-border)] bg-[color:var(--mix-surface)]"
        />
      </div>

      <div className="mixer-panel mt-5 px-4 py-3">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--mix-ink-soft)]">
          <span>Smoothed sound level (30s)</span>
          <div className="flex items-center gap-2">
            <span>{status === "active" ? "Live" : "Idle"}</span>
            <Tooltip
              content={
                status === "active"
                  ? "Smoothed ambient levels over the last 30 seconds."
                  : "Enable the microphone to collect a sound level history."
              }
              ariaLabel="Smoothed sound level info"
            />
          </div>
        </div>
        <canvas
          ref={soundLevelRef}
          className="mt-3 h-24 w-full rounded-xl border border-[color:var(--mix-border)] bg-[color:var(--mix-surface)]"
        />
      </div>
    </div>
  );
}
