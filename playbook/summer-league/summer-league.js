const root = document.getElementById('summer-root');
const node = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const child = (p, tag, cls, text) => { const n = node(tag, cls, text); p.appendChild(n); return n; };
const listText = v => Array.isArray(v) ? v.join(', ') : (v || '—');
async function load() {
  const res = await fetch('summer-league-seed.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`summer seed ${res.status}`);
  const data = await res.json();
  render(data);
}
function render(data) {
  root.replaceChildren();
  const intro = child(root, 'section', 'summer-panel');
  child(intro, 'div', 'summer-eyebrow', data.mode);
  child(intro, 'h2', 'summer-title', data.title);
  child(intro, 'p', '', data.positioning);
  const grid = child(root, 'div', 'summer-grid');
  const main = child(grid, 'section', 'summer-panel');
  child(main, 'div', 'summer-eyebrow', 'Fake-serious scoreboard');
  child(main, 'h2', 'summer-title', data.featured_game.label);
  const score = child(main, 'div', 'summer-score');
  child(score, 'span', 'summer-team', `${data.featured_game.home} ${data.featured_game.fake_score.home}`);
  child(score, 'span', 'summer-vibes', data.featured_game.vibes_symbol);
  child(score, 'span', 'summer-team', `${data.featured_game.away} ${data.featured_game.fake_score.away}`);
  child(main, 'p', 'summer-gag', data.featured_game.exaggeration_line);
  child(main, 'p', '', data.featured_game.real_tracking_note);
  const actions = child(main, 'div', 'summer-actions');
  const draftBtn = child(actions, 'button', '', 'Generate Ghost preview copy');
  const teaser = child(actions, 'a', '', 'Playbook teaser bait'); teaser.href = data.playbook_teaser_url;
  const draft = child(main, 'textarea', 'summer-draft', ''); draft.readOnly = true;
  draftBtn.addEventListener('click', () => { draft.value = buildDraft(data); draft.focus(); draft.select(); });
  const side = child(grid, 'aside', 'summer-panel');
  child(side, 'div', 'summer-eyebrow', 'Nerd ledger');
  const ul = child(side, 'ul', 'summer-list');
  data.nerd_ledger.forEach(item => { const li = child(ul, 'li'); child(li, 'strong', '', item.label); child(li, 'div', '', item.note); });
  const ideas = child(root, 'section', 'summer-panel');
  child(ideas, 'div', 'summer-eyebrow', 'Bits to swap in');
  data.gag_modules.forEach(g => child(ideas, 'span', 'summer-pill', g));
}
function buildDraft(data) {
  return `${data.title}\n\n${data.featured_game.label}: ${data.featured_game.exaggeration_line}\n\nActual things tracked: ${data.nerd_ledger.map(x => x.label).join('; ')}.\n\nPlay the real thing: ${data.playbook_teaser_url}`;
}
load().catch(err => { root.textContent = `Summer shell failed to load: ${err.message}`; });
