"use client";

import { useMemo } from "react";

type SliderProps = {
  label: string;
  highLabel: string;
  lowLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (nextValue: number) => void;
  valueLabel: string;
};

export default function Slider({
  label,
  highLabel,
  lowLabel,
  value,
  min,
  max,
  step,
  onChange,
  valueLabel,
}: SliderProps) {
  const tickMarks = useMemo(() => {
    const tickCount = 21;

    if (tickCount < 2) {
      return null;
    }

    const tickOffset = "calc(50% + 8px)";

    return Array.from({ length: tickCount }, (_, index) => {
      const isMajor = index % 5 === 0;
      const isEdge = index === 0 || index === tickCount - 1;
      const position = (index / (tickCount - 1)) * 100;
      const tickClassName = isMajor && !isEdge
        ? "h-[2px] w-4 bg-slate-100/70"
        : "h-[1px] w-3 bg-slate-300/40";

      return (
        <div
          key={`tick-${index}`}
          className="absolute left-0 right-0"
          style={{ bottom: `${position}%` }}
        >
          <div
            className={`absolute top-1/2 -translate-y-1/2 rounded-full ${tickClassName}`}
            style={{ right: tickOffset }}
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 rounded-full ${tickClassName}`}
            style={{ left: tickOffset }}
          />
        </div>
      );
    });
  }, [max, min, step]);

  return (
    <label className="flex flex-col items-center gap-4 p-4 text-sm text-[color:var(--mix-ink-soft)]">
      <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--mix-ink-soft)]">
        {label}
      </div>
      <span className="text-xs">{highLabel}</span>
      <div className="mixer-fader-shell">
        <div className="pointer-events-none absolute left-0 right-0 top-4 bottom-4">
          {tickMarks}
        </div>
        <input
          className="mixer-vertical"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
      <span className="text-xs">{lowLabel}</span>
      <div className="text-xs text-[color:var(--mix-ink)]">{valueLabel}</div>
    </label>
  );
}
