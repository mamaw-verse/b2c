// Styleguide chrome only (not production logic): brand switcher, live token read-outs, scaled responsive previews.
(function () {
  var root = document.documentElement;
  var param = new URLSearchParams(location.search).get('brand');
  var saved = null; try { saved = localStorage.getItem('sg-brand'); } catch (e) {}
  root.setAttribute('data-brand', param || saved || 'default');

  function lum(hex) { var c = hex.match(/\w\w/g).map(function (v) { v = parseInt(v, 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function hex(v) { v = v.trim(); if (v.charAt(0) === '#') return v.length === 4 ? '#' + v.slice(1).replace(/./g, '$&$&') : v.toLowerCase();
    var m = v.match(/[\d.]+/g); return m ? '#' + m.slice(0, 3).map(function (n) { return ('0' + Math.round(+n).toString(16)).slice(-2); }).join('') : v; }
  function tok(name) { return hex(getComputedStyle(root).getPropertyValue('--' + name)); }

  function setBrand(b) {
    root.setAttribute('data-brand', b);
    try { localStorage.setItem('sg-brand', b); } catch (e) {}
    document.querySelectorAll('iframe[data-sg-follow]').forEach(function (f) { try { f.contentDocument.documentElement.setAttribute('data-brand', b); } catch (e) {} });
    refresh();
  }
  function fit() {
    document.querySelectorAll('[data-sg-frame]').forEach(function (box) {
      var f = box.querySelector('iframe'), w = +f.getAttribute('width'), s = Math.min(1, box.clientWidth / w);
      f.style.transform = 'scale(' + s + ')'; box.style.height = (+f.getAttribute('height') * s) + 'px';
    });
  }
  function grow(f) {
    if (!f.hasAttribute('data-sg-autoheight')) return;
    try { var h = Math.min(+f.getAttribute('data-sg-max') || 900, f.contentDocument.documentElement.scrollHeight); f.setAttribute('height', h); fit(); } catch (e) {}
  }
  function refresh() {
    document.querySelectorAll('[data-hex]').forEach(function (el) { el.textContent = tok(el.getAttribute('data-hex')); });
    document.querySelectorAll('[data-ratio]').forEach(function (el) {
      var p = el.getAttribute('data-ratio').split('|'), need = parseFloat(el.getAttribute('data-need') || '4.5');
      var r = ratio(tok(p[0]), tok(p[1])); el.textContent = r.toFixed(2) + ' : 1 ' + (r >= need ? 'pass' : 'FAIL');
    });
    document.querySelectorAll('[data-size]').forEach(function (el) { var s = el.closest('[data-spec]') && el.closest('[data-spec]').querySelector('[data-sample]'); if (s) el.textContent = getComputedStyle(s).fontSize; });
    document.querySelectorAll('[data-brand-btn]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-brand-btn') === root.getAttribute('data-brand'))); });
    fit();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-brand-btn]'); if (b) setBrand(b.getAttribute('data-brand-btn'));
    var p = e.target.closest('[data-motion-play]'); if (p) document.querySelectorAll('[data-motion-box]').forEach(function (x) { x.classList.toggle('translate-x-32'); });
  });
  document.addEventListener('load', function (e) { if (e.target.tagName === 'IFRAME') grow(e.target); }, true);
  window.addEventListener('resize', fit);
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('iframe[data-sg-follow]').forEach(function (f) { if (f.contentDocument && f.contentDocument.readyState === 'complete') grow(f); });
    refresh();
  });
})();
