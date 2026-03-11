# Available Tools

## nano-banana CLI

AI image generation using Gemini models. Use for all new image generation.

- **Purpose**: Generate illustrations, character model sheets, covers
- **Key flags**:
  - `"prompt"` — First argument is the generation prompt
  - `-r path/to/reference.png` — Reference image (character sheet), can use multiple times
  - `-s 1K|2K|4K` — Output size (default 1K)
  - `-a 1:1|16:9|2:3|3:4|4:5|4:3` — Aspect ratio (look up per format in `_config/formats.yaml`)
  - `-o filename` — Output filename (without extension)
  - `-m flash|pro` — Model selection (flash is default, pro is higher quality)
  - `-t` — Transparent background (green screen removal)

## Upscaling images

To upscale an approved image to 4K, use nano-banana with the pro model and a preservation prompt:

```bash
nano-banana "Generate a higher-resolution, higher-quality version of this exact illustration. Preserve every detail, color, composition, and character appearance precisely. Do not change the scene, add text, or alter any element." -r approved.png -s 4K -m pro -o approved_4k
```

## Python Scripts (in scripts/)

### render-text.py

Renders text overlays onto page images using Playwright.
Uses "bait and switch" technique: 1200px viewport with scale factor
producing 2625px output at print resolution.

```bash
python3 scripts/render-text.py --project projects/{slug}
```

### export-interior-pdf.py

Assembles pages into print-ready interior PDF with CMYK conversion.

```bash
python3 scripts/export-interior-pdf.py --project projects/{slug}
```

### draw-safe-zones.py

Generates preview images with trim/safety zone guides overlaid.

```bash
python3 scripts/draw-safe-zones.py --project projects/{slug}
```

### cover-guide.py

Draws cover template guide with bleed/trim/safety/spine zones.

```bash
python3 scripts/cover-guide.py --project projects/{slug}
```

## ImageMagick

Used for image resizing and conforming.

```bash
# Conform 4K to print resolution
magick input.png -resize 2625x2625 -density 300 output.png

# Split spread into left/right
magick spread.png -crop 50%x100% +repage page-%d.png
```

## Ghostscript

RGB to CMYK PDF conversion with ICC profile.

```bash
gs -dPDFA -dBATCH -dNOPAUSE -sDEVICE=pdfwrite \
  -sColorConversionStrategy=CMYK \
  -sOutputICCProfile=GRACoL2006_Coated1v2.icc \
  -o output.pdf input.pdf
```

## Web Tool

Lightweight browser UI for text positioning.

```bash
cd web && npm run dev
```

Provides: WYSIWYG text overlay editor, safe zone preview, page gallery.
Reads/writes `layout.yaml` in the active project.
