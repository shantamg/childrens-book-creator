#!/usr/bin/env python3
"""Migrate a book project from story.json + project.json to ICM format.

Creates:
  - book.yaml from project.json
  - story/page-NN.md per-page markdown files from story.json
  - layout.yaml text positioning data from story.json

Preserves original files (non-destructive).
"""

import json
import sys
from pathlib import Path

import yaml


def migrate(project_dir: str):
    project_path = Path(project_dir)

    # Read source files
    with open(project_path / "story.json") as f:
        story = json.load(f)
    with open(project_path / "project.json") as f:
        project = json.load(f)

    # --- book.yaml ---
    book = {
        "title": project.get("title", story.get("title", "Untitled")),
        "author": project.get("author", ""),
        "illustrator": project.get("illustrator", ""),
        "created": project.get("created", ""),
        "specs": {
            "trim": project.get("specs", {}).get("trim", {"width": 8.5, "height": 8.5, "unit": "inches"}),
            "bleed": project.get("specs", {}).get("bleed", 0.125),
            "safeZone": project.get("specs", {}).get("safeZone", 0.25),
            "colorMode": project.get("specs", {}).get("colorMode", "CMYK"),
            "iccProfile": project.get("specs", {}).get("iccProfile", "GRACoL2006_Coated1v2"),
            "resolution": project.get("specs", {}).get("resolution", 300),
        },
        "style": project.get("style", {}),
        "typography": {
            "font": project.get("typography", {}).get("bodyFont", "Overlock"),
            "defaultSize": project.get("typography", {}).get("defaultSize", {}).get("body", 42),
        },
        "generation": project.get("generation", {}),
        "pageOrder": [p["pageNumber"] for p in story.get("pages", [])],
    }

    with open(project_path / "book.yaml", "w") as f:
        yaml.dump(book, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
    print(f"  Created book.yaml")

    # --- story/page-NN.md ---
    story_dir = project_path / "story"
    story_dir.mkdir(exist_ok=True)

    layout_pages = {}

    for page in story.get("pages", []):
        page_num = page["pageNumber"]
        page_type = page.get("type", "story")
        scene = page.get("scene", {})
        text_data = page.get("text")

        # Build frontmatter
        frontmatter = {
            "page": page_num,
            "type": page_type,
        }
        if page.get("folder"):
            frontmatter["folder"] = page["folder"]
        if scene.get("characters"):
            frontmatter["characters"] = scene["characters"]
        if scene.get("mood"):
            frontmatter["mood"] = scene["mood"]

        # Extract text content for markdown body
        text_contents = []
        if text_data:
            items = text_data if isinstance(text_data, list) else [text_data]
            for item in items:
                content = item.get("content", "")
                # Clean up whitespace-formatted text for markdown
                cleaned = content.strip()
                if cleaned:
                    text_contents.append(cleaned)

        # Build markdown
        lines = ["---"]
        lines.append(yaml.dump(frontmatter, default_flow_style=False, sort_keys=False).strip())
        lines.append("---")
        lines.append("")

        if text_contents:
            for i, tc in enumerate(text_contents):
                if i > 0:
                    lines.append("")
                lines.append(tc)
            lines.append("")

        if scene.get("description"):
            lines.append("## Scene Direction")
            lines.append("")
            lines.append(scene["description"])
            lines.append("")

        # Write page file
        filename = f"page-{page_num:02d}.md"
        with open(story_dir / filename, "w") as f:
            f.write("\n".join(lines))

        # --- layout.yaml entry ---
        if text_data:
            items = text_data if isinstance(text_data, list) else [text_data]
            layout_entries = []
            for item in items:
                entry = {}
                for key in ["content", "font", "fontSize", "lineHeight", "letterSpacing",
                             "color", "align", "leftPercent", "topPercent",
                             "widthPercent", "heightPercent"]:
                    if key in item:
                        entry[key] = item[key]
                if entry:
                    layout_entries.append(entry)
            if layout_entries:
                layout_pages[page_num] = layout_entries

    print(f"  Created {len(story.get('pages', []))} page files in story/")

    # --- layout.yaml ---
    layout = {"pages": layout_pages}
    with open(project_path / "layout.yaml", "w") as f:
        yaml.dump(layout, f, default_flow_style=False, sort_keys=False, allow_unicode=True, width=200)
    print(f"  Created layout.yaml ({len(layout_pages)} pages with text)")

    # --- characters migration ---
    chars_dir = project_path / "characters"
    manifest_path = chars_dir / "manifest.json"
    if manifest_path.exists():
        with open(manifest_path) as f:
            manifest = json.load(f)
        for char in manifest.get("characters", []):
            char_id = char.get("id", "unknown")
            char_dir = chars_dir / char_id
            char_md_path = char_dir / "character.md"
            if char_dir.exists() and not char_md_path.exists():
                fm = {
                    "name": char.get("name", char_id),
                    "role": "protagonist",
                }
                desc_path = char_dir / "description.md"
                description = ""
                if desc_path.exists():
                    description = desc_path.read_text().strip()
                else:
                    description = char.get("description", "")

                model_sheets = char.get("modelSheets", {})
                if model_sheets:
                    fm["model-sheet"] = model_sheets.get("primary", "")

                lines = ["---"]
                lines.append(yaml.dump(fm, default_flow_style=False, sort_keys=False).strip())
                lines.append("---")
                lines.append("")
                lines.append(description if description else f"Description of {char.get('name', char_id)}")
                lines.append("")

                with open(char_md_path, "w") as f:
                    f.write("\n".join(lines))
                print(f"  Created characters/{char_id}/character.md")

    print(f"\nMigration complete. Original files preserved.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 migrate-from-json.py <project-directory>")
        sys.exit(1)
    project = sys.argv[1]
    print(f"Migrating {project}...")
    migrate(project)
