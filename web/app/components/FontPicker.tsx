"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { loadGoogleFont } from "@/app/lib/google-fonts";

interface FontPickerProps {
  currentFont: string;
  onFontChange: (font: string) => void;
}

// Module-level cache
let fontListCache: string[] | null = null;
let fontListPromise: Promise<string[]> | null = null;

async function fetchFontList(): Promise<string[]> {
  if (fontListCache) return fontListCache;
  if (fontListPromise) return fontListPromise;

  fontListPromise = fetch("/api/google-fonts")
    .then((res) => res.json())
    .then((families: string[]) => {
      fontListCache = families;
      return families;
    })
    .catch(() => {
      fontListPromise = null;
      return [];
    });

  return fontListPromise;
}

export function FontPicker({ currentFont, onFontChange }: FontPickerProps) {
  const [query, setQuery] = useState(currentFont);
  const [fonts, setFonts] = useState<string[]>([]);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setQuery(currentFont);
  }, [currentFont]);

  useEffect(() => {
    fetchFontList().then(setFonts);
  }, []);

  useEffect(() => {
    if (!query || fonts.length === 0) {
      setFiltered([]);
      return;
    }
    const lower = query.toLowerCase();
    const matches = fonts.filter((f) => f.toLowerCase().includes(lower));
    setFiltered(matches.slice(0, 12));
    setHighlightIndex(-1);
  }, [query, fonts]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const selectFont = useCallback(
    (family: string) => {
      setQuery(family);
      setOpen(false);
      onFontChange(family);
      loadGoogleFont(family);
    },
    [onFontChange]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) {
      if (e.key === "ArrowDown" && filtered.length > 0) {
        setOpen(true);
        setHighlightIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          selectFont(filtered[highlightIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative space-y-1">
      <label className="text-xs text-gray-500">Font</label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query && filtered.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded px-2 py-1"
        placeholder="Search Google Fonts..."
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded shadow-lg"
        >
          {filtered.map((family, i) => (
            <li
              key={family}
              className={`px-2 py-1.5 text-sm cursor-pointer ${
                i === highlightIndex
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectFont(family);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              {family}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
