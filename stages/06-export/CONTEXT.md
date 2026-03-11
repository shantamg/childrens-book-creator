# Stage 06 — Print Export

Export print-ready PDF/X-1a files for the interior and cover.

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| Project config | `../../projects/{slug}/book.yaml` | specs | Trim, bleed, ICC profile |
| Text-rendered pages | `../../projects/{slug}/pages/*/print-text-browser/page.png` | Full file | Final page images |
| Print-ready pages | `../../projects/{slug}/pages/*/print-ready/page.png` | Full file | Fallback (no text) |
| Story pages | `../../projects/{slug}/story/page-*.md` | page, type fields | Page sequence and types |
| Cover image | `../../projects/{slug}/cover/cover.png` | Full file | Cover for export |
| Print specs | `../../_config/print-specs.md` | Full file | PDF/X-1a requirements |

## Process

### Pre-flight check

Before exporting, verify:
1. All pages have print-ready images (2625x2625 at 300 DPI)
2. Text-rendered versions exist for pages with text
3. Page sequence is complete (no gaps)
4. Spreads have left/right halves
5. Cover image exists at correct dimensions

### Interior PDF export

```bash
python3 scripts/export-interior-pdf.py --project projects/{slug}
```

The script:
1. Assembles pages in order (blank title page, story pages, padding)
2. Uses text-rendered versions where available, falls back to plain images
3. Handles spreads by using left/right halves
4. Creates RGB PDF with ReportLab
5. Converts to CMYK PDF/X-1a via Ghostscript with GRACoL 2006 ICC profile
6. Pads to multiple of 4 pages (book signature requirement)

Output: `output/print/{slug}-interior.pdf`

### Cover PDF export

```bash
python3 scripts/export-cover-pdf.py --project projects/{slug}
```

Output: `output/print/{slug}-cover.pdf`

### Safe zone verification

Before final export, generate safe zone previews:

```bash
python3 scripts/draw-safe-zones.py --project projects/{slug}
```

Review the annotated previews in `output/safe-zone-preview/` to verify
text and important content stays within safety margins.

## Audit

| Check | Pass condition |
|-------|---------------|
| Resolution | All pages are 2625x2625px at 300 DPI |
| Page count | Total pages (with padding) is multiple of 4 |
| CMYK conversion | PDF/X-1a output intent present |
| ICC profile | GRACoL 2006 Coated embedded |
| Bleed | 0.125" bleed present on all pages |
| Spreads | Left/right halves correctly split |
| Cover dimensions | 19.026" x 10.0" at 300 DPI |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Interior PDF | `../../projects/{slug}/output/print/{slug}-interior.pdf` | PDF/X-1a (CMYK) |
| Cover PDF | `../../projects/{slug}/output/print/{slug}-cover.pdf` | PDF/X-1a (CMYK) |
| Safe zone previews | `../../projects/{slug}/output/safe-zone-preview/` | JPG |
