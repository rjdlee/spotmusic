"use client";

import { useEffect, useMemo, useState } from "react";

const formatClockLabel = (date: Date) =>
  date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export default function AnalogClockWidget() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const { hourAngle, minuteAngle, secondAngle } = useMemo(() => {
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    return {
      hourAngle: (hours + minutes / 60 + seconds / 3600) * 30,
      minuteAngle: (minutes + seconds / 60) * 6,
      secondAngle: seconds * 6,
    };
  }, [now]);

  const tickMarks = useMemo(
    () =>
      Array.from({ length: 60 }, (_, index) => {
        const isMajor = index % 5 === 0;
        return (
          <div
            key={`tick-${index}`}
            className="absolute inset-0"
            style={{ transform: `rotate(${index * 6}deg)` }}
          >
            <div
              className={`absolute left-1/2 top-3 -translate-x-1/2 rounded-full ${
                isMajor
                  ? "h-3 w-[2px] bg-slate-100/80"
                  : "h-2 w-[1px] bg-slate-300/50"
              }`}
            />
          </div>
        );
      }),
    [],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--mix-ink-soft)]">
            Timing
          </div>
          <h5>Clock</h5>
        </div>
        <span className="mixer-chip">Sync</span>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div
          className="relative grid h-48 w-48 place-items-center rounded-full border border-[color:var(--mix-border)] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_55%),linear-gradient(180deg,#434a5f,#343a4e)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-14px_24px_rgba(0,0,0,0.45)]"
          aria-label={`Local time ${formatClockLabel(now)}`}
          role="img"
        >
          <div className="absolute inset-0">{tickMarks}</div>

          <div
            className="absolute left-1/2 top-1/2 h-14 w-[4px] origin-bottom rounded-full bg-slate-100/90 shadow-[0_0_6px_rgba(226,232,240,0.4)]"
            style={{ transform: `translate(-50%, -100%) rotate(${hourAngle}deg)` }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-20 w-[3px] origin-bottom rounded-full bg-slate-200/90"
            style={{ transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)` }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-20 w-[2px] origin-bottom rounded-full bg-[color:var(--mix-accent)] shadow-[0_0_8px_rgba(240,167,232,0.6)]"
            style={{ transform: `translate(-50%, -100%) rotate(${secondAngle}deg)` }}
          />

          <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[#2c3142]/80" />
          <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-100 shadow-[0_0_6px_rgba(226,232,240,0.6)]" />
        </div>

        <div className="mixer-panel w-full max-w-[14rem] px-4 py-3 text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--mix-ink-soft)]">
            Local
          </div>
          <div className="mt-2 text-xl font-semibold text-[color:var(--mix-ink)]">
            {formatClockLabel(now)}
          </div>
          <div className="mt-1 text-sm text-[color:var(--mix-ink-soft)]">
            {formatDateLabel(now)}
          </div>
        </div>
      </div>
    </div>
  );
}
