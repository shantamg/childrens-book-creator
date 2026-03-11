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

9. **What port should the web preview tool use?**
   This controls the address you'll open in your browser (e.g. localhost:3000). The default of 3000 is fine if you have no preference — just press Enter. If another app already uses that port, pick any number between 3001 and 9999.

## Instructions for the agent

Ask these questions conversationally. Write answers to `setup/config.yaml`.
After writing `config.yaml`, also write the port to `web/.env.local` as `PORT=<number>` (preserve any other variables already in that file).
If `config.yaml` already exists, setup is complete — skip the questionnaire.
