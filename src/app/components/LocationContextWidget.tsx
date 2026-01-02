"use client";

import SwitchToggle from "./SwitchToggle";

type LocationStatus =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "unsupported"
  | "error";

type LocationContextWidgetProps = {
  status: LocationStatus;
  error: string | null;
  weatherError: string | null;
  onRequestAccess: () => void;
  onStop: () => void;
};

export default function LocationContextWidget({
  status,
  error,
  weatherError,
  onRequestAccess,
  onStop,
}: LocationContextWidgetProps) {
  const isActive = status === "active";
  const isRequesting = status === "requesting";

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-5">
      <div className="flex-1">
        <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--mix-ink-soft)]">
          Atmosphere
        </div>
        <h5>
          Location
        </h5>
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-5 text-xs text-[color:var(--mix-ink-soft)]">
        <SwitchToggle
          label={isActive ? "On" : "Off"}
          isOn={isActive}
          onToggle={isActive ? onStop : onRequestAccess}
          disabled={isRequesting}
          ariaLabel={`Location ${isActive ? "on" : "off"}`}
        />
        {error ? (
          <span className="text-[color:var(--mix-danger)]">{error}</span>
        ) : null}
        {weatherError ? (
          <span className="text-[color:var(--mix-danger)]">
            Weather: {weatherError}
          </span>
        ) : null}
      </div>
    </div>
  );
}
