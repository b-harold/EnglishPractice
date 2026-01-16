// cards.js - simple flashcards with embedded data
(function () {
  'use strict';

  // Embedded cards data (no fetch needed)
  const DEFAULT_CARDS = [
    { "term": "wonder", "translation": "preguntarse / maravilla" },
    { "term": "wonderful", "translation": "maravilloso" },
    { "term": "integrated", "translation": "integrado" },
    { "term": "improve", "translation": "mejorar" },
    { "term": "practice", "translation": "practicar" },
    { "term": "take off", "translation": "despegar / quitar (ropa)" },
    { "term": "pick up", "translation": "recoger / aprender (informal)" },
    { "term": "turn on", "translation": "encender" },
    { "term": "turn off", "translation": "apagar" },
    { "term": "look after", "translation": "cuidar de" },
    { "term": "get along (with)", "translation": "llevarse bien (con)" },
    { "term": "give up", "translation": "rendirse / dejar de" },
    { "term": "pick out", "translation": "elegir / seleccionar" },
    { "term": "break down", "translation": "averiarse / descomponer" },
    { "term": "carry on", "translation": "continuar" }
  ];

  // cards: array of { term, translation }
  let cards = [];
  let idx = 0;
  let flipped = false;

  function renderCard() {
    const container = document.querySelector('.card-inner');
    const front = document.getElementById('cardFront');
    const back = document.getElementById('cardBack');
    const progress = document.getElementById('cardProgress');
    if (!front || !back || !container) return;
    if (!cards.length) {
      const frontContent = front.querySelector('div:last-child');
      if (frontContent) frontContent.textContent = 'No cards available.';
      const backContent = back.querySelector('div:last-child');
      if (backContent) backContent.textContent = '';
      if (progress) progress.textContent = '0 / 0';
      return;
    }
    const c = cards[idx % cards.length];
    const frontContent = front.querySelector('div:last-child');
    const backContent = back.querySelector('div:last-child');
    if (frontContent) frontContent.textContent = c.term || '';
    if (backContent) backContent.textContent = c.translation || '';
    if (flipped) container.classList.add('flipped'); else container.classList.remove('flipped');
    if (progress) progress.textContent = `${idx + 1} / ${cards.length}`;
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

    // Use embedded default cards (no fetch)
    cards = DEFAULT_CARDS;
    idx = 0;
    renderCard();
  }

  // Ensure init runs after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM is already ready, call init immediately
    setTimeout(init, 0);
  }

})();
