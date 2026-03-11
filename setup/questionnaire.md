# Setup Questionnaire

One-time configuration for the book creation workspace.
Answer all questions in one pass. These configure the system, not any specific book.

## Questions

1. **Your name** (as it appears on books as author)
   Example: "Shantam"

2. **Default art style** (can be overridden per book)
   Example: "Whimsical watercolor with soft edges"

3. **Default mood/tone** (can be overridden per book)
   Example: "Warm, dreamy, magical"

4. **Default font** for story text
   Example: "Overlock" (Google Font)

5. **Default trim size** (most common for your books)
   Example: "8.5x8.5" (square hardcover)

6. **Where do your book projects live on disk?**
   Default: "projects/" (relative to this workspace)

7. **Gemini API key location** (for nb CLI)
   Example: "~/.openclaw/openclaw.json" or environment variable

8. **Do you want auto-git-commit when saving changes?** (yes/no)
   Default: yes

## Instructions for the agent

Ask these questions conversationally. Write answers to `setup/config.yaml`.
If `config.yaml` already exists, setup is complete — skip the questionnaire.
