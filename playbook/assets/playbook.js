(function(){
  const now = new Date();
  const stampEls = document.querySelectorAll('[data-build-stamp]');
  stampEls.forEach((el) => {
    el.textContent = `Updated ${now.toISOString().slice(0, 10)}`;
  });
})();
