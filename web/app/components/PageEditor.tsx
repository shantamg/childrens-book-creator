"use client";

import { useState, useCallback, useEffect } from "react";
import { TextOverlayEditor } from "./TextOverlayEditor";
import { TextToolbar } from "./TextToolbar";
import type { TextOverlay, BookYaml, LayoutYaml, PageInfo } from "@/app/lib/types";
import { isRightPage } from "@/app/lib/print-specs";
import { loadGoogleFont } from "@/app/lib/google-fonts";
import { round2 } from "@/app/lib/coordinate-utils";
import { Eye, EyeOff, Save, ChevronLeft, ChevronRight } from "lucide-react";

interface PageEditorProps {
  slug: string;
  book: BookYaml;
  pages: PageInfo[];
  layout: LayoutYaml;
  selectedPage: number;
  onLayoutChange: (layout: LayoutYaml) => void;
  onPageChange: (pageNumber: number) => void;
  dirty: boolean;
  onSave: () => void;
  saving: boolean;
}

export function PageEditor({
  slug,
  book,
  pages,
  layout,
  selectedPage,
  onLayoutChange,
  onPageChange,
  dirty,
  onSave,
  saving,
}: PageEditorProps) {
  const [selectedOverlayId, setSelectedOverlayId] = useState<number | null>(null);
  const [safeZonesVisible, setSafeZonesVisible] = useState(true);

  const overlays = layout.pages[selectedPage] || [];
  const selectedOverlay =
    selectedOverlayId !== null ? overlays[selectedOverlayId] || null : null;

  const defaultFont = book.typography?.font || "Overlock";
  const defaultSize = book.typography?.defaultSize || 42;

  // Load fonts for all overlays on this page
  useEffect(() => {
    const uniqueFonts = new Set(overlays.map((o) => o.font));
    uniqueFonts.forEach((font) => loadGoogleFont(font));
  }, [overlays]);

  // Navigation
  const pageIndex = pages.findIndex((p) => p.pageNumber === selectedPage);
  const prevPage = pageIndex > 0 ? pages[pageIndex - 1] : null;
  const nextPage = pageIndex < pages.length - 1 ? pages[pageIndex + 1] : null;

  const currentPageInfo = pages.find((p) => p.pageNumber === selectedPage);

  const updateOverlay = useCallback(
    (index: number, changes: Partial<TextOverlay>) => {
      const newOverlays = [...overlays];
      newOverlays[index] = { ...newOverlays[index], ...changes };

      // Round percentage values
      if ("leftPercent" in changes)
        newOverlays[index].leftPercent = round2(newOverlays[index].leftPercent);
      if ("topPercent" in changes)
        newOverlays[index].topPercent = round2(newOverlays[index].topPercent);
      if ("widthPercent" in changes)
        newOverlays[index].widthPercent = round2(newOverlays[index].widthPercent);
      if ("heightPercent" in changes)
        newOverlays[index].heightPercent = round2(newOverlays[index].heightPercent);

      const newLayout: LayoutYaml = {
        pages: { ...layout.pages, [selectedPage]: newOverlays },
      };
      onLayoutChange(newLayout);
    },
    [overlays, layout, selectedPage, onLayoutChange]
  );

  const addOverlay = useCallback(() => {
    const newOverlay: TextOverlay = {
      content: "Text",
      font: defaultFont,
      fontSize: defaultSize,
      lineHeight: 1.2,
      letterSpacing: 0,
      color: "#000000",
      align: "left",
      leftPercent: 10,
      topPercent: 10,
      widthPercent: 30,
      heightPercent: 15,
    };
    const newOverlays = [...overlays, newOverlay];
    const newLayout: LayoutYaml = {
      pages: { ...layout.pages, [selectedPage]: newOverlays },
    };
    onLayoutChange(newLayout);
    setSelectedOverlayId(newOverlays.length - 1);
  }, [overlays, layout, selectedPage, defaultFont, defaultSize, onLayoutChange]);

  const removeOverlay = useCallback(
    (index: number) => {
      const newOverlays = overlays.filter((_, i) => i !== index);
      const newPages = { ...layout.pages };

      if (newOverlays.length === 0) {
        delete newPages[selectedPage];
      } else {
        newPages[selectedPage] = newOverlays;
      }

      const newLayout: LayoutYaml = { pages: newPages };
      onLayoutChange(newLayout);

      if (selectedOverlayId === index) {
        setSelectedOverlayId(null);
      } else if (selectedOverlayId !== null && selectedOverlayId > index) {
        setSelectedOverlayId(selectedOverlayId - 1);
      }
    },
    [overlays, layout, selectedPage, selectedOverlayId, onLayoutChange]
  );

  // Reset selection when page changes
  useEffect(() => {
    setSelectedOverlayId(null);
  }, [selectedPage]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedOverlayId(null);
      }
      // Ctrl/Cmd+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty) onSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dirty, onSave]);

  return (
    <div className="flex gap-4 h-full">
      {/* Main editor area */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => prevPage && onPageChange(prevPage.pageNumber)}
              disabled={!prevPage}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700">
              Page {selectedPage}
              {currentPageInfo?.type === "spread" && " (Spread)"}
            </span>
            <button
              onClick={() => nextPage && onPageChange(nextPage.pageNumber)}
              disabled={!nextPage}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSafeZonesVisible(!safeZonesVisible)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded ${
                safeZonesVisible
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {safeZonesVisible ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
              Safe Zones
            </button>
            <button
              onClick={onSave}
              disabled={!dirty || saving}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded ${
                dirty
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Save className="w-3 h-3" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Editor canvas */}
        <TextOverlayEditor
          imageUrl={`/api/project/pages?slug=${slug}&page=${selectedPage}&thumb=false`}
          safeZonesVisible={safeZonesVisible}
          trimWidth={book.specs.trim.width}
          bleed={book.specs.bleed}
          isRightPage={isRightPage(selectedPage)}
          overlays={overlays}
          selectedId={selectedOverlayId}
          onUpdate={updateOverlay}
          onSelect={setSelectedOverlayId}
        />
      </div>

      {/* Sidebar */}
      <div className="w-72 shrink-0 overflow-y-auto">
        <TextToolbar
          overlays={overlays}
          selectedOverlay={selectedOverlay}
          selectedIndex={selectedOverlayId}
          defaultFont={defaultFont}
          defaultSize={defaultSize}
          onUpdate={updateOverlay}
          onRemove={removeOverlay}
          onAdd={addOverlay}
          onSelect={setSelectedOverlayId}
        />
      </div>
    </div>
  );
}
