(() => {
  const DP = window.DTPlaybook;
  DP.renderHoardle = function(parent, pz) {
    const answer = String(pz.answer || '').toUpperCase();
    const accepted = new Set((pz.accepted_answers || [answer]).map(x => String(x).toUpperCase()));
    const wrap = DP.child(parent, 'div', 'dtp-wrap hoardle');
    DP.child(wrap, 'p', 'dtp-small', pz.theme || 'Six guesses. Type in the boxes.');
    const board = DP.child(wrap, 'div', 'hoardle-board');
    const cells = Array.from({ length: 6 }, (_, r) => {
      const row = DP.child(board, 'div', 'hoardle-row');
      return Array.from({ length: 5 }, (_, c) => {
        const input = DP.child(row, 'input', 'hoardle-cell-input');
        input.maxLength = 1; input.inputMode = 'text'; input.autocomplete = 'off'; input.autocapitalize = 'characters';
        input.setAttribute('aria-label', `Guess ${r + 1} letter ${c + 1}`);
        return input;
      });
    });
    const controls = DP.child(wrap, 'div', 'dtp-controls');
    const enter = DP.child(controls, 'button', 'dtp-btn', 'Enter');
    const reveal = DP.child(controls, 'button', 'dtp-btn secondary', 'Reveal');
    enter.type = reveal.type = 'button';
    const status = DP.child(wrap, 'div', 'dtp-status', '');
    let turn = 0, done = false;
    function activeRow() { return cells[turn] || []; }
    function guess() { return activeRow().map(i => i.value.toUpperCase()).join(''); }
    function lockRow() { activeRow().forEach(i => i.disabled = true); }
    function focusCell(row, col) { const target = cells[row]?.[col]; if (target && !target.disabled) target.focus(); }
    function score(rowInputs, word) {
      const answerChars = answer.split('');
      const used = Array(5).fill(false);
      const cls = Array(5).fill('absent');
      for (let i = 0; i < 5; i++) if (word[i] === answerChars[i]) { cls[i] = 'correct'; used[i] = true; }
      for (let i = 0; i < 5; i++) {
        if (cls[i] === 'correct') continue;
        const hit = answerChars.findIndex((ch, idx) => !used[idx] && ch === word[i]);
        if (hit >= 0) { cls[i] = 'present'; used[hit] = true; }
      }
      rowInputs.forEach((input, i) => input.classList.add(cls[i]));
    }
    function submit() {
      if (done) return;
      const word = guess();
      if (!/^[A-Z]{5}$/.test(word)) { status.textContent = 'Fill all five boxes first.'; focusCell(turn, word.length); return; }
      const row = activeRow();
      score(row, word);
      lockRow();
      if (accepted.has(word)) { done = true; status.textContent = `Solved in ${turn + 1}.`; return; }
      turn++;
      if (turn >= 6) { done = true; status.textContent = `Out of guesses. Answer: ${answer || 'pending'}.`; return; }
      status.textContent = `${6 - turn} guess${6 - turn === 1 ? '' : 'es'} left.`;
      focusCell(turn, 0);
    }
    cells.forEach((row, r) => row.forEach((input, c) => {
      if (r > 0) input.disabled = false;
      input.addEventListener('input', () => {
        input.value = input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
        if (input.value && c < 4) focusCell(r, c + 1);
      });
      input.addEventListener('keydown', ev => {
        if (ev.key === 'Backspace' && !input.value && c > 0) { ev.preventDefault(); focusCell(r, c - 1); cells[r][c - 1].value = ''; }
        if (ev.key === 'Enter') { ev.preventDefault(); submit(); }
      });
      input.addEventListener('focus', () => { if (r !== turn && !done) focusCell(turn, Math.min(c, 4)); });
    }));
    enter.addEventListener('click', submit);
    reveal.addEventListener('click', () => { done = true; status.textContent = answer ? `Answer: ${answer}` : 'Answer pending.'; cells.flat().forEach(i => i.disabled = true); });
    setTimeout(() => focusCell(0, 0), 50);
  };
  DP.renderCrossword = function(parent, pz) {
    const data = pz.crossword || pz;
    const gridData = data.grid || [];
    const clues = data.clues || [];
    const wrap = DP.child(parent, 'div', 'dtp-wrap crossword-play');
    if (!Array.isArray(gridData) || !gridData.length || !Array.isArray(clues) || !clues.length) {
      DP.child(wrap, 'div', 'dp-gameday-empty', 'Crossword data pending.');
      return;
    }
    DP.child(wrap, 'p', 'dtp-small', 'Fill the mini on the surface. Check or reveal when ready.');
    const grid = DP.child(wrap, 'div', 'crossword-grid');
    const rows = gridData.length, cols = gridData[0].length;
    grid.style.gridTemplateColumns = `repeat(${cols}, 2.25rem)`;
    const inputs = {};
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const ch = gridData[r][c];
      if (ch === '#') { DP.child(grid, 'div', 'crossword-cell block', ''); continue; }
      const inp = DP.child(grid, 'input', 'crossword-cell');
      inp.maxLength = 1; inp.inputMode = 'text'; inp.autocomplete = 'off'; inp.dataset.answer = ch.toUpperCase(); inp.dataset.key = `${r},${c}`;
      inputs[`${r},${c}`] = inp;
      inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1); });
    }
    const clueList = DP.child(wrap, 'div', 'crossword-clues');
    clues.forEach(clue => {
      const row = DP.child(clueList, 'button', 'crossword-clue', `${clue.number}. ${clue.clue}`);
      row.type = 'button';
      row.addEventListener('click', () => { const first = clue.cells?.[0]; if (first) inputs[`${first[0]},${first[1]}`]?.focus(); });
    });
    const controls = DP.child(wrap, 'div', 'dtp-controls');
    const check = DP.child(controls, 'button', 'dtp-btn', 'Check');
    const reveal = DP.child(controls, 'button', 'dtp-btn secondary', 'Reveal');
    check.type = reveal.type = 'button';
    const status = DP.child(wrap, 'div', 'dtp-status', '');
    check.addEventListener('click', () => {
      let right = 0, total = 0;
      Object.values(inputs).forEach(inp => { total++; inp.classList.remove('correct','absent'); const ok = inp.value.toUpperCase() === inp.dataset.answer; if (ok) right++; inp.classList.add(ok ? 'correct' : 'absent'); });
      status.textContent = `${right}/${total} squares correct.`;
    });
    reveal.addEventListener('click', () => { Object.values(inputs).forEach(inp => { inp.value = inp.dataset.answer; inp.classList.remove('absent'); inp.classList.add('correct'); }); status.textContent = 'Revealed.'; });
  };
})();
