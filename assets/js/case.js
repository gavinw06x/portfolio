// Case study pages: a section index whose marker glides with the page.
// - While reading, the marker moves continuously between entries in step with the scroll position.
// - Clicking an entry scrolls the page with an eased animation (about 0.7–1.3s by distance); the marker follows the same motion.
(function () {
  'use strict';
  var toc = document.querySelector('.case-toc');
  if (!toc) return;
  var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  if (!links.length || sections.some(function (s) { return !s; })) return;

  var marker = document.createElement('span');
  marker.className = 'case-toc-marker';
  marker.setAttribute('aria-hidden', 'true');
  toc.appendChild(marker);
  toc.classList.add('has-marker');

  function barHeight() {
    var bar = document.querySelector('.site-bar');
    return bar ? bar.getBoundingClientRect().height : 0;
  }
  // The reading line: a little below the sticky bar.
  function readingLine() { return barHeight() + window.innerHeight * 0.25; }
  function docTop(el) { return el.getBoundingClientRect().top + window.scrollY; }

  var active = -1;
  function render() {
    var line = window.scrollY + readingLine();
    var tops = sections.map(docTop);
    var i = 0;
    while (i < tops.length - 1 && line >= tops[i + 1]) i++;
    var f = 0;
    if (line < tops[0]) f = 0;
    else if (i < tops.length - 1) f = Math.min(1, Math.max(0, (line - tops[i]) / (tops[i + 1] - tops[i])));
    // At the very bottom of the page, settle on the last entry.
    var atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atEnd) { i = tops.length - 1; f = 0; }
    // Ease the in-between so the marker lingers on an entry and moves late in the section.
    var t = i < tops.length - 1 ? smooth(Math.max(0, (f - 0.6) / 0.4)) : 0;
    var a = links[i], b = links[Math.min(i + 1, links.length - 1)];
    var y = a.offsetTop + (b.offsetTop - a.offsetTop) * t;
    var h = a.offsetHeight + (b.offsetHeight - a.offsetHeight) * t;
    marker.style.transform = 'translateY(' + y.toFixed(2) + 'px)';
    marker.style.height = h.toFixed(2) + 'px';
    var now = t > 0.5 ? i + 1 : i;
    if (now !== active) {
      active = now;
      links.forEach(function (l, k) { if (k === now) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
    }
  }
  function smooth(x) { return x * x * (3 - 2 * x); }

  var queued = false;
  function queue() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; render(); }); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  window.addEventListener('load', queue);
  render();

  // Eased scrolling for index clicks.
  var anim = null;
  function cancel() { if (anim) { cancelAnimationFrame(anim); anim = null; document.documentElement.style.scrollBehavior = ''; } }
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
    window.addEventListener(ev, function (e) { if (anim && !(ev === 'mousedown' && toc.contains(e.target))) cancel(); }, { passive: true });
  });
  function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  links.forEach(function (link, k) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      cancel();
      var target = sections[k];
      var to = Math.max(0, Math.min(docTop(target) - barHeight() - 24, document.documentElement.scrollHeight - window.innerHeight));
      var from = window.scrollY;
      var dist = Math.abs(to - from);
      var duration = Math.min(1300, Math.max(675, dist * 0.475));
      var start = null;
      document.documentElement.style.scrollBehavior = 'auto';
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / duration);
        window.scrollTo(0, from + (to - from) * easeInOut(p));
        if (p < 1) { anim = requestAnimationFrame(step); }
        else {
          anim = null;
          document.documentElement.style.scrollBehavior = '';
          history.replaceState(null, '', '#' + target.id);
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      }
      anim = requestAnimationFrame(step);
    });
  });
})();
