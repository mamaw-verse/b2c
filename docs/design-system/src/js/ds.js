/* Demo behaviour for the static component sheets and reference screens.
   Framework-neutral, data-attribute driven, no dependencies. NOT production logic:
   ported components re-implement these behaviours in Blade/Alpine, React or Vue.
   Every user-visible string comes from DS.strings (override with window.DS_STRINGS for Filipino). */
(function () {
  'use strict';
  var strings = Object.assign({
    close: 'Close',
    dismiss: 'Dismiss notification',
    suggestions: { one: '{n} suggestion', other: '{n} suggestions' },
    noSuggestions: 'No suggestions',
    quantity: 'Quantity {n}',
    moved: '{name} moved to position {n}',
    removed: '{name} removed',
    added: '{n} photo added',
    slide: '{n} of {total}',
    loaded: '{n} more items loaded',
    end: 'You have reached the end',
    selected: { one: '{n} selected', other: '{n} selected' },
    rating: '{n} of 5 stars',
    sent: 'Message sent'
  }, window.DS_STRINGS || {});

  function t(key, vars) {
    var s = strings[key]; vars = vars || {};
    if (s && typeof s === 'object') s = s[new Intl.PluralRules(document.documentElement.lang || 'en').select(vars.n)] || s.other;
    return String(s || key).replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ''; });
  }
  var format = {
    price: function (n) { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n); },
    compact: function (n) { return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n).toLowerCase(); }
  };
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function on(type, sel, fn) { document.addEventListener(type, function (e) { var el = e.target.closest && e.target.closest(sel); if (el) fn(e, el); }); }
  function announce(root, msg) {
    var live = $('[data-ds-live]', root) || $('#ds-live');
    if (!live) { live = document.createElement('p'); live.id = 'ds-live'; live.className = 'sr-only'; live.setAttribute('aria-live', 'polite'); document.body.appendChild(live); }
    live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30);
  }

  /* Dialogs: modal, bottom sheet, drawer, confirm. Native <dialog> gives the focus trap (inert page),
     Escape and top layer; base.css locks page scroll while a modal dialog is open. */
  var openers = new WeakMap();
  var dialogDownTarget = null;
  document.addEventListener('pointerdown', function (e) { dialogDownTarget = e.target; });
  on('click', '[data-ds-open]', function (e, btn) {
    var d = document.getElementById(btn.getAttribute('data-ds-open')); if (!d) return;
    e.preventDefault(); openers.set(d, btn); d.showModal();
    var first = $('[autofocus]', d) || $('[data-ds-initial-focus]', d) || $('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', d);
    if (first) first.focus();
  });
  on('click', '[data-ds-close]', function (e, btn) { var d = btn.closest('dialog'); if (d) d.close(btn.value || ''); });
  document.addEventListener('click', function (e) {
    if (e.target.tagName === 'DIALOG' && e.target.open && dialogDownTarget === e.target) e.target.close('backdrop');
  });
  document.addEventListener('close', function (e) {
    var d = e.target; if (d.tagName !== 'DIALOG') return;
    var o = openers.get(d); if (o && document.contains(o)) o.focus();
  }, true);
  on('click', '.btn[aria-busy="true"]', function (e) { e.preventDefault(); e.stopImmediatePropagation(); });
  /* Bottom sheet: drag the handle down to dismiss. */
  on('pointerdown', '[data-ds-sheet-handle]', function (e, h) {
    var d = h.closest('dialog'), y0 = e.clientY, dy = 0; h.setPointerCapture(e.pointerId);
    function move(ev) { dy = Math.max(0, ev.clientY - y0); d.style.translate = '0 ' + dy + 'px'; }
    function up() { h.removeEventListener('pointermove', move); d.style.translate = ''; if (dy > 80) d.close('swipe'); }
    h.addEventListener('pointermove', move); h.addEventListener('pointerup', up, { once: true });
  });

  /* Tabs (automatic activation, roving tabindex). */
  function selectTab(tab, focus) {
    var list = tab.closest('[role=tablist]');
    $$('[role=tab]', list).forEach(function (t) {
      var sel = t === tab; t.setAttribute('aria-selected', sel); t.tabIndex = sel ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !sel;
    });
    if (focus) { tab.focus(); tab.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  }
  on('click', '[role=tab]', function (e, tab) { selectTab(tab); });
  on('keydown', '[role=tab]', function (e, tab) {
    var tabs = $$('[role=tab]', tab.closest('[role=tablist]')), i = tabs.indexOf(tab);
    var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next == null) return; e.preventDefault(); selectTab(tabs[(next + tabs.length) % tabs.length], true);
  });

  /* Popover / dropdown menu: native [popover]; JS only positions it and handles menu arrow keys. */
  document.addEventListener('toggle', function (e) {
    var pop = e.target; if (!pop.hasAttribute || !pop.hasAttribute('popover') || e.newState !== 'open') return;
    var inv = $('[popovertarget="' + pop.id + '"]'); if (!inv) return;
    var r = inv.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, vw = innerWidth, vh = innerHeight;
    var left = pop.hasAttribute('data-ds-align-end') ? r.right - w : r.left;
    var top = r.bottom + 4 + h > vh && r.top - 4 - h > 0 ? r.top - 4 - h : r.bottom + 4;
    pop.style.left = Math.max(8, Math.min(left, vw - w - 8)) + 'px'; pop.style.top = top + 'px';
    var item = $('[role=menuitem],[role=menuitemradio]', pop); if (item) item.focus();
  }, true);
  on('keydown', '[role=menu] [role^=menuitem]', function (e, item) {
    var items = $$('[role^=menuitem]', item.closest('[role=menu]')), i = items.indexOf(item);
    var next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
    if (next == null) return; e.preventDefault(); items[(next + items.length) % items.length].focus();
  });
  on('click', '[popover] [role^=menuitem]', function (e, item) { item.closest('[popover]').hidePopover(); });

  /* Tooltip: CSS shows it on hover/focus; Escape dismisses (WCAG 1.4.13). */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    $$('[data-ds-tooltip]').forEach(function (t) { t.setAttribute('data-dismissed', ''); });
  });
  on('pointerleave', '[data-ds-tooltip]', function (e, t) { t.removeAttribute('data-dismissed'); });
  on('focusout', '[data-ds-tooltip]', function (e, t) { t.removeAttribute('data-dismissed'); });

  /* Toast: polite live region, auto-dismiss after 5s, paused while hovered or focused. */
  on('click', '[data-ds-toast]', function (e, btn) {
    var region = $('#ds-toaster') || $('[data-ds-toaster]'); if (!region) return;
    $$('[data-ds-toast-item]', region).forEach(function (t) { t.remove(); });
    var tone = btn.getAttribute('data-ds-toast-tone') || 'success';
    var tpl = document.getElementById('ds-toast-' + tone) || document.getElementById('ds-toast-success');
    var toast = tpl.content.firstElementChild.cloneNode(true);
    $('[data-ds-toast-text]', toast).textContent = btn.getAttribute('data-ds-toast');
    region.appendChild(toast);
    var timer, remove = function () { toast.remove(); };
    var start = function () { timer = setTimeout(remove, 5000); }, stop = function () { clearTimeout(timer); };
    toast.addEventListener('pointerenter', stop); toast.addEventListener('pointerleave', start);
    toast.addEventListener('focusin', stop); toast.addEventListener('focusout', start);
    $('[data-ds-toast-close]', toast).addEventListener('click', function () { remove(); btn.focus(); });
    start();
  });

  /* Quantity stepper. */
  function syncStepper(s) {
    var input = $('input', s), min = +(input.min || 1), max = +(input.max || 999);
    var raw = parseInt(String(input.value).replace(/\D/g, ''), 10);
    if (isNaN(raw) || raw < min) raw = min;
    if (raw > max) raw = max;
    input.value = raw;
    $('[data-ds-step="-1"]', s).disabled = raw <= min; $('[data-ds-step="1"]', s).disabled = raw >= max;
  }
  on('click', '[data-ds-stepper] [data-ds-step]', function (e, b) {
    var s = b.closest('[data-ds-stepper]'), input = $('input', s);
    input.value = Math.min(+(input.max || 999), Math.max(+(input.min || 1), +input.value + +b.getAttribute('data-ds-step')));
    syncStepper(s); announce(s, t('quantity', { n: input.value }));
  });
  on('change', '[data-ds-stepper] input', function (e, i) {
    var s = i.closest('[data-ds-stepper]');
    syncStepper(s);
    announce(s, t('quantity', { n: i.value }));
  });

  /* OTP: one digit per box, auto-advance, backspace goes back, paste fills all. */
  on('input', '[data-ds-otp] input', function (e, i) {
    var digits = i.value.replace(/\D/g, '');
    if (digits.length > 1) {
      var boxes = $$('input', i.closest('[data-ds-otp]'));
      boxes.forEach(function (b, n) { b.value = digits[n] || ''; });
      var next = boxes[Math.min(digits.length, boxes.length) - 1];
      if (next) next.focus();
    } else {
      i.value = digits;
      if (i.value && i.nextElementSibling) i.nextElementSibling.focus();
    }
  });
  on('keydown', '[data-ds-otp] input', function (e, i) {
    if (e.key === 'Backspace' && !i.value && i.previousElementSibling) i.previousElementSibling.focus();
  });
  on('paste', '[data-ds-otp] input', function (e, i) {
    var digits = (e.clipboardData.getData('text') || '').replace(/\D/g, ''); if (!digits) return;
    e.preventDefault(); var boxes = $$('input', i.closest('[data-ds-otp]'));
    boxes.forEach(function (b, n) { b.value = digits[n] || ''; }); (boxes[Math.min(digits.length, boxes.length) - 1]).focus();
  });

  /* PH mobile number: digits only, formatted 9XX XXX XXXX after the +63 prefix. */
  on('input', '[data-ds-phone]', function (e, i) {
    var d = i.value.replace(/\D/g, '').replace(/^(63|0)/, '').slice(0, 10);
    i.value = [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join(' ');
  });

  /* Combobox / search suggestions (ARIA 1.2 combobox + listbox, aria-activedescendant). */
  function cbParts(input) { var list = document.getElementById(input.getAttribute('aria-controls')); return { list: list, opts: $$('[role=option]', list).filter(function (o) { return !o.hidden; }) }; }
  function cbOpen(input, open) { var p = cbParts(input); if (open && !p.opts.length) open = false; input.setAttribute('aria-expanded', open); p.list.hidden = !open; if (!open) { input.removeAttribute('aria-activedescendant'); var e = $('[data-ds-empty]', input.closest('[data-ds-combobox]')); if (e && !input.value) e.hidden = true; } }
  function cbActive(input, opt) {
    $$('[role=option]', cbParts(input).list).forEach(function (o) { o.setAttribute('aria-selected', o === opt); });
    if (opt) { input.setAttribute('aria-activedescendant', opt.id); opt.scrollIntoView({ block: 'nearest' }); }
  }
  on('input', '[role=combobox]', function (e, input) {
    var q = input.value.trim().toLowerCase(), list = cbParts(input).list, n = 0;
    $$('[role=option]', list).forEach(function (o) { o.hidden = q && o.textContent.toLowerCase().indexOf(q) < 0; if (!o.hidden) n++; });
    var empty = $('[data-ds-empty]', input.closest('[data-ds-combobox]')); if (empty) empty.hidden = n > 0;
    cbOpen(input, n > 0); cbActive(input, null);
    announce(input.closest('[data-ds-combobox]'), n ? t('suggestions', { n: n }) : t('noSuggestions'));
  });
  on('focusin', '[role=combobox][data-ds-open-on-focus]', function (e, input) { cbOpen(input, true); });
  on('keydown', '[role=combobox]', function (e, input) {
    var p = cbParts(input), cur = p.opts.indexOf(document.getElementById(input.getAttribute('aria-activedescendant')));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); cbOpen(input, true); if (!p.opts.length) return;
      cbActive(input, p.opts[(cur + (e.key === 'ArrowDown' ? 1 : -1) + p.opts.length + (cur < 0 && e.key === 'ArrowUp' ? 1 : 0)) % p.opts.length]);
    } else if (e.key === 'Enter' && cur >= 0) { e.preventDefault(); pick(input, p.opts[cur]); }
    else if (e.key === 'Escape') { if (input.getAttribute('aria-expanded') === 'true') { e.stopPropagation(); cbOpen(input, false); } else input.value = ''; }
  });
  function pick(input, opt) { input.value = opt.getAttribute('data-value') || opt.textContent.trim(); cbOpen(input, false); input.focus(); }
  on('pointerdown', '[role=listbox] [role=option]', function (e) { e.preventDefault(); });
  on('click', '[role=listbox] [role=option]', function (e, opt) { var input = $('[aria-controls="' + opt.closest('[role=listbox]').id + '"]'); if (input) pick(input, opt); });
  on('focusout', '[data-ds-combobox]', function (e, box) { if (!box.contains(e.relatedTarget)) { var i = $('[role=combobox]', box); if (i) cbOpen(i, false); } });

  /* Character counter. */
  on('input', '[data-ds-counter]', function (e, el) { var c = document.getElementById(el.getAttribute('data-ds-counter')); c.textContent = el.value.length + ' / ' + el.maxLength; });
  /* Password reveal. */
  on('click', '[data-ds-reveal]', function (e, b) { var i = document.getElementById(b.getAttribute('data-ds-reveal')), show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.setAttribute('aria-pressed', show); });

  /* Image uploader: add, reorder (keyboard-operable buttons), remove. */
  on('change', '[data-ds-uploader] input[type=file]', function (e, input) {
    var up = input.closest('[data-ds-uploader]'), list = $('[data-ds-tiles]', up), tpl = $('template', up);
    Array.prototype.slice.call(input.files).forEach(function (f) {
      var tile = tpl.content.firstElementChild.cloneNode(true); $('img', tile).src = URL.createObjectURL(f); $('img', tile).alt = f.name;
      tile.setAttribute('data-name', f.name); list.insertBefore(tile, $('[data-ds-add]', list));
    });
    announce(up, t('added', { n: input.files.length })); input.value = '';
  });
  on('click', '[data-ds-tiles] [data-ds-move]', function (e, b) {
    var tile = b.closest('li'), list = tile.parentNode, dir = +b.getAttribute('data-ds-move');
    var sib = dir < 0 ? tile.previousElementSibling : tile.nextElementSibling;
    if (!sib || sib.hasAttribute('data-ds-add')) return;
    list.insertBefore(tile, dir < 0 ? sib : sib.nextSibling); b.focus();
    announce(list.closest('[data-ds-uploader]'), t('moved', { name: tile.getAttribute('data-name'), n: $$('li:not([data-ds-add])', list).indexOf(tile) + 1 }));
  });
  on('click', '[data-ds-tiles] [data-ds-remove]', function (e, b) {
    var tile = b.closest('li'), up = tile.closest('[data-ds-uploader]'); announce(up, t('removed', { name: tile.getAttribute('data-name') }));
    (tile.nextElementSibling || tile.previousElementSibling).querySelector('button, input, label').focus(); tile.remove();
  });

  /* Rating input: native radios; JS only paints the stars up to the choice. */
  function paintRating(g, hoverVal) {
    var v = hoverVal != null ? hoverVal : +(($('input:checked', g) || {}).value || 0);
    $$('label', g).forEach(function (l, i) { l.toggleAttribute('data-on', i < v); });
  }
  on('change', '[data-ds-rating] input', function (e, i) { paintRating(i.closest('[data-ds-rating]')); });
  on('pointerover', '[data-ds-rating] label', function (e, l) {
    var g = l.closest('[data-ds-rating]'); if (!g) return;
    var idx = $$('label', g).indexOf(l);
    if (idx >= 0) paintRating(g, idx + 1);
  });
  on('pointerleave', '[data-ds-rating]', function (e, g) { paintRating(g); });

  /* Checkbox indeterminate + select-all + bulk bar. */
  function syncBulk(scope) {
    var boxes = $$('[data-ds-bulk-item]', scope), n = boxes.filter(function (b) { return b.checked; }).length, all = $('[data-ds-select-all]', scope);
    if (all) { all.checked = n === boxes.length && n > 0; all.indeterminate = n > 0 && n < boxes.length; }
    var bar = $('[data-ds-bulk-bar]', scope); if (bar) { bar.hidden = !n; $('[data-ds-bulk-count]', bar).textContent = t('selected', { n: n }); }
  }
  on('change', '[data-ds-select-all]', function (e, all) { var s = all.closest('[data-ds-bulk]'); $$('[data-ds-bulk-item]', s).forEach(function (b) { b.checked = all.checked; }); syncBulk(s); });
  on('change', '[data-ds-bulk-item]', function (e, b) { syncBulk(b.closest('[data-ds-bulk]')); });

  /* Carousel / gallery: scroll-snap track, prev/next, thumbnails, counter. */
  function initCarousel(c) {
    var track = $('[data-ds-track]', c), slides = Array.prototype.slice.call(track.children), count = $('[data-ds-count]', c);
    function current() { return Math.round(track.scrollLeft / (track.clientWidth || 1)); }
    function go(i) { i = Math.max(0, Math.min(slides.length - 1, i)); track.scrollTo({ left: i * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    function sync() {
      var i = current(); if (count) count.textContent = t('slide', { n: i + 1, total: slides.length });
      $$('[data-ds-thumb]', c).forEach(function (th, n) { th.setAttribute('aria-current', n === i); });
      var p = $('[data-ds-prev]', c), nx = $('[data-ds-next]', c); if (p) p.disabled = i === 0; if (nx) nx.disabled = i === slides.length - 1;
    }
    c.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ds-prev],[data-ds-next],[data-ds-thumb]'); if (!b) return;
      go(b.hasAttribute('data-ds-thumb') ? +b.getAttribute('data-ds-thumb') : current() + (b.hasAttribute('data-ds-next') ? 1 : -1));
    });
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(current() + (e.key === 'ArrowRight' ? 1 : -1)); } });
    track.addEventListener('scroll', function () { clearTimeout(c._t); c._t = setTimeout(sync, 60); }, { passive: true });
    sync();
  }

  /* Infinite scroll: sentinel + "Load more" button fallback (keyboard and no-JS friendly). */
  function initInfinite(s) {
    var list = document.getElementById(s.getAttribute('data-ds-infinite')), pages = +(s.getAttribute('data-ds-pages') || 2), loaded = 0;
    function more() {
      if (loaded >= pages) return; loaded++;
      var items = $$(':scope > *', list).slice(0, 4).map(function (n) { return n.cloneNode(true); });
      items.forEach(function (n) { list.appendChild(n); }); announce(s, t('loaded', { n: items.length }));
      if (loaded >= pages) { s.querySelector('[data-ds-more]').hidden = true; s.querySelector('[data-ds-end]').hidden = false; io && io.disconnect(); }
    }
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { if (es[0].isIntersecting) more(); }, { rootMargin: '200px' }) : null;
    if (io && s.hasAttribute('data-ds-auto')) io.observe(s);
    s.querySelector('[data-ds-more]').addEventListener('click', more);
  }

  /* Chat composer: autosize, Enter sends (Shift+Enter = newline). */
  on('input', '[data-ds-autosize]', function (e, ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; });
  on('submit', '[data-ds-composer]', function (e, form) {
    e.preventDefault(); var ta = $('textarea', form), text = ta.value.trim(); if (!text) return;
    var thread = document.getElementById(form.getAttribute('data-ds-composer')), tpl = $('template', thread.parentNode) || $('template', form);
    var b = tpl.content.firstElementChild.cloneNode(true); $('[data-ds-bubble-text]', b).textContent = text; thread.appendChild(b);
    b.scrollIntoView({ block: 'end' }); ta.value = ''; ta.style.height = ''; announce(form, t('sent'));
  });
  on('keydown', '[data-ds-composer] textarea', function (e, ta) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ta.form.requestSubmit(); } });

  /* Master-detail: selecting a row shows its detail; on phone the detail is a full-screen dialog. */
  on('click', '[data-ds-detail]', function (e, row) {
    $$('[data-ds-detail]', row.closest('[data-ds-master]')).forEach(function (r) { r.setAttribute('aria-current', r === row); });
  });

  /* Form validation demo: native constraint validation rendered with the FormField error pattern. */
  on('submit', '[data-ds-validate]', function (e, form) {
    var first = null;
    $$('input, select, textarea', form).forEach(function (f) {
      if (!f.willValidate) return; var err = document.getElementById(f.id + '-error'), ok = f.checkValidity();
      f.setAttribute('aria-invalid', !ok); if (err) { err.hidden = ok; }
      if (!ok && !first) first = f;
    });
    e.preventDefault(); if (first) first.focus();
  });

  /* Review expansion ("See more"). */
  on('click', '[data-ds-expand]', function (e, b) {
    var p = b.previousElementSibling; if (!p) return;
    var open = b.getAttribute('aria-expanded') === 'true';
    p.classList.toggle('line-clamp-4', open);
    b.setAttribute('aria-expanded', !open);
    b.textContent = open ? 'See more' : 'See less';
  });

  function init(root) {
    $$('[data-ds-carousel]', root).forEach(initCarousel);
    $$('[data-ds-infinite]', root).forEach(initInfinite);
    $$('[data-ds-stepper]', root).forEach(syncStepper);
    $$('[data-ds-rating]', root).forEach(paintRating);
    $$('[data-ds-indeterminate]', root).forEach(function (c) { c.indeterminate = true; });
    $$('[data-ds-bulk]', root).forEach(syncBulk);
    $$('[role=tablist]', root).forEach(function (list) {
      var sel = $('[role=tab][aria-selected="true"]', list);
      if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }
  window.DS = { strings: strings, t: t, format: format, init: init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); }); else init();
})();
