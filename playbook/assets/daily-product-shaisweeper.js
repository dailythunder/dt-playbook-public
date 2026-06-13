function renderShaiSweeper(parent, pz, day) {
  const boardRows = boardFromPuzzle(pz);
  if (pz.status === 'source_pending' || pz.status === 'fake' || pz.source_status === 'source_pending' || pz.source_status === 'fake') {
    const pending = child(parent, 'div', 'dp-gameday-empty');
    child(pending, 'strong', '', 'ShaiSweeper source pending. ');
    child(pending, 'span', '', 'This puzzle refuses source_pending/fake boards and needs reviewed 9x9 shot-map data before publication.');
    return;
  }
  if (!boardRows || pz.reviewed === false) {
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

