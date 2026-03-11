"use client";

import { useRef, useState, useEffect } from "react";
import { TextBox } from "./TextBox";
import { SafeZoneOverlay } from "./SafeZoneOverlay";
import type { TextOverlay } from "@/app/lib/types";
import type { ContainerDimensions } from "@/app/lib/coordinate-utils";

interface TextOverlayEditorProps {
  imageUrl: string;
  safeZonesVisible: boolean;
  trimWidth: number;
  bleed: number;
  isRightPage: boolean;
  overlays: TextOverlay[];
  selectedId: number | null;
  onUpdate: (index: number, changes: Partial<TextOverlay>) => void;
  onSelect: (index: number | null) => void;
}

export function TextOverlayEditor({
  imageUrl,
  safeZonesVisible,
  trimWidth,
  bleed,
  isRightPage,
  overlays,
  selectedId,
  onUpdate,
  onSelect,
}: TextOverlayEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<ContainerDimensions>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  function handleContainerClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (
      target === containerRef.current ||
      target.tagName === "IMG" ||
      target.getAttribute("data-canvas") === "true"
    ) {
      onSelect(null);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg bg-white border border-gray-200"
      onClick={handleContainerClick}
    >
      <img
        src={imageUrl}
        alt="Page illustration"
        className="w-full h-auto select-none pointer-events-none"
        draggable={false}
      />
      <SafeZoneOverlay
        visible={safeZonesVisible}
        trimSize={trimWidth}
        bleed={bleed}
        isRightPage={isRightPage}
      />
      {dimensions.width > 0 &&
        overlays.map((overlay, i) => (
          <TextBox
            key={i}
            overlay={overlay}
            index={i}
            isSelected={selectedId === i}
            containerDimensions={dimensions}
            onUpdate={onUpdate}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}
