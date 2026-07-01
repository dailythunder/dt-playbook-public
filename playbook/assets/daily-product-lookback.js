(() => {
  const DP = window.DTPlaybook;
  function parseTeams(game) {
    let away = game.away_team || '';
    let home = game.home_team || '';
    const matchup = game.matchup || '';
    if ((!away || !home) && matchup.includes(' at ')) {
      const parts = matchup.split(' at ');
      away = away || parts[0];
      home = home || parts.slice(1).join(' at ');
    }
    return { away, home };
  }
  function matchesAnswer(choice, answer) {
    const c = DP.norm(choice);
    const a = DP.norm(answer);
    return !!c && !!a && (c.includes(a) || a.includes(c) || (a === 'thunder' && c.includes('oklahoma city')));
  }
  function marginBucket(margin) {
    const n = Number(margin);
    if (n <= 5) return '1-5';
    if (n <= 10) return '6-10';
    if (n <= 15) return '11-15';
    return '16+';
  }
  DP.renderLookback = function(parent, lookback) {
    if (!lookback || !lookback.game) return;
    const game = lookback.game;
    const teams = parseTeams(game);
    const look = DP.child(parent, 'section', 'card lookback-card');
    DP.child(look, 'div', 'dp-eyebrow', 'On This Day');
    DP.child(look, 'h2', 'dp-panel-title', game.matchup || 'Thunder lookback');
    DP.child(look, 'p', 'date', `${game.game_date || ''} · final score hidden until reveal`.trim());
    const facts = DP.child(look, 'div', 'dp-facts');
    DP.child(facts, 'div', 'dp-fact', `date: ${DP.listText(game.game_date)}`);
    if (teams.away) DP.child(facts, 'div', 'dp-fact', `away: ${teams.away}`);
    if (teams.home) DP.child(facts, 'div', 'dp-fact', `home: ${teams.home}`);
    const quiz = DP.child(look, 'div', 'scoreboard-trivia button-trivia');
    const status = DP.child(quiz, 'div', 'dtp-status', 'Pick the winner and margin range, then reveal the yearbook card.');
    const state = { winner: '', margin: '' };
    function question(label, className) {
      const box = DP.child(quiz, 'div', `trivia-card ${className || ''}`);
      DP.child(box, 'div', 'trivia-label', label);
      const options = DP.child(box, 'div', 'trivia-options');
      const result = DP.child(box, 'div', 'trivia-result', '');
      return { box, options, result };
    }
    const winnerQ = question('Who won?', 'winner-question');
    [teams.away, teams.home].filter(Boolean).forEach(team => {
      const b = DP.child(winnerQ.options, 'button', 'trivia-choice', team);
      b.type = 'button';
      b.addEventListener('click', () => {
        state.winner = team;
        winnerQ.options.querySelectorAll('button').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
      });
    });
    const marginQ = question('Winning margin range', 'margin-question');
    ['1-5','6-10','11-15','16+'].forEach(bucket => {
      const b = DP.child(marginQ.options, 'button', 'trivia-choice', bucket);
      b.type = 'button';
      b.addEventListener('click', () => {
        state.margin = bucket;
        marginQ.options.querySelectorAll('button').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
      });
    });
    const playerQ = DP.child(quiz, 'div', 'trivia-card player-card');
    DP.child(playerQ, 'div', 'trivia-label', 'Player leaders');
    DP.child(playerQ, 'p', 'trivia-note', 'Player-name guessing is paused until roster/autocomplete data exists. Reveal shows the leaders instead of making you type names blind.');
    const controls = DP.child(quiz, 'div', 'dtp-controls');
    const check = DP.child(controls, 'button', 'dtp-btn', 'Check picks');
    const reveal = DP.child(controls, 'button', 'dtp-btn secondary', 'Reveal yearbook');
    check.type = reveal.type = 'button';
    function checkPicks() {
      const winnerOk = matchesAnswer(state.winner, game.winner);
      const marginOk = state.margin === marginBucket(game.margin);
      winnerQ.result.textContent = state.winner ? (winnerOk ? 'Correct' : `Answer: ${game.winner}`) : 'Pick a winner.';
      winnerQ.result.className = `trivia-result ${winnerOk ? 'correct' : 'incorrect'}`;
      marginQ.result.textContent = state.margin ? (marginOk ? 'Correct' : `Answer: ${marginBucket(game.margin)} (${game.margin})`) : 'Pick a margin range.';
      marginQ.result.className = `trivia-result ${marginOk ? 'correct' : 'incorrect'}`;
      status.textContent = winnerOk && marginOk ? 'Clean hit. Reveal the yearbook.' : 'Close enough for summer. Reveal when ready.';
    }
    function revealAll() {
      DP.state.revealed = true;
      const card = DP.child(look, 'div', 'on-this-day-card');
      DP.child(card, 'div', 'trivia-label', 'Yearbook reveal');
      DP.child(card, 'p', '', `${game.scoreboard || 'Final score pending'} · Winner: ${game.winner || '—'} · Margin: ${DP.listText(game.margin)}`);
      DP.child(card, 'p', '', `Game high: ${DP.listText(game.game_high_points)} · OKC rebounds: ${DP.listText(game.okc_rebounds_leader)} · OKC assists: ${DP.listText(game.okc_assists_leader)}`);
      reveal.disabled = true;
      check.disabled = true;
      status.textContent = 'Yearbook unlocked.';
      DP.renderArticle(document.querySelector('.dp-main') || look.parentElement, DP.state.days[DP.state.active]?.modules?.article);
    }
    check.addEventListener('click', checkPicks);
    reveal.addEventListener('click', revealAll);
  };
  DP.renderArticle = function(parent, article) {
    if (!article || parent.querySelector?.('.dp-yearbook')) return;
    const yb = DP.child(parent, 'section', 'card dp-yearbook');
    DP.child(yb, 'div', 'dp-eyebrow', 'Yearbook entry');
    DP.child(yb, 'h2', '', article.article_title || 'Daily Thunder article');
    DP.child(yb, 'p', '', DP.state.revealed ? (article.preamble || 'Unlocked from the On This Day board.') : 'Locked until the On This Day board reveal.');
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
