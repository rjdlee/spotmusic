"use client";

import SwitchToggle from "./SwitchToggle";

type CameraStatus = "idle" | "requesting" | "active" | "denied" | "error";

type CameraContextWidgetProps = {
  status: CameraStatus;
  error: string | null;
  averageColor: string;
  lightingValue: string;
  colorToneValue: string;
  moodValue: string;
  onRequestAccess: () => void;
  onStop: () => void;
};

export default function CameraContextWidget({
  status,
  error,
  averageColor,
  lightingValue,
  colorToneValue,
  moodValue,
  onRequestAccess,
  onStop,
}: CameraContextWidgetProps) {
  const isActive = status === "active";
  const isRequesting = status === "requesting";

  return (
    <div>
      <div className="flex w-full flex-wrap items-center justify-between gap-5">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--mix-ink-soft)]">
            Visual
          </div>
          <h5>
            Camera
          </h5>
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-5 text-xs text-[color:var(--mix-ink-soft)]">
          <SwitchToggle
            label={isActive ? "On" : "Off"}
            isOn={isActive}
            onToggle={isActive ? onStop : onRequestAccess}
            disabled={isRequesting}
            ariaLabel={`Camera ${isActive ? "on" : "off"}`}
          />
          {error ? (
            <span className="text-[color:var(--mix-danger)]">{error}</span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[color:var(--mix-ink-soft)]">
        <div className="grid gap-2 text-sm w-full">
          <div className="mixer-panel px-4 py-3 text-center flex items-center gap-4">
            <div
              className="h-12 w-12 rounded-2xl border border-[color:var(--mix-border)] shadow-sm"
              style={{ backgroundColor: isActive ? averageColor : '#000000' }}
            />
            <div>
              <div className="text-sm text-[color:var(--mix-ink-soft)]">Color</div>
              <div className="text-xl font-semibold text-[color:var(--mix-ink)]">{isActive ? averageColor : 'Off'}</div>
            </div>
          </div>
          <div className="mixer-panel px-4 py-3 text-center"><div className="text-sm text-[color:var(--mix-ink-soft)]">Light</div><div className="text-xl font-semibold text-[color:var(--mix-ink)]">{lightingValue}</div></div>
          <div className="mixer-panel px-4 py-3 text-center"><div className="text-sm text-[color:var(--mix-ink-soft)]">Tone</div><div className="text-xl font-semibold text-[color:var(--mix-ink)]">{colorToneValue}</div></div>
          <div className="mixer-panel px-4 py-3 text-center"><div className="text-sm text-[color:var(--mix-ink-soft)]">Mood</div><div className="text-xl font-semibold text-[color:var(--mix-ink)]">{moodValue}</div></div>
        </div>
      </div>
    </div>
  );
}
