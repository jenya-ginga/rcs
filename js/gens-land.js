/* Блок «Земельные и квадратные меры. Задачи с именованными числами», уроки 92–100.
   Меры площади: ар, гектар, км², м², дм², см², мм² (каждая следующая в 100 раз мельче); площади участков, урожай, посев,
   составные величины (3 га 25 а), задачи на все действия с именованными числами. Префикс имён — ld / pld / R.ld….
   Все числа строятся от ответа обратным ходом, деление всегда нацело. */
(function (G) {
  'use strict';
  var R = G.RKS;
  var rand = R.rand, pick = R.pick, shuffle = R.shuffle, fmt = R.fmt, NB = R.NB;
  var gens = R.gens;
  var MINE = [];
  function reg(name, fn) {
    if (gens[name]) throw new Error('дубль ' + name);
    gens[name] = fn; MINE.push(name);
  }

  /* ================= лестница мер площади ================= */
  var AU = ['км²', 'га', 'а', 'м²', 'дм²', 'см²', 'мм²'];              /* от крупной к мелкой, шаг всегда ×100 */
  var AIDX = {};
  AU.forEach(function (u, i) { AIDX[u] = i; });
  function ratio(big, small) { return Math.pow(100, AIDX[small] - AIDX[big]); }

  var UF = {                                                            /* формы: 1, 2–4, 5+ */
    'км²': ['квадратный километр', 'квадратных километра', 'квадратных километров'],
    'га': ['гектар', 'гектара', 'гектаров'],
    'а': ['ар', 'ара', 'аров'],
    'м²': ['квадратный метр', 'квадратных метра', 'квадратных метров'],
    'дм²': ['квадратный дециметр', 'квадратных дециметра', 'квадратных дециметров'],
    'см²': ['квадратный сантиметр', 'квадратных сантиметра', 'квадратных сантиметров'],
    'мм²': ['квадратный миллиметр', 'квадратных миллиметра', 'квадратных миллиметров']
  };
  var ULOC = { 'км²': 'квадратном километре', 'га': 'гектаре', 'а': 'аре', 'м²': 'квадратном метре', 'дм²': 'квадратном дециметре', 'см²': 'квадратном сантиметре', 'мм²': 'квадратном миллиметре' };
  var UACC = { 'км²': 'квадратных километров', 'га': 'гектаров', 'а': 'аров', 'м²': 'квадратных метров', 'дм²': 'квадратных дециметров', 'см²': 'квадратных сантиметров', 'мм²': 'квадратных миллиметров' };
  var ULOCP = { 'км²': 'квадратных километрах', 'га': 'гектарах', 'а': 'арах', 'м²': 'квадратных метрах', 'дм²': 'квадратных дециметрах', 'см²': 'квадратных сантиметрах', 'мм²': 'квадратных миллиметрах' };
  var SQOF = { 'км': 'км²', 'м': 'м²', 'дм': 'дм²', 'см': 'см²', 'мм': 'мм²' };      /* единица длины → единица площади */
  var LOCP = { 'км': 'километрах', 'м': 'метрах', 'дм': 'дециметрах', 'см': 'сантиметрах', 'мм': 'миллиметрах', 'т': 'тоннах', 'ц': 'центнерах', 'кг': 'килограммах', 'г': 'граммах', 'руб.': 'рублях', 'коп.': 'копейках' };

  /* ================= пары мер (крупная и мелкая) ================= */
  var PAIRS = {
    'км²-га': { big: 'км²', small: 'га', f: 100, kind: 'area' },
    'га-а': { big: 'га', small: 'а', f: 100, kind: 'area' },
    'а-м²': { big: 'а', small: 'м²', f: 100, kind: 'area' },
    'га-м²': { big: 'га', small: 'м²', f: 10000, kind: 'area' },
    'м²-дм²': { big: 'м²', small: 'дм²', f: 100, kind: 'area' },
    'дм²-см²': { big: 'дм²', small: 'см²', f: 100, kind: 'area' },
    'км-м': { big: 'км', small: 'м', f: 1000, kind: 'len' },
    'м-см': { big: 'м', small: 'см', f: 100, kind: 'len' },
    'м-дм': { big: 'м', small: 'дм', f: 10, kind: 'len' },
    'т-кг': { big: 'т', small: 'кг', f: 1000, kind: 'wt' },
    'ц-кг': { big: 'ц', small: 'кг', f: 100, kind: 'wt' },
    'кг-г': { big: 'кг', small: 'г', f: 1000, kind: 'wt' },
    'руб-коп': { big: 'руб.', small: 'коп.', f: 100, kind: 'money' }
  };
  Object.keys(PAIRS).forEach(function (k) {
    var P = PAIRS[k]; P.key = k;
    P.fact = '1 ' + P.big + ' = ' + fmt(P.f) + ' ' + P.small;
  });

  /* ================= запись величин ================= */
  function nu(n, u) { return fmt(n) + NB + u; }                                   /* «250 м» */
  function nm(P, b, s) { return nu(b, P.big) + ' ' + nu(s, P.small); }          /* «3 га 25 а» */
  function nf(P, t) {                                                             /* нормальная запись по числу мелких единиц */
    var b = Math.floor(t / P.f), s = t % P.f;
    if (b === 0) return nu(s, P.small);
    if (s === 0) return nu(b, P.big);
    return nm(P, b, s);
  }
  function splitT(P, t) { return [Math.floor(t / P.f), t % P.f]; }
  function fieldsOf(P) { return [{ label: P.big }, { label: P.small }]; }
  function expr(s) { return '<span class="expr lde">' + s + '</span>'; }
  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function bold(s) { return '<b>' + s + '</b>'; }
  function stepsL(list, ans) {
    return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>') + (ans != null ? '<br>Ответ: ' + ans + '.' : '');
  }
  function plur(n, a, b, c) { return R.plural(n, [a, b, c]); }
  function uw(n, u) { return fmt(n) + NB + R.plural(n, UF[u]); }                 /* «5 гектаров» */
  function zeros(z) { return R.words(z) + ' ' + plur(z, 'ноль', 'нуля', 'нулей'); }
  function zerosCnt(F) { return String(F).length - 1; }
  function ansU(n, u) { return bold(nu(n, u)); }

  /* цепочка соотношений: «1 га = 100 а = 10 000 м²» */
  function factChain(big, small) {
    var i = AIDX[big], j = AIDX[small], s = '1 ' + big, k;
    for (k = i + 1; k <= j; k++) s += ' = ' + fmt(ratio(big, AU[k])) + ' ' + AU[k];
    return s;
  }

  /* длина в метрах словами: 1 800 м → «1 км 800 м», 250 → «250 м» */
  function lenTxt(m) {
    if (m >= 1000 && m % 1000 === 0) return nu(m / 1000, 'км');
    if (m > 1000 && m % 100 === 0) return nu(Math.floor(m / 1000), 'км') + ' ' + nu(m % 1000, 'м');
    return nu(m, 'м');
  }
  /* площадь в м² → «3 га 25 а 40 м²» (нулевые части пропускаем) */
  function areaTxt(S) {
    var ga = Math.floor(S / 10000), a = Math.floor((S % 10000) / 100), m = S % 100, p = [];
    if (ga) p.push(nu(ga, 'га'));
    if (a) p.push(nu(a, 'а'));
    if (m || !p.length) p.push(nu(m, 'м²'));
    return p.join(' ');
  }
  R.ldAreaTxt = areaTxt;
  R.ldFactChain = factChain;

  /* ================= рисунки ================= */
  /* прямоугольник с подписями сторон; o.nx, o.ny — сетка; o.center — надпись внутри; o.hl — число закрашенных клеток слева-сверху */
  function plotSVG(lw, lh, wv, hv, o) {
    o = o || {};
    var W = 340, H = 176, aw = 196, ah = 108, lim = (o.nx && o.ny) ? 8 : 3, ratio_ = Math.max(1 / lim, Math.min(lim, wv / hv)), rw, rh;
    if (ratio_ >= aw / ah) { rw = aw; rh = aw / ratio_; } else { rh = ah; rw = ah * ratio_; }
    var x0 = Math.round((W - rw) / 2 - 20), y0 = (H - rh) / 2 + 4, s = '', i;
    if (o.nx && o.ny && o.nx * o.ny <= 400 && Math.max(o.nx, o.ny) <= 40) {
      for (i = 1; i < o.nx; i++) s += '<path class="gl" d="M' + (x0 + rw * i / o.nx).toFixed(1) + ' ' + y0.toFixed(1) + 'v' + rh.toFixed(1) + '"/>';
      for (i = 1; i < o.ny; i++) s += '<path class="gl" d="M' + x0.toFixed(1) + ' ' + (y0 + rh * i / o.ny).toFixed(1) + 'h' + rw.toFixed(1) + '"/>';
    }
    return '<svg class="fig ldplot" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="' + (o.label || 'Прямоугольный участок') + '">' +
      '<rect class="r" x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + rw.toFixed(1) + '" height="' + rh.toFixed(1) + '"/>' + s +
      '<rect class="rr" x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + rw.toFixed(1) + '" height="' + rh.toFixed(1) + '"/>' +
      '<path class="ra" d="M' + (x0 + 11) + ' ' + y0.toFixed(1) + 'v11h-11"/>' +
      '<text x="' + (x0 + rw / 2).toFixed(1) + '" y="' + (y0 - 9).toFixed(1) + '" text-anchor="middle">' + lw + '</text>' +
      '<text x="' + (x0 + rw + 9).toFixed(1) + '" y="' + (y0 + rh / 2 + 5).toFixed(1) + '" text-anchor="start">' + lh + '</text>' +
      (o.center ? '<text class="ldc" x="' + (x0 + rw / 2).toFixed(1) + '" y="' + (y0 + rh / 2 + 6).toFixed(1) + '" text-anchor="middle">' + o.center + '</text>' : '') +
      '</svg>';
  }
  R.ldPlotSVG = plotSVG;

  /* сетка n×n клеток; закрашена клетка (hx, hy); подписи сторон */
  function gridSVG(n, cell, x0, y0, hl, cls) {
    var s = '<rect class="bg" x="' + x0 + '" y="' + y0 + '" width="' + (n * cell) + '" height="' + (n * cell) + '"/>', i, sz = n * cell;
    if (hl) s += '<rect class="hl" x="' + (x0 + hl[0] * cell) + '" y="' + (y0 + hl[1] * cell) + '" width="' + cell + '" height="' + cell + '"/>';
    for (i = 1; i < n; i++) {
      s += '<path class="gl" d="M' + (x0 + i * cell) + ' ' + y0 + 'v' + sz + '"/><path class="gl" d="M' + x0 + ' ' + (y0 + i * cell) + 'h' + sz + '"/>';
    }
    return s + '<rect class="' + (cls || 'r nf') + '" x="' + x0 + '" y="' + y0 + '" width="' + sz + '" height="' + sz + '"/>';
  }
  /* ар: квадрат 10 м × 10 м из 100 клеток по 1 м² */
  R.ldSvgAr = function () {
    return '<svg class="fig ldsq" viewBox="0 0 250 216" width="250" role="img" aria-label="Ар: квадрат со стороной 10 метров, 100 квадратных метров">' +
      gridSVG(10, 15, 40, 26, [0, 0]) +
      '<text x="115" y="16" text-anchor="middle">10 м</text><text x="198" y="105" text-anchor="start">10 м</text>' +
      '<text x="115" y="204" text-anchor="middle" class="ldcap">1 а = 100 м²</text></svg>';
  };
  /* гектар: квадрат 100 м × 100 м из 100 аров */
  R.ldSvgHa = function () {
    return '<svg class="fig ldsq" viewBox="0 0 250 216" width="250" role="img" aria-label="Гектар: квадрат со стороной 100 метров, 100 аров">' +
      gridSVG(10, 15, 40, 26, [0, 0]) +
      '<text x="115" y="16" text-anchor="middle">100 м</text><text x="198" y="105" text-anchor="start">100 м</text>' +
      '<text x="115" y="204" text-anchor="middle" class="ldcap">1 га = 100 а</text></svg>';
  };
  R.ldFigAreHa = function () {
    return '<div class="figrow"><figure>' + R.ldSvgAr() + '<figcaption>Ар: одна клетка — 1 м²</figcaption></figure>' +
      '<figure>' + R.ldSvgHa() + '<figcaption>Гектар: одна клетка — 1 ар</figcaption></figure></div>';
  };
  /* квадратный метр из 100 дм² и один дм² из 100 см² */
  R.ldFigSqM = function () {
    var a = '<svg class="fig ldsq" viewBox="0 0 250 216" width="250" role="img" aria-label="Квадратный метр состоит из ста квадратных дециметров">' +
      gridSVG(10, 15, 40, 26, [0, 0]) +
      '<text x="115" y="16" text-anchor="middle">1 м = 10 дм</text><text x="198" y="105" text-anchor="start">1 м</text>' +
      '<text x="115" y="204" text-anchor="middle" class="ldcap">1 м² = 100 дм²</text></svg>';
    var b = '<svg class="fig ldsq" viewBox="0 0 250 216" width="250" role="img" aria-label="Квадратный дециметр состоит из ста квадратных сантиметров">' +
      gridSVG(10, 15, 40, 26, [0, 0]) +
      '<text x="115" y="16" text-anchor="middle">1 дм = 10 см</text><text x="198" y="105" text-anchor="start">1 дм</text>' +
      '<text x="115" y="204" text-anchor="middle" class="ldcap">1 дм² = 100 см²</text></svg>';
    return '<div class="figrow"><figure>' + a + '<figcaption>Одна клетка — 1 дм²</figcaption></figure><figure>' + b + '<figcaption>Одна клетка — 1 см²</figcaption></figure></div>';
  };
  /* лестница мер: км² → га → а → м² → дм² → см² → мм²; o.from/o.to — подсветить */
  R.ldLadder = function (o) {
    o = o || {};
    var us = o.units || AU, h = '<div class="ldlad" role="img" aria-label="Каждая мера площади в 100 раз мельче предыдущей: ' + us.join(', ') + '">';
    us.forEach(function (u, i) {
      if (i) h += '<span class="ldx" aria-hidden="true"><i>×100</i><s>→</s></span>';
      h += '<span class="ldu' + (u === o.hl || (o.hl2 && u === o.hl2) ? ' hl' : '') + '">' + u + '</span>';
    });
    return h + '</div>';
  };
  R.ldMeasureTable = function () {
    return '<table class="mt ldmt"><tr><th>величина</th><th>крупная мера</th><th>сколько мелких</th></tr>' +
      '<tr><td>длина</td><td>1 км</td><td>1 000 м</td></tr>' +
      '<tr><td></td><td>1 м</td><td>100 см (и 10 дм)</td></tr>' +
      '<tr><td>масса</td><td>1 т</td><td>1 000 кг (и 10 ц)</td></tr>' +
      '<tr><td></td><td>1 ц</td><td>100 кг</td></tr>' +
      '<tr><td></td><td>1 кг</td><td>1 000 г</td></tr>' +
      '<tr><td>деньги</td><td>1 руб.</td><td>100 коп.</td></tr>' +
      '<tr><td>площадь</td><td>1 га</td><td>100 а (и 10 000 м²)</td></tr>' +
      '<tr><td></td><td>1 а</td><td>100 м²</td></tr>' +
      '<tr><td></td><td>1 м²</td><td>100 дм²</td></tr></table>';
  };

  /* ================= уроки 92–94: меры площади ================= */
  var FACT_LAND = [['га', 'а'], ['а', 'м²'], ['га', 'м²']];
  var FACT_SQ = [['м²', 'дм²'], ['дм²', 'см²'], ['см²', 'мм²'], ['км²', 'га'], ['км²', 'м²']];
  var SIDE_T = { 'км²': '1 км (1 000 м)', 'га': '100 м', 'а': '10 м', 'м²': '1 м', 'дм²': '1 дм', 'см²': '1 см', 'мм²': '1 мм' };
  var SIDE_S = { 'км²': '1 км', 'га': '100 м', 'а': '10 м', 'м²': '1 м', 'дм²': '1 дм', 'см²': '1 см', 'мм²': '1 мм' };
  function pairsOf(set) { return set === 'land' ? FACT_LAND : set === 'sq' ? FACT_SQ : FACT_LAND.concat(FACT_SQ); }
  function whyRatio(A, B) {
    var F = ratio(A, B), L = Math.round(Math.sqrt(F));
    return 'Сторона квадрата в 1 ' + A + ' равна ' + SIDE_T[A] + ', а в 1 ' + B + ' — ' + SIDE_T[B] + '. Вдоль стороны большого квадрата помещается ' + fmt(L) + ' маленьких, всего рядов тоже ' + fmt(L) + ': ' + fmt(L) + ' × ' + fmt(L) + ' = ' + fmt(F) + '.';
  }

  /* --- вопросы на знание таблицы (choice) --- */
  reg('ldFact', function (o) {
    o = o || {};
    var set = o.set || 'land', mode = o.mode || pick(['count', 'side', 'sideRev']);
    if (mode === 'count') {
      var pr = pick(o.pairs || pairsOf(set)), A = pr[0], B = pr[1], F = ratio(A, B);
      var cand = [], k, seen = {};
      [Math.round(Math.sqrt(F)), F * 10, 10, 100, 1000, 10000, 100000, 1000000].forEach(function (x) { if (x !== F && x >= 10 && !seen[x]) { seen[x] = 1; cand.push(x); } });
      var wr = [cand[0]].concat(shuffle(cand.slice(1)).slice(0, 2));
      var opts = shuffle([F].concat(wr)).map(fmt);
      return { kind: 'choice', html: 'Сколько ' + UACC[B] + ' в одном ' + ULOC[A] + '?', options: opts, answer: opts.indexOf(fmt(F)), wide: false,
        hint: 'Представь квадрат площадью 1 ' + A + ' и разложи его на маленькие квадраты по 1 ' + B + ': сколько рядов и сколько квадратов в ряду?',
        explain: factChain(A, B) + '. ' + whyRatio(A, B) };
    }
    var list = set === 'land' ? [0, 1, 2, 3] : set === 'sq' ? [2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5];
    var SU = [['10 м', 'а'], ['100 м', 'га'], ['1 м', 'м²'], ['1 км', 'км²'], ['1 дм', 'дм²'], ['1 см', 'см²'], ['1 мм', 'мм²']];
    var it = SU[pick(list)], pool = list.map(function (i) { return SU[i]; });
    if (mode === 'side') {
      var units = shuffle(pool.map(function (x) { return x[1]; }).filter(function (u) { return u !== it[1]; })).slice(0, 3);
      var os = shuffle([it[1]].concat(units)).map(function (u) { return '1 ' + u; });
      return { kind: 'choice', html: 'Квадрат со стороной ' + it[0] + ' имеет площадь, равную…', options: os, answer: os.indexOf('1 ' + it[1]), wide: false,
        hint: 'Единица площади — это квадрат, у которого сторона равна единице длины. Для ара и гектара сторона своя.',
        explain: 'Квадрат со стороной ' + it[0] + ' — это 1 ' + it[1] + '.' + (it[1] === 'а' ? ' Его площадь 10 × 10 = 100 м².' : it[1] === 'га' ? ' Его площадь 100 × 100 = 10 000 м².' : '') };
    }
    var sides = shuffle(pool.map(function (x) { return x[0]; }).filter(function (s) { return s !== it[0]; })).slice(0, 3);
    var oq = shuffle([it[0]].concat(sides));
    return { kind: 'choice', html: '1 ' + it[1] + ' — это площадь квадрата со стороной…', options: oq, answer: oq.indexOf(it[0]), wide: false,
      hint: 'Ар — небольшой участок, гектар — большой. Вспомни, сколько метров в стороне каждого квадрата.',
      explain: '1 ' + it[1] + ' — площадь квадрата со стороной ' + it[0] + '.' };
  });

  /* --- какое равенство верно (choice) --- */
  reg('ldTrue', function (o) {
    o = o || {};
    var pr = pick(o.pairs || pairsOf(o.set || 'all')), A = pr[0], B = pr[1], F = ratio(A, B);
    function st(a, x, b) { return '1 ' + a + ' = ' + fmt(x) + ' ' + b; }
    var L = Math.round(Math.sqrt(F)), right = st(A, F, B), wr = [st(A, L, B), st(A, F * 10, B), st(B, F, A)];
    var opts = shuffle([right].concat(wr));
    var stem = pick(['Какое равенство верно?', 'Найди верную запись.', 'Какая запись верна?']);
    return { kind: 'choice', html: stem + ' <span class="soft">Речь о мерах «' + A + '» и «' + B + '».</span>', options: opts, answer: opts.indexOf(right), wide: true,
      hint: 'Проверь: крупная мера всегда содержит много мелких, а не наоборот. И помни, что площадь — это «длина × ширина».',
      explain: 'Верно: ' + right + '. ' + whyRatio(A, B) + ' Число ' + fmt(L) + ' — это отношение мер длины (сторон), а не площадей.' };
  });

  /* --- какой единицей измерять (choice) --- */
  var UNIT_OBJ = [
    ['страницы тетради', 5], ['почтовой марки', 5], ['экрана смартфона', 5], ['листа бумаги', 5], ['ладони', 5],
    ['пола в классе', 3], ['оконного стекла', 3], ['детской площадки', 3], ['ковра', 3], ['стены комнаты', 3],
    ['дачного участка', 2], ['огорода', 2], ['приусадебного участка', 2],
    ['пшеничного поля', 1], ['лугового пастбища', 1], ['фруктового сада', 1], ['городского парка', 1],
    ['озера', 0], ['области', 0], ['страны', 0], ['лесного заповедника', 0]
  ];
  reg('ldWhichUnit', function (o) {
    o = o || {};
    var it = pick(UNIT_OBJ), ci = it[1], pool = [], i;
    for (i = 0; i < AU.length; i++) if (Math.abs(i - ci) >= 2) pool.push(AU[i]);
    var opts = shuffle([AU[ci]].concat(shuffle(pool).slice(0, 3)));
    var why = { 5: 'Маленькие предметы измеряют в квадратных сантиметрах.', 3: 'Комнаты, окна, площадки измеряют в квадратных метрах.', 2: 'Небольшие участки земли измеряют в арах (в народе — сотках).', 1: 'Большие участки земли — поля, сады, парки — измеряют в гектарах.', 0: 'Очень большие территории измеряют в квадратных километрах.' };
    return { kind: 'choice', html: 'В каких единицах удобнее всего измерять площадь ' + it[0] + '?', options: opts, answer: opts.indexOf(AU[ci]), wide: false,
      hint: 'Сравни размер предмета с размерами единиц: маленькое измеряют маленькими мерами, огромное — огромными.',
      explain: 'Правильный ответ: ' + AU[ci] + '. ' + why[ci] };
  });

  /* --- перевод в мелкие и в крупные меры (простые числа) --- */
  reg('ldConv', function (o) {
    o = o || {};
    var units = (o.units || ['га', 'а', 'м²']).slice().sort(function (x, y) { return AIDX[x] - AIDX[y]; }), pairs = [], i, j;
    for (i = 0; i < units.length; i++) for (j = i + 1; j < units.length; j++) pairs.push([units[i], units[j]]);
    var pr = pick(o.pairs || pairs), big = pr[0], small = pr[1], F = ratio(big, small);
    var dir = o.dir === 'down' || o.dir === 'up' ? o.dir : pick(['down', 'up']);
    var qlo = o.qmin || 2, qhi = o.qmax || 99, q = rand(qlo, qhi);
    if (o.round && Math.random() < 0.7) q = pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90, 100, 200, 250, 500].filter(function (x) { return x >= qlo && x <= qhi; }));
    var z = zerosCnt(F), chain = factChain(big, small);
    if (dir === 'down') {
      var ans = q * F;
      return { kind: 'num', html: 'Раздроби: ' + expr(nu(q, big) + ' = … ' + small), answer: ans,
        hint: 'В одной крупной мере ' + fmt(F) + ' мелких. Крупные меры заменяем мелкими — значит, умножаем.',
        explain: chain + '. Значит, ' + nu(q, big) + ' = ' + fmt(q) + ' × ' + fmt(F) + ' = ' + fmt(ans) + ' ' + small + '. Проще: приписали справа ' + zeros(z) + '. Ответ: ' + ansU(ans, small) + '.' };
    }
    var N = q * F;
    return { kind: 'num', html: 'Преврати: ' + expr(nu(N, small) + ' = … ' + big), answer: q,
      hint: 'Мелкие меры собираем в крупные — значит, делим. Сколько мелких в одной крупной? ' + fmt(F) + '.',
      explain: chain + '. Значит, ' + nu(N, small) + ' = ' + fmt(N) + ' : ' + fmt(F) + ' = ' + fmt(q) + ' ' + big + '. Проще: убрали справа ' + zeros(z) + '. Ответ: ' + ansU(q, big) + '.' };
  });

  /* --- составные величины: 6 965 м² = 69 а 65 м² и 3 га 25 а = 325 а --- */
  function smallPartA(P, zero) {
    var f = P.f;
    if (f === 100) return zero ? rand(1, 9) : (Math.random() < 0.5 ? rand(1, 19) * 5 : rand(1, 99));
    if (f === 10000) return zero ? rand(1, 9) * 100 : rand(1, 99) * 100;
    if (f === 1000) return zero ? rand(1, 9) : (Math.random() < 0.5 ? rand(1, 199) * 5 : rand(1, 999));
    return rand(1, f - 1);
  }
  R.ldSmallPart = smallPartA;
  reg('ldConvComp', function (o) {
    o = o || {};
    var P = PAIRS[pick(o.pairs || ['га-а', 'а-м²', 'км²-га'])], f = P.f, dir = o.dir === 'turn' || o.dir === 'split' ? o.dir : pick(['turn', 'split']);
    var b = rand(o.bmin || 1, o.bmax || 99), zero = !!o.zero, s = smallPartA(P, zero), t = b * f + s;
    if (dir === 'turn') {
      var cut = zerosCnt(f), sTxt = String(s);
      var note = s < f / 10 ? ' В остатке ' + fmt(s) + ' ' + P.small + ' — это меньше ' + fmt(f / 10) + ', поэтому на первом месте после черты стоит нуль: ' + String(b) + '|' + ('0000'.slice(0, cut - sTxt.length) + sTxt) + ', а в ответе пишем просто ' + fmt(s) + '.' : '';
      return { kind: 'nums', html: 'Преврати: ' + expr(nu(t, P.small) + ' = … ' + P.big + ' … ' + P.small), fields: fieldsOf(P), answer: [b, s],
        hint: 'В одной крупной мере ' + fmt(f) + ' мелких. Раздели число на ' + fmt(f) + ': частное — крупные меры, остаток — мелкие.',
        explain: P.fact + '. ' + fmt(t) + ' : ' + fmt(f) + ' = ' + fmt(b) + ' (остаток ' + fmt(s) + '). Другой способ: отделяем справа ' + cut + ' ' + plur(cut, 'цифру', 'цифры', 'цифр') + ': слева крупные меры, справа мелкие.' + note + ' Ответ: ' + bold(nm(P, b, s)) + '.' };
    }
    var expl = nu(b, P.big) + ' = ' + fmt(b) + ' × ' + fmt(f) + ' = ' + fmt(b * f) + ' ' + P.small + '. Прибавим остаток: ' + fmt(b * f) + ' + ' + fmt(s) + ' = ' + fmt(t) + ' ' + P.small + '.';
    if (s < f / 10) expl += ' Осторожно: остаток ' + fmt(s) + ' ' + P.small + ' занимает не все ' + R.words(zerosCnt(f)) + ' места, свободные места заполняем нулями: не ' + b + String(s) + ', а ' + fmt(t) + '.';
    return { kind: 'num', html: 'Раздроби: ' + expr(nm(P, b, s) + ' = … ' + P.small), answer: t,
      hint: 'Сначала раздроби крупную меру (' + P.fact + '), потом прибавь мелкие. Следи за нулями посередине.',
      explain: P.fact + '. ' + expl + ' Ответ: ' + ansU(t, P.small) + '.' };
  });

  /* --- сравнение величин (choice) --- */
  reg('ldCompare', function (o) {
    o = o || {};
    var units = (o.units || ['га', 'а', 'м²']).slice().sort(function (x, y) { return AIDX[x] - AIDX[y]; }), pairs = [], i, j;
    for (i = 0; i < units.length; i++) for (j = i + 1; j < units.length; j++) pairs.push([units[i], units[j]]);
    var pr = pick(o.pairs || pairs), big = pr[0], small = pr[1], F = ratio(big, small);
    var comp = !!o.comp, x = rand(2, 60), sp = comp ? rand(1, F > 100 ? 99 : F - 1) * (F > 100 ? 100 : 1) : 0;
    var tSmall = x * F + sp, kind = pick(['eq', 'gt', 'lt']), y = tSmall;
    if (kind !== 'eq') {
      var d = F > 100 ? rand(1, 99) * 100 : rand(1, Math.min(F / 2, comp ? 9 : 99));
      y = kind === 'gt' ? tSmall - d : tSmall + d;
    }
    if (y < 1) y = tSmall + 1;
    var left = comp ? nu(x, big) + ' ' + nu(sp, small) : nu(x, big), right = nu(y, small), lv = tSmall, rv = y;
    if (Math.random() < 0.4) { var t1 = left; left = right; right = t1; t1 = lv; lv = rv; rv = t1; }
    var SG = ['>', '<', '='], sign = lv > rv ? 0 : lv < rv ? 1 : 2;
    var conv = comp ? nu(x, big) + ' ' + nu(sp, small) + ' = ' + fmt(x) + ' × ' + fmt(F) + ' + ' + fmt(sp) + ' = ' + fmt(tSmall) : nu(x, big) + ' = ' + fmt(x) + ' × ' + fmt(F) + ' = ' + fmt(tSmall);
    return { kind: 'choice', html: 'Сравни величины:<br>' + expr(left + ' … ' + right), options: SG, answer: sign, wide: false,
      hint: 'Вырази обе величины в одних и тех же мерах (' + P2(big, small) + ') — тогда останется сравнить два числа.',
      explain: 'Выразим в ' + ULOCP[small] + ': ' + conv + ' ' + small + '. Сравниваем ' + fmt(lv) + ' и ' + fmt(rv) + ': ' + (sign === 2 ? 'они равны' : sign === 0 ? 'первое больше' : 'первое меньше') + ', значит, ' + left + ' ' + SG[sign] + ' ' + right + '.' };
  });
  function P2(big, small) { return factChain(big, small); }

  /* --- площадь прямоугольника и квадрата в единицах длины --- */
  reg('ldAreaRect', function (o) {
    o = o || {};
    var u = pick(o.units || ['см', 'дм', 'м']), shape = o.shape || pick(['rect', 'rect', 'sq']), a, b, S, U2 = SQOF[u], fig = o.fig !== false;
    if (shape === 'sq') {
      a = rand(o.smin || 3, o.smax || 25); S = a * a;
      return { kind: 'num', html: 'Сторона квадрата ' + nu(a, u) + '. Найди его площадь (в ' + ULOCP[U2] + ').' + (fig ? plotSVG(nu(a, u), nu(a, u), 1, 1, { center: 'S = ?', label: 'Квадрат со стороной ' + a + ' ' + u }) : ''), answer: S,
        hint: 'У квадрата длина и ширина равны стороне. Площадь = длина × ширина.',
        explain: 'S = ' + a + ' × ' + a + ' = ' + fmt(S) + ' ' + U2 + '. Ответ: ' + ansU(S, U2) + '.' };
    }
    a = rand(o.amin || 6, o.amax || 40); b = rand(o.bmin || 2, Math.max(o.bmin || 2, Math.min(a - 1, o.bmax || 25))); S = a * b;
    return { kind: 'num', html: 'Длина прямоугольника ' + nu(a, u) + ', ширина ' + nu(b, u) + '. Найди его площадь (в ' + ULOCP[U2] + ').' + (fig ? plotSVG(nu(a, u), nu(b, u), a, b, { center: 'S = ?', label: 'Прямоугольник ' + a + ' на ' + b + ' ' + u }) : ''), answer: S,
      hint: 'Площадь прямоугольника = длина × ширина. Единицы: длину измеряли в ' + LOCP[u] + ', площадь получится в ' + ULOCP[U2] + '.',
      explain: 'S = ' + a + ' × ' + b + ' = ' + fmt(S) + ' ' + U2 + '. Ответ: ' + ansU(S, U2) + '.' };
  });

  /* --- устные задачи на площадь: стороны в разных мерах, периметр, «в несколько раз меньше» --- */
  reg('ldAreaOral', function (o) {
    o = o || {};
    var v = o.v || pick(['sq', 'mm', 'perimSq', 'ratio', 'perimRect']), a, b, S, k, u, U2;
    if (v === 'sq') {
      u = pick(['см', 'дм', 'м']); a = rand(3, 15); S = a * a; U2 = SQOF[u];
      return { kind: 'num', html: 'Найди площадь квадрата со стороной ' + nu(a, u) + ' (в ' + ULOCP[U2] + ').', answer: S,
        hint: 'Площадь квадрата — сторона, умноженная на сторону.', explain: 'S = ' + a + ' × ' + a + ' = ' + S + ' ' + U2 + '. Ответ: ' + ansU(S, U2) + '.' };
    }
    if (v === 'mm') {
      var pr = pick([['см', 'мм', 10], ['м', 'дм', 10], ['дм', 'см', 10], ['м', 'см', 100]]), bg = pr[0], sm = pr[1], f = pr[2];
      a = rand(2, 12); k = f === 100 ? rand(2, 6) : rand(2, 12); b = k * f / (f === 100 ? 1 : 1); S = a * k; U2 = SQOF[bg];
      return { kind: 'num', html: 'Стороны прямоугольника ' + nu(a, bg) + ' и ' + nu(b, sm) + '. Найди его площадь (в ' + ULOCP[U2] + ').', answer: S,
        hint: 'Сначала вырази обе стороны в одной мере (' + '1 ' + bg + ' = ' + f + ' ' + sm + '), потом умножай.',
        explain: 'Переведём вторую сторону: ' + nu(b, sm) + ' = ' + b + ' : ' + f + ' = ' + k + ' ' + bg + '. Теперь S = ' + a + ' × ' + k + ' = ' + S + ' ' + U2 + '. Ответ: ' + ansU(S, U2) + '.' };
    }
    if (v === 'perimSq') {
      u = pick(['м', 'см', 'дм']); a = rand(3, 15); var P = a * 4; S = a * a; U2 = SQOF[u];
      return { kind: 'num', html: 'Сумма длин сторон квадрата равна ' + nu(P, u) + '. Найди его площадь (в ' + ULOCP[U2] + ').', answer: S,
        hint: 'Сначала найди сторону: у квадрата четыре равные стороны.',
        explain: stepsL(['Сторона: ' + P + ' : 4 = ' + a + ' ' + u, 'Площадь: ' + a + ' × ' + a + ' = ' + S + ' ' + U2], ansU(S, U2)) };
    }
    if (v === 'ratio') {
      u = pick(['см', 'дм', 'м']); k = rand(2, 6); b = rand(2, 12); a = b * k; S = a * b; U2 = SQOF[u];
      return { kind: 'num', html: 'Длина прямоугольника ' + nu(a, u) + ', ширина в ' + k + ' ' + plur(k, 'раз', 'раза', 'раз') + ' меньше. Найди площадь (в ' + ULOCP[U2] + ').', answer: S,
        hint: 'Ширина в несколько раз меньше — значит, длину надо разделить.',
        explain: stepsL(['Ширина: ' + a + ' : ' + k + ' = ' + b + ' ' + u, 'Площадь: ' + a + ' × ' + b + ' = ' + S + ' ' + U2], ansU(S, U2)) };
    }
    u = pick(['см', 'дм', 'м']); b = rand(3, 12); a = rand(b + 1, b + 12); var half = a + b, P2_ = half * 2; S = a * b; U2 = SQOF[u];
    return { kind: 'num', html: 'Периметр прямоугольника ' + nu(P2_, u) + ', его длина ' + nu(a, u) + '. Найди площадь (в ' + ULOCP[U2] + ').', answer: S,
      hint: 'Половина периметра — это длина плюс ширина. Найди ширину, а потом площадь.',
      explain: stepsL([P2_ + ' : 2 = ' + half + ' ' + u + ' — длина и ширина вместе', 'Ширина: ' + half + ' − ' + a + ' = ' + b + ' ' + u, 'Площадь: ' + a + ' × ' + b + ' = ' + S + ' ' + U2], ansU(S, U2)) };
  });

  /* --- размеры участков --- */
  var H_A = [200, 250, 300, 400, 500, 600, 750, 800, 1000, 1200, 1500, 1800, 2000];
  var H_B = [100, 200, 250, 300, 400, 500, 600, 800, 1000];
  function dims(target, o) {
    o = o || {};
    var a, b, S, g = 0, unit = target === 'га' ? 10000 : target === 'а' ? 100 : 1;
    do {
      g++;
      if (target === 'га') { a = pick(o.aList || H_A); b = pick(o.bList || H_B); }
      else if (target === 'а') { a = rand(4, 30) * 5; b = rand(2, 16) * 5; }
      else { a = rand(8, 90); b = rand(5, Math.min(a, 60)); }
      S = a * b;
    } while (g < 500 && (S % unit !== 0 || a === b || (target === 'га' && S / 10000 > 300) || (target === 'а' && (S > 20000 || S < 400)) || (o.aGtB && a < b)));
    if (a < b) { var t = a; a = b; b = t; }
    return { a: a, b: b, S: S };
  }
  R.ldDims = dims;
  function toTarget(S, target) { return target === 'га' ? S / 10000 : target === 'а' ? S / 100 : S; }
  function convLine(S, target) {
    if (target === 'а') return 'В 1 а — 100 м², поэтому ' + fmt(S) + ' : 100 = ' + fmt(S / 100) + ' а';
    if (target === 'га') return 'В 1 га — 10 000 м², поэтому ' + fmt(S) + ' : 10 000 = ' + fmt(S / 10000) + ' га';
    return '';
  }
  function tgtQ(target) { return Math.random() < 0.5 ? 'Найди площадь в ' + ULOCP[target] + '.' : 'Чему равна площадь в ' + ULOCP[target] + '?'; }

  var SJ_A = [
    function (a, b) { return 'Дачный участок имеет форму прямоугольника: в длину ' + a + ', в ширину ' + b + '.'; },
    function (a, b) { return 'Огород прямоугольной формы имеет длину ' + a + ' и ширину ' + b + '.'; },
    function (a, b) { return 'Школа разбила опытный участок. Его длина ' + a + ', ширина ' + b + '.'; },
    function (a, b) { return 'Прямоугольная лужайка перед домом: длина ' + a + ', ширина ' + b + '.'; },
    function (a, b) { return 'Приусадебный участок — прямоугольник со сторонами ' + a + ' и ' + b + '.'; },
    function (a, b) { return 'Для газона отвели прямоугольную площадку длиной ' + a + ' и шириной ' + b + '.'; }
  ];
  var SJ_H = [
    function (a, b) { return 'Пшеничное поле имеет форму прямоугольника длиной ' + a + ' и шириной ' + b + '.'; },
    function (a, b) { return 'Луг — это прямоугольник со сторонами ' + a + ' и ' + b + '.'; },
    function (a, b) { return 'Яблоневый сад занимает прямоугольный участок: длина ' + a + ', ширина ' + b + '.'; },
    function (a, b) { return 'Городской парк имеет форму прямоугольника: длина ' + a + ', ширина ' + b + '.'; },
    function (a, b) { return 'Пастбище для коров — прямоугольник длиной ' + a + ' и шириной ' + b + '.'; },
    function (a, b) { return 'Поле картофеля вытянуто в длину на ' + a + ', а в ширину на ' + b + '.'; }
  ];
  var SJ_M = [
    function (a, b) { return 'Пол в зале торгового центра — прямоугольник: длина ' + a + ', ширина ' + b + '.'; },
    function (a, b) { return 'Каток залили на площадке длиной ' + a + ' и шириной ' + b + '.'; },
    function (a, b) { return 'Строители выложили плиткой площадку длиной ' + a + ' и шириной ' + b + '.'; },
    function (a, b) { return 'Стоянка для автомобилей — прямоугольник со сторонами ' + a + ' и ' + b + '.'; },
    function (a, b) { return 'Двор многоэтажного дома заасфальтировали. Он имеет длину ' + a + ' и ширину ' + b + '.'; }
  ];
  function sujet(target) { return pick(target === 'га' ? SJ_H : target === 'а' ? SJ_A : SJ_M); }

  reg('ldPlot', function (o) {
    o = o || {};
    var target = o.target && o.target !== 'mix' ? o.target : pick(['а', 'га', 'м²']), d = dims(target, o), a = d.a, b = d.b, S = d.S;
    var fig = o.fig == null ? Math.random() < 0.45 : o.fig, la = lenTxt(a), lb = lenTxt(b), steps = [];
    if (a >= 1000 && a % 1000 !== 0) steps.push('Переведём длину в метры: ' + la + ' = ' + fmt(a) + ' м');
    if (b >= 1000 && b % 1000 !== 0) steps.push('Переведём ширину в метры: ' + lb + ' = ' + fmt(b) + ' м');
    if (a % 1000 === 0 && a >= 1000) steps.push('Переведём длину в метры: ' + la + ' = ' + fmt(a) + ' м');
    if (b % 1000 === 0 && b >= 1000) steps.push('Переведём ширину в метры: ' + lb + ' = ' + fmt(b) + ' м');
    steps.push('Площадь в квадратных метрах: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(S) + ' м²');
    if (target !== 'м²') steps.push(convLine(S, target));
    var ans = toTarget(S, target);
    return { kind: 'num', html: sujet(target)(la, lb) + ' ' + tgtQ(target) + (fig ? plotSVG(la, lb, a, b, { center: 'S = ?', label: 'Участок ' + la + ' на ' + lb }) : ''), answer: ans,
      hint: 'Площадь прямоугольника = длина × ширина. Стороны выражай в метрах' + (target === 'м²' ? '.' : ', а потом переведи площадь в нужную меру (' + factChain(target, 'м²') + ').'),
      explain: stepsL(steps, ansU(ans, target)) };
  });

  reg('ldSideArea', function (o) {
    o = o || {};
    var target = o.target && o.target !== 'mix' ? o.target : pick(['а', 'га']), d = dims(target, o), N = toTarget(d.S, target);
    var known = Math.random() < 0.5 ? d.a : d.b, other = known === d.a ? d.b : d.a, kn = known === d.a ? 'длина' : 'ширина', qn = known === d.a ? 'ширину' : 'длину';
    var nm_ = target === 'га' ? pick(['Поле', 'Луг', 'Пастбище', 'Сад']) : pick(['Огород', 'Дачный участок', 'Газон', 'Сквер']);
    var unit = target === 'га' ? 10000 : 100;
    return { kind: 'num', html: nm_ + ' имеет форму прямоугольника. Его площадь ' + uw(N, target) + ', ' + kn + ' — ' + lenTxt(known) + '. Найди ' + qn + ' (в метрах).', answer: other,
      hint: 'Площадь прямоугольника = длина × ширина, значит, неизвестную сторону можно найти делением. Сначала вырази площадь в квадратных метрах.',
      explain: stepsL([nu(N, target) + ' = ' + fmt(N) + ' × ' + fmt(unit) + ' = ' + fmt(d.S) + ' м²', 'Неизвестная сторона: ' + fmt(d.S) + ' : ' + fmt(known) + ' = ' + fmt(other) + ' м'], ansU(other, 'м')) };
  });

  /* --- какой участок имеет заданную площадь (choice) --- */
  reg('ldWhichPlot', function (o) {
    o = o || {};
    var small_ = [[100, 'а', 1], [200, 'а', 2], [300, 'а', 3], [400, 'а', 4], [500, 'а', 5], [600, 'а', 6], [800, 'а', 8], [1000, 'а', 10], [1200, 'а', 12], [1500, 'а', 15], [2000, 'а', 20], [2400, 'а', 24]];
    var big_ = [[10000, 'га', 1], [20000, 'га', 2], [30000, 'га', 3], [40000, 'га', 4], [50000, 'га', 5], [60000, 'га', 6], [80000, 'га', 8], [100000, 'га', 10]];
    var T = pick(o.small ? small_ : o.big ? big_ : small_.concat(big_)), S = T[0], fac = [], x;
    for (x = 4; x <= S / 4; x++) if (S % x === 0 && x >= S / x && (x % 5 === 0 || x % 4 === 0) && (S / x) % 2 === 0 && S / x >= (S >= 1000 ? 10 : 5)) fac.push([x, S / x]);
    var pr = pick(fac), a = pr[0], b = pr[1], cand = [[a, b * 10], [a * 10, b], [a * 2, b], [a, b * 2], [a, Math.round(b / 2)], [Math.round(a / 2), b]], out = [], seen = {};
    seen[a + 'x' + b] = 1;
    shuffle(cand).forEach(function (c) { var k = c[0] * 1000 + c[1]; if (out.length < 3 && c[0] * c[1] !== S && !seen[k] && c[0] >= 2 && c[1] >= 2) { seen[k] = 1; out.push(c); } });
    var all = shuffle([[a, b]].concat(out)), txt = all.map(function (c) { return nu(c[0], 'м') + ' на ' + nu(c[1], 'м'); }), right = nu(a, 'м') + ' на ' + nu(b, 'м');
    var lines = all.map(function (c) { var s = c[0] * c[1]; return fmt(c[0]) + ' × ' + fmt(c[1]) + ' = ' + fmt(s) + ' м²' + (s === S ? ' — подходит' : ''); });
    var noun = pick(S >= 10000 ? ['участок', 'сад', 'луг', 'парк'] : ['участок', 'огород', 'газон', 'сквер']);
    return { kind: 'choice', html: 'Какие размеры может иметь прямоугольный ' + noun + ' площадью ' + uw(T[2], T[1]) + '?<br><span class="soft">Длина и ширина указаны в метрах.</span>', options: txt, answer: txt.indexOf(right), wide: true,
      hint: 'Сначала вырази площадь в квадратных метрах, потом перемножь стороны каждого варианта: ' + factChain(T[1], 'м²') + '.',
      explain: uw(T[2], T[1]) + ' = ' + fmt(S) + ' м². Проверяем варианты: ' + lines.join('; ') + '. Ответ: ' + right + '.' };
  });

  /* --- история про единицы: сотки, гектары --- */
  var UN_ST = [
    { p: ['а', 'м²'], dir: 'down', q: [3, 25], t: function (n) { return 'Площадь дачного участка — ' + n + ' ' + plur(n, 'сотка', 'сотки', 'соток') + ' (сотка — это ар). Сколько это квадратных метров?'; } },
    { p: ['а', 'м²'], dir: 'up', q: [4, 40], t: function (n) { return 'Площадь огорода ' + nu(n, 'м²') + '. Сколько это аров (соток)?'; } },
    { p: ['га', 'а'], dir: 'down', q: [12, 90], t: function (n) { return 'Ферма арендовала ' + uw(n, 'га') + ' земли. Сколько это аров?'; } },
    { p: ['га', 'м²'], dir: 'down', q: [3, 24], t: function (n) { return 'Площадь городского парка ' + uw(n, 'га') + '. Сколько это квадратных метров?'; } },
    { p: ['га', 'м²'], dir: 'up', q: [3, 60], t: function (n) { return 'Площадь пшеничного поля ' + nu(n, 'м²') + '. Сколько это гектаров?'; } },
    { p: ['га', 'а'], dir: 'up', q: [5, 80], t: function (n) { return 'На фермерском участке ' + uw(n, 'а') + ' земли. Сколько это гектаров?'; } },
    { p: ['км²', 'га'], dir: 'down', q: [2, 30], t: function (n) { return 'Площадь лесного заказника ' + nu(n, 'км²') + '. Сколько это гектаров?'; } },
    { p: ['км²', 'га'], dir: 'up', q: [3, 50], t: function (n) { return 'Площадь острова ' + uw(n, 'га') + '. Сколько это квадратных километров?'; } }
  ];
  reg('pldUnits', function (o) {
    o = o || {};
    var it = pick(o.only ? UN_ST.filter(function (x) { return o.only.indexOf(x.p.join('-')) >= 0; }) : UN_ST), big = it.p[0], small = it.p[1], F = ratio(big, small), q = rand(it.q[0], it.q[1]);
    if (o.round && q > 12) q = Math.round(q / 5) * 5;
    var N = it.dir === 'down' ? q : q * F, ans = it.dir === 'down' ? q * F : q, to = it.dir === 'down' ? small : big, from = it.dir === 'down' ? big : small;
    return { kind: 'num', html: it.t(N), answer: ans,
      hint: 'Вспомни, сколько ' + UACC[small] + ' в одном ' + ULOC[big] + ': ' + factChain(big, small) + '.',
      explain: stepsL([factChain(big, small), it.dir === 'down' ? nu(N, from) + ' = ' + fmt(N) + ' × ' + fmt(F) + ' = ' + fmt(ans) + ' ' + to : nu(N, from) + ' = ' + fmt(N) + ' : ' + fmt(F) + ' = ' + fmt(ans) + ' ' + to], ansU(ans, to)) };
  });

  /* ================= помощники: составные величины ================= */
  /* составное число: big крупных и small мелких; t — всё в мелких единицах */
  function mkQ(P, lo, hi) {
    var b = rand(lo, hi), s;
    if (P.f === 100) s = Math.random() < 0.85 ? rand(1, 19) * 5 : rand(1, 99);
    else s = Math.random() < 0.85 ? rand(1, 19) * 50 : rand(1, 99) * 10;
    return { b: b, s: s, t: b * P.f + s };
  }
  function Lv(P, t) { return t >= P.f ? nf(P, t) : nu(t, P.small); }             /* «4 м 80 см» или «80 см» */
  function toSm(P, b, s) { return nm(P, b, s) + ' = ' + nu(b * P.f + s, P.small); }  /* «3 м 65 см = 365 см» */
  function backLn(P, t) { return t >= P.f ? nu(t, P.small) + ' = ' + nf(P, t) : nu(t, P.small); }
  var NAMES_F = ['Аня', 'Оля', 'Катя', 'Маша', 'Вера', 'Лена', 'Юля', 'Настя'];
  var NAMES_M = ['Миша', 'Дима', 'Коля', 'Саша', 'Петя', 'Ваня', 'Игорь', 'Артём'];
  function finT(P, t) { return bold(Lv(P, t)); }
  /* ответ «составной» задачи: [крупные, мелкие] */
  function ansPair(P, t) { return [Math.floor(t / P.f), t % P.f]; }
  function plNoun(n, a, b, c) { return plur(n, a, b, c); }
  function dayW(n) { return plur(n, 'день', 'дня', 'дней'); }

  /* ================= что измеряют в какой единице (choice) ================= */
  var KU_AREA = [['площадь страницы тетради', 'см²'], ['площадь почтовой марки', 'см²'], ['площадь пола в комнате', 'м²'], ['площадь школьного двора', 'м²'], ['площадь баскетбольной площадки', 'м²'],
    ['площадь огорода', 'а'], ['площадь дачного участка', 'а'], ['площадь пшеничного поля', 'га'], ['площадь городского парка', 'га'], ['площадь озера', 'км²'], ['площадь лесного заповедника', 'км²']];
  var KU_LEN = [['длину забора вокруг участка', 'м'], ['высоту дерева', 'м'], ['расстояние между двумя сёлами', 'км'], ['ширину реки', 'м'], ['длину школьного коридора', 'м'], ['длину карандаша', 'см'], ['длину железной дороги', 'км'], ['толщину книги', 'мм']];
  var KU_OTHER = [['массу арбуза', 'кг'], ['урожай зерна с поля', 'т'], ['массу тетради', 'г'], ['массу груза на грузовике', 'т']];
  var LIN_OF = { 'км²': 'км', 'м²': 'м', 'дм²': 'дм', 'см²': 'см', 'мм²': 'мм' };
  var KU_NAME = { 'км²': 'квадратных километрах', 'га': 'гектарах', 'а': 'арах', 'м²': 'квадратных метрах', 'см²': 'квадратных сантиметрах', 'км': 'километрах', 'м': 'метрах', 'см': 'сантиметрах', 'мм': 'миллиметрах', 'кг': 'килограммах', 'т': 'тоннах', 'г': 'граммах' };
  var KU_NAMEP = { 'км²': 'квадратных километрах', 'га': 'гектарах', 'а': 'арах', 'м²': 'квадратных метрах', 'см²': 'квадратных сантиметрах' };
  reg('ldKindUnit', function (o) {
    o = o || {};
    var mode = o.mode || pick(['which', 'which', 'what']), it, opts, right, i;
    if (mode === 'what') {
      var au = o.area || pick(KU_AREA), unit = au[1], pool = KU_LEN.concat(KU_OTHER), wr = shuffle(pool).slice(0, 3);
      var oo = shuffle([au[0]].concat(wr.map(function (x) { return x[0]; })));
      return { kind: 'choice', html: 'Что можно измерять в ' + KU_NAMEP[unit] + '?', options: oo.map(function (s) { return s.charAt(0).toUpperCase() + s.slice(1); }), answer: oo.indexOf(au[0]), wide: true,
        hint: 'Квадратные меры, ар и гектар — это меры площади. Длину, массу и расстояние в них не измеряют.',
        explain: 'Верно: ' + au[0] + '. ' + (unit === 'га' || unit === 'а' ? 'Ар и гектар — меры земельной площади.' : 'Единица «' + unit + '» — мера площади (поверхности).') + ' Длину измеряют в метрах, километрах, сантиметрах, а массу — в килограммах и тоннах.' };
    }
    it = o.len === false ? pick(KU_AREA) : pick(KU_LEN.concat(KU_AREA));
    var isArea = KU_AREA.indexOf(it) >= 0, cor = it[1], dis = [];
    if (isArea) {
      var lin = LIN_OF[cor];
      dis = [lin || 'м', pick(['кг', 'т']), pick(['км', 'м', 'см'].filter(function (x) { return x !== lin; }))];
    } else {
      dis = [SQOF[cor], pick(['га', 'а']), pick(['кг', 'т'])];
      if (dis[1] === dis[0]) dis[1] = 'км²';
    }
    var seen = {}; seen[cor] = 1; dis = dis.filter(function (x) { if (seen[x]) return false; seen[x] = 1; return true; });
    var extra = ['м', 'км', 'м²', 'см', 'га', 'кг'];
    for (i = 0; i < extra.length && dis.length < 3; i++) if (!seen[extra[i]]) { seen[extra[i]] = 1; dis.push(extra[i]); }
    opts = shuffle([cor].concat(dis.slice(0, 3)));
    return { kind: 'choice', html: 'В каких единицах нужно измерять ' + it[0] + '?', options: opts, answer: opts.indexOf(cor), wide: false,
      hint: isArea ? 'Площадь — это «длина × ширина». Её единицы — квадратные меры, а также ар и гектар.' : 'Длину и расстояние измеряют единицами длины, а не площади: метрами, километрами, сантиметрами.',
      explain: 'Правильный ответ: ' + cor + '. ' + (isArea ? 'Это площадь, а площадь измеряют квадратными мерами (а также арами и гектарами), поэтому длинные меры вроде «' + (LIN_OF[cor] || 'м') + '» не подходят.' : 'Это длина (расстояние), а не площадь. Единица площади ' + SQOF[cor] + ' для неё не годится.') };
  });

  /* ================= из линейных мер — квадратные ================= */
  var DER = [['м', 'дм', 10], ['дм', 'см', 10], ['см', 'мм', 10], ['м', 'см', 100], ['км', 'м', 1000]];
  reg('ldDerive', function (o) {
    o = o || {};
    var pr = pick(o.pairs || DER), A = pr[0], B = pr[1], f = pr[2], mode = o.mode || pick(['one', 'side']);
    var AA = SQOF[A], BB = SQOF[B];
    if (mode === 'one') {
      var F = f * f;
      return { kind: 'num', html: '1 ' + A + ' = ' + fmt(f) + ' ' + B + '. Сколько ' + UACC[BB] + ' в одном ' + ULOC[AA] + '?', answer: F,
        hint: 'Квадрат со стороной 1 ' + A + ' состоит из рядов маленьких квадратов со стороной 1 ' + B + '. Сколько квадратов в одном ряду и сколько рядов?',
        explain: stepsL(['Сторона квадрата 1 ' + A + ' = ' + fmt(f) + ' ' + B, 'В ряду ' + fmt(f) + ' квадратов по 1 ' + BB + ', и таких рядов тоже ' + fmt(f), fmt(f) + ' × ' + fmt(f) + ' = ' + fmt(F) + ' ' + BB], 'в 1 ' + AA + ' — ' + ansU(F, BB)) };
    }
    var k = f === 10 ? rand(2, 9) : f === 100 ? rand(2, 5) : rand(2, 4), side = k * f, S = side * side;
    return { kind: 'num', html: 'Сторона квадрата ' + nu(k, A) + '. Найди его площадь в ' + ULOCP[BB] + '.', answer: S,
      hint: 'Сначала вырази сторону в ' + (B === 'дм' ? 'дециметрах' : B === 'см' ? 'сантиметрах' : B === 'мм' ? 'миллиметрах' : 'метрах') + ' (1 ' + A + ' = ' + fmt(f) + ' ' + B + '), потом умножь сторону на сторону.',
      explain: stepsL(['Сторона: ' + nu(k, A) + ' = ' + k + ' × ' + fmt(f) + ' = ' + nu(side, B), 'Площадь: ' + fmt(side) + ' × ' + fmt(side) + ' = ' + fmt(S) + ' ' + BB], ansU(S, BB)) };
  });

  /* ================= заполни таблицу: 1 га = … а = … м² ================= */
  reg('ldChain', function (o) {
    o = o || {};
    var chains = o.chains || [['га', 'а', 'м²'], ['м²', 'дм²', 'см²'], ['км²', 'га', 'а'], ['дм²', 'см²', 'мм²'], ['км²', 'га', 'м²'], ['а', 'м²', 'дм²']], ch = pick(chains), A = ch[0], B = ch[1], C = ch[2];
    var fb = ratio(A, B), fc = ratio(A, C);
    return { kind: 'nums', html: 'Заполни пропуски:<br>' + expr('1 ' + A + ' = … ' + B + ' = … ' + C), fields: [{ label: B }, { label: C }], answer: [fb, fc],
      hint: 'Каждая следующая мера площади в 100 раз мельче предыдущей. Сколько раз по 100 надо взять, чтобы дойти от ' + A + ' до ' + C + '?',
      explain: factChain(A, C) + '. Ответ: ' + bold(fmt(fb) + ' ' + B) + ' и ' + bold(fmt(fc) + ' ' + C) + '.' };
  });

  /* ================= вычитание из круглых сотен (дополнение) ================= */
  reg('ldCompl', function (o) {
    o = o || {};
    var H = pick(o.hs || [200, 300, 400, 500, 600, 700, 800]), b, t10, g = 0;
    do { b = H - rand(11, 99); g++; } while (b % 10 === 0 && g < 100);
    t10 = Math.ceil(b / 10) * 10;
    return { kind: 'num', html: expr(fmt(H) + ' − ' + b + ' ='), answer: H - b,
      hint: 'Дополни ' + b + ' до ближайшего десятка, а потом до ' + fmt(H) + '.',
      explain: 'От ' + b + ' до ' + t10 + ' — ' + (t10 - b) + ', от ' + t10 + ' до ' + fmt(H) + ' — ' + (H - t10) + '. Всего ' + (t10 - b) + ' + ' + (H - t10) + ' = ' + (H - b) + '. Проверка: ' + b + ' + ' + (H - b) + ' = ' + fmt(H) + '.' };
  });

  /* ================= периметр по площади ================= */
  var SQ_SIDES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 1000];
  reg('ldPerimFromArea', function (o) {
    o = o || {};
    var mode = o.mode || pick(['sq', 'sq', 'rect']);
    if (mode === 'sq') {
      var s = pick(o.sides || SQ_SIDES), S = s * s, us = ['м²'];
      if (S % 100 === 0 && S >= 400) us.push('а');
      if (S % 10000 === 0) us.push('га');
      if (S > 4000 && us.length > 1) us.shift();
      var u = pick(us), N = u === 'га' ? S / 10000 : u === 'а' ? S / 100 : S;
      var what = pick(u === 'га' ? ['Поле', 'Луг', 'Парк'] : u === 'а' ? ['Огород', 'Дачный участок', 'Газон'] : ['Площадка', 'Двор', 'Стоянка']);
      var steps = [];
      if (u !== 'м²') steps.push(nu(N, u) + ' = ' + fmt(N) + ' × ' + fmt(u === 'га' ? 10000 : 100) + ' = ' + fmt(S) + ' м²');
      steps.push('Сторона квадрата — число, которое при умножении на себя даёт ' + fmt(S) + ': ' + fmt(s) + ' × ' + fmt(s) + ' = ' + fmt(S) + ', значит, сторона ' + fmt(s) + ' м');
      steps.push('Периметр: ' + fmt(s) + ' × 4 = ' + fmt(s * 4) + ' м');
      return { kind: 'num', html: what + ' имеет форму квадрата. Площадь ' + (u === 'м²' ? nu(N, 'м²') : uw(N, u)) + '. Найди периметр (в метрах).', answer: s * 4,
        hint: 'Сначала вырази площадь в квадратных метрах и найди сторону: какое число, умноженное на себя, даёт площадь? Потом сторону умножь на 4.',
        explain: stepsL(steps, ansU(s * 4, 'м')) };
    }
    var target = pick(['а', 'м²']), d = dims(target, o), a = d.a, b = d.b, N2 = toTarget(d.S, target), P = 2 * (a + b);
    var known = Math.random() < 0.5 ? a : b, other = known === a ? b : a;
    var kn = known === a ? 'длина' : 'ширина';
    var s1 = [];
    if (target === 'а') s1.push(nu(N2, 'а') + ' = ' + fmt(N2) + ' × 100 = ' + fmt(d.S) + ' м²');
    s1.push('Вторая сторона: ' + fmt(d.S) + ' : ' + fmt(known) + ' = ' + fmt(other) + ' м');
    s1.push('Периметр: (' + fmt(known) + ' + ' + fmt(other) + ') × 2 = ' + fmt(known + other) + ' × 2 = ' + fmt(P) + ' м');
    return { kind: 'num', html: (target === 'а' ? pick(['Огород', 'Участок', 'Газон']) : pick(['Площадка', 'Двор', 'Стоянка'])) + ' имеет форму прямоугольника. Площадь ' + (target === 'а' ? uw(N2, 'а') : nu(N2, 'м²')) + ', ' + kn + ' — ' + nu(known, 'м') + '. Найди периметр (в метрах).', answer: P,
      hint: 'Сначала найди вторую сторону: площадь раздели на известную сторону. Потом сложи стороны и умножь на 2.',
      explain: stepsL(s1, ansU(P, 'м')) };
  });

  /* ================= задачи: разрезание площади на части ================= */
  var CUT_GA = [
    function (S, T) { return 'Поле площадью ' + S + ' разбили на садовые участки по ' + T + '. Сколько участков получилось?'; },
    function (S, T) { return 'Луг площадью ' + S + ' разделили на делянки по ' + T + ' для опытов. Сколько делянок получилось?'; },
    function (S, T) { return 'Пастбище площадью ' + S + ' поделили на загоны по ' + T + ' каждый. Сколько загонов получилось?'; },
    function (S, T) { return 'Посёлку выделили землю площадью ' + S + ' под застройку. Её разбили на участки по ' + T + '. Сколько участков получилось?'; },
    function (S, T) { return 'Фермер разделил поле площадью ' + S + ' на части по ' + T + ' и на каждой посеял свою культуру. Сколько частей получилось?'; }
  ];
  var CUT_A = [
    function (S, T) { return 'Школьный участок площадью ' + S + ' разметили на грядки по ' + T + '. Сколько грядок получилось?'; },
    function (S, T) { return 'Огород площадью ' + S + ' разбили на одинаковые грядки по ' + T + ' каждая. Сколько грядок получилось?'; },
    function (S, T) { return 'Сквер площадью ' + S + ' разделили на клумбы по ' + T + ' каждая. Сколько клумб получилось?'; },
    function (S, T) { return 'Стоянку площадью ' + S + ' разметили на парковочные места по ' + T + '. Сколько мест получилось?'; },
    function (S, T) { return 'Под теплицы отвели площадку в ' + S + '. Одна теплица занимает ' + T + '. Сколько теплиц поместится на площадке?'; }
  ];
  reg('pldCut', function (o) {
    o = o || {};
    var kind = o.kind || pick(['ha', 'a']), P = PAIRS[kind === 'ha' ? 'га-а' : 'а-м²'], n, T, tot, sj;
    if (kind === 'ha') {
      T = pick([2, 4, 5, 6, 8, 10, 12, 15, 20, 25, 40, 50]);
      n = rand(Math.ceil(150 / T), Math.min(80, Math.floor(9000 / T)));
      sj = pick(CUT_GA);
    } else {
      T = pick([2, 4, 5, 6, 8, 10, 12, 15, 20, 25]);
      n = rand(Math.ceil(120 / T), Math.min(90, Math.floor(9900 / T)));
      sj = pick(CUT_A);
    }
    tot = T * n;
    var big = Math.floor(tot / P.f), sm = tot % P.f, S = nf(P, tot), Tt = nu(T, P.small), steps = [];
    steps.push((sm ? nm(P, big, sm) + ' = ' + big + ' × ' + P.f + ' + ' + sm : nu(big, P.big) + ' = ' + big + ' × ' + P.f) + ' = ' + fmt(tot) + ' ' + P.small);
    steps.push('Сколько частей: ' + fmt(tot) + ' : ' + fmt(T) + ' = ' + fmt(n));
    return { kind: 'num', html: sj(S, Tt), answer: n,
      hint: 'Участок и одна часть измерены в разных мерах. Выразим всю площадь в ' + (P.small === 'а' ? 'арах' : 'квадратных метрах') + ' (' + P.fact + '), потом разделим на размер одной части.',
      explain: stepsL(steps, bold(fmt(n))) };
  });

  /* ================= задачи: что осталось от участка (дом, дорожки, огород) ================= */
  reg('pldGardenParts', function (o) {
    o = o || {};
    var a, b, S, c, d, p1, x, x0, R_, g = 0;
    do {
      a = rand(8, 20) * 5; b = rand(5, 16) * 5; if (b >= a) b = a - 5;
      S = a * b; c = rand(4, 12); d = rand(3, 10); p1 = c * d; g++;
    } while (g < 2000 && (p1 % 10 !== 0 || S % 10 !== 0 || S < 1500 || S > 8000 || p1 > S / 4));
    x0 = (((S - p1) % 100) + 100) % 100; x = x0 + 100 * rand(0, 3); if (x < 20) x += 100;
    R_ = S - p1 - x;
    if (R_ < S / 3) { x -= 100; if (x < 20) x = x0 + 100; R_ = S - p1 - x; }
    var form = o.form || pick(['house', 'sq']), t, steps, ar = R_ / 100;
    var sj = pick(['Дачный участок', 'Приусадебный участок', 'Участок под дачу']);
    var wh = form === 'house' ? pick([['дом', 'дома'], ['гараж', 'гаража'], ['баню', 'бани']]) : pick([['беседку', 'беседки'], ['сарай', 'сарая']]);
    var tail = form === 'house' ? 'а дорожки и двор заняли ' + nu(x, 'м²') + '. Остальную землю отвели под огород. Сколько аров занимает огород?' : 'а клумбы заняли ' + nu(x, 'м²') + '. Всё остальное засадили овощами. Сколько аров занято овощами?';
    t = sj + ' — прямоугольник: длина ' + nu(a, 'м') + ', ширина ' + nu(b, 'м') + '. На нём ' + (form === 'house' ? 'построили ' : 'поставили ') + wh[0] + ' размером ' + nu(c, 'м') + ' на ' + nu(d, 'м') + ', ' + tail;
    steps = ['Площадь участка: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(S) + ' м²', 'Площадь ' + wh[1] + ': ' + c + ' × ' + d + ' = ' + p1 + ' м²', 'Занято всего: ' + p1 + ' + ' + x + ' = ' + (p1 + x) + ' м²',
      'Остаток: ' + fmt(S) + ' − ' + fmt(p1 + x) + ' = ' + fmt(R_) + ' м²', 'В арах: ' + fmt(R_) + ' : 100 = ' + fmt(ar) + ' а'];
    return { kind: 'num', html: t, answer: ar,
      hint: 'Найди площадь всего участка и вычти из неё площадь всего, что занято. Остаток переведи из квадратных метров в ары.',
      explain: stepsL(steps, ansU(ar, 'а')) };
  });

  /* ================= задачи: сравнение двух участков ================= */
  reg('pldAreaCmp', function (o) {
    o = o || {};
    var ask = o.ask || pick(['diff', 'times', 'total']), g = 0, a1, b1, S1, a2, b2, S2, sq2, k = 1;
    var SD = [10, 20, 25, 30, 40, 50, 60, 75, 80, 100];
    do {
      sq2 = Math.random() < 0.4; a2 = pick(SD); b2 = sq2 ? a2 : pick(SD); S2 = a2 * b2; g++;
      if (ask === 'times') { k = rand(2, 5); if (Math.random() < 0.5) { a1 = a2 * k; b1 = b2; } else { a1 = a2; b1 = b2 * k; } if (a1 < b1) { var tt = a1; a1 = b1; b1 = tt; } }
      else { a1 = pick(SD); b1 = pick(SD); }
      S1 = a1 * b1;
    } while (g < 3000 && (S1 % 100 || S2 % 100 || S1 === S2 || a1 === b1 || (ask !== 'total' && ask !== 'times' && S1 < S2) || S1 > 30000 || (ask === 'times' && a1 > 400)));
    var A1 = S1 / 100, A2 = S2 / 100, ans, q, ex_;
    var pair = pick([['Первый участок', 'второй', 'первого участка', 'второго'], ['Огород Ани', 'огород Бори', 'огорода Ани', 'огорода Бори'], ['Школьный участок', 'участок соседней школы', 'школьного участка', 'участка соседней школы'], ['Дача Ивановых', 'дача Петровых', 'дачи Ивановых', 'дачи Петровых']]);
    var shape2 = sq2 ? 'квадрат со стороной ' + nu(a2, 'м') : 'прямоугольник ' + nu(a2, 'м') + ' на ' + nu(b2, 'м');
    var base = pair[0] + ' — прямоугольник ' + nu(a1, 'м') + ' на ' + nu(b1, 'м') + ', ' + pair[1] + ' — ' + shape2 + '. ';
    var st = ['Площадь ' + pair[2] + ': ' + fmt(a1) + ' × ' + fmt(b1) + ' = ' + fmt(S1) + ' м² = ' + fmt(A1) + ' а', 'Площадь ' + pair[3] + ': ' + fmt(a2) + ' × ' + fmt(b2) + ' = ' + fmt(S2) + ' м² = ' + fmt(A2) + ' а'];
    if (ask === 'diff') { ans = A1 - A2; q = 'На сколько аров площадь ' + pair[2] + ' больше площади ' + pair[3] + '?'; st.push('Разность: ' + fmt(A1) + ' − ' + fmt(A2) + ' = ' + fmt(ans) + ' а'); ex_ = ansU(ans, 'а'); }
    else if (ask === 'times') { ans = S1 / S2; q = 'Во сколько раз площадь ' + pair[2] + ' больше площади ' + pair[3] + '?'; st.push('Во сколько раз больше: ' + fmt(A1) + ' : ' + fmt(A2) + ' = ' + fmt(ans)); ex_ = bold(fmt(ans)); }
    else { ans = A1 + A2; q = 'Сколько аров занимают оба участка вместе?'; st.push('Вместе: ' + fmt(A1) + ' + ' + fmt(A2) + ' = ' + fmt(ans) + ' а'); ex_ = ansU(ans, 'а'); }
    return { kind: 'num', html: base + q, answer: ans,
      hint: 'Найди площадь каждого участка в квадратных метрах, переведи в ары и только потом сравнивай.',
      explain: stepsL(st, ex_) };
  });

  /* ================= задачи: плитка на полу (линейные и квадратные меры) ================= */
  reg('pldTiles', function (o) {
    o = o || {};
    var c = pick(o.sides || [10, 20, 25, 50]), a, b, per = 100 / c, ask = o.ask || pick(['count', 'count', 'cost']);
    a = rand(2, c === 10 ? 5 : 9); b = rand(2, Math.min(a, 7));
    if (a === b) a++;
    var nA = a * per, nB = b * per, N = nA * nB, S_cm = a * 100 * b * 100, tile = c * c;
    var room = pick(['кухни', 'прихожей', 'ванной комнаты', 'веранды', 'школьной мастерской', 'коридора']);
    var price = pick([8, 10, 12, 15, 20, 25, 30, 40]), cost = N * price;
    var steps = [
      'Пол: ' + nu(a, 'м') + ' = ' + fmt(a * 100) + ' см, ' + nu(b, 'м') + ' = ' + fmt(b * 100) + ' см',
      'Площадь пола: ' + fmt(a * 100) + ' × ' + fmt(b * 100) + ' = ' + fmt(S_cm) + ' см²',
      'Площадь плитки: ' + c + ' × ' + c + ' = ' + fmt(tile) + ' см²',
      'Число плиток: ' + fmt(S_cm) + ' : ' + fmt(tile) + ' = ' + fmt(N)
    ];
    var alt = ' Проверка по рядам: вдоль длины ' + fmt(nA) + ' плиток, вдоль ширины ' + fmt(nB) + ', ' + fmt(nA) + ' × ' + fmt(nB) + ' = ' + fmt(N) + '.';
    if (ask === 'count') {
      return { kind: 'num', html: 'Пол ' + room + ' имеет форму прямоугольника ' + nu(a, 'м') + ' на ' + nu(b, 'м') + '. Его хотят выложить квадратной плиткой со стороной ' + nu(c, 'см') + '. Сколько плиток потребуется?', answer: N,
        hint: 'Можно считать по рядам: сколько плиток поместится вдоль длины и сколько вдоль ширины? Или найти площадь пола и площадь одной плитки в одних единицах.',
        explain: stepsL(steps, bold(fmt(N))) + alt };
    }
    steps.push('Стоимость: ' + fmt(N) + ' × ' + price + ' = ' + fmt(cost) + ' руб.');
    return { kind: 'num', html: 'Пол ' + room + ' — прямоугольник ' + nu(a, 'м') + ' на ' + nu(b, 'м') + '. Его выкладывают квадратной плиткой со стороной ' + nu(c, 'см') + '. Одна плитка стоит ' + nu(price, 'руб.') + ' Сколько рублей стоят все плитки?', answer: cost,
      hint: 'Сначала узнай, сколько плиток нужно: вдоль длины и вдоль ширины пола посчитай плитки в рядах. Потом умножь на цену одной плитки.',
      explain: stepsL(steps, ansU(cost, 'руб.')) };
  });

  /* ================= задачи: площадь и периметр двора ================= */
  var YARD_SQ = ['Школьный двор', 'Детская игровая площадка', 'Городской сквер', 'Пришкольный участок', 'Спортивная площадка', 'Спортивный двор'];
  var YARD_RC = ['Пришкольный участок', 'Детская игровая площадка', 'Стоянка автомобилей', 'Спортивная площадка', 'Городской сквер', 'Каток'];
  reg('pldYard', function (o) {
    o = o || {};
    var shape = o.shape || pick(['sq', 'sq', 'rect']), a, b, S, P, inAr, what;
    if (shape === 'sq') {
      a = pick(o.sides || [20, 30, 40, 50, 60, 70, 80, 90, 100]); b = a; what = pick(YARD_SQ);
    } else {
      a = rand(8, 24) * 5; b = rand(4, 16) * 5; if (b >= a) b = a - 10; what = pick(YARD_RC);
    }
    S = a * b; P = 2 * (a + b);
    inAr = o.unit === 'а' || (o.unit !== 'м²' && S % 100 === 0 && Math.random() < 0.3);
    var steps = [], text;
    if (shape === 'sq') {
      text = what + ' имеет форму квадрата со стороной ' + nu(a, 'м') + '. Определи ' + (inAr ? 'площадь в арах' : 'площадь') + ' и длину всех его сторон.';
      steps.push('Площадь: ' + fmt(a) + ' × ' + fmt(a) + ' = ' + fmt(S) + ' м²');
      if (inAr) steps.push('В арах: ' + fmt(S) + ' : 100 = ' + fmt(S / 100) + ' а');
      steps.push('Длина всех сторон — периметр: ' + fmt(a) + ' × 4 = ' + fmt(P) + ' м');
    } else {
      text = what + ' имеет форму прямоугольника: длина ' + nu(a, 'м') + ', ширина ' + nu(b, 'м') + '. Определи ' + (inAr ? 'площадь в арах' : 'площадь') + ' и длину всех его сторон.';
      steps.push('Площадь: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(S) + ' м²');
      if (inAr) steps.push('В арах: ' + fmt(S) + ' : 100 = ' + fmt(S / 100) + ' а');
      steps.push('Длина всех сторон — периметр: (' + fmt(a) + ' + ' + fmt(b) + ') × 2 = ' + fmt(a + b) + ' × 2 = ' + fmt(P) + ' м');
    }
    var u1 = inAr ? 'а' : 'м²', v1 = inAr ? S / 100 : S;
    return { kind: 'nums', html: text, fields: [{ label: u1 }, { label: 'м' }], answer: [v1, P],
      hint: 'Площадь — это длина × ширина (у квадрата сторона × сторона), а длина всех сторон — периметр. Это разные величины, и единицы у них разные.',
      explain: stepsL(steps, bold(fmt(v1) + ' ' + u1) + ' и ' + bold(fmt(P) + ' м')) };
  });

  /* ================= задачи: изгородь вокруг участка ================= */
  var FENCE_HA = [
    function (a, b) { return 'Сад, имеющий форму прямоугольника длиной ' + a + ' и шириной ' + b + ', обнесён изгородью.'; },
    function (a, b) { return 'Питомник растений — прямоугольник длиной ' + a + ' и шириной ' + b + '. Его обнесли оградой.'; },
    function (a, b) { return 'Пастбище имеет форму прямоугольника: длина ' + a + ', ширина ' + b + '. Вокруг него поставили изгородь.'; },
    function (a, b) { return 'Фермер огородил поле, длина которого ' + a + ', а ширина ' + b + '.'; },
    function (a, b) { return 'Учебно-опытное поле школы имеет длину ' + a + ' и ширину ' + b + '. Его огородили забором.'; }
  ];
  var FENCE_A = [
    function (a, b) { return 'Дачный участок прямоугольной формы имеет длину ' + a + ' и ширину ' + b + '. Его обнесли забором.'; },
    function (a, b) { return 'Огород — прямоугольник длиной ' + a + ' и шириной ' + b + '. Вокруг него поставили сетчатую ограду.'; },
    function (a, b) { return 'Школьный цветник имеет форму прямоугольника: длина ' + a + ', ширина ' + b + '. Его оградили невысоким забором.'; },
    function (a, b) { return 'Площадку для выгула собак длиной ' + a + ' и шириной ' + b + ' обнесли сеткой.'; },
    function (a, b) { return 'Садовый участок имеет длину ' + a + ' и ширину ' + b + '. Его решили огородить.'; }
  ];
  reg('pldFence', function (o) {
    o = o || {};
    var target = o.target || pick(['га', 'а']), ask = o.ask || 'both', d;
    if (target === 'га') d = dims('га', { aList: [400, 500, 600, 800, 1000, 1200], bList: [250, 300, 400, 500, 600, 800] });
    else d = dims('а', {});
    var a = d.a, b = d.b, S = d.S, P = 2 * (a + b), pr = target === 'га' ? rand(20, 120) * 5 : rand(10, 60) * 5;
    var N = toTarget(S, target), cost = P * pr, la = lenTxt(a), lb = lenTxt(b);
    var sj = pick(target === 'га' ? FENCE_HA : FENCE_A);
    var steps = [];
    if (ask === 'both') {
      steps.push('Площадь в квадратных метрах: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(S) + ' м²');
      steps.push(convLine(S, target));
    }
    steps.push('Длина изгороди — периметр: (' + fmt(a) + ' + ' + fmt(b) + ') × 2 = ' + fmt(P) + ' м');
    steps.push('Стоимость изгороди: ' + fmt(P) + ' × ' + fmt(pr) + ' = ' + fmt(cost) + ' руб.');
    var tail = ask === 'both' ? ' Определи площадь в ' + ULOCP[target] + ' и стоимость изгороди, если каждый метр её длины стоит ' + nu(pr, 'руб.') : ' Сколько рублей стоит изгородь, если каждый метр её длины стоит ' + nu(pr, 'руб.') + '?';
    var base = { html: sj(la, lb) + tail,
      hint: ask === 'both' ? 'Площадь — длина × ширина, переведённая в нужную меру. Длина изгороди — это периметр; стоимость найди умножением на цену одного метра.' : 'Длина изгороди — периметр участка. Найди его, а потом умножь на цену одного метра.' };
    if (ask === 'both') return { kind: 'nums', html: base.html, fields: [{ label: target }, { label: 'руб.' }], answer: [N, cost], hint: base.hint, explain: stepsL(steps, bold(fmt(N) + ' ' + target) + ' и ' + bold(fmt(cost) + ' руб.')) };
    return { kind: 'num', html: base.html, answer: cost, hint: base.hint, explain: stepsL(steps, ansU(cost, 'руб.')) };
  });

  /* ================= задачи: урожай ================= */
  var CROP_HA = [
    { f: 'Пшеничное поле', c: 'пшеницы', y: [20, 25, 30, 35, 40, 45] },
    { f: 'Ржаное поле', c: 'ржи', y: [20, 25, 30, 35] },
    { f: 'Поле ячменя', c: 'ячменя', y: [20, 25, 30, 35, 40] },
    { f: 'Картофельное поле', c: 'картофеля', y: [150, 180, 200, 220, 250] },
    { f: 'Поле сахарной свёклы', c: 'свёклы', y: [300, 350, 400, 450] },
    { f: 'Кукурузное поле', c: 'кукурузы', y: [40, 50, 60, 70] }
  ];
  var CROP_A = [
    { f: 'Картофельный огород', c: 'картофеля', y: [120, 150, 180, 200, 250] },
    { f: 'Грядки с капустой', c: 'капусты', y: [250, 300, 350, 400] },
    { f: 'Морковная грядка', c: 'моркови', y: [100, 150, 200, 250] },
    { f: 'Свекольная грядка', c: 'свёклы', y: [200, 250, 300] },
    { f: 'Огород с луком', c: 'лука', y: [100, 150, 200] }
  ];
  reg('pldCrop', function (o) {
    o = o || {};
    var mode = o.mode || pick(['ha', 'ha', 'ar']), d, a, b, S, N, c, y, tot, g = 0, ans, unit, steps, text, cr;
    if (mode === 'ha') {
      cr = pick(CROP_HA);
      do {
        a = pick([600, 800, 1000, 1200, 1500, 1800, 2000]); b = pick([400, 500, 600, 800, 1000, 1200, 1500]); if (a === b) continue;
        S = a * b; N = S / 10000; y = pick(cr.y); tot = N * y; g++;
      } while (g < 200 && (a === b || tot % 10 !== 0 || N > 300));
      unit = o.unit || 'т'; ans = unit === 'т' ? tot / 10 : tot;
      steps = ['Площадь поля: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(S) + ' м² = ' + fmt(N) + ' га (' + fmt(S) + ' : 10 000)', 'Урожай со всего поля: ' + fmt(y) + ' × ' + fmt(N) + ' = ' + fmt(tot) + ' ц'];
      if (unit === 'т') steps.push(fmt(tot) + ' ц = ' + fmt(tot) + ' : 10 = ' + fmt(ans) + ' т');
      text = cr.f + ' имеет форму прямоугольника: длина ' + lenTxt(a) + ', ширина ' + lenTxt(b) + '. С каждого гектара собрали ' + nu(y, 'ц') + ' ' + cr.c + '. Сколько ' + (unit === 'т' ? 'тонн' : 'центнеров') + ' ' + cr.c + ' собрали со всего поля?';
      return { kind: 'num', html: text, answer: ans,
        hint: 'Сначала найди площадь поля и вырази её в гектарах (1 га = 10 000 м²). Потом урожай с одного гектара умножь на число гектаров' + (unit === 'т' ? ', а центнеры переведи в тонны (1 т = 10 ц).' : '.'),
        explain: stepsL(steps, ansU(ans, unit)) };
    }
    cr = pick(CROP_A);
    do {
      a = rand(4, 14) * 5; b = rand(2, 10) * 5; S = a * b; N = S / 100; y = pick(cr.y); tot = N * y; g++;
    } while (g < 300 && (a === b || S % 100 !== 0 || tot % 100 !== 0 || N < 4));
    ans = tot / 100;
    steps = ['Площадь: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(S) + ' м² = ' + fmt(N) + ' а (' + fmt(S) + ' : 100)', 'Урожай: ' + fmt(y) + ' × ' + fmt(N) + ' = ' + fmt(tot) + ' кг', fmt(tot) + ' кг = ' + fmt(tot) + ' : 100 = ' + fmt(ans) + ' ц'];
    text = cr.f + ' — прямоугольник: длина ' + nu(a, 'м') + ', ширина ' + nu(b, 'м') + '. С каждого ара собрали ' + nu(y, 'кг') + ' ' + cr.c + '. Сколько центнеров ' + cr.c + ' собрали со всего участка?';
    return { kind: 'num', html: text, answer: ans,
      hint: 'Найди площадь участка в арах (1 а = 100 м²), потом умножь урожай с одного ара на число аров. Килограммы переведи в центнеры (1 ц = 100 кг).',
      explain: stepsL(steps, ansU(ans, 'ц')) };
  });

  /* ================= задачи: сено из травы ================= */
  reg('pldHay', function (o) {
    o = o || {};
    var a, b, N, y, ratio_, tot, hay, g = 0, S;
    do {
      a = pick([1000, 1200, 1500, 1600, 1800, 2000, 2400]); b = pick([600, 800, 1000, 1200, 1500, 1600, 1800]);
      N = (a / 100) * (b / 100); y = pick([30, 40, 50, 60, 80, 100, 120]); ratio_ = pick([[4, 1], [5, 1], [24, 5], [9, 2], [10, 3]]);
      tot = N * y; g++;
      hay = tot % ratio_[0] === 0 ? (tot / ratio_[0]) * ratio_[1] : -1;
    } while (g < 3000 && (a === b || hay < 0 || hay % 10 !== 0 || N > 400 || N < 30));
    S = a * b;
    var steps = ['Площадь луга: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(S) + ' м² = ' + fmt(N) + ' га (' + fmt(S) + ' : 10 000)', 'Накосили травы: ' + fmt(y) + ' × ' + fmt(N) + ' = ' + fmt(tot) + ' ц',
      'Сколько раз по ' + ratio_[0] + ' ц в этой траве: ' + fmt(tot) + ' : ' + ratio_[0] + ' = ' + fmt(tot / ratio_[0]), 'Получилось сена: ' + fmt(tot / ratio_[0]) + ' × ' + ratio_[1] + ' = ' + fmt(hay) + ' ц', fmt(hay) + ' ц = ' + fmt(hay) + ' : 10 = ' + fmt(hay / 10) + ' т'];
    return { kind: 'num', html: 'Луг имеет форму прямоугольника: длина ' + lenTxt(a) + ', ширина ' + lenTxt(b) + '. С каждого гектара накосили ' + nu(y, 'ц') + ' травы. Сколько тонн сена получится из всей травы, если из ' + nu(ratio_[0], 'ц') + ' травы выходит ' + nu(ratio_[1], 'ц') + ' сена?', answer: hay / 10,
      hint: 'Найди площадь луга в гектарах и количество травы. Потом узнай, сколько раз в нём укладывается ' + ratio_[0] + ' ц, и умножь на ' + ratio_[1] + ' ц сена. В конце центнеры переведи в тонны.',
      explain: stepsL(steps, ansU(hay / 10, 'т')) + ' Сена меньше, чем травы, потому что при сушке из травы уходит вода.' };
  });

  /* ================= задачи: часть поля под культуры ================= */
  reg('pldSow', function (o) {
    o = o || {};
    var mode = o.mode || pick(['half3', 'third', 'quarter', 'half2']), a, b, N, g = 0, S;
    var need = { half3: 6, third: 3, quarter: 4, half2: 4 }[mode];
    do {
      a = pick([600, 800, 1000, 1200, 1500, 1800, 2000, 2400]); b = pick([400, 500, 600, 800, 1000, 1200, 1500]); N = (a / 100) * (b / 100); g++;
    } while (g < 500 && (a === b || N % need !== 0 || N > 400 || N < 24));
    S = a * b;
    var head = pick(['Поле', 'Поле фермерского хозяйства', 'Поле агрофирмы']), steps = ['Площадь поля: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(S) + ' м² = ' + fmt(N) + ' га'], text, ans, last;
    var intro = head + ' имеет форму прямоугольника: длина ' + lenTxt(a) + ', ширина ' + lenTxt(b) + '. ';
    if (mode === 'half3') {
      var h = N / 2; ans = h / 3;
      text = intro + 'Половина поля засеяна пшеницей, а на остальной части посеяли рожь, овёс и клевер на равных площадях. Сколько гектаров занимает каждая из этих трёх культур?';
      steps.push('Половина поля: ' + fmt(N) + ' : 2 = ' + fmt(h) + ' га'); steps.push('Каждая из трёх культур: ' + fmt(h) + ' : 3 = ' + fmt(ans) + ' га');
    } else if (mode === 'third') {
      var t = N / 3; ans = N - t;
      text = intro + 'Третья часть поля засеяна рожью, а всё остальное — пшеницей. Сколько гектаров засеяно пшеницей?';
      steps.push('Под рожью: ' + fmt(N) + ' : 3 = ' + fmt(t) + ' га'); steps.push('Под пшеницей: ' + fmt(N) + ' − ' + fmt(t) + ' = ' + fmt(ans) + ' га');
    } else if (mode === 'quarter') {
      var q = N / 4; ans = N - q;
      text = intro + 'Четвёртую часть поля занял картофель, а на остальной земле выращивают кукурузу. Сколько гектаров занято кукурузой?';
      steps.push('Под картофелем: ' + fmt(N) + ' : 4 = ' + fmt(q) + ' га'); steps.push('Под кукурузой: ' + fmt(N) + ' − ' + fmt(q) + ' = ' + fmt(ans) + ' га');
    } else {
      var h2 = N / 2, q2 = h2 / 2; ans = q2;
      text = intro + 'Половина поля отведена под овёс, а оставшаяся часть разделена поровну между ячменём и клевером. Сколько гектаров приходится на ячмень?';
      steps.push('Под овёс: ' + fmt(N) + ' : 2 = ' + fmt(h2) + ' га'); steps.push('Остаётся ' + fmt(h2) + ' га; на ячмень половина: ' + fmt(h2) + ' : 2 = ' + fmt(q2) + ' га');
    }
    return { kind: 'num', html: text, answer: ans,
      hint: 'Найди площадь поля в гектарах (1 га = 10 000 м²), а потом по частям: какую долю поля занимает каждая культура?',
      explain: stepsL(steps, ansU(ans, 'га')) };
  });

  /* ================= задачи: семена и газон ================= */
  reg('pldSeed', function (o) {
    o = o || {};
    var mode = o.mode || pick(['field', 'field', 'lawn']), a, b, g = 0;
    if (mode === 'lawn') {
      var gm, S2, tot;
      do { a = rand(4, 20) * 5; b = rand(2, 12) * 5; gm = pick([20, 25, 30, 40, 50]); S2 = a * b; tot = S2 * gm; g++; } while (g < 500 && (a === b || tot % 1000 !== 0 || tot / 1000 < 2));
      var kg = tot / 1000;
      return { kind: 'num', html: pick(['Школьный газон', 'Газон перед домом', 'Футбольная площадка', 'Лужайка в парке']) + ' — прямоугольник ' + nu(a, 'м') + ' на ' + nu(b, 'м') + '. На каждый квадратный метр высевают ' + nu(gm, 'г') + ' семян травы. Сколько килограммов семян потребуется?', answer: kg,
        hint: 'Найди площадь газона в квадратных метрах, потом умножь на расход семян на один метр. Граммы переведи в килограммы.',
        explain: stepsL(['Площадь: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(S2) + ' м²', 'Семян: ' + fmt(S2) + ' × ' + gm + ' = ' + fmt(tot) + ' г', fmt(tot) + ' г = ' + fmt(tot) + ' : 1 000 = ' + fmt(kg) + ' кг'], ansU(kg, 'кг')) };
    }
    var cr = pick([['пшеницы', 'пшеничное', [180, 200, 220]], ['ржи', 'ржаное', [160, 180, 200]], ['овса', 'овсяное', [150, 200, 250]], ['ячменя', 'ячменное', [150, 180, 200]]]), N, ha, y, tot2, price, ask = o.ask || pick(['qty', 'cost']);
    do { a = pick([500, 600, 800, 1000, 1200, 1500]); b = pick([400, 500, 600, 800, 1000]); ha = (a / 100) * (b / 100); y = pick(cr[2]); tot2 = ha * y; g++; } while (g < 500 && (a === b || tot2 % 100 !== 0 || ha > 120));
    var S3 = a * b, steps = ['Площадь поля: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(S3) + ' м² = ' + fmt(ha) + ' га', 'Семян нужно: ' + fmt(y) + ' × ' + fmt(ha) + ' = ' + fmt(tot2) + ' кг'];
    if (ask === 'qty') {
      steps.push(fmt(tot2) + ' кг = ' + fmt(tot2) + ' : 100 = ' + fmt(tot2 / 100) + ' ц');
      return { kind: 'num', html: 'Для посева ' + cr[0] + ' отвели прямоугольное поле размером ' + lenTxt(a) + ' на ' + lenTxt(b) + '. На каждый гектар высевают ' + nu(y, 'кг') + ' семян ' + cr[0] + '. Сколько центнеров семян потребуется?', answer: tot2 / 100,
        hint: 'Площадь поля переведи в гектары, потом умножь на расход семян на гектар. Килограммы переведи в центнеры.',
        explain: stepsL(steps, ansU(tot2 / 100, 'ц')) };
    }
    price = pick([20, 25, 30, 35, 40]);
    steps.push('Стоимость: ' + fmt(tot2) + ' × ' + price + ' = ' + fmt(tot2 * price) + ' руб.');
    return { kind: 'num', html: 'Поле размером ' + lenTxt(a) + ' на ' + lenTxt(b) + ' засевают семенами ' + cr[0] + '. На каждый гектар высевают ' + nu(y, 'кг') + ' семян. Один килограмм семян стоит ' + nu(price, 'руб.') + ' Сколько рублей стоят все семена?', answer: tot2 * price,
      hint: 'Найди площадь поля в гектарах, затем массу семян в килограммах и только потом стоимость.',
      explain: stepsL(steps, ansU(tot2 * price, 'руб.')) };
  });

  /* ================= работа над ошибками: найди верный ответ (num) ================= */
  var FIX_FACT = [   /* ученик думает, что в крупной мере wrong мелких, на самом деле right */
    ['га', 'м²', 100, 10000], ['а', 'м²', 10, 100], ['м²', 'дм²', 10, 100], ['м²', 'см²', 100, 10000], ['га', 'а', 10, 100], ['дм²', 'см²', 10, 100]
  ];
  var FIX = {
    zero: function () {
      var pr = pick([['а', 'м²', 100], ['га', 'а', 100]]), b = rand(2, 29), s = rand(1, 9), t = b * pr[2] + s;
      return { t: 'Ученик записал: ' + expr(nu(b, pr[0]) + ' ' + nu(s, pr[1]) + ' = ' + (b * 10 + s) + ' ' + pr[1]) + '<br>Запиши верный ответ (в ' + ULOCP[pr[1]] + ').', ans: t,
        h: 'В одной крупной мере ' + fmt(pr[2]) + ' мелких, а остаток записывается двумя цифрами. Если остаток меньше десяти, на месте десятков стоит нуль.',
        e: nu(b, pr[0]) + ' = ' + fmt(b * pr[2]) + ' ' + pr[1] + '. Прибавляем ' + s + ': ' + fmt(b * pr[2]) + ' + ' + s + ' = ' + fmt(t) + ' ' + pr[1] + '. Ученик потерял нуль: остаток ' + s + ' занимает два места, поэтому записывается как 0' + s + ', то есть не ' + b + s + ', а ' + b + '0' + s + '.' };
    },
    div: function () {
      var pr = pick([['м²', 'га', 10000], ['м²', 'а', 100]]), q = rand(2, 9), N = q * pr[2];
      var wrongQ = pr[2] === 10000 ? N / 1000 : N / 10;
      return { t: 'Ученик перевёл ' + nu(N, 'м²') + ' в ' + (pr[1] === 'га' ? 'гектары' : 'ары') + ' и получил ' + nu(wrongQ, pr[1]) + '. Сколько на самом деле ' + (pr[1] === 'га' ? 'гектаров' : 'аров') + ' в ' + nu(N, 'м²') + '?', ans: q,
        h: 'Вспомни, сколько квадратных метров в одном ' + (pr[1] === 'га' ? 'гектаре' : 'аре') + ', и раздели на это число.',
        e: '1 ' + pr[1] + ' = ' + fmt(pr[2]) + ' м², поэтому ' + fmt(N) + ' : ' + fmt(pr[2]) + ' = ' + q + ' ' + pr[1] + '. Ученик делил не на ' + fmt(pr[2]) + ', а на ' + fmt(pr[2] === 10000 ? 1000 : 10) + '.' };
    },
    perim: function () {
      var a = pick([20, 30, 40, 50, 60, 70, 80, 90, 100]);
      return { t: 'Ученик искал площадь квадрата со стороной ' + nu(a, 'м') + ' и записал: ' + expr(a + ' × 4 = ' + fmt(a * 4) + ' м²') + '<br>Найди верную площадь (в квадратных метрах).', ans: a * a,
        h: 'Умножение стороны на 4 — это другая величина. Какая? А площадь квадрата как найти?',
        e: 'Сторону умножают на 4, когда ищут периметр. Площадь квадрата — сторона, умноженная на сторону: ' + a + ' × ' + a + ' = ' + fmt(a * a) + ' м².' };
    },
    perim2: function () {
      var a = rand(4, 30) * 5, b = rand(2, 15) * 5; if (b >= a) b = a - 5;
      return { t: 'Ученик искал периметр прямоугольника ' + nu(a, 'м') + ' на ' + nu(b, 'м') + ' и записал: ' + expr(a + ' × ' + b + ' = ' + fmt(a * b) + ' м') + '<br>Найди верный периметр (в метрах).', ans: 2 * (a + b),
        h: 'Произведение сторон — это площадь. Периметр — это сумма длин всех четырёх сторон.',
        e: 'Периметр: (' + a + ' + ' + b + ') × 2 = ' + (a + b) + ' × 2 = ' + 2 * (a + b) + ' м. Ученик перемножил стороны — это площадь, а не периметр.' };
    },
    units: function () {
      var a = rand(1, 3), b = rand(2, 9) * 100, ha = a * b / 10;
      return { t: 'Поле имеет длину ' + nu(a, 'км') + ' и ширину ' + nu(b, 'м') + '. Ученик записал: ' + expr(a + ' × ' + b + ' = ' + fmt(a * b) + ' м²') + '<br>Найди верную площадь в гектарах.', ans: ha,
        h: 'Перемножать можно только числа в одинаковых единицах. Сначала переведи километры в метры.',
        e: nu(a, 'км') + ' = ' + fmt(a * 1000) + ' м. Площадь: ' + fmt(a * 1000) + ' × ' + fmt(b) + ' = ' + fmt(a * 1000 * b) + ' м² = ' + fmt(a * 1000 * b) + ' : 10 000 = ' + fmt(ha) + ' га. Ученик умножил числа ' + a + ' и ' + b + ', хотя километры и метры — разные единицы.' };
    },
    fact: function () {
      var f = pick(FIX_FACT), n = rand(2, 9), A = f[0], B = f[1];
      return { t: 'Ученик думает, что в одном ' + ULOC[A] + ' ' + fmt(f[2]) + ' ' + UACC[B] + '. Сколько ' + UACC[B] + ' на самом деле в ' + nu(n, A) + '?', ans: n * f[3],
        h: 'Проверь по рисунку: квадрат со стороной в 1 ' + A + ' разложи на ряды квадратов в 1 ' + B + '. Сколько рядов и сколько квадратов в ряду?',
        e: 'Верно: ' + factChain(A, B) + '. Число ' + fmt(f[2]) + ' — это отношение сторон (длин), а для площадей его надо умножить само на себя. Значит, ' + nu(n, A) + ' = ' + n + ' × ' + fmt(f[3]) + ' = ' + fmt(n * f[3]) + ' ' + B + '.' };
    },
    ct: function () {
      var q = rand(3, 90) * 10, N = q * 10;
      return { t: 'С поля собрали ' + nu(N, 'ц') + ' пшеницы. Ученик записал в ответе ' + nu(N, 'т') + '. Сколько тонн на самом деле собрали?', ans: q,
        h: 'Сколько центнеров в одной тонне?',
        e: '1 т = 10 ц, поэтому ' + fmt(N) + ' ц = ' + fmt(N) + ' : 10 = ' + fmt(q) + ' т. Ученик не перевёл центнеры в тонны.' };
    },
    ha: function () {
      var a = pick([200, 300, 400, 500, 600, 800, 1000]), b = pick([100, 200, 300, 400, 500, 600]), S = a * b, ha = S / 10000;
      return { t: 'Участок имеет размеры ' + nu(a, 'м') + ' на ' + nu(b, 'м') + '. Ученик вычислил ' + expr(a + ' × ' + b + ' = ' + fmt(S)) + ' и написал: «Площадь ' + fmt(S) + ' га». Сколько гектаров в этом участке на самом деле?', ans: ha,
        h: 'Произведение длины и ширины, выраженных в метрах, даёт квадратные метры. Их надо перевести в гектары.',
        e: 'Получилось ' + fmt(S) + ' м², а не гектаров. 1 га = 10 000 м², поэтому ' + fmt(S) + ' : 10 000 = ' + fmt(ha) + ' га.' };
    }
  };
  reg('ldFix', function (o) {
    o = o || {};
    var keys = o.kinds || Object.keys(FIX), k = pick(keys), r = FIX[k]();
    return { kind: 'num', html: r.t, answer: r.ans, hint: r.h, explain: r.e + ' Ответ: ' + bold(fmt(r.ans)) + '.' };
  });

  /* ================= верно ли равенство? (choice) ================= */
  reg('ldVerdict', function (o) {
    o = o || {};
    var ok = o.truth == null ? Math.random() < 0.5 : !!o.truth, v = o.v || pick(['ha', 'ar', 'zero', 'down', 'sq', 'km']), line, right, why;
    if (v === 'ha') {
      var n = rand(2, 40), r = n * 100, w = pick([n * 10, n * 1000]);
      right = nu(n, 'га') + ' = ' + nu(r, 'а'); line = ok ? right : nu(n, 'га') + ' = ' + nu(w, 'а');
      why = '1 га = 100 а, поэтому ' + nu(n, 'га') + ' = ' + n + ' × 100 = ' + fmt(r) + ' а.';
    } else if (v === 'ar') {
      var n2 = rand(2, 60), r2 = n2 * 100, w2 = pick([n2 * 10, n2 * 1000]);
      right = nu(n2, 'а') + ' = ' + nu(r2, 'м²'); line = ok ? right : nu(n2, 'а') + ' = ' + nu(w2, 'м²');
      why = '1 а = 100 м², поэтому ' + nu(n2, 'а') + ' = ' + n2 + ' × 100 = ' + fmt(r2) + ' м².';
    } else if (v === 'zero') {
      var b = rand(2, 40), s = rand(1, 9), t = b * 100 + s;
      right = nu(b, 'а') + ' ' + nu(s, 'м²') + ' = ' + nu(t, 'м²'); line = ok ? right : nu(b, 'а') + ' ' + nu(s, 'м²') + ' = ' + nu(b * 10 + s, 'м²');
      why = nu(b, 'а') + ' = ' + fmt(b * 100) + ' м², и ещё ' + s + ' м²: ' + fmt(b * 100) + ' + ' + s + ' = ' + fmt(t) + ' м². Между ' + b + ' и ' + s + ' нужен нуль.';
    } else if (v === 'down') {
      var q = rand(2, 40), N = q * 100, wq = pick([q * 10, Math.round(q / 10) || q + 1, q * 100]); if (wq === q) wq = q * 10;
      right = nu(N, 'м²') + ' = ' + nu(q, 'а'); line = ok ? right : nu(N, 'м²') + ' = ' + nu(wq, 'а');
      why = '1 а = 100 м², поэтому ' + fmt(N) + ' : 100 = ' + q + ' а.';
    } else if (v === 'sq') {
      var pr = pick([['м²', 'дм²'], ['дм²', 'см²'], ['см²', 'мм²']]), nn = rand(2, 30), rr = nn * 100, ww = nn * 10;
      right = nu(nn, pr[0]) + ' = ' + nu(rr, pr[1]); line = ok ? right : nu(nn, pr[0]) + ' = ' + nu(ww, pr[1]);
      why = '1 ' + pr[0] + ' = 100 ' + pr[1] + ' (а не 10: 10 — это отношение длин сторон). Поэтому ' + nu(nn, pr[0]) + ' = ' + nn + ' × 100 = ' + fmt(rr) + ' ' + pr[1] + '.';
    } else {
      var k2 = rand(2, 30), rk = k2 * 100, wk = pick([k2 * 10, k2 * 1000]);
      right = nu(k2, 'км²') + ' = ' + nu(rk, 'га'); line = ok ? right : nu(k2, 'км²') + ' = ' + nu(wk, 'га');
      why = '1 км² = 100 га, поэтому ' + nu(k2, 'км²') + ' = ' + k2 + ' × 100 = ' + fmt(rk) + ' га.';
    }
    return { kind: 'choice', html: 'Верно ли равенство?<br>' + expr(line), options: ['Верно', 'Неверно'], answer: ok ? 0 : 1, wide: false,
      hint: 'Вспомни, во сколько раз крупная мера больше мелкой, и проверь умножением или делением.',
      explain: (ok ? 'Равенство верно. ' : 'Равенство неверно. Правильно: ' + right + '. ') + why };
  });

  /* ================= устно: возрасты ================= */
  var AGE_SJ = [
    { lab: ['старший брат', 'сестра', 'младший брат'], t: function (s1, s2, s3) { return 'Старшему брату и сестре вместе ' + yrs(s1) + ', старшему и младшему братьям вместе ' + yrs(s2) + ', а сестре и младшему брату вместе ' + yrs(s3) + '. Сколько лет каждому?'; },
      who: ['старший брат', 'сестра', 'младший брат'] },
    { lab: ['Миша', 'Лена', 'Коля'], t: function (s1, s2, s3) { return 'Мише и Лене вместе ' + yrs(s1) + ', Мише и Коле вместе ' + yrs(s2) + ', Лене и Коле вместе ' + yrs(s3) + '. Сколько лет каждому?'; },
      who: ['Миша', 'Лена', 'Коля'] },
    { lab: ['Оля', 'Паша', 'Таня'], t: function (s1, s2, s3) { return 'Оле и Паше вместе ' + yrs(s1) + ', Оле и Тане вместе ' + yrs(s2) + ', Паше и Тане вместе ' + yrs(s3) + '. Сколько лет каждому?'; },
      who: ['Оля', 'Паша', 'Таня'] }
  ];
  function yrs(n) { return n + ' ' + plur(n, 'год', 'года', 'лет'); }
  reg('ldAgeTrio', function (o) {
    o = o || {};
    var sj = pick(AGE_SJ), z, x, y, g = 0;
    do { z = rand(5, 11); x = z + rand(1, 4); y = rand(z - 1, x + 2); g++; } while (g < 100 && (y === x || y === z || y < 4));
    /* x — первый, y — второй, z — третий; суммы: x+y, x+z, y+z */
    var s1 = x + y, s2 = x + z, s3 = y + z, tot = (s1 + s2 + s3) / 2;
    return { kind: 'nums', html: sj.t(s1, s2, s3), fields: sj.lab.map(function (l) { return { label: l }; }), answer: [x, y, z],
      hint: 'Сложи все три суммы: в этой сумме возраст каждого из ребят встречается два раза. Что получится, если разделить её пополам?',
      explain: stepsL(['Сложим три суммы: ' + s1 + ' + ' + s2 + ' + ' + s3 + ' = ' + (s1 + s2 + s3) + ' — возраст каждого посчитан дважды', 'Все трое вместе: ' + (s1 + s2 + s3) + ' : 2 = ' + tot + ' ' + plur(tot, 'год', 'года', 'лет'),
        sj.who[0] + ': ' + tot + ' − ' + s3 + ' = ' + x, sj.who[1] + ': ' + tot + ' − ' + s2 + ' = ' + y, sj.who[2] + ': ' + tot + ' − ' + s1 + ' = ' + z], bold(x + ', ' + y + ' и ' + z)) };
  });

  reg('ldAgeFather', function (o) {
    o = o || {};
    var z = rand(5, 12), d = rand(2, 9), f = rand(22, 31), v = o.v || pick(['son', 'daughter']), ans = f + d + z;
    var t = v === 'son' ? 'Младшему сыну ' + yrs(z) + '. Он моложе своего старшего брата на ' + yrs(d) + '. Когда родился старший сын, отцу было ' + yrs(f) + '. Сколько лет отцу сейчас?'
      : 'Младшей дочери ' + yrs(z) + ', она младше сестры на ' + yrs(d) + '. Когда родилась старшая дочь, маме было ' + yrs(f) + '. Сколько лет маме сейчас?';
    var who = v === 'son' ? 'отцу' : 'маме';
    return { kind: 'num', html: t, answer: ans,
      hint: 'Сколько лет прошло с рождения старшего ребёнка до рождения младшего, а потом до сегодняшнего дня?',
      explain: stepsL(['Когда родился старший ребёнок, ' + who + ' было ' + f + ' ' + plur(f, 'год', 'года', 'лет'), 'Младший ребёнок родился на ' + d + ' ' + plur(d, 'год', 'года', 'лет') + ' позже: ' + f + ' + ' + d + ' = ' + (f + d), 'С тех пор прошло ещё ' + z + ' ' + plur(z, 'год', 'года', 'лет') + ': ' + (f + d) + ' + ' + z + ' = ' + ans], bold(ans + ' ' + plur(ans, 'год', 'года', 'лет'))) };
  });

  /* ================= устно: круглим числа ================= */
  reg('ldRoundAdd', function (o) {
    o = o || {};
    var h = rand(2, 9) * 100, d = pick([10, 20, 30]), x = h - d, y, g = 0;
    do { y = rand(11, 49) * 10; g++; } while (g < 50 && x + y > 1000);
    var first = Math.random() < 0.5, ans = x + y;
    return { kind: 'num', html: expr(first ? x + ' + ' + y + ' =' : y + ' + ' + x + ' ='), answer: ans,
      hint: 'Число ' + x + ' чуть меньше круглого. Прибавь вместо него ' + h + ', а потом вычти лишнее.',
      explain: x + ' = ' + h + ' − ' + d + '. Поэтому ' + x + ' + ' + y + ' = ' + h + ' + ' + y + ' − ' + d + ' = ' + (h + y) + ' − ' + d + ' = ' + ans + '.' };
  });
  reg('ldRoundMul', function (o) {
    o = o || {};
    var h = pick([200, 300, 400, 500]), d = pick([10, 20, 30]), x = h - d, k = rand(2, 6), ans = x * k;
    return { kind: 'num', html: expr(x + ' × ' + k + ' ='), answer: ans,
      hint: 'Замени ' + x + ' разностью круглого числа и небольшого: ' + x + ' = ' + h + ' − ' + d + '. Потом умножь каждое на ' + k + '.',
      explain: x + ' × ' + k + ' = (' + h + ' − ' + d + ') × ' + k + ' = ' + h + ' × ' + k + ' − ' + d + ' × ' + k + ' = ' + fmt(h * k) + ' − ' + (d * k) + ' = ' + fmt(ans) + '.' };
  });
  reg('ldSplitDiv', function (o) {
    o = o || {};
    var d = pick([2, 3, 4, 5, 6, 8]), q1 = pick([20, 30, 40, 50, 60, 100, 110, 120]), q2 = rand(1, 9), minus = Math.random() < 0.4, A, r, N, ans, g = 0;
    do { q1 = pick([20, 30, 40, 50, 60, 100, 110, 120]); A = d * q1; r = d * q2; N = minus ? A - r : A + r; ans = minus ? q1 - q2 : q1 + q2; g++; } while (g < 100 && (N < 100 || N > 1000));
    return { kind: 'num', html: expr(fmt(N) + ' : ' + d + ' ='), answer: ans,
      hint: 'Представь ' + fmt(N) + ' как сумму или разность двух чисел, которые легко делятся на ' + d + ': ' + fmt(A) + ' и ' + r + '.',
      explain: fmt(N) + ' = ' + fmt(A) + (minus ? ' − ' : ' + ') + r + '. Делим каждую часть: ' + fmt(A) + ' : ' + d + ' = ' + q1 + ', ' + r + ' : ' + d + ' = ' + q2 + '. Итого ' + q1 + (minus ? ' − ' : ' + ') + q2 + ' = ' + ans + '.' };
  });

  /* ================= устно: на сколько больше и во сколько раз ================= */
  reg('ldHowMuch', function (o) {
    o = o || {};
    var u = pick(o.units || ['км', 'м', 'кг', 'т', 'ц', 'руб.', 'см']), b = rand(2, 15), k = rand(3, 12), a = b * k;
    return { kind: 'nums', html: 'На сколько ' + nu(a, u) + ' больше, чем ' + nu(b, u) + '? Во сколько раз ' + nu(a, u) + ' больше, чем ' + nu(b, u) + '?', fields: [{ label: u }, { label: 'раз' }], answer: [a - b, k],
      hint: 'Чтобы узнать, на сколько больше, надо вычесть. Чтобы узнать, во сколько раз больше, надо разделить большее на меньшее.',
      explain: stepsL(['На сколько больше: ' + a + ' − ' + b + ' = ' + (a - b) + ' ' + u, 'Во сколько раз больше: ' + a + ' : ' + b + ' = ' + k], bold((a - b) + ' ' + u) + ' и ' + bold(k + ' ' + plur(k, 'раз', 'раза', 'раз'))) };
  });

  /* ================= устно: действия с одним именованным числом ================= */
  var NP = ['м-см', 'руб-коп', 'кг-г', 'ц-кг', 'т-кг', 'км-м'];
  reg('ldNamedOp', function (o) {
    o = o || {};
    var P = PAIRS[pick(o.pairs || NP)], type = o.type || pick(['inc', 'dec', 'mul', 'div']), t, A, dd, k, text, line;
    if (type === 'inc') {
      A = mkQ(P, 1, 9); dd = P.f === 100 ? rand(2, 19) * 5 : rand(2, 19) * 50; t = A.t + dd;
      text = 'Увеличь ' + nm(P, A.b, A.s) + ' на ' + nu(dd, P.small) + '.';
      line = toSm(P, A.b, A.s) + '; ' + fmt(A.t) + ' + ' + fmt(dd) + ' = ' + fmt(t) + ' ' + P.small;
    } else if (type === 'dec') {
      A = mkQ(P, 1, 9); if (Math.random() < 0.4) A = { b: rand(1, 5), s: 0, t: 0 }, A.t = A.b * P.f;
      dd = P.f === 100 ? rand(2, 19) * 5 : rand(2, 19) * 50; t = A.t - dd;
      text = 'Уменьши ' + (A.s ? nm(P, A.b, A.s) : nu(A.b, P.big)) + ' на ' + nu(dd, P.small) + '.';
      line = (A.s ? toSm(P, A.b, A.s) : nu(A.b, P.big) + ' = ' + nu(A.t, P.small)) + '; ' + fmt(A.t) + ' − ' + fmt(dd) + ' = ' + fmt(t) + ' ' + P.small;
    } else if (type === 'mul') {
      A = mkQ(P, 1, 30); k = rand(2, 5); t = A.t * k;
      text = 'Увеличь ' + nm(P, A.b, A.s) + ' в ' + k + ' ' + plur(k, 'раз', 'раза', 'раз') + '.';
      line = toSm(P, A.b, A.s) + '; ' + fmt(A.t) + ' × ' + k + ' = ' + fmt(t) + ' ' + P.small;
    } else {
      k = pick([2, 3, 4, 5, 10]); var X = Math.random() < 0.5 ? { b: rand(1, 3), s: 0 } : mkQ(P, 0, 4); X.t = X.b * P.f + X.s; if (X.t < 5) X.t = 5;
      A = { t: X.t * k }; A.b = Math.floor(A.t / P.f); A.s = A.t % P.f; t = X.t;
      text = 'Уменьши ' + nf(P, A.t) + ' в ' + k + ' ' + plur(k, 'раз', 'раза', 'раз') + '.';
      line = nf(P, A.t) + ' = ' + fmt(A.t) + ' ' + P.small + '; ' + fmt(A.t) + ' : ' + k + ' = ' + fmt(t) + ' ' + P.small;
    }
    if (t >= P.f) {
      return { kind: 'nums', html: text, fields: fieldsOf(P), answer: [Math.floor(t / P.f), t % P.f],
        hint: 'Выполни действие в мелких единицах (' + P.fact + '), а потом запиши результат крупными и мелкими мерами.',
        explain: line + ' = ' + nf(P, t) + '. Ответ: ' + bold(nf(P, t)) + '.' };
    }
    return { kind: 'num', html: text + ' Ответ запиши в ' + LOCP[P.small] + '.', answer: t,
      hint: 'Выполни действие в мелких единицах (' + P.fact + ').',
      explain: line + '. Ответ: ' + ansU(t, P.small) + '.' };
  });

  /* ================= «на счётах»: сложение и вычитание составных чисел ================= */
  reg('ldNamedAS', function (o) {
    o = o || {};
    var P = PAIRS[pick(o.pairs || ['руб-коп', 'руб-коп', 'м-см', 'кг-г', 'т-кг', 'км-м'])], op = o.op || pick(['+', '-']), a, b, g = 0, tA, tB;
    do {
      a = mkQ(P, 2, 60); b = mkQ(P, 2, 60); g++;
      if (op === '+') { var carry = a.s + b.s >= P.f; if (!carry && Math.random() < 0.8) continue; break; }
      else { if (a.t <= b.t) continue; var bor = a.s < b.s; if (!bor && Math.random() < 0.8) continue; break; }
    } while (g < 300);
    if (op === '-' && a.t <= b.t) { var tmp = a; a = b; b = tmp; }
    tA = a.t; tB = b.t;
    var res = op === '+' ? tA + tB : tA - tB, rs = res % P.f, rb = Math.floor(res / P.f), steps = [];
    if (op === '+') {
      var sm = a.s + b.s;
      steps.push(P.small + ': ' + a.s + ' + ' + b.s + ' = ' + sm + (sm >= P.f ? ' = 1 ' + P.big + ' ' + (sm - P.f) + ' ' + P.small : ''));
      steps.push(P.big + ': ' + a.b + ' + ' + b.b + (sm >= P.f ? ' + 1' : '') + ' = ' + (a.b + b.b + (sm >= P.f ? 1 : 0)));
    } else if (a.s >= b.s) {
      steps.push(P.small + ': ' + a.s + ' − ' + b.s + ' = ' + (a.s - b.s));
      steps.push(P.big + ': ' + a.b + ' − ' + b.b + ' = ' + (a.b - b.b));
    } else {
      steps.push(a.s + ' ' + P.small + ' меньше, чем ' + b.s + ' ' + P.small + ', поэтому займём 1 ' + P.big + ' = ' + fmt(P.f) + ' ' + P.small + ': ' + (a.s + P.f) + ' − ' + b.s + ' = ' + (a.s + P.f - b.s) + ' ' + P.small);
      steps.push(P.big + ': ' + (a.b - 1) + ' − ' + b.b + ' = ' + (a.b - 1 - b.b) + ' (одну единицу заняли)');
    }
    return { kind: 'nums', html: 'Вычисли:<br>' + expr(nm(P, a.b, a.s) + (op === '+' ? ' + ' : ' − ') + nm(P, b.b, b.s) + ' ='), fields: fieldsOf(P), answer: [rb, rs],
      hint: op === '+' ? 'Складывай отдельно ' + (P.small === 'коп.' ? 'копейки' : 'мелкие меры') + ' и крупные. Если мелких стало ' + fmt(P.f) + ' и больше — перенеси их в крупные.' : 'Вычитай отдельно мелкие и крупные меры. Если мелких не хватает — займи одну крупную меру.',
      explain: stepsL(steps, bold(nf(P, res))) };
  });

  /* ================= выражения с составными именованными числами ================= */
  function opLn(P, x, sym, y, r) { return nf(P, x) + ' ' + sym + ' ' + nf(P, y) + ' = ' + nu(x, P.small) + ' ' + sym + ' ' + nu(y, P.small) + ' = ' + backLn(P, r); }
  function mulLn(P, x, k, r) { return nf(P, x) + ' × ' + k + ' = ' + nu(x, P.small) + ' × ' + k + ' = ' + backLn(P, r); }
  function divLn(P, x, k, r) { return nf(P, x) + ' : ' + k + ' = ' + nu(x, P.small) + ' : ' + k + ' = ' + backLn(P, r); }
  var NE_PAIRS = ['м-см', 'кг-г', 'т-кг', 'ц-кг', 'руб-коп', 'км-м'];
  reg('ldNExpr', function (o) {
    o = o || {};
    var P = PAIRS[pick(o.pairs || NE_PAIRS)], tpl = o.tpl || pick(['ms', 'md', 'am', 'ad', 'aa']), tries = 0, A, B, C, k, sym, m, res, disp, steps, i, divs;
    while (tries++ < 2000) {
      A = mkQ(P, 2, 25); B = mkQ(P, 1, 15); C = mkQ(P, 1, 12); k = rand(2, 9); sym = Math.random() < 0.5 ? '+' : '−';
      if (tpl === 'ms') {
        if (sym === '−' && A.t <= B.t) continue;
        m = sym === '+' ? A.t + B.t : A.t - B.t; res = m * k;
        disp = '(' + nm(P, A.b, A.s) + ' ' + sym + ' ' + nm(P, B.b, B.s) + ') × ' + k;
        steps = ['В скобках: ' + opLn(P, A.t, sym, B.t, m), 'Умножаем: ' + mulLn(P, m, k, res)];
      } else if (tpl === 'md') {
        if (sym === '−' && A.t <= B.t) continue;
        m = sym === '+' ? A.t + B.t : A.t - B.t; divs = [2, 3, 4, 5, 6, 8, 9].filter(function (d) { return m % d === 0; });
        if (!divs.length) continue;
        k = pick(divs); res = m / k;
        disp = '(' + nm(P, A.b, A.s) + ' ' + sym + ' ' + nm(P, B.b, B.s) + ') : ' + k;
        steps = ['В скобках: ' + opLn(P, A.t, sym, B.t, m), 'Делим: ' + divLn(P, m, k, res)];
      } else if (tpl === 'am') {
        m = B.t * k; if (sym === '−' && A.t <= m) continue;
        res = sym === '+' ? A.t + m : A.t - m;
        disp = nm(P, A.b, A.s) + ' ' + sym + ' ' + nm(P, B.b, B.s) + ' × ' + k;
        steps = ['Сначала умножаем: ' + mulLn(P, B.t, k, m), 'Потом ' + (sym === '+' ? 'складываем' : 'вычитаем') + ': ' + opLn(P, A.t, sym, m, res)];
      } else if (tpl === 'ad') {
        divs = [2, 3, 4, 5, 6, 8].filter(function (d) { return B.t % d === 0; });
        if (!divs.length) continue;
        k = pick(divs); m = B.t / k; if (sym === '−' && A.t <= m) continue;
        res = sym === '+' ? A.t + m : A.t - m;
        disp = nm(P, A.b, A.s) + ' ' + sym + ' ' + nm(P, B.b, B.s) + ' : ' + k;
        steps = ['Сначала делим: ' + divLn(P, B.t, k, m), 'Потом ' + (sym === '+' ? 'складываем' : 'вычитаем') + ': ' + opLn(P, A.t, sym, m, res)];
      } else {
        m = A.t + B.t; if (m <= C.t) continue; res = m - C.t;
        disp = nm(P, A.b, A.s) + ' + ' + nm(P, B.b, B.s) + ' − ' + nm(P, C.b, C.s);
        steps = ['Слева направо: ' + opLn(P, A.t, '+', B.t, m), 'Дальше: ' + opLn(P, m, '−', C.t, res)];
      }
      if (res >= P.f && res % P.f !== 0 && res < 100 * P.f) break;
    }
    return { kind: 'nums', html: 'Вычисли:<br>' + expr(disp + ' ='), fields: fieldsOf(P), answer: [Math.floor(res / P.f), res % P.f],
      hint: 'Определи порядок действий: сначала скобки, потом умножение и деление, потом сложение и вычитание. Удобно считать в мелких единицах (' + P.fact + ').',
      explain: stepsL(steps, bold(nf(P, res))) };
  });

  /* ================= составные задачи: покупки (деньги) ================= */
  var PR = PAIRS['руб-коп'];
  function rubQ(lo, hi) { return mkQ(PR, lo, hi); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function timesW(k) { return k + ' ' + plur(k, 'раз', 'раза', 'раз'); }
  var SH_CH = [
    { w: 'Аня купила', n: ['тетрадь', 'тетради', 'тетрадей'], p1: [12, 40], o: 'ручку', p2: [18, 55] },
    { w: 'Дима купил', n: ['альбом', 'альбома', 'альбомов'], p1: [30, 90], o: 'набор красок', p2: [60, 140] },
    { w: 'Оля купила', n: ['булочка', 'булочки', 'булочек'], p1: [25, 60], o: 'стакан сока', p2: [40, 90] },
    { w: 'Для кружка купили', n: ['открытка', 'открытки', 'открыток'], p1: [15, 40], o: 'коробку конвертов', p2: [60, 120] },
    { w: 'Миша купил', n: ['билет', 'билета', 'билетов'], p1: [120, 380], o: 'программку', p2: [15, 40] }
  ];
  var SH_KG = [
    { a: 'яблок', b: 'груш', p1: [60, 130], p2: [90, 180] },
    { a: 'огурцов', b: 'помидоров', p1: [80, 150], p2: [110, 220] },
    { a: 'сыра', b: 'колбасы', p1: [380, 620], p2: [320, 540] },
    { a: 'печенья', b: 'конфет', p1: [120, 260], p2: [200, 380] },
    { a: 'картофеля', b: 'моркови', p1: [30, 60], p2: [35, 70] }
  ];
  var SH_SET = [
    { set: 'Костюм', parts: 'пиджака, брюк и жилета', a: 'Пиджак стоит', b: 'брюки', c: 'жилет', ch: 'пиджака', q: 'Сколько стоит весь костюм?', pr: [2200, 4800], dd: [400, 900] },
    { set: 'Спортивный комплект', parts: 'куртки, брюк и кепки', a: 'Куртка стоит', b: 'брюки', c: 'кепка', ch: 'куртки', q: 'Сколько стоит весь комплект?', pr: [1800, 3600], dd: [300, 700] },
    { set: 'Школьная форма', parts: 'пиджака, юбки и жилета', a: 'Пиджак стоит', b: 'юбка', c: 'жилет', ch: 'пиджака', q: 'Сколько стоит вся форма?', pr: [1900, 3400], dd: [300, 800] },
    { set: 'Набор мебели для детской', parts: 'шкафа, стола и стула', a: 'Шкаф стоит', b: 'стол', c: 'стул', ch: 'шкафа', q: 'Сколько стоит весь набор?', pr: [4000, 7600], dd: [800, 1900] }
  ];
  var SH_BU = [
    { who: 'На школьный праздник выделили', t1: 'на воздушные шары', t2: 'на призы', t3: 'на угощение', k: [2, 3] },
    { who: 'Для поездки класса собрали', t1: 'на билеты', t2: 'на экскурсию', t3: 'на обед', k: [2, 3] },
    { who: 'На ремонт спортивного уголка выделили', t1: 'на краску', t2: 'на инструменты', t3: 'на сетку', k: [2, 3] },
    { who: 'Родительский комитет собрал', t1: 'на подарки', t2: 'на цветы', t3: 'на торт', k: [2, 3] }
  ];
  reg('pldShop', function (o) {
    o = o || {};
    var P = PR, form = o.form || pick(['change', 'total', 'suit', 'budget']), res, text, steps, hint, g = 0;
    if (form === 'change') {
      var s = pick(SH_CH), k = rand(2, 6), p1 = rubQ(s.p1[0], s.p1[1]), p2 = rubQ(s.p2[0], s.p2[1]), tot = p1.t * k + p2.t;
      var cashR = [100, 200, 500, 1000, 2000, 5000].filter(function (x) { return x * 100 > tot; })[0];
      res = cashR * 100 - tot;
      text = s.w + ' ' + k + ' ' + plur(k, s.n[0], s.n[1], s.n[2]) + ' по ' + nm(P, p1.b, p1.s) + ' и ' + s.o + ' за ' + nm(P, p2.b, p2.s) + '. Сколько сдачи получили с ' + nu(cashR, 'руб.') + '?';
      steps = ['Стоимость ' + k + ' ' + plur(k, s.n[0], s.n[1], s.n[2]) + ': ' + mulLn(P, p1.t, k, p1.t * k), 'Вся покупка: ' + opLn(P, p1.t * k, '+', p2.t, tot), 'Сдача: ' + nu(cashR, 'руб.') + ' − ' + nf(P, tot) + ' = ' + nu(cashR * 100, 'коп.') + ' − ' + nu(tot, 'коп.') + ' = ' + backLn(P, res)];
      hint = 'Сначала узнай, сколько стоят все одинаковые покупки, потом всю покупку целиком. Сдача — это разность между деньгами и стоимостью покупки.';
    } else if (form === 'total') {
      var q = pick(SH_KG), m1 = rand(2, 5), m2 = rand(2, 4), c1 = rubQ(q.p1[0], q.p1[1]), c2 = rubQ(q.p2[0], q.p2[1]);
      res = c1.t * m1 + c2.t * m2;
      text = 'Купили ' + m1 + ' кг ' + q.a + ' по ' + nm(P, c1.b, c1.s) + ' за 1 кг и ' + m2 + ' кг ' + q.b + ' по ' + nm(P, c2.b, c2.s) + ' за 1 кг. Сколько всего заплатили?';
      steps = ['За ' + q.a + ': ' + mulLn(P, c1.t, m1, c1.t * m1), 'За ' + q.b + ': ' + mulLn(P, c2.t, m2, c2.t * m2), 'Всего: ' + opLn(P, c1.t * m1, '+', c2.t * m2, res)];
      hint = 'Найди стоимость каждого товара: цену за 1 кг умножь на число килограммов. Потом сложи.';
    } else if (form === 'suit') {
      var u = pick(SH_SET), kk = pick([2, 3, 4]), J;
      do { J = rubQ(u.pr[0], u.pr[1]); g++; } while (g < 200 && J.t % kk !== 0);
      var D = rubQ(u.dd[0], u.dd[1]), tr = J.t - D.t, vest = J.t / kk;
      res = J.t + tr + vest;
      text = u.set + ' состоит из ' + u.parts + '. ' + u.a + ' ' + nm(P, J.b, J.s) + ', ' + u.b + ' на ' + nm(P, D.b, D.s) + ' дешевле ' + u.ch + ', а ' + u.c + ' в ' + timesW(kk) + ' дешевле ' + u.ch + '. ' + u.q;
      steps = [cap(u.b) + ': ' + opLn(P, J.t, '−', D.t, tr), cap(u.c) + ': ' + divLn(P, J.t, kk, vest), 'Всё вместе: ' + nf(P, J.t) + ' + ' + nf(P, tr) + ' + ' + nf(P, vest) + ' = ' + nu(J.t, 'коп.') + ' + ' + nu(tr, 'коп.') + ' + ' + nu(vest, 'коп.') + ' = ' + backLn(P, res)];
      hint = 'Найди цену второй вещи (вычитанием) и третьей (делением), потом сложи цены всех трёх вещей.';
    } else {
      var b = pick(SH_BU), x1 = rubQ(300, 900), x2 = rubQ(200, 700), kb = pick(b.k), x3 = x2.t * kb, spent = x1.t + x2.t + x3, N = Math.ceil((spent + 5000) / 50000) * 500;
      res = N * 100 - spent;
      text = b.who + ' ' + nu(N, 'руб.') + ' Потратили ' + b.t1 + ' ' + nm(P, x1.b, x1.s) + ', ' + b.t2 + ' ' + nm(P, x2.b, x2.s) + ', а ' + b.t3 + ' — в ' + timesW(kb) + ' больше, чем ' + b.t2 + '. Сколько денег осталось?';
      steps = [cap(b.t3) + ': ' + mulLn(P, x2.t, kb, x3), 'Всего потратили: ' + nf(P, x1.t) + ' + ' + nf(P, x2.t) + ' + ' + nf(P, x3) + ' = ' + nu(x1.t, 'коп.') + ' + ' + nu(x2.t, 'коп.') + ' + ' + nu(x3, 'коп.') + ' = ' + backLn(P, spent), 'Осталось: ' + nu(N, 'руб.') + ' − ' + nf(P, spent) + ' = ' + nu(N * 100, 'коп.') + ' − ' + nu(spent, 'коп.') + ' = ' + backLn(P, res)];
      hint = 'Найди, сколько потратили на третью покупку, потом все траты вместе. Остаток — это разность между выделенной суммой и тратами.';
    }
    return { kind: 'nums', html: text, fields: fieldsOf(P), answer: ansPair(P, res), hint: hint, explain: stepsL(steps, bold(nf(P, res))) };
  });

  /* ================= составные задачи: путь ================= */
  var KM = PAIRS['км-м'];
  reg('pldTrip', function (o) {
    o = o || {};
    var P = KM, form = o.form || pick(['days3', 'bike', 'left', 'relay']), res, text, steps, hint, g = 0;
    if (form === 'days3') {
      var A, B, C;
      do { A = mkQ(P, 12, 25); B = mkQ(P, 1, 5); C = mkQ(P, 8, 20); g++; } while (g < 200 && A.t <= B.t);
      var A2 = A.t - B.t, tot = A.t + A2 + C.t, wh = pick([['Туристы прошли', 'они прошли'], ['Группа школьников прошла', 'она прошла'], ['Лыжники прошли', 'они прошли']]);
      text = wh[0] + ' за три дня ' + nf(P, tot) + '. В первый день ' + wh[1] + ' ' + nf(P, A.t) + ', во второй — на ' + nf(P, B.t) + ' меньше, чем в первый. Сколько ' + wh[1].split(' ')[0] + ' ' + wh[1].split(' ')[1] + ' в третий день?';
      res = C.t;
      steps = ['Во второй день: ' + opLn(P, A.t, '−', B.t, A2), 'За два первых дня: ' + opLn(P, A.t, '+', A2, A.t + A2), 'В третий день: ' + opLn(P, tot, '−', A.t + A2, C.t)];
      hint = 'Найди путь за второй день, потом за два первых дня вместе. Остаток общего пути пришёлся на третий день.';
    } else if (form === 'bike') {
      var kk = pick([2, 3, 4, 5]), X = mkQ(P, 2, 9), Y = X.t * kk, V = pick([['Велосипедист проехал по шоссе', 'по лесной дороге'], ['Автобус проехал по городу', 'по просёлочной дороге'], ['Теплоход прошёл по реке', 'по озеру'], ['Колонна машин проехала по трассе', 'по просёлку']]);
      res = Y + X.t;
      text = V[0] + ' ' + nf(P, Y) + ', а ' + V[1] + ' — в ' + timesW(kk) + ' меньше. Какой путь он проделал всего?'.replace('он', V[0].indexOf('Колонна') === 0 ? 'она' : 'он');
      steps = [cap(V[1]) + ': ' + divLn(P, Y, kk, X.t), 'Весь путь: ' + opLn(P, Y, '+', X.t, res)];
      hint = 'Найди путь по второй дороге — он в несколько раз меньше первого. Потом сложи оба участка.';
    } else if (form === 'left') {
      var a1 = mkQ(P, 3, 12), a2 = mkQ(P, 2, 9), rest = mkQ(P, 4, 15), TT = a1.t + a2.t + rest.t, W = pick([['Расстояние между двумя городами равно', 'Поезд прошёл'], ['Длина лыжной трассы равна', 'Лыжник прошёл'], ['Путь от посёлка до озера равен', 'Туристы прошли']]);
      res = rest.t;
      text = W[0] + ' ' + nf(P, TT) + '. ' + W[1] + ' сначала ' + nf(P, a1.t) + ', потом ещё ' + nf(P, a2.t) + '. Сколько осталось пройти?';
      steps = ['Уже пройдено: ' + opLn(P, a1.t, '+', a2.t, a1.t + a2.t), 'Осталось: ' + opLn(P, TT, '−', a1.t + a2.t, rest.t)];
      hint = 'Сначала узнай, сколько уже пройдено, потом вычти это из всего пути.';
    } else {
      var s1 = mkQ(P, 1, 4), ex_ = rand(1, 9) * 50, s2 = s1.t + ex_, kx = pick([2, 3]), s3 = s1.t * kx, s4 = s2 + s3, tot4 = s1.t + s2 + s3 + s4;
      res = tot4;
      text = 'Трасса эстафеты состоит из четырёх этапов. Первый этап — ' + nf(P, s1.t) + ', второй на ' + nf(P, ex_) + ' длиннее первого, третий в ' + timesW(kx) + ' длиннее первого, а четвёртый равен сумме второго и третьего. Какова длина всей трассы?';
      steps = ['Второй этап: ' + opLn(P, s1.t, '+', ex_, s2), 'Третий этап: ' + mulLn(P, s1.t, kx, s3), 'Четвёртый этап: ' + opLn(P, s2, '+', s3, s4), 'Вся трасса: ' + nf(P, s1.t) + ' + ' + nf(P, s2) + ' + ' + nf(P, s3) + ' + ' + nf(P, s4) + ' = ' + backLn(P, tot4)];
      hint = 'Найди длину каждого этапа по порядку. Считай в мелких единицах.';
    }
    return { kind: 'nums', html: text, fields: fieldsOf(P), answer: ansPair(P, res), hint: hint, explain: stepsL(steps, bold(nf(P, res))) };
  });

  /* ================= составные задачи: масса ================= */
  var ST_FIELD = [
    { c: 'зерна', f: 'С первого поля', s: 'со второго', t: 'с третьего', all: 'со всех трёх полей' },
    { c: 'картофеля', f: 'С первого поля', s: 'со второго', t: 'с третьего', all: 'со всех трёх полей' },
    { c: 'яблок', f: 'С первого сада', s: 'со второго', t: 'с третьего', all: 'со всех трёх садов' },
    { c: 'огурцов', f: 'С первой теплицы', s: 'со второй', t: 'с третьей', all: 'со всех трёх теплиц' },
    { c: 'ягод', f: 'С первого участка', s: 'со второго', t: 'с третьего', all: 'со всех трёх участков' }
  ];
  var ST_BAG = [
    { w: 'муки', e: 'каждый', g: 'пирогов' }, { w: 'крупы', e: 'каждую', g: 'порций' }, { w: 'сахара', e: 'каждый', g: 'тортов' }, { w: 'творога', e: 'каждую', g: 'запеканок' }
  ];
  reg('pldStock', function (o) {
    o = o || {};
    var form = o.form || pick(['trucks', 'fields', 'bags', 'portions']), res, text, steps, hint, P;
    if (form === 'trucks') {
      P = PAIRS['т-кг'];
      var A = mkQ(P, 3, 8), k = rand(3, 6), total = A.t * k, B = Math.floor(total * rand(30, 70) / 100 / 50) * 50;
      res = total - B;
      var w = pick([['зерна', 'На склад', 'со склада отправили'], ['муки', 'На склад', 'со склада отправили'], ['сахара', 'На склад', 'со склада отправили'], ['песка', 'На стройплощадку', 'использовали']]);
      text = w[1] + ' привезли ' + k + ' ' + plur(k, 'машину', 'машины', 'машин') + ' ' + w[0] + ' по ' + nf(P, A.t) + ' в каждой. Потом ' + w[2] + ' ' + nf(P, B) + '. Сколько ' + w[0] + ' осталось?';
      steps = ['Привезли всего: ' + mulLn(P, A.t, k, total), 'Осталось: ' + opLn(P, total, '−', B, res)];
      hint = 'Сначала узнай, сколько привезли всего (одинаковые машины — умножение), потом вычти то, что увезли.';
    } else if (form === 'fields') {
      P = PAIRS[pick(['т-кг', 'ц-кг'])];
      var kk = pick([2, 3, 4, 5]), X = mkQ(P, 1, P.big === 'т' ? 8 : 12), A1 = X.t * kk, D = P.f === 100 ? rand(2, 9) * 5 : rand(1, 9) * 50, C3 = X.t + D, cr = pick(ST_FIELD);
      res = A1 + X.t + C3;
      text = cr.f + ' собрали ' + nf(P, A1) + ' ' + cr.c + ', ' + cr.s + ' — в ' + timesW(kk) + ' меньше, а ' + cr.t + ' — на ' + nf(P, D) + ' больше, чем ' + cr.s + '. Сколько ' + cr.c + ' собрали ' + cr.all + '?';
      steps = [cap(cr.s) + ': ' + divLn(P, A1, kk, X.t), cap(cr.t) + ': ' + opLn(P, X.t, '+', D, C3), cap(cr.all) + ': ' + nf(P, A1) + ' + ' + nf(P, X.t) + ' + ' + nf(P, C3) + ' = ' + nu(A1, P.small) + ' + ' + nu(X.t, P.small) + ' + ' + nu(C3, P.small) + ' = ' + backLn(P, res)];
      hint = 'Найди урожай со второго участка (он в несколько раз меньше), потом с третьего (на сколько-то больше второго). В конце сложи все три.';
    } else if (form === 'bags') {
      P = PAIRS['кг-г'];
      var kb = rand(3, 6), Bs = pick([150, 200, 250, 300, 400, 500, 600, 750]), left = mkQ(P, 1, 3), Atot = Bs * kb + left.t, bg = pick(ST_BAG);
      res = left.t;
      text = 'В мешке было ' + nf(P, Atot) + ' ' + bg.w + '. На ' + bg.e + ' из ' + kb + ' ' + bg.g + ' ушло по ' + nu(Bs, 'г') + '. Сколько ' + bg.w + ' осталось в мешке?';
      steps = ['Ушло всего: ' + mulLn(P, Bs, kb, Bs * kb), 'Осталось: ' + opLn(P, Atot, '−', Bs * kb, res)];
      hint = 'Сначала узнай, сколько ушло на все одинаковые части вместе, потом вычти из того, что было.';
    } else {
      P = PAIRS['кг-г'];
      var por = pick([200, 250, 300, 400, 500]), nn = rand(8, 60), At = por * nn;
      if (At < 2000) { nn = Math.ceil(2000 / por); At = por * nn; }
      var it = pick([['каши', 'порции', 'порций'], ['риса', 'пакеты', 'пакетов'], ['орехов', 'пакетики', 'пакетиков'], ['конфет', 'подарки', 'подарков']]);
      text = 'Из ' + nf(P, At) + ' ' + it[0] + ' раскладывают ' + it[1] + ' по ' + nu(por, 'г') + '. Сколько ' + it[2] + ' получится?';
      return { kind: 'num', html: text, answer: nn,
        hint: 'Выразим всю массу в граммах (1 кг = 1 000 г) и узнаем, сколько раз по ' + por + ' г в ней содержится.',
        explain: stepsL([nf(P, At) + ' = ' + fmt(At) + ' г', fmt(At) + ' : ' + fmt(por) + ' = ' + fmt(nn)], bold(fmt(nn))) };
    }
    return { kind: 'nums', html: text, fields: fieldsOf(P), answer: ansPair(P, res), hint: hint, explain: stepsL(steps, bold(nf(P, res))) };
  });

  /* ================= составные задачи: ткань, верёвка, лента ================= */
  var CL_CUT = [
    { w: 'ткани', n: ['занавеску', 'занавески', 'занавесок'], e: 'каждую' }, { w: 'ткани', n: ['наволочку', 'наволочки', 'наволочек'], e: 'каждую' },
    { w: 'ленты', n: ['бант', 'банта', 'бантов'], e: 'каждый' }, { w: 'материи', n: ['сумку', 'сумки', 'сумок'], e: 'каждую' }
  ];
  var CL_ROPE = [['Верёвку', 'верёвки'], ['Провод', 'провода'], ['Шнур', 'шнура'], ['Трубу', 'трубы']];
  var CL_PIECE = [['ленты', 'банты', 'бантов'], ['шнура', 'шнурки', 'шнурков'], ['провода', 'куски', 'кусков'], ['тесьмы', 'закладки', 'закладок']];
  var CL_SHARE = [['Проволоку', 'проволоки', 'учениками', 'получил каждый'], ['Ткань', 'ткани', 'мастерицами', 'получила каждая'], ['Ленту', 'ленты', 'девочками', 'получила каждая'], ['Шнур', 'шнура', 'кружковцами', 'получил каждый']];
  reg('pldCloth', function (o) {
    o = o || {};
    var P = PAIRS['м-см'], form = o.form || pick(['cut', 'rope', 'pieces', 'share']), res, text, steps, hint;
    if (form === 'cut') {
      var B = mkQ(P, 1, 3), k = rand(3, 8), left = 100 + rand(1, 18) * 5, A = B.t * k + left, it = pick(CL_CUT);
      res = left;
      text = 'От куска ' + it.w + ' длиной ' + nf(P, A) + ' отрезали на ' + k + ' ' + plur(k, it.n[0], it.n[1], it.n[2]) + ': на ' + it.e + ' пошло по ' + nf(P, B.t) + '. Сколько ' + it.w + ' осталось?';
      steps = ['Ушло всего: ' + mulLn(P, B.t, k, B.t * k), 'Осталось: ' + opLn(P, A, '−', B.t * k, res)];
      hint = 'Сначала узнай, сколько ушло на все одинаковые изделия, потом вычти это из всего куска.';
    } else if (form === 'rope') {
      var C = mkQ(P, 1, 4), kr = pick([2, 3, 4]), R_ = mkQ(P, 1, 8), A2 = C.t + C.t * kr + R_.t, who = pick(CL_ROPE);
      res = R_.t;
      text = who[0] + ' длиной ' + nf(P, A2) + ' разрезали на три части. Первая часть — ' + nf(P, C.t) + ', вторая в ' + timesW(kr) + ' длиннее первой, а третья — всё остальное. Какова длина третьей части?';
      steps = ['Вторая часть: ' + mulLn(P, C.t, kr, C.t * kr), 'Первые две части вместе: ' + opLn(P, C.t, '+', C.t * kr, C.t + C.t * kr), 'Третья часть: ' + opLn(P, A2, '−', C.t + C.t * kr, res)];
      hint = 'Найди длину второй части (она в несколько раз длиннее первой), потом длину двух первых частей вместе. Остаток — третья часть.';
    } else if (form === 'pieces') {
      var Pc = pick([20, 25, 30, 40, 50, 60, 75]), n = rand(8, 40), At = Pc * n;
      if (At < 300) { n = Math.ceil(300 / Pc); At = Pc * n; }
      var th = pick(CL_PIECE);
      text = 'Из ' + th[0] + ' длиной ' + nf(P, At) + ' нарезали ' + th[1] + ' по ' + nu(Pc, 'см') + '. Сколько ' + th[2] + ' получилось?';
      return { kind: 'num', html: text, answer: n,
        hint: 'Вырази всю длину в сантиметрах (1 м = 100 см) и узнай, сколько раз по ' + Pc + ' см в ней содержится.',
        explain: stepsL([nf(P, At) + ' = ' + fmt(At) + ' см', fmt(At) + ' : ' + fmt(Pc) + ' = ' + fmt(n)], bold(fmt(n))) };
    } else {
      var ks = pick([3, 4, 5, 6, 8]), Qt = rand(4, 60) * 5, Aq = Qt * ks, sh = pick(CL_SHARE);
      if (Aq < 300) { Qt = 100 + rand(0, 8) * 5; Aq = Qt * ks; }
      res = Qt;
      text = sh[0] + ' длиной ' + nf(P, Aq) + ' поделили поровну между ' + ks + ' ' + sh[2] + '. Сколько ' + sh[1] + ' ' + sh[3] + '?';
      steps = [nf(P, Aq) + ' = ' + fmt(Aq) + ' см', fmt(Aq) + ' : ' + ks + ' = ' + fmt(Qt) + ' см = ' + nf(P, Qt)];
      hint = 'Раздели длину на число частей. Удобно сначала перевести всю длину в сантиметры.';
    }
    return { kind: 'nums', html: text, fields: fieldsOf(P), answer: ansPair(P, res), hint: hint, explain: stepsL(steps, bold(nf(P, res))) };
  });

  /* ================= составные задачи: сравнение величин ================= */
  var CMP = [
    { p: 'м-см', d: function (A, B) { return 'Длина красной ленты ' + A + ', а синей — ' + B + '.'; }, t: 'Во сколько раз красная лента длиннее синей?', n: 'На сколько красная лента длиннее синей?' },
    { p: 'кг-г', d: function (A, B) { return 'Арбуз весит ' + A + ', а дыня — ' + B + '.'; }, t: 'Во сколько раз арбуз тяжелее дыни?', n: 'На сколько арбуз тяжелее дыни?' },
    { p: 'т-кг', d: function (A, B) { return 'На первом складе хранится ' + A + ' зерна, а на втором — ' + B + '.'; }, t: 'Во сколько раз на первом складе зерна больше, чем на втором?', n: 'На сколько на первом складе зерна больше, чем на втором?' },
    { p: 'руб-коп', d: function (A, B) { return 'Книга стоит ' + A + ', а тетрадь — ' + B + '.'; }, t: 'Во сколько раз книга дороже тетради?', n: 'На сколько книга дороже тетради?' },
    { p: 'км-м', d: function (A, B) { return 'Длина первой лыжной трассы ' + A + ', а второй — ' + B + '.'; }, t: 'Во сколько раз первая трасса длиннее второй?', n: 'На сколько первая трасса длиннее второй?' },
    { p: 'ц-кг', d: function (A, B) { return 'С первого участка собрали ' + A + ' картофеля, а со второго — ' + B + '.'; }, t: 'Во сколько раз больше картофеля собрали с первого участка?', n: 'На сколько больше картофеля собрали с первого участка?' }
  ];
  var CHN = [
    { p: 'ц-кг', t: function (A, k, D) { return 'С первого участка собрали ' + A + ' капусты, со второго — в ' + k + ' больше, чем с первого, а с третьего — на ' + D + ' меньше, чем со второго. Сколько капусты собрали с третьего участка?'; } },
    { p: 'кг-г', t: function (A, k, D) { return 'В первой банке ' + A + ' мёда, во второй — в ' + k + ' больше, чем в первой, а в третьей — на ' + D + ' меньше, чем во второй. Сколько мёда в третьей банке?'; } },
    { p: 'т-кг', t: function (A, k, D) { return 'В первый день на завод привезли ' + A + ' угля, во второй — в ' + k + ' больше, чем в первый, а в третий — на ' + D + ' меньше, чем во второй. Сколько угля привезли в третий день?'; } },
    { p: 'м-см', t: function (A, k, D) { return 'В первом рулоне ' + A + ' ткани, во втором — в ' + k + ' больше, чем в первом, а в третьем — на ' + D + ' меньше, чем во втором. Сколько ткани в третьем рулоне?'; } },
    { p: 'руб-коп', t: function (A, k, D) { return 'Тетрадь стоит ' + A + ', альбом — в ' + k + ' дороже тетради, а набор красок — на ' + D + ' дешевле альбома. Сколько стоит набор красок?'; } }
  ];
  reg('pldCompare', function (o) {
    o = o || {};
    var form = o.form || pick(['times', 'diff', 'chain']), P, text, steps, hint, res, g = 0;
    if (form === 'chain') {
      var c = pick(CHN); P = PAIRS[c.p];
      var kk = pick([2, 3, 4, 5]), A = mkQ(P, 1, P.big === 'руб.' ? 90 : 9), B = A.t * kk, D;
      D = P.f === 100 ? rand(2, 19) * 5 : rand(2, 19) * 50;
      if (D >= B) D = Math.floor(B / 2 / 5) * 5;
      var C3 = B - D; res = C3;
      text = c.t(nf(P, A.t), timesW(kk), nf(P, D));
      steps = ['Второе: ' + mulLn(P, A.t, kk, B), 'Третье: ' + opLn(P, B, '−', D, C3)];
      hint = 'Сначала найди вторую величину (в несколько раз больше первой), потом третью (на сколько-то меньше второй).';
      return { kind: 'nums', html: text, fields: fieldsOf(P), answer: ansPair(P, res), hint: hint, explain: stepsL(steps, bold(nf(P, res))) };
    }
    var s = pick(CMP); P = PAIRS[s.p];
    var Bq = mkQ(P, 1, P.big === 'руб.' ? 40 : 9), k = rand(2, 9), Aq = Bq.t * k;
    if (form === 'times') {
      return { kind: 'num', html: s.d(nf(P, Aq), nf(P, Bq.t)) + ' ' + s.t, answer: k,
        hint: 'Чтобы узнать, во сколько раз одна величина больше другой, раздели большую на меньшую. Выразим обе величины в мелких единицах (' + P.fact + ').',
        explain: stepsL([nf(P, Aq) + ' = ' + fmt(Aq) + ' ' + P.small + ', ' + nf(P, Bq.t) + ' = ' + fmt(Bq.t) + ' ' + P.small, fmt(Aq) + ' : ' + fmt(Bq.t) + ' = ' + k], bold(fmt(k))) };
    }
    res = Aq - Bq.t;
    return { kind: 'nums', html: s.d(nf(P, Aq), nf(P, Bq.t)) + ' ' + s.n, fields: fieldsOf(P), answer: ansPair(P, res),
      hint: 'Чтобы узнать, на сколько одна величина больше другой, вычти меньшую из большей.',
      explain: stepsL(['Разность: ' + opLn(P, Aq, '−', Bq.t, res)], bold(nf(P, res))) };
  });

  /* @@GENS-B2 */



  /* @@GENS-B */

  /* @@GENS-C */

  /* @@GENS-D */

  /* ================= задачи: квадратные меры (м², дм², см²) ================= */
  var SQM_OBJ = ['Прямоугольное оконное стекло', 'Прямоугольная картина', 'Прямоугольная скатерть', 'Прямоугольный фанерный щит', 'Прямоугольное зеркало', 'Прямоугольная вывеска'];
  var SQM_RUG = [['Ковёр', 'ковра'], ['Скатерть', 'скатерти'], ['Столешница', 'столешницы'], ['Витрина', 'витрины']];
  var SQM_ROOMS = [['гостиной', 'спальне'], ['кухне', 'коридоре'], ['классе', 'мастерской'], ['зале', 'раздевалке']];
  function mcm(m, c) { return c ? nu(m, 'м') + ' ' + nu(c, 'см') : nu(m, 'м'); }
  reg('pldSqm', function (o) {
    o = o || {};
    var type = o.type || pick(['pic', 'rug', 'cut', 'cmp', 'wall']), a, b, S, ans, g = 0;
    if (type === 'pic') {
      do { a = rand(6, 20) * 10; b = rand(4, 15) * 10; } while (a <= b);
      S = a * b; ans = S / 100;
      return { kind: 'num', html: pick(SQM_OBJ) + ' имеет длину ' + nu(a, 'см') + ' и ширину ' + nu(b, 'см') + '. Найди площадь в квадратных дециметрах.', answer: ans,
        hint: 'Найди площадь в квадратных сантиметрах, а потом переведи: в 1 дм² — 100 см², значит, делим на 100.',
        explain: stepsL(['Площадь в квадратных сантиметрах: ' + a + ' × ' + b + ' = ' + fmt(S) + ' см²', 'В 1 дм² — 100 см², поэтому ' + fmt(S) + ' : 100 = ' + fmt(ans) + ' дм²'], ansU(ans, 'дм²')) +
          ' Проверка другим способом: ' + nu(a, 'см') + ' = ' + (a / 10) + ' дм, ' + nu(b, 'см') + ' = ' + (b / 10) + ' дм, и ' + (a / 10) + ' × ' + (b / 10) + ' = ' + fmt(ans) + ' дм².' };
    }
    if (type === 'rug') {
      var m1, c1, m2, c2, A, B, ob = pick(SQM_RUG);
      do {
        m1 = rand(2, 6); c1 = pick([10, 20, 30, 40, 50, 60, 70, 80, 90]); m2 = rand(1, 3); c2 = Math.random() < 0.5 ? 0 : pick([10, 20, 30, 40, 50, 60, 70, 80, 90]);
        A = m1 * 10 + c1 / 10; B = m2 * 10 + c2 / 10; g++;
      } while ((A <= B || A * B > 3000) && g < 200);
      S = A * B;
      return { kind: 'num', html: ob[0] + ' имеет длину ' + mcm(m1, c1) + ' и ширину ' + mcm(m2, c2) + '. Найди площадь ' + ob[1] + ' в квадратных дециметрах.', answer: S,
        hint: 'Вырази обе стороны в дециметрах (1 м = 10 дм, 10 см = 1 дм) и перемножь.',
        explain: stepsL(['Длина: ' + mcm(m1, c1) + ' = ' + (m1 * 10) + ' дм + ' + (c1 / 10) + ' дм = ' + A + ' дм', 'Ширина: ' + mcm(m2, c2) + ' = ' + B + ' дм', 'Площадь: ' + A + ' × ' + B + ' = ' + fmt(S) + ' дм²'], ansU(S, 'дм²')) };
    }
    if (type === 'cut') {
      var k = pick([10, 20, 25, 50]), am = pick([2, 3, 4]), bm = pick([1, 2]), nA = am * 100 / k, nB = bm * 100 / k, N = nA * nB;
      var mat = [pick(['фанеры', 'картона', 'пробки', 'жести'])];
      return { kind: 'num', html: 'Лист ' + mat[0] + ' имеет форму прямоугольника ' + nu(am, 'м') + ' на ' + nu(bm, 'м') + '. Из него вырезают квадраты со стороной ' + nu(k, 'см') + '. Сколько квадратов получится?', answer: N,
        hint: 'Вырази размеры листа в сантиметрах, найди площадь листа и площадь одного квадрата, потом раздели. Можно и по рядам: сколько квадратов вдоль каждой стороны?',
        explain: stepsL(['Лист: ' + nu(am, 'м') + ' = ' + fmt(am * 100) + ' см, ' + nu(bm, 'м') + ' = ' + fmt(bm * 100) + ' см', 'Площадь листа: ' + fmt(am * 100) + ' × ' + fmt(bm * 100) + ' = ' + fmt(am * bm * 10000) + ' см²', 'Площадь одного квадрата: ' + k + ' × ' + k + ' = ' + fmt(k * k) + ' см²', 'Квадратов: ' + fmt(am * bm * 10000) + ' : ' + fmt(k * k) + ' = ' + fmt(N)], bold(fmt(N))) +
          ' Проверка по рядам: вдоль длины ' + fmt(nA) + ' ' + plur(nA, 'квадрат', 'квадрата', 'квадратов') + ', вдоль ширины ' + fmt(nB) + ' ' + plur(nB, 'квадрат', 'квадрата', 'квадратов') + ', ' + fmt(nA) + ' × ' + fmt(nB) + ' = ' + fmt(N) + '.' };
    }
    if (type === 'cmp') {
      var Am = rand(3, 25), d = pick([10, 20, 25, 30, 40, 50, 60, 75, 80, 90]), up = Math.random() < 0.5, rm = pick(SQM_ROOMS), Adm = Am * 100, Bdm = up ? Adm + d : Adm - d;
      var bigR = up ? rm[1] : rm[0], smallR = up ? rm[0] : rm[1];
      return { kind: 'num', html: 'Площадь пола в ' + rm[0] + ' — ' + nu(Am, 'м²') + ', а в ' + rm[1] + ' — ' + nu(Bdm, 'дм²') + '. На сколько квадратных дециметров площадь пола в ' + bigR + ' больше, чем в ' + smallR + '?', answer: d,
        hint: 'Величины даны в разных мерах. Вырази квадратные метры в квадратных дециметрах (1 м² = 100 дм²), потом сравнивай.',
        explain: stepsL([nu(Am, 'м²') + ' = ' + Am + ' × 100 = ' + fmt(Adm) + ' дм²', 'Сравниваем ' + fmt(Adm) + ' дм² и ' + fmt(Bdm) + ' дм²: больше в ' + bigR, 'Разность: ' + fmt(Math.max(Adm, Bdm)) + ' − ' + fmt(Math.min(Adm, Bdm)) + ' = ' + d + ' дм²'], ansU(d, 'дм²')) };
    }
    var Aw = rand(10, 30), w = pick([100, 150, 200, 250, 300]), D = pick([1, 2]), X = Aw * 100, Y = D * 100;
    ans = X - w - Y;
    return { kind: 'num', html: 'Площадь стены ' + nu(Aw, 'м²') + '. В ней окно площадью ' + nu(w, 'дм²') + ' и дверь площадью ' + nu(D, 'м²') + '. Стену красят без окна и двери. Сколько квадратных дециметров надо покрасить?', answer: ans,
      hint: 'Выразим все площади в квадратных дециметрах. Из площади стены вычтем площади окна и двери.',
      explain: stepsL(['Стена: ' + nu(Aw, 'м²') + ' = ' + Aw + ' × 100 = ' + fmt(X) + ' дм²', 'Дверь: ' + nu(D, 'м²') + ' = ' + D + ' × 100 = ' + fmt(Y) + ' дм²', 'Окно и дверь вместе: ' + fmt(w) + ' + ' + fmt(Y) + ' = ' + fmt(w + Y) + ' дм²', 'Красить: ' + fmt(X) + ' − ' + fmt(w + Y) + ' = ' + fmt(ans) + ' дм²'], ansU(ans, 'дм²')) };
  });

  /* ================= виджеты теории ================= */
  R.widgetMounts = R.widgetMounts || {};
  function wInp(val, max, label) {
    return '<input class="winput sm ldi" inputmode="numeric" autocomplete="off" maxlength="' + max + '" value="' + val + '" aria-label="' + label + '">';
  }
  function wRead(inp) { var d = inp.value.replace(/\D/g, ''); return d === '' ? null : Number(d); }
  function wDigits(inp) { inp.addEventListener('input', function () { var v = inp.value.replace(/\D/g, ''); if (v !== inp.value) inp.value = v; }); }
  function wMsg(out, t) { out.innerHTML = '<p class="facts">' + R.tidy(t) + '</p>'; }
  function fmtBig(str) { return str.replace(/\B(?=(\d{3})+(?!\d))/g, NB); }

  /* «Отмерь участок»: длина и ширина в метрах → площадь в м², а, га; схема с клетками */
  R.widgetMounts.ldplot = function (host) {
    host.classList.add('ldw');
    var d = host.dataset || {};
    host.innerHTML = '<div class="conv-row"><label class="ldf"><span class="wlabel">Длина, м</span>' + wInp(d.a || 250, 4, 'Длина участка в метрах') + '</label>' +
      '<span class="conv-eq">×</span><label class="ldf"><span class="wlabel">Ширина, м</span>' + wInp(d.b || 40, 4, 'Ширина участка в метрах') + '</label></div>' +
      '<div class="ldout" aria-live="polite"></div>';
    var inp = host.querySelectorAll('input'), ia = inp[0], ib = inp[1], out = host.querySelector('.ldout');
    wDigits(ia); wDigits(ib);
    function calc() {
      var a = wRead(ia), b = wRead(ib);
      if (a === null || b === null) return wMsg(out, 'Впиши длину и ширину участка в метрах.');
      if (a < 1 || b < 1) return wMsg(out, 'Длина и ширина должны быть не меньше 1 м.');
      var S = a * b, cell = Math.max(a, b) <= 300 ? 10 : Math.max(a, b) <= 3000 ? 100 : 0, nx = 0, ny = 0, legend = '';
      if (cell && a % cell === 0 && b % cell === 0) {
        nx = a / cell; ny = b / cell;
        legend = '<p class="soft">Одна клетка на схеме — ' + (cell === 10 ? '1 ар (квадрат 10 м × 10 м)' : '1 гектар (квадрат 100 м × 100 м)') + '.</p>';
      } else if (cell) legend = '<p class="soft">Клетки не рисуем: стороны не делятся на ' + cell + ' м.</p>';
      var h = '<div class="ldfig">' + plotSVG(nu(a, 'м'), nu(b, 'м'), a, b, { nx: nx, ny: ny, center: fmt(S) + ' м²', label: 'Схема участка ' + a + ' на ' + b + ' метров' }) + legend + '</div>';
      h += '<p class="facts">В квадратных метрах: <b>' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(S) + ' м²</b>.</p>';
      if (S >= 100) {
        h += '<p class="facts">В арах: ' + fmt(S) + ' : 100 = ' + (S % 100 === 0 ? '<b>' + fmt(S / 100) + ' а</b>' : fmt(Math.floor(S / 100)) + ' а, остаток ' + fmt(S % 100) + ' м²') + '.</p>';
      }
      if (S >= 10000) {
        h += '<p class="facts">В гектарах: ' + fmt(S) + ' : 10 000 = ' + (S % 10000 === 0 ? '<b>' + fmt(S / 10000) + ' га</b>' : fmt(Math.floor(S / 10000)) + ' га, остаток ' + fmt(S % 10000) + ' м²') + '.</p>';
      }
      h += '<p class="facts">Всё вместе: <b>' + areaTxt(S) + '</b>.</p>';
      out.innerHTML = R.tidy(h);
    }
    ia.addEventListener('input', calc); ib.addEventListener('input', calc);
    calc();
  };

  /* перевод между мерами площади по лестнице ×100 */
  R.widgetMounts.ldconv = function (host) {
    host.classList.add('ldw');
    var opts = AU.map(function (u) { return '<option value="' + u + '">' + u + '</option>'; }).join(''), d = host.dataset || {};
    host.innerHTML = '<div class="conv-row"><input class="winput sm ldi" inputmode="numeric" autocomplete="off" maxlength="7" value="' + (d.n || 4500) + '" aria-label="Число">' +
      '<select class="wsel" aria-label="Из каких мер">' + opts + '</select><span class="conv-eq">→</span><select class="wsel" aria-label="В какие меры">' + opts + '</select></div>' +
      '<div class="ldout" aria-live="polite"></div>';
    var inp = host.querySelector('input'), sel = host.querySelectorAll('select'), out = host.querySelector('.ldout');
    sel[0].value = d.from || 'м²'; sel[1].value = d.to || 'а';
    wDigits(inp);
    function big(n, e) { return BigInt(n) * (BigInt(10) ** BigInt(e)); }
    function calc() {
      var n = wRead(inp), from = sel[0].value, to = sel[1].value;
      if (n === null) return wMsg(out, 'Впиши число.');
      var i = AIDX[from], j = AIDX[to], k = Math.abs(i - j), z = 2 * k, h = R.ldLadder({ hl: from, hl2: to });
      if (i === j) return wMsg(out, 'Выбраны одинаковые меры: число не меняется.');
      if (i < j) {
        h += '<p class="facts">' + factChain(from, to) + '. Идём вправо по лестнице: каждый шаг — умножение на 100, то есть приписываем ' + zeros(z) + '.</p>' +
          '<p class="facts"><b>' + fmt(n) + ' ' + from + ' = ' + fmtBig(String(big(n, z))) + ' ' + to + '</b></p>';
      } else {
        var F = Math.pow(10, z), q = Math.floor(n / F), r = n % F;
        h += '<p class="facts">' + factChain(to, from) + '. Идём влево по лестнице: каждый шаг — деление на 100, то есть отделяем справа ' + zeros(z) + '.</p>' +
          '<p class="facts"><b>' + fmt(n) + ' ' + from + ' = ' + (q ? fmt(q) + ' ' + to : '') + (q && r ? ' ' : '') + (r ? fmt(r) + ' ' + from : '') + '</b>' +
          (r ? '' : '') + '</p>' + (q === 0 ? '<p class="soft">Меньше одной ' + to + ' — целых крупных мер нет.</p>' : '');
      }
      out.innerHTML = R.tidy(h);
    }
    inp.addEventListener('input', calc); sel[0].addEventListener('change', calc); sel[1].addEventListener('change', calc);
    calc();
  };

  /* почему в квадратной мере 100: квадрат из рядов */
  R.widgetMounts.ldsq = function (host) {
    host.classList.add('ldw');
    var PRS = [['м²', 'дм²'], ['дм²', 'см²'], ['см²', 'мм²'], ['а', 'м²'], ['га', 'а'], ['км²', 'га'], ['м²', 'см²'], ['га', 'м²'], ['км²', 'м²']];
    var SMM = { 'км²': 1e6, 'га': 1e5, 'а': 1e4, 'м²': 1e3, 'дм²': 100, 'см²': 10, 'мм²': 1 };
    var o = PRS.map(function (p, i) { return '<option value="' + i + '">1 ' + p[0] + ' и 1 ' + p[1] + '</option>'; }).join('');
    host.innerHTML = '<div class="conv-row"><select class="wsel" aria-label="Какие меры сравниваем">' + o + '</select></div><div class="ldout" aria-live="polite"></div>';
    var sel = host.querySelector('select'), out = host.querySelector('.ldout'), d = host.dataset || {};
    if (d.i != null) sel.value = d.i;
    function calc() {
      var p = PRS[Number(sel.value)], A = p[0], B = p[1], k = SMM[A] / SMM[B], F = k * k, n = Math.min(k, 10), cell = 15, x0 = 24, y0 = 12;
      var svg = '<svg class="fig ldsq" viewBox="0 0 ' + (x0 + n * cell + 60) + ' ' + (y0 + n * cell + 26) + '" width="' + (x0 + n * cell + 60) + '" role="img" aria-label="Квадрат из ' + n + ' рядов по ' + n + ' клеток">' +
        gridSVG(n, cell, x0, y0, [0, 0]) +
        '<text x="' + (x0 + n * cell / 2) + '" y="' + (y0 + n * cell + 20) + '" text-anchor="middle" style="font-size:13px">' + SIDE_S[A] + '</text>' +
        '<text x="' + (x0 + n * cell + 8) + '" y="' + (y0 + n * cell / 2 + 5) + '" text-anchor="start" style="font-size:13px">' + SIDE_S[A] + '</text></svg>';
      var t = '<p class="facts">Сторона квадрата в 1 ' + A + ' — ' + SIDE_S[A] + ', сторона квадрата в 1 ' + B + ' — ' + SIDE_S[B] + '. Вдоль стороны помещается ' + fmt(k) + ' малых квадратов, рядов тоже ' + fmt(k) + '. ' +
        'Всего ' + fmt(k) + ' × ' + fmt(k) + ' = ' + fmt(F) + '.</p>' +
        '<p class="facts"><b>1 ' + A + ' = ' + fmt(F) + ' ' + B + '</b></p>' + (k > 10 ? '<p class="soft">Рисунок условный: на самом деле рядов не 10, а ' + fmt(k) + '.</p>' : '<p class="soft">Закрашена одна клетка — 1 ' + B + '.</p>');
      out.innerHTML = '<div class="ldfig">' + svg + '</div>' + R.tidy(t);
    }
    sel.addEventListener('change', calc);
    calc();
  };



  /* составные ответы: хотя бы одна крупная мера, мелкие — по возможности не нуль */
  ['pldShop', 'pldTrip', 'pldStock', 'pldCloth', 'pldCompare'].forEach(function (name) {
    var raw = gens[name];
    gens[name] = function (o) {
      var q, i = 0;
      do { q = raw(o); i++; } while (i < 12 && q.kind === 'nums' && (q.answer[0] === 0 || (q.answer[1] === 0 && i < 8)));
      return q;
    };
  });

  /* ================= общая чистка текста ================= */
  function tidy(t) { return typeof t === 'string' ? R.tidy(t).replace(/\.<\/b>\./g, '.</b>') : t; }
  MINE.forEach(function (name) {
    var raw = gens[name];
    gens[name] = function (o) {
      var q = raw(o);
      q.html = tidy(q.html); q.explain = tidy(q.explain); q.hint = tidy(q.hint);
      return q;
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
