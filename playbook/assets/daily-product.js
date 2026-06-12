const root = document.getElementById('daily-product-root');
const batch = document.getElementById('batch-chip');
const state = {
  manifest: null,
  days: [],
  active: 0,
  revealed: false
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
function safePuzzleType(day) {
  return day?.modules?.daily_puzzle?.type || 'puzzle';
}

function render() {
  const day = state.days[state.active];
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
      state.revealed = false;
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
  renderPuzzle(puzzle, pz);

  const right = child(layout, 'div', 'dp-right');
  renderLookback(right, day.modules.lookback);
  renderArticle(main, day.modules.article);
  renderPlayNext(main);
}

function renderPuzzle(parent, pz) {
  if (pz.type === 'connections') return renderConnections(parent, pz);
  if (pz.type === 'hoardle') return renderHoardle(parent, pz);
  if (pz.type === 'crossword') return renderCrossword(parent, pz);
  child(parent, 'div', 'dp-gameday-empty', `Unsupported or pending puzzle type: ${pz.type || 'unknown'}`);
}

function renderHoardle(parent, pz) {
  const answer = String(pz.answer || '').toUpperCase();
  const wrap = child(parent, 'div', 'dtp-wrap');
  child(wrap, 'p', 'dtp-small', pz.theme || 'Five-letter Thunder/NBA word.');
  const word = child(wrap, 'div', 'dp-word');
  answer.split('').forEach(() => child(word, 'span', 'dp-letter', '•'));
  const controls = child(wrap, 'div', 'dtp-controls');
  const reveal = child(controls, 'button', 'dtp-btn', 'Reveal answer');
  reveal.type = 'button';
  const status = child(wrap, 'div', 'dtp-status', '');
  reveal.addEventListener('click', () => {
    word.replaceChildren();
    answer.split('').forEach(letter => child(word, 'span', 'dp-letter', letter));
    status.textContent = answer ? `Answer: ${answer}` : 'Answer pending.';
    reveal.disabled = true;
  });
}

function renderCrossword(parent, pz) {
  const wrap = child(parent, 'div', 'dtp-wrap');
  child(wrap, 'p', 'dtp-small', pz.summary || 'Reviewed crossword slot.');
  const slug = pz.replacement_slug || pz.slug;
  if (slug) {
    const a = child(wrap, 'a', 'btn', 'Open crossword archive source');
    a.href = `../../puzzle_archive/crossword_info_import/crosswords_archive/${encodeURIComponent(slug)}/index.html`;
  } else {
    child(wrap, 'div', 'dp-gameday-empty', 'Crossword source slug pending.');
  }
}

function renderConnections(parent, pz) {
  const groups = Array.isArray(pz.groups) ? pz.groups : [];
  if (groups.length !== 4 || groups.some(g => !Array.isArray(g.answers) || g.answers.length !== 4)) {
    child(parent, 'div', 'dp-gameday-empty', 'Curated groups pending.');
    return;
  }

  const wrap = child(parent, 'div', 'dtp-wrap');
  child(wrap, 'p', 'dtp-small', 'Find the 4 sets of 4.');
  const board = child(wrap, 'div', 'dtp-board');
  const controls = child(wrap, 'div', 'dtp-controls');
  const check = child(controls, 'button', 'dtp-btn', 'Check');
  const clear = child(controls, 'button', 'dtp-btn', 'Clear');
  const share = child(controls, 'button', 'dtp-btn', 'Share');
  check.type = clear.type = share.type = 'button';
  share.disabled = true;
  const status = child(wrap, 'div', 'dtp-status', '');
  const missesWrap = child(wrap, 'div', 'dtp-small', 'Misses: ');
  const missesEl = child(missesWrap, 'span', '', '0');
  child(missesWrap, 'span', '', ' / 4');
  const meta = child(wrap, 'div', 'dtp-meta', 'Click a solved tile to see its category.');
  const shareBox = child(wrap, 'div', 'dtp-sharebox');
  const shareText = child(shareBox, 'textarea', '', '');
  shareText.readOnly = true;

  const tiles = shuffle(groups.flatMap(g => g.answers));
  const selected = new Set();
  const solved = new Set();
  const groupMap = new Map();
  const attempts = [];
  let misses = 0;
  let lastKey = null;
  let mustChange = false;
  let gameOver = false;
  let finished = null;

  function renderBoard() {
    board.replaceChildren();
    tiles.forEach(word => {
      const t = child(board, 'button', 'dtp-tile', word);
      t.type = 'button';
      if (solved.has(word)) t.classList.add('dtp-solved', `grp-${groupMap.get(word)}`);
      else if (selected.has(word)) t.classList.add('dtp-sel');
      t.addEventListener('click', () => {
        if (solved.has(word)) {
          meta.textContent = groups[groupMap.get(word)].name;
          return;
        }
        if (gameOver) return;
        if (selected.has(word)) selected.delete(word);
        else if (selected.size < 4) selected.add(word);
        if (mustChange) {
          mustChange = false;
          lastKey = null;
        }
        renderBoard();
      });
    });
    updateButtons();
  }
  function updateButtons() {
    const current = key(selected);
    const same = selected.size === 4 && lastKey && current === lastKey;
    check.disabled = gameOver || selected.size !== 4 || mustChange || same;
    clear.disabled = gameOver || selected.size === 0;
    share.disabled = !gameOver;
  }
  function bestMatch(pick) {
    let best = 0;
    const set = new Set(pick);
    groups.forEach(g => {
      let c = 0;
      g.answers.forEach(a => { if (set.has(a)) c++; });
      best = Math.max(best, c);
    });
    return best;
  }
  function solveAll() {
    groups.forEach((g, gi) => g.answers.forEach(a => {
      solved.add(a);
      groupMap.set(a, gi);
    }));
    selected.clear();
    gameOver = true;
    renderBoard();
  }
  check.addEventListener('click', () => {
    if (selected.size !== 4 || gameOver) return;
    const pick = [...selected];
    const pickKey = key(pick);
    if (lastKey && pickKey === lastKey) {
      mustChange = true;
      status.textContent = 'Change at least one tile.';
      updateButtons();
      return;
    }
    lastKey = pickKey;
    let hit = -1;
    groups.forEach((g, i) => { if (pickKey === key(g.answers)) hit = i; });
    if (hit >= 0) {
      attempts.push('⚡');
      groups[hit].answers.forEach(a => {
        solved.add(a);
        groupMap.set(a, hit);
      });
      selected.clear();
      mustChange = false;
      lastKey = null;
      status.textContent = 'Correct.';
      meta.textContent = groups[hit].name;
      if (solved.size === tiles.length) {
        finished = 'solved';
        gameOver = true;
        status.textContent = 'Solved.';
      }
      renderBoard();
      return;
    }
    attempts.push('🗻');
    misses += 1;
    missesEl.textContent = String(misses);
    mustChange = true;
    status.textContent = `No. You got ${bestMatch(pick)}/4.`;
    if (misses >= 4) {
      finished = 'lost';
      status.textContent += ' Out of misses.';
      solveAll();
      return;
    }
    updateButtons();
  });
  clear.addEventListener('click', () => {
    selected.clear();
    mustChange = false;
    lastKey = null;
    status.textContent = '';
    renderBoard();
  });
  share.addEventListener('click', () => {
    const wrongs = attempts.filter(x => x === '🗻').length;
    const final = finished === 'solved' ? '🏁' : '💀';
    shareText.value = `I played "${pz.title || 'Daily Thunder Playbook'}" with ${wrongs} wrong guess${wrongs === 1 ? '' : 'es'}!\n\n${attempts.join('')}${final}\n\nDaily Thunder Playbook`;
    shareBox.style.display = 'block';
    shareText.focus();
    shareText.select();
  });
  renderBoard();
}

function renderLookback(parent, lookback) {
  if (!lookback || !lookback.game) return;
  const game = lookback.game;
  const look = child(parent, 'section', 'card');
  child(look, 'div', 'dp-eyebrow', 'Lookback Board');
  child(look, 'h2', 'dp-panel-title', game.matchup || 'Thunder lookback');
  child(look, 'p', 'date', `${game.game_date || ''} · ${game.scoreboard || ''}`.trim());

  const facts = child(look, 'div', 'dp-facts');
  (lookback.board?.revealed || []).forEach(field => {
    const label = field.replace(/_/g, ' ');
    const value = field === 'date' ? game.game_date : game[field];
    child(facts, 'div', 'dp-fact', `${label}: ${listText(value)}`);
  });

  const guesses = [
    ['Winner', game.winner],
    ['Margin', game.margin],
    ['Game high points', game.game_high_points],
    ['OKC rebounds leader', game.okc_rebounds_leader],
    ['OKC assists leader', game.okc_assists_leader]
  ];
  const table = child(look, 'table', 'dp-board-table');
  const body = child(table, 'tbody');
  guesses.forEach(([label, value]) => {
    const tr = child(body, 'tr');
    child(tr, 'td', '', label);
    child(tr, 'td', '', state.revealed ? listText(value) : 'hidden');
  });
  const reveal = child(look, 'button', 'dp-action', state.revealed ? 'Hide answers' : 'Reveal board');
  reveal.type = 'button';
  reveal.addEventListener('click', () => {
    state.revealed = !state.revealed;
    render();
  });
}

function renderArticle(parent, article) {
  if (!article) return;
  const yb = child(parent, 'section', 'card dp-yearbook');
  child(yb, 'div', 'dp-eyebrow', 'From the archive');
  child(yb, 'h2', '', article.article_title || 'Daily Thunder article');
  child(yb, 'p', '', state.revealed ? (article.preamble || 'Selected article unlocks after the lookback reveal.') : 'Hidden until board reveal. Complete or reveal the scoreboard board first.');
  if (state.revealed && article.article_url) {
    const a = child(yb, 'a', 'btn', 'Open selected article');
    a.href = article.article_url;
    a.target = '_blank';
    a.rel = 'noopener';
  }
}

function renderPlayNext(parent) {
  const wrap = child(parent, 'section', 'card');
  child(wrap, 'div', 'dp-eyebrow', 'Play next');
  const next = state.days[state.active + 1];
  if (next) {
    const b = child(wrap, 'button', 'btn btn-primary', `Next: ${dateLabel(next.date)}`);
    b.type = 'button';
    b.addEventListener('click', () => {
      state.active += 1;
      state.revealed = false;
      render();
    });
  } else {
    child(wrap, 'p', '', 'End of the imported Playbook slate.');
  }
}

async function load() {
  const manifestRes = await fetch('../data/playbook_manifest.json', { cache: 'no-store' });
  if (!manifestRes.ok) throw new Error(`manifest ${manifestRes.status}`);
  const manifest = await manifestRes.json();
  const days = await Promise.all((manifest.days || []).map(async entry => {
    const res = await fetch(`../data/${entry.file}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${entry.file} ${res.status}`);
    return res.json();
  }));
  state.manifest = manifest;
  state.days = days;
  render();
}

load().catch(err => {
  root.textContent = `Daily Product failed to load: ${err.message}`;
});
