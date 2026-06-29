(() => {
  const DP = window.DTPlaybook;
  DP.renderHoardle = function(parent, pz) {
    const answer = String(pz.answer || '').toUpperCase();
    const accepted = new Set((pz.accepted_answers || [answer]).map(x => String(x).toUpperCase()));
    const wrap = DP.child(parent, 'div', 'dtp-wrap hoardle');
    DP.child(wrap, 'p', 'dtp-small', pz.theme || 'Six guesses. Five letters.');
    const board = DP.child(wrap, 'div', 'hoardle-board');
    const rows = [];
    for (let r = 0; r < 6; r++) {
      const row = DP.child(board, 'div', 'hoardle-row');
      const cells = [];
      for (let c = 0; c < 5; c++) cells.push(DP.child(row, 'span', 'hoardle-cell', ''));
      rows.push(cells);
    }
    const form = DP.child(wrap, 'form', 'hoardle-form');
    const input = DP.child(form, 'input', 'hoardle-input');
    input.maxLength = 5;
    input.pattern = '[A-Za-z]{5}';
    input.autocomplete = 'off';
    input.placeholder = 'Guess';
    const submit = DP.child(form, 'button', 'dtp-btn', 'Guess');
    submit.type = 'submit';
    const reveal = DP.child(form, 'button', 'dtp-btn secondary', 'Reveal');
    reveal.type = 'button';
    const status = DP.child(wrap, 'div', 'dtp-status', '');
    let turn = 0;
    let done = false;
    function paintGuess(guess) {
      const answerChars = answer.split('');
      const used = Array(5).fill(false);
      const cls = Array(5).fill('absent');
      for (let i = 0; i < 5; i++) if (guess[i] === answerChars[i]) { cls[i] = 'correct'; used[i] = true; }
      for (let i = 0; i < 5; i++) {
        if (cls[i] === 'correct') continue;
        const hit = answerChars.findIndex((ch, idx) => !used[idx] && ch === guess[i]);
        if (hit >= 0) { cls[i] = 'present'; used[hit] = true; }
      }
      guess.split('').forEach((ch, i) => { rows[turn][i].textContent = ch; rows[turn][i].classList.add(cls[i]); });
    }
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      if (done) return;
      const guess = input.value.trim().toUpperCase();
      if (!/^[A-Z]{5}$/.test(guess)) { status.textContent = 'Enter a five-letter guess.'; return; }
      paintGuess(guess);
      if (accepted.has(guess)) { done = true; status.textContent = `Solved in ${turn + 1}.`; input.disabled = submit.disabled = true; return; }
      turn++;
      input.value = '';
      if (turn >= 6) { done = true; status.textContent = `Out of guesses. Answer: ${answer || 'pending'}.`; input.disabled = submit.disabled = true; }
      else status.textContent = `${6 - turn} guess${6 - turn === 1 ? '' : 'es'} left.`;
    });
    reveal.addEventListener('click', () => { done = true; status.textContent = answer ? `Answer: ${answer}` : 'Answer pending.'; input.disabled = submit.disabled = true; });
  };
  DP.renderCrossword = function(parent, pz) {
    const wrap = DP.child(parent, 'div', 'dtp-wrap');
    DP.child(wrap, 'p', 'dtp-small', pz.summary || 'Reviewed crossword slot.');
    const slug = pz.replacement_slug || pz.slug;
    if (slug) {
      const a = DP.child(wrap, 'a', 'btn', 'Open crossword archive source');
      a.href = `../../puzzle_archive/crossword_info_import/crosswords_archive/${encodeURIComponent(slug)}/index.html`;
    } else DP.child(wrap, 'div', 'dp-gameday-empty', 'Crossword source slug pending.');
  };
})();
