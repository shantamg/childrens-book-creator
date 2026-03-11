"use client";

import { useRef, useState, useEffect } from "react";
import type { PageInfo, TextOverlay, LayoutYaml, BookYaml } from "@/app/lib/types";
import { buildSpreads, buildPrintSpreads, getSpreadLabel } from "@/app/lib/spreads";
import { loadGoogleFont } from "@/app/lib/google-fonts";

const REFERENCE_WIDTH = 1200;

const isSpecialPage = (page: PageInfo) =>
  page.type === "title" || page.type === "about-author";

function ThumbnailWithText({
  slug,
  page,
  overlays,
  onClick,
}: {
  slug: string;
  page: PageInfo;
  overlays: TextOverlay[];
  onClick?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const scaleFactor = containerWidth > 0 ? containerWidth / REFERENCE_WIDTH : 0;

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
        className="w-full aspect-square object-cover bg-gray-100"
        loading="lazy"
      />
      {overlays.map((overlay, i) => (
        <div
          key={i}
          className="absolute overflow-hidden pointer-events-none"
          style={{
            left: `${overlay.leftPercent}%`,
            top: `${overlay.topPercent}%`,
            width: `${overlay.widthPercent}%`,
            height: `${overlay.heightPercent}%`,
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
              padding: `${2 * scaleFactor}px`,
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
            }}
          >
            {overlay.content}
          </div>
        </div>
      ))}
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
          const overlays = layout.pages[spread.left.pageNumber] || [];
          return (
            <div key={index} className="rounded-lg overflow-hidden border border-gray-200 bg-white">
              <div
                onClick={isSpecialPage(spread.left!) ? undefined : () => onSelectPage(spread.left!.pageNumber)}
                className={`${isSpecialPage(spread.left!) ? "" : "cursor-pointer hover:opacity-90"} transition-opacity`}
              >
                <img
                  src={`${spread.left.thumbnailUrl}&thumb=true`}
                  alt={`Spread page ${spread.left.pageNumber}`}
                  className="w-full aspect-[2/1] object-cover bg-gray-100"
                  loading="lazy"
                />
              </div>
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
