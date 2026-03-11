/**
 * Spread-building utility for book layout.
 * Converts a flat list of pages into paired spreads for proof/gallery views.
 *
 * Valid page types: story, spread-start, spread-companion, blank, title, cover
 */

import type { PageInfo } from "./types";

export interface Spread {
  left: PageInfo | null;
  right: PageInfo | null;
  isFullSpread: boolean;
}

/**
 * Build spread pairs from a flat page list.
 *
 * Book convention:
 * - Odd pages (1, 3, 5...) are always on the RIGHT (recto)
 * - Even pages (2, 4, 6...) are always on the LEFT (verso)
 * - spread-companion pages are filtered out (right half of panoramic, represented by spread-start)
 * - spread-start pages get their own full-width row
 *
 * Pairs by page number parity: (2,3), (4,5), (6,7), etc.
 */
export function buildSpreads(pages: PageInfo[]): Spread[] {
  // Filter out companion pages — they share the spread-start's image
  const filtered = pages.filter((p) => p.type !== "spread-companion");

  // Index pages by page number for quick lookup
  const byNumber = new Map<number, PageInfo>();
  for (const p of filtered) {
    byNumber.set(p.pageNumber, p);
  }

  // Find the full range of page numbers
  const pageNumbers = filtered.map((p) => p.pageNumber).sort((a, b) => a - b);
  if (pageNumbers.length === 0) return [];

  const spreads: Spread[] = [];
  const consumed = new Set<number>();

  // Walk through page numbers in order
  let i = 0;
  while (i < pageNumbers.length) {
    const num = pageNumbers[i];
    const page = byNumber.get(num)!;

    if (consumed.has(num)) {
      i++;
      continue;
    }

    // Full panoramic spread — gets its own row
    if (page.type === "spread-start") {
      spreads.push({ left: page, right: null, isFullSpread: true });
      consumed.add(num);
      i++;
      continue;
    }

    if (num % 2 === 1) {
      // Odd page = recto (right side)
      // Check if the previous even page exists and is unmatched
      const evenPage = byNumber.get(num - 1);
      if (evenPage && !consumed.has(num - 1) && evenPage.type !== "spread-start") {
        // Pair: even on left, odd on right
        spreads.push({ left: evenPage, right: page, isFullSpread: false });
        consumed.add(num - 1);
        consumed.add(num);
      } else {
        // Solo on the right (e.g., page 1)
        spreads.push({ left: null, right: page, isFullSpread: false });
        consumed.add(num);
      }
    } else {
      // Even page = verso (left side)
      // Check if the next odd page exists
      const oddPage = byNumber.get(num + 1);
      if (oddPage && !consumed.has(num + 1) && oddPage.type !== "spread-start") {
        // Pair: even on left, odd on right
        spreads.push({ left: page, right: oddPage, isFullSpread: false });
        consumed.add(num);
        consumed.add(num + 1);
      } else {
        // Solo on the left
        spreads.push({ left: page, right: null, isFullSpread: false });
        consumed.add(num);
      }
    }

    i++;
  }

  return spreads;
}

/**
 * Build spread pairs for the print-simulation proof view.
 *
 * Unlike buildSpreads (which uses story page numbers for parity),
 * this function accounts for the title page shifting all story pages
 * by one physical position:
 *   - Title page = physical page 1 (recto/right)
 *   - Story page 1 = physical page 2 (verso/left)
 *   - Story page 2 = physical page 3 (recto/right)
 *   - ... and so on
 *
 * Without a title page, falls back to standard odd=right parity.
 */
export function buildPrintSpreads(
  storyPages: PageInfo[],
  titlePage: PageInfo | null,
  aboutAuthorPage: PageInfo | null
): Spread[] {
  const spreads: Spread[] = [];
  const filtered = storyPages.filter((p) => p.type !== "spread-companion");

  // Title page on the right (recto) of first spread
  if (titlePage) {
    spreads.push({ left: null, right: titlePage, isFullSpread: false });
  }

  let i = 0;

  if (!titlePage && filtered.length > 0) {
    // No title page: first story page solo on right (standard recto)
    const first = filtered[0];
    if (first.type === "spread-start") {
      spreads.push({ left: first, right: null, isFullSpread: true });
    } else {
      spreads.push({ left: null, right: first, isFullSpread: false });
    }
    i = 1;
  }

  // Process remaining pages in consecutive pairs
  while (i < filtered.length) {
    const page = filtered[i];

    // Panoramic spread gets its own full-width row
    if (page.type === "spread-start") {
      spreads.push({ left: page, right: null, isFullSpread: true });
      i++;
      continue;
    }

    const next = i + 1 < filtered.length ? filtered[i + 1] : null;

    if (next && next.type === "spread-start") {
      // Next page is a panoramic — current page solo on left
      spreads.push({ left: page, right: null, isFullSpread: false });
      i++;
    } else if (next) {
      // Normal pair: left (verso), right (recto)
      spreads.push({ left: page, right: next, isFullSpread: false });
      i += 2;
    } else {
      // Last page solo on left
      spreads.push({ left: page, right: null, isFullSpread: false });
      i++;
    }
  }

  // About the author on right (recto), with implied blank on left
  if (aboutAuthorPage) {
    spreads.push({ left: null, right: aboutAuthorPage, isFullSpread: false });
  }

  return spreads;
}

/** Human-readable label for a spread */
export function getSpreadLabel(spread: Spread): string {
  // Special page labels
  const specialLabel = (page: PageInfo | null) => {
    if (!page) return null;
    if (page.type === "title") return "Title Page";
    if (page.type === "about-author") return "About the Author";
    return null;
  };

  const leftSpecial = specialLabel(spread.left);
  const rightSpecial = specialLabel(spread.right);
  if (leftSpecial) return leftSpecial;
  if (rightSpecial) return rightSpecial;

  if (spread.isFullSpread && spread.left) {
    return `Page ${spread.left.pageNumber} (Spread)`;
  }
  if (spread.left && spread.right) {
    return `Pages ${spread.left.pageNumber}–${spread.right.pageNumber}`;
  }
  if (spread.left) {
    return `Page ${spread.left.pageNumber}`;
  }
  if (spread.right) {
    return `Page ${spread.right.pageNumber}`;
  }
  return "";
}
