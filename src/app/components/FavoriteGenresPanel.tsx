"use client";

import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import {
  allGenres,
  normalizeForSearch,
  normalizeGenre,
} from "../lib/genres";

type FavoriteGenresPanelProps = {
  favoriteGenres: string[];
  setFavoriteGenres: (next: string[]) => void;
};

export default function FavoriteGenresPanel({
  favoriteGenres,
  setFavoriteGenres,
}: FavoriteGenresPanelProps) {
  const [genreInput, setGenreInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const query = normalizeGenre(genreInput);
  const favoriteSet = useMemo(
    () => new Set(favoriteGenres.map((genre) => normalizeGenre(genre))),
    [favoriteGenres],
  );
  const availableGenres = useMemo(
    () => allGenres.filter((genre) => !favoriteSet.has(genre)),
    [favoriteSet],
  );
  const fuse = useMemo(() => {
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
  const matchingGenres = useMemo(() => {
    if (!query) {
      return [];
    }
    return fuse
      .search(normalizeForSearch(query))
      .map((result) => result.item.label)
      .filter((genre) => !favoriteSet.has(genre))
      .slice(0, 12);
  }, [favoriteSet, fuse, query]);

  const handleAddGenre = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const normalized = normalizeGenre(trimmed);
    const canonical =
      allGenres.find((genre) => genre === normalized) ?? normalized;
    if (
      favoriteGenres.some(
        (genre) => normalizeGenre(genre) === normalizeGenre(canonical),
      )
    ) {
      setGenreInput("");
      return;
    }
    setFavoriteGenres([...favoriteGenres, canonical]);
    setGenreInput("");
  };

  const handleRemoveGenre = (value: string) => {
    setFavoriteGenres(favoriteGenres.filter((genre) => genre !== value));
  };

  return (
    <div className="mixer-panel mt-5 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--mix-ink-soft)]">
        Favorite genres
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {favoriteGenres.map((genre) => (
          <button
            key={genre}
            type="button"
            className="mixer-chip border-transparent bg-[color:var(--mix-accent)] text-white"
            onClick={() => handleRemoveGenre(genre)}
          >
            {genre} ✕
          </button>
        ))}
        {favoriteGenres.length === 0 ? (
          <span className="text-xs text-[color:var(--mix-ink-soft)]">
            No favorites yet.
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <input
              className="mixer-input w-full text-sm"
              placeholder="Search genres"
              value={genreInput}
              onChange={(event) => {
                setGenreInput(event.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setIsDropdownOpen(false)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") {
                  return;
                }
                event.preventDefault();
                handleAddGenre(genreInput);
                setIsDropdownOpen(false);
              }}
            />
            {isDropdownOpen && query && matchingGenres.length > 0 ? (
              <div className="mixer-card absolute z-20 mt-2 max-h-48 w-full overflow-auto p-2 shadow-xl">
                {matchingGenres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs text-[color:var(--mix-ink)] transition hover:bg-white/10"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleAddGenre(genre);
                      setIsDropdownOpen(false);
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
              handleAddGenre(genreInput);
              setIsDropdownOpen(false);
            }}
          >
            Add
          </button>
        </div>
        {query ? (
          matchingGenres.length > 0 ? (
            <span className="text-xs text-[color:var(--mix-ink-soft)]">
              {matchingGenres.length} matches.
            </span>
          ) : (
            <span className="text-xs text-[color:var(--mix-ink-soft)]">
              No matches yet. Try another search.
            </span>
          )
        ) : (
          <span className="text-xs text-[color:var(--mix-ink-soft)]">
            Start typing to browse {availableGenres.length} genres.
          </span>
        )}
      </div>
    </div>
  );
}
