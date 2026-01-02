"use client";

import { useEffect, useRef } from "react";
import Tooltip from "./Tooltip";
import Notice from "./Notice";

export type PlaylistQueueItem = {
  videoId: string;
  title: string;
  channelTitle: string;
  addedAt: string;
  source: string;
  query?: string;
  llmRationale?: string;
};

type PlaylistQueueListProps = {
  items: PlaylistQueueItem[];
  status: string;
  onClear: () => void;
  onRemove: (index: number) => void;
  onSelect: (index: number) => void;
  onRunNext: () => void;
  runNextDisabled?: boolean;
  currentVideoId?: string;
  queuePosition?: {
    index: number;
    total: number;
    inQueue: boolean;
  };
  llmStatus?: "idle" | "loading" | "ready" | "error";
  llmError?: string | null;
};

export default function PlaylistQueueList({
  items,
  status,
  onClear,
  onRemove,
  onSelect,
  onRunNext,
  runNextDisabled,
  currentVideoId,
  queuePosition,
  llmStatus,
  llmError,
}: PlaylistQueueListProps) {
  const activeItemRef = useRef<HTMLDivElement | null>(null);
  const queueLabel = queuePosition
    ? queuePosition.inQueue
      ? `Queue ${queuePosition.index} / ${queuePosition.total}`
      : `Queue ${queuePosition.total}`
    : "Queue 0";
  const currentIndex = currentVideoId
    ? items.findIndex((item) => item.videoId === currentVideoId)
    : -1;
  const nextIndex =
    items.length === 0
      ? -1
      : currentIndex >= 0 && currentIndex < items.length
      ? (currentIndex + 1) % items.length
      : 0;
  const showWhatsNext = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (!activeItemRef.current) {
      return;
    }

    activeItemRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [currentVideoId, items]);

  return (
    <section className="mixer-tile p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Playlist queue</h2>
            <Tooltip
              content="Upcoming songs stored locally when demos run."
              ariaLabel="Playlist queue info"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="mixer-chip">{queueLabel}</span>
          {showWhatsNext ? (
            <button
              className="mixer-button px-4 py-1 text-xs disabled:opacity-60"
              onClick={onRunNext}
              disabled={runNextDisabled}
              type="button"
            >
              What's Next
            </button>
          ) : null}
          <button
            className="mixer-button flex h-8 w-8 items-center justify-center p-0 text-xs disabled:opacity-60"
            onClick={onClear}
            disabled={!items.length}
            type="button"
            aria-label="Clear queue"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M8 6v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
              <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
          <span className="mixer-chip">
            {status}
          </span>
        </div>
      </div>

      {llmStatus === "loading" ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[color:var(--mix-border)] bg-[color:rgba(59,65,84,0.9)] px-4 py-3 text-sm text-[color:var(--mix-ink)] shadow-[0_10px_20px_rgba(12,15,25,0.45)]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[color:rgba(240,167,232,0.4)] bg-[color:rgba(240,167,232,0.12)] text-[color:var(--mix-accent)]">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-3.5 w-3.5 animate-spin"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2.2"
                className="opacity-25"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--mix-ink-soft)]">
            Generating
          </span>
          <span>Next tracks are loading into the queue.</span>
        </div>
      ) : null}

      {llmStatus === "error" ? (
        <Notice className="mt-4">
          {llmError ?? "LLM evaluation failed."}
        </Notice>
      ) : null}

      <div className="mt-5 grid max-h-[420px] gap-3 overflow-y-auto pr-1 text-sm text-[color:var(--mix-ink-soft)]">
        {items.length ? (
          items.map((item, index) => {
            const isActive = item.videoId === currentVideoId;
            const isUpNext = index === nextIndex;
            const isPrevious = currentIndex >= 0 && index < currentIndex;

            return (
              <div
                key={`${item.videoId}-${item.addedAt}`}
                ref={isActive ? activeItemRef : undefined}
                className={`mixer-card flex flex-col gap-3 overflow-hidden px-4 py-3 cursor-pointer transition hover:border-[color:var(--mix-ink-soft)] ${
                  isPrevious ? "opacity-70" : ""
                }`}
                onClick={() => onSelect(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(index);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[color:var(--mix-ink)]">
                      <span className="truncate" title={item.title}>
                        {item.title}
                      </span>
                      <Tooltip
                        content={`Added ${new Date(item.addedAt).toLocaleString()} | Video ID: ${item.videoId}${item.query ? ` | Query: ${item.query}` : ""}`}
                        ariaLabel="Track metadata"
                      />
                    </div>
                    <div className="text-xs text-[color:var(--mix-ink-soft)]">
                      {item.channelTitle}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {isActive ? (
                      <span className="mixer-chip">Now playing</span>
                    ) : null}
                    {isUpNext && !isActive ? (
                      <span className="mixer-chip">UP NEXT</span>
                    ) : null}
                    <Tooltip content="Remove">
                      <button
                        className="mixer-button flex h-8 w-8 items-center justify-center p-0 text-xs text-[color:var(--mix-danger)] border-[color:rgba(210,109,92,0.3)] bg-[color:rgba(210,109,92,0.08)] hover:border-[color:rgba(210,109,92,0.5)]"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemove(index);
                        }}
                        type="button"
                        aria-label="Remove"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
                          <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center gap-3 text-sm text-[color:var(--mix-ink-soft)]">
            <span>Queue empty</span>
            {showWhatsNext ? (
              <Tooltip
                content="Tap What's Next to seed upcoming tracks."
                ariaLabel="Queue empty info"
              />
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
