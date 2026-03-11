# Children's Book Creator

An AI-assisted workspace for creating illustrated children's books from story to print-ready PDF. You write the story and direct the art — Claude Code orchestrates the workflow, generates images, and assembles everything for printing.

## What This Is

This is a **Claude Code workspace**, not a traditional app. You open it in Claude Code and have a conversation:

- "I want to write a book about a fox who learns to fly"
- "Let's create the main character — here's a photo of what she should look like"
- "Generate illustrations for pages 2 through 5"
- "I like version 2 of page 3, approve that one"
- "Open the web tool so I can position the text on the pages"
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

All you need is [Claude Code](https://claude.ai/claude-code) and a few standard system tools: [Node.js](https://nodejs.org/) (20+), [Python](https://python.org/) (3.10+), and [Ghostscript](https://www.ghostscript.com/). For image generation, you'll need [nano-banana](https://github.com/kingbootoshi/nano-banana-2-skill) and a [Gemini API key](https://aistudio.google.com/apikey).

Claude Code will check for these on first run, install what it can, and tell you what's missing.

> **Note:** This has been tested on macOS. On other platforms, Claude Code will attempt to figure out the right install steps — Windows is not yet verified.

## Setup

Open a terminal and run:

```bash
git clone https://github.com/shantamg/childrens-book-creator
cd childrens-book-creator
claude
```

Then type **"let's get started"** — Claude will install project dependencies, check for required tools, and walk you through a short onboarding questionnaire. Your answers are saved to `setup/config.yaml`.

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

When you're ready to look at your illustrations and arrange text, Claude will start the web server for you and give you a link to open in your browser. Click a project to:

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
