# Stage 01 — Story Development

Develop the book's story: plot, page breakdown, and text content.

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| Project config | `../../projects/{slug}/book.yaml` | Full file | Title, style, specs |
| Existing pages | `../../projects/{slug}/story/` | All page-*.md files | Current state of story |
| Characters | `../../projects/{slug}/characters/` | character.md files | Who exists in the story |

## Process

### Creating a new story

1. Discuss the concept, themes, age range, and tone with the user
2. Develop the narrative arc — beginning, journey, resolution
3. Break into pages (typically 24-32 for picture books)
4. For each page, write a `page-NN.md` file with:
   - The story text that will appear on the page
   - A scene description for the illustrator/image generator
   - Character list and mood
5. Consider spread pages (two-page illustrations) for key moments

### Editing existing story

1. Read all `story/page-*.md` files to understand current state
2. Make the requested changes (rewrite text, add/remove pages, reorder)
3. When reordering, renumber the page files and update frontmatter
4. When adding a page, create the new file and adjust surrounding pages

### Page file format

```markdown
---
page: 3
type: story
characters: [eloy]
mood: "Curious, focused"
---

He found a screwdriver and started taking things apart.

"I just want to see what kind of batteries my garbage truck has."

## Scene Direction

Whimsical watercolor: Eloy taking apart toys with a screwdriver,
examining batteries from his garbage truck. Curious, focused expression.

## Notes

- Two text blocks on this page
- Keep screwdriver prominent but not threatening
```

Page types: `story`, `spread-start`, `spread-companion`, `blank`, `title`

## Checkpoints

| After | Present | Human decides |
|-------|---------|---------------|
| Story outline | Page-by-page summary with themes | Overall structure, pacing |
| First draft of all pages | Full page texts + scene directions | Which pages need revision |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Page files | `../../projects/{slug}/story/page-NN.md` | Markdown with YAML frontmatter |
