(() => {
  const DP = window.DTPlaybook;
  DP.renderConnections = function(parent, pz) {
    const groups = Array.isArray(pz.groups) ? pz.groups : [];
    if (groups.length !== 4 || groups.some(g => !Array.isArray(g.answers) || g.answers.length !== 4)) {
      DP.child(parent, 'div', 'dp-gameday-empty', 'Curated groups pending.');
      return;
    }
    const wrap = DP.child(parent, 'div', 'dtp-wrap connections-wrap');
    DP.child(wrap, 'p', 'dtp-small', 'Find the 4 sets of 4. Fourth selection submits automatically.');
    const board = DP.child(wrap, 'div', 'dtp-board connections-board');
    const status = DP.child(wrap, 'div', 'dtp-status', '');
    const missesWrap = DP.child(wrap, 'div', 'dtp-small', 'Misses: ');
    const missesEl = DP.child(missesWrap, 'span', '', '0');
    DP.child(missesWrap, 'span', '', ' / 4');
    const controls = DP.child(wrap, 'div', 'dtp-controls');
    const clear = DP.child(controls, 'button', 'dtp-btn secondary', 'Clear');
    const share = DP.child(controls, 'button', 'dtp-btn', 'Share');
    clear.type = share.type = 'button';
    share.disabled = true;
    const meta = DP.child(wrap, 'div', 'dtp-meta', 'Solved category names appear here.');
    const shareBox = DP.child(wrap, 'div', 'dtp-sharebox');
    const shareText = DP.child(shareBox, 'textarea', '', '');
    shareText.readOnly = true;
    const tiles = DP.shuffle(groups.flatMap(g => g.answers));
    const selected = new Set();
    const solved = new Set();
    const groupMap = new Map();
    const attempts = [];
    let misses = 0, lastKey = null, mustChange = false, gameOver = false, finished = null;
    function bestMatch(pick) {
      const set = new Set(pick);
      return Math.max(...groups.map(g => g.answers.filter(a => set.has(a)).length));
    }
    function solveAll() {
      groups.forEach((g, gi) => g.answers.forEach(a => { solved.add(a); groupMap.set(a, gi); }));
      selected.clear(); gameOver = true; renderBoard();
    }
    function submitSelection() {
      if (gameOver || selected.size !== 4) return;
      const pick = [...selected], pickKey = DP.key(pick);
      if (lastKey && pickKey === lastKey) { mustChange = true; status.textContent = 'Change at least one tile.'; renderBoard(); return; }
      lastKey = pickKey;
      const hit = groups.findIndex(g => pickKey === DP.key(g.answers));
      if (hit >= 0) {
        attempts.push('⚡');
        groups[hit].answers.forEach(a => { solved.add(a); groupMap.set(a, hit); });
        selected.clear(); mustChange = false; lastKey = null;
        status.textContent = 'Correct.';
        meta.textContent = groups[hit].name;
        if (solved.size === tiles.length) { finished = 'solved'; gameOver = true; status.textContent = 'Solved.'; }
        renderBoard(); return;
      }
      attempts.push('🗻'); misses++; missesEl.textContent = String(misses); mustChange = true;
      status.textContent = `No. You got ${bestMatch(pick)}/4.`;
      if (misses >= 4) { finished = 'lost'; status.textContent += ' Out of misses.'; solveAll(); return; }
      renderBoard();
    }
    function renderBoard() {
      board.replaceChildren();
      tiles.forEach(word => {
        const t = DP.child(board, 'button', 'dtp-tile', word);
        t.type = 'button';
        t.title = word;
        if (solved.has(word)) t.classList.add('dtp-solved', `grp-${groupMap.get(word)}`);
        else if (selected.has(word)) t.classList.add('dtp-sel');
        t.addEventListener('click', () => {
          if (solved.has(word)) { meta.textContent = groups[groupMap.get(word)].name; return; }
          if (gameOver) return;
          if (selected.has(word)) selected.delete(word);
          else if (selected.size < 4) selected.add(word);
          if (mustChange) { mustChange = false; lastKey = null; }
          renderBoard();
          if (selected.size === 4) setTimeout(submitSelection, 160);
        });
      });
      clear.disabled = gameOver || selected.size === 0;
      share.disabled = !gameOver;
    }
    clear.addEventListener('click', () => { selected.clear(); mustChange = false; lastKey = null; status.textContent = ''; renderBoard(); });
    share.addEventListener('click', () => {
      const wrongs = attempts.filter(x => x === '🗻').length;
      shareText.value = `I played "${pz.title || 'Daily Thunder Playbook'}" with ${wrongs} wrong guess${wrongs === 1 ? '' : 'es'}!\n\n${attempts.join('')}${finished === 'solved' ? '🏁' : '💀'}\n\nDaily Thunder Playbook`;
      shareBox.style.display = 'block'; shareText.focus(); shareText.select();
    });
    renderBoard();
  };
})();
