# Stage 04 — Text Layout

Position text on pages using the web tool. Render text onto images for print.

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| Story text | `../../projects/{slug}/story/page-NN.md` | Text content | What text to place |
| Page images | `../../projects/{slug}/pages/NNN/print-ready/page.png` | Full file | Background for text |
| Layout data | `../../projects/{slug}/layout.yaml` | Full file | Current positioning |
| Print specs | `../../_config/print-specs.md` | Safe zones | Text must be within safety |
| Typography | `../../projects/{slug}/book.yaml` | typography section | Default font settings |

## Process

### Positioning text (web tool)

Text positioning is visual work best done in the browser:

1. Start the web tool: `cd scripts/web && npm run dev`
2. Open the project in the browser
3. Drag text blocks onto pages, adjust font/size/color/alignment
4. The web tool reads and writes `layout.yaml` directly

### layout.yaml format

```yaml
pages:
  1:
    - content: "\"Eloy, clean up in here...\""
      font: Overlock
      fontSize: 42
      lineHeight: 1.0
      letterSpacing: 0
      color: "#000000"
      align: left
      leftPercent: 24.77
      topPercent: 59.37
      widthPercent: 71.9
      heightPercent: 23.6
  3:
    - content: "He found a screwdriver..."
      font: Overlock
      fontSize: 42
      # ... positioning fields
    - content: "\"I just want to see...\""
      # ... second text block
```

All positions are percentages (0-100). This scales to any resolution.

### Rendering text onto images

After positioning is finalized, render text onto print-ready images:

```bash
python3 scripts/render-text.py --project projects/{slug}
```

This uses Playwright (headless Chromium) for professional text rendering.
The "bait and switch" technique: renders at 1200px viewport with a scale
factor that produces 2625px output at print resolution.

Output: `pages/NNN/print-text-browser/page.png`

### Safe zone awareness

Text must stay within safety margins:
- 0.44" from outer edges (top, bottom, outside)
- 1.0" from gutter (binding side)
- Use `scripts/draw-safe-zones.py` to generate preview images with guides

### AI-assisted text placement

Batch-place text across all pages with visual verification. Use when the user asks to "place text on all pages", "lay out the text", or similar.

#### Step 1 — Calibrate (optional)

Check if the user has already placed text on 1-2 pages using the web tool. If so, read those entries from `layout.yaml` to learn the style:
- Font, fontSize, lineHeight, color
- Background settings (bgEnabled, bgColor, bgOpacity, bgRadius, bgPadding)
- Placement style (corners vs edges, single vs split text blocks)

If no calibration pages exist, use defaults from `book.yaml` typography section and apply these background defaults:
```yaml
bgEnabled: true
bgColor: '#ffffff'
bgOpacity: 0.6
bgRadius: 46
bgPadding: 25
```

Ask the user if they'd like to place 1-2 pages first to set the style, or skip and use defaults.

#### Step 2 — Batch place

For each page that has story text in `story/page-NN.md` but no layout entry (or all pages if requested):

1. **Read the page image** to understand composition — where are faces, characters, key visual elements
2. **Read the story text** from `story/page-NN.md` — content, page type, mood
3. **Determine page type** from frontmatter:
   - `story` (single page) — 1:1 aspect, full image available
   - `spread-start` — image spans two pages, text goes on the image side
   - `spread-companion` — text-only page on a spread (no image, text flows freely)
   - `title`, `blank` — may not need image-aware placement
4. **Choose placement** following these rules:
   - Stay inside safe zone (5%+ from outer edges, 12%+ from gutter/binding side)
   - Avoid character faces and key visual elements
   - On spreads: keep text away from the center seam (avoid 45-55% horizontal zone)
   - Prefer corners/edges where the image has simpler backgrounds (sky, ground, walls, dark areas)
   - For dark backgrounds, consider white or light text color
   - Split long text into multiple blocks if it reads better or avoids covering important elements
   - Match the calibration style consistently across all pages
5. **Write the overlay(s)** to `layout.yaml`
6. **Render preview**: `python3 scripts/render-text.py --project projects/{slug} --page N --preview`
7. **Read the rendered image** from `pages/NNN/print-text-browser/page.png` and self-check:
   - Is any text covering a face or important element?
   - Is the text readable against the background?
   - Is the text within safe zones?
   - Does the background bubble look good (not too wide, not too narrow)?
   - If any issue, adjust the layout.yaml entry and re-render
8. **Move to next page**

#### Step 3 — Review

After all pages are placed:
- Tell the user to review in the web tool or proof view
- The user can adjust any pages that need tweaking using the web tool
- Final render at print resolution (without `--preview` flag):
  ```bash
  python3 scripts/render-text.py --project projects/{slug}
  ```

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Layout data | `../../projects/{slug}/layout.yaml` | YAML |
| Text-rendered pages | `pages/NNN/print-text-browser/page.png` | PNG (2625x2625) |
| Safe zone previews | `output/safe-zone-preview/` | JPG |
