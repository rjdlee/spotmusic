"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  allGenres,
  normalizeForSearch,
  normalizeGenre,
} from "../lib/genres";
import type { UserProfilePayload } from "../lib/userPreferences";
import FavoriteGenresPanel from "./FavoriteGenresPanel";
import Slider from "./Slider";
import SwitchToggle from "./SwitchToggle";
import Tooltip from "./Tooltip";

const moodOptions = ["productive", "grounded", "dreamy", "uplifting"];
const defaultMoods = ["productive"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const storageKey = "spotmusic-user-profile";

type UserPreferencesPanelProps = {
  onProfileChange?: (profile: UserProfilePayload) => void;
};

export default function UserPreferencesPanel({
  onProfileChange,
}: UserPreferencesPanelProps) {
  const hasHydrated = useRef(false);
  const skipNextSave = useRef(false);
  const [primaryMoods, setPrimaryMoods] = useState<string[]>(defaultMoods);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([
    "jazz",
    "lo-fi",
    "modern classical",
  ]);
  const [excludedGenres, setExcludedGenres] = useState<string[]>([
    "brostep",
    "hardcore",
  ]);
  const [excludedInput, setExcludedInput] = useState("");
  const [isExcludedDropdownOpen, setIsExcludedDropdownOpen] = useState(false);
  const [discoveryMode, setDiscoveryMode] = useState(0.45);
  const [explicitContent, setExplicitContent] = useState(false);
  const [energyFloor, setEnergyFloor] = useState(0.2);
  const [vibeValence, setVibeValence] = useState(0.45);
  const [vibeEnergy, setVibeEnergy] = useState(0.35);
  const [vibeTexture, setVibeTexture] = useState(0.6);

  const excludedQuery = normalizeGenre(excludedInput);
  const excludedSet = useMemo(
    () => new Set(excludedGenres.map((genre) => normalizeGenre(genre))),
    [excludedGenres],
  );
  const availableExcludedGenres = useMemo(
    () => allGenres.filter((genre) => !excludedSet.has(genre)),
    [excludedSet],
  );
  const excludedFuse = useMemo(() => {
    const items = allGenres.map((genre) => ({
      label: genre,
      normalized: normalizeForSearch(genre),
    }));
    return new Fuse(items, {
      includeScore: false,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: ["normalized", "label"],
    });
  }, []);
  const matchingExcludedGenres = useMemo(() => {
    if (!excludedQuery) {
      return [];
    }
    return excludedFuse
      .search(normalizeForSearch(excludedQuery))
      .map((result) => result.item.label)
      .filter((genre) => !excludedSet.has(genre))
      .slice(0, 12);
  }, [excludedFuse, excludedQuery, excludedSet]);

  const profilePayload: UserProfilePayload = useMemo(() => {
    const tempoBpm = Math.round(70 + clamp(vibeEnergy, 0, 1) * 90);
    const textureValue = Number(clamp(vibeTexture, 0, 1).toFixed(2));
    const energyValue = Number(clamp(vibeEnergy, 0, 1).toFixed(2));
    const valenceValue = Number(clamp(vibeValence, 0, 1).toFixed(2));

    return {
      user_profile: {
        identity: {
          primary_mood: primaryMoods,
          core_genres: favoriteGenres,
          energy_floor: Number(clamp(energyFloor, 0, 1).toFixed(2)),
        },
        taste_profile: {
          favorite_genres: favoriteGenres,
          excluded_genres: excludedGenres,
          discovery_mode: Number(clamp(discoveryMode, 0, 1).toFixed(2)),
          explicit_content: explicitContent,
        },
        vibe_matrix: {
          target_valence: valenceValue,
          target_energy: energyValue,
          target_tempo_bpm: tempoBpm,
          target_acousticness: textureValue,
          target_instrumentalness: textureValue,
        },
      },
    };
  }, [
    discoveryMode,
    energyFloor,
    excludedGenres,
    explicitContent,
    favoriteGenres,
    primaryMoods,
    vibeEnergy,
    vibeTexture,
    vibeValence,
  ]);

  const applyProfile = (profile: UserProfilePayload) => {
    const tasteProfile = profile.user_profile.taste_profile;
    const identity = profile.user_profile.identity;
    const vibeMatrix = profile.user_profile.vibe_matrix;

    if (Array.isArray(identity.primary_mood)) {
      setPrimaryMoods(
        identity.primary_mood.length ? identity.primary_mood : defaultMoods,
      );
    } else if (typeof identity.primary_mood === "string") {
      setPrimaryMoods([identity.primary_mood]);
    } else {
      setPrimaryMoods(defaultMoods);
    }
    setFavoriteGenres(
      tasteProfile.favorite_genres?.length
        ? tasteProfile.favorite_genres
        : identity.core_genres ?? [],
    );
    setExcludedGenres(tasteProfile.excluded_genres ?? []);
    setDiscoveryMode(tasteProfile.discovery_mode ?? 0.45);
    setExplicitContent(tasteProfile.explicit_content ?? false);
    setEnergyFloor(identity.energy_floor ?? 0.2);
    setVibeValence(vibeMatrix.target_valence ?? 0.45);
    setVibeEnergy(vibeMatrix.target_energy ?? 0.35);
    setVibeTexture(vibeMatrix.target_acousticness ?? 0.6);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored) as {
        profile?: UserProfilePayload;
      };
      if (!parsed.profile) {
        return;
      }
      applyProfile(parsed.profile);
      skipNextSave.current = true;
      onProfileChange?.(parsed.profile);
    } catch {
      // Ignore invalid stored data.
    } finally {
      hasHydrated.current = true;
    }
  }, [onProfileChange]);

  useEffect(() => {
    onProfileChange?.(profilePayload);
    if (typeof window === "undefined") {
      return;
    }
    if (!hasHydrated.current) {
      return;
    }
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ profile: profilePayload }),
      );
    } catch {
      // Ignore storage failures.
    }
  }, [onProfileChange, profilePayload]);

  const handleAddGenre = (
    value: string,
    list: string[],
    setList: (next: string[]) => void,
    reset: () => void,
  ) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const normalized = normalizeGenre(trimmed);
    const canonical = allGenres.find((genre) => genre === normalized) ?? normalized;
    if (
      list.some(
        (genre) => normalizeGenre(genre) === normalizeGenre(canonical),
      )
    ) {
      reset();
      return;
    }
    setList([...list, canonical]);
    reset();
  };

  const handleRemoveGenre = (
    value: string,
    list: string[],
    setList: (next: string[]) => void,
  ) => {
    setList(list.filter((item) => item !== value));
  };

  const handleToggleItem = (
    value: string,
    list: string[],
    setList: (next: string[]) => void,
  ) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
      return;
    }
    setList([...list, value]);
  };

  return (
    <section className="mixer-tile p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">User preferences</h2>
          <Tooltip
            content="Shape the semantic direction of playback without digging into raw audio features."
            ariaLabel="User preferences info"
          />
        </div>
        <span className="mixer-chip">Semantic tuning</span>
      </div>

      <div className="space-y-4">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="mixer-panel mt-5 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--mix-ink-soft)]">
              Primary mood
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {primaryMoods.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  className="mixer-chip border-transparent bg-[color:var(--mix-accent)] text-white"
                  onClick={() =>
                    handleRemoveGenre(mood, primaryMoods, setPrimaryMoods)
                  }
                >
                  {mood} ✕
                </button>
              ))}
              {primaryMoods.length === 0 ? (
                <span className="text-xs text-[color:var(--mix-ink-soft)]">
                  No moods selected yet.
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {moodOptions.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  className="mixer-button px-3 py-1 text-xs"
                  onClick={() =>
                    handleToggleItem(mood, primaryMoods, setPrimaryMoods)
                  }
                  disabled={primaryMoods.includes(mood)}
                >
                  {primaryMoods.includes(mood) ? `✓ ${mood}` : `+ ${mood}`}
                </button>
              ))}
            </div>
          </div>

          <FavoriteGenresPanel
            favoriteGenres={favoriteGenres}
            setFavoriteGenres={setFavoriteGenres}
          />

          <div className="mixer-panel mt-5 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--mix-ink-soft)]">
              Excluded genres
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {excludedGenres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  className="mixer-chip border-transparent bg-[color:var(--mix-danger)] text-white"
                  onClick={() =>
                    handleRemoveGenre(genre, excludedGenres, setExcludedGenres)
                  }
                >
                  {genre} ✕
                </button>
              ))}
              {excludedGenres.length === 0 ? (
                <span className="text-xs text-[color:var(--mix-ink-soft)]">
                  No exclusions yet.
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    className="mixer-input w-full text-sm"
                    placeholder="Block a genre"
                    value={excludedInput}
                    onChange={(event) => {
                      setExcludedInput(event.target.value);
                      setIsExcludedDropdownOpen(true);
                    }}
                    onFocus={() => setIsExcludedDropdownOpen(true)}
                    onBlur={() => setIsExcludedDropdownOpen(false)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") {
                        return;
                      }
                      event.preventDefault();
                      handleAddGenre(
                        excludedInput,
                        excludedGenres,
                        setExcludedGenres,
                        () => setExcludedInput(""),
                      );
                      setIsExcludedDropdownOpen(false);
                    }}
                  />
                  {isExcludedDropdownOpen &&
                  excludedQuery &&
                  matchingExcludedGenres.length > 0 ? (
                    <div className="mixer-card absolute z-20 mt-2 max-h-48 w-full overflow-auto p-2 shadow-xl">
                      {matchingExcludedGenres.map((genre) => (
                        <button
                          key={genre}
                          type="button"
                          className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs text-[color:var(--mix-ink)] transition hover:bg-white/10"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleAddGenre(
                              genre,
                              excludedGenres,
                              setExcludedGenres,
                              () => setExcludedInput(""),
                            );
                            setIsExcludedDropdownOpen(false);
                          }}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="mixer-button px-4 py-2 text-xs"
                  onClick={() => {
                    handleAddGenre(
                      excludedInput,
                      excludedGenres,
                      setExcludedGenres,
                      () => setExcludedInput(""),
                    );
                    setIsExcludedDropdownOpen(false);
                  }}
                >
                  Block
                </button>
              </div>
              {excludedQuery ? (
                matchingExcludedGenres.length > 0 ? (
                  <span className="text-xs text-[color:var(--mix-ink-soft)]">
                    {matchingExcludedGenres.length} matches.
                  </span>
                ) : (
                  <span className="text-xs text-[color:var(--mix-ink-soft)]">
                    No matches yet. Try another search.
                  </span>
                )
              ) : (
                <span className="text-xs text-[color:var(--mix-ink-soft)]">
                  Start typing to browse {availableExcludedGenres.length}{" "}
                  genres.
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-[color:var(--mix-ink-soft)] mt-4">
              <span>Filter explicit content</span>
              <SwitchToggle
                label={!explicitContent ? "On" : "Off"}
                isOn={!explicitContent}
                onToggle={() => setExplicitContent((prev) => !prev)}
                ariaLabel={`Filter explicit content ${
                  !explicitContent ? "on" : "off"
                }`}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-5">
          <Slider
            label="Discovery mode"
            highLabel="Exploratory"
            lowLabel="Familiar"
            value={discoveryMode}
            min={0}
            max={1}
            step={0.05}
            onChange={setDiscoveryMode}
            valueLabel={`${Math.round(discoveryMode * 100)}% discovery`}
          />
          <Slider
            label="Energy floor"
            highLabel="Driven"
            lowLabel="Soft"
            value={energyFloor}
            min={0}
            max={0.8}
            step={0.05}
            onChange={setEnergyFloor}
            valueLabel={`Floor: ${energyFloor.toFixed(2)}`}
          />
          <Slider
            label="Valence"
            highLabel="Euphoric"
            lowLabel="Melancholy"
            value={vibeValence}
            min={0}
            max={1}
            step={0.05}
            onChange={setVibeValence}
            valueLabel={vibeValence.toFixed(2)}
          />
          <Slider
            label="Energy"
            highLabel="High octane"
            lowLabel="Chilled"
            value={vibeEnergy}
            min={0}
            max={1}
            step={0.05}
            onChange={setVibeEnergy}
            valueLabel={vibeEnergy.toFixed(2)}
          />
          <Slider
            label="Texture"
            highLabel="Synthetic"
            lowLabel="Acoustic"
            value={vibeTexture}
            min={0}
            max={1}
            step={0.05}
            onChange={setVibeTexture}
            valueLabel={vibeTexture.toFixed(2)}
          />
        </div>
        </div>
    </section>
  );
}
