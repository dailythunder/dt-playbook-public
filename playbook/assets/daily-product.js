/* Patch 05B: modular Playbook MVP gameplay runtime. */
(function(){
  const chunks = [
    'daily-product-core.js',
    'daily-product-hoardle-crossword.js',
    'daily-product-connections.js',
    'daily-product-shaisweeper.js',
    'daily-product-lookback.js',
    'daily-product-load.js'
  ];
  function load(i){
    if(i >= chunks.length) return;
    const s = document.createElement('script');
    s.src = chunks[i];
    s.defer = false;
    s.onload = () => load(i + 1);
    s.onerror = () => { throw new Error('Unable to load '+chunks[i]); };
    document.head.appendChild(s);
  }
  load(0);
})();
