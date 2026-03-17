"use client";

import type { TextOverlay } from "@/app/lib/types";
import { FontPicker } from "./FontPicker";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Plus,
  RotateCcw,
} from "lucide-react";

interface TextToolbarProps {
  overlays: TextOverlay[];
  selectedOverlay: TextOverlay | null;
  selectedIndex: number | null;
  defaultFont: string;
  defaultSize: number;
  onUpdate: (index: number, changes: Partial<TextOverlay>) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  onSelect: (index: number | null) => void;
}

export function TextToolbar({
  overlays,
  selectedOverlay,
  selectedIndex,
  defaultFont,
  defaultSize,
  onUpdate,
  onRemove,
  onAdd,
  onSelect,
}: TextToolbarProps) {
  const handleResetToDefaults = () => {
    if (selectedIndex === null) return;
    onUpdate(selectedIndex, {
      font: defaultFont,
      fontSize: defaultSize,
      lineHeight: 1.2,
      letterSpacing: 0,
      color: "#000000",
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">Text Overlays</h3>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-gray-200 hover:bg-gray-300 text-gray-900"
        >
          <Plus className="w-3 h-3" />
          Add Text
        </button>
      </div>

      {/* Overlay list */}
      {overlays.length > 0 && (
        <div className="space-y-1">
          {overlays.map((overlay, i) => (
            <div
              key={i}
              onClick={() => onSelect(i)}
              className={`flex items-center justify-between px-2 py-1.5 rounded text-sm cursor-pointer ${
                selectedIndex === i
                  ? "bg-blue-50 border border-blue-200 text-gray-900"
                  : "bg-gray-100 border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="truncate flex-1">
                {overlay.content.slice(0, 40) || "Empty"}
                {overlay.content.length > 40 ? "..." : ""}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
                className="ml-2 text-gray-500 hover:text-red-400 shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {overlays.length === 0 && (
        <p className="text-xs text-gray-500">
          No text overlays yet. Click &quot;Add Text&quot; to create one.
        </p>
      )}

      {/* Editing controls for selected overlay */}
      {selectedIndex !== null && selectedOverlay && (
        <div className="border-t border-gray-200 pt-3 space-y-3">
          {/* Content textarea */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Content</label>
            <textarea
              rows={4}
              value={selectedOverlay.content}
              onChange={(e) =>
                onUpdate(selectedIndex, { content: e.target.value })
              }
              className="w-full bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded px-2 py-1.5 resize-y"
              placeholder="Enter text here..."
            />
          </div>

          {/* Font */}
          <FontPicker
            currentFont={selectedOverlay.font}
            onFontChange={(font) => onUpdate(selectedIndex, { font })}
          />

          {/* Size / Line Height / Spacing */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Size</label>
              <input
                type="number"
                min={8}
                max={200}
                step={1}
                value={selectedOverlay.fontSize}
                onChange={(e) =>
                  onUpdate(selectedIndex, {
                    fontSize: Number(e.target.value),
                  })
                }
                className="w-full bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded px-2 py-1"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Line H</label>
              <input
                type="number"
                min={0.5}
                max={3}
                step={0.05}
                value={selectedOverlay.lineHeight}
                onChange={(e) =>
                  onUpdate(selectedIndex, {
                    lineHeight: Number(e.target.value),
                  })
                }
                className="w-full bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded px-2 py-1"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Spacing</label>
              <input
                type="number"
                min={-0.1}
                max={0.5}
                step={0.01}
                value={selectedOverlay.letterSpacing}
                onChange={(e) =>
                  onUpdate(selectedIndex, {
                    letterSpacing: Number(e.target.value),
                  })
                }
                className="w-full bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded px-2 py-1"
              />
            </div>
          </div>

          {/* Color + Alignment */}
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Color</label>
              <input
                type="color"
                value={selectedOverlay.color}
                onChange={(e) =>
                  onUpdate(selectedIndex, { color: e.target.value })
                }
                className="bg-gray-100 border border-gray-300 rounded h-8 w-12 cursor-pointer"
              />
            </div>

            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => onUpdate(selectedIndex, { align })}
                  className={`p-1.5 rounded ${
                    selectedOverlay.align === align
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                  {align === "center" && (
                    <AlignCenter className="w-3.5 h-3.5" />
                  )}
                  {align === "right" && (
                    <AlignRight className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Background */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bgEnabled"
                checked={selectedOverlay.bgEnabled ?? false}
                onChange={(e) =>
                  onUpdate(selectedIndex, { bgEnabled: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <label htmlFor="bgEnabled" className="text-xs text-gray-500">
                Background
              </label>
            </div>

            {(selectedOverlay.bgEnabled ?? false) && (
              <div className="space-y-2 pl-1">
                <div className="flex items-end gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Color</label>
                    <input
                      type="color"
                      value={selectedOverlay.bgColor ?? "#ffffff"}
                      onChange={(e) =>
                        onUpdate(selectedIndex, { bgColor: e.target.value })
                      }
                      className="bg-gray-100 border border-gray-300 rounded h-8 w-12 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <label className="text-xs text-gray-500">Opacity</label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={selectedOverlay.bgOpacity ?? 0.75}
                      onChange={(e) =>
                        onUpdate(selectedIndex, {
                          bgOpacity: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <div className="text-[10px] text-gray-400 text-right">
                      {((selectedOverlay.bgOpacity ?? 0.75) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Radius</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={1}
                      value={selectedOverlay.bgRadius ?? 12}
                      onChange={(e) =>
                        onUpdate(selectedIndex, {
                          bgRadius: Number(e.target.value),
                        })
                      }
                      className="w-full bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded px-2 py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Padding</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={1}
                      value={selectedOverlay.bgPadding ?? 16}
                      onChange={(e) =>
                        onUpdate(selectedIndex, {
                          bgPadding: Number(e.target.value),
                        })
                      }
                      className="w-full bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded px-2 py-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Position display (read-only) */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "L%", value: selectedOverlay.leftPercent },
              { label: "T%", value: selectedOverlay.topPercent },
              { label: "W%", value: selectedOverlay.widthPercent },
              { label: "H%", value: selectedOverlay.heightPercent },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-0.5">
                <label className="text-[10px] text-gray-400">{label}</label>
                <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
                  {value.toFixed(1)}
                </div>
              </div>
            ))}
          </div>

          {/* Reset to Defaults */}
          <div className="border-t border-gray-200 pt-3">
            <button
              onClick={handleResetToDefaults}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded px-2 py-1 w-full"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
