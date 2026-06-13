const root = document.getElementById('daily-product-root');
const batch = document.getElementById('batch-chip');
const state = {
  manifest: null,
  days: [],
  active: 0,
  lookbacks: {},
  hoardle: {},
  shai: {}
};

function node(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}
function child(parent, tag, cls, text) {
  const n = node(tag, cls, text);
  parent.appendChild(n);
  return n;
}
function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function key(arr) {
  return [...arr].sort().join('|');
}
function dateLabel(date) {
  const d = new Date(`${date}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function listText(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}
function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
function normalizeCompact(value) {
  return normalize(value).replace(/\s+/g, '');
}
function safePuzzleType(day) {
  return day?.modules?.daily_puzzle?.type || 'puzzle';
}
function activeDay() {
  return state.days[state.active];
}
function getLookbackState(date) {
  if (!state.lookbacks[date]) {
    state.lookbacks[date] = { revealed: false, answers: {}, results: {}, checked: false };
  }
  return state.lookbacks[date];
}
function getHoardleState(date) {
  if (!state.hoardle[date]) {
    state.hoardle[date] = { guesses: [], solved: false, lost: false, message: '' };
  }
  return state.hoardle[date];
}
function canUnlockArticle(day) {
  const lb = getLookbackState(day.date);
  return lb.revealed || Object.values(lb.results || {}).some(Boolean) || allLookbackCorrect(day);
}
function allLookbackCorrect(day) {
  const lookback = day.modules.lookback;
  const fields = lookback?.board?.guess_fields || [];
  if (!fields.length) return false;
  const lb = getLookbackState(day.date);
  return fields.every(field => lb.results[field] === true);
}

function render() {
  const day = activeDay();
  if (!day) {
    root.textContent = 'No Playbook days loaded.';
    return;
  }
  root.replaceChildren();
  batch.textContent = `${state.days.length} public-safe day${state.days.length === 1 ? '' : 's'}`;

  const tabs = child(root, 'aside', 'card');
  child(tabs, 'div', 'dp-eyebrow', 'Dates');
  const list = child(tabs, 'div', 'dp-tabs');
  state.days.forEach((d, i) => {
    const b = child(list, 'button', 'dp-tab', `${dateLabel(d.date)} · ${safePuzzleType(d)}`);
    b.type = 'button';
    b.setAttribute('aria-selected', String(i === state.active));
    b.addEventListener('click', () => {
      state.active = i;
      render();
    });
  });

  if (Array.isArray(state.manifest?.skipped) && state.manifest.skipped.length) {
    const skipped = child(tabs, 'div', 'dp-gameday-empty');
    skipped.textContent = `Skipped: ${state.manifest.skipped.map(s => `${s.date} (${s.reason || s.status})`).join(', ')}`;
  }

  const main = child(root, 'div', 'dp-main');
  const layout = child(main, 'div', 'dp-layout');
  const puzzle = child(layout, 'section', 'card dp-puzzle-card');
  const pz = day.modules.daily_puzzle || {};
  child(puzzle, 'div', 'dp-eyebrow', 'Daily Free Puzzle');
  child(puzzle, 'h2', 'dp-panel-title', pz.title || 'Puzzle');
  if (pz.summary) child(puzzle, 'p', '', pz.summary);
  if (pz.guide) child(puzzle, 'p', 'date', pz.guide);
  renderPuzzle(puzzle, pz, day);

  const right = child(layout, 'div', 'dp-right');
  renderLookback(right, day.modules.lookback, day);
  renderArticle(main, day.modules.article, day);
  renderPlayNext(main);
}

