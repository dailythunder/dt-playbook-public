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

