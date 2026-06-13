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

