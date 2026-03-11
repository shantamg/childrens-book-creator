# Children's Book Creator

An AI-assisted workspace for creating illustrated children's books from story to print-ready PDF. You write the story and direct the art — Claude Code orchestrates the workflow, generates images, and assembles everything for printing.

## What This Is

This is a **Claude Code workspace**, not a traditional app. You open it in Claude Code and have a conversation:

- "I want to start a new book about a fox who learns to fly"
- "Generate the illustration for page 3"
- "Move the text down and make it bigger"
- "Export the print-ready PDF"

Claude reads the stage contracts in `stages/` to know how each part of the process works, and uses the scripts and web tool to get things done.

### The Pipeline

```
Story Writing → Character Design → Page Illustrations → Text Layout → Cover → Print PDF
     01              02                  03                 04          05      06
```

Each stage has a contract (`stages/NN-name/CONTEXT.md`) that defines the workflow. You can work on stages in any order, though later stages need outputs from earlier ones.

## What You Get

- **Story structure**: Page-by-page markdown files with scene directions
- **Character consistency**: Model sheets and prompt snippets for AI image generation
- **Page illustrations**: Generated with nano-banana (Gemini), iterated until approved
- **Text layout**: Web-based editor for positioning text over illustrations
- **Proof view**: Full-screen spread-paired book preview
- **Print-ready PDF**: 300 DPI, CMYK PDF/X-1a with bleed, ready for services like OnPress

## Prerequisites

You need these installed before starting:

| Tool | Version | Purpose |
|------|---------|---------|
| [Claude Code](https://claude.ai/claude-code) | Latest | The AI agent that runs the workspace |
| [Node.js](https://nodejs.org/) | 20+ LTS | Web layout tool |
| [Python](https://python.org/) | 3.10+ | Print scripts (text rendering, PDF export) |
| [Ghostscript](https://www.ghostscript.com/) | 10+ | RGB to CMYK PDF conversion |
| [nano-banana](https://github.com/kingbootoshi/nano-banana-2-skill) | Latest | CLI for generating illustrations (uses Google Gemini) |

On macOS, the system dependencies can be installed with Homebrew:

```bash
brew install ghostscript node python@3
```

On Linux, use your distro's package manager. Windows has not been verified yet — Claude Code will attempt to figure out the right install steps if you're on an untested platform.

## Setup

```bash
cd /path/to/this/repo
claude
```

That's it. On first run, Claude Code will install project dependencies (npm packages, Python packages, Playwright) and walk you through a short onboarding questionnaire. Your answers are saved to `setup/config.yaml`.

For image generation you'll also need a [Gemini API key](https://aistudio.google.com/apikey) — see the [nano-banana setup instructions](https://github.com/kingbootoshi/nano-banana-2-skill).

## Project Structure

```
stages/              Stage contracts (how each part of book creation works)
_config/             Print specs and tool reference
scripts/             Python scripts for rendering and export
  requirements.txt   Python dependencies
web/                 Next.js web tool for text layout and proofing
setup/               First-run onboarding questionnaire
projects/            Book projects (gitignored — one folder per book)
```

Each book project lives in `projects/{slug}/`:

```
book.yaml            Metadata, specs, art style, special pages config
story/
  page-NN.md         Per-page story content (YAML frontmatter + markdown)
characters/
  {name}/            Character description, model sheets, references
  manifest.json      Prompt snippets for image generation
layout.yaml          Text positioning (percentages, fonts, colors)
pages/
  NNN-pageN/         Page image folders (variations, approved, print-ready)
  title-page-*.png   Title page images
  about-author/      About the author page
cover/               Cover images
output/              Exported PDFs
```

## Using the Web Tool

The web tool handles text positioning and book proofing.

```bash
cd web && npm run dev
```

Open http://localhost:3000 to see your projects. Click a project to:

- **Spread gallery**: See pages paired as they'll appear in the printed book
- **Page editor**: Click any page to drag and resize text overlays
- **Proof view**: Full-screen spread-by-spread preview (arrow keys to navigate)

Text layout is stored in `layout.yaml`. The web tool reads story text from `story/page-NN.md` and auto-seeds initial text positions for new pages.

## Print Specs

Default spec (configurable per book in `book.yaml`):

- **Trim**: 8.5" x 8.5" (square hardcover)
- **Bleed**: 0.125" on all sides
- **Resolution**: 300 DPI (2625 x 2625 px per page)
- **Color**: CMYK PDF/X-1a via Ghostscript
- **Page count**: Padded to multiple of 4 (printing signatures)

## Scripts

All scripts take `--project projects/<slug>` and are run from the repo root.

| Script | Purpose |
|--------|---------|
| `render-text.py` | Renders text overlays onto images using Playwright/Chromium |
| `export-interior-pdf.py` | Assembles pages into print-ready CMYK PDF |
| `draw-safe-zones.py` | Draws trim/safety guides on page images for review |
| `cover-guide.py` | Draws template guides on cover images |
| `migrate-from-json.py` | One-time migration from legacy story.json format |

## License

Private workspace. Not licensed for redistribution.
