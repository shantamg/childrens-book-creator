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

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Layout data | `../../projects/{slug}/layout.yaml` | YAML |
| Text-rendered pages | `pages/NNN/print-text-browser/page.png` | PNG (2625x2625) |
| Safe zone previews | `output/safe-zone-preview/` | JPG |
