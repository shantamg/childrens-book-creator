# Children's Book Creator — Navigation

## How This Workspace Works

This is an ICM workspace. Each stage handles one aspect of book creation. Stages have soft dependencies — you can work on them in any order, but some need outputs from earlier stages.

The workflow is conversational. You talk through what you want, and the agent reads the appropriate stage contract to know how to help.

## Task Routing

| User wants to... | Read | Depends on |
|---|---|---|
| Develop the story, plan pages, write/edit text | `stages/01-story/CONTEXT.md` | Nothing |
| Create or refine characters, model sheets | `stages/02-characters/CONTEXT.md` | Character names from story |
| Generate or regenerate page images | `stages/03-imagery/CONTEXT.md` | Character sheets + scene descriptions |
| Position text on pages using the web tool | `stages/04-text-layout/CONTEXT.md` | Images + story text |
| Design or generate the cover | `stages/05-cover/CONTEXT.md` | Art style established |
| Export print-ready PDFs | `stages/06-export/CONTEXT.md` | Text-rendered pages |

## Project Context

Before starting work, identify the active project:

1. Read `projects/` to see what exists
2. If the user names one, use `projects/{name}/`
3. If only one project exists, use it automatically
4. If unclear, ask

Load the project's `book.yaml` for metadata and current state.

## Status Check

When user asks for status or "where are we", read the active project and report:

- **Story**: How many pages defined, which have text written
- **Characters**: Which exist, which have model sheets
- **Images**: Which pages have images, which are approved
- **Text layout**: Which pages have positioning done
- **Cover**: Whether cover exists
- **Export**: Whether print-ready PDFs exist

## Setup

On first use, check if `setup/config.yaml` exists.
- If yes: setup is complete, read defaults from there.
- If no: ask the questions in `setup/questionnaire.md`, write answers to `setup/config.yaml`.

## Starting a New Project

If the user wants to create a new book:

1. Read defaults from `setup/config.yaml`
2. Read format options from `_config/formats.yaml`
3. Ask for: title, format/trim size (default from config, show options), art style (default from config), mood/tone (default from config), paper stock (default: 80lb white for children's books)
4. Create `projects/{slug}/` with `book.yaml` (include format key and resolved specs)
5. Create `projects/{slug}/story/`, `characters/`, `pages/`, `cover/`, `output/`
6. Route to stage 01-story to begin developing the story
