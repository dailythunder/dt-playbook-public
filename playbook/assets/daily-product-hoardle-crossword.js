(() => {
  const DP = window.DTPlaybook;
  DP.renderHoardle = function(parent, pz) {
    const answer = String(pz.answer || '').toUpperCase();
    const accepted = new Set((pz.accepted_answers || [answer]).map(x => String(x).toUpperCase()));
    const wrap = DP.child(parent, 'div', 'dtp-wrap hoardle');
    DP.child(wrap, 'p', 'dtp-small', pz.theme || 'Six guesses. Type directly into the board.');
    const board = DP.child(wrap, 'div', 'hoardle-board');
    board.tabIndex = 0;
    board.setAttribute('role', 'group');
    board.setAttribute('aria-label', 'Hoardle letter board');
    const rows = [];
    for (let r = 0; r < 6; r++) {
      const row = DP.child(board, 'div', 'hoardle-row');
      const cells = [];
      for (let c = 0; c < 5; c++) cells.push(DP.child(row, 'span', 'hoardle-cell', ''));
      rows.push(cells);
    }
    const input = DP.child(wrap, 'input', 'hoardle-hidden-input');
    input.type = 'text'; input.inputMode = 'text'; input.autocomplete = 'off'; input.autocapitalize = 'characters'; input.maxLength = 1;
    const controls = DP.child(wrap, 'div', 'dtp-controls');
    const enter = DP.child(controls, 'button', 'dtp-btn', 'Enter');
    const back = DP.child(controls, 'button', 'dtp-btn secondary', 'Backspace');
    const reveal = DP.child(controls, 'button', 'dtp-btn secondary', 'Reveal');
    enter.type = back.type = reveal.type = 'button';
    const status = DP.child(wrap, 'div', 'dtp-status', 'Tap the board and type a five-letter guess.');
    let turn = 0, col = 0, done = false;
    const guesses = Array.from({ length: 6 }, () => Array(5).fill(''));
    function focusBoard() { if (!done) input.focus(); paintActive(); }
    function paintActive() {
      rows.flat().forEach(cell => cell.classList.remove('active'));
      if (!done && turn < 6 && col < 5) rows[turn][col].classList.add('active');
    }
    function paintLetters() {
      for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) rows[r][c].textContent = guesses[r][c];
      paintActive();
    }
    function scoreGuess(guess) {
      const answerChars = answer.split('');
      const used = Array(5).fill(false);
      const cls = Array(5).fill('absent');
      for (let i = 0; i < 5; i++) if (guess[i] === answerChars[i]) { cls[i] = 'correct'; used[i] = true; }
      for (let i = 0; i < 5; i++) {
        if (cls[i] === 'correct') continue;
        const hit = answerChars.findIndex((ch, idx) => !used[idx] && ch === guess[i]);
        if (hit >= 0) { cls[i] = 'present'; used[hit] = true; }
      }
      guess.split('').forEach((ch, i) => rows[turn][i].classList.add(cls[i]));
    }
    function addLetter(letter) {
      if (done || turn >= 6 || col >= 5 || !/^[A-Z]$/.test(letter)) return;
      guesses[turn][col] = letter;
      col++;
      paintLetters();
    }
    function removeLetter() {
      if (done || turn >= 6) return;
      if (col > 0) col--;
      guesses[turn][col] = '';
      paintLetters();
    }
    function submitGuess() {
      if (done) return;
      const guess = guesses[turn].join('');
      if (!/^[A-Z]{5}$/.test(guess)) { status.textContent = 'Fill all five boxes first.'; focusBoard(); return; }
      scoreGuess(guess);
      if (accepted.has(guess)) { done = true; status.textContent = `Solved in ${turn + 1}.`; input.disabled = true; rows.flat().forEach(c => c.classList.remove('active')); return; }
      turn++; col = 0;
      if (turn >= 6) { done = true; status.textContent = `Out of guesses. Answer: ${answer || 'pending'}.`; input.disabled = true; rows.flat().forEach(c => c.classList.remove('active')); }
      else { status.textContent = `${6 - turn} guess${6 - turn === 1 ? '' : 'es'} left.`; paintActive(); }
      focusBoard();
    }
    board.addEventListener('click', focusBoard);
    wrap.addEventListener('click', ev => { if (ev.target !== reveal && ev.target !== enter && ev.target !== back) focusBoard(); });
    input.addEventListener('input', () => { const letter = input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1); input.value = ''; if (letter) addLetter(letter); });
    input.addEventListener('keydown', ev => {
      if (ev.key === 'Backspace') { ev.preventDefault(); removeLetter(); }
      if (ev.key === 'Enter') { ev.preventDefault(); submitGuess(); }
    });
    enter.addEventListener('click', submitGuess);
    back.addEventListener('click', () => { removeLetter(); focusBoard(); });
    reveal.addEventListener('click', () => { done = true; status.textContent = answer ? `Answer: ${answer}` : 'Answer pending.'; input.disabled = true; rows.flat().forEach(c => c.classList.remove('active')); });
    paintLetters();
    setTimeout(focusBoard, 50);
  };
  DP.renderCrossword = function(parent, pz) {
    const wrap = DP.child(parent, 'div', 'dtp-wrap crossword-placeholder');
    DP.child(wrap, 'p', 'dtp-small', 'Native crossword play is next in the queue; this card is still a placeholder.');
    const slug = pz.replacement_slug || pz.slug;
    if (slug) {
      const a = DP.child(wrap, 'a', 'btn', 'Open archive source for now');
      a.href = `../../puzzle_archive/crossword_info_import/crosswords_archive/${encodeURIComponent(slug)}/index.html`;
    } else DP.child(wrap, 'div', 'dp-gameday-empty', 'Crossword source slug pending.');
  };
})();
