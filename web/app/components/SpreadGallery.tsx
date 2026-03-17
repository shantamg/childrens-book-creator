"use client";

import { useRef, useState, useEffect } from "react";
import type { PageInfo, TextOverlay, LayoutYaml, BookYaml } from "@/app/lib/types";
import { buildSpreads, buildPrintSpreads, getSpreadLabel } from "@/app/lib/spreads";
import { loadGoogleFont } from "@/app/lib/google-fonts";

const REFERENCE_WIDTH = 1200;

const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const isSpecialPage = (page: PageInfo) =>
  page.type === "title" || page.type === "about-author";

function ThumbnailWithText({
  slug,
  page,
  overlays,
  onClick,
  isSpread,
}: {
  slug: string;
  page: PageInfo;
  overlays: TextOverlay[];
  onClick?: () => void;
  isSpread?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  // For spreads, text is designed for a single page width, so scale based on half the container
  const effectiveWidth = isSpread ? containerWidth / 2 : containerWidth;
  const scaleFactor = effectiveWidth > 0 ? effectiveWidth / REFERENCE_WIDTH : 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`relative ${onClick ? "cursor-pointer hover:opacity-90" : ""} transition-opacity`}
    >
      <img
        src={`${page.thumbnailUrl}&thumb=true`}
        alt={`Page ${page.pageNumber}`}
        className={`w-full ${isSpread ? "aspect-[2/1]" : "aspect-square"} object-cover bg-gray-100`}
        loading="lazy"
      />
      {overlays.map((overlay, i) => {
        const bgEnabled = overlay.bgEnabled ?? false;
        const bgColor = overlay.bgColor ?? "#ffffff";
        const bgOpacity = overlay.bgOpacity ?? 0.75;
        const bgRadius = Math.round((overlay.bgRadius ?? 12) * scaleFactor);
        const bgPadding = Math.round((overlay.bgPadding ?? 16) * scaleFactor);

        return (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${overlay.leftPercent}%`,
              top: `${overlay.topPercent}%`,
              width: `${overlay.widthPercent}%`,
            }}
          >
            <div
              style={{
                fontFamily: `'${overlay.font}', serif`,
                fontSize: `${overlay.fontSize * scaleFactor}px`,
                color: overlay.color,
                textAlign: overlay.align as "left" | "center" | "right",
                lineHeight: overlay.lineHeight,
                letterSpacing: `${overlay.letterSpacing}em`,
                padding: bgEnabled ? `${bgPadding}px` : `${2 * scaleFactor}px`,
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                ...(bgEnabled && {
                  backgroundColor: hexToRgba(bgColor, bgOpacity),
                  borderRadius: `${bgRadius}px`,
                }),
              }}
            >
              {overlay.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyThumbnail() {
  return <div className="aspect-square bg-gray-50 border border-dashed border-gray-200" />;
}

interface SpreadGalleryProps {
  slug: string;
  pages: PageInfo[];
  layout: LayoutYaml;
  book: BookYaml | null;
  onSelectPage: (pageNumber: number) => void;
}

export function SpreadGallery({
  slug,
  pages,
  layout,
  book,
  onSelectPage,
}: SpreadGalleryProps) {
  // Build special page objects if configured
  const titlePage: PageInfo | null = book?.specialPages?.titlePage
    ? {
        pageNumber: -1,
        folder: "",
        type: "title",
        imageFile: null,
        thumbnailUrl: `/api/project/pages?slug=${slug}&special=title`,
      }
    : null;

  const aboutAuthorPage: PageInfo | null = book?.specialPages?.aboutAuthor
    ? {
        pageNumber: -2,
        folder: "",
        type: "about-author",
        imageFile: null,
        thumbnailUrl: `/api/project/pages?slug=${slug}&special=about-author`,
      }
    : null;

  // Use print spreads (correct recto/verso with title page offset) when special pages exist
  const hasSpecialPages = !!(titlePage || aboutAuthorPage);
  const spreads = hasSpecialPages
    ? buildPrintSpreads(pages, titlePage, aboutAuthorPage)
    : buildSpreads(pages);

  // Load fonts for all overlays
  useEffect(() => {
    const allFonts = new Set<string>();
    for (const overlays of Object.values(layout.pages || {})) {
      for (const overlay of overlays) {
        allFonts.add(overlay.font);
      }
    }
    allFonts.forEach((font) => loadGoogleFont(font));
  }, [layout]);

  if (spreads.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <p>No pages found in this project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {spreads.map((spread, index) => {
        if (spread.isFullSpread && spread.left) {
          // Merge overlays from both pages of the spread
          const leftOverlays = layout.pages[spread.left.pageNumber] || [];
          const rightPage = spread.right;
          const rightOverlays = rightPage
            ? (layout.pages[rightPage.pageNumber] || []).map((o: TextOverlay) => ({
                ...o,
                // Shift right-page percentages to the right half of the spread
                leftPercent: o.leftPercent / 2 + 50,
                widthPercent: o.widthPercent / 2,
              }))
            : [];
          // Scale left-page percentages to the left half
          const scaledLeftOverlays = leftOverlays.map((o: TextOverlay) => ({
            ...o,
            leftPercent: o.leftPercent / 2,
            widthPercent: o.widthPercent / 2,
          }));
          const allOverlays = [...scaledLeftOverlays, ...rightOverlays];

          return (
            <div key={index} className="rounded-lg overflow-hidden border border-gray-200 bg-white">
              <ThumbnailWithText
                slug={slug}
                page={{ ...spread.left, thumbnailUrl: spread.left.thumbnailUrl }}
                overlays={allOverlays}
                onClick={isSpecialPage(spread.left!) ? undefined : () => onSelectPage(spread.left!.pageNumber)}
                isSpread
              />
              <div className="px-3 py-1.5 text-xs text-gray-500 border-t border-gray-100">
                {getSpreadLabel(spread)}
              </div>
            </div>
          );
        }

        return (
          <div key={index} className="rounded-lg overflow-hidden border border-gray-200 bg-white">
            <div className="flex">
              <div className="flex-1 min-w-0 border-r border-gray-200">
                {spread.left ? (
                  <ThumbnailWithText
                    slug={slug}
                    page={spread.left}
                    overlays={layout.pages[spread.left.pageNumber] || []}
                    onClick={isSpecialPage(spread.left) ? undefined : () => onSelectPage(spread.left!.pageNumber)}
                  />
                ) : (
                  <EmptyThumbnail />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {spread.right ? (
                  <ThumbnailWithText
                    slug={slug}
                    page={spread.right}
                    overlays={layout.pages[spread.right.pageNumber] || []}
                    onClick={isSpecialPage(spread.right) ? undefined : () => onSelectPage(spread.right!.pageNumber)}
                  />
                ) : (
                  <EmptyThumbnail />
                )}
              </div>
            </div>
            <div className="px-3 py-1.5 text-xs text-gray-500 border-t border-gray-100">
              {getSpreadLabel(spread)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
