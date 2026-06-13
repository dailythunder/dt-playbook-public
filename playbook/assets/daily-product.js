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

function renderPuzzle(parent, pz, day) {
  if (pz.type === 'connections') return renderConnections(parent, pz);
  if (pz.type === 'hoardle') return renderHoardle(parent, pz, day);
  if (pz.type === 'crossword') return renderCrossword(parent, pz);
  if (pz.type === 'shaisweeper') return renderShaiSweeper(parent, pz, day);
  if (pz.type === 'scoreboard_board') return renderScoreboardPuzzle(parent, pz, day);
  child(parent, 'div', 'dp-gameday-empty', `Unsupported or pending puzzle type: ${pz.type || 'unknown'}`);
}

function renderHoardle(parent, pz, day) {
  const answer = String(pz.answer || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
  const accepted = new Set((Array.isArray(pz.accepted_answers) && pz.accepted_answers.length ? pz.accepted_answers : [answer]).map(a => String(a).toUpperCase()));
  const hs = getHoardleState(day.date);
  const wrap = child(parent, 'div', 'dtp-wrap hoardle-widget');
  child(wrap, 'p', 'dtp-small', pz.theme || 'Five-letter Thunder/NBA word.');

  const board = child(wrap, 'div', 'hoardle-board');
  const maxRows = 6;
  for (let row = 0; row < maxRows; row++) {
    const guess = hs.guesses[row];
    const rowEl = child(board, 'div', 'hoardle-row');
    for (let i = 0; i < 5; i++) {
      const cell = child(rowEl, 'span', 'hoardle-cell', guess ? guess.letters[i] || '' : '');
      if (guess) cell.classList.add(guess.marks[i] || 'absent');
    }
  }

  const form = child(wrap, 'form', 'hoardle-form');
  const input = child(form, 'input', 'hoardle-input');
  input.type = 'text';
  input.maxLength = 5;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'Guess';
  input.setAttribute('aria-label', 'Hoardle guess');
  const submit = child(form, 'button', 'dtp-btn', 'Guess');
  submit.type = 'submit';
  const reveal = child(form, 'button', 'dtp-btn', 'Reveal');
  reveal.type = 'button';
  const share = child(form, 'button', 'dtp-btn', 'Share');
  share.type = 'button';
  share.disabled = !(hs.solved || hs.lost);
  const status = child(wrap, 'div', 'dtp-status', hs.message || 'Six guesses. Five letters. Thunder brain.');
  const shareBox = child(wrap, 'div', 'dtp-sharebox');
  const shareText = child(shareBox, 'textarea', '', '');
  shareText.readOnly = true;

  if (!answer || answer.length !== 5) {
    input.disabled = submit.disabled = reveal.disabled = true;
    status.textContent = 'Hoardle answer pending.';
    return;
  }
  if (hs.solved || hs.lost) input.disabled = submit.disabled = true;

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (hs.solved || hs.lost) return;
    const raw = input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
    if (raw.length !== 5) {
      hs.message = 'Enter a five-letter guess.';
      render();
      return;
    }
    const marks = scoreHoardle(raw, answer);
    hs.guesses.push({ letters: raw.split(''), marks });
    if (accepted.has(raw) || raw === answer) {
      hs.solved = true;
      hs.message = `Solved in ${hs.guesses.length}.`;
    } else if (hs.guesses.length >= maxRows) {
      hs.lost = true;
      hs.message = `Out of guesses. Answer: ${answer}.`;
    } else {
      hs.message = `${maxRows - hs.guesses.length} guess${maxRows - hs.guesses.length === 1 ? '' : 'es'} left.`;
    }
    render();
  });
  reveal.addEventListener('click', () => {
    hs.lost = true;
    hs.message = `Answer: ${answer}.`;
    render();
  });
  share.addEventListener('click', () => {
    const lines = hs.guesses.map(g => g.marks.map(m => m === 'correct' ? '🟦' : m === 'present' ? '🟧' : '⬜').join(''));
    shareText.value = `Hoardle ${day.date} ${hs.solved ? hs.guesses.length : 'X'}/6\n${lines.join('\n')}\n\nDaily Thunder Playbook`;
    shareBox.style.display = 'block';
    shareText.focus();
    shareText.select();
  });
  setTimeout(() => input.focus(), 0);
}

function scoreHoardle(guess, answer) {
  const marks = Array(5).fill('absent');
  const remaining = {};
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) marks[i] = 'correct';
    else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < 5; i++) {
    if (marks[i] === 'correct') continue;
    if (remaining[guess[i]] > 0) {
      marks[i] = 'present';
      remaining[guess[i]] -= 1;
    }
  }
  return marks;
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

function boardFromPuzzle(pz) {
  if (Array.isArray(pz.board) && pz.board.length === 9 && pz.board.every(row => typeof row === 'string' && row.length === 9)) {
    return pz.board;
  }
  if (Array.isArray(pz.mine_cells)) {
    const grid = Array.from({ length: 9 }, () => Array(9).fill('.'));
    pz.mine_cells.forEach(cell => {
      let r;
      let c;
      if (Array.isArray(cell)) [r, c] = cell;
      else if (typeof cell === 'string') [r, c] = cell.split(/[,:]/).map(Number);
      if (Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < 9 && c >= 0 && c < 9) grid[r][c] = '*';
    });
    return grid.map(row => row.join(''));
  }
  return null;
}

function renderShaiSweeper(parent, pz, day) {
  const boardRows = boardFromPuzzle(pz);
  if (pz.status === 'source_pending') {
    const pending = child(parent, 'div', 'dp-gameday-empty');
    child(pending, 'strong', '', 'ShaiSweeper source pending. ');
    child(pending, 'span', '', 'This puzzle needs a reviewed 9x9 shot map before publication.');
    return;
  }
  if (!boardRows) {
    child(parent, 'div', 'dp-gameday-empty', 'ShaiSweeper board pending. Add a reviewed 9x9 board or mine_cells list to the public day JSON.');
    return;
  }
  const bombs = boardRows.join('').split('').filter(ch => ch === '*').length;
  const preset = {
    label: pz.title || 'ShaiSweeper',
    bombs: Number(pz.bombs || bombs || 0),
    chartUrl: pz.source_url || pz.answer_reveal?.source_chart_url || '',
    board: boardRows
  };
  if (pz.foreground_clue) child(parent, 'p', 'dp-gameday-empty', pz.foreground_clue);
  if (Array.isArray(pz.public_clues) && pz.public_clues.length) {
    const clues = child(parent, 'div', 'shai-public-clues');
    pz.public_clues.forEach(clue => child(clues, 'span', 'chip blue', clue));
  }
  if (Array.isArray(pz.hint_lines) && pz.hint_lines.length) {
    const hints = child(parent, 'details', 'shai-hints');
    child(hints, 'summary', '', pz.hint_button_title || 'Need a hint?');
    pz.hint_lines.forEach(h => child(hints, 'p', '', h));
  }

  const wrap = child(parent, 'div', 'shaisweeper-widget');
  const title = child(wrap, 'div', 'shai-titlebar');
  child(title, 'div', '', preset.label);
  child(title, 'div', 'small', 'Daily Thunder Playbook');
  const top = child(wrap, 'div', 'shai-topbar');
  const mineDisplay = child(top, 'div', 'shai-display', String(preset.bombs).padStart(3, '0'));
  const resetWrap = child(top, 'div', 'shai-reset-wrap');
  const reset = child(resetWrap, 'button', 'shai-reset', '🙂');
  reset.type = 'button';
  const timeDisplay = child(top, 'div', 'shai-display', '000');
  const shell = child(wrap, 'div', 'shai-board-shell');
  const grid = child(shell, 'div', 'shai-grid');
  const stat = child(wrap, 'div', 'shai-status');
  const status = child(stat, 'div', 'shai-legend', 'Ready. Left click reveal. Right click flag.');
  child(stat, 'div', 'shai-legend', `${preset.bombs} bombs`);
  const shareBox = child(wrap, 'div', 'dtp-sharebox');
  const shareText = child(shareBox, 'textarea', '', '');
  shareText.readOnly = true;

  const sessionKey = day.date;
  let session = state.shai[sessionKey];
  if (!session) {
    session = state.shai[sessionKey] = buildShaiSession(preset.board, preset.bombs);
  }
  let timerId = null;

  function pad(n) {
    return String(Math.max(0, Math.min(999, n))).padStart(3, '0');
  }
  function start() {
    if (session.started || session.gameOver) return;
    session.started = true;
    timerId = setInterval(() => {
      session.timer += 1;
      timeDisplay.textContent = pad(session.timer);
    }, 1000);
  }
  function draw(t) {
    const e = t.el;
    e.className = 'shai-tile';
    e.textContent = '';
    if (!t.revealed) {
      if (t.flagged) {
        e.classList.add('flagged');
        e.textContent = '🚩';
      }
      return;
    }
    e.classList.add('revealed');
    if (t.mine) {
      e.textContent = '💣';
      return;
    }
    if (t.adjacent) {
      e.textContent = String(t.adjacent);
      e.classList.add(`n${t.adjacent}`);
    }
  }
  function updateMines() {
    mineDisplay.textContent = pad(preset.bombs - session.board.filter(t => t.flagged).length);
  }
  function renderBoard() {
    grid.replaceChildren();
    session.board.forEach(t => {
      const b = child(grid, 'button', 'shai-tile');
      b.type = 'button';
      b.addEventListener('click', e => {
        if (e.shiftKey) flag(t);
        else reveal(t);
      });
      b.addEventListener('contextmenu', e => {
        e.preventDefault();
        flag(t);
      });
      t.el = b;
      draw(t);
    });
    updateMines();
    timeDisplay.textContent = pad(session.timer);
    if (session.gameOver) reset.textContent = session.won ? '😎' : '💀';
  }
  function flag(t) {
    if (session.gameOver || t.revealed) return;
    start();
    t.flagged = !t.flagged;
    draw(t);
    updateMines();
  }
  function reveal(t) {
    if (session.gameOver || t.flagged || t.revealed) return;
    start();
    if (t.mine) {
      t.revealed = true;
      draw(t);
      t.el.classList.add('mine-hit');
      lose();
      return;
    }
    flood(session, t);
    checkWin();
  }
  function lose() {
    session.gameOver = true;
    session.won = false;
    clearInterval(timerId);
    reset.textContent = '💀';
    session.board.forEach(t => {
      if (t.mine && !t.revealed) {
        t.revealed = true;
        draw(t);
      } else if (t.flagged && !t.mine) {
        t.revealed = true;
        t.el.className = 'shai-tile revealed wrong-flag';
        t.el.textContent = '✖';
      }
    });
    status.textContent = 'Dead. Reset or open the source chart.';
    writeShaiShare();
  }
  function checkWin() {
    if (!session.board.every(t => t.mine || t.revealed)) return;
    session.gameOver = true;
    session.won = true;
    clearInterval(timerId);
    reset.textContent = '😎';
    session.board.forEach(t => {
      if (t.mine && !t.flagged) {
        t.flagged = true;
        draw(t);
      }
    });
    updateMines();
    status.textContent = `Cleared. Time ${pad(session.timer)}.`;
    writeShaiShare();
  }
  function reload() {
    clearInterval(timerId);
    state.shai[sessionKey] = buildShaiSession(preset.board, preset.bombs);
    render();
  }
  function writeShaiShare() {
    const flags = session.board.filter(t => t.flagged).length;
    shareText.value = `ShaiSweeper ${day.date} ${session.won ? 'cleared' : 'detonated'}\n${preset.bombs} bombs · ${flags} flags · ${pad(session.timer)}\n\nDaily Thunder Playbook`;
    shareBox.style.display = 'block';
  }
  reset.addEventListener('click', () => {
    if (session.gameOver && preset.chartUrl) window.open(preset.chartUrl, '_blank');
    else reload();
  });
  renderBoard();
}

function buildShaiSession(rows, bombs) {
  const board = rows.flatMap((row, r) => row.split('').map((ch, c) => ({
    r, c, mine: ch === '*', revealed: false, flagged: false, adjacent: 0, el: null
  })));
  function at(r, c) { return board[r * 9 + c]; }
  function neighbors(t) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const r = t.r + dr;
        const c = t.c + dc;
        if (r >= 0 && r < 9 && c >= 0 && c < 9) out.push(at(r, c));
      }
    }
    return out;
  }
  board.forEach(t => { t.adjacent = neighbors(t).filter(n => n.mine).length; });
  return { board, bombs, started: false, gameOver: false, won: false, timer: 0, neighbors };
}
function flood(session, first) {
  const stack = [first];
  while (stack.length) {
    const t = stack.pop();
    if (t.revealed || t.flagged) continue;
    t.revealed = true;
    if (t.el) {
      t.el.className = 'shai-tile revealed';
      if (t.adjacent) {
        t.el.textContent = String(t.adjacent);
        t.el.classList.add(`n${t.adjacent}`);
      } else {
        t.el.textContent = '';
      }
    }
    if (t.adjacent) continue;
    session.neighbors(t).forEach(n => {
      if (!n.revealed && !n.flagged && !n.mine) stack.push(n);
    });
  }
}

function renderScoreboardPuzzle(parent, pz, day) {
  child(parent, 'p', 'dtp-small', pz.summary || 'Scoreboard memory board.');
  renderLookback(parent, day.modules.lookback, day, true);
}

function renderLookback(parent, lookback, day, compact = false) {
  if (!lookback || !lookback.game) return;
  const game = lookback.game;
  const lb = getLookbackState(day.date);
  const look = child(parent, 'section', compact ? 'scoreboard-trivia compact' : 'card scoreboard-trivia');
  child(look, 'div', 'dp-eyebrow', 'Scoreboard Trivia');
  child(look, 'h2', 'dp-panel-title', game.matchup || 'Thunder lookback');
  child(look, 'p', 'date', `${game.game_date || ''} · ${game.scoreboard || ''}`.trim());

  const facts = child(look, 'div', 'dp-facts');
  (lookback.board?.revealed || []).forEach(field => {
    const label = field.replace(/_/g, ' ');
    const value = field === 'date' ? game.game_date : game[field];
    child(facts, 'div', 'dp-fact', `${label}: ${listText(value)}`);
  });

  const fields = lookback.board?.guess_fields || ['winner', 'margin', 'game_high_points', 'okc_rebounds_leader', 'okc_assists_leader'];
  const labels = {
    winner: 'Winner',
    margin: 'Margin',
    game_high_points: 'Game high points',
    okc_rebounds_leader: 'OKC rebounds leader',
    okc_assists_leader: 'OKC assists leader'
  };
  const form = child(look, 'div', 'scoreboard-form');
  fields.forEach(field => {
    const row = child(form, 'div', 'scoreboard-row');
    child(row, 'label', '', labels[field] || field.replace(/_/g, ' '));
    const input = child(row, 'input', 'scoreboard-input');
    input.value = lb.answers[field] || '';
    input.placeholder = lb.revealed ? listText(game[field]) : 'Your guess';
    input.disabled = lb.revealed || lb.results[field] === true;
    input.addEventListener('input', () => { lb.answers[field] = input.value; });
    const result = child(row, 'span', 'scoreboard-result');
    if (lb.results[field] === true) {
      result.classList.add('correct');
      result.textContent = '✓';
    } else if (lb.results[field] === false) {
      result.classList.add('incorrect');
      result.textContent = lb.revealed ? listText(game[field]) : 'Try again';
    } else if (lb.revealed) {
      result.textContent = listText(game[field]);
    }
  });

  const controls = child(look, 'div', 'dtp-controls');
  const check = child(controls, 'button', 'dtp-btn', 'Check board');
  const reveal = child(controls, 'button', 'dtp-btn', lb.revealed ? 'Hide answers' : 'Reveal board');
  check.type = reveal.type = 'button';
  check.disabled = lb.revealed;
  const status = child(look, 'div', 'dtp-status', allLookbackCorrect(day) ? 'Board cleared. Archive hook unlocked.' : 'Guess any field to unlock the archive hook, or clear the full board.');

  check.addEventListener('click', () => {
    fields.forEach(field => {
      lb.results[field] = scoreLookbackAnswer(field, lb.answers[field], game[field]);
    });
    lb.checked = true;
    render();
  });
  reveal.addEventListener('click', () => {
    lb.revealed = !lb.revealed;
    render();
  });
}

function scoreLookbackAnswer(field, guess, expected) {
  if (guess === undefined || guess === null || String(guess).trim() === '') return false;
  if (field === 'margin') {
    return Number.parseInt(guess, 10) === Number.parseInt(expected, 10);
  }
  const g = normalizeCompact(guess);
  const values = Array.isArray(expected) ? expected : [expected];
  return values.some(value => {
    const v = normalizeCompact(value);
    if (!v) return false;
    return g === v || v.includes(g) || g.includes(v);
  });
}

function renderArticle(parent, article, day) {
  if (!article) return;
  const unlocked = canUnlockArticle(day);
  const yb = child(parent, 'section', 'card dp-yearbook');
  child(yb, 'div', 'dp-eyebrow', 'From the archive');
  child(yb, 'h2', '', article.article_title || 'Daily Thunder article');
  child(yb, 'p', '', unlocked ? (article.preamble || 'Selected article unlocks after the scoreboard board.') : 'Hidden until you make progress on the scoreboard board. Guess a field or reveal the board first.');
  if (unlocked && article.article_url) {
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
