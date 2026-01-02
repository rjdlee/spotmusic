"use client";

import { useEffect, useRef, useState } from "react";
import Tooltip from "./Tooltip";
import Notice from "./Notice";

export type YouTubePlayerStatus = "idle" | "loading" | "ready" | "error";
export type YouTubePlayerState =
  | "unstarted"
  | "ended"
  | "playing"
  | "paused"
  | "buffering"
  | "cued"
  | "unknown";

type YouTubePlayerProps = {
  videoId?: string;
  playbackMode: "cue" | "load";
  isTransportPlaying?: boolean;
  llmDescription?: string | null;
  onStatusChange?: (status: YouTubePlayerStatus) => void;
  onStateChange?: (state: YouTubePlayerState, videoId?: string) => void;
  onErrorChange?: (error: string | null) => void;
  onTimeUpdate?: (timeSeconds: number) => void;
  onDurationUpdate?: (durationSeconds: number) => void;
};

let youtubeIframeApiPromise: Promise<void> | null = null;

const loadYouTubeIframeApi = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube IFrame API is unavailable."));
  }

  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youtubeIframeApiPromise) {
    return youtubeIframeApiPromise;
  }

  youtubeIframeApiPromise = new Promise((resolve, reject) => {
    const existingReady = window.onYouTubeIframeAPIReady;
    let timeoutId = 0;

    const cleanup = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (window.onYouTubeIframeAPIReady === handleReady) {
        window.onYouTubeIframeAPIReady = existingReady;
      }
    };

    const handleReady = () => {
      existingReady?.();
      cleanup();
      resolve();
    };

    window.onYouTubeIframeAPIReady = handleReady;

    timeoutId = window.setTimeout(() => {
      cleanup();
      youtubeIframeApiPromise = null;
      reject(new Error("YouTube IFrame API timed out."));
    }, 8000);

    const existingScript = document.getElementById(
      "youtube-iframe-api",
    ) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener(
        "error",
        () => {
          cleanup();
          youtubeIframeApiPromise = null;
          reject(new Error("Failed to load YouTube IFrame API."));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "youtube-iframe-api";
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      cleanup();
      youtubeIframeApiPromise = null;
      reject(new Error("Failed to load YouTube IFrame API."));
    };
    document.body.appendChild(script);
  });

  return youtubeIframeApiPromise;
};

export default function YouTubePlayer({
  videoId,
  playbackMode,
  isTransportPlaying,
  llmDescription,
  onStatusChange,
  onStateChange,
  onErrorChange,
  onTimeUpdate,
  onDurationUpdate,
}: YouTubePlayerProps) {
  const [status, setStatus] = useState<YouTubePlayerStatus>("idle");
  const [playerState, setPlayerState] =
    useState<YouTubePlayerState>("unstarted");
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [cachedDescription, setCachedDescription] = useState<string | null>(
    llmDescription ?? null,
  );
  const [apiReady, setApiReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const transportPlayingRef = useRef<boolean | undefined>(undefined);
  const playbackModeRef = useRef<YouTubePlayerProps["playbackMode"]>(playbackMode);
  const playRetryTimeoutRef = useRef<number | null>(null);
  const playRetryAttemptsRef = useRef(0);
  const lastVideoIdRef = useRef<string | undefined>(videoId);

  useEffect(() => {
    transportPlayingRef.current = isTransportPlaying;
  }, [isTransportPlaying]);

  useEffect(() => {
    playbackModeRef.current = playbackMode;
  }, [playbackMode]);

  useEffect(() => {
    const lastVideoId = lastVideoIdRef.current;
    const videoChanged = videoId !== lastVideoId;

    if (videoChanged) {
      lastVideoIdRef.current = videoId;
      setCachedDescription(llmDescription ?? null);
      return;
    }

    if (llmDescription) {
      setCachedDescription(llmDescription);
    }
  }, [llmDescription, videoId]);

  const schedulePlayRetry = () => {
    if (!transportPlayingRef.current) {
      return;
    }

    if (playRetryTimeoutRef.current) {
      window.clearTimeout(playRetryTimeoutRef.current);
    }

    if (playRetryAttemptsRef.current >= 3) {
      return;
    }

    playRetryAttemptsRef.current += 1;
    playRetryTimeoutRef.current = window.setTimeout(() => {
      if (!transportPlayingRef.current) {
        return;
      }
      const player = youtubePlayerRef.current as YouTubePlayer & {
        playVideo?: () => void;
      };
      player.playVideo?.call(player);
    }, 350);
  };

  const resetPlayRetry = () => {
    playRetryAttemptsRef.current = 0;
    if (playRetryTimeoutRef.current) {
      window.clearTimeout(playRetryTimeoutRef.current);
      playRetryTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    onErrorChange?.(playerError);
  }, [onErrorChange, playerError]);

  useEffect(() => {
    setStatus("loading");

    let active = true;

    loadYouTubeIframeApi()
      .then(() => {
        if (!active) {
          return;
        }
        setStatus("ready");
        setPlayerError(null);
        setApiReady(true);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setStatus("error");
        setPlayerError(
          error instanceof Error
            ? error.message
            : "Failed to load YouTube IFrame API.",
        );
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!apiReady || status !== "ready") {
      return;
    }

    if (!videoId) {
      return;
    }

    if (youtubePlayerRef.current) {
      return;
    }

    const constructor = window.YT?.Player;
    if (!constructor) {
      return;
    }

    let rafId = 0;

    const initializePlayer = () => {
      if (youtubePlayerRef.current) {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        rafId = window.requestAnimationFrame(initializePlayer);
        return;
      }

      const playerInstance = new constructor(container, {
        height: "100%",
        width: "100%",
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          controls: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            const target = event?.target as YouTubePlayer | undefined;
            if (!target || typeof target.loadVideoById !== "function") {
              setStatus("error");
              setPlayerError("YouTube player API did not initialize.");
              setPlayerReady(false);
              return;
            }

            youtubePlayerRef.current = target;
            setStatus("ready");
            setPlayerError(null);
            setPlayerReady(true);
            resetPlayRetry();
            if (
              transportPlayingRef.current &&
              playbackModeRef.current === "load"
            ) {
              const player = target as YouTubePlayer & { playVideo?: () => void };
              player.playVideo?.call(player);
              schedulePlayRetry();
            }
          },
          onStateChange: (event) => {
            const stateMap: Record<number, YouTubePlayerState> = {
              [-1]: "unstarted",
              0: "ended",
              1: "playing",
              2: "paused",
              3: "buffering",
              5: "cued",
            };
            const nextState = stateMap[event.data] ?? "unknown";
            setPlayerState(nextState);
            const videoData = (
              event?.target as YouTubePlayer & {
                getVideoData?: () => { video_id?: string };
              }
            )?.getVideoData?.();
            console.debug("[YouTubePlayer] state change", {
              state: nextState,
              videoId: videoData?.video_id,
            });
            onStateChange?.(nextState, videoData?.video_id);
            if (nextState === "playing") {
              resetPlayRetry();
            }
            if (
              (nextState === "cued" || nextState === "unstarted") &&
              transportPlayingRef.current
            ) {
              const player = youtubePlayerRef.current as YouTubePlayer & {
                playVideo?: () => void;
              };
              player.playVideo?.call(player);
              schedulePlayRetry();
            }
          },
          onError: (event) => {
            const errorMessages: Record<number, string> = {
              2: "The requested video ID is invalid.",
              5: "The video cannot be played in the HTML5 player.",
              100: "The requested video was not found.",
              101: "The video owner does not allow playback here.",
              150: "The video owner does not allow playback here.",
            };
            const message =
              errorMessages[event.data] ?? "YouTube player encountered an error.";
            setStatus("ready");
            setPlayerError(message);
          },
        },
      });

      youtubePlayerRef.current = playerInstance;
    };

    initializePlayer();

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [apiReady, onStateChange, status, videoId]);

  useEffect(() => {
    return () => {
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!youtubePlayerRef.current || status !== "ready") {
      return;
    }

    if (!playerReady) {
      return;
    }

    if (!videoId) {
      return;
    }

    const player = youtubePlayerRef.current;
    const cue = (player as YouTubePlayer & { cueVideoById?: (id: string) => void })
      .cueVideoById;
    const load = (
      player as YouTubePlayer & { loadVideoById?: (id: string) => void }
    ).loadVideoById;

    if (playbackMode === "cue" && typeof cue === "function") {
      cue.call(player, videoId);
      return;
    }

    if (typeof load === "function") {
      load.call(player, videoId);
      if (isTransportPlaying) {
        const playable = player as YouTubePlayer & { playVideo?: () => void };
        window.setTimeout(() => {
          playable.playVideo?.call(playable);
        }, 0);
        resetPlayRetry();
        schedulePlayRetry();
      }
    } else {
      setStatus("error");
      setPlayerError("YouTube player did not expose loadVideoById.");
    }
  }, [videoId, status, playbackMode, playerReady, isTransportPlaying]);

  useEffect(() => {
    if (!youtubePlayerRef.current || status !== "ready" || !playerReady) {
      return;
    }

    if (typeof isTransportPlaying !== "boolean") {
      return;
    }

    const player = youtubePlayerRef.current as YouTubePlayer & {
      playVideo?: () => void;
      pauseVideo?: () => void;
    };

    if (isTransportPlaying) {
      player.playVideo?.call(player);
      schedulePlayRetry();
    } else {
      resetPlayRetry();
      player.pauseVideo?.call(player);
    }
  }, [isTransportPlaying, playerReady, status, videoId]);

  useEffect(() => {
    if (!youtubePlayerRef.current || status !== "ready" || !playerReady) {
      return;
    }

    if (!onTimeUpdate && !onDurationUpdate) {
      return;
    }

    const player = youtubePlayerRef.current as YouTubePlayer & {
      getCurrentTime?: () => number;
      getDuration?: () => number;
    };

    const intervalId = window.setInterval(() => {
      const time = onTimeUpdate ? player.getCurrentTime?.() : undefined;
      const duration = onDurationUpdate ? player.getDuration?.() : undefined;
      if (typeof time === "number" && Number.isFinite(time)) {
        onTimeUpdate(time);
      }
      if (typeof duration === "number" && Number.isFinite(duration)) {
        onDurationUpdate(duration);
      }
    }, 500);

    return () => window.clearInterval(intervalId);
  }, [onDurationUpdate, onTimeUpdate, playerReady, status, videoId]);

  return (
    <section className="mixer-tile flex h-full flex-col p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--mix-ink-soft)]">
            YouTube deck
          </div>
          <h2 className="text-lg font-semibold text-[color:var(--mix-ink)]">
            Live video feed
          </h2>
        </div>
        <Tooltip
          content={`Video ID: ${videoId ?? "None"} | Player state: ${playerState}`}
          ariaLabel="YouTube player info"
        />
      </div>

      {cachedDescription ? (
        <p className="mt-4 text-xs text-[color:var(--mix-ink-soft)]">
          {cachedDescription}
        </p>
      ) : null}

      <div className="mixer-panel mt-5 flex-1 overflow-hidden">
        {videoId ? (
          <div ref={containerRef} className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-[color:var(--mix-border)] text-sm text-[color:var(--mix-ink-soft)]">
            No video selected yet.
          </div>
        )}
      </div>

      {playerError ? (
        <Notice className="mt-4">
          {playerError}
        </Notice>
      ) : null}
    </section>
  );
}
