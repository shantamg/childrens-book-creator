#!/usr/bin/env python3
"""Render text overlays onto print-ready images using Playwright.

Uses the "bait and switch" technique:
- Viewport set to preview dimensions for correct CSS layout
- deviceScaleFactor scales up to match print resolution
- Chromium renders text with perfect anti-aliasing and kerning
- Screenshot captures at full print resolution

Handles both single text objects and arrays of text overlays per page.

Data sources (in priority order):
1. ICM format: layout.yaml (text positioning), book.yaml (typography defaults),
   story/page-NN.md (page type/folder from frontmatter)
2. Legacy fallback: story.json (all-in-one)
"""

import argparse
import json
import sys
from pathlib import Path

import frontmatter
import yaml
from playwright.sync_api import sync_playwright


def build_html(image_path: str, text_overlays: list, fonts_dir: Path, preview_width: int = 1200) -> str:
    """Build HTML page with image and text overlays."""

    # Collect unique fonts
    font_faces = []
    fonts_used = set()
    for overlay in text_overlays:
        font = overlay.get("font", "serif")
        if font not in fonts_used:
            fonts_used.add(font)
            # Check for local font file
            for ext in [".ttf", ".otf"]:
                font_file = fonts_dir / f"{font}{ext}"
                if not font_file.exists():
                    # Try with different naming
                    for f in fonts_dir.glob(f"*{ext}"):
                        if font.lower().replace(" ", "") in f.stem.lower().replace(" ", "").replace("-", "").replace("_", ""):
                            font_file = f
                            break
                if font_file.exists():
                    font_faces.append(f"""
                        @font-face {{
                            font-family: '{font}';
                            src: url('file://{font_file.absolute()}');
                        }}
                    """)
                    break
            else:
                # Try Google Fonts import
                font_faces.append(f"""
                    @import url('https://fonts.googleapis.com/css2?family={font.replace(" ", "+")}:wght@300;400;500;600;700&display=swap');
                """)

    font_css = "\n".join(font_faces)

    # Build overlay divs
    overlay_divs = []
    for overlay in text_overlays:
        content = overlay.get("content", "")
        font = overlay.get("font", "serif")
        font_size = overlay.get("fontSize", 42)
        line_height = overlay.get("lineHeight", 1.2)
        letter_spacing = overlay.get("letterSpacing", 0)
        color = overlay.get("color", "#000000")
        align = overlay.get("align", "left")
        left = overlay.get("leftPercent", 10)
        top = overlay.get("topPercent", 70)
        width = overlay.get("widthPercent", 80)
        height = overlay.get("heightPercent", 20)

        # Background properties
        bg_enabled = overlay.get("bgEnabled", False)
        bg_color = overlay.get("bgColor", "#ffffff")
        bg_opacity = overlay.get("bgOpacity", 0.75)
        bg_radius = overlay.get("bgRadius", 12)
        bg_padding = overlay.get("bgPadding", 16)

        # Convert hex to rgba
        if bg_enabled:
            r = int(bg_color[1:3], 16)
            g = int(bg_color[3:5], 16)
            b = int(bg_color[5:7], 16)
            bg_rgba = f"rgba({r}, {g}, {b}, {bg_opacity})"
            bg_style = f"background-color: {bg_rgba}; border-radius: {bg_radius}px;"
            padding_value = f"{bg_padding}px"
        else:
            bg_style = ""
            padding_value = "10px"

        # Convert newlines to <br> and preserve spaces
        html_content = content.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        html_content = html_content.replace("\n", "<br>")
        # Preserve multiple spaces
        html_content = html_content.replace("  ", " &nbsp;")

        overlay_divs.append(f"""
            <div style="
                position: absolute;
                left: {left}%;
                top: {top}%;
                width: {width}%;
                font-family: '{font}', serif;
                font-size: {font_size}px;
                line-height: {line_height};
                letter-spacing: {letter_spacing}px;
                color: {color};
                text-align: {align};
                padding: {padding_value};
                white-space: pre-wrap;
                overflow: visible;
                box-sizing: border-box;
                {bg_style}
            ">{html_content}</div>
        """)

    overlays_html = "\n".join(overlay_divs)

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    {font_css}
    * {{ margin: 0; padding: 0; }}
    body {{
        width: {preview_width}px;
        height: {preview_width}px;
        overflow: hidden;
    }}
    .page-container {{
        position: relative;
        width: {preview_width}px;
        height: {preview_width}px;
    }}
    .page-container img {{
        width: 100%;
        height: 100%;
        display: block;
    }}
</style>
</head>
<body>
    <div class="page-container">
        <img src="file://{image_path}" />
        {overlays_html}
    </div>
</body>
</html>"""


def render_page(page_num: int, image_path: Path, text_overlays: list,
                output_path: Path, fonts_dir: Path, browser,
                preview_width: int = 1200, print_width: int = 2625) -> bool:
    """Render a single page with text overlays."""

    scale_factor = print_width / preview_width

    html = build_html(str(image_path.absolute()), text_overlays, fonts_dir, preview_width)

    # Write HTML to temp file
    html_file = output_path.parent / f"_temp_render_{page_num}.html"
    html_file.parent.mkdir(parents=True, exist_ok=True)
    html_file.write_text(html)

    try:
        context = browser.new_context(
            viewport={"width": preview_width, "height": preview_width},
            device_scale_factor=scale_factor,
        )
        page = context.new_page()

        # Load the page and wait for fonts + image
        page.goto(f"file://{html_file.absolute()}")
        page.wait_for_load_state("networkidle")
        # Extra wait for font loading
        page.wait_for_timeout(1000)

        # Screenshot at full print resolution
        output_path.parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(output_path), full_page=False)

        context.close()
        return True
    finally:
        html_file.unlink(missing_ok=True)


def load_page_info_from_markdown(story_dir: Path) -> dict:
    """Load page metadata from story/page-NN.md frontmatter files.

    Returns dict keyed by page number with type and folder.
    """
    pages = {}
    for md_file in sorted(story_dir.glob("page-*.md")):
        text = md_file.read_text()
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                meta = yaml.safe_load(parts[1]) or {}
                page_num = meta.get("page")
                if page_num is not None:
                    pages[page_num] = {
                        "type": meta.get("type", "story"),
                        "folder": meta.get("folder", ""),
                    }
    return pages


def load_pages_icm(project_path: Path) -> list:
    """Load page data from ICM format (layout.yaml + book.yaml + story/*.md).

    Returns a list of dicts matching the legacy story.json page format,
    so downstream rendering logic stays the same.
    """
    layout_path = project_path / "layout.yaml"
    book_path = project_path / "book.yaml"
    story_dir = project_path / "story"

    with open(layout_path) as f:
        layout = yaml.safe_load(f)

    with open(book_path) as f:
        book = yaml.safe_load(f)

    # Load page metadata from markdown frontmatter
    page_info = load_page_info_from_markdown(story_dir)

    # Typography defaults from book.yaml
    default_font = book.get("typography", {}).get("font", "serif")

    layout_pages = layout.get("pages", {})

    # Build ordered page list using book.yaml pageOrder (or layout keys)
    page_order = book.get("pageOrder", sorted(layout_pages.keys()))

    pages = []
    for page_num in page_order:
        info = page_info.get(page_num, {})
        page_type = info.get("type", "story")
        folder = info.get("folder", "")

        text_overlays = layout_pages.get(page_num)

        # Apply default font from book.yaml if not set per-overlay
        if text_overlays:
            for overlay in text_overlays:
                if "font" not in overlay:
                    overlay["font"] = default_font

        pages.append({
            "pageNumber": page_num,
            "type": page_type,
            "folder": folder,
            "text": text_overlays,
        })

    return pages


def load_pages_legacy(project_path: Path) -> list:
    """Load page data from legacy story.json format."""
    story_path = project_path / "story.json"
    with open(story_path) as f:
        story = json.load(f)
    return story["pages"]


def find_page_image(pages_dir: Path, page_num, page_info: dict) -> Path | None:
    """Find the best available image for a page, checking multiple locations."""
    folder = page_info.get("folder", "")
    num = int(page_num)

    # Build candidate folder names
    candidate_folders = []
    if folder:
        candidate_folders.append(folder)
    # Standard naming: NNN-pageN
    candidate_folders.append(f"{num:03d}-page{num}")

    for folder_name in candidate_folders:
        page_dir = pages_dir / folder_name

        if not page_dir.exists():
            continue

        # Priority order: print-ready > approved > any png
        print_ready = page_dir / "print-ready" / "page.png"
        if print_ready.exists():
            return print_ready

        approved = page_dir / "approved.png"
        if approved.exists():
            return approved

        # Any png in the folder (not in subdirs)
        pngs = sorted(page_dir.glob("*.png"))
        if pngs:
            return pngs[0]

        # Any jpeg
        for ext in ["*.jpeg", "*.jpg"]:
            jpegs = sorted(page_dir.glob(ext))
            if jpegs:
                return jpegs[0]

    return None


def main():
    parser = argparse.ArgumentParser(description="Render text overlays onto print-ready images.")
    parser.add_argument("--project", type=str, default=None,
                        help="Path to the project directory (e.g. projects/whats-not-in-here)")
    parser.add_argument("--page", type=int, default=None,
                        help="Render only this page number (for quick preview)")
    parser.add_argument("--preview", action="store_true",
                        help="Render at preview resolution (1200px) instead of print resolution")
    args = parser.parse_args()

    # Resolve project path
    repo_root = Path(__file__).resolve().parent.parent
    if args.project:
        project_path = Path(args.project)
        if not project_path.is_absolute():
            project_path = repo_root / project_path
    else:
        print("ERROR: No --project specified. Usage: render-text.py --project projects/<slug>")
        sys.exit(1)

    pages_dir = project_path / "pages"
    fonts_dir = project_path / "fonts"

    preview_width = 1200
    print_width = preview_width if args.preview else 2625  # 8.75" x 300 DPI

    # Load page data: prefer ICM format, fall back to legacy
    layout_path = project_path / "layout.yaml"
    story_path = project_path / "story.json"

    if layout_path.exists():
        print(f"Reading ICM format from {project_path}")
        pages = load_pages_icm(project_path)
    elif story_path.exists():
        print(f"Reading legacy format from {story_path}")
        pages = load_pages_legacy(project_path)
    else:
        print(f"ERROR: No layout.yaml or story.json found in {project_path}")
        sys.exit(1)

    # Filter to single page if --page specified
    if args.page is not None:
        pages = [p for p in pages if int(p["pageNumber"]) == args.page]
        if not pages:
            print(f"ERROR: Page {args.page} not found in layout")
            sys.exit(1)

    with sync_playwright() as p:
        browser = p.chromium.launch()

        for page_spec in pages:
            page_num = page_spec["pageNumber"]
            page_type = page_spec.get("type", "story")
            text_data = page_spec.get("text")

            if not text_data:
                print(f"  Page {page_num}: no text, skipping")
                continue

            # Normalize text to list
            if isinstance(text_data, dict):
                text_overlays = [text_data]
            elif isinstance(text_data, list):
                text_overlays = text_data
            else:
                print(f"  Page {page_num}: unexpected text format, skipping")
                continue

            # Find input image (searches multiple locations)
            input_image = find_page_image(pages_dir, page_num, page_spec)

            if not input_image:
                if page_type in ("spread-start", "spread-companion"):
                    print(f"  Page {page_num}: {page_type}, no image found, skipping")
                    continue
                print(f"  Page {page_num}: no image found, skipping")
                continue

            page_dir = input_image.parent
            if page_dir.name == "print-ready":
                page_dir = page_dir.parent

            output_image = page_dir / "print-text-browser" / "page.png"

            try:
                success = render_page(
                    page_num, input_image, text_overlays, output_image,
                    fonts_dir, browser, preview_width, print_width
                )
                if success:
                    print(f"  Page {page_num}: rendered")
                else:
                    print(f"  Page {page_num}: FAILED")
            except Exception as e:
                print(f"  Page {page_num}: ERROR - {e}")

        browser.close()

    print("\nDone!")


if __name__ == "__main__":
    main()
