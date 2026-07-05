/* BlogHub — newspaper hero: a magnifying-glass loupe that zooms the photo
   (and reveals it in full colour while the page stays grayscale). */
(function () {
  function init() {
    // date line in the masthead
    const dateEl = document.getElementById('npDate');
    if (dateEl) {
      dateEl.textContent = new Date()
        .toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        .toUpperCase();
    }

    const fig = document.getElementById('magFigure');
    const img = document.getElementById('magImg');
    const lens = document.getElementById('lens');
    if (!fig || !img || !lens) return;

    const SIZE = 150;   // loupe diameter (matches CSS)
    const ZOOM = 2.4;

    function setBg() { lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`; }
    if (img.complete && img.naturalWidth) setBg();
    img.addEventListener('load', setBg);
    img.addEventListener('error', () => { fig.classList.add('np-noimg'); lens.style.display = 'none'; });

    // ignore touch (no hover) — grayscale photo is fine on its own
    if (window.matchMedia('(hover: none)').matches) return;

    function move(e) {
      if (fig.classList.contains('np-noimg')) return;
      const ir = img.getBoundingClientRect();
      const x = e.clientX - ir.left;   // cursor pos within the image
      const y = e.clientY - ir.top;

      if (x < 0 || y < 0 || x > ir.width || y > ir.height) { hide(); return; }

      const fr = fig.getBoundingClientRect();
      lens.style.display = 'block';
      document.body.classList.add('lens-active');
      lens.style.backgroundSize = `${ir.width * ZOOM}px ${ir.height * ZOOM}px`;
      lens.style.left = `${e.clientX - fr.left - SIZE / 2}px`;
      lens.style.top = `${e.clientY - fr.top - SIZE / 2}px`;
      lens.style.backgroundPosition = `${-(x * ZOOM - SIZE / 2)}px ${-(y * ZOOM - SIZE / 2)}px`;
    }
    function hide() { lens.style.display = 'none'; document.body.classList.remove('lens-active'); }

    fig.addEventListener('mousemove', move);
    fig.addEventListener('mouseleave', hide);
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
