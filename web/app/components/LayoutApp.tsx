"use client";

import { useState, useCallback, useEffect } from "react";
import { SpreadGallery } from "./SpreadGallery";
import { PageEditor } from "./PageEditor";
import { BookOpen, ChevronLeft } from "lucide-react";
import type { BookYaml, LayoutYaml, PageInfo } from "@/app/lib/types";

interface LayoutAppProps {
  slug: string;
}

export function LayoutApp({ slug }: LayoutAppProps) {
  const [book, setBook] = useState<BookYaml | null>(null);
  const [layout, setLayout] = useState<LayoutYaml>({ pages: {} });
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load project data on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [pagesRes, layoutRes] = await Promise.all([
          fetch(`/api/project/pages?slug=${slug}`),
          fetch(`/api/project/layout?slug=${slug}`),
        ]);

        if (!pagesRes.ok) throw new Error("Failed to load project pages");
        if (!layoutRes.ok) throw new Error("Failed to load layout data");

        const pagesData = await pagesRes.json();
        const layoutData = await layoutRes.json();

        setBook(pagesData.book);
        setPages(pagesData.pages);
        setLayout(layoutData);
        setDirty(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load project"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleLayoutChange = useCallback((newLayout: LayoutYaml) => {
    setLayout(newLayout);
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/project/layout?slug=${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layout),
      });
      if (!res.ok) throw new Error("Save failed");
      setDirty(false);
      setLastSaved(new Date());
    } catch (err) {
      console.error("Error saving layout:", err);
      alert("Failed to save layout. Check the console for details.");
    } finally {
      setSaving(false);
    }
  }, [slug, layout, saving]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-medium mb-2">Error loading project</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mt-4">
            Make sure the project slug &quot;{slug}&quot; exists in the projects
            directory.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="All Projects"
          >
            <ChevronLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{book.title}</h1>
            <p className="text-xs text-gray-500">
              {book.author} &middot; {book.specs.trim.width}&times;{book.specs.trim.height}&quot;
              &middot; {pages.length} pages
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="text-xs text-amber-600 font-medium">
              Unsaved changes
            </span>
          )}
          {lastSaved && !dirty && (
            <span className="text-xs text-green-600">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {selectedPage !== null && (
            <button
              onClick={() => setSelectedPage(null)}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Back to Gallery
            </button>
          )}
          <a
            href={`/proof?project=${slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Proof View
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        {selectedPage === null ? (
          <SpreadGallery
            slug={slug}
            pages={pages}
            layout={layout}
            book={book}
            onSelectPage={setSelectedPage}
          />
        ) : (
          <PageEditor
            slug={slug}
            book={book}
            pages={pages}
            layout={layout}
            selectedPage={selectedPage}
            onLayoutChange={handleLayoutChange}
            onPageChange={setSelectedPage}
            dirty={dirty}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </main>
    </div>
  );
}
