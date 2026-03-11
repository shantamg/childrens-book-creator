# Children's Book Creator

ICM workspace for creating illustrated children's books with print-ready output.

## First-Run Setup

If `setup/config.yaml` exists, setup is complete — skip all checks and proceed.

If it does NOT exist, this is a first run. Do the following:

1. Install dependencies silently:
   - `cd web && npm install`
   - `pip install -r scripts/requirements.txt`
   - `playwright install chromium`
2. Verify system tools: check that `gs` (Ghostscript) is available.
   - macOS: `brew install ghostscript`
   - Linux: use the distro package manager (e.g. `apt install ghostscript`)
   - Windows: not yet verified — try to find and suggest the appropriate install method
   - If you can't determine how to install a missing dependency, tell the user what's needed and let them handle it.
3. Run the onboarding questionnaire from `setup/questionnaire.md` — use AskUserQuestion for each question, one at a time
4. Write answers to `setup/config.yaml` (this file is the "setup done" marker)
5. Write the chosen port to `web/.env.local` as `PORT=<number>` (preserve any other variables already in that file)
6. If a Gemini API key was collected, write it to `.env` as `GEMINI_API_KEY=<key>`

## Active Project

Set with: "I'm working on [project-name]"
Look in `projects/` for available projects. If only one exists, use it.

## Folder Map

```
stages/          Stage contracts (how each part of book creation works)
_config/         Print specs, tools, workflow reference
scripts/         Python scripts for rendering and export
projects/        Book projects (one folder per book)
setup/           One-time onboarding questionnaire
```

## Routing

Read `CONTEXT.md` for task routing. Match the user's request to a stage:

| Task | Stage |
|------|-------|
| Story, plot, pages, text content | stages/01-story/ |
| Characters, model sheets, references | stages/02-characters/ |
| Image generation, variations, approvals | stages/03-imagery/ |
| Text positioning, fonts, layout | stages/04-text-layout/ |
| Cover design and generation | stages/05-cover/ |
| PDF export, print-ready output | stages/06-export/ |

## Project Data Format

Each project in `projects/{slug}/` contains:

```
book.yaml              Project metadata, specs, style
story/
  page-NN.md           Per-page creative content (YAML frontmatter + markdown)
characters/
  {name}/character.md  Character descriptions and reference images
layout.yaml            Text positioning data (web tool reads/writes this)
pages/                 Image variations, approvals, print-ready files
  NNN-pageN/
cover/
output/
```

## Web Layout Tool

Located at `web/` (Next.js app). Start with `cd web && npm run dev`.

- Home page lists all projects — click to open
- Reads page images from `pages/NNN-pageN/` folders (looks for `print-ready/page.png`, then `approved.png`, then any `.png`)
- Text layout is stored in `layout.yaml` — the web tool reads/writes this
- Auto-seeds text from `story/page-NN.md` files when a page has no layout entry yet
- Story text API: `GET /api/project/story?slug=xyz` returns all story text
- Supports multiple text overlays per page (array in layout.yaml)
- Text in `layout.yaml` is the positioning/rendering copy; `story/page-NN.md` is the creative source

### Page folder structure for web tool

```
pages/
  002-page2/
    print-ready/page.png    ← web tool looks for this first
    approved.png             ← fallback
    page_002_v1.png          ← fallback (any .png)
```

## Characters

Each character has a folder in `characters/{name}/` with:
- `character.md` — description, visual key details, prompt snippet
- Model sheet images (e.g., `model_sheet.png`, `approved_model_sheet.png`)
- Reference photos used during creation

`characters/manifest.json` lists all characters with their prompt snippets for image generation.

## Image Generation

Use `nano-banana` CLI for generating page illustrations and character model sheets.
- Reference character model sheets with `-r` for consistency
- Use `-s 1K -a 1:1` for standard square pages matching 8.5x8.5" trim
- Rename files before passing to nano-banana (it can't handle spaces in filenames via `-r`)
- ALWAYS include in every image prompt: "Do not include any text, words, letters, or numbers in the image — text will be added later as an overlay."

## Conventions

- When generating or creating files (images, characters, exports, etc.), run `open <folder>` on the containing folder so the user can see the result in Finder
- All text positions as percentages (0-100), scales across resolutions
- File and folder names: lowercase-with-hyphens
- Page folders: zero-padded three digits (001, 002, 017-018)
- One source of truth per data type: story content in markdown, layout in YAML
- Scripts live in `scripts/`, shared across all projects
- Web tool loads fonts from Google Fonts dynamically; local `fonts/` files are only needed by the Python render script for print output
