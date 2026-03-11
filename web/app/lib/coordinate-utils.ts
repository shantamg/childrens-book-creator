/**
 * Coordinate conversion between pixel positions (react-rnd) and
 * percentage positions (layout.yaml).
 */

export interface ContainerDimensions {
  width: number;
  height: number;
}

/**
 * Reference width for font size scaling.
 * Print-ready images are 2625px; font sizes in layout.yaml are authored at
 * the 1200px Playwright viewport that scales up by 2625/1200.
 */
export const REFERENCE_WIDTH = 1200;

/** Convert pixel coordinates to percentage coordinates, clamped to 0-100. */
export function pixelsToPercent(
  pixelX: number,
  pixelY: number,
  pixelWidth: number,
  pixelHeight: number,
  container: ContainerDimensions
): {
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
} {
  return {
    leftPercent: clamp((pixelX / container.width) * 100),
    topPercent: clamp((pixelY / container.height) * 100),
    widthPercent: clamp((pixelWidth / container.width) * 100),
    heightPercent: clamp((pixelHeight / container.height) * 100),
  };
}

/** Convert percentage coordinates to pixel coordinates, clamped to container. */
export function percentToPixels(
  leftPercent: number,
  topPercent: number,
  widthPercent: number,
  heightPercent: number,
  container: ContainerDimensions
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: Math.max(0, Math.min(container.width, (leftPercent / 100) * container.width)),
    y: Math.max(0, Math.min(container.height, (topPercent / 100) * container.height)),
    width: Math.max(0, Math.min(container.width, (widthPercent / 100) * container.width)),
    height: Math.max(0, Math.min(container.height, (heightPercent / 100) * container.height)),
  };
}

function clamp(val: number): number {
  return Math.max(0, Math.min(100, val));
}

/** Round to 2 decimal places for clean YAML output */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
