(() => {
  const DP = window.DTPlaybook = window.DTPlaybook || {};
  DP.root = document.getElementById('daily-product-root');
  DP.batch = document.getElementById('batch-chip');
  DP.state = { manifest: null, days: [], active: 0, revealed: false };
  DP.node = function(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  };
  DP.child = function(parent, tag, cls, text) {
    const n = DP.node(tag, cls, text);
    parent.appendChild(n);
    return n;
  };
  DP.shuffle = function(items) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  DP.key = arr => [...arr].sort().join('|');
  DP.dateLabel = function(date) {
    const d = new Date(`${date}T12:00:00Z`);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };
  DP.listText = function(value) {
    if (Array.isArray(value)) return value.join(', ');
    if (value === undefined || value === null || value === '') return '—';
    return String(value);
  };
  DP.norm = value => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  DP.safePuzzleType = day => day?.modules?.daily_puzzle?.type || 'puzzle';
  DP.render = function() {
    const day = DP.state.days[DP.state.active];
    if (!day) { DP.root.textContent = 'No Playbook days loaded.'; return; }
    DP.root.replaceChildren();
    if (DP.batch) DP.batch.textContent = `${DP.state.days.length} public-safe day${DP.state.days.length === 1 ? '' : 's'}`;
    const tabs = DP.child(DP.root, 'aside', 'card');
    DP.child(tabs, 'div', 'dp-eyebrow', 'Dates');
    const list = DP.child(tabs, 'div', 'dp-tabs');
    DP.state.days.forEach((d, i) => {
      const b = DP.child(list, 'button', 'dp-tab', `${DP.dateLabel(d.date)} · ${DP.safePuzzleType(d)}`);
      b.type = 'button';
      b.setAttribute('aria-selected', String(i === DP.state.active));
      b.addEventListener('click', () => { DP.state.active = i; DP.state.revealed = false; DP.render(); });
    });
    if (Array.isArray(DP.state.manifest?.skipped) && DP.state.manifest.skipped.length) {
      const skipped = DP.child(tabs, 'div', 'dp-gameday-empty');
      skipped.textContent = `Skipped: ${DP.state.manifest.skipped.map(s => `${s.date} (${s.reason || s.status})`).join(', ')}`;
    }
    const main = DP.child(DP.root, 'div', 'dp-main');
    const layout = DP.child(main, 'div', 'dp-layout');
    const puzzle = DP.child(layout, 'section', 'card dp-puzzle-card');
    const pz = day.modules.daily_puzzle || {};
    DP.child(puzzle, 'div', 'dp-eyebrow', 'Daily Free Puzzle');
    DP.child(puzzle, 'h2', 'dp-panel-title', pz.title || 'Puzzle');
    if (pz.summary) DP.child(puzzle, 'p', '', pz.summary);
    if (pz.guide) DP.child(puzzle, 'p', 'date', pz.guide);
    DP.renderPuzzle(puzzle, pz);
    const right = DP.child(layout, 'div', 'dp-right');
    DP.renderLookback(right, day.modules.lookback);
    DP.renderArticle(main, day.modules.article);
    DP.renderPlayNext(main);
  };
  DP.renderPuzzle = function(parent, pz) {
    if (pz.type === 'connections') return DP.renderConnections(parent, pz);
    if (pz.type === 'hoardle') return DP.renderHoardle(parent, pz);
    if (pz.type === 'crossword') return DP.renderCrossword(parent, pz);
    if (pz.type === 'shaisweeper') return DP.renderShaiSweeper(parent, pz);
    DP.child(parent, 'div', 'dp-gameday-empty', `Unsupported or pending puzzle type: ${pz.type || 'unknown'}`);
  };
})();
