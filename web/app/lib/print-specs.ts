/**
 * Print specifications and safe zone calculations.
 * 8.5x8.5" trim, 0.125" bleed, 0.25" safe zone, 0.44" outer margins, 1.0" gutter margin.
 */

export interface SafeZones {
  fullBleedInches: number;
  trimPercent: number;
  safetyOuterPercent: number;
  safetyGutterPercent: number;
}

/**
 * Calculate safe zone percentages for SVG overlay.
 * Outer safety margin: 0.44", gutter safety margin: 1.0"
 */
export function calculateSafeZones(trimWidth: number, bleed: number): SafeZones {
  const fullBleedInches = trimWidth + bleed * 2;
  const trimPercent = (bleed / fullBleedInches) * 100;
  const safetyOuterPercent = (0.44 / fullBleedInches) * 100;
  const safetyGutterPercent = (1.0 / fullBleedInches) * 100;

  return {
    fullBleedInches,
    trimPercent,
    safetyOuterPercent,
    safetyGutterPercent,
  };
}

/**
 * Determine if a story page is right-hand (recto) or left-hand (verso).
 * Story page 1 becomes PDF page 2 (page 1 is copyright).
 * Odd PDF pages are right-hand (recto) -- gutter on LEFT.
 */
export function isRightPage(storyPageNumber: number): boolean {
  const pdfPage = storyPageNumber + 1;
  return pdfPage % 2 === 1;
}
