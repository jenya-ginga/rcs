#!/usr/bin/env node
/* Генератор каркаса сайта: шапка с меню, хлебные крошки, подвал, главная и текстовые страницы.

   Страницы собираются из заготовок build/pages/*.html. Страница тренажёра (shkola/nachalnaya/4-klass/index.html)
   пишется вручную; генератор заменяет в ней только три помеченных участка:
     <!--site:head-->…<!--/site:head-->      общая часть <head> (метатеги, шрифты, стили)
     <!--site:header-->…<!--/site:header-->  шапка с меню и хлебные крошки
     <!--site:footer-->…<!--/site:footer-->  подвал
   Остальные файлы (css, js, fonts) не трогаются.

   Запуск:  node build/build-site.js            записать страницы в папку сайта
            node build/build-site.js --check    ничего не писать; код 1, если страницы устарели
   Запускать после каждого нового урока: на главной и в «О нас» указано, сколько уроков открыто.

   Для копии под российский хостинг (tools/build-ru.js) используется generate({ mode: 'ru' }). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(__dirname, 'pages');

const SITE = {
  domain: 'rcschool.online',
  origin: 'https://rcschool.online',
  brand: 'rcschool',
  owner: 'Мерегини Евгения Романовна',
  ownerShort: 'Мерегини Е. Р.',
  email: 'evmeregini@gmail.com',
  year: 2026,
};

const TRAINER = 'shkola/nachalnaya/4-klass/';
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%93%92%3C/text%3E%3C/svg%3E";

/* ступени и классы; ссылка есть только у тех классов, для которых уже есть страница */
const STAGES = [
  { id: 'nachalnaya', title: 'Начальная школа', range: '1–4 классы', path: 'shkola/nachalnaya/', classes: [1, 2, 3, 4], note: 'Сейчас доступен 4 класс — арифметика.' },
  { id: 'srednyaya', title: 'Средняя школа', range: '5–9 классы', path: 'shkola/srednyaya/', classes: [5, 6, 7, 8, 9], note: 'Раздел в подготовке.', soon: true },
  { id: 'starshaya', title: 'Старшая школа', range: '10–11 классы', path: 'shkola/starshaya/', classes: [10, 11], note: 'Раздел в подготовке.', soon: true },
];
const CLASS_PATH = { 4: TRAINER };

/* страницы; index:false — страница-заглушка, закрыта от индексации и не входит в sitemap */
const PAGES = [
  { id: 'home', path: '', crumb: 'Главная', partial: 'home.html', index: true, main: 'page home',
    title: 'Арифметика онлайн: тренажёр для 4 класса — rcschool.online',
    desc: 'Онлайн-тренажёр по арифметике для 4 класса по методике Русской классической школы: теория, устный счёт, примеры и задачи, новые числа в каждом задании, подсказки и оценка.' },
  { id: 'shkola', path: 'shkola/', parent: 'home', crumb: 'Школа', partial: 'shkola.html', index: true, main: 'page',
    title: 'Школа — rcschool.online',
    desc: 'Дополнительные тренажёры по школьной программе: начальная, средняя и старшая школа. Сейчас открыт 4 класс.' },
  { id: 'nachalnaya', path: 'shkola/nachalnaya/', parent: 'shkola', crumb: 'Начальная школа', partial: 'nachalnaya.html', index: true, main: 'page',
    title: 'Начальная школа, 1–4 классы — rcschool.online',
    desc: 'Тренажёры для начальной школы. Сейчас доступна арифметика для 4 класса.' },
  { id: 'trainer', path: TRAINER, parent: 'nachalnaya', crumb: '4 класс', trainer: true, index: true,
    title: 'Арифметика, 4 класс — онлайн-тренажёр — rcschool.online',
    desc: 'Тренажёр по арифметике для 4 класса: в каждом уроке теория, устный счёт, примеры и задачи. Числа каждый раз новые, есть подсказки и оценка.' },
  { id: 'srednyaya', path: 'shkola/srednyaya/', parent: 'shkola', crumb: 'Средняя школа', partial: 'srednyaya.html', index: false, main: 'page',
    title: 'Средняя школа, 5–9 классы — rcschool.online', desc: 'Раздел в подготовке.' },
  { id: 'starshaya', path: 'shkola/starshaya/', parent: 'shkola', crumb: 'Старшая школа', partial: 'starshaya.html', index: false, main: 'page',
    title: 'Старшая школа, 10–11 классы — rcschool.online', desc: 'Раздел в подготовке.' },
  { id: 'dop', path: 'dop-materialy/', parent: 'home', crumb: 'Дополнительные материалы', partial: 'dop-materialy.html', index: false, main: 'page',
    title: 'Дополнительные материалы — rcschool.online', desc: 'Раздел в подготовке.' },
  { id: 'blog', path: 'blog/', parent: 'home', crumb: 'Блог', partial: 'blog.html', index: false, main: 'page',
    title: 'Блог — rcschool.online', desc: 'Раздел в подготовке.' },
  { id: 'o-nas', path: 'o-nas/', parent: 'home', crumb: 'О нас', partial: 'o-nas.html', index: true, main: 'page', ld: 'about',
    title: 'О нас — история проекта — rcschool.online',
    desc: 'Как появился тренажёр: мама хотела, чтобы дочь училась по Русской классической школе онлайн, и сделала для этого свою платформу.' },
  { id: 'metod', path: 'metodologiya/', parent: 'home', crumb: 'Методология', partial: 'metodologiya.html', index: true, main: 'page',
    title: 'Методология — на чём основан курс — rcschool.online',
    desc: 'Автор проекта, источники методики, что написано заново, как устроены уроки и оценки. Информация об авторских правах на материалы сайта.' },
  { id: 'privacy', path: 'privacy/', parent: 'home', crumb: 'Политика конфиденциальности', partial: 'privacy.html', index: true, main: 'page',
    title: 'Политика конфиденциальности — rcschool.online',
    desc: 'Политика конфиденциальности сайта rcschool.online: какие данные обрабатываются, что хранится в браузере, как работает Яндекс.Метрика и как связаться с владельцем сайта.' },
  { id: '404', file: '404.html', root404: true, crumb: 'Страница не найдена', partial: '404.html', index: false, main: 'page', noCrumbs: true,
    title: 'Страница не найдена — rcschool.online', desc: 'Такой страницы нет.' },
];
const byId = Object.fromEntries(PAGES.map(p => [p.id, p]));

/* верхнее меню: id совпадает с id страницы */
const MENU = [
  { id: 'shkola', label: 'Школа', sub: true },
  { id: 'dop', label: 'Доп. материалы' },
  { id: 'blog', label: 'Блог' },
  { id: 'o-nas', label: 'О нас' },
  { id: 'metod', label: 'Методология' },
];

/* ---------------------------------------------------------------- вспомогательное */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const depthOf = p => p.path ? p.path.split('/').filter(Boolean).length : 0;
const prefixOf = p => p.root404 ? '/' : '../'.repeat(depthOf(p));
const homeOf = p => p.root404 ? '/' : (prefixOf(p) || './');
const chainOf = p => { const c = []; for (let q = p; q; q = q.parent && byId[q.parent]) c.unshift(q); return c; };

function loadCounts() {
  const f = path.join(ROOT, TRAINER, 'index.html');
  const html = fs.readFileSync(f, 'utf8');
  const names = [...html.matchAll(/<script src="(?:\.\.\/)*js\/([\w-]+)\.js"><\/script>/g)].map(m => m[1]).filter(s => s !== 'app' && s !== 'consent');
  const ctx = { console, Math, JSON, Object, Array, String, Number, Date, RegExp, Error, parseInt, parseFloat, isFinite, isNaN, Set, Map };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.document = { createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {} }), getElementById: () => null };
  vm.createContext(ctx);
  names.forEach(s => vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', s + '.js'), 'utf8'), ctx, { filename: s + '.js' }));
  const R = ctx.RKS;
  return { ready: Object.keys(R.LESSONS).length, total: R.TOTAL };
}

/* ---------------------------------------------------------------- блоки страницы */
function chipsHtml(stage, r) {
  return '<ul class="chips">' + stage.classes.map(n => CLASS_PATH[n]
    ? '<li><a class="chip" href="' + r + CLASS_PATH[n] + '">' + n + ' класс</a></li>'
    : '<li><span class="chip soon">' + n + ' класс<span class="vh"> — скоро</span></span></li>').join('') + '</ul>';
}

function headerHtml(page, mode) {
  const r = prefixOf(page), home = homeOf(page);
  const here = new Set(chainOf(page).map(p => p.id));
  const items = MENU.map(m => {
    const target = byId[m.id];
    const cur = page.id === m.id ? ' aria-current="page"' : '';
    const li = ['nav-item'];
    if (m.sub) li.push('has-sub');
    if (here.has(m.id)) li.push('is-here');
    let h = '        <li class="' + li.join(' ') + '"><a class="nav-link" href="' + r + target.path + '"' + cur + '>' + esc(m.label) + '</a>';
    if (m.sub) {
      h += '<button type="button" class="sub-toggle" aria-expanded="false" aria-controls="sub-' + m.id + '" aria-label="Показать ступени и классы"></button>\n';
      h += '          <div class="subnav" id="sub-' + m.id + '">\n';
      STAGES.forEach(s => {
        h += '            <div class="stage"><a class="stage-t" href="' + r + s.path + '">' + esc(s.title) + '</a>' + chipsHtml(s, r) + '</div>\n';
      });
      h += '            <a class="sub-all" href="' + r + target.path + '">Вся школа →</a>\n          </div>\n        ';
    }
    return h + '</li>';
  }).join('\n');

  let crumbs = '';
  const chain = chainOf(page);
  if (chain.length > 1 && !page.noCrumbs) {
    crumbs = '\n<nav class="crumbs" aria-label="Вы здесь"><ol>' + chain.map((p, i) =>
      i === chain.length - 1 ? '<li><span aria-current="page">' + esc(p.crumb) + '</span></li>'
        : '<li><a href="' + (prefixOf(page) + p.path || home) + '">' + esc(p.crumb) + '</a></li>').join('') + '</ol></nav>';
  }
  return '<a class="skip" href="#' + (page.trainer ? 'app' : 'content') + '">К содержимому</a>\n' +
    '<header class="site-header">\n  <div class="sh-in">\n' +
    '    <a class="brand" href="' + home + '" aria-label="' + SITE.domain + ' — на главную"><span class="brand-name">' + SITE.brand + '</span><span class="brand-dom">.online</span></a>\n' +
    '    <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav"><span class="nt-bars" aria-hidden="true"></span><span class="nt-label">Меню</span></button>\n' +
    '    <nav class="site-nav" id="site-nav" aria-label="Основное меню">\n      <ul class="nav-list">\n' + items + '\n      </ul>\n    </nav>\n  </div>\n</header>' + crumbs;
}

function footerHtml(page) {
  const r = prefixOf(page), home = homeOf(page);
  const link = (id, label) => '<li><a href="' + r + byId[id].path + '">' + esc(label || byId[id].crumb) + '</a></li>';
  return '<footer class="site-footer">\n  <div class="sf-in">\n' +
    '    <div class="sf-col">\n      <a class="brand" href="' + home + '"><span class="brand-name">' + SITE.brand + '</span><span class="brand-dom">.online</span></a>\n' +
    '      <p>Дополнительные тренажёры к школьной программе. Курс построен по методике Русской классической школы.</p>\n' +
    '      <p class="sf-small">Независимый проект, не является официальным ресурсом школы.</p>\n    </div>\n' +
    '    <nav class="sf-col" aria-label="Школа">\n      <h2>Школа</h2>\n      <ul>' +
    STAGES.map(s => '<li><a href="' + r + s.path + '">' + esc(s.title) + '</a></li>').join('') +
    '<li><a href="' + r + TRAINER + '">Арифметика, 4 класс</a></li></ul>\n    </nav>\n' +
    '    <nav class="sf-col" aria-label="О проекте">\n      <h2>Проект</h2>\n      <ul>' +
    [link('o-nas'), link('metod'), link('dop', 'Доп. материалы'), link('blog')].join('') + '</ul>\n    </nav>\n' +
    '    <div class="sf-col">\n      <h2>Контакты</h2>\n      <p>' + esc(SITE.owner) + '<br><a href="mailto:' + SITE.email + '">' + SITE.email + '</a></p>\n' +
    '      <ul>' + link('privacy', 'Политика конфиденциальности') + '<li><button type="button" class="linklike" data-cookie-settings>Настройки cookie</button></li></ul>\n    </div>\n  </div>\n' +
    '  <p class="sf-copy">© ' + SITE.year + ' ' + esc(SITE.ownerShort) + ' Материалы сайта — авторская работа, подробнее на странице «<a href="' + r + byId.metod.path + '">Методология</a>».</p>\n' +
    '</footer>\n<script src="' + r + 'js/site.js" defer></script>';
}

function ldBlocks(page, mode) {
  if (mode !== 'web') return '';
  const out = [], chain = chainOf(page);
  if (page.id === 'home') out.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.domain, url: SITE.origin + '/', inLanguage: 'ru' });
  if (page.ld === 'about') out.push({ '@context': 'https://schema.org', '@type': 'AboutPage', name: 'О нас', url: SITE.origin + '/' + page.path, inLanguage: 'ru', author: { '@type': 'Person', name: SITE.owner } });
  if (chain.length > 1 && !page.noCrumbs) out.push({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: chain.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.crumb, item: SITE.origin + '/' + p.path })),
  });
  return out.map(o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>').join('\n');
}

function headHtml(page, mode) {
  const r = prefixOf(page);
  const abs = SITE.origin + '/' + (page.path || '');
  const L = ['<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    '<title>' + esc(page.title) + '</title>',
    '<meta name="description" content="' + esc(page.desc) + '">'];
  if (!page.index) L.push('<meta name="robots" content="noindex, follow">');
  if (mode === 'web' && page.index) L.push('<link rel="canonical" href="' + abs + '">');
  L.push('<meta property="og:type" content="website">', '<meta property="og:locale" content="ru_RU">',
    '<meta property="og:site_name" content="' + SITE.domain + '">',
    '<meta property="og:title" content="' + esc(page.title) + '">',
    '<meta property="og:description" content="' + esc(page.desc) + '">');
  if (mode === 'web' && page.index) L.push('<meta property="og:url" content="' + abs + '">');
  L.push('<link rel="icon" href="' + FAVICON + '">',
    '<script>document.documentElement.className+=\' js\'</script>',
    '<link rel="preload" href="' + r + 'fonts/pt-serif-cyrillic-400-normal.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="stylesheet" href="' + r + 'css/fonts.css">',
    '<link rel="stylesheet" href="' + r + 'css/style.css">',
    '<link rel="stylesheet" href="' + r + 'css/site.css">');
  const ld = ldBlocks(page, mode);
  if (ld) L.push(ld);
  return L.join('\n');
}

/* ---------------------------------------------------------------- заготовки страниц */
function fill(tpl, page, ctx) {
  const r = prefixOf(page);
  const stageCards = () => '<ul class="cards">' + STAGES.map(s =>
    '<li class="card' + (s.soon ? ' is-soon' : '') + '"><h3><a href="' + r + s.path + '">' + esc(s.title) + '</a>' + (s.soon ? ' <span class="badge">скоро</span>' : '') + '</h3>' +
    '<p>' + esc(s.range) + '. ' + esc(s.note) + '</p>' + chipsHtml(s, r) + '</li>').join('') + '</ul>';
  const classCards = id => {
    const s = STAGES.find(x => x.id === id);
    return '<ul class="cards">' + s.classes.map(n => CLASS_PATH[n]
      ? '<li class="card"><span class="card-n">' + n + '</span><h3><a href="' + r + CLASS_PATH[n] + '">' + n + ' класс — арифметика</a></h3>' +
        '<p>Курс из ' + ctx.total + ' уроков, открыто ' + ctx.ready + '. Теория, устный счёт, примеры и задачи.</p>' +
        '<div class="btns"><a class="btn primary" href="' + r + CLASS_PATH[n] + '">Открыть тренажёр</a></div></li>'
      : '<li class="card is-soon"><span class="card-n">' + n + '</span><h3>' + n + ' класс <span class="badge">скоро</span></h3><p>Раздел в подготовке.</p></li>').join('') + '</ul>';
  };
  const hostLi = ctx.mode === 'ru'
    ? '        <li><b>Хостинг-провайдер</b> — российская организация, на серверах которой размещены файлы Сайта;</li>'
    : '        <li><b>Vercel Inc.</b> — платформа, на которой размещены файлы Сайта;</li>';
  const simple = { ROOT: r, HOME: homeOf(page), ready: ctx.ready, total: ctx.total, email: SITE.email, HOST_LI: hostLi, STAGE_CARDS: null };
  let out = tpl.replace(/\{\{CLASS_CARDS:(\w+)\}\}/g, (_, id) => classCards(id));
  out = out.replace(/\{\{STAGE_CARDS\}\}/g, stageCards);
  out = out.replace(/\{\{(\w+)\}\}/g, (m, k) => { if (!(k in simple) || simple[k] === null) throw new Error('неизвестная подстановка ' + m + ' в ' + page.partial); return simple[k]; });
  return out;
}

function pageHtml(page, mode, ctx) {
  const tpl = fs.readFileSync(path.join(PAGES_DIR, page.partial), 'utf8').replace(/\s+$/, '');
  const body = fill(tpl, page, Object.assign({ mode }, ctx));
  return '<!doctype html>\n<html lang="ru">\n<head>\n' + headHtml(page, mode) + '\n</head>\n<body>\n' +
    headerHtml(page, mode) + '\n<main class="' + page.main + '" id="content">\n' + body.replace(/^/gm, '  ').replace(/^ +$/gm, '') + '\n</main>\n' +
    footerHtml(page) + '\n<script src="' + prefixOf(page) + 'js/consent.js"></script>\n</body>\n</html>\n';
}

/* страница тренажёра: заменить помеченные участки */
function trainerHtml(mode) {
  const page = byId.trainer;
  const f = path.join(ROOT, TRAINER, 'index.html');
  let html = fs.readFileSync(f, 'utf8');
  const regions = { head: headHtml(page, mode), header: headerHtml(page, mode), footer: footerHtml(page) };
  Object.keys(regions).forEach(k => {
    const re = new RegExp('(<!--site:' + k + '-->)[\\s\\S]*?(<!--/site:' + k + '-->)');
    if (!re.test(html)) throw new Error('в ' + TRAINER + 'index.html нет участка <!--site:' + k + '-->');
    html = html.replace(re, (_, a, b) => a + '\n' + regions[k] + '\n' + b);
  });
  return html;
}

function sitemap() {
  const urls = PAGES.filter(p => p.index).map(p => '  <url><loc>' + SITE.origin + '/' + p.path + '</loc></url>');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('\n') + '\n</urlset>\n';
}

/* ---------------------------------------------------------------- сборка */
/* mode 'web' — для Vercel (канонические адреса, JSON-LD, sitemap); 'ru' — для копии на российском хостинге.
   Возвращает { 'путь/файла': текст } для всех страниц, которые создаёт генератор. */
function generate(opts) {
  const mode = (opts && opts.mode) || 'web';
  const ctx = loadCounts();
  const files = {};
  PAGES.forEach(p => {
    if (p.trainer) { files[TRAINER + 'index.html'] = trainerHtml(mode); return; }
    if (p.root404 && mode !== 'web') return;
    files[p.file || (p.path + 'index.html')] = pageHtml(p, mode, ctx);
  });
  if (mode === 'web') {
    files['sitemap.xml'] = sitemap();
    files['robots.txt'] = 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE.origin + '/sitemap.xml\n';
  }
  return files;
}

module.exports = { generate, SITE, PAGES, TRAINER, ROOT };

if (require.main === module) {
  const check = process.argv.includes('--check');
  const files = generate({ mode: 'web' });
  let changed = 0;
  Object.keys(files).sort().forEach(rel => {
    const p = path.join(ROOT, rel);
    const old = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    if (old === files[rel]) return;
    changed++;
    console.log((check ? 'устарел: ' : 'записан: ') + rel);
    if (!check) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, files[rel]); }
  });
  console.log(changed ? (check ? 'Есть устаревшие страницы: ' + changed : 'Записано файлов: ' + changed) : 'Все страницы актуальны (' + Object.keys(files).length + ')');
  if (check && changed) process.exit(1);
}
