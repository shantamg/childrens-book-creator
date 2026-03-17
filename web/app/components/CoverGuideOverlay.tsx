"use client";

import { calculateCoverZones } from "@/app/lib/cover-specs";

interface CoverGuideOverlayProps {
  visible: boolean;
}

export function CoverGuideOverlay({ visible }: CoverGuideOverlayProps) {
  if (!visible) return null;

  const z = calculateCoverZones();

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* === Bleed shading (outer edges that get trimmed) === */}
      {/* Top */}
      <rect x={0} y={0} width={100} height={z.trim.top} fill="rgba(255, 0, 0, 0.15)" />
      {/* Bottom */}
      <rect x={0} y={z.trim.bottom} width={100} height={100 - z.trim.bottom} fill="rgba(255, 0, 0, 0.15)" />
      {/* Left */}
      <rect x={0} y={z.trim.top} width={z.trim.left} height={z.trim.bottom - z.trim.top} fill="rgba(255, 0, 0, 0.15)" />
      {/* Right */}
      <rect x={z.trim.right} y={z.trim.top} width={100 - z.trim.right} height={z.trim.bottom - z.trim.top} fill="rgba(255, 0, 0, 0.15)" />

      {/* === Spine shading === */}
      <rect
        x={z.spine.left}
        y={z.trim.top}
        width={z.spine.right - z.spine.left}
        height={z.trim.bottom - z.trim.top}
        fill="rgba(59, 130, 246, 0.2)"
      />

      {/* === Trim line (red) === */}
      <rect
        x={z.trim.left}
        y={z.trim.top}
        width={z.trim.right - z.trim.left}
        height={z.trim.bottom - z.trim.top}
        fill="none"
        stroke="rgba(239, 68, 68, 0.8)"
        strokeWidth="0.3"
        vectorEffect="non-scaling-stroke"
      />

      {/* === Back cover safety (green) === */}
      <rect
        x={z.backSafety.left}
        y={z.backSafety.top}
        width={z.backSafety.right - z.backSafety.left}
        height={z.backSafety.bottom - z.backSafety.top}
        fill="none"
        stroke="rgba(34, 197, 94, 0.7)"
        strokeWidth="0.3"
        vectorEffect="non-scaling-stroke"
      />

      {/* === Front cover safety (green) === */}
      <rect
        x={z.frontSafety.left}
        y={z.frontSafety.top}
        width={z.frontSafety.right - z.frontSafety.left}
        height={z.frontSafety.bottom - z.frontSafety.top}
        fill="none"
        stroke="rgba(34, 197, 94, 0.7)"
        strokeWidth="0.3"
        vectorEffect="non-scaling-stroke"
      />

      {/* === Spine fold lines (blue dashed) === */}
      <line
        x1={z.spine.left} y1={z.trim.top}
        x2={z.spine.left} y2={z.trim.bottom}
        stroke="rgba(59, 130, 246, 0.8)"
        strokeWidth="0.3"
        strokeDasharray="1.5 1"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={z.spine.right} y1={z.trim.top}
        x2={z.spine.right} y2={z.trim.bottom}
        stroke="rgba(59, 130, 246, 0.8)"
        strokeWidth="0.3"
        strokeDasharray="1.5 1"
        vectorEffect="non-scaling-stroke"
      />

      {/* === Spine center (yellow dashed) === */}
      <line
        x1={z.spine.center} y1={z.trim.top}
        x2={z.spine.center} y2={z.trim.bottom}
        stroke="rgba(234, 179, 8, 0.7)"
        strokeWidth="0.2"
        strokeDasharray="1.5 1"
        vectorEffect="non-scaling-stroke"
      />

      {/* === Labels === */}
      {/* Back Cover label */}
      <text
        x={(z.backSafety.left + z.backSafety.right) / 2}
        y={50}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255, 255, 255, 0.9)"
        fontSize="2.5"
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        paintOrder="stroke"
        stroke="rgba(0, 0, 0, 0.5)"
        strokeWidth="0.4"
      >
        BACK COVER
      </text>

      {/* Front Cover label */}
      <text
        x={(z.frontSafety.left + z.frontSafety.right) / 2}
        y={50}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255, 255, 255, 0.9)"
        fontSize="2.5"
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        paintOrder="stroke"
        stroke="rgba(0, 0, 0, 0.5)"
        strokeWidth="0.4"
      >
        FRONT COVER
      </text>

      {/* Spine label */}
      <text
        x={z.spine.center}
        y={30}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(147, 197, 253, 0.9)"
        fontSize="1.5"
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        paintOrder="stroke"
        stroke="rgba(0, 0, 0, 0.5)"
        strokeWidth="0.3"
      >
        S
      </text>

      {/* === Legend (bottom-left) === */}
      <rect x={1} y={90} width={18} height={9} rx={0.5} fill="rgba(0, 0, 0, 0.6)" />
      <rect x={1.5} y={91.5} width={1.5} height={1} fill="rgba(239, 68, 68, 0.8)" />
      <text x={3.5} y={92.5} fill="white" fontSize="1.2" fontFamily="system-ui" dominantBaseline="middle">Trim</text>
      <rect x={1.5} y={93.5} width={1.5} height={1} fill="rgba(34, 197, 94, 0.7)" />
      <text x={3.5} y={94.5} fill="white" fontSize="1.2" fontFamily="system-ui" dominantBaseline="middle">Safety</text>
      <rect x={1.5} y={95.5} width={1.5} height={1} fill="rgba(59, 130, 246, 0.5)" />
      <text x={3.5} y={96.5} fill="white" fontSize="1.2" fontFamily="system-ui" dominantBaseline="middle">Spine</text>
      <rect x={9} y={91.5} width={1.5} height={1} fill="rgba(255, 0, 0, 0.15)" />
      <text x={11} y={92.5} fill="white" fontSize="1.2" fontFamily="system-ui" dominantBaseline="middle">Bleed</text>
    </svg>
  );
}
