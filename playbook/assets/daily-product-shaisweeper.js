(() => {
  const DP = window.DTPlaybook;
  function boardConfig(pz) {
    const board = pz.board || {};
    const rows = Number(board.rows || pz.rows || 0);
    const cols = Number(board.cols || pz.cols || 0);
    const mines = board.mine_cells || pz.mine_cells || pz.bombs_cells || [];
    if (pz.status !== 'ready') return null;
    if (!rows || !cols || !Array.isArray(mines) || !mines.length) return null;
    return { rows, cols, mines: mines.map(c => Array.isArray(c) ? `${c[0]},${c[1]}` : `${c.row},${c.col}`), bombs: Number(pz.bombs || mines.length) };
  }
  function makeChart(anchor, cfg, pz) {
    const chart = DP.child(anchor, 'div', 'chart-popout-court');
    const court = DP.child(chart, 'div', 'chart-halfcourt');
    for (let r = 0; r < cfg.rows; r++) for (let c = 0; c < cfg.cols; c++) {
      const cell = DP.child(court, 'span', 'chart-cell', '');
      if (cfg.mines.includes(`${r},${c}`)) cell.classList.add('shot-dot');
    }
    DP.child(chart, 'p', 'dtp-small', pz.source_url ? 'Chart opens the source game page.' : 'Generated from reviewed playfile coordinates.');
  }
  DP.renderShaiSweeper = function(parent, pz) {
    const cfg = boardConfig(pz);
    if (!cfg) { DP.child(parent, 'div', 'dp-gameday-empty', 'ShaiSweeper is not playable yet: source_pending or missing reviewed board data.'); return; }
    const wrap = DP.child(parent, 'div', 'shaisweeper-widget view-shot');
    const title = DP.child(wrap, 'div', 'shai-titlebar');
    DP.child(title, 'span', '', pz.title || 'ShaiSweeper');
    DP.child(title, 'span', 'small', `${cfg.rows}×${cfg.cols} · ${cfg.bombs} made shots`);
    const toolbar = DP.child(wrap, 'div', 'shai-toolbar');
    const viewShot = DP.child(toolbar, 'button', '', 'Shot chart');
    const viewHardwood = DP.child(toolbar, 'button', '', 'Hardwood');
    const viewClassic = DP.child(toolbar, 'button', '', 'Classic');
    const chartBtn = DP.child(toolbar, 'button', '', 'Popout chart');
    [viewShot, viewHardwood, viewClassic, chartBtn].forEach(b => b.type = 'button');
    const top = DP.child(wrap, 'div', 'shai-topbar');
    const remaining = DP.child(top, 'div', 'shai-display', String(cfg.bombs).padStart(3, '0'));
    const resetWrap = DP.child(top, 'div', 'shai-reset-wrap');
    const reset = DP.child(resetWrap, 'button', 'shai-reset', '🙂');
    const timer = DP.child(top, 'div', 'shai-display', '000');
    const shell = DP.child(wrap, 'div', 'shai-board-shell');
    const grid = DP.child(shell, 'div', 'shai-grid');
    grid.style.gridTemplateColumns = `repeat(${cfg.cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${cfg.rows}, 1fr)`;
    const status = DP.child(wrap, 'div', 'shai-status');
    const modal = DP.child(wrap, 'div', 'shai-modal');
    const panel = DP.child(modal, 'div', 'shai-modal-panel');
    const sourceUrl = pz.shotchart_url || pz.source_url || pz.answer_reveal?.source_chart_url || '#';
    const anchor = DP.child(panel, 'a', 'chart-popout-link'); anchor.href = sourceUrl; anchor.target = '_blank'; anchor.rel = 'noopener';
    makeChart(anchor, cfg, pz);
    const close = DP.child(panel, 'button', 'dtp-btn secondary', 'Close chart'); close.type = 'button';
    const mineSet = new Set(cfg.mines);
    const revealed = new Set(), flagged = new Set();
    let start = null, clock = null, over = false;
    const idx = (r,c) => `${r},${c}`;
    function setView(mode) { wrap.classList.remove('view-shot','view-hardwood','view-classic'); wrap.classList.add(`view-${mode}`); }
    function neighbors(r,c) { const out = []; for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) { if (!dr && !dc) continue; const rr=r+dr, cc=c+dc; if (rr>=0 && rr<cfg.rows && cc>=0 && cc<cfg.cols) out.push([rr,cc]); } return out; }
    function count(r,c){ return neighbors(r,c).filter(([rr,cc]) => mineSet.has(idx(rr,cc))).length; }
    function startTimer() { if (start) return; start = Date.now(); clock = setInterval(() => { timer.textContent = String(Math.min(999, Math.floor((Date.now()-start)/1000))).padStart(3,'0'); }, 1000); }
    function stopTimer(){ if (clock) clearInterval(clock); clock = null; }
    function revealCell(r,c) { const key = idx(r,c); if (revealed.has(key) || flagged.has(key) || over) return; revealed.add(key); if (mineSet.has(key)) { over = true; stopTimer(); reset.textContent = '😵'; render(true); return; } if (count(r,c) === 0) neighbors(r,c).forEach(([rr,cc]) => revealCell(rr,cc)); }
    function won(){ return revealed.size === cfg.rows*cfg.cols - mineSet.size; }
    function render(hit=false) {
      grid.replaceChildren();
      for (let r=0; r<cfg.rows; r++) for (let c=0; c<cfg.cols; c++) {
        const key = idx(r,c), b = DP.child(grid, 'button', 'shai-tile', '');
        b.type='button'; b.style.boxSizing = 'border-box';
        if (revealed.has(key) || (over && mineSet.has(key))) {
          b.classList.add('revealed');
          if (mineSet.has(key)) { b.textContent='●'; b.title = 'Made shot'; if (hit) b.classList.add('mine-hit'); }
          else { const n=count(r,c); if(n){ b.textContent=String(n); b.classList.add(`n${n}`); } }
        } else if (flagged.has(key)) { b.textContent='🚩'; b.classList.add('flagged'); }
        b.addEventListener('click', () => { startTimer(); revealCell(r,c); if(won()){ over=true; stopTimer(); reset.textContent='😎'; } render(); });
        b.addEventListener('contextmenu', ev => { ev.preventDefault(); if(over || revealed.has(key)) return; startTimer(); flagged.has(key) ? flagged.delete(key) : flagged.add(key); render(); });
      }
      remaining.textContent = String(cfg.bombs - flagged.size).padStart(3,'0');
      status.textContent = over ? (won() ? 'Cleared the court.' : 'Hit a made shot.') : 'Shot-chart grid is the default. Switch views any time.';
    }
    viewShot.addEventListener('click', () => setView('shot'));
    viewHardwood.addEventListener('click', () => setView('hardwood'));
    viewClassic.addEventListener('click', () => setView('classic'));
    chartBtn.addEventListener('click', () => modal.classList.add('open'));
    close.addEventListener('click', () => modal.classList.remove('open'));
    reset.addEventListener('click', () => { revealed.clear(); flagged.clear(); start=null; over=false; stopTimer(); timer.textContent='000'; reset.textContent='🙂'; render(); });
    if (Array.isArray(pz.hint_lines) && pz.hint_lines.length) {
      const details = DP.child(wrap, 'details', 'shai-hints');
      DP.child(details, 'summary', '', pz.hint_button_title || 'Need a hint?');
      pz.hint_lines.forEach(h => DP.child(details, 'div', '', h));
      if (pz.free_throws_included === false || pz.board?.free_throws_included === false) DP.child(details, 'div', '', 'FTs excluded from this standard board.');
    }
    setView('shot');
    render();
  };
})();
