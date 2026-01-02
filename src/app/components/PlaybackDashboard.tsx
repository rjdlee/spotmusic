"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getColorToneValue,
  getLightingValue,
  getMoodValue,
} from "../lib/cameraContext";
import {
  evaluateYouTubeParams,
  type LlmSignalInputs,
  type LlmUserProfile,
} from "../lib/llmEvaluation";
import { formatWeatherSignal, getLocationSignal } from "../lib/locationContext";
import {
  getAmbientNoiseValue,
  getAmbientTempoValue,
} from "../lib/microphoneContext";
import { useCameraSensor } from "../lib/useCameraSensor";
import { useLocationSensor } from "../lib/useLocationSensor";
import { useMicrophoneSensor } from "../lib/useMicrophoneSensor";
import { fetchWeatherForecast, type WeatherForecast } from "../lib/weather";
import { searchYouTubeVideos } from "../lib/youtubeSearch";
import AnalogClockWidget from "./AnalogClockWidget";
import CameraContextWidget from "./CameraContextWidget";
import LocationContextWidget from "./LocationContextWidget";
import MicrophoneContextWidget from "./MicrophoneContextWidget";
import OnboardingModal from "./OnboardingModal";
import PlaybackDashboardHeader from "./PlaybackDashboardHeader";
import PlaylistQueueList, { type PlaylistQueueItem } from "./PlaylistQueueList";
import UserPreferencesPanel from "./UserPreferencesPanel";
import WeatherForecastWidget from "./WeatherForecastWidget";
import YouTubePlayer, {
  type YouTubePlayerState,
  type YouTubePlayerStatus,
} from "./YouTubePlayer";

type AsyncStatus = "idle" | "loading" | "ready" | "error";

const playlistQueueStorageKey = "spotmusic-playlist-queue";
const apiKeysStorageKey = "spotmusic-api-keys";
const onboardingStorageKey = "spotmusic-onboarding-complete";
const defaultLlmModel = "gemma-3-27b-it";

type ApiKeys = {
  geminiApiKey: string;
  youtubeApiKey: string;
  llmModel: string;
};

const getTimeOfDayLabel = (date: Date) => {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return "Morning";
  }

  if (hour >= 12 && hour < 17) {
    return "Afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "Evening";
  }

  return "Night";
};

const formatClockTime = (date: Date) =>
  date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

const getTimeOfDaySnapshot = (date: Date) => ({
  label: getTimeOfDayLabel(date),
  clockTime: formatClockTime(date),
});

const formatVideoTimestamp = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  const minutesLabel =
    hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const secondsLabel = String(remainingSeconds).padStart(2, "0");

  return hours > 0
    ? `${hours}:${minutesLabel}:${secondsLabel}`
    : `${minutesLabel}:${secondsLabel}`;
};

export default function PlaybackDashboard() {
  const microphoneSensor = useMicrophoneSensor();
  const cameraSensor = useCameraSensor();
  const locationSensor = useLocationSensor();
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const soundLevelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [timeOfDay, setTimeOfDay] = useState(() =>
    getTimeOfDaySnapshot(new Date()),
  );
  const [isTransportPlaying, setIsTransportPlaying] = useState(true);
  const [weatherStatus, setWeatherStatus] = useState<AsyncStatus>("idle");
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast | null>(
    null,
  );
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [, setYoutubePlayerStatus] = useState<YouTubePlayerStatus>("idle");
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [youtubePlaybackMode, setYoutubePlaybackMode] = useState<"cue" | "load">(
    "cue",
  );
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [currentVideoDuration, setCurrentVideoDuration] = useState(0);

  const [llmStatus, setLlmStatus] = useState<AsyncStatus>("idle");
  const [llmError, setLlmError] = useState<string | null>(null);
  const [playlistQueue, setPlaylistQueue] = useState<PlaylistQueueItem[]>([]);
  const [queueStatus, setQueueStatus] = useState<AsyncStatus>("idle");
  const queueLoadedRef = useRef(false);
  const playIntentRef = useRef<number | null>(null);
  const initialSeedTriggeredRef = useRef(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    geminiApiKey: "",
    youtubeApiKey: "",
    llmModel: defaultLlmModel,
  });
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localStorageReady, setLocalStorageReady] = useState(false);
  const [serverConfigReady, setServerConfigReady] = useState(false);
  const [serverKeyStatus, setServerKeyStatus] = useState<{
    gemini: boolean;
    youtube: boolean;
  } | null>(null);
  const [smoothedSoundHistory, setSmoothedSoundHistory] = useState<
    Array<{ timestamp: number; value: number }>
  >([]);
  const [userProfile, setUserProfile] = useState<LlmUserProfile | null>(null);
  const hasRequiredKeys = useMemo(
    () => Boolean(apiKeys.geminiApiKey || serverKeyStatus?.gemini),
    [apiKeys.geminiApiKey, serverKeyStatus?.gemini],
  );

  useEffect(() => {
    const updateTimeOfDay = () => {
      setTimeOfDay(getTimeOfDaySnapshot(new Date()));
    };

    updateTimeOfDay();

    const intervalId = window.setInterval(updateTimeOfDay, 5 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setCurrentVideoTime(0);
    setCurrentVideoDuration(0);
  }, [youtubeVideoId]);

  useEffect(() => {
    try {
      const storedKeys = window.localStorage.getItem(apiKeysStorageKey);
      if (storedKeys) {
        const parsed = JSON.parse(storedKeys) as Partial<ApiKeys>;
        if (parsed && typeof parsed === "object") {
          setApiKeys({
            geminiApiKey:
              typeof parsed.geminiApiKey === "string" ? parsed.geminiApiKey : "",
            youtubeApiKey:
              typeof parsed.youtubeApiKey === "string"
                ? parsed.youtubeApiKey
                : "",
            llmModel:
              typeof parsed.llmModel === "string" && parsed.llmModel.trim()
                ? parsed.llmModel
                : defaultLlmModel,
          });
        }
      }
      setOnboardingComplete(
        window.localStorage.getItem(onboardingStorageKey) === "true",
      );
    } catch {
      setOnboardingComplete(false);
    } finally {
      setLocalStorageReady(true);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/config", { signal: controller.signal })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("Failed")),
      )
      .then((data: { hasGeminiKey?: boolean; hasYouTubeKey?: boolean }) => {
        setServerKeyStatus({
          gemini: Boolean(data.hasGeminiKey),
          youtube: Boolean(data.hasYouTubeKey),
        });
      })
      .catch(() => {
        setServerKeyStatus({ gemini: false, youtube: false });
      })
      .finally(() => {
        setServerConfigReady(true);
      });
    return () => controller.abort();
  }, []);

  const locationSignal = getLocationSignal(
    locationSensor.status,
    locationSensor.coords,
  );

  useEffect(() => {
    if (locationSensor.status !== "active" || !locationSensor.coords) {
      setWeatherStatus("idle");
      setWeatherForecast(null);
      setWeatherError(null);
      return;
    }

    const controller = new AbortController();
    setWeatherStatus("loading");
    setWeatherError(null);

    fetchWeatherForecast(
      {
        latitude: locationSensor.coords.latitude,
        longitude: locationSensor.coords.longitude,
      },
      { signal: controller.signal },
    )
      .then((data) => {
        setWeatherForecast(data);
        setWeatherStatus("ready");
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }
        setWeatherForecast(null);
        setWeatherStatus("error");
        setWeatherError(
          error instanceof Error ? error.message : "Weather lookup failed.",
        );
      });

    return () => controller.abort();
  }, [
    locationSensor.coords,
    locationSensor.status,
    locationSensor.coords?.latitude,
    locationSensor.coords?.longitude,
  ]);

  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let rafId = 0;
    const buffer =
      microphoneSensor.waveformSize > 0
        ? new Uint8Array(microphoneSensor.waveformSize)
        : null;

    const draw = () => {
      rafId = window.requestAnimationFrame(draw);

      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
      const nextHeight = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);

      context.lineWidth = 2;
      context.strokeStyle =
        microphoneSensor.status === "active"
          ? "rgba(15, 23, 42, 0.9)"
          : "rgba(148, 163, 184, 0.6)";

      if (
        microphoneSensor.status !== "active" ||
        !buffer ||
        !microphoneSensor.getWaveformData(buffer)
      ) {
        context.beginPath();
        context.moveTo(0, rect.height / 2);
        context.lineTo(rect.width, rect.height / 2);
        context.stroke();
        return;
      }

      const sampleCount = Math.min(240, buffer.length);
      const step = buffer.length / sampleCount;

      context.beginPath();
      for (let i = 0; i < sampleCount; i += 1) {
        const value = buffer[Math.floor(i * step)];
        const normalized = (value - 128) / 128;
        const x = (i / (sampleCount - 1)) * rect.width;
        const y = (1 - normalized) * 0.5 * rect.height;
        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();
    };

    draw();

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [
    microphoneSensor,
    microphoneSensor.getWaveformData,
    microphoneSensor.status,
    microphoneSensor.waveformSize,
  ]);

  useEffect(() => {
    if (
      microphoneSensor.status !== "active" ||
      microphoneSensor.smoothedRms === null
    ) {
      setSmoothedSoundHistory([]);
      return;
    }

    setSmoothedSoundHistory((prev) => {
      const now = Date.now();
      const cutoff = now - 30_000;
      const next = [
        ...prev.filter((point) => point.timestamp >= cutoff),
        { timestamp: now, value: microphoneSensor.smoothedRms ?? 0 },
      ];
      return next;
    });
  }, [microphoneSensor.smoothedRms, microphoneSensor.status]);

  useEffect(() => {
    const canvas = soundLevelCanvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
    const nextHeight = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);

    context.lineWidth = 2;
    context.strokeStyle =
      microphoneSensor.status === "active"
        ? "rgba(15, 23, 42, 0.8)"
        : "rgba(148, 163, 184, 0.6)";

    context.fillStyle = "rgba(148, 163, 184, 0.15)";

    if (!smoothedSoundHistory.length) {
      context.beginPath();
      context.moveTo(0, rect.height * 0.7);
      context.lineTo(rect.width, rect.height * 0.7);
      context.stroke();
      return;
    }

    const maxValue = Math.max(
      0.08,
      ...smoothedSoundHistory.map((point) => point.value),
    );
    const startTime = Date.now() - 30_000;

    context.beginPath();
    smoothedSoundHistory.forEach((point, index) => {
      const timeProgress = (point.timestamp - startTime) / 30_000;
      const x = Math.max(0, Math.min(1, timeProgress)) * rect.width;
      const y = rect.height - (point.value / maxValue) * rect.height;
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.stroke();

    context.lineTo(rect.width, rect.height);
    context.lineTo(0, rect.height);
    context.closePath();
    context.fill();
  }, [microphoneSensor.status, smoothedSoundHistory]);

  useEffect(() => {
    if (queueLoadedRef.current) {
      return;
    }

    try {
      const stored = window.localStorage.getItem(playlistQueueStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as PlaylistQueueItem[];
        if (Array.isArray(parsed)) {
          setPlaylistQueue(parsed);
        }
      }
      setQueueStatus("ready");
    } catch {
      setQueueStatus("error");
    } finally {
      queueLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!queueLoadedRef.current) {
      return;
    }

    try {
      window.localStorage.setItem(
        playlistQueueStorageKey,
        JSON.stringify(playlistQueue),
      );
      setQueueStatus("ready");
    } catch {
      setQueueStatus("error");
    }
  }, [playlistQueue]);

  useEffect(() => {
    if (!queueLoadedRef.current) {
      return;
    }

    if (youtubeVideoId || playlistQueue.length === 0) {
      return;
    }

    const firstItem = playlistQueue[0];
    if (!firstItem) {
      return;
    }

    setYoutubePlaybackMode("cue");
    setYoutubeVideoId(firstItem.videoId);
  }, [playlistQueue, youtubeVideoId]);

  const ambientNoiseValue = getAmbientNoiseValue(
    microphoneSensor.status,
    microphoneSensor.noiseLevel,
  );

  const ambientTempoValue = getAmbientTempoValue(
    microphoneSensor.status,
    microphoneSensor.bpm,
  );

  const weatherSignal = formatWeatherSignal(weatherForecast);

  const lightingValue = getLightingValue(
    cameraSensor.status,
    cameraSensor.lightLevel,
  );

  const colorToneValue = getColorToneValue(
    cameraSensor.status,
    cameraSensor.colorTemperature,
    cameraSensor.colorTone,
  );

  const moodValue = getMoodValue(cameraSensor.status, cameraSensor.mood);

  const currentQueueIndex = playlistQueue.findIndex(
    (item) => item.videoId === youtubeVideoId,
  );

  const pastTracks = useMemo(
    () =>
      playlistQueue.map((item) => ({
        name: item.title,
      })),
    [playlistQueue],
  );

  const llmSignals: LlmSignalInputs = useMemo(
    () => ({
      context: {
        time: {
          period: timeOfDay.label,
          localTime: timeOfDay.clockTime,
        },
        location: {
          display: locationSignal,
          coordinates:
            locationSensor.status === "active" && locationSensor.coords
              ? {
                  latitude: locationSensor.coords.latitude,
                  longitude: locationSensor.coords.longitude,
                  accuracyMeters: locationSensor.coords.accuracy,
                }
              : null,
        },
        weather: weatherSignal,
      },
      environment: {
        ambience: {
          noiseLevel:
            microphoneSensor.status === "active"
              ? microphoneSensor.noiseLevel
              : "Unknown",
          tempoBpm:
            microphoneSensor.status === "active" ? microphoneSensor.bpm : null,
          descriptor:
            microphoneSensor.status === "active"
              ? microphoneSensor.descriptor
              : "Unknown ambience",
        },
        visuals: {
          lighting:
            cameraSensor.status === "active"
              ? cameraSensor.lightLevel
              : "Unknown",
          colorTone:
            cameraSensor.status === "active" ? cameraSensor.colorTone : "Unknown",
          colorTemperature:
            cameraSensor.status === "active"
              ? cameraSensor.colorTemperature
              : "Unknown",
          sceneMood:
            cameraSensor.status === "active" ? cameraSensor.mood : "Unknown",
        },
      },
      playlist: {
        pastTracks,
      },
    }),
    [
      cameraSensor.colorTemperature,
      cameraSensor.colorTone,
      cameraSensor.lightLevel,
      cameraSensor.mood,
      cameraSensor.status,
      locationSensor.coords,
      locationSensor.status,
      locationSignal,
      microphoneSensor.bpm,
      microphoneSensor.descriptor,
      microphoneSensor.noiseLevel,
      microphoneSensor.status,
      pastTracks,
      timeOfDay.clockTime,
      timeOfDay.label,
      weatherSignal,
    ],
  );

  const queueHasItems = playlistQueue.length > 0;
  const currentQueueItem =
    currentQueueIndex >= 0 ? playlistQueue[currentQueueIndex] : null;
  const queuePosition = queueHasItems
    ? {
        index: Math.max(1, currentQueueIndex + 1),
        total: playlistQueue.length,
        title: currentQueueItem?.title,
        inQueue: currentQueueIndex >= 0,
      }
    : undefined;
  const hasLoopableQueue = playlistQueue.length > 1;
  const canQueuePrevious = hasLoopableQueue;
  const canQueueNext = hasLoopableQueue;
  const currentTrackRationale =
    isTransportPlaying && currentQueueItem?.llmRationale
      ? currentQueueItem.llmRationale
      : null;

  const handleQueuePrevious = useCallback(() => {
    if (!queueHasItems || !hasLoopableQueue) {
      return;
    }

    const previousIndex =
      currentQueueIndex <= 0
        ? playlistQueue.length - 1
        : currentQueueIndex - 1;
    const target = playlistQueue[previousIndex];
    if (!target) {
      return;
    }

    playIntentRef.current = Date.now();
    setYoutubePlaybackMode("load");
    setYoutubeVideoId(target.videoId);
  }, [currentQueueIndex, hasLoopableQueue, playlistQueue, queueHasItems]);

  const handleQueueNext = useCallback((indexOverride?: number) => {
    if (!queueHasItems || !hasLoopableQueue) {
      return;
    }

    const baseIndex =
      typeof indexOverride === "number" ? indexOverride : currentQueueIndex;
    const nextIndex =
      baseIndex < 0 ? 0 : (baseIndex + 1) % playlistQueue.length;
    const target = playlistQueue[nextIndex];
    console.debug("[PlaybackDashboard] queue next", {
      baseIndex,
      nextIndex,
      targetVideoId: target?.videoId,
      queueSize: playlistQueue.length,
    });
    if (!target) {
      return;
    }

    playIntentRef.current = Date.now();
    setYoutubePlaybackMode("load");
    setYoutubeVideoId(target.videoId);
  }, [currentQueueIndex, hasLoopableQueue, playlistQueue, queueHasItems]);

  const handleQueueSelect = useCallback((index: number) => {
    const target = playlistQueue[index];
    if (!target) {
      return;
    }

    playIntentRef.current = Date.now();
    setIsTransportPlaying(true);
    setYoutubePlaybackMode("load");
    setYoutubeVideoId(target.videoId);
  }, [playlistQueue]);

  const handlePlayerStateChange = useCallback((
    state: YouTubePlayerState,
    endedVideoId?: string,
  ) => {
    console.debug("[PlaybackDashboard] player state", {
      state,
      endedVideoId,
      currentQueueIndex,
      currentVideoId: youtubeVideoId,
    });
    if (state === "playing") {
      setIsTransportPlaying(true);
      playIntentRef.current = null;
      return;
    }

    if (state === "ended") {
      playIntentRef.current = null;
      const endedIndex =
        endedVideoId
          ? playlistQueue.findIndex((item) => item.videoId === endedVideoId)
          : currentQueueIndex;
      const canAdvance =
        queueHasItems &&
        (endedIndex === -1 || endedIndex < playlistQueue.length - 1);
      if (canAdvance) {
        setIsTransportPlaying(true);
        handleQueueNext(endedIndex);
        return;
      }
      const isLastItem =
        queueHasItems &&
        endedIndex === playlistQueue.length - 1 &&
        endedIndex >= 0;
      const llmUnavailable = llmStatus === "error" || !hasRequiredKeys;
      if (isLastItem && llmUnavailable) {
        const firstItem = playlistQueue[0];
        if (!firstItem) {
          setIsTransportPlaying(false);
          return;
        }
        playIntentRef.current = Date.now();
        setIsTransportPlaying(true);
        setYoutubePlaybackMode("load");
        setYoutubeVideoId(firstItem.videoId);
        return;
      }
      setIsTransportPlaying(false);
      return;
    }

    if (state === "paused") {
      if (
        playIntentRef.current &&
        Date.now() - playIntentRef.current < 2000
      ) {
        return;
      }
      setIsTransportPlaying(false);
    }
  }, [
    currentQueueIndex,
    handleQueueNext,
    hasRequiredKeys,
    llmStatus,
    playlistQueue,
    queueHasItems,
    youtubeVideoId,
  ]);

  const handleQueueClear = useCallback(() => {
    setPlaylistQueue([]);
  }, []);

  const handleQueueRemove = useCallback((index: number) => {
    setPlaylistQueue((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  }, []);

  const handleLlmEvaluation = useCallback(async () => {
    if (!hasRequiredKeys || !onboardingComplete) {
      setLlmStatus("error");
      setLlmError("Add your API keys in onboarding to run recommendations.");
      return;
    }

    setLlmStatus("loading");
    setLlmError(null);

    try {
      const params = await evaluateYouTubeParams(llmSignals, userProfile, {
        apiKey: apiKeys.geminiApiKey || undefined,
        model: apiKeys.llmModel,
      });
      const cappedMaxResults =
        typeof params.maxResults === "number"
          ? Math.min(params.maxResults, 100)
          : undefined;
      setLlmStatus("ready");
      const data = await searchYouTubeVideos(params.query, {
        maxResults: cappedMaxResults,
        apiKey: apiKeys.youtubeApiKey || undefined,
      });

      if (data.videos.length) {
        setPlaylistQueue((prev) => {
          const existingIds = new Set(prev.map((item) => item.videoId));
          const additions = data.videos
            .filter((video) => !existingIds.has(video.videoId))
            .map((video) => ({
              videoId: video.videoId,
              title: video.title ?? "Untitled",
              channelTitle: video.channelTitle ?? "Unknown channel",
              addedAt: new Date().toISOString(),
              source: "LLM demo",
              query: params.query,
              llmRationale: params.rationale || undefined,
            }));
          return [...prev, ...additions];
        });
      } else {
        setLlmError("No videos returned for the LLM query.");
        setLlmStatus("error");
      }
    } catch (error) {
      setLlmError(error instanceof Error ? error.message : "LLM evaluation failed.");
      setLlmStatus("error");
    }
  }, [
    apiKeys.geminiApiKey,
    apiKeys.llmModel,
    apiKeys.youtubeApiKey,
    hasRequiredKeys,
    llmSignals,
    onboardingComplete,
    userProfile,
  ]);

  useEffect(() => {
    if (initialSeedTriggeredRef.current) {
      return;
    }

    if (!localStorageReady || !serverConfigReady) {
      return;
    }

    if (!queueLoadedRef.current) {
      return;
    }

    if (!onboardingComplete || !hasRequiredKeys) {
      return;
    }

    if (playlistQueue.length > 0) {
      initialSeedTriggeredRef.current = true;
      return;
    }

    if (llmStatus === "loading") {
      return;
    }

    initialSeedTriggeredRef.current = true;
    handleLlmEvaluation();
  }, [
    handleLlmEvaluation,
    hasRequiredKeys,
    llmStatus,
    localStorageReady,
    onboardingComplete,
    playlistQueue.length,
    serverConfigReady,
  ]);

  const remainingQueueCount = queueHasItems
    ? currentQueueIndex >= 0
      ? playlistQueue.length - currentQueueIndex
      : playlistQueue.length
    : 0;
  const lastQueueItem = queueHasItems
    ? playlistQueue[playlistQueue.length - 1]
    : null;
  const autoRunRef = useRef<string | null>(null);
  const canAutoRunEvaluation =
    currentVideoDuration > 0 && currentVideoTime / currentVideoDuration >= 0.5;

  useEffect(() => {
    if (!queueHasItems || !hasRequiredKeys || !onboardingComplete) {
      autoRunRef.current = null;
      return;
    }

    if (remainingQueueCount !== 1) {
      autoRunRef.current = null;
      return;
    }

    const lastItemId = lastQueueItem?.videoId;
    if (!lastItemId || llmStatus === "loading") {
      return;
    }

    if (youtubeVideoId !== lastItemId || !canAutoRunEvaluation) {
      return;
    }

    if (autoRunRef.current === lastItemId) {
      return;
    }

    autoRunRef.current = lastItemId;
    handleLlmEvaluation();
  }, [
    canAutoRunEvaluation,
    handleLlmEvaluation,
    hasRequiredKeys,
    lastQueueItem?.videoId,
    llmStatus,
    onboardingComplete,
    queueHasItems,
    remainingQueueCount,
    youtubeVideoId,
  ]);

  const showOnboarding =
    (localStorageReady &&
      serverConfigReady &&
      (!onboardingComplete || !hasRequiredKeys)) ||
    settingsOpen;

  const handleOnboardingComplete = useCallback((payload: {
    geminiApiKey: string;
    llmModel: string;
    rememberKeys: boolean;
  }) => {
    const nextKeys = {
      ...apiKeys,
      geminiApiKey: payload.geminiApiKey,
      llmModel: payload.llmModel.trim() || defaultLlmModel,
    };
    setApiKeys(nextKeys);
    setOnboardingComplete(true);

    try {
      if (payload.rememberKeys) {
        window.localStorage.setItem(apiKeysStorageKey, JSON.stringify(nextKeys));
      } else {
        window.localStorage.removeItem(apiKeysStorageKey);
      }
      window.localStorage.setItem(onboardingStorageKey, "true");
    } catch {
      // Ignore storage errors (private mode, quota, etc).
    }

    setSettingsOpen(false);
  }, [apiKeys]);

  return (
    <div className="min-h-screen text-[color:var(--mix-ink)]">
      <OnboardingModal
        open={showOnboarding}
        initialGeminiApiKey={apiKeys.geminiApiKey}
        initialLlmModel={apiKeys.llmModel}
        serverKeyStatus={serverKeyStatus}
        microphoneStatus={microphoneSensor.status}
        locationStatus={locationSensor.status}
        cameraStatus={cameraSensor.status}
        onRequestMicrophone={() => void microphoneSensor.requestAccess()}
        onRequestLocation={() => void locationSensor.requestAccess()}
        onRequestCamera={() => void cameraSensor.requestAccess()}
        onClose={() => setSettingsOpen(false)}
        onComplete={handleOnboardingComplete}
      />
      <PlaybackDashboardHeader
        isTransportPlaying={isTransportPlaying}
        onToggleTransport={() => setIsTransportPlaying((prev) => !prev)}
        onOpenSettings={() => setSettingsOpen(true)}
        currentTrackTitle={currentQueueItem?.title}
        currentTimestamp={formatVideoTimestamp(currentVideoTime)}
        onPrevious={handleQueuePrevious}
        onNext={handleQueueNext}
        previousDisabled={!canQueuePrevious}
        nextDisabled={!canQueueNext}
      />
      <div className="px-4 py-4">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6 lg:col-start-0 lg:row-span-2">
            <PlaylistQueueList
              items={playlistQueue}
              status={queueStatus}
              onClear={handleQueueClear}
              onRemove={handleQueueRemove}
              onSelect={handleQueueSelect}
              onRunNext={handleLlmEvaluation}
              runNextDisabled={llmStatus === "loading"}
              currentVideoId={youtubeVideoId ?? undefined}
              queuePosition={queuePosition}
              llmStatus={llmStatus}
              llmError={llmError}
            />
          </div>

          <div className="space-y-6 lg:col-span-6 lg:col-start-7 lg:row-span-2">
            <YouTubePlayer
              videoId={youtubeVideoId ?? undefined}
              playbackMode={youtubePlaybackMode}
              onStatusChange={setYoutubePlayerStatus}
              onStateChange={handlePlayerStateChange}
              onTimeUpdate={setCurrentVideoTime}
              onDurationUpdate={setCurrentVideoDuration}
              isTransportPlaying={isTransportPlaying}
              llmDescription={currentTrackRationale}
            />
          </div>

          <section className="mixer-tile p-6 lg:col-span-3 lg:col-start-1">
            <MicrophoneContextWidget
              status={microphoneSensor.status}
              error={microphoneSensor.error}
              ambientNoiseValue={ambientNoiseValue}
              ambientTempoValue={ambientTempoValue}
              onRequestAccess={microphoneSensor.requestAccess}
              onStop={microphoneSensor.stop}
              waveformRef={waveformCanvasRef}
              soundLevelRef={soundLevelCanvasRef}
            />
          </section>

          <section className="mixer-tile space-y-6 p-6 lg:col-span-3 lg:col-start-4">
            <LocationContextWidget
              status={locationSensor.status}
              error={locationSensor.error}
              weatherError={weatherError}
              onRequestAccess={locationSensor.requestAccess}
              onStop={locationSensor.stop}
            />
            <WeatherForecastWidget
              status={weatherStatus}
              locationStatus={locationSensor.status}
              locationCoords={locationSensor.coords}
              forecast={weatherForecast}
              errorMessage={weatherError}
            />
          </section>

          <section className="mixer-tile p-6 lg:col-span-3 lg:col-start-7">
            <CameraContextWidget
              status={cameraSensor.status}
              error={cameraSensor.error}
              averageColor={cameraSensor.averageColor}
              lightingValue={lightingValue}
              colorToneValue={colorToneValue}
              moodValue={moodValue}
              onRequestAccess={cameraSensor.requestAccess}
              onStop={cameraSensor.stop}
            />
          </section>

          <section className="mixer-tile p-6 lg:col-span-3 lg:col-start-10">
            <AnalogClockWidget />
          </section>

          <div className="lg:col-span-12 lg:col-start-1">
            <UserPreferencesPanel onProfileChange={setUserProfile} />
          </div>
        </div>
      </div>
    </div>
  );
}
