"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type MicrophoneStatus = "idle" | "requesting" | "active" | "denied" | "error";
type NoiseLevel = "Quiet" | "Moderate" | "Loud" | "Unknown";

type MicrophoneSensorState = {
  status: MicrophoneStatus;
  noiseLevel: NoiseLevel;
  descriptor: string;
  rms: number | null;
  smoothedRms: number | null;
  bpm: number | null;
  waveformSize: number;
  error: string | null;
  requestAccess: () => Promise<void>;
  stop: () => void;
  getWaveformData: (target: Uint8Array) => boolean;
};

const RMS_SAMPLE_SIZE = 2048;
const UPDATE_INTERVAL_MS = 500;
const NOISE_SMOOTHING_FACTOR = 0.2;
const BPM_HISTORY_SIZE = 8;
const BPM_MIN_PEAKS = 4;
const BPM_MIN_INTERVAL_MS = 300;
const BPM_MAX_INTERVAL_MS = 2000;
const BPM_THRESHOLD_FLOOR = 0.02;
const BPM_ENVELOPE_WINDOW = 120;
const BPM_UPDATE_INTERVAL_MS = 600;
const BPM_ENVELOPE_SMOOTHING = 0.5;

const classifyNoise = (rms: number): NoiseLevel => {
  if (rms < 0.03) {
    return "Quiet";
  }
  if (rms < 0.08) {
    return "Moderate";
  }
  return "Loud";
};

const descriptorForLevel = (level: NoiseLevel): string => {
  switch (level) {
    case "Quiet":
      return "Quiet room";
    case "Moderate":
      return "Moderate ambience";
    case "Loud":
      return "Noisy environment";
    default:
      return "Unknown ambience";
  }
};

export const useMicrophoneSensor = (): MicrophoneSensorState => {
  const [status, setStatus] = useState<MicrophoneStatus>("idle");
  const [noiseLevel, setNoiseLevel] = useState<NoiseLevel>("Unknown");
  const [descriptor, setDescriptor] = useState("Unknown ambience");
  const [rms, setRms] = useState<number | null>(null);
  const [smoothedRms, setSmoothedRms] = useState<number | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);
  const [waveformSize, setWaveformSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const lastLevelRef = useRef<NoiseLevel>("Unknown");
  const smoothedRmsRef = useRef<number | null>(null);
  const bpmEnvelopeRef = useRef<number | null>(null);
  const envelopeHistoryRef = useRef<number[]>([]);
  const lastSmoothedRef = useRef<number | null>(null);
  const lastTrendRef = useRef<"rising" | "falling">("falling");
  const lastPeakTimeRef = useRef<number | null>(null);
  const peakTimesRef = useRef<number[]>([]);
  const lastBpmUpdateRef = useRef<number>(0);

  const stop = useCallback(() => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataRef.current = null;
    setWaveformSize(0);
    smoothedRmsRef.current = null;
    setSmoothedRms(null);
    setBpm(null);
    bpmEnvelopeRef.current = null;
    envelopeHistoryRef.current = [];
    lastSmoothedRef.current = null;
    lastPeakTimeRef.current = null;
    peakTimesRef.current = [];
    lastBpmUpdateRef.current = 0;

    setStatus((prev) => (prev === "active" ? "idle" : prev));
  }, []);

  const updateBpmEstimate = useCallback((inputLevel: number) => {
    const previousEnvelope = bpmEnvelopeRef.current ?? inputLevel;
    const nextEnvelope =
      previousEnvelope +
      BPM_ENVELOPE_SMOOTHING * (inputLevel - previousEnvelope);
    bpmEnvelopeRef.current = nextEnvelope;

    const history = envelopeHistoryRef.current;
    history.push(nextEnvelope);
    if (history.length > BPM_ENVELOPE_WINDOW) {
      history.shift();
    }

    let mean = 0;
    let variance = 0;
    if (history.length) {
      for (const value of history) {
        mean += value;
      }
      mean /= history.length;
      for (const value of history) {
        const delta = value - mean;
        variance += delta * delta;
      }
      variance /= history.length;
    }

    const threshold = Math.max(
      BPM_THRESHOLD_FLOOR,
      mean + Math.sqrt(variance) * 0.6,
    );

    const previous = lastSmoothedRef.current;
    if (previous !== null) {
      const isRising = nextEnvelope > previous;
      const wasRising = lastTrendRef.current === "rising";
      const now = Date.now();

      if (wasRising && !isRising && previous >= threshold) {
        const lastPeak = lastPeakTimeRef.current;
        if (!lastPeak || now - lastPeak >= BPM_MIN_INTERVAL_MS) {
          if (!lastPeak || now - lastPeak <= BPM_MAX_INTERVAL_MS) {
            peakTimesRef.current.push(now);
            if (peakTimesRef.current.length > BPM_HISTORY_SIZE) {
              peakTimesRef.current.shift();
            }
          } else {
            peakTimesRef.current = [now];
          }
          lastPeakTimeRef.current = now;
        }
      }

      lastTrendRef.current = isRising ? "rising" : "falling";
    }

    lastSmoothedRef.current = nextEnvelope;

    if (
      peakTimesRef.current.length >= BPM_MIN_PEAKS &&
      Date.now() - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS
    ) {
      const intervals = [];
      for (let i = 1; i < peakTimesRef.current.length; i += 1) {
        const delta = peakTimesRef.current[i] - peakTimesRef.current[i - 1];
        if (delta >= BPM_MIN_INTERVAL_MS && delta <= BPM_MAX_INTERVAL_MS) {
          intervals.push(delta);
        }
      }

      if (intervals.length) {
        const avgInterval =
          intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
        const nextBpm = Math.round(60000 / avgInterval);
        setBpm(nextBpm);
      } else {
        setBpm(null);
      }
      lastBpmUpdateRef.current = Date.now();
    }

    if (
      lastPeakTimeRef.current &&
      Date.now() - lastPeakTimeRef.current > BPM_MAX_INTERVAL_MS * 2
    ) {
      setBpm(null);
    }
  }, []);

  const sample = useCallback(() => {
    const analyser = analyserRef.current;
    const data = dataRef.current;

    if (!analyser || !data) {
      return;
    }

    analyser.getByteTimeDomainData(data);
    let sumSquares = 0;
    for (let i = 0; i < data.length; i += 1) {
      const normalized = (data[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }

    const rmsValue = Math.sqrt(sumSquares / data.length);
    const previousSmoothed =
      smoothedRmsRef.current === null ? rmsValue : smoothedRmsRef.current;
    const nextSmoothed =
      previousSmoothed +
      NOISE_SMOOTHING_FACTOR * (rmsValue - previousSmoothed);
    smoothedRmsRef.current = nextSmoothed;
    updateBpmEstimate(rmsValue);

    const nextLevel = classifyNoise(nextSmoothed);
    const now = Date.now();

    if (
      now - lastUpdateRef.current >= UPDATE_INTERVAL_MS ||
      nextLevel !== lastLevelRef.current
    ) {
      lastUpdateRef.current = now;
      lastLevelRef.current = nextLevel;
      setRms(rmsValue);
      setSmoothedRms(nextSmoothed);
      setNoiseLevel(nextLevel);
      setDescriptor(descriptorForLevel(nextLevel));
    }

    rafRef.current = window.requestAnimationFrame(sample);
  }, [updateBpmEstimate]);

  const requestAccess = useCallback(async () => {
    if (status === "requesting" || status === "active") {
      return;
    }

    setStatus("requesting");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = RMS_SAMPLE_SIZE;

      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = context;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.fftSize);
      setWaveformSize(analyser.fftSize);

      setStatus("active");
      lastUpdateRef.current = 0;
      lastLevelRef.current = "Unknown";
      smoothedRmsRef.current = null;
      setSmoothedRms(null);
      setBpm(null);
      bpmEnvelopeRef.current = null;
      envelopeHistoryRef.current = [];
      lastSmoothedRef.current = null;
      lastPeakTimeRef.current = null;
      peakTimesRef.current = [];
      lastBpmUpdateRef.current = 0;
      rafRef.current = window.requestAnimationFrame(sample);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Microphone access failed.";
      setError(message);
      setStatus(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "denied"
          : "error",
      );
      stop();
    }
  }, [sample, status, stop]);

  useEffect(() => stop, [stop]);

  const getWaveformData = useCallback((target: Uint8Array) => {
    const analyser = analyserRef.current;
    if (!analyser || target.length < analyser.fftSize) {
      return false;
    }
    analyser.getByteTimeDomainData(target);
    return true;
  }, []);

  return {
    status,
    noiseLevel,
    descriptor,
    rms,
    smoothedRms,
    bpm,
    waveformSize,
    error,
    requestAccess,
    stop,
    getWaveformData,
  };
};
