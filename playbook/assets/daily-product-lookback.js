(() => {
  const DP = window.DTPlaybook;
  const ASSET_BASE = document.currentScript?.src ? new URL('.', document.currentScript.src) : new URL('./assets/', location.href);
  const DATA_BASE = new URL('../data/', ASSET_BASE);
  let playerIndexPromise = null;

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
  function playerNameUrl() { return new URL('player_name_index.json', DATA_BASE).href; }
  function loadPlayerIndex() {
    if (!playerIndexPromise) {
      playerIndexPromise = fetch(playerNameUrl(), { cache: 'no-cache' })
        .then(res => res.ok ? res.json() : { players: [] })
        .then(data => Array.isArray(data.players) ? data.players : [])
        .catch(() => []);
    }
    return playerIndexPromise;
  }
  function addName(names, value) {
    const clean = String(value || '').trim();
    if (clean) names.push(clean);
  }
  function collectPlayersFromRows(value) {
    const out = [];
    function add(row, source = 'box_score') {
      if (!row) return;
      if (typeof row === 'string') { addName(out, row); return; }
      if (typeof row !== 'object') return;
      addName(out, row.display_name || row.player_name || row.athlete_display_name || row.player || row.name);
    }
    function walk(obj) {
      if (!obj) return;
      if (typeof obj === 'string') { add(obj); return; }
      if (Array.isArray(obj)) { obj.forEach(walk); return; }
      if (typeof obj !== 'object') return;
      if (obj.display_name || obj.player_name || obj.athlete_display_name || obj.player || obj.name) add(obj);
      Object.keys(obj).forEach(key => {
        if (['source','source_evidence','private_notes','raw_html','html','body'].includes(key)) return;
        const val = obj[key];
        if (Array.isArray(val) || (val && typeof val === 'object')) walk(val);
      });
    }
    walk(value);
    return out;
  }
  function playerRecord(name, source = 'box_score') {
    return { display_name: String(name || '').trim(), aliases: [], source };
  }
  function mergePlayers(...lists) {
    const seen = new Set();
    const out = [];
    lists.flat().forEach(row => {
      const display = String(row?.display_name || row?.name || row || '').trim();
      if (!display) return;
      const key = normCompact(display);
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ display_name: display, aliases: row.aliases || [], source: row.source || 'box_score' });
    });
    return out;
  }
  function gamePlayerPool(game) {
    const boxScoreNames = [];
    [
      game.eligible_players,
      game.player_options,
      game.player_boxscores,
      game.box_score,
      game.players
    ].forEach(source => boxScoreNames.push(...collectPlayersFromRows(source)));
    return mergePlayers(boxScoreNames.map(name => playerRecord(name, 'box_score')));
  }
  function variantsForPlayer(player) {
    const names = new Set();
    const full = String(player.display_name || '').trim();
    if (full) names.add(full);
    full.split(/\s+/).filter(Boolean).forEach(part => names.add(part));
    (player.aliases || []).forEach(alias => {
      names.add(alias);
      String(alias).split(/\s+/).filter(Boolean).forEach(part => names.add(part));
    });
    return [...names].map(normCompact).filter(Boolean);
  }
  function enrichEligiblePlayers(pool, indexRows) {
    if (!Array.isArray(indexRows) || !indexRows.length) return pool;
    return pool.map(player => {
      const playerKeys = new Set(variantsForPlayer(player));
      const hit = indexRows.find(row => {
        const candidate = { display_name: row.display_name || row.name || '', aliases: row.aliases || [] };
        return variantsForPlayer(candidate).some(key => playerKeys.has(key));
      });
      if (!hit) return player;
      const aliases = Array.from(new Set([...(player.aliases || []), ...(hit.aliases || [])]));
      return { ...player, aliases };
    });
  }
  function matchingPlayers(query, pool) {
    const q = normCompact(query);
    if (!q) return [];
    return pool.filter(player => variantsForPlayer(player).some(v => v.startsWith(q) || v.includes(q))).slice(0, 8);
  }
  function cueText(query, matches, poolSize) {
    if (!poolSize) return 'Box score player pool missing for this game.';
    if (!query.trim()) return 'Start typing for box score player hints.';
    if (!matches.length) return 'No player from this box score yet.';
    if (matches.length === 1) return `Looks like ${matches[0].display_name}.`;
    return `${matches.length} box score matches. Keep typing or pick below.`;
  }
  DP.renderLookback = function(parent, lookback) {
    if (!lookback || !lookback.game) return;
    const game = lookback.game;
    const teams = parseTeams(game);
    let eligiblePlayers = gamePlayerPool(game);
    const look = DP.child(parent, 'section', 'card lookback-card');
    DP.child(look, 'div', 'dp-eyebrow', 'On This Day');
    DP.child(look, 'h2', 'dp-panel-title', game.matchup || 'Thunder lookback');
    DP.child(look, 'p', 'date', `${game.game_date || ''} · final score hidden until reveal`.trim());
    const quiz = DP.child(look, 'div', 'scoreboard-trivia button-trivia');
    const status = DP.child(quiz, 'div', 'dtp-status', eligiblePlayers.length ? 'Pick the winner and margin range. Player fields hint names from this game’s box score only.' : 'Pick the winner and margin range. Player hints need a box score player pool.');
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
    }
    const playerResults = {};
    const playerInputs = [];
    function renderSuggest(input, menu, result, key) {
      const value = input.value.trim();
      const matches = matchingPlayers(value, eligiblePlayers);
      result.textContent = cueText(value, matches, eligiblePlayers.length);
      result.className = `trivia-result live ${matches.length === 1 ? 'correct' : matches.length ? '' : 'incorrect'}`;
      menu.replaceChildren();
      if (!value || !matches.length || document.activeElement !== input) { menu.classList.remove('open'); return; }
      matches.forEach(player => {
        const option = DP.child(menu, 'button', 'trivia-suggest-option');
        option.type = 'button';
        option.textContent = player.display_name;
        if (player.aliases?.length) DP.child(option, 'small', '', player.aliases.slice(0, 3).join(' · '));
        option.addEventListener('mousedown', ev => {
          ev.preventDefault();
          input.value = player.display_name;
          state.players[key] = player.display_name;
          result.textContent = `Selected ${player.display_name}.`;
          result.className = 'trivia-result live correct';
          menu.classList.remove('open');
          input.focus();
        });
      });
      menu.classList.add('open');
    }
    playerFields.forEach(([key, label]) => {
      const row = DP.child(playerQ, 'label', 'trivia-text-row');
      DP.child(row, 'span', '', label);
      const combo = DP.child(row, 'span', 'trivia-combo');
      const input = DP.child(combo, 'input', 'trivia-text-input');
      input.type = 'text'; input.autocomplete = 'off'; input.placeholder = eligiblePlayers.length ? 'Type a player name' : 'Box score pool missing';
      input.disabled = !eligiblePlayers.length;
      const menu = DP.child(combo, 'div', 'trivia-suggest-menu');
      const result = DP.child(playerQ, 'div', 'trivia-result live', cueText('', [], eligiblePlayers.length));
      playerResults[key] = result;
      playerInputs.push({ input, menu, result, key });
      input.addEventListener('input', () => {
        state.players[key] = input.value;
        renderSuggest(input, menu, result, key);
      });
      input.addEventListener('focus', () => renderSuggest(input, menu, result, key));
      input.addEventListener('blur', () => setTimeout(() => menu.classList.remove('open'), 140));
    });
    loadPlayerIndex().then(players => {
      eligiblePlayers = enrichEligiblePlayers(eligiblePlayers, players);
      playerInputs.forEach(({ input, menu, result, key }) => renderSuggest(input, menu, result, key));
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
        const typed = state.players[key] || '';
        const ok = matchesAnswer(typed, game[key]);
        const eligible = matchingPlayers(typed, eligiblePlayers).length > 0;
        if (ok) playerOk++;
        if (playerResults[key]) {
          playerResults[key].textContent = ok ? 'Correct' : eligible ? `Good box score name, wrong leader. Answer: ${answerText(game[key])}` : `Not in this game’s box score pool. Answer: ${answerText(game[key])}`;
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
