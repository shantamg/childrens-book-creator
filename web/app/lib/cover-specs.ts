/**
 * Cover template specs for hardcover wrap-around covers.
 * Based on OnPress Square Hard Cover template (19.026" x 10.0").
 *
 * All zone positions expressed as percentages of the full canvas,
 * ready to use in SVG overlays with viewBox="0 0 100 100".
 */

// Template dimensions (inches) — hardcover 8.5×8.5 trim
const CANVAS_W = 19.026;
const CANVAS_H = 10.0;
const TRIM_INSET = 0.625; // bleed edge to trim line
const SAFETY_OFFSET = 0.188; // trim line to safety line
const SAFETY_INSET = TRIM_INSET + SAFETY_OFFSET; // bleed edge to safety line
const SPINE_LEFT = 9.375;
const SPINE_RIGHT = 9.651;

function pctX(inches: number) {
  return (inches / CANVAS_W) * 100;
}
function pctY(inches: number) {
  return (inches / CANVAS_H) * 100;
}

export interface CoverZones {
  // Trim rectangle (percentage)
  trim: { left: number; top: number; right: number; bottom: number };
  // Spine fold lines
  spine: { left: number; right: number; center: number };
  // Back cover safety box
  backSafety: { left: number; top: number; right: number; bottom: number };
  // Front cover safety box
  frontSafety: { left: number; top: number; right: number; bottom: number };
  // Canvas aspect ratio
  aspectRatio: number;
}

export function calculateCoverZones(): CoverZones {
  const trimLeft = pctX(TRIM_INSET);
  const trimRight = pctX(CANVAS_W - TRIM_INSET);
  const trimTop = pctY(TRIM_INSET);
  const trimBottom = pctY(CANVAS_H - TRIM_INSET);

  const safetyTop = pctY(SAFETY_INSET);
  const safetyBottom = pctY(CANVAS_H - SAFETY_INSET);

  const spineLeft = pctX(SPINE_LEFT);
  const spineRight = pctX(SPINE_RIGHT);
  const spineCenter = pctX((SPINE_LEFT + SPINE_RIGHT) / 2);

  // Back cover safety: from safety inset to just before spine
  const backSafetyLeft = pctX(SAFETY_INSET);
  const backSafetyRight = pctX(SPINE_LEFT - SAFETY_OFFSET);

  // Front cover safety: from just after spine to safety inset
  const frontSafetyLeft = pctX(SPINE_RIGHT + SAFETY_OFFSET);
  const frontSafetyRight = pctX(CANVAS_W - SAFETY_INSET);

  return {
    trim: { left: trimLeft, top: trimTop, right: trimRight, bottom: trimBottom },
    spine: { left: spineLeft, right: spineRight, center: spineCenter },
    backSafety: {
      left: backSafetyLeft,
      top: safetyTop,
      right: backSafetyRight,
      bottom: safetyBottom,
    },
    frontSafety: {
      left: frontSafetyLeft,
      top: safetyTop,
      right: frontSafetyRight,
      bottom: safetyBottom,
    },
    aspectRatio: CANVAS_W / CANVAS_H,
  };
}
