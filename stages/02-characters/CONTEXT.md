# Stage 02 — Character Design

Create and manage characters: descriptions, reference images, and model sheets.

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| Project config | `../../projects/{slug}/book.yaml` | style section | Art style, mood |
| Story pages | `../../projects/{slug}/story/` | characters fields | Which characters are needed |
| Existing characters | `../../projects/{slug}/characters/` | All character.md files | Current state |

## Process

### Creating a character

1. Gather from user: name, age, physical description, personality, role in story
2. Create `characters/{name}/character.md` with full description
3. If user provides a reference image, save to `characters/{name}/reference.png`
4. Character can be created as a placeholder (description only, no model sheet)

### Generating model sheets

Model sheets provide consistent character reference for image generation.

1. Read the character description from `character.md`
2. Use `nb` CLI to generate model sheet (front view, 3/4 view, side view)
3. Generate 3 variations: `model-sheet-v1.png`, `model-sheet-v2.png`, `model-sheet-v3.png`
4. Present variations to user for approval
5. Save approved version as `approved-model-sheet.png`
6. Optionally generate individual view sheets for detailed reference

### nb CLI for model sheets

```bash
nb --prompt "Character model sheet, [description], front view, 3/4 view, side view, white background, children's book illustration style, [art-style]" --ar 16:9 --res 4k
```

### Character file format

```markdown
---
name: Eloy
role: protagonist
age: 4
model-sheet: approved-model-sheet.png
---

A curious 4-year-old boy with dark curly hair, bright brown eyes,
and an infectious smile. He wears a red t-shirt and blue jeans.

## Visual Notes

- Keep his expression curious and engaged
- Hair should be consistently wild/curly
- Red shirt is a key identifying feature
```

## Checkpoints

| After | Present | Human decides |
|-------|---------|---------------|
| Character description | Full written description | Accuracy, missing details |
| Model sheet variations | Side-by-side comparison | Which variation to approve |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Character file | `../../projects/{slug}/characters/{name}/character.md` | Markdown with YAML frontmatter |
| Model sheet | `../../projects/{slug}/characters/{name}/approved-model-sheet.png` | PNG |
| Reference images | `../../projects/{slug}/characters/{name}/reference.png` | PNG/JPG |
