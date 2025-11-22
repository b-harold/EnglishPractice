# English Pronunciation Trainer

Small single-page web app to practice English pronunciation using the browser Speech APIs.

## Features
- Listen to example phrases using Text-to-Speech (TTS).
- Record your pronunciation and get a basic similarity score (Levenshtein-based).
- Per-word feedback with highlighting for correctly/incorrectly spoken words.
- Export and import your phrase lists as JSON.

## Key behavior
- Word fuzzy-match threshold: a word is considered correct if it matches the target at >= 85% similarity (configurable in code).
- Word highlighting can be toggled with the "Word highlight" checkbox in the UI.
- Recognition confidence (when the browser provides it) is shown next to words and as an overall percentage.

## Requirements
- Modern desktop browser with Web Speech API support (Google Chrome, Microsoft Edge).

## Usage
1. Serve the folder (recommended) and open in a supported browser. For a quick local server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

2. Click `Listen` to hear a phrase.
3. Click `Practice` and speak; the app will transcribe and show per-word feedback and an accuracy score.

Note: Speech recognition requires microphone access and may vary by browser/device. Some browsers provide a single confidence score for the whole result rather than per-word confidences.

## Development
- No build step — edit files and refresh the page. The app reads `phrases.json` on load and also saves edits to `localStorage`.

## Export / Import
- Use the `Export JSON` button to download your current phrases.
- Use `Import JSON` to upload an array of strings (a JSON file) to replace the phrase list.

## License
This project is unlicensed. Add a `LICENSE` file if you want to specify terms.
