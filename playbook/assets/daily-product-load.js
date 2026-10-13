(() => {
  const DP = window.DTPlaybook;
  const CACHE = 'dt-playbook-last-good-v1';
  const asset = document.currentScript?.src || new URL('../assets/daily-product-load.js', location.href).href;
  const dataBase = new URL('../data/', asset);
  DP.todayChicago = (now = new Date()) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);
  DP.releasedEntries = (manifest, today) => (manifest?.days || [])
    .filter(e => /^\d{4}-\d{2}-\d{2}$/.test(e.date) && e.date <= today && e.status === 'ready'
      && e.file === `playbook_days/${e.date}.json`)
    .sort((a, b) => a.date.localeCompare(b.date));
  DP.validDay = (day, entry) => day?.schema_version === 'playbook_day_public.v1'
    && day.date === entry.date && day.status === 'ready'
    && day.modules && Object.keys(day.modules).length > 0;
  function saved() { try { return JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch (_) { return null; } }
  async function json(file) {
    const response = await fetch(new URL(file, dataBase), { cache: 'no-store' });
    if (!response.ok) throw new Error(`${file} ${response.status}`);
    return response.json();
  }
  DP.loadWeek = async function() {
    const today = DP.todayChicago();
    const cached = saved();
    let manifest, days = [], failed = 0;
    try {
      manifest = await json('playbook_manifest.json');
      const entries = DP.releasedEntries(manifest, today);
      const results = await Promise.allSettled(entries.map(async entry => {
        const day = await json(entry.file);
        if (!DP.validDay(day, entry)) throw new Error('day identity/schema mismatch');
        return day;
      }));
      failed = results.filter(r => r.status === 'rejected').length;
      days = results.map((result, index) => result.status === 'fulfilled' ? result.value
        : manifest.release_revision === cached?.manifest?.release_revision
          ? (Array.isArray(cached?.days) ? cached.days : []).find(day => DP.validDay(day, entries[index])) : null).filter(Boolean);
      if (!days.length) throw new Error('No released days are available');
      try { localStorage.setItem(CACHE, JSON.stringify({ manifest, days })); } catch (_) { /* storage is optional */ }
    } catch (_) {
      manifest = cached?.manifest;
      const entries = DP.releasedEntries(manifest, today);
      days = (Array.isArray(cached?.days) ? cached.days : []).filter(d => entries.some(e => DP.validDay(d, e)));
      failed = 1;
    }
    if (!days.length) { DP.root.textContent = 'The next Playbook update is being prepared. Please check back soon.'; return; }
    try { DP.state.gameday = await json('current_season_public.json'); } catch (_) { DP.state.gameday = null; }
    DP.state.manifest = manifest;
    DP.state.days = days.sort((a, b) => a.date.localeCompare(b.date));
    DP.state.active = DP.state.days.length - 1;
    DP.state.notice = failed ? 'Showing the latest available Playbook update.'
      : DP.state.days[DP.state.active].date < today ? `Latest Playbook: ${DP.dateLabel(DP.state.days[DP.state.active].date)}` : '';
    DP.render();
  };
  DP.loadWeek().catch(() => { DP.root.textContent = 'The Playbook is temporarily unavailable. Please try again.'; });
})();
