// About me page: photo viewer (lightbox).
(function () {
  'use strict';

  /* ---------- Lightbox ---------- */
  var dialog = document.querySelector('.lightbox');
  var figures = Array.prototype.slice.call(document.querySelectorAll('main .photo'));
  if (dialog && typeof dialog.showModal === 'function' && figures.length) {
    var big = dialog.querySelector('.lightbox-image');
    var text = dialog.querySelector('.lightbox-text');
    var count = dialog.querySelector('.lightbox-count');
    var current = 0;
    var opener = null;

    var items = figures.map(function (fig) {
      var img = fig.querySelector('img');
      var cap = fig.querySelector('figcaption');
      return { fig: fig, img: img, caption: cap ? cap.textContent.trim() : '' };
    }).filter(function (item) { return item.img; });

    function show(index) {
      current = (index + items.length) % items.length;
      var item = items[current];
      big.src = item.img.currentSrc || item.img.src;
      big.alt = item.img.alt;
      text.textContent = item.caption;
      count.textContent = (current + 1) + ' / ' + items.length;
    }
    function open(index, from) {
      opener = from;
      show(index);
      document.documentElement.classList.add('lightbox-open');
      dialog.showModal();
    }
    dialog.addEventListener('close', function () {
      document.documentElement.classList.remove('lightbox-open');
      if (opener) opener.focus();
    });

    items.forEach(function (item, i) {
      var target = item.img;
      target.setAttribute('tabindex', '0');
      target.setAttribute('role', 'button');
      target.setAttribute('aria-label', 'Open photo' + (item.caption ? ': ' + item.caption : ''));
      target.classList.add('is-zoomable');
      target.addEventListener('click', function () { open(i, target); });
      target.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i, target); }
      });
    });

    dialog.querySelector('.lightbox-prev').addEventListener('click', function () { show(current - 1); });
    dialog.querySelector('.lightbox-next').addEventListener('click', function () { show(current + 1); });
    dialog.querySelector('.lightbox-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    });
    // Click on the dark backdrop (not the photo or a button) closes the viewer.
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target.classList.contains('lightbox-inner') || e.target.classList.contains('lightbox-figure')) dialog.close();
    });
    // Swipe left/right on touch screens.
    var startX = null;
    dialog.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') startX = e.clientX; });
    dialog.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    });
  }
})();

// Travel filmstrip: arrow buttons, a progress line, and click-and-drag scrolling with a mouse.
(function () {
  'use strict';
  var strip = document.querySelector('.filmstrip');
  if (!strip) return;
  var bar = document.querySelector('.filmstrip-progress span');
  var buttons = document.querySelectorAll('.filmstrip-btn');

  function update() {
    var max = strip.scrollWidth - strip.clientWidth;
    var p = max > 0 ? strip.scrollLeft / max : 0;
    if (bar) bar.style.transform = 'scaleX(' + Math.max(0.04, p).toFixed(3) + ')';
    buttons[0].disabled = strip.scrollLeft <= 2;
    buttons[1].disabled = strip.scrollLeft >= max - 2;
  }
  strip.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', update);
  update();

  Array.prototype.forEach.call(buttons, function (btn) {
    btn.addEventListener('click', function () {
      var dir = Number(btn.getAttribute('data-dir'));
      strip.scrollBy({ left: dir * strip.clientWidth * 0.7, behavior: 'smooth' });
    });
  });

  // Drag with a mouse (touch and trackpads already scroll natively).
  var down = false, dragged = false, startX = 0, startLeft = 0;
  strip.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; dragged = false; startX = e.clientX; startLeft = strip.scrollLeft;
  });
  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX;
    if (!dragged && Math.abs(dx) > 6) { dragged = true; strip.classList.add('is-dragging'); }
    if (dragged) strip.scrollLeft = startLeft - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!down) return;
    down = false;
    strip.classList.remove('is-dragging');
  });
  // A drag should not count as a click that opens the photo viewer.
  strip.addEventListener('click', function (e) {
    if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; }
  }, true);
})();
