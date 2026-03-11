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
5. Use `nano-banana` CLI to generate the image

### nano-banana CLI usage

```bash
# Generate at 1K first (faster iteration, cheaper)
nano-banana "[prompt]" -r characters/eloy/approved-model-sheet.png -s 1K
```

### 1K-first workflow (critical)

Always generate at 1K resolution first. Get user approval. Then upscale to 4K.
- 4x faster iteration at 1K
- Lower API costs during exploration
- Easier to review at smaller size
- Only upscale what you'll actually use

### Approval flow

1. Generate one image at a time, save to `pages/NNN-pageN/`
2. Show the result to the user and ask how they like it
3. If not right, iterate — the user can adjust the prompt or try again
4. On approval, save as `pages/NNN-pageN/approved.png`

### Upscaling and conforming

After approval:
1. Upscale to 4K with nano-banana using the pro model for best quality:
   ```bash
   nano-banana "Generate a higher-resolution, higher-quality version of this exact illustration. Preserve every detail, color, composition, and character appearance precisely. Do not change the scene, add text, or alter any element." -r pages/NNN-pageN/approved.png -s 4K -m pro -o approved_4k
   ```
2. Conform to print resolution (look up pixels from `_config/formats.yaml`):
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
| Page image | Generated image | Approve, adjust prompt, or try again |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Iterations | `pages/NNN-pageN/` | PNG (1K) |
| Approved image | `pages/NNN-pageN/approved.png` | PNG (1K) |
| Upscaled | `pages/NNN-pageN/approved_4k.png` | PNG (4K) |
| Print-ready | `pages/NNN-pageN/print-ready/page.png` | PNG (2625x2625 @ 300 DPI) |
| Approval record | `pages/NNN-pageN/approval.json` | JSON |
