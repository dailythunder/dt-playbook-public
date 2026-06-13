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

