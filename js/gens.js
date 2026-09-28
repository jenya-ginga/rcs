/* Генераторы заданий. Каждый возвращает вопрос:
   { kind: 'num'|'nums'|'choice'|'abacus', html, answer, hint, explain, options?, fields?, wires? } */
(function (G) {
  'use strict';
  var R = G.RKS;
  var rand = R.rand, pick = R.pick, shuffle = R.shuffle, fmt = R.fmt, pw = R.pow10, RK = R.RANKS;
  var gens = R.gens = {};

  var CLS_ABBR = [null, 'ед.', 'тыс.', 'млн', 'млрд'];
  var EDIN = ['единицу', 'единицы', 'единиц'];

  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function rangeD(o) { return rand(o.dmin, o.dmax); }

  /* ================= чтение и запись чисел ================= */

  function explainWords(n) {
    var g = R.classGroups(n).reverse(), parts = [];
    g.forEach(function (x) { if (x.val) parts.push(x.val + ' ' + CLS_ABBR[x.cls]); });
    var s = 'Читаем по классам: ' + parts.join(' + ').replace(/\.?$/, '.') + ' ';
    s += 'Каждый класс — три цифры, а если в нём нет единиц, пишем три нуля. ';
    s += 'Получается ' + num(n) + '.';
    return s;
  }

  gens.words2digits = function (o) {
    var d = rangeD(o), n = R.randNum(d, { ensureZero: true, zeroClass: o.zeroClass });
    return {
      kind: 'num',
      html: 'Запиши цифрами: <span class="words">' + R.words(n) + '</span>',
      answer: n,
      hint: 'Разбей на классы: сначала число единиц старшего класса, потом его название. Пустые разряды — нули.',
      explain: explainWords(n)
    };
  };

  function perturb(n) {
    var s = String(n).split(''), t = rand(1, 4), i;
    if (t === 1 && s.length > 1) {
      i = rand(0, s.length - 2);
      var tmp = s[i]; s[i] = s[i + 1]; s[i + 1] = tmp;
    } else if (t === 2) {
      i = rand(0, s.length - 1); s[i] = String(rand(i === 0 ? 1 : 0, 9));
    } else if (t === 3 && s.length > 3) {
      s.splice(rand(1, s.length - 1), 1);
    } else if (s.length < 12) {
      s.splice(rand(1, s.length), 0, String(rand(0, 9)));
    }
    while (s[0] === '0' && s.length > 1) s.shift();
    return Number(s.join(''));
  }

  gens.digits2words = function (o) {
    var d = rangeD(o), n = R.randNum(d, { ensureZero: Math.random() < 0.6, zeroClass: o.zeroClass });
    var right = R.words(n), seen = {}, dist = [], tries = 0;
    seen[right] = 1;
    while (dist.length < 3 && tries++ < 80) {
      var m = perturb(n), w = R.words(m);
      if (m !== n && !seen[w]) { seen[w] = 1; dist.push(w); }
    }
    var opts = shuffle([right].concat(dist));
    var groups = R.classGroups(n).reverse().map(function (x) { return x.txt; }).join(' | ');
    return {
      kind: 'choice',
      html: 'Как читается число ' + num(n) + '?',
      options: opts,
      answer: opts.indexOf(right),
      hint: 'Раздели число на классы по три цифры справа налево и читай слева направо.',
      explain: 'Классы: ' + groups + '. Читаем: «' + right + '».'
    };
  };

  gens.digitAt = function (o) {
    var d = rangeD(o), n = R.randNum(d, { zp: 0.15 }), r = rand(1, d);
    var dig = Number(String(n).charAt(d - r));
    return {
      kind: 'num',
      html: 'Какая цифра стоит в разряде <b>' + RK[r].pl + '</b> числа ' + num(n) + '?',
      answer: dig,
      hint: 'Считай разряды справа налево: единицы, десятки, сотни, единицы тысяч…',
      explain: 'Это ' + r + '-й разряд справа: <span class="num">' + R.fmtHL(n, r) + '</span>. Ответ: ' + dig + '.'
    };
  };

  gens.placeOf = function (o) {
    var n, d, s, r, cnt = 0;
    do {
      d = rangeD(o); n = R.randNum(d, { zp: 0.1 }); s = String(n);
      r = rand(1, d);
      var ch = s.charAt(d - r), c = 0;
      for (var i = 0; i < d; i++) if (s.charAt(i) === ch) c++;
      if (c === 1) break;
    } while (++cnt < 40);
    var pool = [];
    for (var k = 1; k <= d; k++) if (k !== r) pool.push(k);
    pool = shuffle(pool).slice(0, 3);
    var opts = shuffle([r].concat(pool));
    return {
      kind: 'choice',
      html: 'Единицы какого разряда обозначает выделенная цифра в числе <span class="num">' + R.fmtHL(n, r) + '</span>?',
      options: opts.map(function (k) { return RK[k].name; }),
      answer: opts.indexOf(r),
      hint: 'Посчитай, на каком месте справа стоит цифра.',
      explain: 'Цифра стоит на ' + RK[r].loc + ' месте справа — это ' + RK[r].name + '.'
    };
  };

  gens.structure = function (o) {
    var d = rangeD(o), n = R.randNum(d, { zp: 0.15 }), cl = Math.ceil(d / 3);
    return {
      kind: 'nums',
      html: 'Сколько разрядов и сколько классов в числе ' + num(n) + '?',
      fields: [{ label: 'разрядов' }, { label: 'классов' }],
      answer: [d, cl],
      hint: 'Посчитай цифры. Класс — это три разряда подряд, считая справа.',
      explain: 'Цифр ' + d + ', значит разрядов ' + d + '. Делим цифры на группы по три справа налево — получается классов: ' + cl + '.'
    };
  };

  gens.classCount = function (o) {
    var n, d, cl, c, g, tries = 0;
    do {
      d = rangeD(o); n = R.randNum(d, { zp: 0.12 });
      cl = R.classGroups(n); c = rand(1, cl.length); g = cl[c - 1];
    } while (g.val === 0 && ++tries < 40);
    var groups = cl.slice().reverse().map(function (x) { return x.txt; }).join(' | ');
    return {
      kind: 'num',
      html: 'Сколько единиц <b>' + R.CLASSES[c].gen + ' класса</b> в числе ' + num(n) + '?',
      answer: g.val,
      hint: 'Раздели число на классы. Первый класс — три последние цифры.',
      explain: 'Классы: ' + groups + '. В ' + R.CLASSES[c].loc + ' классе — ' + g.val + '.'
    };
  };

  gens.composeRanks = function (o) {
    var k = o.terms || 2, ranks = [], i;
    for (i = o.rmin; i <= o.rmax; i++) ranks.push(i);
    ranks = shuffle(ranks).slice(0, k).sort(function (a, b) { return b - a; });
    var ans = 0, parts = [];
    ranks.forEach(function (r) {
      var a = rand(1, 9);
      ans += a * pw(r - 1);
      parts.push(a + ' ' + R.plural(a, EDIN) + ' <b>' + RK[r].gen + ' разряда</b>');
    });
    return {
      kind: 'num',
      html: 'Запиши число, которое содержит ' + parts.join(k > 2 ? ', ' : ' и ') + '.',
      answer: ans,
      hint: 'Нарисуй пустые клетки для всех разрядов до высшего и впиши цифры. Где единиц нет — ставь 0.',
      explain: 'Разряды, о которых не сказано, заполняем нулями: ' + num(ans) + '.'
    };
  };

  gens.composeClasses = function (o) {
    var k = o.terms || 2, cs = [], i;
    for (i = o.cmin; i <= o.cmax; i++) cs.push(i);
    cs = shuffle(cs).slice(0, k).sort(function (a, b) { return b - a; });
    var ans = 0, parts = [], vals = {};
    cs.forEach(function (c) {
      var v = rand(1, 999);
      if (Math.random() < 0.4) v = rand(1, 99);
      vals[c] = v;
      ans += v * pw(3 * (c - 1));
      parts.push(v + ' ' + R.plural(v, EDIN) + ' <b>' + R.CLASSES[c].gen + ' класса</b>');
    });
    var top = cs[0], seg = [];
    for (i = top; i >= 1; i--) {
      var v = vals[i];
      var t = v == null ? '000' : (i === top ? String(v) : ('00' + v).slice(-3));
      seg.push(t);
    }
    return {
      kind: 'num',
      html: 'Запиши число, которое содержит ' + parts.join(k > 2 ? ', ' : ' и ') + '.',
      answer: ans,
      hint: 'Каждый класс занимает три места. Если в классе меньше трёх цифр — впереди дописывай нули.',
      explain: 'По классам: ' + seg.join(' | ') + '. Получилось ' + num(ans) + '.'
    };
  };

  gens.neighbors = function (o) {
    var m = rand(o.mmin || 3, o.mmax || 8), t = rand(1, 3), lead = rand(1, 9), n;
    if (t === 1) n = lead * pw(m) - 1;
    else if (t === 2) n = lead * pw(m) + 1;
    else n = lead * pw(m);
    if (n < 2) n = 1000;
    return {
      kind: 'nums',
      html: 'Запиши число, которое стоит перед числом ' + num(n) + ', и число, которое стоит после него.',
      fields: [{ label: 'перед ним' }, { label: 'после него' }],
      answer: [n - 1, n + 1],
      hint: 'Чтобы найти следующее, прибавь 1, а предыдущее — вычти 1. Следи за нулями и девятками!',
      explain: 'Перед ' + num(n) + ' стоит ' + num(n - 1) + ', после — ' + num(n + 1) + '.'
    };
  };

  gens.compare = function (o) {
    var d = rangeD(o), a = R.randNum(d, { zp: 0.1 }), b, t = rand(1, 2);
    if (t === 1) {
      var s = String(a).split(''), i = rand(0, s.length - 1), old = s[i], nv;
      do { nv = String(rand(i === 0 ? 1 : 0, 9)); } while (nv === old);
      s[i] = nv; b = Number(s.join(''));
    } else {
      b = R.randNum(Math.max(2, d + pick([-1, 1])), { zp: 0.1 });
    }
    if (b === a) b = a + 1;
    var idx = a < b ? 0 : 2, ops = ['<', '=', '>'];
    return {
      kind: 'choice',
      html: 'Сравни числа: ' + num(a) + ' и ' + num(b) + '. Какой знак поставить?',
      options: ops,
      answer: idx,
      wide: false,
      hint: 'Сначала сравни, сколько в числах цифр. Если поровну — сравнивай цифры слева направо.',
      explain: String(a).length !== String(b).length
        ? 'В ' + (a > b ? 'первом' : 'втором') + ' числе больше цифр, значит оно больше.'
        : 'Цифр поровну. Идём слева направо до первой разницы — там и решается.'
    };
  };

  gens.abacus = function (o) {
    var d = rangeD(o), n = R.randNum(d, { zp: 0.2 }), w = d <= 6 ? 6 : (d <= 9 ? 9 : 12);
    return {
      kind: 'abacus', wires: w,
      html: 'Отложи на счётах число ' + num(n) + '.',
      answer: n,
      hint: 'Каждая проволока — свой разряд. Справа — единицы. Нажми на нужную бусину.',
      explain: 'На каждой проволоке откладываем столько бусин, какая цифра в разряде: ' + num(n) + '.'
    };
  };

  gens.minmax3 = function () {
    var ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
    var perms = [], i, j, k;
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) for (k = 0; k < 3; k++)
      if (i !== j && j !== k && i !== k) perms.push(ds[i] * 100 + ds[j] * 10 + ds[k]);
    var mn = Math.min.apply(null, perms), mx = Math.max.apply(null, perms);
    return {
      kind: 'nums',
      html: 'Из цифр ' + ds.join(', ') + ' (каждую цифру используй один раз) составь наименьшее и наибольшее трёхзначные числа.',
      fields: [{ label: 'наименьшее' }, { label: 'наибольшее' }],
      answer: [mn, mx],
      hint: 'Наименьшее число начинается с наименьшей цифры, наибольшее — с наибольшей.',
      explain: 'Всего можно записать 6 разных чисел. Наименьшее — ' + mn + ', наибольшее — ' + mx + '.'
    };
  };

  gens.times10 = function () {
    var n = R.randNum(rand(2, 7), { zp: 0.1 });
    return {
      kind: 'nums',
      html: 'Увеличь число ' + num(n) + ' в 10 раз и в 1 000 раз.',
      fields: [{ label: 'в 10 раз' }, { label: 'в 1 000 раз' }],
      answer: [n * 10, n * 1000],
      hint: 'Увеличить в 10 раз — приписать справа один ноль. В 1 000 раз — три нуля.',
      explain: num(n) + ' × 10 = ' + num(n * 10) + '; ' + num(n) + ' × 1 000 = ' + num(n * 1000) + '.'
    };
  };

  gens.div10 = function () {
    var base = R.randNum(rand(1, 4), { noZero: true }), z = rand(3, 7), n = base * pw(z);
    var f = pick([10, 100, 1000]);
    return {
      kind: 'num',
      html: 'Уменьши число ' + num(n) + ' в ' + fmt(f) + ' раз.',
      answer: n / f,
      hint: 'Уменьшить в 10 раз — убрать справа один ноль. В 100 раз — два нуля.',
      explain: 'Убираем справа ' + (String(f).length - 1) + ' нул' + (String(f).length === 2 ? 'ь' : 'я') + ': ' + num(n / f) + '.'
    };
  };

  /* ================= раздробление и превращение ================= */

  gens.unitTotal = function (o) {
    var ru = rand(o.rmin, o.rmax);
    var rt = (o.target === 'units') ? 1 : rand(1, ru - 1);
    var a = ru >= 8 ? rand(2, 99) : rand(2, 999);
    var k = ru - rt, ans = a * pw(k);
    return {
      kind: 'num',
      html: 'Сколько всего <b>' + RK[rt].pl + '</b> в <span class="num">' + fmt(a) + '</span> ' + RK[ru].abbr + '?',
      answer: ans,
      hint: '1 ' + RK[ru].abbr + ' = ' + fmt(pw(k)) + ' ' + RK[rt].abbr + '. Припиши справа ' + k + ' ' + R.plural(k, ['ноль', 'нуля', 'нулей']) + '.',
      explain: 'В 1 ' + RK[ru].abbr + ' — ' + fmt(pw(k)) + ' ' + RK[rt].abbr + ' Значит ' + fmt(a) + ' × ' + fmt(pw(k)) + ' = ' + num(ans) + '.'
    };
  };

  gens.unitMixed = function (o) {
    var rh = rand(Math.max(2, o.rmin), o.rmax);
    var diff = (rh >= 3 && Math.random() < 0.3) ? 2 : 1, rl = rh - diff;
    var rt = rand(1, rl);
    var a = rand(1, 99), b = rand(1, diff === 1 ? 9 : 99);
    var ans = a * pw(rh - rt) + b * pw(rl - rt);
    return {
      kind: 'num',
      html: 'Сколько всего <b>' + RK[rt].pl + '</b> в <span class="num">' + fmt(a) + '</span> ' + RK[rh].abbr +
        ' <span class="num">' + fmt(b) + '</span> ' + RK[rl].abbr + '?',
      answer: ans,
      hint: 'Сначала раздроби крупные единицы в мелкие, потом прибавь остальное.',
      explain: fmt(a) + ' ' + RK[rh].abbr + ' = ' + fmt(a * pw(rh - rt)) + ' ' + RK[rt].abbr +
        (rl === rt ? ', а ' + fmt(b) + ' ' + RK[rl].abbr + ' уже в нужных единицах. ' :
          ' и ' + fmt(b) + ' ' + RK[rl].abbr + ' = ' + fmt(b * pw(rl - rt)) + ' ' + RK[rt].abbr + '. ') +
        'Вместе: ' + num(ans) + '.'
    };
  };

  gens.unitInNumber = function (o) {
    var r = rand(o.rmin, o.rmax), d = r + rand(1, 4);
    if (d > 12) d = 12;
    if (d <= r) d = r + 1;
    var n = R.randNum(d, { zp: 0.15 }), ans = Math.floor(n / pw(r - 1));
    return {
      kind: 'num',
      html: 'Сколько всего <b>' + RK[r].pl + '</b> в числе ' + num(n) + '?',
      answer: ans,
      hint: 'Отбрось справа ' + (r - 1) + ' ' + R.plural(r - 1, ['цифру', 'цифры', 'цифр']) + ' — то, что осталось, и есть ответ.',
      explain: 'Отбрасываем справа ' + (r - 1) + ' ' + R.plural(r - 1, ['цифру', 'цифры', 'цифр']) + ' (они выделены цветом): <span class="num">' + R.fmtCut(n, r - 1) + '</span>. Осталось ' + num(ans) + ' ' + RK[r].abbr + '.'
    };
  };

  gens.splitNumber = function (o) {
    var r = pick(o.ranks || [4, 7]), d = r + rand(1, 3);
    if (d > 12) d = 12;
    var n = R.randNum(d, { zp: 0.15 }), q = Math.floor(n / pw(r - 1)), rest = n % pw(r - 1);
    return {
      kind: 'nums',
      html: 'Запиши число ' + num(n) + ' с помощью двух единиц: ' + RK[r].abbr + ' и ед.',
      fields: [{ label: RK[r].abbr }, { label: 'ед.' }],
      answer: [q, rest],
      hint: 'Справа отдели ' + (r - 1) + ' ' + R.plural(r - 1, ['цифру', 'цифры', 'цифр']) + ' — это единицы. Слева — ' + RK[r].abbr + '.',
      explain: '<span class="num">' + R.fmtCut(n, r - 1) + '</span> = ' + fmt(q) + ' ' + RK[r].abbr + ' ' + fmt(rest) + ' ед.'
    };
  };

  gens.tons = function () {
    var t = rand(2, 99), viaKg = Math.random() < 0.5;
    var n = viaKg ? t * 1000 : t * 10;
    return {
      kind: 'num',
      html: 'Сколько тонн составляют <span class="num">' + fmt(n) + '</span> ' + (viaKg ? 'кг' : 'ц') + '?',
      answer: t,
      hint: viaKg ? '1 т = 1 000 кг.' : '1 т = 10 ц.',
      explain: viaKg ? '1 т = 1 000 кг, значит ' + fmt(n) + ' : 1 000 = ' + t + ' т.'
        : '1 т = 10 ц, значит ' + fmt(n) + ' : 10 = ' + t + ' т.'
    };
  };

  /* ================= устный счёт ================= */

  gens.compl100 = function () {
    var a = rand(11, 99); if (a % 10 === 0) a += 3;
    return {
      kind: 'num', html: '<span class="expr">100 − ' + a + ' =</span>', answer: 100 - a,
      hint: 'Дополни ' + a + ' до ближайшего десятка, потом до ста.',
      explain: '100 − ' + a + ' = ' + (100 - a) + '.'
    };
  };
  gens.roundAdd = function () {
    var x = rand(2, 8) * 10 + rand(7, 9), y = rand(20, 80), up = Math.ceil(x / 10) * 10;
    return {
      kind: 'num', html: '<span class="expr">' + x + ' + ' + y + ' =</span>', answer: x + y,
      hint: 'Округли ' + x + ' до ' + up + ' и потом вычти лишнее.',
      explain: x + ' + ' + y + ' = ' + up + ' + ' + y + ' − ' + (up - x) + ' = ' + (x + y) + '.'
    };
  };
  gens.roundSub = function () {
    var x = rand(5, 9) * 10 + rand(2, 9), y = rand(1, Math.floor(x / 10) - 2) * 10 + rand(7, 9);
    var up = Math.ceil(y / 10) * 10;
    return {
      kind: 'num', html: '<span class="expr">' + x + ' − ' + y + ' =</span>', answer: x - y,
      hint: 'Округли вычитаемое ' + y + ' до ' + up + ', а потом прибавь лишнее.',
      explain: x + ' − ' + y + ' = ' + x + ' − ' + up + ' + ' + (up - y) + ' = ' + (x - y) + '.'
    };
  };
  gens.permuteSum = function () {
    var u = rand(1, 9), a = rand(1, 7) * 10 + u, c = rand(1, 7) * 10 + (10 - u), b = rand(11, 49);
    var arr = [a, b, c], order = [a, b, c];
    if (Math.random() < 0.5) order = [a, b, c]; else order = [c, b, a];
    return {
      kind: 'num', html: '<span class="expr">' + order.join(' + ') + ' =</span>', answer: a + b + c,
      hint: 'Переставь слагаемые: найди два, которые вместе дают круглое число.',
      explain: a + ' + ' + c + ' = ' + (a + c) + ', и ещё ' + b + ' → ' + (a + b + c) + '.'
    };
  };
  gens.seqMul = function () {
    var x = pick([15, 25, 35, 45, 55, 75]);
    var pr = pick([[12, 2, 6], [14, 2, 7], [16, 4, 4], [18, 2, 9], [24, 4, 6], [12, 3, 4]]);
    return {
      kind: 'num', html: '<span class="expr">' + x + ' × ' + pr[0] + ' =</span>', answer: x * pr[0],
      hint: 'Разложи ' + pr[0] + ' на два множителя: ' + pr[0] + ' = ' + pr[1] + ' × ' + pr[2] + ' — и умножай по очереди.',
      explain: x + ' × ' + pr[0] + ' = ' + x + ' × ' + pr[1] + ' × ' + pr[2] + ' = ' + (x * pr[1]) + ' × ' + pr[2] + ' = ' + (x * pr[0]) + '.'
    };
  };
  gens.unkDividend = function () {
    var a = rand(2, 9), b = pick([20, 30, 40, 50, 60, 70, 80, 90]);
    return {
      kind: 'num', html: 'Найди неизвестное делимое: <span class="expr">□ : ' + a + ' = ' + b + '</span>', answer: a * b,
      hint: 'Делимое = частное × делитель.',
      explain: b + ' × ' + a + ' = ' + (a * b) + ', проверка: ' + (a * b) + ' : ' + a + ' = ' + b + '.'
    };
  };
  gens.unkDivisor = function () {
    var y = pick([20, 30, 40, 50]), k = rand(3, 16), x = y * k;
    return {
      kind: 'num', html: 'Найди неизвестный делитель: <span class="expr">' + x + ' : □ = ' + y + '</span>', answer: k,
      hint: 'Делитель = делимое : частное.',
      explain: x + ' : ' + y + ' = ' + k + ', проверка: ' + x + ' : ' + k + ' = ' + y + '.'
    };
  };
  gens.chain = function (o) {
    var steps = (o && o.steps) || rand(4, 5), v = rand(6, 40), start = v, items = [], log = [];
    for (var i = 0; i < steps; i++) {
      var ops = ['add', 'sub', 'mul', 'div'], op, k, ok = false, guard = 0;
      while (!ok && guard++ < 30) {
        op = pick(ops);
        if (op === 'add') { k = rand(2, 60); ok = v + k <= 200; }
        else if (op === 'sub') { ok = v > 3; k = ok ? rand(2, v - 1) : 0; }
        else if (op === 'mul') { k = rand(2, 9); ok = v * k <= 200; }
        else {
          var ds = []; for (var q = 2; q <= v; q++) if (v % q === 0 && q <= 12) ds.push(q);
          ok = ds.length > 0; k = ok ? pick(ds) : 0;
        }
      }
      if (!ok) { op = 'add'; k = 5; }
      var nv = op === 'add' ? v + k : op === 'sub' ? v - k : op === 'mul' ? v * k : v / k;
      var sign = op === 'add' ? '+' : op === 'sub' ? '−' : op === 'mul' ? '×' : ':';
      items.push(sign + '\u00A0' + k);
      log.push(v + ' ' + sign + ' ' + k + ' = ' + nv);
      v = nv;
    }
    var html = '<div class="chain"><span class="chain-start">' + start + '</span>' +
      items.map(function (t) { return '<span class="chain-op">' + t + '</span>'; }).join('') + '</div>';
    return {
      kind: 'num', html: 'Выполни цепочку по порядку:' + html, answer: v,
      hint: 'Начни с первого числа и выполняй действия одно за другим.',
      explain: 'По шагам: ' + log.join('; ') + '. Ответ: ' + v + '.'
    };
  };

  /* ================= задачи ================= */

  gens.pHaul = function () {
    var p = pick([250, 500, 1000]), n = pick([20, 40, 50]);
    var perTrip = p * n, ans = 1000000 / perTrip;
    return {
      kind: 'num',
      html: 'Для стройки нужно привезти <b>1 000 000 кирпичей</b>. На один поддон помещается ' + fmt(p) + ' кирпичей, а на грузовик грузят ' + n +
        ' поддонов. Сколько рейсов потребуется?',
      answer: ans,
      hint: 'Сначала узнай, сколько кирпичей грузовик привозит за один рейс.',
      explain: '1) ' + fmt(p) + ' × ' + n + ' = ' + fmt(perTrip) + ' (кирпичей) — за один рейс. 2) 1 000 000 : ' + fmt(perTrip) + ' = ' + ans + ' (рейсов).'
    };
  };
  gens.pFlight = function () {
    var v = pick([200, 250, 400, 500, 800, 1000]), ans = 1000000 / v;
    return {
      kind: 'num',
      html: 'Самолёт летит со скоростью ' + fmt(v) + ' км в час. Сколько часов ему нужно лететь, чтобы преодолеть <b>1 000 000 км</b>?',
      answer: ans,
      hint: 'Время = расстояние : скорость.',
      explain: '1 000 000 : ' + fmt(v) + ' = ' + fmt(ans) + ' (ч). Для сравнения: от Земли до Луны около 384 000 км, а миллион километров — больше двух с половиной таких расстояний.'
    };
  };
  gens.pPump = function () {
    var s = pick([50, 100, 125, 200, 250, 500]), ans = 1000000 / s;
    return {
      kind: 'num',
      html: 'Насос качает ' + s + ' литров воды в минуту. Сколько <b>минут</b> ему нужно работать, чтобы перекачать миллион литров?',
      answer: ans,
      hint: 'Сколько раз по ' + s + ' литров содержится в 1 000 000 литров?',
      explain: '1 000 000 : ' + s + ' = ' + fmt(ans) + ' (мин). Это ' + Math.floor(ans / 60) + ' ч ' + (ans % 60) + ' мин.'
    };
  };
  gens.pLibraries = function () {
    var a = rand(2, 9) * 500000 + rand(0, 4) * 100000, b = rand(2, 9) * 100000;
    return {
      kind: 'nums',
      html: 'В первой библиотеке ' + fmt(a) + ' книг, а во второй на ' + fmt(b) + ' книг больше. Сколько книг во второй библиотеке и сколько в двух вместе?',
      fields: [{ label: 'во второй' }, { label: 'в двух вместе' }],
      answer: [a + b, 2 * a + b],
      hint: 'Во второй — первое число плюс разница. Вместе — сложи обе библиотеки.',
      explain: '1) ' + fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(a + b) + '. 2) ' + fmt(a) + ' + ' + fmt(a + b) + ' = ' + fmt(2 * a + b) + '.'
    };
  };
  gens.pPeople = function () {
    var a = rand(12, 190), b = rand(5, 60);
    return {
      kind: 'num',
      html: 'В одном государстве живёт ' + a + ' млн человек, а в другом — на ' + b + ' млн больше. Сколько <b>миллионов</b> человек в двух государствах вместе?',
      answer: 2 * a + b,
      hint: 'Считай прямо в миллионах, как в обычных числах.',
      explain: '1) ' + a + ' + ' + b + ' = ' + (a + b) + ' (млн) — во втором. 2) ' + a + ' + ' + (a + b) + ' = ' + (2 * a + b) + ' (млн).'
    };
  };
  gens.pDaySeconds = function () {
    var n = rand(2, 9);
    return {
      kind: 'num',
      html: 'В часе 60 минут, в минуте 60 секунд, а в сутках 24 часа. Сколько секунд в <b>' + n + ' сутках</b>?',
      answer: 86400 * n,
      hint: 'Сначала узнай, сколько секунд в одном часе, потом в одних сутках.',
      explain: '1) 60 × 60 = 3 600 (с) в часе. 2) 3 600 × 24 = 86 400 (с) в сутках. 3) 86 400 × ' + n + ' = ' + fmt(86400 * n) + ' (с).'
    };
  };
  gens.pBillionSeconds = function () {
    var opts = ['около 3 лет', 'около 32 лет', 'около 320 лет', 'около 3 200 лет'];
    return {
      kind: 'choice',
      html: 'В году 31 536 000 секунд. Примерно сколько лет прошло бы за <b>1 миллиард секунд</b>?',
      options: opts, answer: 1,
      hint: 'Округли 31 536 000 до 30 000 000 и подумай, сколько раз это число содержится в миллиарде.',
      explain: '1 000 000 000 : 31 536 000 — чуть меньше 32. Для прикидки: 1 000 000 000 : 30 000 000 — это около 33, то есть порядка тридцати лет.'
    };
  };
  gens.pPack = function () {
    var a = rand(2, 60), b = rand(2, 9), c = rand(1, 9);
    return {
      kind: 'num',
      html: 'Карандаши упаковывают в пачки по 10 штук, а пачки — в коробки по 100 штук. Сколько всего карандашей в ' + a + ' ' +
        R.plural(a, ['коробке', 'коробках', 'коробках']) + ', ' + b + ' ' + R.plural(b, ['пачке', 'пачках', 'пачках']) +
        ' и ещё ' + c + ' ' + R.plural(c, ['отдельном', 'отдельных', 'отдельных']) + ' карандаш' + (c === 1 ? 'е' : 'ах') + '?',
      answer: a * 100 + b * 10 + c,
      hint: 'Раздроби всё в простые единицы (штуки) и сложи.',
      explain: a + ' сот. + ' + b + ' дес. + ' + c + ' ед. = ' + fmt(a * 100) + ' + ' + (b * 10) + ' + ' + c + ' = ' + fmt(a * 100 + b * 10 + c) + '.'
    };
  };
  gens.pTons = function () {
    var n = rand(50, 999);
    return {
      kind: 'nums',
      html: 'Комбайн собрал ' + n + ' ц зерна. Сколько это целых тонн и сколько центнеров останется?',
      fields: [{ label: 'т' }, { label: 'ц' }],
      answer: [Math.floor(n / 10), n % 10],
      hint: '1 т = 10 ц. Сколько раз по 10 ц содержится в ' + n + ' ц?',
      explain: n + ' : 10 = ' + Math.floor(n / 10) + ' (ост. ' + (n % 10) + '). Значит ' + Math.floor(n / 10) + ' т ' + (n % 10) + ' ц.'
    };
  };

  /* ================= общая чистка текста ================= */
  /* после сокращений вроде «ед.» не должно получаться «ед..» */
  var tidy = R.tidy;
  Object.keys(gens).forEach(function (name) {
    var raw = gens[name];
    gens[name] = function (o) {
      var q = raw(o);
      q.html = tidy(q.html); q.explain = tidy(q.explain); q.hint = tidy(q.hint);
      return q;
    };
  });

  /* ================= сборка набора ================= */

  /* spec: [{g:'имя', n:3, o:{…}}, …] → массив вопросов без повторов */
  R.build = function (spec, shuffled) {
    var out = [], seen = {};
    spec.forEach(function (s) {
      var made = 0, guard = 0;
      while (made < (s.n || 1) && guard++ < 60) {
        var q = gens[s.g](s.o || {});
        if (seen[q.html]) continue;
        seen[q.html] = 1; q.g = s.g; out.push(q); made++;
      }
    });
    return shuffled ? shuffle(out) : out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
