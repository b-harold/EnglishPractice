// cards.js - simple flashcards derived from phrases.json
(function () {
  'use strict';

  // cards: array of { term, translation }
  let cards = [];
  let idx = 0;
  let flipped = false;

  function loadCardsJson() {
    return fetch('cards.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
  }

  function loadPhrasesFallback() {
    // fallback keeps previous behavior: derive words from phrases.json
    return fetch('phrases.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);
  }

  function buildCardsFromPhrases(phrases) {
    const set = new Set();
    phrases.forEach(p => {
      p.split(/\s+/).map(w => w.replace(/[^a-z0-9']/gi, '').toLowerCase()).filter(Boolean).forEach(w => set.add(w));
    });
    return Array.from(set).sort().map(w => ({ term: w, translation: '' }));
  }

  function renderCard() {
    const el = document.getElementById('card');
    if (!el) return;
    if (!cards.length) {
      el.textContent = 'No cards available.';
      return;
    }
    const c = cards[idx % cards.length];
    if (!flipped) {
      el.textContent = c.term;
      el.classList.remove('flipped');
    } else {
      el.textContent = c.translation || '—';
      el.classList.add('flipped');
    }
  }

  function next() { idx = (idx + 1) % cards.length; flipped = false; renderCard(); }
  function prev() { idx = (idx - 1 + cards.length) % cards.length; flipped = false; renderCard(); }
  function flip() { flipped = !flipped; renderCard(); }

  // Text-to-Speech for a given term (simple English TTS)
  function speakTerm(text) {
    if (!window.speechSynthesis) return;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }

  // Fisher-Yates shuffle
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function shuffleCards() {
    if (!cards || cards.length <= 1) return;
    shuffleArray(cards);
    idx = 0; flipped = false; renderCard();
  }

  function init() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const flipBtn = document.getElementById('flipBtn');
    const card = document.getElementById('card');
    const playBtn = document.getElementById('playBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');

    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);
    if (flipBtn) flipBtn.addEventListener('click', flip);
    if (card) card.addEventListener('click', flip);
    if (playBtn) playBtn.addEventListener('click', () => {
      const c = cards[idx % cards.length];
      if (c && c.term) speakTerm(c.term);
    });
    if (shuffleBtn) shuffleBtn.addEventListener('click', shuffleCards);

    loadCardsJson().then(data => {
      if (Array.isArray(data) && data.length) {
        // normalize items to have term/translation
        cards = data.map(item => ({ term: String(item.term || item.word || ''), translation: String(item.translation || item.meaning || '') }));
        idx = 0; renderCard();
      } else {
        // fallback
        loadPhrasesFallback().then(ps => {
          cards = buildCardsFromPhrases(ps || []);
          idx = 0; renderCard();
        });
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
