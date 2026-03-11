"use client";

import type { PageInfo, TextOverlay } from "@/app/lib/types";

interface PageGalleryProps {
  pages: PageInfo[];
  layout: Record<number, TextOverlay[]>;
  selectedPage: number | null;
  onSelectPage: (pageNumber: number) => void;
}

export function PageGallery({
  pages,
  layout,
  selectedPage,
  onSelectPage,
}: PageGalleryProps) {
  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <p>No pages found in this project.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {pages.map((page) => {
        const overlays = layout[page.pageNumber] || [];
        const isActive = selectedPage === page.pageNumber;

        return (
          <button
            key={page.pageNumber}
            onClick={() => onSelectPage(page.pageNumber)}
            className={`group relative rounded-lg overflow-hidden border-2 transition-all ${
              isActive
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            {/* Thumbnail image */}
            <div className="relative aspect-square bg-gray-100">
              <img
                src={`${page.thumbnailUrl}&thumb=true`}
                alt={`Page ${page.pageNumber}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Text preview overlay (shows where text boxes are) */}
              {overlays.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {overlays.map((overlay, i) => (
                    <div
                      key={i}
                      className="absolute border border-blue-300/50 bg-blue-100/20"
                      style={{
                        left: `${overlay.leftPercent}%`,
                        top: `${overlay.topPercent}%`,
                        width: `${overlay.widthPercent}%`,
                        height: `${overlay.heightPercent}%`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Page label */}
            <div
              className={`px-2 py-1 text-xs font-medium text-center ${
                isActive ? "bg-blue-50 text-blue-700" : "bg-white text-gray-600"
              }`}
            >
              <span>Page {page.pageNumber}</span>
              {overlays.length > 0 && (
                <span className="ml-1 text-gray-400">
                  ({overlays.length} text{overlays.length > 1 ? "s" : ""})
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
