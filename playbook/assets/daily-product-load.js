async function load() {
  const manifestRes = await fetch('../data/playbook_manifest.json', { cache: 'no-store' });
  if (!manifestRes.ok) throw new Error(`manifest ${manifestRes.status}`);
  const manifest = await manifestRes.json();
  const days = await Promise.all((manifest.days || []).map(async entry => {
    const res = await fetch(`../data/${entry.file}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${entry.file} ${res.status}`);
    return res.json();
  }));
  state.manifest = manifest;
  state.days = days;
  render();
}

load().catch(err => {
  root.textContent = `Daily Product failed to load: ${err.message}`;
});
