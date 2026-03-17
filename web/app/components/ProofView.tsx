"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { PageInfo, TextOverlay, BookYaml, LayoutYaml } from "@/app/lib/types";
import { buildSpreads, buildPrintSpreads, getSpreadLabel } from "@/app/lib/spreads";
import type { Spread } from "@/app/lib/spreads";
import { loadGoogleFont } from "@/app/lib/google-fonts";
import { X } from "lucide-react";

const REFERENCE_WIDTH = 1200;

const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

interface ProofViewProps {
  slug: string;
}

function PageWithText({
  slug,
  page,
  layout,
  className,
  isSpread,
}: {
  slug: string;
  page: PageInfo;
  layout: LayoutYaml;
  className?: string;
  isSpread?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const overlays = layout.pages[page.pageNumber] || [];
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
    <div ref={containerRef} className={`relative ${className || ""}`}>
      <img
        src={`${page.thumbnailUrl}&thumb=false`}
        alt={`Page ${page.pageNumber}`}
        className="w-full h-full object-cover"
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
            className="absolute"
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
                padding: bgEnabled ? `${bgPadding}px` : `${4 * scaleFactor}px`,
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

function EmptyPage() {
  return <div className="aspect-square bg-white" />;
}

function SpreadRow({
  spread,
  index,
  slug,
  layout,
}: {
  spread: Spread;
  index: number;
  slug: string;
  layout: LayoutYaml;
}) {
  if (spread.isFullSpread && spread.left) {
    return (
      <div
        data-spread-index={index}
        className="h-screen flex flex-col items-center justify-center p-8"
      >
        <div className="h-full aspect-[2/1] flex items-center justify-center">
          <PageWithText
            slug={slug}
            page={spread.left}
            layout={layout}
            className="h-full w-full"
            isSpread
          />
        </div>
        <div className="mt-2 text-xs text-gray-400">
          {getSpreadLabel(spread)}
        </div>
      </div>
    );
  }

  return (
    <div
      data-spread-index={index}
      className="h-screen flex flex-col items-center justify-center p-8"
    >
      <div className="h-[calc(100%-2rem)] flex items-center justify-center gap-1">
        <div className="h-full aspect-square bg-white shadow-md">
          {spread.left ? (
            <PageWithText slug={slug} page={spread.left} layout={layout} className="h-full w-full" />
          ) : (
            <EmptyPage />
          )}
        </div>
        <div className="w-px h-full bg-gray-300" />
        <div className="h-full aspect-square bg-white shadow-md">
          {spread.right ? (
            <PageWithText slug={slug} page={spread.right} layout={layout} className="h-full w-full" />
          ) : (
            <EmptyPage />
          )}
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-400">
        {getSpreadLabel(spread)}
      </div>
    </div>
  );
}

export function ProofView({ slug }: ProofViewProps) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [layout, setLayout] = useState<LayoutYaml>({ pages: {} });
  const [book, setBook] = useState<BookYaml | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);

  // Load data
  useEffect(() => {
    async function load() {
      const [pagesRes, layoutRes] = await Promise.all([
        fetch(`/api/project/pages?slug=${slug}`),
        fetch(`/api/project/layout?slug=${slug}`),
      ]);
      const pagesData = await pagesRes.json();
      const layoutData = await layoutRes.json();

      setBook(pagesData.book);
      setPages(pagesData.pages);
      setLayout(layoutData);
      setLoading(false);

      // Preload all fonts used across the book
      const allFonts = new Set<string>();
      for (const overlays of Object.values(layoutData.pages || {})) {
        for (const overlay of overlays as TextOverlay[]) {
          allFonts.add(overlay.font);
        }
      }
      allFonts.forEach((font) => loadGoogleFont(font));
    }
    load();
  }, [slug]);

  // Build special pages from book.yaml config
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

  const spreads = buildPrintSpreads(pages, titlePage, aboutAuthorPage);

  // Keyboard navigation
  const scrollToSpread = useCallback(
    (index: number) => {
      if (index < 0 || index >= spreads.length) return;
      setCurrentSpreadIndex(index);
      const element = document.querySelector(`[data-spread-index="${index}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [spreads.length]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
        case "ArrowRight":
          e.preventDefault();
          scrollToSpread(currentSpreadIndex + 1);
          break;
        case "ArrowUp":
        case "PageUp":
        case "ArrowLeft":
          e.preventDefault();
          scrollToSpread(currentSpreadIndex - 1);
          break;
        case "Escape":
          window.history.back();
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSpreadIndex, scrollToSpread]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
        <div className="text-white text-sm font-medium">
          {book?.title || slug}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-xs">
            Spread {currentSpreadIndex + 1} of {spreads.length}
          </span>
          <span className="text-gray-500 text-xs">
            Arrow keys to navigate &middot; Esc to close
          </span>
          <button
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Spreads */}
      <div className="pt-10">
        {spreads.map((spread, index) => (
          <SpreadRow
            key={index}
            spread={spread}
            index={index}
            slug={slug}
            layout={layout}
          />
        ))}
      </div>
    </div>
  );
}
