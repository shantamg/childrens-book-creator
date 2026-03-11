"use client";

import { Rnd } from "react-rnd";
import type { TextOverlay } from "@/app/lib/types";
import {
  pixelsToPercent,
  percentToPixels,
  ContainerDimensions,
  REFERENCE_WIDTH,
} from "@/app/lib/coordinate-utils";

interface TextBoxProps {
  overlay: TextOverlay;
  index: number;
  isSelected: boolean;
  containerDimensions: ContainerDimensions;
  onUpdate: (index: number, changes: Partial<TextOverlay>) => void;
  onSelect: (index: number) => void;
}

export function TextBox({
  overlay,
  index,
  isSelected,
  containerDimensions,
  onUpdate,
  onSelect,
}: TextBoxProps) {
  const pixels = percentToPixels(
    overlay.leftPercent,
    overlay.topPercent,
    overlay.widthPercent,
    overlay.heightPercent,
    containerDimensions
  );

  const scaledFontSize = Math.round(
    overlay.fontSize * (containerDimensions.width / REFERENCE_WIDTH)
  );

  return (
    <Rnd
      position={{ x: pixels.x, y: pixels.y }}
      size={{ width: pixels.width, height: pixels.height }}
      bounds="parent"
      minWidth={50}
      minHeight={30}
      enableResizing={isSelected}
      disableDragging={false}
      onDragStop={(_e, data) => {
        const pct = pixelsToPercent(
          data.x,
          data.y,
          pixels.width,
          pixels.height,
          containerDimensions
        );
        onUpdate(index, {
          leftPercent: pct.leftPercent,
          topPercent: pct.topPercent,
        });
      }}
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        const newWidth = parseInt(ref.style.width, 10);
        const newHeight = parseInt(ref.style.height, 10);
        const pct = pixelsToPercent(
          position.x,
          position.y,
          newWidth,
          newHeight,
          containerDimensions
        );
        onUpdate(index, {
          leftPercent: pct.leftPercent,
          topPercent: pct.topPercent,
          widthPercent: pct.widthPercent,
          heightPercent: pct.heightPercent,
        });
      }}
      onMouseDown={() => onSelect(index)}
      style={{
        zIndex: isSelected ? 10 : 1,
        cursor: isSelected ? "move" : "pointer",
        outline: isSelected ? "2px solid rgba(59, 130, 246, 0.8)" : "none",
        outlineOffset: "0px",
        backgroundColor: isSelected
          ? "rgba(59, 130, 246, 0.05)"
          : "transparent",
      }}
    >
      <div
        style={{
          fontFamily: `"${overlay.font}", sans-serif`,
          fontSize: `${scaledFontSize}px`,
          lineHeight: overlay.lineHeight,
          letterSpacing: `${overlay.letterSpacing}em`,
          color: overlay.color,
          textAlign: overlay.align,
          width: "100%",
          height: "100%",
          padding: "4px",
          overflow: "hidden",
          wordWrap: "break-word",
          whiteSpace: "pre-wrap",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {overlay.content}
      </div>
    </Rnd>
  );
}
