"use client";

import { calculateSafeZones } from "@/app/lib/print-specs";

interface SafeZoneOverlayProps {
  visible: boolean;
  trimSize: number;
  bleed: number;
  isRightPage: boolean;
}

export function SafeZoneOverlay({
  visible,
  trimSize,
  bleed,
  isRightPage,
}: SafeZoneOverlayProps) {
  if (!visible) return null;

  const zones = calculateSafeZones(trimSize, bleed);
  const safetyLeft = isRightPage
    ? zones.safetyGutterPercent
    : zones.safetyOuterPercent;
  const safetyRight = isRightPage
    ? zones.safetyOuterPercent
    : zones.safetyGutterPercent;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* Bleed area shading */}
      <rect x={0} y={0} width={100} height={zones.trimPercent} fill="rgba(255, 0, 0, 0.15)" />
      <rect x={0} y={100 - zones.trimPercent} width={100} height={zones.trimPercent} fill="rgba(255, 0, 0, 0.15)" />
      <rect x={0} y={zones.trimPercent} width={zones.trimPercent} height={100 - zones.trimPercent * 2} fill="rgba(255, 0, 0, 0.15)" />
      <rect x={100 - zones.trimPercent} y={zones.trimPercent} width={zones.trimPercent} height={100 - zones.trimPercent * 2} fill="rgba(255, 0, 0, 0.15)" />

      {/* RED solid line = Trim line */}
      <rect
        x={zones.trimPercent}
        y={zones.trimPercent}
        width={100 - zones.trimPercent * 2}
        height={100 - zones.trimPercent * 2}
        fill="none"
        stroke="rgba(255, 0, 0, 0.9)"
        strokeWidth="0.3"
        vectorEffect="non-scaling-stroke"
      />

      {/* Gutter fill */}
      {isRightPage ? (
        <rect
          x={zones.trimPercent}
          y={zones.trimPercent}
          width={zones.safetyGutterPercent - zones.trimPercent}
          height={100 - zones.trimPercent * 2}
          fill="rgba(100, 80, 200, 0.12)"
        />
      ) : (
        <rect
          x={100 - zones.safetyGutterPercent}
          y={zones.trimPercent}
          width={zones.safetyGutterPercent - zones.trimPercent}
          height={100 - zones.trimPercent * 2}
          fill="rgba(100, 80, 200, 0.12)"
        />
      )}

      {/* Safety margin line */}
      <rect
        x={safetyLeft}
        y={zones.safetyOuterPercent}
        width={100 - safetyLeft - safetyRight}
        height={100 - zones.safetyOuterPercent * 2}
        fill="none"
        stroke="rgba(100, 80, 200, 0.5)"
        strokeWidth="0.3"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
