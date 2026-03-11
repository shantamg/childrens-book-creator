# Setup Questionnaire

One-time configuration for the book creation workspace.
If `setup/config.yaml` already exists, setup is complete — skip the questionnaire.

## Questions

Ask each question one at a time using AskUserQuestion. Show the default value so the user can just press Enter to accept it. If the user's answer is empty or just confirms the default, use the default.

### 1. Author name
- Question: "What name should appear on your books as author?"
- No default — must be provided

### 2. Default art style
- Question: "Default art style for illustrations? (can override per book)"
- Default: "Whimsical watercolor with soft edges"

### 3. Default mood/tone
- Question: "Default mood/tone? (can override per book)"
- Default: "Warm, dreamy, magical"

### 4. Default font
- Question: "Default font for story text? Browse options at https://fonts.google.com — you can change this anytime."
- Default: "Overlock"

### 5. Default format
- Read `_config/formats.yaml` for available formats
- Question: "Default book format? Options: pocket-book (4.25×6.87), novella (5×8), digest (5.5×8.5), us-trade (6×9), medium-trade (7×9), portrait (8×10), us-letter (8.5×11), small-square (7.5×7.5), square (8.5×8.5), large-square (10×10), landscape (9×7), and more — see _config/formats.yaml for all 19 options."
- Default: "square" (8.5×8.5)

### 6. Web preview port
- Question: "Port for the web preview tool? (pick another if 3000 is taken)"
- Default: 3000

### 7. Gemini API key (conditional)
Before asking, check if `GEMINI_API_KEY` is already set in the environment or in `.env` at the workspace root. If it's already available, skip this question entirely. If not:
- Question: "Gemini API key for image generation (get one at https://aistudio.google.com/apikey):"
- No default — must be provided

## After collecting answers

1. Write answers to `setup/config.yaml` with these fields:
   - `author`, `defaultArtStyle`, `defaultMood`, `defaultFont`, `defaultFormat`, `port`
2. Write the port to `web/.env.local` as `PORT=<number>` (preserve any other variables already in that file)
3. If a Gemini API key was collected, write it to `.env` at the workspace root as `GEMINI_API_KEY=<key>`
