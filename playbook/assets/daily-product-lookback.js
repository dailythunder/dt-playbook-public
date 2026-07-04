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
  function normCompact(value) { return DP.norm(value).replace(/\s+/g, ''); }
  function matchesAnswer(choice, answer) {
    const c = normCompact(choice);
    const answers = Array.isArray(answer) ? answer : [answer];
    return answers.some(a => {
      const n = normCompact(a);
      return !!c && !!n && (c.includes(n) || n.includes(c) || (n === 'thunder' && c.includes('oklahomacity')));
    });
  }
  function marginBucket(margin) {
    const n = Number(margin);
    if (n <= 5) return '1-5';
    if (n <= 10) return '6-10';
    if (n <= 15) return '11-15';
    return '16+';
  }
  function answerText(value) { return DP.listText(value); }
  function flattenNames(value) {
    const out = [];
    function add(item) {
      if (!item) return;
      if (Array.isArray(item)) return item.forEach(add);
      if (typeof item === 'object') {
        add(item.name || item.display_name || item.player || item.full_name || item.label);
        add(item.aliases || item.nicknames);
        return;
      }
      String(item).split('|').forEach(part => { const name = part.trim(); if (name) out.push(name); });
    }
    add(value);
    return out;
  }
  function fallbackPlayerPool(lookback, game) {
    const marker = `${lookback?.event_id || ''} ${game?.matchup || ''} ${game?.game_date || ''}`.toLowerCase();
    if (marker.includes('2012') && marker.includes('miami') && (marker.includes('oklahoma') || marker.includes('okc') || marker.includes('thunder'))) {
      return [
        'Kevin Durant', 'Derek Fisher', 'Derrick Fisher', 'Russell Westbrook', 'James Harden', 'Serge Ibaka',
        'Kendrick Perkins', 'Nick Collison', 'Thabo Sefolosha', 'Daequan Cook', 'Nazr Mohammed', 'Royal Ivey',
        'LeBron James', 'Dwyane Wade', 'Chris Bosh', 'Mario Chalmers', 'Shane Battier', 'Udonis Haslem',
        'Mike Miller', 'Norris Cole', 'Joel Anthony', 'James Jones'
      ];
    }
    return [];
  }
  function playerPoolFor(lookback, game) {
    const raw = [
      lookback?.player_options,
      lookback?.eligible_players,
      lookback?.board?.player_options,
      lookback?.board?.eligible_players,
      game?.player_options,
      game?.eligible_players,
      fallbackPlayerPool(lookback, game),
      game?.game_high_points,
      game?.okc_rebounds_leader,
      game?.okc_assists_leader
    ].flatMap(flattenNames);
    const seen = new Set();
    return raw.filter(name => {
      const key = normCompact(name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function playerMatches(query, pool) {
    const q = DP.norm(query).trim();
    const qc = q.replace(/\s+/g, '');
    if (!qc) return [];
    return pool.filter(name => {
      const n = DP.norm(name).trim();
      const nc = n.replace(/\s+/g, '');
      const parts = n.split(/\s+/).filter(Boolean);
      return nc.startsWith(qc) || nc.includes(qc) || parts.some(part => part.startsWith(qc));
    });
  }
  function cueText(query, pool) {
    const value = String(query || '').trim();
    if (!value) return 'Start typing for a player cue.';
    const matches = playerMatches(value, pool);
    if (!matches.length) return 'No eligible player match yet.';
    const shown = matches.slice(0, 4).join(', ');
    if (matches.length === 1) return `Looks like ${shown}.`;
    return `Could be: ${shown}${matches.length > 4 ? `, +${matches.length - 4} more` : ''}.`;
  }
  DP.renderLookback = function(parent, lookback) {
    if (!lookback || !lookback.game) return;
    const game = lookback.game;
    const teams = parseTeams(game);
    const eligiblePlayers = playerPoolFor(lookback, game);
    const look = DP.child(parent, 'section', 'card lookback-card');
    DP.child(look, 'div', 'dp-eyebrow', 'On This Day');
    DP.child(look, 'h2', 'dp-panel-title', game.matchup || 'Thunder lookback');
    DP.child(look, 'p', 'date', `${game.game_date || ''} · final score hidden until reveal`.trim());
    const quiz = DP.child(look, 'div', 'scoreboard-trivia button-trivia');
    const status = DP.child(quiz, 'div', 'dtp-status', 'Pick the winner and margin range. Player fields narrow toward eligible players as you type.');
    const state = { winner: '', margin: '', players: {} };
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
        winnerQ.result.textContent = `Selected: ${team}`;
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
        marginQ.result.textContent = `Selected: ${bucket}`;
      });
    });
    const playerFields = [
      ['game_high_points', 'Game-high scorer'],
      ['okc_rebounds_leader', 'OKC rebounds leader'],
      ['okc_assists_leader', 'OKC assists leader']
    ].filter(([key]) => Array.isArray(game[key]) && game[key].length);
    const playerQ = DP.child(quiz, 'div', 'trivia-card player-card');
    DP.child(playerQ, 'div', 'trivia-label', 'Player leaders');
    if (!playerFields.length) {
      DP.child(playerQ, 'p', 'trivia-note', 'Player leader data is not attached for this game. Reveal shows the available scoreboard card.');
    } else if (!eligiblePlayers.length) {
      DP.child(playerQ, 'p', 'trivia-note', 'No player index is attached yet; check still uses the answer fields.');
    }
    const playerResults = {};
    playerFields.forEach(([key, label]) => {
      const row = DP.child(playerQ, 'label', 'trivia-text-row');
      DP.child(row, 'span', '', label);
      const input = DP.child(row, 'input', 'trivia-text-input');
      input.type = 'text'; input.autocomplete = 'off'; input.placeholder = 'Type a player name';
      const result = DP.child(playerQ, 'div', 'trivia-result live', 'Start typing for a player cue.');
      playerResults[key] = result;
      input.addEventListener('input', () => {
        state.players[key] = input.value;
        result.textContent = eligiblePlayers.length ? cueText(input.value, eligiblePlayers) : 'Type a guess, then check.';
        result.className = 'trivia-result live';
      });
    });
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
      let playerOk = 0;
      playerFields.forEach(([key]) => {
        const guess = state.players[key] || '';
        const ok = matchesAnswer(guess, game[key]);
        const eligible = !guess.trim() ? false : playerMatches(guess, eligiblePlayers).length > 0;
        if (ok) playerOk++;
        if (playerResults[key]) {
          playerResults[key].textContent = ok ? 'Correct' : eligible ? `Eligible player, wrong answer. Answer: ${answerText(game[key])}` : `Answer: ${answerText(game[key])}`;
          playerResults[key].className = `trivia-result ${ok ? 'correct' : 'incorrect'}`;
        }
      });
      status.textContent = winnerOk && marginOk ? `Scoreboard solved. Player matches: ${playerOk}/${playerFields.length}. Reveal when ready.` : `Scoreboard close enough. Player matches: ${playerOk}/${playerFields.length}. Reveal when ready.`;
    }
    function revealAll() {
      DP.state.revealed = true;
      const card = DP.child(look, 'div', 'on-this-day-card');
      DP.child(card, 'div', 'trivia-label', 'Yearbook reveal');
      DP.child(card, 'p', '', `${game.scoreboard || 'Final score pending'} · Winner: ${game.winner || '—'} · Margin: ${answerText(game.margin)}`);
      DP.child(card, 'p', '', `Game high: ${answerText(game.game_high_points)} · OKC rebounds: ${answerText(game.okc_rebounds_leader)} · OKC assists: ${answerText(game.okc_assists_leader)}`);
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
    DP.child(yb, 'div', 'dp-eyebrow', 'Archive entry');
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
    } else DP.child(wrap, 'p', '', 'End of the imported Daily Thunder app slate.');
  };
})();
