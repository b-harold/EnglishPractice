/* app.js - extracted and refactored JavaScript for English Trainer */
(function () {
    'use strict';

    // Use standard SpeechRecognition or Webkit version (Chrome)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const synthesis = window.speechSynthesis;

    // Graceful support check
    function checkSpeechSupport() {
        if (!SpeechRecognition) {
            console.warn('Web Speech API not supported in this browser. Speech recognition will not work.');
        }
        if (!synthesis) {
            console.warn('SpeechSynthesis API not available. Text-to-speech will not work.');
        }
    }

    // State - will attempt to load from `phrases.json` or localStorage
    let phrases = [];

    function loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem('phrases');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    phrases = parsed;
                    return true;
                }
            }
        } catch (e) {
            console.warn('Failed to load phrases from localStorage', e);
        }
        return false;
    }

    function saveToLocalStorage() {
        try {
            localStorage.setItem('phrases', JSON.stringify(phrases));
        } catch (e) {
            console.warn('Failed to save phrases to localStorage', e);
        }
    }

    // Render phrases into the DOM using DOM methods (no inline onclicks)
    function renderPhrases() {
        const list = document.getElementById('phrasesList');
        list.innerHTML = '';

        phrases.forEach((phrase, index) => {
            const card = document.createElement('div');
            card.className = 'phrase-card';

                const phraseText = document.createElement('div');
                phraseText.className = 'phrase-text';
                // Render each word as a span so we can highlight individually
                const tokens = phrase.split(/\s+/).filter(Boolean);
                tokens.forEach((tok, wi) => {
                    const span = document.createElement('span');
                    span.className = 'word';
                    span.id = `word-${index}-${wi}`;
                    span.textContent = tok;
                    // store a cleaned form for comparisons
                    span.dataset.clean = tok.toLowerCase().replace(/[^a-z0-9']/g, '');
                    // confidence badge (filled when available)
                    const conf = document.createElement('span');
                    conf.className = 'word-conf';
                    conf.textContent = '';
                    span.appendChild(conf);
                    phraseText.appendChild(span);
                    // keep spacing
                    phraseText.appendChild(document.createTextNode(' '));
                });

            const controls = document.createElement('div');
            controls.className = 'controls';

            const btnListen = document.createElement('button');
            btnListen.className = 'btn btn-listen';
            btnListen.type = 'button';
            btnListen.innerHTML = '👂 Listen';
            btnListen.addEventListener('click', () => speakText(phrase));

            const btnRecord = document.createElement('button');
            btnRecord.className = 'btn btn-record';
            btnRecord.id = `rec-btn-${index}`;
            btnRecord.type = 'button';
            btnRecord.innerHTML = '🎙️ Practice';
            btnRecord.addEventListener('click', () => startRecording(phrase, index));

            controls.appendChild(btnListen);
            controls.appendChild(btnRecord);

            const resultArea = document.createElement('div');
            resultArea.className = 'result-area';
            resultArea.id = `result-${index}`;

            card.appendChild(phraseText);
            card.appendChild(controls);
            card.appendChild(resultArea);

            list.appendChild(card);
        });
    }

    function addPhrase() {
        const input = document.getElementById('newPhraseInput');
        const text = input.value.trim();
        if (text) {
            phrases.unshift(text);
            renderPhrases();
            saveToLocalStorage();
            input.value = '';
            input.focus();
        }
    }

    // TEXT TO SPEECH
    function speakText(text) {
        if (!synthesis) return;
        synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        synthesis.speak(utterance);
    }

    // SPEECH TO TEXT (Record user)
    function startRecording(targetPhrase, index) {
        if (!SpeechRecognition) {
            const resultDiv = document.getElementById(`result-${index}`);
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `<span style="color:var(--error)">Speech recognition not supported in this browser.</span>`;
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        const btn = document.getElementById(`rec-btn-${index}`);
        const resultDiv = document.getElementById(`result-${index}`);

        btn.innerText = '🛑 Listening...';
        btn.className = 'btn-record btn-recording';
        btn.disabled = true;
        resultDiv.style.display = 'none';

        recognition.start();

        recognition.onresult = (event) => {
            const userSpeech = event.results[0][0].transcript;
            const confidence = typeof event.results[0][0].confidence === 'number' ? event.results[0][0].confidence : null;
            const similarity = calculateSimilarity(targetPhrase, userSpeech);
            displayResult(index, targetPhrase, userSpeech, similarity, confidence);
        };

        recognition.onspeechend = () => {
            recognition.stop();
            resetButton(index);
        };

        recognition.onerror = (event) => {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `<span style="color:var(--error)">Error: ${event.error}. Try again.</span>`;
            resetButton(index);
        };
    }

    function resetButton(index) {
        const btn = document.getElementById(`rec-btn-${index}`);
        if (!btn) return;
        btn.innerText = '🎙️ Practice';
        btn.className = 'btn-record';
        btn.disabled = false;
    }

    // change: accept optional recognition confidence (0-1)
    function displayResult(index, target, spoken, score, recognitionConfidence) {
        const resultDiv = document.getElementById(`result-${index}`);
        if (!resultDiv) return;
        resultDiv.style.display = 'block';
        const color = score > 80 ? 'var(--success)' : (score > 50 ? '#f59e0b' : 'var(--error)');
        const message = score > 80 ? 'Great job!' : 'Keep trying!';

        // Word-level marking
        const targetTokens = getTokensForCompare(target);
        const userTokens = getTokensForCompare(spoken);
        const { ops, inserted } = alignWords(targetTokens, userTokens);
        markWords(index, ops, userTokens, recognitionConfidence);

        resultDiv.innerHTML = `
            <div>You said: <em>"${spoken}"</em></div>
            <div class="match-score" style="color:${color}">
                Accuracy: ${score}% - ${message}
            </div>
        `;

        if (inserted && inserted.length) {
            const insHtml = `<div class="inserted-words">Extra words: ${inserted.map(w => `<em>${w}</em>`).join(', ')}</div>`;
            resultDiv.insertAdjacentHTML('beforeend', insHtml);
        }
        // show overall recognition confidence if available
        if (typeof recognitionConfidence === 'number') {
            const pct = Math.round(recognitionConfidence * 100);
            const confHtml = `<div style="margin-top:6px;font-size:0.85rem;color:#6b7280">Recognition confidence: <strong>${pct}%</strong></div>`;
            resultDiv.insertAdjacentHTML('beforeend', confHtml);
        }
    }

    // Tokenize and clean strings for comparison (returns cleaned tokens)
    function getTokensForCompare(str) {
        if (!str) return [];
        return str
            .split(/\s+/)
            .map(s => s.replace(/[^a-z0-9']/gi, '').toLowerCase())
            .filter(Boolean);
    }

    // Align two token arrays and return ops for each target token plus inserted words
    function alignWords(targetTokens, userTokens) {
        const m = targetTokens.length;
        const n = userTokens.length;
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (targetTokens[i - 1] === userTokens[j - 1]) dp[i][j] = dp[i - 1][j - 1];
                else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
            }
        }

        const ops = [];
        const inserted = [];
        let i = m, j = n;
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && targetTokens[i - 1] === userTokens[j - 1]) {
                ops.unshift({ type: 'equal', t: i - 1, u: j - 1 });
                i--; j--;
            } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
                ops.unshift({ type: 'replace', t: i - 1, u: j - 1 });
                i--; j--;
            } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
                ops.unshift({ type: 'delete', t: i - 1 });
                i--;
            } else {
                // insertion (user extra)
                if (j > 0) inserted.unshift(userTokens[j - 1]);
                j--;
            }
        }

        return { ops, inserted };
    }

    // Mark target words in the DOM based on ops
    // recognitionConfidence is optional (0-1) and will be shown on badges when available
    function markWords(phraseIndex, ops, userTokens, recognitionConfidence) {
        // fuzzyThreshold: require at least 85% similarity for a word to be marked correct
        const fuzzyThreshold = 0.85;
        const highlightEnabled = document.getElementById('toggleHighlight')?.checked;
        // First clear existing classes
        const container = document.getElementById('phrasesList');
        if (!container) return;
        // ops aligns to each target token index in order
        ops.forEach((op) => {
            if (!('t' in op)) return; // skip pure insertions
            const wi = op.t;
            const el = document.getElementById(`word-${phraseIndex}-${wi}`);
            if (!el) return;
            el.classList.remove('correct', 'incorrect');
            const badge = el.querySelector('.word-conf');
            if (badge) {
                badge.style.opacity = '0';
                badge.textContent = '';
            }
            if (op.type === 'equal') {
                if (highlightEnabled) el.classList.add('correct');
                if (badge && typeof recognitionConfidence === 'number') {
                    badge.textContent = `${Math.round(recognitionConfidence * 100)}%`;
                    badge.style.opacity = '1';
                }
            } else if (op.type === 'replace' || op.type === 'delete') {
                if (op.type === 'replace' && userTokens && op.u != null) {
                    const target = el.dataset.clean || '';
                    const user = userTokens[op.u] || '';
                    const edit = getEditDistance(target, user);
                    const sim = target.length ? (target.length - edit) / target.length : 0;
                    if (sim >= fuzzyThreshold) {
                        if (highlightEnabled) el.classList.add('correct');
                    } else {
                        if (highlightEnabled) el.classList.add('incorrect');
                    }
                    el.title = `You said: ${user} (${Math.round(sim * 100)}%)`;
                    if (badge && typeof recognitionConfidence === 'number') {
                        badge.textContent = `${Math.round(recognitionConfidence * 100)}%`;
                        badge.style.opacity = '1';
                    }
                } else {
                    if (highlightEnabled) el.classList.add('incorrect');
                    el.title = 'Missing word';
                }
            }
        });
    }

    // Levenshtein-based similarity (0-100)
    function calculateSimilarity(a, b) {
        if (typeof a !== 'string') a = String(a || '');
        if (typeof b !== 'string') b = String(b || '');

        a = a.toLowerCase().replace(/[^a-z0-9 ]/g, '');
        b = b.toLowerCase().replace(/[^a-z0-9 ]/g, '');

        if (a.length === 0 && b.length === 0) return 100;
        if (a.length === 0) return 0;

        const dist = getEditDistance(a, b);
        const accuracy = (a.length - dist) / a.length;
        return Math.max(0, Math.floor(accuracy * 100));
    }

    function getEditDistance(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) costs[j] = j;
                else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    // Initialization: bind UI elements
    function init() {
        checkSpeechSupport();
        const addBtn = document.getElementById('addPhraseBtn');
        if (addBtn) addBtn.addEventListener('click', addPhrase);

        const downloadBtn = document.getElementById('downloadPhrasesBtn');
        if (downloadBtn) downloadBtn.addEventListener('click', downloadPhrases);

        const input = document.getElementById('newPhraseInput');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') addPhrase();
            });
        }

        // wire import UI (button triggers hidden file input)
        const importBtn = document.getElementById('importPhrasesBtn');
        const importInput = document.getElementById('importPhrasesInput');
        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => importInput.click());
            importInput.addEventListener('change', handleImportInputChange);
        }

        // Attempt to load from localStorage first (previous user edits)
        if (loadFromLocalStorage()) {
            renderPhrases();
            return;
        }

        // Otherwise try to fetch phrases.json from the server
        fetch('phrases.json', { cache: 'no-store' })
            .then((resp) => {
                if (!resp.ok) throw new Error('Failed to fetch phrases.json');
                return resp.json();
            })
            .then((data) => {
                if (Array.isArray(data)) phrases = data;
            })
            .catch((err) => {
                console.warn('Could not load phrases.json, using defaults', err);
                // fall back to a minimal default set
                phrases = [
                    'Hello, how are you today?',
                    'I would like to learn English.',
                    'The weather is nice.'
                ];
            })
            .finally(() => renderPhrases());
    }

    // Allow user to download current phrases as JSON (manual persistence)
    function downloadPhrases() {
        const dataStr = JSON.stringify(phrases, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'phrases.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // IMPORT: read a JSON file from the user and load phrases
    function importPhrasesFromFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                if (!Array.isArray(parsed)) throw new Error('JSON must be an array of phrases');
                // validate elements are strings
                const allStrings = parsed.every((p) => typeof p === 'string');
                if (!allStrings) throw new Error('All items in JSON array must be strings');
                phrases = parsed.slice();
                saveToLocalStorage();
                renderPhrases();
                alert('Phrases imported successfully.');
            } catch (err) {
                console.error('Failed to import phrases', err);
                alert('Failed to import JSON: ' + (err && err.message ? err.message : err));
            }
        };
        reader.onerror = (err) => {
            console.error('File read error', err);
            alert('Failed to read file.');
        };
        reader.readAsText(file, 'utf-8');
    }

    function handleImportInputChange(e) {
        const file = e.target.files && e.target.files[0];
        if (file) importPhrasesFromFile(file);
        // reset input so same file can be re-selected later
        e.target.value = '';
    }

    // Expose init to window and auto-run when DOM ready
    window.EnglishTrainer = {
        init
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
