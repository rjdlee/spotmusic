"use client";

type PlaybackDashboardHeaderProps = {
  isTransportPlaying: boolean;
  onToggleTransport: () => void;
  onOpenSettings: () => void;
  currentTrackTitle?: string | null;
  currentTimestamp?: string | null;
  onPrevious?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
};

export default function PlaybackDashboardHeader({
  isTransportPlaying,
  onToggleTransport,
  onOpenSettings,
  currentTrackTitle,
  currentTimestamp,
  onPrevious,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
}: PlaybackDashboardHeaderProps) {
  const trackLabel = currentTrackTitle ?? "No track playing";
  const timestampLabel = currentTimestamp ?? "0:00";
  const transportButtonClass =
    "group inline-flex items-center justify-center transition-colors duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mix-accent)]";
  const transportFaceClass =
    "relative flex h-[52px] w-[52px] items-center justify-center rounded-[16px] border border-[#2b3144] bg-gradient-to-b from-[#4a546d] to-[#353d52] shadow-[inset_0_2px_3px_rgba(255,255,255,0.08),inset_0_-4px_6px_rgba(0,0,0,0.55),0_6px_12px_rgba(7,10,20,0.45)] transition-all duration-150 group-hover:from-[#465069] group-hover:to-[#333a4d] group-hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_4px_8px_rgba(7,10,20,0.35)] after:absolute after:inset-[4px] after:rounded-[12px] after:border after:border-[rgba(15,18,30,0.7)] after:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] after:transition-all after:duration-150 group-hover:after:inset-[4.5px] group-hover:after:shadow-[inset_0_1px_2px_rgba(0,0,0,0.65)] after:content-['']";

  return (
    <header className="rounded-none px-6 py-3">
      <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[color:var(--mix-ink-soft)]">
          Spotmusic
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--mix-ink-soft)]">
            Now playing
          </div>
          <span className="mx-auto block max-w-[360px] truncate text-sm font-medium text-[color:var(--mix-ink)]">
            {trackLabel}
          </span>
          <div className="mt-1 text-xs uppercase tracking-[0.2em] text-[color:var(--mix-ink-soft)]">
            {timestampLabel}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onPrevious}
            disabled={previousDisabled}
            className={`${transportButtonClass} rounded-[14px]`}
            aria-label="Previous track"
          >
            <span className={transportFaceClass} aria-hidden="true">
              <span className="relative flex items-center justify-center">
                <span className="h-0 w-0 border-y-[6px] border-y-transparent border-r-[10px] border-r-[color:var(--mix-ink)]" />
                <span className="-ml-[2px] h-0 w-0 border-y-[6px] border-y-transparent border-r-[10px] border-r-[color:var(--mix-ink)] opacity-70" />
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={onToggleTransport}
            className={`${transportButtonClass} rounded-full`}
            aria-label={isTransportPlaying ? "Stop" : "Play"}
          >
            <span className="relative flex h-[56px] w-[56px] items-center justify-center">
              <span className="absolute inset-0 rounded-full border-[3px] border-[color:#e8a5db]" />
              <span className="absolute inset-[6px] rounded-full bg-gradient-to-b from-[#3f465c] to-[#2c3243] shadow-[inset_0_2px_4px_rgba(0,0,0,0.55),0_6px_12px_rgba(12,15,25,0.45)]" />
              <span className="relative z-10 flex items-center justify-center">
                {isTransportPlaying ? (
                  <span className="h-[14px] w-[14px] bg-[color:var(--mix-ink)]" />
                ) : (
                  <span className="h-0 w-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-[color:var(--mix-ink)]" />
                )}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className={`${transportButtonClass} rounded-[14px]`}
            aria-label="Next track"
          >
            <span className={transportFaceClass} aria-hidden="true">
              <span className="relative flex items-center justify-center">
                <span className="h-0 w-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-[color:var(--mix-ink)]" />
                <span className="-ml-[2px] h-0 w-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-[color:var(--mix-ink)] opacity-70" />
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[color:var(--mix-ink)] transition hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mix-accent)]"
            aria-label="Open setup"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 text-[color:var(--mix-ink)] transition group-hover:rotate-45"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3.5" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.86l.07.07a2 2 0 1 1-2.83 2.83l-.07-.07a1.7 1.7 0 0 0-1.86-.34 1.7 1.7 0 0 0-1 1.54V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.54 1.7 1.7 0 0 0-1.86.34l-.07.07A2 2 0 1 1 3 17.94l.07-.07A1.7 1.7 0 0 0 3.41 16a1.7 1.7 0 0 0-1.54-1H1.8a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.54-1 1.7 1.7 0 0 0-.34-1.86l-.07-.07A2 2 0 1 1 5.86 3.1l.07.07a1.7 1.7 0 0 0 1.86.34 1.7 1.7 0 0 0 1-1.54V1.8a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.54 1.7 1.7 0 0 0 1.86-.34l.07-.07A2 2 0 1 1 20.9 5.86l-.07.07a1.7 1.7 0 0 0-.34 1.86 1.7 1.7 0 0 0 1.54 1h.1a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.54 1z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
