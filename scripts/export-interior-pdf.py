#!/usr/bin/env python3
"""Export interior pages to print-ready PDF for OnPress printing.

Specs:
- 8.5" x 8.5" trim, 8.75" x 8.75" with 1/8" bleed
- 300 DPI (2625x2625 pixels per page)
- CMYK color via Ghostscript PDF/X-1a conversion
- 24 pages total (even count)
- Single page format (no reader spreads)

Image sources (in priority order):
1. print-text-browser/page.png  (text-rendered, for pages with text)
2. print-ready/page.png         (conformed, for pages without text)
3. print-ready/page-left.png / page-right.png  (for spread halves)

Data sources (in priority order):
1. ICM format: book.yaml (title/specs), story/page-NN.md (page type/folder),
   layout.yaml (to check which pages have text)
2. Legacy fallback: story.json (all-in-one)
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import frontmatter
import yaml
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas


REPO_ROOT = Path(__file__).resolve().parent.parent

# Ghostscript ICC profile — auto-detect or override with GS_ICC_PROFILE env var
_gs_icc = os.environ.get("GS_ICC_PROFILE")
if _gs_icc:
    ICC_PROFILE = Path(_gs_icc)
else:
    # Try common Homebrew locations
    _gs_base = Path("/opt/homebrew/Cellar/ghostscript")
    if _gs_base.exists():
        _versions = sorted(_gs_base.iterdir(), reverse=True)
        ICC_PROFILE = _versions[0] / "share/ghostscript/iccprofiles/default_cmyk.icc" if _versions else _gs_base
    else:
        ICC_PROFILE = Path("/usr/share/ghostscript/iccprofiles/default_cmyk.icc")

# Page dimensions (inches)
TRIM_SIZE = 8.5
BLEED = 0.125
PAGE_SIZE = TRIM_SIZE + (BLEED * 2)  # 8.75"


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


def get_page_sequence_icm(project_dir: Path, pages_dir: Path) -> list:
    """Build the page sequence from ICM format (book.yaml + story/*.md + layout.yaml)."""
    book_path = project_dir / "book.yaml"
    with open(book_path) as f:
        book = yaml.safe_load(f)

    # Load page metadata from markdown frontmatter
    story_dir = project_dir / "story"
    page_info = load_page_info_from_markdown(story_dir)

    # Check layout.yaml for which pages have text
    layout_path = project_dir / "layout.yaml"
    layout_pages = {}
    if layout_path.exists():
        with open(layout_path) as f:
            layout = yaml.safe_load(f)
        layout_pages = layout.get("pages", {})

    # Use pageOrder from book.yaml, or sorted page numbers
    page_order = book.get("pageOrder", sorted(page_info.keys()))

    sequence = []

    for page_num in page_order:
        info = page_info.get(page_num, {})
        page_type = info.get("type", "story")
        folder = info.get("folder", "")
        has_text = page_num in layout_pages and bool(layout_pages[page_num])
        page_dir = pages_dir / folder

        if page_type == "spread-start":
            # Left page of spread
            left_img = page_dir / "print-ready" / "page-left.png"
            sequence.append({"pageNumber": page_num, "image": left_img, "type": "spread-left"})

            # Right page of spread (companion)
            right_img = page_dir / "print-ready" / "page-right.png"
            companion_num = page_num + 1
            sequence.append({"pageNumber": companion_num, "image": right_img, "type": "spread-right"})

        elif page_type == "spread-companion":
            # Already handled by spread-start above
            continue

        else:
            # Single page - prefer text-rendered version
            if has_text:
                img = page_dir / "print-text-browser" / "page.png"
            else:
                img = page_dir / "print-ready" / "page.png"

            # Fallback
            if not img.exists():
                img = page_dir / "print-ready" / "page.png"

            sequence.append({"pageNumber": page_num, "image": img, "type": "single"})

    return sequence


def get_page_sequence_legacy(story_path: Path, pages_dir: Path) -> list:
    """Build the page sequence from legacy story.json format."""
    with open(story_path) as f:
        story = json.load(f)

    pages_by_num = {}
    for p in story["pages"]:
        pages_by_num[p["pageNumber"]] = p

    sequence = []

    for p in sorted(story["pages"], key=lambda x: x["pageNumber"]):
        pn = p["pageNumber"]
        folder = p.get("folder", "")
        page_type = p.get("type", "story")
        has_text = bool(p.get("text"))
        page_dir = pages_dir / folder

        if page_type == "spread-start":
            # Left page of spread
            left_img = page_dir / "print-ready" / "page-left.png"
            sequence.append({"pageNumber": pn, "image": left_img, "type": "spread-left"})

            # Right page of spread (companion)
            right_img = page_dir / "print-ready" / "page-right.png"
            companion_num = pn + 1
            sequence.append({"pageNumber": companion_num, "image": right_img, "type": "spread-right"})

        elif page_type == "spread-companion":
            # Already handled by spread-start above
            continue

        else:
            # Single page - prefer text-rendered version
            if has_text:
                img = page_dir / "print-text-browser" / "page.png"
            else:
                img = page_dir / "print-ready" / "page.png"

            # Fallback
            if not img.exists():
                img = page_dir / "print-ready" / "page.png"

            sequence.append({"pageNumber": pn, "image": img, "type": "single"})

    return sequence


def create_pdf(sequence: list, output_path: Path, pages_dir: Path,
               special_pages: dict = None) -> Path:
    """Create RGB PDF from page images using ReportLab.

    special_pages: dict from book.yaml specialPages config, e.g.
        {"titlePage": {"image": "title-page-print.png"},
         "aboutAuthor": {"image": "about-author/page.png"}}
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    special_pages = special_pages or {}

    page_size_pts = PAGE_SIZE * inch  # 8.75" in points
    c = canvas.Canvas(str(output_path), pagesize=(page_size_pts, page_size_pts))

    pdf_page = 0

    # Page 1: Title page (from specialPages config or legacy path)
    title_cfg = special_pages.get("titlePage", {})
    title_img = pages_dir / title_cfg.get("image", "title-page-print.png")
    if title_img.exists():
        c.drawImage(str(title_img), 0, 0, width=page_size_pts, height=page_size_pts)
        pdf_page += 1
        print(f"  Page {pdf_page:2d}: title page")
    else:
        c.setFillColorRGB(1, 1, 1)
        c.rect(0, 0, page_size_pts, page_size_pts, fill=1, stroke=0)
        pdf_page += 1
        print(f"  Page {pdf_page:2d}: blank (title page not found)")
    c.showPage()

    for entry in sequence:
        img = entry["image"]
        pdf_page += 1

        if not img.exists():
            print(f"  Page {pdf_page:2d}: WARNING - image not found: {img}")
            c.setFillColorRGB(1, 1, 1)
            c.rect(0, 0, page_size_pts, page_size_pts, fill=1, stroke=0)
            c.showPage()
            continue

        # Place image to fill entire page (image is already 8.75" @ 300 DPI)
        c.drawImage(
            str(img),
            0, 0,
            width=page_size_pts,
            height=page_size_pts,
        )
        print(f"  Page {pdf_page:2d}: story page {entry['pageNumber']} ({entry['type']})")
        c.showPage()

    # Blank page before About the Author
    c.setFillColorRGB(1, 1, 1)
    c.rect(0, 0, page_size_pts, page_size_pts, fill=1, stroke=0)
    pdf_page += 1
    print(f"  Page {pdf_page:2d}: blank (before About the Author)")
    c.showPage()

    # About the Author page (from specialPages config or legacy path)
    about_cfg = special_pages.get("aboutAuthor", {})
    about_img = pages_dir / about_cfg.get("image", "about-author/page.png")
    if about_img.exists():
        c.drawImage(str(about_img), 0, 0, width=page_size_pts, height=page_size_pts)
        pdf_page += 1
        print(f"  Page {pdf_page:2d}: About the Author")
    else:
        pdf_page += 1
        print(f"  Page {pdf_page:2d}: blank (about author page not found)")
    c.showPage()

    # Pad to multiple of 4 (required for book printing signatures)
    while pdf_page % 4 != 0:
        pdf_page += 1
        c.setFillColorRGB(1, 1, 1)
        c.rect(0, 0, page_size_pts, page_size_pts, fill=1, stroke=0)
        print(f"  Page {pdf_page:2d}: blank (padding for multiple of 4)")
        c.showPage()

    c.save()
    print(f"\nRGB PDF saved: {output_path} ({pdf_page} pages)")
    return output_path


def convert_to_cmyk_pdfx(rgb_pdf: Path, output_pdf: Path, title: str) -> Path:
    """Convert RGB PDF to PDF/X-1a with CMYK using Ghostscript."""

    # Create PDFX definition file
    pdfx_def = output_pdf.parent / "_pdfx_def.ps"
    pdfx_def.write_text(f"""%!PS-Adobe-3.0
%%Title: PDFX Definition
%%EndComments

% Document Info
[/Title ({title})
 /Author (Shantam)
 /Subject (Children's Book - Print Ready)
 /DOCINFO pdfmark

% PDF/X Output Intent
[/_objdef {{OutputIntent}} /type /dict /OBJ pdfmark
[{{OutputIntent}} <<
  /Type /OutputIntent
  /S /GTS_PDFX
  /OutputConditionIdentifier (Custom CMYK)
  /RegistryName (http://www.color.org)
  /Info (CMYK for offset printing)
  /OutputCondition (CMYK printing)
>> /PUT pdfmark

% ICC Profile
[/_objdef {{iccprofile}} /type /stream /OBJ pdfmark
[{{iccprofile}} << /N 4 >> /PUT pdfmark
[{{iccprofile}} ({ICC_PROFILE.absolute()}) (r) file /PUT pdfmark

% Link Output Intent to ICC Profile
[{{OutputIntent}} << /DestOutputProfile {{iccprofile}} >> /PUT pdfmark

% Add Output Intent to catalog
[{{Catalog}} << /OutputIntents [{{OutputIntent}}] >> /PUT pdfmark
""")

    gs_command = [
        "gs",
        "-dPDFX",
        "-dBATCH",
        "-dNOPAUSE",
        "-dSAFER",
        "-dNOOUTERSAVE",
        "-dCompatibilityLevel=1.3",
        "-sDEVICE=pdfwrite",
        "-dPDFSETTINGS=/prepress",
        "-sColorConversionStrategy=CMYK",
        "-dProcessColorModel=/DeviceCMYK",
        f"-sOutputICCProfile={ICC_PROFILE.absolute()}",
        f"-sOutputFile={output_pdf.absolute()}",
        str(pdfx_def.absolute()),
        str(rgb_pdf.absolute()),
    ]

    print(f"\nConverting to PDF/X-1a (CMYK)...")
    try:
        result = subprocess.run(gs_command, check=True, capture_output=True, text=True)
        pdfx_def.unlink(missing_ok=True)
        print(f"PDF/X-1a saved: {output_pdf}")
        return output_pdf
    except subprocess.CalledProcessError as e:
        print(f"Ghostscript error:\n{e.stderr}")
        pdfx_def.unlink(missing_ok=True)
        raise


def main():
    parser = argparse.ArgumentParser(description="Export interior pages to print-ready PDF.")
    parser.add_argument("--project", type=str, default=None,
                        help="Path to the project directory (e.g. projects/whats-not-in-here)")
    args = parser.parse_args()

    # Resolve project path
    if args.project:
        project_dir = Path(args.project)
        if not project_dir.is_absolute():
            project_dir = REPO_ROOT / project_dir
    else:
        print("ERROR: No --project specified. Usage: export-interior-pdf.py --project projects/<slug>")
        sys.exit(1)

    pages_dir = project_dir / "pages"
    output_dir = project_dir / "output" / "print"

    # Load book metadata: prefer ICM format, fall back to legacy
    book_path = project_dir / "book.yaml"
    story_path = project_dir / "story.json"

    special_pages = {}

    if book_path.exists():
        print(f"Reading ICM format from {project_dir}")
        with open(book_path) as f:
            book = yaml.safe_load(f)
        title = book.get("title", "Untitled")
        special_pages = book.get("specialPages", {})
        sequence = get_page_sequence_icm(project_dir, pages_dir)
    elif story_path.exists():
        print(f"Reading legacy format from {story_path}")
        title = "What's Not In Here"  # Legacy default
        with open(story_path) as f:
            story = json.load(f)
        title = story.get("title", title)
        sequence = get_page_sequence_legacy(story_path, pages_dir)
    else:
        print(f"ERROR: No book.yaml or story.json found in {project_dir}")
        sys.exit(1)

    print(f"Building page sequence...")
    print(f"Total pages: {len(sequence)}")

    if len(sequence) % 2 != 0:
        print(f"WARNING: Odd page count ({len(sequence)}). OnPress requires even.")

    # Derive slug from title for filenames
    slug = title.lower().replace("'", "").replace(" ", "_")

    # Step 1: Create RGB PDF
    rgb_pdf = output_dir / f"{slug}_interior_rgb.pdf"
    create_pdf(sequence, rgb_pdf, pages_dir, special_pages)

    # Step 2: Convert to CMYK PDF/X-1a
    cmyk_pdf = output_dir / f"{slug}_interior.pdf"
    convert_to_cmyk_pdfx(rgb_pdf, cmyk_pdf, title)

    # File size info
    rgb_size = rgb_pdf.stat().st_size / (1024 * 1024)
    cmyk_size = cmyk_pdf.stat().st_size / (1024 * 1024)
    print(f"\nRGB PDF:  {rgb_size:.1f} MB")
    print(f"CMYK PDF: {cmyk_size:.1f} MB")
    print(f"\nDone! Interior PDF ready for OnPress: {cmyk_pdf}")


if __name__ == "__main__":
    main()
