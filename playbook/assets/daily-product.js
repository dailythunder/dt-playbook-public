(() => {
  const css = ['daily-product-core.css','daily-product-games.css'];
  const chunks = [
    'daily-product-core.js',
    'daily-product-hoardle-crossword.js',
    'daily-product-connections.js',
    'daily-product-shaisweeper.js',
    'daily-product-lookback.js',
    'daily-product-load.js'
  ];
  const here = document.currentScript?.src ? new URL('.', document.currentScript.src) : new URL('./', location.href);
  for (const file of css) {
    if (!document.querySelector(`link[data-dp-chunk="${file}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = new URL(file, here).href;
      link.dataset.dpChunk = file;
      document.head.appendChild(link);
    }
  }
  function loadScript(file) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL(file, here).href;
      s.defer = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`failed to load ${file}`));
      document.head.appendChild(s);
    });
  }
  chunks.reduce((p, file) => p.then(() => loadScript(file)), Promise.resolve())
    .catch(err => {
      const root = document.getElementById('daily-product-root');
      if (root) root.textContent = `Daily Product failed to load: ${err.message}`;
    });
})();
