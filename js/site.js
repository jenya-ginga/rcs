/* Меню сайта: кнопка «Меню» на телефоне и раскрывающиеся подразделы.
   Без JavaScript меню остаётся полностью видимым, а на компьютере подраздел открывается наведением. */
(function () {
  'use strict';
  var d = document;
  var header = d.querySelector('.site-header');
  if (!header) return;
  var toggle = header.querySelector('.nav-toggle');
  var nav = header.querySelector('.site-nav');
  var subs = [].slice.call(header.querySelectorAll('.nav-item.has-sub'));

  function setSub(item, on) {
    item.classList.toggle('open', on);
    var b = item.querySelector('.sub-toggle');
    if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  function closeSubs(except) {
    subs.forEach(function (it) { if (it !== except) setSub(it, false); });
  }
  function setNav(on) {
    if (!toggle || !nav) return;
    nav.classList.toggle('open', on);
    toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
    var lab = toggle.querySelector('.nt-label');
    if (lab) lab.textContent = on ? 'Закрыть' : 'Меню';
    if (!on) closeSubs(null);
  }

  if (toggle) toggle.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });

  subs.forEach(function (it) {
    var b = it.querySelector('.sub-toggle');
    if (b) b.addEventListener('click', function () {
      var on = !it.classList.contains('open');
      closeSubs(it);
      setSub(it, on);
    });
    /* клавиатура: если фокус ушёл из пункта, подраздел закрывается */
    it.addEventListener('focusout', function (e) {
      var to = e.relatedTarget;
      if (to && !it.contains(to)) setSub(it, false);
    });
  });

  d.addEventListener('click', function (e) {
    if (!header.contains(e.target)) { closeSubs(null); if (nav && nav.classList.contains('open') && toggle && getComputedStyle(toggle).display !== 'none') setNav(false); }
  });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openSub = subs.filter(function (it) { return it.classList.contains('open'); })[0];
    if (openSub) { setSub(openSub, false); var b = openSub.querySelector('.sub-toggle'); if (b) b.focus(); return; }
    if (nav && nav.classList.contains('open')) { setNav(false); if (toggle) toggle.focus(); }
  });
  /* переход на карту курса по ссылке с якорем (#/lesson/…) закрывает меню */
  window.addEventListener('hashchange', function () { setNav(false); });
})();
