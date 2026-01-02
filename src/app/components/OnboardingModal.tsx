"use client";

import { useEffect, useMemo, useState } from "react";

type ServerKeyStatus = {
  gemini: boolean;
  youtube: boolean;
};

type PermissionStatus =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "error"
  | "unsupported";

type OnboardingModalProps = {
  open: boolean;
  initialGeminiApiKey: string;
  initialLlmModel: string;
  serverKeyStatus: ServerKeyStatus | null;
  microphoneStatus: PermissionStatus;
  locationStatus: PermissionStatus;
  cameraStatus: PermissionStatus;
  onRequestMicrophone: () => void;
  onRequestLocation: () => void;
  onRequestCamera: () => void;
  onClose?: () => void;
  onComplete: (payload: {
    geminiApiKey: string;
    llmModel: string;
    rememberKeys: boolean;
  }) => void;
};

const formatStatusLabel = (status: PermissionStatus) => {
  switch (status) {
    case "active":
      return "Granted";
    case "requesting":
      return "Requesting";
    case "denied":
      return "Denied";
    case "error":
      return "Error";
    case "unsupported":
      return "Unsupported";
    default:
      return "Not yet";
  }
};

const statusTone = (status: PermissionStatus) => {
  switch (status) {
    case "active":
      return "bg-[color:var(--mix-success)]/20 text-[color:var(--mix-success)]";
    case "denied":
    case "error":
      return "bg-[color:var(--mix-danger)]/20 text-[color:var(--mix-danger)]";
    case "unsupported":
      return "bg-white/5 text-[color:var(--mix-ink-soft)]";
    default:
      return "bg-white/5 text-[color:var(--mix-ink-soft)]";
  }
};

export default function OnboardingModal({
  open,
  initialGeminiApiKey,
  initialLlmModel,
  serverKeyStatus,
  microphoneStatus,
  locationStatus,
  cameraStatus,
  onRequestMicrophone,
  onRequestLocation,
  onRequestCamera,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const [geminiKey, setGeminiKey] = useState(initialGeminiApiKey);
  const [llmModel, setLlmModel] = useState(initialLlmModel);
  const [rememberKeys, setRememberKeys] = useState(true);
  const [showPermissionWarning, setShowPermissionWarning] = useState(false);
  const [showKeyError, setShowKeyError] = useState(false);

  const trimmedGeminiKey = geminiKey.trim();
  const trimmedLlmModel = llmModel.trim();

  const requiresGeminiKey = !serverKeyStatus?.gemini;

  const missingRequiredKeys = requiresGeminiKey && !trimmedGeminiKey;

  const allPermissionsGranted =
    microphoneStatus === "active" &&
    locationStatus === "active" &&
    cameraStatus === "active";

  const permissionItems = useMemo(
    () => [
      {
        id: "microphone",
        label: "Microphone access",
        description: "Analyze ambient sound and tempo.",
        status: microphoneStatus,
        onRequest: onRequestMicrophone,
      },
      {
        id: "location",
        label: "Location access",
        description: "Tune to local weather and time.",
        status: locationStatus,
        onRequest: onRequestLocation,
      },
      {
        id: "camera",
        label: "Camera access",
        description: "Capture lighting and scene mood.",
        status: cameraStatus,
        onRequest: onRequestCamera,
      },
    ],
    [
      cameraStatus,
      locationStatus,
      microphoneStatus,
      onRequestCamera,
      onRequestLocation,
      onRequestMicrophone,
    ],
  );

  useEffect(() => {
    setGeminiKey(initialGeminiApiKey);
  }, [initialGeminiApiKey]);

  useEffect(() => {
    setLlmModel(initialLlmModel);
  }, [initialLlmModel]);

  useEffect(() => {
    if (allPermissionsGranted) {
      setShowPermissionWarning(false);
    }
  }, [allPermissionsGranted]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const handleContinue = () => {
    if (missingRequiredKeys) {
      setShowKeyError(true);
      return;
    }

    if (!allPermissionsGranted && !showPermissionWarning) {
      setShowPermissionWarning(true);
      return;
    }

    onComplete({
      geminiApiKey: trimmedGeminiKey,
      llmModel: trimmedLlmModel,
      rememberKeys,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="mixer-surface w-full max-w-2xl border border-white/5 p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--mix-ink-soft)]">
            Spotmusic setup
          </p>
          <h2 className="text-2xl font-semibold">Before we mix your soundtrack</h2>
          <p className="text-sm text-[color:var(--mix-ink-soft)]">
            Spotmusic blends your environment into a living playlist, matching
            mood, location, and tempo in real time. Provide the Google AI key
            and permissions so the app can personalize playback. Keys stay in
            your browser unless you choose to remember them.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <section className="mixer-card space-y-4 p-4">
            <div>
              <h3 className="text-base font-semibold">API key</h3>
              <p className="text-xs text-[color:var(--mix-ink-soft)]">
                Google AI is required unless the server already has it
                configured.
              </p>
            </div>
            <div className="space-y-3">
              <label className="block space-y-1 text-sm">
                <span>Google AI API key</span>
                {serverKeyStatus?.gemini ? (
                  <span className="ml-2 text-xs text-[color:var(--mix-success)]">
                    Server default detected
                  </span>
                ) : null}
                <input
                  value={geminiKey}
                  onChange={(event) => {
                    setGeminiKey(event.target.value);
                    setShowKeyError(false);
                  }}
                  placeholder="AIza..."
                  className="w-full rounded-xl border border-white/10 bg-[#242a3a] px-3 py-2 text-sm text-[color:var(--mix-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--mix-accent)]"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span>LLM model</span>
                <input
                  value={llmModel}
                  onChange={(event) => setLlmModel(event.target.value)}
                  placeholder="gemma-3-27b-it"
                  className="w-full rounded-xl border border-white/10 bg-[#242a3a] px-3 py-2 text-sm text-[color:var(--mix-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--mix-accent)]"
                />
                <span className="text-xs text-[color:var(--mix-ink-soft)]">
                  Leave blank to use the default model.
                </span>
              </label>
              {showKeyError ? (
                <p className="text-xs text-[color:var(--mix-danger)]">
                  A Google AI API key is required unless the server already has
                  it.
                </p>
              ) : null}
              <label className="flex items-center gap-2 text-xs text-[color:var(--mix-ink-soft)]">
                <input
                  type="checkbox"
                  checked={rememberKeys}
                  onChange={(event) => setRememberKeys(event.target.checked)}
                  className="h-4 w-4 accent-[color:var(--mix-accent)]"
                />
                Remember keys on this device
              </label>
            </div>
          </section>

          <section className="mixer-card space-y-4 p-4">
            <div>
              <h3 className="text-base font-semibold">Permissions</h3>
              <p className="text-xs text-[color:var(--mix-ink-soft)]">
                These unlock context signals. You can continue without them, but
                the mix will be less responsive.
              </p>
            </div>
            <div className="space-y-3">
              {permissionItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-[color:var(--mix-ink-soft)]">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(
                        item.status,
                      )}`}
                    >
                      {formatStatusLabel(item.status)}
                    </span>
                    <button
                      type="button"
                      onClick={item.onRequest}
                      disabled={item.status === "unsupported"}
                      className="mixer-button px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {item.status === "unsupported"
                        ? "Unavailable"
                        : item.status === "active"
                          ? "Refresh"
                          : "Grant access"}
                    </button>
                  </div>
                </div>
              ))}
              {showPermissionWarning && !allPermissionsGranted ? (
                <p className="text-xs text-[color:var(--mix-danger)]">
                  Some permissions are missing. You can continue, but the app
                  will skip those signals.
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleContinue}
            className="mixer-button px-5 py-2 text-sm"
          >
            {showPermissionWarning && !allPermissionsGranted
              ? "Continue anyway"
              : "Start mixing"}
          </button>
        </div>
      </div>
    </div>
  );
}
