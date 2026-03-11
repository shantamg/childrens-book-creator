#!/usr/bin/env python3
"""Draw hardcover template guide lines onto a cover image.

Based on OnPress Square Hard Cover template (19.026" x 10.0"):
- PINK  = Bleed edge (image extends to here, gets trimmed off)
- RED   = Trim line (final cut edge) - 0.625" from bleed edge
- GREEN = Safety zone - 0.188" inside trim
- BLUE DASHED = Spine fold lines
- YELLOW = Spine center

Usage: python3 scripts/cover-guide.py [--project projects/whats-not-in-here] [path-to-image]
       Defaults to pages/cover.png

Data sources (in priority order):
1. ICM format: book.yaml (specs for trim/bleed dimensions)
2. Legacy fallback: project.json or hardcoded defaults
"""

import argparse
import json
import sys
from pathlib import Path

import yaml
from PIL import Image, ImageDraw, ImageFont

# Template dimensions (inches) - defaults for hardcover
CANVAS_W = 19.026
CANVAS_H = 10.0

# All positions in inches from top-left
TRIM_INSET = 0.625          # Trim line distance from bleed edge
SAFETY_INSET = 0.813        # Safety distance from bleed edge
SPINE_LEFT = 9.375          # Left spine fold
SPINE_RIGHT = 9.651         # Right spine fold
SPINE_CENTER = (SPINE_LEFT + SPINE_RIGHT) / 2


def inch_to_px(inches_x, inches_y, img_w, img_h):
    """Convert inch position to pixel position."""
    return (inches_x / CANVAS_W * img_w, inches_y / CANVAS_H * img_h)


def draw_labeled_line(draw, x1, y1, x2, y2, color, label, img_w, img_h, width=3, dashed=False):
    """Draw a line with optional dashing."""
    if dashed:
        # Draw dashed
        if x1 == x2:  # vertical
            for y in range(int(y1), int(y2), 20):
                draw.line([(x1, y), (x2, min(y + 12, y2))], fill=color, width=width)
        else:  # horizontal
            for x in range(int(x1), int(x2), 20):
                draw.line([(x, y1), (min(x + 12, x2), y2)], fill=color, width=width)
    else:
        draw.line([(x1, y1), (x2, y2)], fill=color, width=width)


def annotate_cover(image_path: Path, output_path: Path):
    img = Image.open(image_path).convert("RGBA")
    w, h = img.size

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Helper to convert inches to pixels
    def px(ix, iy):
        return (ix / CANVAS_W * w, iy / CANVAS_H * h)

    def px_x(ix):
        return ix / CANVAS_W * w

    def px_y(iy):
        return iy / CANVAS_H * h

    line_w = max(2, w // 500)

    # === TRIM lines (RED) ===
    trim_l = px_x(TRIM_INSET)
    trim_r = px_x(CANVAS_W - TRIM_INSET)
    trim_t = px_y(TRIM_INSET)
    trim_b = px_y(CANVAS_H - TRIM_INSET)
    trim_color = (255, 0, 0, 200)

    draw.rectangle([trim_l, trim_t, trim_r, trim_b], outline=trim_color, width=line_w)

    # === SAFETY lines (GREEN) - back cover ===
    safe_color = (0, 180, 0, 200)
    # Back cover safety
    sl = px_x(SAFETY_INSET)
    sr = px_x(SPINE_LEFT - (SAFETY_INSET - TRIM_INSET))  # 8.756"
    st = px_y(SAFETY_INSET)
    sb = px_y(CANVAS_H - SAFETY_INSET)
    draw.rectangle([sl, st, sr, sb], outline=safe_color, width=line_w)

    # Front cover safety
    fl = px_x(SPINE_RIGHT + (SAFETY_INSET - TRIM_INSET))  # 10.270"
    fr = px_x(CANVAS_W - SAFETY_INSET)
    draw.rectangle([fl, st, fr, sb], outline=safe_color, width=line_w)

    # === SPINE fold lines (BLUE dashed) ===
    spine_color = (0, 100, 255, 220)
    sx_l = px_x(SPINE_LEFT)
    sx_r = px_x(SPINE_RIGHT)
    sy_t = px_y(TRIM_INSET)
    sy_b = px_y(CANVAS_H - TRIM_INSET)

    # Dashed vertical lines for spine folds
    dash_len = max(8, h // 80)
    gap_len = max(5, h // 120)
    for y in range(int(sy_t), int(sy_b), dash_len + gap_len):
        ye = min(y + dash_len, int(sy_b))
        draw.line([(sx_l, y), (sx_l, ye)], fill=spine_color, width=line_w)
        draw.line([(sx_r, y), (sx_r, ye)], fill=spine_color, width=line_w)

    # Spine center (YELLOW thin)
    sx_c = px_x(SPINE_CENTER)
    center_color = (255, 220, 0, 180)
    for y in range(int(sy_t), int(sy_b), dash_len + gap_len):
        ye = min(y + dash_len, int(sy_b))
        draw.line([(sx_c, y), (sx_c, ye)], fill=center_color, width=max(1, line_w - 1))

    # === Shade the bleed area ===
    bleed_shade = (255, 0, 0, 30)
    # Top bleed
    draw.rectangle([0, 0, w, trim_t], fill=bleed_shade)
    # Bottom bleed
    draw.rectangle([0, trim_b, w, h], fill=bleed_shade)
    # Left bleed
    draw.rectangle([0, trim_t, trim_l, trim_b], fill=bleed_shade)
    # Right bleed
    draw.rectangle([trim_r, trim_t, w, trim_b], fill=bleed_shade)

    # === Shade spine area ===
    spine_shade = (0, 100, 255, 40)
    draw.rectangle([sx_l, trim_t, sx_r, trim_b], fill=spine_shade)

    # === LABELS ===
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", max(14, w // 80))
        font_sm = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", max(11, w // 100))
    except:
        font = ImageFont.load_default()
        font_sm = font

    label_bg = (0, 0, 0, 140)

    def draw_label(x, y, text, color, f=font):
        bbox = f.getbbox(text)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        draw.rectangle([x - 2, y - 1, x + tw + 4, y + th + 2], fill=label_bg)
        draw.text((x, y), text, fill=color, font=f)

    # Back cover label
    back_cx = px_x((TRIM_INSET + SPINE_LEFT) / 2)
    draw_label(back_cx - 40, px_y(CANVAS_H / 2), "BACK COVER", (255, 255, 255, 220))

    # Front cover label
    front_cx = px_x((SPINE_RIGHT + CANVAS_W - TRIM_INSET) / 2)
    draw_label(front_cx - 40, px_y(CANVAS_H / 2), "FRONT COVER", (255, 255, 255, 220))

    # Spine label
    draw_label(sx_c - 10, px_y(CANVAS_H * 0.3), "S", (200, 200, 255, 220), font_sm)

    # Line labels in legend area
    legend_x = px_x(0.8)
    legend_y = px_y(8.0)
    draw_label(legend_x, legend_y, "RED = Trim", trim_color)
    draw_label(legend_x, legend_y + 18, "GREEN = Safety", safe_color)
    draw_label(legend_x, legend_y + 36, "BLUE = Spine fold", spine_color)
    draw_label(legend_x, legend_y + 54, "Shaded = Bleed (cut off)", (255, 100, 100, 200))

    # Dimensions
    draw_label(px_x(1), px_y(0.2), f"Full canvas: {CANVAS_W}\" x {CANVAS_H}\" ({w}x{h}px)", (255, 255, 255, 200), font_sm)
    draw_label(px_x(1), px_y(0.2) + 16, f"Need: 5708x3000px at 300 DPI", (255, 200, 100, 200), font_sm)
    spine_w = SPINE_RIGHT - SPINE_LEFT
    draw_label(px_x(1), px_y(0.2) + 32, f"Each panel trim: 8.75\" x 8.75\"  |  Spine: {spine_w:.3f}\"  |  Bleed: {TRIM_INSET}\"", (255, 255, 255, 200), font_sm)

    result = Image.alpha_composite(img, overlay).convert("RGB")
    result.save(str(output_path), quality=95)
    print(f"Saved: {output_path}")
    print(f"Image size: {w}x{h}px (needs 5708x3000 for 300 DPI)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Draw cover template guide lines onto a cover image.")
    parser.add_argument("--project", type=str, default=None,
                        help="Path to the project directory (e.g. projects/whats-not-in-here)")
    parser.add_argument("image", nargs="?", default=None,
                        help="Path to the cover image (defaults to pages/cover.png in the project)")
    args = parser.parse_args()

    # Resolve project path
    repo_root = Path(__file__).resolve().parent.parent
    if args.project:
        project_dir = Path(args.project)
        if not project_dir.is_absolute():
            project_dir = repo_root / project_dir
    else:
        print("ERROR: No --project specified. Usage: cover-guide.py --project projects/<slug>")
        sys.exit(1)

    # Load specs from book.yaml (ICM) or project.json (legacy)
    book_path = project_dir / "book.yaml"
    project_json_path = project_dir / "project.json"

    if book_path.exists():
        with open(book_path) as f:
            book = yaml.safe_load(f)
        specs = book.get("specs", {})
        # Specs are available for future use if cover template values
        # need to be derived from project specs rather than hardcoded
        print(f"Reading specs from {book_path}")
    elif project_json_path.exists():
        with open(project_json_path) as f:
            project = json.load(f)
        specs = project.get("specs", {})
        print(f"Reading specs from {project_json_path}")

    input_path = Path(args.image) if args.image else project_dir / "pages" / "cover.png"
    output_path = project_dir / "output" / "cover-guide-preview.jpg"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    annotate_cover(input_path, output_path)
