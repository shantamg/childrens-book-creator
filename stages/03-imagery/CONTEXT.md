# Stage 03 — Image Generation

Generate, review, and approve page illustrations.

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| Project config | `../../projects/{slug}/book.yaml` | style, generation | Art style, model, settings |
| Page content | `../../projects/{slug}/story/page-NN.md` | Scene Direction | What to illustrate |
| Character sheets | `../../projects/{slug}/characters/*/approved-model-sheet.png` | Full file | Character consistency |
| Existing images | `../../projects/{slug}/pages/` | variations/ and approval.json | What exists already |

## Process

### Generating page images

1. Read the page's `story/page-NN.md` for scene direction and mood
2. Read `book.yaml` for art style and generation settings
3. Gather approved model sheets for characters in the scene
4. Build the generation prompt combining: art style + scene description + character refs + mood
5. Use `nb` CLI to generate variations

### nb CLI usage

```bash
# Generate at 1K first (faster iteration, cheaper)
nb --prompt "[prompt]" --ref characters/eloy/approved-model-sheet.png --res 1k

# Generate multiple variations
nb --prompt "[prompt]" --ref [refs] --res 1k  # run 3 times for 3 variations

# Upscale approved variation to 4K
nb --prompt "[prompt]" --ref [refs] --image pages/NNN/approved.png --res 4k
```

### 1K-first workflow (critical)

Always generate at 1K resolution first. Get user approval. Then upscale to 4K.
- 4x faster iteration at 1K
- Lower API costs during exploration
- Easier to review at smaller size
- Only upscale what you'll actually use

### Approval flow

1. Save variations to `pages/NNN-pageN/variations/`
   - `page_NNN_v1.png`, `page_NNN_v2.png`, `page_NNN_v3.png`
   - Save prompts: `page_NNN_v1_prompt.txt`
2. Present variations to user (show file paths so they can view them)
3. On approval, copy to `pages/NNN-pageN/approved.png`
4. Write `pages/NNN-pageN/approval.json`:
   ```json
   { "approvedVariation": 2, "approvedFile": "page_NNN_v2.png", "timestamp": "..." }
   ```

### Upscaling and conforming

After approval:
1. Upscale to 4K: save as `approved_4k.png`
2. Conform to print resolution (2625x2625px at 300 DPI):
   ```bash
   magick approved_4k.png -resize 2625x2625 -density 300 pages/NNN/print-ready/page.png
   ```

### Spreads

Spread images span two pages. Generate at 2:1 aspect ratio.
Split into left/right halves for print:
```bash
magick spread.png -crop 50%x100% +repage pages/NNN/print-ready/page-%d.png
```

## Checkpoints

| After | Present | Human decides |
|-------|---------|---------------|
| First page variations | 3 variations side by side | Which to approve, or regenerate |
| Batch generation | Gallery of all pages | Which need regeneration |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Variations | `pages/NNN-pageN/variations/` | PNG (1K) |
| Approved image | `pages/NNN-pageN/approved.png` | PNG (1K) |
| Upscaled | `pages/NNN-pageN/approved_4k.png` | PNG (4K) |
| Print-ready | `pages/NNN-pageN/print-ready/page.png` | PNG (2625x2625 @ 300 DPI) |
| Approval record | `pages/NNN-pageN/approval.json` | JSON |
