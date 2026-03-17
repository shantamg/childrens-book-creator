"use client";

import { useState, useEffect } from "react";
import { CoverGuideOverlay } from "./CoverGuideOverlay";
import { Layers, ChevronLeft, ChevronRight } from "lucide-react";

interface CoverImage {
  name: string;
  path: string;
  mtime: number;
}

interface CoverViewProps {
  slug: string;
}

export function CoverView({ slug }: CoverViewProps) {
  const [images, setImages] = useState<CoverImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [loading, setLoading] = useState(true);
  const [imageKey, setImageKey] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/project/cover?slug=${slug}&list=true`);
        if (!res.ok) throw new Error("Failed to load cover images");
        const data = await res.json();
        setImages(data.images);
        // Default to latest variation
        if (data.images.length > 0) {
          setSelectedIndex(data.images.length - 1);
        }
      } catch (err) {
        console.error("Error loading cover images:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const selected = images[selectedIndex];
  const imageUrl = selected
    ? `/api/project/cover?slug=${slug}&version=${selected.name}&t=${imageKey}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No cover images found. Generate a cover first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Version selector */}
          {images.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                disabled={selectedIndex === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-[80px] text-center">
                {selected?.name}
              </span>
              <button
                onClick={() => setSelectedIndex(Math.min(images.length - 1, selectedIndex + 1))}
                disabled={selectedIndex === images.length - 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          {images.length === 1 && (
            <span className="text-sm text-gray-600">{selected?.name}</span>
          )}
        </div>

        {/* Guide toggle */}
        <button
          onClick={() => setShowGuide(!showGuide)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            showGuide
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Print Guide
        </button>
      </div>

      {/* Cover image with overlay */}
      <div
        className="relative w-full bg-gray-100 rounded-lg overflow-hidden"
        style={{ aspectRatio: "19.026 / 10" }}
      >
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-contain"
            onError={() => setImageKey((k) => k + 1)}
          />
        )}
        <CoverGuideOverlay visible={showGuide} />
      </div>

      {/* Zone reference */}
      {showGuide && (
        <div className="text-xs text-gray-500 flex gap-6">
          <span><span className="inline-block w-3 h-2 bg-red-500/20 border border-red-400 rounded-sm mr-1" />Bleed (trimmed off)</span>
          <span><span className="inline-block w-3 h-2 border border-red-400 rounded-sm mr-1" />Trim line</span>
          <span><span className="inline-block w-3 h-2 border border-green-500 rounded-sm mr-1" />Safety zone</span>
          <span><span className="inline-block w-3 h-2 bg-blue-500/20 border border-blue-400 rounded-sm mr-1" />Spine</span>
        </div>
      )}
    </div>
  );
}
