
# EnglishPractice — Speak with Confidence

Modern, privacy-first web app to practice English pronunciation, learn important words & phrasal verbs, and get instant per-word feedback using browser speech APIs. No backend, no tracking — everything runs in your browser.


## Features
- **Trainer**: Practice speaking phrases, get per-word feedback, and see which words you pronounced correctly (with confidence badges).
- **Word Cards**: Flip through important words and phrasal verbs, with Spanish translations and TTS playback.
- **Customizable Lists**: Add your own phrases, export/import JSON to carry your progress between devices.
- **Real-time Feedback**: Per-word highlighting, fuzzy matching (≥85% similarity), and recognition confidence display.
- **Mobile-friendly UI**: Modern, responsive design with accessible controls, icons/emojis, and clear navigation.
- **Works offline-ish**: Phrases are stored in localStorage; no backend required. For best speech recognition, use Chrome/Edge.


## Key Behavior
- **Fuzzy Matching**: Words are marked correct if they match the target at ≥85% similarity (configurable in code).
- **Highlight Toggle**: Enable/disable per-word highlighting with the "Word highlight" checkbox.
- **Confidence Display**: Recognition confidence (if provided by browser) is shown next to words and as an overall percentage.


## Requirements
- Modern browser with Web Speech API support (Google Chrome, Microsoft Edge recommended).
- **Python 3.x** — Required to run the local development server.
- No backend/server required; all data is local.

### Installing Python (if needed)
If Python is not installed on your system:
1. Download from [python.org](https://www.python.org/downloads/)
2. Run the installer and **check "Add Python to PATH"** (important!)
3. Verify installation:
   ```bash
   python --version
   # or on some systems:
   python3 --version
   ```

## Project Structure
```
EnglishPractice/
├── index.html                 # Home page
├── README.md                  # This file
├── LICENSE                    # CC BY-NC 4.0 license
├── css/
│   └── styles.css            # All styling
├── data/
│   ├── cards.json            # Word/phrasal verbs data
│   └── phrases.json          # Default phrases for practice
├── js/
│   ├── app.js                # Trainer page logic
│   └── cards.js              # Word Cards page logic
└── pages/
    ├── trainer.html          # Trainer (pronunciation practice)
    └── cards.html            # Word Cards (flip cards)
```

## Usage
1. **Serve the folder** (recommended) and open in a supported browser. For a quick local server:
	```bash
	python -m http.server 8000
	# or if using Python 2:
	python -m SimpleHTTPServer 8000
	# then open http://localhost:8000
	```
   > ⚠️ **Important**: If you see "command not found" or the server won't start, [install Python first](#installing-python-if-needed).
2. **Home Page**: Overview and navigation to Trainer and Word Cards.
3. **Trainer**: Click `Listen` to hear a phrase, `Practice` to record and get feedback. Add new phrases, export/import your list.
4. **Word Cards**: Flip through important words/phrasal verbs (from `data/cards.json`), see Spanish translations, and use TTS playback.

**Note:** Speech recognition requires microphone access and may vary by browser/device. Some browsers provide a single confidence score for the whole result rather than per-word confidences.


## Development
- No build step — edit files and refresh the page. The app reads `data/phrases.json` and `data/cards.json` on load and also saves edits to `localStorage`.
- All logic is in `js/app.js` (Trainer) and `js/cards.js` (Word Cards). UI is styled via `css/styles.css`.


## Export / Import
- Use the `Export JSON` button to download your current phrases.
- Use `Import JSON` to upload an array of strings (a JSON file) to replace the phrase list.
- Cards are loaded from `data/cards.json` (array of `{ term, translation }`).


## Collaboration & Contributing
- Open to contributions! Please submit issues or pull requests for improvements, new features, or bug fixes.
- All code is plain HTML/CSS/JS — no build tools required.
- For new words/phrasal verbs, edit `data/cards.json` (include Spanish translation for consistency).


## License
This project is licensed under the [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/).

- **You may not use this software for commercial purposes (selling, paid services, etc).**
- You are free to share, adapt, and remix with attribution.
- See the `LICENSE` file for full terms.
