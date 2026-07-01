(() => {
  const DP = window.DTPlaybook;
  const HOARDLE_WORDS = new Set('DRAFT RINGS COURT ARENA HOOPS SHOOT PRESS COACH BENCH STEAL BLOCK DUNKS SCORE DRIVE PAINT PICKS TRADE WINGS GUARD FRONT SLATE PLAYS GAMES TEAMS FINAL BOUND ELITE FLOOR GLASS HUSTL TRACK CLUTCH SPACE POINT THREE CROWN'.split(' '));
  const KEY_ROWS = ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
  function setKeyState(btn, state) {
    const order = { absent: 1, present: 2, correct: 3 };
    const cur = btn.dataset.state || '';
    if ((order[state] || 0) >= (order[cur] || 0)) { btn.dataset.state = state; btn.className = `hoardle-key ${state}`; }
  }
  DP.renderHoardle = function(parent, pz) {
    const answer = String(pz.answer || '').toUpperCase();
    const category = pz.word_category || pz.category || 'Universal hoops';
    const accepted = new Set([answer, ...(pz.accepted_answers || []), ...HOARDLE_WORDS].map(x => String(x).toUpperCase()).filter(Boolean));
    const wrap = DP.child(parent, 'div', 'dtp-wrap hoardle');
    DP.child(wrap, 'p', 'dtp-small', `Category: ${category}. Six guesses.`);
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
    const keyboard = DP.child(wrap, 'div', 'hoardle-keyboard');
    const keyButtons = new Map();
    KEY_ROWS.forEach((letters, rowIndex) => {
      const row = DP.child(keyboard, 'div', 'hoardle-key-row');
      if (rowIndex === 2) {
        const enter = DP.child(row, 'button', 'hoardle-key wide', 'ENTER'); enter.type = 'button'; enter.addEventListener('click', submit);
      }
      letters.split('').forEach(letter => { const b = DP.child(row, 'button', 'hoardle-key', letter); b.type = 'button'; b.addEventListener('click', () => addLetter(letter)); keyButtons.set(letter, b); });
      if (rowIndex === 2) { const back = DP.child(row, 'button', 'hoardle-key wide', '⌫'); back.type = 'button'; back.addEventListener('click', backspace); }
    });
    const status = DP.child(wrap, 'div', 'dtp-status', 'Type in the boxes or use the keyboard.');
    let turn = 0, done = false;
    function activeRow() { return cells[turn] || []; }
    function guess() { return activeRow().map(i => i.value.toUpperCase()).join(''); }
    function firstEmpty() { return activeRow().findIndex(i => !i.value); }
    function lockRow() { activeRow().forEach(i => i.disabled = true); }
    function focusCell(row, col) { const target = cells[row]?.[Math.max(0, Math.min(4, col))]; if (target && !target.disabled) target.focus(); }
    function addLetter(letter) { if (done) return; const idx = firstEmpty(); if (idx >= 0) { activeRow()[idx].value = letter; focusCell(turn, Math.min(4, idx + 1)); } }
    function backspace() { if (done) return; let idx = firstEmpty(); idx = idx === -1 ? 4 : Math.max(0, idx - 1); activeRow()[idx].value = ''; focusCell(turn, idx); }
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
      rowInputs.forEach((input, i) => { input.classList.add(cls[i]); setKeyState(keyButtons.get(word[i]), cls[i]); });
    }
    function submit() {
      if (done) return;
      const word = guess();
      if (!/^[A-Z]{5}$/.test(word)) { status.textContent = 'Fill all five boxes first.'; focusCell(turn, Math.max(0, firstEmpty())); return; }
      if (!accepted.has(word)) { status.textContent = 'Not in the Playbook word list.'; activeRow().forEach(i => i.classList.add('shake')); setTimeout(() => activeRow().forEach(i => i.classList.remove('shake')), 400); return; }
      const row = activeRow();
      score(row, word); lockRow();
      if (word === answer || (pz.accepted_answers || []).map(x => String(x).toUpperCase()).includes(word)) { done = true; status.textContent = `Solved in ${turn + 1}.`; return; }
      turn++;
      if (turn >= 6) { done = true; status.textContent = `Out of guesses. Answer: ${answer || 'pending'}.`; return; }
      status.textContent = `${6 - turn} guess${6 - turn === 1 ? '' : 'es'} left.`;
      focusCell(turn, 0);
    }
    cells.forEach((row, r) => row.forEach((input, c) => {
      input.addEventListener('input', () => { input.value = input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1); if (input.value && c < 4) focusCell(r, c + 1); });
      input.addEventListener('keydown', ev => { if (ev.key === 'Backspace' && !input.value) { ev.preventDefault(); if (c > 0) { cells[r][c - 1].value = ''; focusCell(r, c - 1); } } if (ev.key === 'Enter') { ev.preventDefault(); submit(); } });
      input.addEventListener('focus', () => { if (r !== turn && !done) focusCell(turn, Math.max(0, firstEmpty())); });
    }));
    setTimeout(() => focusCell(0, 0), 50);
  };
  DP.renderCrossword = function(parent, pz) {
    const data = pz.crossword || pz;
    const gridData = data.grid || [];
    const clues = data.clues || [];
    const wrap = DP.child(parent, 'div', 'dtp-wrap crossword-play');
    if (!Array.isArray(gridData) || !gridData.length || !Array.isArray(clues) || !clues.length) { DP.child(wrap, 'div', 'dp-gameday-empty', 'Crossword data pending.'); return; }
    DP.child(wrap, 'p', 'dtp-small', 'Fill the mini on the surface.');
    const grid = DP.child(wrap, 'div', 'crossword-grid');
    const rows = gridData.length, cols = gridData[0].length;
    grid.style.gridTemplateColumns = `repeat(${cols}, 2.25rem)`;
    const starts = new Map(); clues.forEach(clue => { const first = clue.cells?.[0]; if (first) starts.set(`${first[0]},${first[1]}`, clue.number); });
    const inputs = {}, cellsByKey = {};
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const ch = gridData[r][c], key = `${r},${c}`;
      if (ch === '#') { DP.child(grid, 'div', 'crossword-cell-wrap block', ''); continue; }
      const cell = DP.child(grid, 'div', 'crossword-cell-wrap');
      if (starts.has(key)) DP.child(cell, 'span', 'crossword-num', String(starts.get(key)));
      const inp = DP.child(cell, 'input', 'crossword-cell');
      inp.maxLength = 1; inp.inputMode = 'text'; inp.autocomplete = 'off'; inp.dataset.answer = ch.toUpperCase(); inp.dataset.key = key;
      inputs[key] = inp; cellsByKey[key] = cell;
    }
    let activeClue = clues[0];
    function setActive(clue) { activeClue = clue; Object.values(cellsByKey).forEach(c => c.classList.remove('active-word')); (clue.cells || []).forEach(([r,c]) => cellsByKey[`${r},${c}`]?.classList.add('active-word')); const first = clue.cells?.[0]; if (first) inputs[`${first[0]},${first[1]}`]?.focus(); }
    Object.values(inputs).forEach(inp => inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1); if (!activeClue || !inp.value) return; const keys = activeClue.cells.map(([r,c]) => `${r},${c}`); const i = keys.indexOf(inp.dataset.key); if (i >= 0 && i < keys.length - 1) inputs[keys[i + 1]]?.focus(); }));
    const clueList = DP.child(wrap, 'div', 'crossword-clues');
    ['across','down'].forEach(dir => {
      const group = clues.filter(c => (c.direction || 'across') === dir);
      if (!group.length) return;
      const box = DP.child(clueList, 'div', 'crossword-clue-group');
      DP.child(box, 'div', 'trivia-label', dir);
      group.forEach(clue => { const row = DP.child(box, 'button', 'crossword-clue', `${clue.number}. ${clue.clue}`); row.type = 'button'; row.addEventListener('click', () => setActive(clue)); });
    });
    const controls = DP.child(wrap, 'div', 'dtp-controls');
    const checkWord = DP.child(controls, 'button', 'dtp-btn', 'Check word');
    const checkPuzzle = DP.child(controls, 'button', 'dtp-btn', 'Check puzzle');
    const revealWord = DP.child(controls, 'button', 'dtp-btn secondary', 'Reveal word');
    const revealPuzzle = DP.child(controls, 'button', 'dtp-btn secondary', 'Reveal puzzle');
    [checkWord, checkPuzzle, revealWord, revealPuzzle].forEach(b => b.type = 'button');
    const status = DP.child(wrap, 'div', 'dtp-status', '');
    function check(keys) { let right = 0; keys.forEach(key => { const inp = inputs[key]; if (!inp) return; inp.classList.remove('correct','absent'); const ok = inp.value.toUpperCase() === inp.dataset.answer; if (ok) right++; inp.classList.add(ok ? 'correct' : 'absent'); }); return right; }
    function reveal(keys) { keys.forEach(key => { const inp = inputs[key]; if (!inp) return; inp.value = inp.dataset.answer; inp.classList.remove('absent'); inp.classList.add('correct'); }); }
    const activeKeys = () => activeClue ? activeClue.cells.map(([r,c]) => `${r},${c}`) : [];
    checkWord.addEventListener('click', () => { const keys = activeKeys(); status.textContent = `${check(keys)}/${keys.length} in current word.`; });
    checkPuzzle.addEventListener('click', () => { const keys = Object.keys(inputs); status.textContent = `${check(keys)}/${keys.length} squares correct.`; });
    revealWord.addEventListener('click', () => reveal(activeKeys()));
    revealPuzzle.addEventListener('click', () => { reveal(Object.keys(inputs)); status.textContent = 'Puzzle revealed.'; });
    setActive(clues[0]);
  };
})();
