#!/usr/bin/env python3
"""Draw safe zone guides on text-rendered page images.

Zones (from OnPress Square template):
- Full image = 8.75" x 8.75" (includes bleed)
- RED line = Trim line at 0.125" from edge (page gets cut here)
- BLUE dashed = Safety margin:
    - Top/bottom: 0.44" from doc edge
    - Gutter side (binding): 1.0" from doc edge
    - Outer side: 0.44" from doc edge

Page side convention (with blank page 1 prepended):
- PDF odd pages (1,3,5...) = right-hand (recto) -> gutter on LEFT
- PDF even pages (2,4,6...) = left-hand (verso) -> gutter on RIGHT

Since we prepend a blank page, story page N becomes PDF page N+1.

Data sources (in priority order):
1. ICM format: book.yaml (specs for dimensions), story/page-NN.md (page type/folder)
2. Legacy fallback: story.json (all-in-one)
"""

import argparse
import json
import sys
from pathlib import Path

import frontmatter
import yaml
from PIL import Image, ImageDraw


LINE_WIDTH = 4


def get_zone_params(specs: dict) -> dict:
    """Compute pixel zone parameters from project specs.

    specs should have: trim (width/height), bleed, safeZone, and optionally resolution.
    """
    trim_w = specs.get("trim", {}).get("width", 8.5)
    trim_h = specs.get("trim", {}).get("height", 8.5)
    bleed = specs.get("bleed", 0.125)
    resolution = specs.get("resolution", 300)

    full_w = trim_w + (bleed * 2)
    full_h = trim_h + (bleed * 2)

    px_per_inch = resolution

    return {
        "trim": round(bleed * px_per_inch),
        "safety_outer": round(0.44 * px_per_inch),
        "safety_gutter": round(1.0 * px_per_inch),
        "px_per_inch": px_per_inch,
    }


def draw_dashed_line(draw, x1, y1, x2, y2, color, width=3, dash_len=20, gap_len=15):
    """Draw a single dashed line (horizontal or vertical)."""
    if x1 == x2:  # vertical
        for start_y in range(min(y1, y2), max(y1, y2), dash_len + gap_len):
            end_y = min(start_y + dash_len, max(y1, y2))
            draw.line([(x1, start_y), (x2, end_y)], fill=color, width=width)
    else:  # horizontal
        for start_x in range(min(x1, x2), max(x1, x2), dash_len + gap_len):
            end_x = min(start_x + dash_len, max(x1, x2))
            draw.line([(start_x, y1), (end_x, y2)], fill=color, width=width)


def draw_dashed_rect(draw, x1, y1, x2, y2, color, width=3, dash_len=20, gap_len=15):
    """Draw a dashed rectangle."""
    draw_dashed_line(draw, x1, y1, x2, y1, color, width, dash_len, gap_len)  # top
    draw_dashed_line(draw, x1, y2, x2, y2, color, width, dash_len, gap_len)  # bottom
    draw_dashed_line(draw, x1, y1, x1, y2, color, width, dash_len, gap_len)  # left
    draw_dashed_line(draw, x2, y1, x2, y2, color, width, dash_len, gap_len)  # right


def annotate_page(image_path: Path, output_path: Path, label: str, gutter_side: str,
                  trim: int, safety_outer: int, safety_gutter: int):
    """Draw trim and safety zones on an image.

    gutter_side: 'left' or 'right' -- which side has the binding
    """
    img = Image.open(image_path).convert("RGBA")
    w, h = img.size

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Shade the bleed area (outside trim) with semi-transparent red
    draw.rectangle([0, 0, w, trim], fill=(255, 0, 0, 40))           # top
    draw.rectangle([0, h - trim, w, h], fill=(255, 0, 0, 40))       # bottom
    draw.rectangle([0, trim, trim, h - trim], fill=(255, 0, 0, 40)) # left
    draw.rectangle([w - trim, trim, w, h - trim], fill=(255, 0, 0, 40))  # right

    # RED solid line = Trim line
    draw.rectangle(
        [trim, trim, w - trim - 1, h - trim - 1],
        outline=(255, 0, 0, 220), width=LINE_WIDTH
    )

    # BLUE dashed line = Safety margin (asymmetric for gutter)
    if gutter_side == "left":
        safety_left = safety_gutter
        safety_right = safety_outer
    else:
        safety_left = safety_outer
        safety_right = safety_gutter

    draw_dashed_rect(
        draw,
        safety_left, safety_outer,
        w - safety_right, h - safety_outer,
        color=(0, 100, 255, 200), width=LINE_WIDTH
    )

    result = Image.alpha_composite(img, overlay).convert("RGB")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    result.save(str(output_path), quality=90)
    side_label = f"gutter {'LEFT' if gutter_side == 'left' else 'RIGHT'}"
    print(f"  {label} ({side_label}): {output_path.name}")


def load_page_info_from_markdown(story_dir: Path) -> dict:
    """Load page metadata from story/page-NN.md frontmatter files.

    Returns dict keyed by page number with type and folder.
    """
    pages = {}
    for md_file in sorted(story_dir.glob("page-*.md")):
        post = frontmatter.load(str(md_file))
        meta = post.metadata
        page_num = meta.get("page")
        if page_num is not None:
            pages[page_num] = {
                "type": meta.get("type", "story"),
                "folder": meta.get("folder", ""),
            }
    return pages


def load_pages_icm(project_dir: Path) -> list:
    """Load ordered page list from ICM format (book.yaml + story/*.md).

    Returns list of dicts with pageNumber, type, folder.
    """
    book_path = project_dir / "book.yaml"
    with open(book_path) as f:
        book = yaml.safe_load(f)

    story_dir = project_dir / "story"
    page_info = load_page_info_from_markdown(story_dir)

    page_order = book.get("pageOrder", sorted(page_info.keys()))

    pages = []
    for page_num in page_order:
        info = page_info.get(page_num, {})
        pages.append({
            "pageNumber": page_num,
            "type": info.get("type", "story"),
            "folder": info.get("folder", ""),
        })

    return pages


def load_pages_legacy(story_path: Path) -> list:
    """Load page list from legacy story.json."""
    with open(story_path) as f:
        story = json.load(f)
    return story["pages"]


def main():
    parser = argparse.ArgumentParser(description="Draw safe zone guides on page images.")
    parser.add_argument("--project", type=str, default=None,
                        help="Path to the project directory (e.g. projects/whats-not-in-here)")
    args = parser.parse_args()

    # Resolve project path
    repo_root = Path(__file__).resolve().parent.parent
    if args.project:
        project_dir = Path(args.project)
        if not project_dir.is_absolute():
            project_dir = repo_root / project_dir
    else:
        print("ERROR: No --project specified. Usage: draw-safe-zones.py --project projects/<slug>")
        sys.exit(1)

    pages_dir = project_dir / "pages"
    output_dir = project_dir / "output" / "safe-zone-preview"

    # Load specs and pages: prefer ICM format, fall back to legacy
    book_path = project_dir / "book.yaml"
    story_path = project_dir / "story.json"

    if book_path.exists():
        print(f"Reading ICM format from {project_dir}")
        with open(book_path) as f:
            book = yaml.safe_load(f)
        specs = book.get("specs", {})
        pages = load_pages_icm(project_dir)
    elif story_path.exists():
        print(f"Reading legacy format from {story_path}")
        # Legacy: specs from project.json or hardcoded defaults
        project_json_path = project_dir / "project.json"
        if project_json_path.exists():
            with open(project_json_path) as f:
                project = json.load(f)
            specs = project.get("specs", {})
        else:
            specs = {"trim": {"width": 8.5, "height": 8.5}, "bleed": 0.125, "resolution": 300}
        pages = load_pages_legacy(story_path)
    else:
        print(f"ERROR: No book.yaml or story.json found in {project_dir}")
        sys.exit(1)

    # Compute zone parameters from specs
    zones = get_zone_params(specs)
    trim = zones["trim"]
    safety_outer = zones["safety_outer"]
    safety_gutter = zones["safety_gutter"]

    print(f"Trim line: {trim}px from edge ({specs.get('bleed', 0.125)}\")")
    print(f"Safety outer: {safety_outer}px (0.44\")")
    print(f"Safety gutter: {safety_gutter}px (1.0\")")
    print(f"Output: {output_dir}\n")

    # Track PDF page number (starts at 2 because blank page 1 is prepended)
    pdf_page = 1  # blank page

    for page in sorted(pages, key=lambda p: p["pageNumber"]):
        pn = page["pageNumber"]
        folder = page.get("folder", "")
        page_type = page.get("type", "story")
        page_dir = pages_dir / folder

        if page_type == "spread-start":
            # Left half = next PDF page, Right half = PDF page after
            pdf_page += 1
            left_gutter = "left" if pdf_page % 2 == 1 else "right"
            pdf_page += 1
            right_gutter = "left" if pdf_page % 2 == 1 else "right"

            # Annotate split halves if they exist
            for half, gutter in [("page-left", left_gutter), ("page-right", right_gutter)]:
                half_img = page_dir / "print-ready" / f"{half}.png"
                if half_img.exists():
                    side = "L" if "left" in half else "R"
                    out = output_dir / f"page_{pn:02d}-{pn+1:02d}_{side}.jpg"
                    annotate_page(half_img, out, f"Pages {pn}-{pn+1} {side}", gutter,
                                  trim, safety_outer, safety_gutter)
            continue

        if page_type == "spread-companion":
            continue

        # Single page
        pdf_page += 1
        # Odd PDF page = right-hand = gutter on left
        gutter_side = "left" if pdf_page % 2 == 1 else "right"

        img_text = page_dir / "print-text-browser" / "page.png"
        if not img_text.exists():
            print(f"  Page {pn}: no text-rendered image, skipping")
            continue

        out = output_dir / f"page_{pn:02d}.jpg"
        annotate_page(img_text, out, f"Page {pn} (PDF pg {pdf_page})", gutter_side,
                      trim, safety_outer, safety_gutter)

    print(f"\nDone! Check {output_dir}")


if __name__ == "__main__":
    main()
