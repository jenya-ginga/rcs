/* Согласие на cookie и загрузка Яндекс.Метрики.
   Метрика подключается только после нажатия «Принять». Выбор хранится в localStorage. */
(function () {
  'use strict';
  var ID = 113133874, KEY = 'rks4_cookie_v1';
  var me = document.currentScript;
  var policyUrl = me && me.src ? new URL('../privacy/', me.src).href : '/privacy/';
  var banner = null;

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function loadMetrika() {
    if (window.__ymLoaded) return;
    window.__ymLoaded = true;
    window['disableYaCounter' + ID] = false;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + ID, 'ym');
    window.ym(ID, 'init', { ssr: true, webvisor: true, clickmap: true, ecommerce: 'dataLayer', referrer: document.referrer, url: location.href, accurateTrackBounce: true, trackLinks: true, trackHash: true });
  }

  function dropCookies() {
    window['disableYaCounter' + ID] = true;
    var host = location.hostname.split('.'), doms = [''];
    for (var i = 0; i < host.length - 1; i++) doms.push('; domain=.' + host.slice(i).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (/^(_ym|_ga|yandexuid|ymex|yabs-sid|i$|yuidss)/.test(n)) {
        doms.forEach(function (d) { document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d; });
      }
    });
  }

  function hide() { if (banner && banner.parentNode) banner.parentNode.removeChild(banner); banner = null; }

  function choose(v) {
    set(v); hide();
    if (v === 'yes') loadMetrika(); else dropCookies();
  }

  function show() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'cookie';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Использование cookie');
    banner.innerHTML =
      '<p>Сайт использует cookie и счётчик Яндекс.Метрики, чтобы считать посещения и улучшать уроки. ' +
      'Оценки хранятся только в вашем браузере. <a href="' + policyUrl + '">Политика конфиденциальности</a></p>' +
      '<div class="cookie-btns"><button type="button" class="btn primary" data-v="yes">Принять</button>' +
      '<button type="button" class="btn ghost" data-v="no">Отказаться</button></div>';
    banner.addEventListener('click', function (e) {
      var v = e.target && e.target.getAttribute && e.target.getAttribute('data-v');
      if (v) choose(v);
    });
    document.body.appendChild(banner);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== document) {
      if (t.hasAttribute && t.hasAttribute('data-cookie-settings')) { show(); return; }
      t = t.parentNode;
    }
  });

  var saved = get();
  if (saved === 'yes') loadMetrika();
  else if (saved !== 'no') show();
})();
