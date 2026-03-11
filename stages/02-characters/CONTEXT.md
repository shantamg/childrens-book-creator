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
2. Let the user know they can drag reference images (photos, sketches, inspiration) directly into the terminal to base the character on
3. Create `characters/{name}/character.md` with full description
4. If user provides reference images, save them to `characters/{name}/` (e.g. `reference.png`)
5. Character can be created as a placeholder (description only, no model sheet)

### Generating model sheets

Model sheets provide consistent character reference for image generation.

1. Read the character description from `character.md`
2. Use `nano-banana` to generate one model sheet (front view, 3/4 view, side view)
3. Show the result to the user and ask if they like it
4. If not, iterate — the user can ask to try again with the same prompt or adjust the prompt
5. Once approved, save as `approved-model-sheet.png`

### nano-banana CLI for model sheets

```bash
nano-banana "Character model sheet, [description], front view, 3/4 view, side view, white background, children's book illustration style, [art-style]" -a 16:9 -s 1K
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
| Model sheet | Generated image | Approve, retry same prompt, or adjust prompt |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Character file | `../../projects/{slug}/characters/{name}/character.md` | Markdown with YAML frontmatter |
| Model sheet | `../../projects/{slug}/characters/{name}/approved-model-sheet.png` | PNG |
| Reference images | `../../projects/{slug}/characters/{name}/reference.png` | PNG/JPG |
