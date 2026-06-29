(() => {
  const DP = window.DTPlaybook;
  DP.renderLookback = function(parent, lookback) {
    if (!lookback || !lookback.game) return;
    const game = lookback.game;
    const look = DP.child(parent, 'section', 'card lookback-card');
    DP.child(look, 'div', 'dp-eyebrow', 'Lookback Board');
    DP.child(look, 'h2', 'dp-panel-title', game.matchup || 'Thunder lookback');
    DP.child(look, 'p', 'date', `${game.game_date || ''} · ${game.scoreboard || ''}`.trim());
    const facts = DP.child(look, 'div', 'dp-facts');
    (lookback.board?.revealed || ['date','home_team','away_team']).forEach(field => {
      const label = field.replace(/_/g, ' ');
      const value = field === 'date' ? game.game_date : game[field];
      DP.child(facts, 'div', 'dp-fact', `${label}: ${DP.listText(value)}`);
    });
    const fields = [
      ['winner', 'Winner', game.winner],
      ['margin', 'Margin', game.margin],
      ['game_high_points', 'Game high points', game.game_high_points],
      ['okc_rebounds_leader', 'OKC rebounds leader', game.okc_rebounds_leader],
      ['okc_assists_leader', 'OKC assists leader', game.okc_assists_leader]
    ];
    const form = DP.child(look, 'div', 'scoreboard-trivia');
    const results = {};
    fields.forEach(([key, label, value]) => {
      const row = DP.child(form, 'div', 'trivia-row');
      DP.child(row, 'label', '', label);
      const input = DP.child(row, 'input', 'trivia-input');
      input.placeholder = 'Your guess';
      const result = DP.child(row, 'span', 'trivia-result', '');
      results[key] = { input, result, value };
    });
    const controls = DP.child(form, 'div', 'dtp-controls');
    const check = DP.child(controls, 'button', 'dtp-btn', 'Check guesses');
    const reveal = DP.child(controls, 'button', 'dtp-btn secondary', 'Reveal board');
    check.type = reveal.type = 'button';
    function revealAll() {
      Object.values(results).forEach(r => { r.result.textContent = DP.listText(r.value); r.result.className = 'trivia-result revealed'; });
      DP.state.revealed = true;
      DP.render();
    }
    check.addEventListener('click', () => {
      Object.entries(results).forEach(([, r]) => {
        const expected = Array.isArray(r.value) ? r.value.map(DP.norm) : [DP.norm(r.value)];
        const guess = DP.norm(r.input.value);
        const correct = guess && expected.some(x => x.includes(guess) || guess.includes(x));
        r.result.textContent = correct ? 'Correct' : `Answer: ${DP.listText(r.value)}`;
        r.result.className = `trivia-result ${correct ? 'correct' : 'incorrect'}`;
      });
    });
    reveal.addEventListener('click', revealAll);
  };
  DP.renderArticle = function(parent, article) {
    if (!article) return;
    const yb = DP.child(parent, 'section', 'card dp-yearbook');
    DP.child(yb, 'div', 'dp-eyebrow', 'From the archive');
    DP.child(yb, 'h2', '', article.article_title || 'Daily Thunder article');
    DP.child(yb, 'p', '', DP.state.revealed ? (article.preamble || 'Selected article unlocks after the lookback reveal.') : 'Hidden until board reveal. Complete or reveal the scoreboard board first.');
    if (DP.state.revealed && article.article_url) {
      const a = DP.child(yb, 'a', 'btn', 'Open selected article');
      a.href = article.article_url; a.target = '_blank'; a.rel = 'noopener';
    }
  };
  DP.renderPlayNext = function(parent) {
    const wrap = DP.child(parent, 'section', 'card');
    DP.child(wrap, 'div', 'dp-eyebrow', 'Play next');
    const next = DP.state.days[DP.state.active + 1];
    if (next) {
      const b = DP.child(wrap, 'button', 'btn btn-primary', `Next: ${DP.dateLabel(next.date)}`);
      b.type = 'button';
      b.addEventListener('click', () => { DP.state.active += 1; DP.state.revealed = false; DP.render(); });
    } else DP.child(wrap, 'p', '', 'End of the imported Playbook slate.');
  };
})();
