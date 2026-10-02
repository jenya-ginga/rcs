/* Блок «Диаграммы и площадь», уроки 84–91: столбчатые диаграммы, повторение геометрии, понятие о площади,
   измерение площади прямоугольника, правило S = a × b, задачи на площадь и на составные фигуры.
   Префикс имён: ar. Рисунки — свои SVG-помощники R.arBarsSVG, R.arGridSVG, R.arPolySVG, R.arShapeSVG и др. */
(function (G) {
  'use strict';
  var R = G.RKS;
  var rand = R.rand, pick = R.pick, shuffle = R.shuffle, fmt = R.fmt, NB = R.NB;
  var gens = R.gens;
  var created = [];
  function reg(name, fn) {
    if (gens[name]) throw new Error('дубль ' + name);
    gens[name] = fn; created.push(name);
  }

  /* ================= общие мелочи ================= */
  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function unitN(n, forms) { return fmt(n) + NB + R.plural(n, forms); }
  function steps(list, ans) {
    return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>') + '<br>Ответ: ' + ans + '.';
  }
  function f1(x) { return Math.round(x * 10) / 10; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function sqU(u) { return u + '²'; }
  function sampleDistinct(k, lo, hi) {
    var a = [], i;
    for (i = lo; i <= hi; i++) a.push(i);
    return shuffle(a).slice(0, k);
  }
  function distinctOptions(right, cands, k) {
    var seen = {}, out = []; seen[right] = 1;
    shuffle(cands).forEach(function (c) { if (out.length < k && !seen[c]) { seen[c] = 1; out.push(c); } });
    return out;
  }

  /* ================= столбчатая диаграмма (SVG) ================= */
  /* o.labels — подписи столбиков; o.values — значения (null — столбик не нарисован, вместо него «?»);
     o.step — сколько единиц в одной клетке; o.cells — высота шкалы в клетках; o.hi — номер выделенного столбика;
     o.show — показывать числа над столбиками; o.mini — маленький рисунок для вариантов ответа; o.note — подпись масштаба. */
  R.arBarsSVG = function (o) {
    var labels = o.labels, vals = o.values, step = o.step, n = labels.length, i, j;
    var mx = 0;
    vals.forEach(function (v) { if (v != null && v > mx) mx = v; });
    var cells = o.cells || Math.max(6, Math.ceil(mx / step) + 1);
    var mini = !!o.mini;
    var cp = o.cell || (mini ? 10 : 16), slotC = 4, bwC = 2, slot = slotC * cp, bw = bwC * cp;
    var every = o.every || (cells <= 8 ? 1 : (cells <= 14 ? 2 : 5));
    if (mini && !o.every) every = cells <= 6 ? 1 : (cells <= 12 ? 2 : 5);
    var lm = o.lm || (String(cells * step).length >= 4 ? (mini ? 34 : 46) : (mini ? 28 : 36));
    var tm = o.tm != null ? o.tm : (mini ? 12 : 24), bm = o.bm || (mini ? 20 : 26);
    var W = lm + n * slot + (mini ? 6 : 12), H = tm + cells * cp + bm, base = tm + cells * cp;
    var s = '';
    for (j = 0; j <= cells; j++) {
      var y = tm + (cells - j) * cp;
      s += '<path class="ar-g' + (j % every === 0 ? ' ar-gm' : '') + '" d="M' + lm + ' ' + y + 'H' + (lm + n * slot) + '"/>';
    }
    for (i = 0; i <= n * slotC; i++) s += '<path class="ar-g" d="M' + (lm + i * cp) + ' ' + tm + 'V' + base + '"/>';
    for (j = 0; j <= cells; j += every) {
      s += '<text class="ar-t" x="' + (lm - 5) + '" y="' + (tm + (cells - j) * cp + 4) + '" text-anchor="end">' + fmt(j * step) + '</text>';
    }
    for (i = 0; i < n; i++) {
      var x = lm + i * slot + ((slotC - bwC) / 2) * cp, v = vals[i];
      if (v == null) {
        s += '<text class="ar-q" x="' + (x + bw / 2) + '" y="' + (base - 8) + '" text-anchor="middle">?</text>';
      } else {
        var h = v / step * cp;
        s += '<rect class="ar-bar' + (o.hi === i ? ' hi' : '') + '" data-l="' + labels[i] + '" data-v="' + v + '" x="' + x + '" y="' + f1(base - h) + '" width="' + bw + '" height="' + f1(h) + '"/>';
        if (o.show) s += '<text class="ar-v" x="' + (x + bw / 2) + '" y="' + f1(base - h - 4) + '" text-anchor="middle">' + fmt(v) + '</text>';
      }
      s += '<text class="ar-c" x="' + (lm + i * slot + slot / 2) + '" y="' + (base + (mini ? 14 : 18)) + '" text-anchor="middle">' + labels[i] + '</text>';
    }
    s += '<path class="ar-ax" d="M' + lm + ' ' + tm + 'V' + base + 'H' + (lm + n * slot) + '"/>';
    if (o.note) s += '<text class="ar-t" x="' + (W - 4) + '" y="' + (mini ? 9 : 14) + '" text-anchor="end">' + o.note + '</text>';
    return '<svg class="fig ar-bars' + (mini ? ' ar-mini' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="Столбчатая диаграмма" data-cp="' + cp + '" data-step="' + step + '">' + s + '</svg>';
  };

  /* ================= контексты диаграмм ================= */
  var DAYS = [['Пн', 'в понедельник'], ['Вт', 'во вторник'], ['Ср', 'в среду'], ['Чт', 'в четверг'], ['Пт', 'в пятницу'], ['Сб', 'в субботу']];
  var MONTHS = [['Сен', 'в сентябре'], ['Окт', 'в октябре'], ['Ноя', 'в ноябре'], ['Дек', 'в декабре'], ['Янв', 'в январе'], ['Фев', 'в феврале'], ['Мар', 'в марте'], ['Апр', 'в апреле'], ['Май', 'в мае']];
  var CLS = [['4А', 'в классе 4А'], ['4Б', 'в классе 4Б'], ['4В', 'в классе 4В'], ['4Г', 'в классе 4Г'], ['4Д', 'в классе 4Д']];
  function seqTake(seq) {
    return function (k) { var st = rand(0, seq.length - k); return seq.slice(st, st + k).map(function (c) { return { lab: c[0], who: c[1] }; }); };
  }
  function poolTake(pool, whoFn) {
    return function (k) { return shuffle(pool).slice(0, k).map(function (c) { return { lab: c, who: whoFn(c) }; }); };
  }
  function pl(forms) { return function (n) { return fmt(n) + NB + R.plural(n, forms); }; }
  var BCTX = [
    { id: 'books', take: seqTake(CLS), steps: [10, 20], verb: 'прочитали', verbAll: 'прочитали', subj: '', what: 'книг', whoQ: 'В каком классе', all: 'в этих классах',
      per: 'в каждом классе', tot: pl(['книгу', 'книги', 'книг']),
      and: function (a, b) { return 'в классах ' + a.lab + ' и ' + b.lab; },
      scene: 'На диаграмме показано, сколько книг прочитали за четверть ученики четвёртых классов.' },
    { id: 'tickets', take: seqTake(DAYS), steps: [20, 50, 100], verb: 'продали', verbAll: 'продали', subj: '', what: 'билетов', whoQ: 'В какой день', all: 'за эти дни',
      per: 'за день', tot: pl(['билет', 'билета', 'билетов']), price: [40, 50, 60, 80, 100, 120, 150],
      and: function (a, b) { return a.who + ' и ' + b.who; },
      scene: 'На диаграмме показано, сколько билетов продали в кассе кинотеатра за несколько дней.' },
    { id: 'paper', take: seqTake(MONTHS), steps: [10, 20, 50], verb: 'собрали', verbAll: 'собрали', subj: '', what: 'килограммов макулатуры', whoQ: 'В каком месяце', all: 'за эти месяцы',
      per: 'за месяц', tot: function (n) { return fmt(n) + NB + 'кг макулатуры'; },
      and: function (a, b) { return a.who + ' и ' + b.who; },
      scene: 'На диаграмме показано, сколько килограммов макулатуры собрали школьники за несколько месяцев.' },
    { id: 'teams', take: poolTake(['Орлы', 'Ястребы', 'Соколы', 'Медведи', 'Волки', 'Тигры', 'Львы'], function (c) { return 'команда «' + c + '»'; }),
      steps: [10, 20], verb: 'набрала', verbAll: 'набрали', subj: '', what: 'очков', whoQ: 'Какая команда', all: 'все эти команды вместе',
      per: 'каждая команда', tot: pl(['очко', 'очка', 'очков']),
      and: function (a, b) { return 'команды «' + a.lab + '» и «' + b.lab + '»'; },
      scene: 'На диаграмме показано, сколько очков набрали команды на школьной спартакиаде.' },
    { id: 'farms', take: poolTake(['Заря', 'Луч', 'Родина', 'Рассвет', 'Мир', 'Колос'], function (c) { return 'на ферме «' + c + '»'; }),
      steps: [50, 100, 200], verb: 'надоили', verbAll: 'надоили', subj: '', what: 'литров молока', whoQ: 'На какой ферме', all: 'на этих фермах',
      per: 'на каждой ферме', tot: function (n) { return fmt(n) + NB + R.plural(n, ['литр', 'литра', 'литров']) + ' молока'; },
      and: function (a, b) { return 'на фермах «' + a.lab + '» и «' + b.lab + '»'; },
      scene: 'На диаграмме показано, сколько литров молока надоили за день на нескольких фермах.' },
    { id: 'cycle', take: seqTake(DAYS), steps: [10, 20], verb: 'проехал', verbAll: 'проехал', subj: 'велосипедист', what: 'километров', whoQ: 'В какой день', all: 'за эти дни',
      per: 'за день', tot: function (n) { return fmt(n) + NB + 'км'; },
      and: function (a, b) { return a.who + ' и ' + b.who; },
      scene: 'Велосипедист записывал, сколько километров он проезжал каждый день. Результаты показаны на диаграмме.',
      tscene: 'В таблице записано, сколько километров проезжал велосипедист каждый день.' }
  ];
  function tsc(ctx) { return ctx.tscene || ctx.scene.replace('На диаграмме показано', 'В таблице записано'); }
  function ctxById(id) { return BCTX.filter(function (c) { return c.id === id; })[0]; }

  /* данные диаграммы: k столбиков, целое число клеток у каждого */
  function barData(k, o) {
    o = o || {};
    var ctx = o.ctx || pick(BCTX), step = o.step || pick(ctx.steps);
    var cells = o.cells || sampleDistinct(k, o.minc || 2, o.maxc || 10);
    return {
      ctx: ctx, step: step, k: k, cats: ctx.take(k), cells: cells,
      vals: cells.map(function (c) { return c * step; })
    };
  }
  function scaleText(d) { return 'Масштаб: в 1 клетке — ' + d.ctx.tot(d.step) + '.'; }
  function chartHTML(d, o) {
    o = o || {};
    return '<span class="ar-cap">' + d.ctx.scene + ' ' + scaleText(d) + '</span>' +
      R.arBarsSVG({ labels: d.cats.map(function (c) { return c.lab; }), values: o.values || d.vals, step: d.step, hi: o.hi, show: o.show, cells: o.cells });
  }
  function qHow(d, i) { var c = d.ctx; return 'Сколько ' + c.what + ' ' + c.verb + ' ' + (c.subj ? c.subj + ' ' : '') + d.cats[i].who + '?'; }
  function factSent(ctx, cat, n) {
    return (ctx.subj ? cap(ctx.subj) + ' ' + cat.who : cap(cat.who)) + ' ' + ctx.verb + ' ' + ctx.tot(n) + '.';
  }
  function cellsWord(n) { return unitN(n, ['клетка', 'клетки', 'клеток']); }
  function qDiff(d, hi, lo, more) {
    var c = d.ctx;
    return 'На сколько ' + c.what + ' ' + (more ? 'больше' : 'меньше') + ' ' + c.verb + ' ' + (c.subj ? c.subj + ' ' : '') + d.cats[more ? hi : lo].who + ', чем ' + d.cats[more ? lo : hi].who + '?';
  }
  function argMax(a) { var b = 0; a.forEach(function (x, i) { if (x > a[b]) b = i; }); return b; }
  function argMin(a) { var b = 0; a.forEach(function (x, i) { if (x < a[b]) b = i; }); return b; }
  function sum(a) { return a.reduce(function (s, x) { return s + x; }, 0); }
  function qMostWhere(d, most) {
    var c = d.ctx;
    return c.whoQ + ' ' + (c.subj ? c.subj + ' ' : '') + c.verb + ' ' + (most ? 'больше' : 'меньше') + ' всего ' + c.what + '?';
  }

  /* ---------- читаем значение по столбику ---------- */
  reg('arBarRead', function (o) {
    o = o || {};
    var d = barData(o.k || pick([3, 4, 4, 5]), o), ask = o.ask || pick(['value', 'value', 'extreme']), i, text, why;
    if (ask === 'extreme') {
      var hiMode = Math.random() < 0.5;
      i = hiMode ? argMax(d.cells) : argMin(d.cells);
      text = 'Сколько ' + d.ctx.what + ' обозначает самый ' + (hiMode ? 'высокий' : 'низкий') + ' столбик?';
      why = 'Самый ' + (hiMode ? 'высокий' : 'низкий') + ' столбик — «' + d.cats[i].lab + '», его высота ' + cellsWord(d.cells[i]) + '. ';
    } else {
      i = rand(0, d.k - 1);
      text = qHow(d, i);
      why = 'Высота столбика «' + d.cats[i].lab + '» — ' + cellsWord(d.cells[i]) + '. ';
    }
    return {
      kind: 'num', html: chartHTML(d, { hi: null }) + '<span class="ar-q">' + text + '</span>', answer: d.vals[i],
      hint: 'Сосчитай клетки в высоту столбика и умножь на число единиц в одной клетке. Или найди на шкале число на уровне верхнего края столбика.',
      explain: why + 'В одной клетке ' + fmt(d.step) + ', поэтому ' + d.cells[i] + ' × ' + fmt(d.step) + ' = ' + fmt(d.vals[i]) + '. Ответ: ' + fmt(d.vals[i]) + '.'
    };
  });

  /* ---------- записываем таблицу по диаграмме ---------- */
  reg('arBarTable', function (o) {
    o = o || {};
    var d = barData(o.k || pick([3, 3, 4]), o);
    return {
      kind: 'nums', html: chartHTML(d) + '<span class="ar-q">Запиши по диаграмме, чему равен каждый столбик.</span>',
      fields: d.cats.map(function (c) { return { label: c.lab }; }), answer: d.vals.slice(),
      hint: 'Для каждого столбика сосчитай его высоту в клетках и умножь на ' + fmt(d.step) + '.',
      explain: d.cats.map(function (c, i) { return '«' + c.lab + '»: ' + d.cells[i] + ' × ' + fmt(d.step) + ' = ' + fmt(d.vals[i]); }).join('<br>') +
        '<br>Ответ: ' + d.vals.map(fmt).join(', ') + '.'
    };
  });

  /* ---------- где больше всего / меньше всего ---------- */
  reg('arBarWho', function (o) {
    o = o || {};
    var d = barData(o.k || pick([4, 4, 5]), o), most = o.most == null ? Math.random() < 0.5 : o.most;
    var right = most ? argMax(d.cells) : argMin(d.cells);
    var idx = [right];
    shuffle(d.cats.map(function (c, i) { return i; })).forEach(function (i) { if (idx.length < 4 && i !== right) idx.push(i); });
    idx = shuffle(idx);
    var opts = idx.map(function (i) { return d.cats[i].lab; });
    return {
      kind: 'choice', html: chartHTML(d) + '<span class="ar-q">' + qMostWhere(d, most) + '</span>', options: opts, answer: idx.indexOf(right), wide: false,
      hint: 'Найди ' + (most ? 'самый высокий' : 'самый низкий') + ' столбик и прочитай подпись под ним.',
      explain: (most ? 'Самый высокий' : 'Самый низкий') + ' столбик — «' + d.cats[right].lab + '»: ' + cellsWord(d.cells[right]) + ' (' + fmt(d.vals[right]) + '). Ответ: ' + d.cats[right].lab + '.'
    };
  });

  /* ---------- сравнение: на сколько, во сколько раз, вместе ---------- */
  function timesData(k) {
    var lo = rand(1, 4), m = rand(2, 4), hi = lo * m;
    while (hi > 10) { lo = rand(1, 3); m = rand(2, 4); hi = lo * m; }
    var rest = shuffle(sampleDistinct(12, 1, 10).filter(function (x) { return x !== lo && x !== hi; })).slice(0, k - 2);
    var cells = shuffle([lo, hi].concat(rest));
    return { cells: cells, lo: cells.indexOf(lo), hi: cells.indexOf(hi), m: m };
  }
  reg('arBarDiff', function (o) {
    o = o || {};
    var type = o.type || pick(['diff', 'times', 'sum2', 'total']), k = o.k || pick([3, 4, 4, 5]), d, i1, i2, text, ans, why;
    if (type === 'times') {
      var t = timesData(k);
      d = barData(k, { ctx: o.ctx, step: o.step, cells: t.cells });
      var c = d.ctx;
      text = 'Во сколько раз больше ' + c.what + ' ' + c.verb + ' ' + (c.subj ? c.subj + ' ' : '') + d.cats[t.hi].who + ', чем ' + d.cats[t.lo].who + '?';
      ans = t.m;
      why = 'Столбик «' + d.cats[t.hi].lab + '» — ' + d.cells[t.hi] + ' ' + R.plural(d.cells[t.hi], ['клетка', 'клетки', 'клеток']) + ', «' + d.cats[t.lo].lab + '» — ' + d.cells[t.lo] + '. ' +
        'Значения: ' + fmt(d.vals[t.hi]) + ' и ' + fmt(d.vals[t.lo]) + '. Узнаём, во сколько раз первое число больше второго: ' + fmt(d.vals[t.hi]) + ' : ' + fmt(d.vals[t.lo]) + ' = ' + ans + '. Ответ: в ' + ans + ' ' + R.plural(ans, ['раз', 'раза', 'раз']) + '.';
      return { kind: 'num', html: chartHTML(d) + '<span class="ar-q">' + text + '</span>', answer: ans,
        hint: 'Чтобы узнать, во сколько раз одно число больше другого, раздели большее на меньшее. Можно делить и число клеток.', explain: why };
    }
    d = barData(k, o);
    var order = shuffle(d.cells.map(function (x, i) { return i; }));
    if (type === 'diff') {
      i1 = order[0]; i2 = order[1];
      var hiI = d.cells[i1] > d.cells[i2] ? i1 : i2, loI = hiI === i1 ? i2 : i1, more = Math.random() < 0.6;
      text = qDiff(d, hiI, loI, more);
      ans = d.vals[hiI] - d.vals[loI];
      why = 'Столбик «' + d.cats[hiI].lab + '» — ' + fmt(d.vals[hiI]) + ', столбик «' + d.cats[loI].lab + '» — ' + fmt(d.vals[loI]) + '. Разность: ' + fmt(d.vals[hiI]) + ' − ' + fmt(d.vals[loI]) + ' = ' + fmt(ans) +
        '. (По клеткам: ' + d.cells[hiI] + ' − ' + d.cells[loI] + ' = ' + (d.cells[hiI] - d.cells[loI]) + ', ' + (d.cells[hiI] - d.cells[loI]) + ' × ' + fmt(d.step) + ' = ' + fmt(ans) + '.) Ответ: ' + fmt(ans) + '.';
      return { kind: 'num', html: chartHTML(d) + '<span class="ar-q">' + text + '</span>', answer: ans,
        hint: 'Найди значения двух столбиков и вычти меньшее из большего. Можно вычесть число клеток и умножить на масштаб.', explain: why };
    }
    if (type === 'sum2') {
      i1 = order[0]; i2 = order[1];
      var cc = d.ctx;
      text = 'Сколько ' + cc.what + ' ' + cc.verbAll + ' ' + (cc.subj ? cc.subj + ' ' : '') + cc.and(d.cats[i1], d.cats[i2]) + ' вместе?';
      ans = d.vals[i1] + d.vals[i2];
      why = '«' + d.cats[i1].lab + '»: ' + d.cells[i1] + ' × ' + fmt(d.step) + ' = ' + fmt(d.vals[i1]) + '; «' + d.cats[i2].lab + '»: ' + d.cells[i2] + ' × ' + fmt(d.step) + ' = ' + fmt(d.vals[i2]) +
        '. Вместе: ' + fmt(d.vals[i1]) + ' + ' + fmt(d.vals[i2]) + ' = ' + fmt(ans) + '. Ответ: ' + fmt(ans) + '.';
      return { kind: 'num', html: chartHTML(d) + '<span class="ar-q">' + text + '</span>', answer: ans,
        hint: 'Узнай значение каждого из двух столбиков и сложи.', explain: why };
    }
    var c2 = d.ctx;
    text = 'Сколько ' + c2.what + ' ' + c2.verbAll + ' ' + (c2.subj ? c2.subj + ' ' : '') + c2.all + '?';
    ans = sum(d.vals);
    why = 'Складываем значения всех столбиков: ' + d.vals.map(fmt).join(' + ') + ' = ' + fmt(ans) + '. (Можно сложить клетки: ' + d.cells.join(' + ') + ' = ' + sum(d.cells) + ' и умножить на ' + fmt(d.step) + '.) Ответ: ' + fmt(ans) + '.';
    return { kind: 'num', html: chartHTML(d) + '<span class="ar-q">' + text + '</span>', answer: ans,
      hint: 'Найди значение каждого столбика и сложи все числа.', explain: why };
  });

  /* ---------- один столбик не дорисован ---------- */
  reg('arBarMiss', function (o) {
    o = o || {};
    var k = o.k || pick([4, 4, 5]), d = barData(k, o), m = rand(0, k - 1), ask = o.ask || pick(['value', 'cells']);
    var total = sum(d.vals), known = d.vals.filter(function (v, i) { return i !== m; }), c = d.ctx;
    var vs = d.vals.slice(); vs[m] = null;
    var text = 'Столбик «' + d.cats[m].lab + '» не дорисован. Известно, что ' + c.all + ' ' + c.verbAll + ' ' + (c.subj ? c.subj + ' ' : '') + 'всего ' + c.tot(total) + '. ';
    text += ask === 'value' ? qHow(d, m) : 'Сколько клеток должна занять высота этого столбика?';
    var s1 = known.map(fmt).join(' + ') + ' = ' + fmt(sum(known));
    return {
      kind: 'num', html: chartHTML(d, { values: vs }) + '<span class="ar-q">' + text + '</span>', answer: ask === 'value' ? d.vals[m] : d.cells[m],
      hint: 'Сложи значения всех нарисованных столбиков и вычти сумму из общего числа.' + (ask === 'cells' ? ' Потом раздели на масштаб.' : ''),
      explain: '1) Нарисованные столбики вместе: ' + s1 + '.<br>2) Не дорисованный столбик: ' + fmt(total) + ' − ' + fmt(sum(known)) + ' = ' + fmt(d.vals[m]) + '.' +
        (ask === 'cells' ? '<br>3) Высота в клетках: ' + fmt(d.vals[m]) + ' : ' + fmt(d.step) + ' = ' + d.cells[m] + '.<br>Ответ: ' + d.cells[m] + '.' : '<br>Ответ: ' + fmt(d.vals[m]) + '.')
    };
  });

  /* ---------- клетки и числа ---------- */
  reg('arBarCells', function (o) {
    o = o || {};
    var d = barData(1, { ctx: o.ctx, step: o.step, cells: [rand(2, 12)] }), dir = o.dir || pick(['cells', 'value', 'step']), c = d.ctx, cat = d.cats[0], n = d.cells[0], v = d.vals[0];
    if (dir === 'cells') {
      return {
        kind: 'num', html: factSent(c, cat, v) + ' ' + scaleText(d) + '<br>Сколько клеток займёт столбик на диаграмме?', answer: n,
        hint: 'Сколько раз число ' + fmt(d.step) + ' уместится в ' + fmt(v) + '? Раздели.',
        explain: 'В одной клетке ' + fmt(d.step) + ', значит, клеток: ' + fmt(v) + ' : ' + fmt(d.step) + ' = ' + n + '. Ответ: ' + n + '.'
      };
    }
    if (dir === 'value') {
      return {
        kind: 'num', html: scaleText(d) + ' Высота столбика «' + cat.lab + '» — ' + cellsWord(n) + '. Сколько ' + c.what + ' он обозначает?', answer: v,
        hint: 'Каждая клетка — ' + c.tot(d.step) + '. Умножь число клеток на число в одной клетке.',
        explain: n + ' × ' + fmt(d.step) + ' = ' + fmt(v) + '. Ответ: ' + fmt(v) + '.'
      };
    }
    return {
      kind: 'num', html: 'Столбик высотой ' + cellsWord(n) + ' обозначает ' + c.tot(v) + '. Сколько в одной клетке (каков масштаб)?', answer: d.step,
      hint: 'Раздели значение столбика на число клеток.',
      explain: fmt(v) + ' : ' + n + ' = ' + fmt(d.step) + '. Значит, в 1 клетке — ' + c.tot(d.step) + '. Ответ: ' + fmt(d.step) + '.'
    };
  });

  /* ---------- строим по таблице: высоты в клетках ---------- */
  function tableHTML(cats, vals) {
    return '<table class="mt ar-tab"><tr>' + cats.map(function (c) { return '<th>' + c.lab + '</th>'; }).join('') + '</tr><tr>' +
      vals.map(function (v) { return '<td>' + fmt(v) + '</td>'; }).join('') + '</tr></table>';
  }
  reg('arBarBuild', function (o) {
    o = o || {};
    var d = barData(o.k || pick([3, 4, 4]), { ctx: o.ctx, step: o.step, maxc: o.maxc || 12, minc: 1 }), c = d.ctx;
    return {
      kind: 'nums', html: tsc(c) + tableHTML(d.cats, d.vals) + '<span class="ar-q">Ты строишь диаграмму. ' + scaleText(d) + ' Сколько клеток должна занять высота каждого столбика?</span>',
      fields: d.cats.map(function (x) { return { label: x.lab }; }), answer: d.cells.slice(),
      hint: 'Раздели каждое число таблицы на ' + fmt(d.step) + ': получишь число клеток.',
      explain: d.cats.map(function (x, i) { return '«' + x.lab + '»: ' + fmt(d.vals[i]) + ' : ' + fmt(d.step) + ' = ' + d.cells[i]; }).join('<br>') + '<br>Ответ: ' + d.cells.join(', ') + '.'
    };
  });

  /* ---------- выбери верную диаграмму ---------- */
  reg('arBarPick', function (o) {
    o = o || {};
    var k = o.k || pick([3, 4]), d = barData(k, { ctx: o.ctx, step: o.step, minc: 1, maxc: 8 }), c = d.ctx, labs = d.cats.map(function (x) { return x.lab; });
    var rows = 9, tries = 0, opts, sigs;
    function mini(vals, step) { return '<span class="ar-opt">' + R.arBarsSVG({ labels: labs, values: vals, step: step, cells: rows, mini: true }) + '</span>'; }
    function tweak() {
      var cells = d.cells.slice(), i = rand(0, k - 1), dd = pick([-2, -1, 1, 2]);
      cells[i] = Math.max(1, Math.min(8, cells[i] + dd));
      return cells;
    }
    function swapped() {
      var cells = d.cells.slice(), i = rand(0, k - 1), j = (i + rand(1, k - 1)) % k, t = cells[i]; cells[i] = cells[j]; cells[j] = t;
      return cells;
    }
    do {
      var variants = [
        { cells: d.cells, step: d.step, key: 'ok' },
        { cells: swapped(), step: d.step, key: 's' },
        { cells: tweak(), step: d.step, key: 't' },
        { cells: d.cells, step: d.step * 2, key: 'sc' }
      ];
      sigs = variants.map(function (v) { return v.cells.map(function (x) { return x * v.step; }).join(','); });
      tries++;
    } while (tries < 30 && (new Set(sigs).size < 4));
    if (new Set(sigs).size < 4) return gens.arBarPick(o);
    variants = shuffle(variants);
    opts = variants.map(function (v) { return mini(v.cells.map(function (x) { return x * v.step; }), v.step); });
    var right = variants.map(function (v) { return v.key; }).indexOf('ok');
    return {
      kind: 'choice', wide: false, options: opts, answer: right,
      html: tsc(c) + tableHTML(d.cats, d.vals) + '<span class="ar-q">По таблице построили четыре диаграммы, у каждой своя шкала. Какая построена верно?</span>',
      hint: 'Для каждого столбика прочитай число на шкале около его верхнего края и сравни с таблицей. Не забывай смотреть на шкалу: у разных рисунков она разная.',
      explain: 'Верна диаграмма, где высота каждого столбика соответствует числу из таблицы: ' + d.cats.map(function (x, i) { return x.lab + ' — ' + fmt(d.vals[i]); }).join(', ') + '. ' +
        'В остальных либо два столбика поменяли местами, либо один столбик выше или ниже, чем надо, либо другая шкала (числа на ней другие).'
    };
  });

  /* ---------- выбери масштаб ---------- */
  reg('arBarScale', function (o) {
    o = o || {};
    var L = o.limit || 12, s = pick([10, 20, 50, 100, 200, 500]), k = pick([3, 4, 5]), cells, tries = 0;
    do {
      cells = sampleDistinct(k, 1, L);
      tries++;
    } while (tries < 200 && !(Math.max.apply(null, cells) >= 7 && Math.max.apply(null, cells) <= L && cells.some(function (x) { return x % 2 === 1; }) && cells.some(function (x) { return x % 3 !== 0; })));
    var vals = cells.map(function (x) { return x * s; }), mxv = Math.max.apply(null, vals);
    function valid(sc) { return vals.every(function (v) { return v % sc === 0; }) && mxv / sc <= L; }
    var cands = [s / 2, s * 2, s * 3, s * 5, s / 5, s * 4].filter(function (x) { return x === Math.floor(x) && x >= 2 && !valid(x); });
    var wrong = distinctOptions(s, cands, 3);
    if (wrong.length < 3 || !valid(s)) return gens.arBarScale(o);
    var sc = shuffle([s].concat(wrong));
    var opts = sc.map(function (x) { return 'в 1 клетке — ' + fmt(x); });
    var why = sc.map(function (x) {
      if (x === s) return 'в 1 клетке — ' + fmt(x) + ': все числа делятся на ' + fmt(x) + ', самый большой столбик ' + fmt(mxv) + ' : ' + fmt(x) + ' = ' + (mxv / x) + ' ' + R.plural(mxv / x, ['клетка', 'клетки', 'клеток']) + ' — помещается';
      var bad = vals.filter(function (v) { return v % x !== 0; })[0];
      return bad != null ? 'в 1 клетке — ' + fmt(x) + ': число ' + fmt(bad) + ' не делится на ' + fmt(x) + ' — целого числа клеток нет'
        : 'в 1 клетке — ' + fmt(x) + ': самый большой столбик ' + fmt(mxv) + ' : ' + fmt(x) + ' = ' + fmt(mxv / x) + ' ' + R.plural(mxv / x, ['клетка', 'клетки', 'клеток']) + ' — не поместится';
    }).join('.<br>');
    return {
      kind: 'choice', wide: false, options: opts, answer: sc.indexOf(s),
      html: 'Надо построить диаграмму по числам: <b>' + vals.map(fmt).join('; ') + '</b>. Высота листа — ' + L + ' клеток. Какой масштаб выбрать, чтобы высота каждого столбика была целым числом клеток и самый высокий столбик поместился на листе?',
      hint: 'Проверь каждый масштаб: делятся ли все числа на число в клетке нацело и сколько клеток получится у самого большого числа.',
      explain: why + '.<br>Ответ: в 1 клетке — ' + fmt(s) + '.'
    };
  });

  /* ---------- задачи по диаграмме ---------- */
  reg('arPBar', function (o) {
    o = o || {};
    var type = o.type || pick(['avg', 'level', 'twoCmp']), ctx = o.ctx;
    if (type === 'price') ctx = ctxById('tickets');
    var k = type === 'twoCmp' ? 4 : (o.k || pick([3, 4, 4, 5])), d, tries = 0, c, text, ans, why, hint;
    do {
      d = barData(k, { ctx: ctx, step: o.step, maxc: 9 });
      tries++;
    } while (type === 'avg' && tries < 200 && (sum(d.vals) % k !== 0));
    if (type === 'twoCmp') {
      /* пары (0,1) и (2,3) перемешаем: сумма первой пары больше */
      var p = shuffle([0, 1, 2, 3]), s1 = d.vals[p[0]] + d.vals[p[1]], s2 = d.vals[p[2]] + d.vals[p[3]];
      if (s1 === s2) return gens.arPBar(o);
      var a = s1 > s2 ? [p[0], p[1]] : [p[2], p[3]], b = s1 > s2 ? [p[2], p[3]] : [p[0], p[1]];
      c = d.ctx;
      text = 'На сколько ' + c.what + ' больше ' + c.verbAll + ' ' + (c.subj ? c.subj + ' ' : '') + c.and(d.cats[a[0]], d.cats[a[1]]) + ', чем ' + c.and(d.cats[b[0]], d.cats[b[1]]) + '?';
      ans = Math.abs(s1 - s2);
      why = steps([
        d.cats[a[0]].lab + ' и ' + d.cats[a[1]].lab + ' вместе: ' + fmt(d.vals[a[0]]) + ' + ' + fmt(d.vals[a[1]]) + ' = ' + fmt(d.vals[a[0]] + d.vals[a[1]]),
        d.cats[b[0]].lab + ' и ' + d.cats[b[1]].lab + ' вместе: ' + fmt(d.vals[b[0]]) + ' + ' + fmt(d.vals[b[1]]) + ' = ' + fmt(d.vals[b[0]] + d.vals[b[1]]),
        'Разность: ' + fmt(Math.max(s1, s2)) + ' − ' + fmt(Math.min(s1, s2)) + ' = ' + fmt(ans)], fmt(ans));
      hint = 'Найди сумму для каждой пары столбиков, потом вычти меньшую сумму из большей.';
    } else if (type === 'level') {
      c = d.ctx; var mx = Math.max.apply(null, d.vals);
      text = 'Все столбики хотят сделать такими же высокими, как самый высокий. Сколько ' + c.what + ' надо добавить ко всем остальным столбикам вместе?';
      ans = d.vals.reduce(function (s, v) { return s + (mx - v); }, 0);
      var gaps = d.vals.filter(function (v) { return v !== mx; }).map(function (v) { return mx - v; });
      why = steps(['Самый высокий столбик — ' + fmt(mx) + '.', 'Не хватает остальным: ' + d.vals.filter(function (v) { return v !== mx; }).map(function (v) { return fmt(mx) + ' − ' + fmt(v) + ' = ' + fmt(mx - v); }).join('; '),
        'Всего надо добавить: ' + gaps.map(fmt).join(' + ') + ' = ' + fmt(ans)], fmt(ans));
      hint = 'Для каждого столбика узнай, на сколько он ниже самого высокого, и сложи эти числа.';
    } else if (type === 'price') {
      c = d.ctx;
      var pr = pick(c.price), mode = o.mode || pick(['best', 'all']), best = Math.max.apply(null, d.vals);
      if (mode === 'best') {
        text = 'Билет стоит ' + pr + ' руб. Сколько рублей выручили в день, когда продали больше всего билетов?';
        ans = best * pr;
        why = steps(['Больше всего билетов продали в самый высокий день: ' + fmt(best) + '.', 'Выручка: ' + fmt(best) + ' × ' + pr + ' = ' + fmt(ans) + ' (руб.)'], fmt(ans));
        hint = 'Сначала найди наибольшее число билетов, потом умножи на цену билета.';
      } else {
        text = 'Билет стоит ' + pr + ' руб. Сколько рублей выручили за все эти дни?';
        ans = sum(d.vals) * pr;
        why = steps(['Всего билетов: ' + d.vals.map(fmt).join(' + ') + ' = ' + fmt(sum(d.vals)), 'Выручка: ' + fmt(sum(d.vals)) + ' × ' + pr + ' = ' + fmt(ans) + ' (руб.)'], fmt(ans));
        hint = 'Сложи числа всех столбиков, потом умножь на цену билета.';
      }
    } else {
      c = d.ctx;
      text = 'Сколько ' + c.what + ' ' + c.verb + ' ' + (c.subj ? c.subj + ' ' : '') + 'в среднем ' + c.per + '?';
      var tot = sum(d.vals); ans = tot / k;
      why = steps(['Всего: ' + d.vals.map(fmt).join(' + ') + ' = ' + fmt(tot), 'В среднем: ' + fmt(tot) + ' : ' + k + ' = ' + fmt(ans)], fmt(ans));
      hint = 'Среднее арифметическое: сложи все числа и раздели на их количество.';
    }
    return { kind: 'num', html: chartHTML(d) + '<span class="ar-q">' + text + '</span>', answer: ans, hint: hint, explain: why };
  });


  /* ================= виджеты ================= */
  R.widgetMounts = R.widgetMounts || {};
  function digitsOf(inp, maxLen) { return Number(String(inp.value).replace(/\D/g, '').slice(0, maxLen || 4)) || 0; }

  /* построй диаграмму: масштаб и четыре числа */
  R.widgetMounts.arBars = function (host) {
    var names = ['А', 'Б', 'В', 'Г'], defs = [60, 120, 90, 150], steps = [10, 20, 30, 40, 50, 100], h = '', i;
    h += '<div class="ar-wrow"><label class="fld"><span class="wlabel">В 1 клетке</span><select class="wsel">' +
      steps.map(function (x) { return '<option value="' + x + '"' + (x === 30 ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>';
    for (i = 0; i < 4; i++) h += '<label class="fld"><span class="wlabel">Столбик «' + names[i] + '»</span><input class="winput sm ar-i" inputmode="numeric" autocomplete="off" value="' + defs[i] + '"></label>';
    h += '</div><div class="w-out ar-wout" aria-live="polite"></div>';
    host.innerHTML = h;
    var sel = host.querySelector('select'), ins = Array.prototype.slice.call(host.querySelectorAll('.ar-i')), out = host.querySelector('.ar-wout');
    function upd() {
      var step = Number(sel.value), vals = ins.map(function (x) { return digitsOf(x, 4); }), bad = [], big = false, lines = [];
      vals.forEach(function (v, k) {
        if (v % step) bad.push(k);
        else lines.push('«' + names[k] + '»: ' + fmt(v) + ' : ' + step + ' = ' + (v / step) + ' ' + R.plural(v / step, ['клетка', 'клетки', 'клеток']));
        if (v / step > 14) big = true;
      });
      var html = '';
      if (bad.length) {
        html = bad.map(function (k) { return '<p class="facts ar-warn">Число ' + fmt(vals[k]) + ' (столбик «' + names[k] + '») не делится на ' + step + ' без остатка: столбик не уложится в целое число клеток. Выбери другой масштаб.</p>'; }).join('');
      } else if (big) {
        html = '<p class="facts ar-warn">Самый высокий столбик получится больше 14 клеток и не поместится на листе. Выбери масштаб покрупнее.</p>';
      } else {
        html = R.arBarsSVG({ labels: names, values: vals, step: step, show: true }) + '<p class="facts">' + lines.join('<br>') + '</p>';
      }
      out.innerHTML = html;
    }
    sel.addEventListener('change', upd);
    ins.forEach(function (x) { R.groupInput(x, 4); x.addEventListener('input', upd); });
    upd();
  };

  /* ================= площадь: общие помощники и рисунки ================= */
  function expr(s) { return '<span class="expr">' + s + '</span>'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  var EDGE = 'ar-edge';

  /* ---- прямоугольник с подписями сторон ----
     o.top / o.right / o.bottom / o.left — подписи; o.verts — буквы вершин (по часовой стрелке от левого верхнего);
     o.W, o.H — размер полотна; o.rightAngles — прямые углы; o.label — подпись для скринридера */
  R.arRectSVG = function (a, b, o) {
    o = o || {};
    var W = o.W || 280, H = o.H || 150, mx = o.mx || 56, my = 32;
    var tl = function (t) { return t == null ? 0 : String(t).replace(/<[^>]*>/g, '').length * 8.4 + (o.verts ? 22 : 12); };
    var needX = Math.max(tl(o.right), tl(o.left));
    if (needX > mx) { W += 2 * Math.ceil(needX - mx); mx = Math.ceil(needX); }
    var sc = Math.min((W - 2 * mx) / a, (H - 2 * my) / b);
    var rw = Math.min(W - 2 * mx, Math.max(44, a * sc)), rh = Math.min(H - 2 * my, Math.max(44, b * sc));
    var x = (W - rw) / 2, y = (H - rh) / 2, s = '', v = o.verts;
    s += '<rect class="r" x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(rw) + '" height="' + f1(rh) + '"/>';
    if (o.rightAngles !== false) {
      s += '<path class="ra" d="M' + f1(x + 9) + ' ' + f1(y) + 'V' + f1(y + 9) + 'H' + f1(x) + '"/>' +
        '<path class="ra" d="M' + f1(x + rw - 9) + ' ' + f1(y) + 'V' + f1(y + 9) + 'H' + f1(x + rw) + '"/>' +
        '<path class="ra" d="M' + f1(x + 9) + ' ' + f1(y + rh) + 'V' + f1(y + rh - 9) + 'H' + f1(x) + '"/>' +
        '<path class="ra" d="M' + f1(x + rw - 9) + ' ' + f1(y + rh) + 'V' + f1(y + rh - 9) + 'H' + f1(x + rw) + '"/>';
    }
    if (v) {
      s += '<text class="ar-vx" x="' + f1(x - 6) + '" y="' + f1(y - 6) + '" text-anchor="end">' + v[0] + '</text>' +
        '<text class="ar-vx" x="' + f1(x + rw + 6) + '" y="' + f1(y - 6) + '" text-anchor="start">' + v[1] + '</text>' +
        '<text class="ar-vx" x="' + f1(x + rw + 6) + '" y="' + f1(y + rh + 15) + '" text-anchor="start">' + v[2] + '</text>' +
        '<text class="ar-vx" x="' + f1(x - 6) + '" y="' + f1(y + rh + 15) + '" text-anchor="end">' + v[3] + '</text>';
    }
    var dy = v ? 16 : 8;
    if (o.top != null) s += '<text x="' + f1(x + rw / 2) + '" y="' + f1(y - dy) + '" text-anchor="middle">' + o.top + '</text>';
    if (o.bottom != null) s += '<text x="' + f1(x + rw / 2) + '" y="' + f1(y + rh + dy + 8) + '" text-anchor="middle">' + o.bottom + '</text>';
    if (o.right != null) s += '<text x="' + f1(x + rw + (v ? 18 : 8)) + '" y="' + f1(y + rh / 2 + 5) + '" text-anchor="start">' + o.right + '</text>';
    if (o.left != null) s += '<text x="' + f1(x - (v ? 18 : 8)) + '" y="' + f1(y + rh / 2 + 5) + '" text-anchor="end">' + o.left + '</text>';
    return '<svg class="fig ar-rect" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="' + (o.label || 'Прямоугольник') + '">' + s + '</svg>';
  };

  /* ---- клетчатый прямоугольник a (в длину) × b (в ширину) ----
     o.top / o.right — подписи сторон; o.rows — сколько рядов закрашено (по умолчанию все); o.hiRow — номер выделенного ряда;
     o.stripes — чередовать цвет рядов; o.rowLabels — подписи справа от каждого ряда; o.cs — размер клетки */
  R.arRectGridSVG = function (a, b, o) {
    o = o || {};
    var cs = o.cs || Math.max(14, Math.min(30, Math.floor(290 / a), Math.floor(190 / b)));
    var lm = 6, tm = o.top != null ? 26 : 6, rm = o.rowLabels ? 84 : (o.right != null ? 64 : 6), bm = 6;
    var W = lm + a * cs + rm, H = tm + b * cs + bm, s = '', r, c;
    var rows = o.rows == null ? b : o.rows;
    for (r = 0; r < b; r++) {
      for (c = 0; c < a; c++) {
        var cls = 'ar-cell';
        if (r >= rows) cls += ' ar-empty';
        else if (o.hiRow === r) cls += ' hi';
        else if (o.stripes && r % 2 === 1) cls += ' alt';
        s += '<rect class="' + cls + '" x="' + (lm + c * cs) + '" y="' + (tm + r * cs) + '" width="' + cs + '" height="' + cs + '"/>';
      }
      if (o.rowLabels && o.rowLabels[r] != null && r < rows) {
        s += '<text class="ar-t2" x="' + (lm + a * cs + 8) + '" y="' + (tm + r * cs + cs / 2 + 5) + '">' + o.rowLabels[r] + '</text>';
      }
    }
    s += '<rect class="ar-out" x="' + lm + '" y="' + tm + '" width="' + (a * cs) + '" height="' + (b * cs) + '"/>';
    if (o.top != null) s += '<text x="' + (lm + a * cs / 2) + '" y="' + (tm - 8) + '" text-anchor="middle">' + o.top + '</text>';
    if (o.right != null) s += '<text x="' + (lm + a * cs + 8) + '" y="' + (tm + b * cs / 2 + 5) + '">' + o.right + '</text>';
    return '<svg class="fig ar-rg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="' + (o.label || 'Прямоугольник из клеток') + '">' + s + '</svg>';
  };

  /* ---- фигура из клеток: cells — список [ряд, столбец] ---- */
  R.arCellsSVG = function (cells, o) {
    o = o || {};
    var cs = o.cs || 24, maxR = 0, maxC = 0, s = '';
    cells.forEach(function (p) { if (p[0] > maxR) maxR = p[0]; if (p[1] > maxC) maxC = p[1]; });
    var lm = 4, tm = 4, W = lm * 2 + (maxC + 1) * cs, H = tm * 2 + (maxR + 1) * cs;
    cells.forEach(function (p) {
      s += '<rect class="ar-cell' + (o.alt && o.alt(p) ? ' alt' : '') + '" x="' + (lm + p[1] * cs) + '" y="' + (tm + p[0] * cs) + '" width="' + cs + '" height="' + cs + '"/>';
    });
    return '<svg class="fig ar-cells" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="' + (o.label || 'Фигура из клеток') + '">' + s + '</svg>';
  };

  /* ---- составная фигура: pts — вершины (в единицах длины, y вниз), по порядку обхода ----
     o.labels — [{edge: номер стороны (от вершины i к i+1), t: 'подпись'}], o.cuts — [[x1,y1,x2,y2]] пунктир,
     o.holes — [[x,y,w,h]] вырезы с подписями o.holeLabels, o.fills — [{pts, cls}] закрашенные части */
  R.arPolySVG = function (pts, o) {
    o = o || {};
    var W = o.W || 300, H = o.H || 200, mx = 52, my = 34, i, s = '';
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var sc = Math.min((W - 2 * mx) / (x1 - x0), (H - 2 * my) / (y1 - y0));
    var offx = (W - sc * (x1 - x0)) / 2, offy = (H - sc * (y1 - y0)) / 2;
    function X(x) { return f1(offx + (x - x0) * sc); }
    function Y(y) { return f1(offy + (y - y0) * sc); }
    function path(list) { return 'M' + list.map(function (p) { return X(p[0]) + ' ' + Y(p[1]); }).join('L') + 'Z'; }
    (o.fills || []).forEach(function (f) { s += '<path class="ar-fill ' + (f.cls || '') + '" d="' + path(f.pts) + '"/>'; });
    s += '<path class="' + ((o.fills && o.fills.length) ? 'ar-line' : 'r ar-poly') + '" d="' + path(pts) + '"/>';
    (o.holes || []).forEach(function (h) {
      s += '<rect class="ar-hole" x="' + X(h[0]) + '" y="' + Y(h[1]) + '" width="' + f1(h[2] * sc) + '" height="' + f1(h[3] * sc) + '"/>';
    });
    (o.cuts || []).forEach(function (c) { s += '<path class="ref" d="M' + X(c[0]) + ' ' + Y(c[1]) + 'L' + X(c[2]) + ' ' + Y(c[3]) + '"/>'; });
    var A = 0;
    for (i = 0; i < pts.length; i++) { var q = pts[(i + 1) % pts.length]; A += pts[i][0] * q[1] - q[0] * pts[i][1]; }
    var sgn = A > 0 ? 1 : -1;
    (o.labels || []).forEach(function (lb) {
      if (lb.t === '' || lb.t == null) return;
      var p = pts[lb.edge], q2 = pts[(lb.edge + 1) % pts.length];
      var dx = q2[0] - p[0], dy = q2[1] - p[1], len = Math.sqrt(dx * dx + dy * dy), nx = sgn * dy / len, ny = -sgn * dx / len;
      if (lb.inside) { nx = -nx; ny = -ny; }
      var mxp = (parseFloat(X(p[0])) + parseFloat(X(q2[0]))) / 2, myp = (parseFloat(Y(p[1])) + parseFloat(Y(q2[1]))) / 2;
      if (Math.abs(ny) > Math.abs(nx)) {
        s += '<text x="' + f1(mxp) + '" y="' + f1(myp + (ny > 0 ? 17 : -7)) + '" text-anchor="middle">' + lb.t + '</text>';
      } else {
        s += '<text x="' + f1(mxp + (nx > 0 ? 8 : -8)) + '" y="' + f1(myp + 5) + '" text-anchor="' + (nx > 0 ? 'start' : 'end') + '">' + lb.t + '</text>';
      }
    });
    (o.texts || []).forEach(function (t) { s += '<text class="' + (t.cls || 'ar-t2') + '" x="' + X(t.x) + '" y="' + Y(t.y) + '" text-anchor="middle">' + t.t + '</text>'; });
    if (o.extra) s += o.extra(function (v) { return parseFloat(X(v)); }, function (v) { return parseFloat(Y(v)); });
    return '<svg class="fig ar-poly-fig" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="' + (o.label || 'Составная фигура') + '">' + s + '</svg>';
  };

  /* ---- линейка с отрезками: segs — [{s, e, lab}] ---- */
  R.arRulerSVG = function (segs, o) {
    o = o || {};
    var N = o.N || 12, u = 30, lm = 14, W = lm * 2 + N * u + 24, segH = 28, top = 10;
    var ry = top + segs.length * segH + 10, H = ry + 44, s = '', i;
    s += '<rect class="ar-ruler" x="' + lm + '" y="' + ry + '" width="' + (N * u) + '" height="32" rx="3"/>';
    for (i = 0; i <= N; i++) {
      var xx = lm + i * u;
      s += '<path class="ar-tick" d="M' + xx + ' ' + ry + 'v13"/>';
      if (i < N) s += '<path class="ar-tick" d="M' + (xx + u / 2) + ' ' + ry + 'v8"/>';
      s += '<text class="ar-t" x="' + xx + '" y="' + (ry + 28) + '" text-anchor="middle">' + i + '</text>';
    }
    s += '<text class="ar-t" x="' + (lm + N * u + 20) + '" y="' + (ry + 28) + '" text-anchor="middle">см</text>';
    segs.forEach(function (g, k) {
      var y = top + k * segH + segH / 2, xs = lm + g.s * u, xe = lm + g.e * u;
      s += '<path class="ref" d="M' + xs + ' ' + y + 'V' + ry + 'M' + xe + ' ' + y + 'V' + ry + '"/>';
      s += '<path class="ray" d="M' + xs + ' ' + y + 'H' + xe + '"/>';
      s += '<path class="ar-cap" d="M' + xs + ' ' + (y - 6) + 'v12M' + xe + ' ' + (y - 6) + 'v12"/>';
      if (g.lab) s += '<text x="' + (g.e > N - 2 ? xs - 10 : xe + 10) + '" y="' + (y + 5) + '" text-anchor="' + (g.e > N - 2 ? 'end' : 'start') + '">' + g.lab + '</text>';
    });
    return '<svg class="fig ar-ruler-fig" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="Линейка и отрезок">' + s + '</svg>';
  };

  /* ---- случайная фигура из k клеток (связная, помещается в maxR × maxC) ---- */
  function polyo(k, maxR, maxC) {
    var tries = 0;
    for (;;) {
      var cells = [[0, 0]], set = { '0,0': 1 }, guard = 0;
      while (cells.length < k && guard++ < 400) {
        var base = pick(cells), d = pick([[0, 1], [1, 0], [0, -1], [-1, 0]]), r = base[0] + d[0], c = base[1] + d[1], key = r + ',' + c;
        if (set[key]) continue;
        var rs = cells.map(function (p) { return p[0]; }).concat(r), cs2 = cells.map(function (p) { return p[1]; }).concat(c);
        if (Math.max.apply(null, rs) - Math.min.apply(null, rs) + 1 > maxR || Math.max.apply(null, cs2) - Math.min.apply(null, cs2) + 1 > maxC) continue;
        cells.push([r, c]); set[key] = 1;
      }
      if (cells.length === k || ++tries > 30) return normCells(cells);
    }
  }
  function normCells(cells) {
    var mr = Math.min.apply(null, cells.map(function (p) { return p[0]; })), mc = Math.min.apply(null, cells.map(function (p) { return p[1]; }));
    return cells.map(function (p) { return [p[0] - mr, p[1] - mc]; }).sort(function (p, q) { return p[0] - q[0] || p[1] - q[1]; });
  }
  function cellSig(cells) { return normCells(cells).map(function (p) { return p.join(','); }).join(';'); }
  function rectCells(a, b) { var out = [], r, c; for (r = 0; r < b; r++) for (c = 0; c < a; c++) out.push([r, c]); return out; }
  /* Г-образная фигура: прямоугольник a × b без угла c × d (угол справа вверху) */
  function lCells(a, b, c, d) {
    var out = [];
    rectCells(a, b).forEach(function (p) { if (!(p[0] < d && p[1] >= a - c)) out.push(p); });
    return out;
  }
  function rowCounts(cells) {
    var rows = {}, out = [];
    cells.forEach(function (p) { rows[p[0]] = (rows[p[0]] || 0) + 1; });
    Object.keys(rows).map(Number).sort(function (x, y) { return x - y; }).forEach(function (r) { out.push(rows[r]); });
    return out;
  }
  function pair(figA, figB, capA, capB) {
    return '<div class="ar-pair"><figure>' + figA + '<figcaption>' + capA + '</figcaption></figure><figure>' + figB + '<figcaption>' + capB + '</figcaption></figure></div>';
  }
  function plusSum(list) { return list.join(' + '); }

  /* ================= урок 85: линейка, глазомер, прямоугольник, периметр ================= */
  reg('arRuler', function (o) {
    o = o || {};
    var type = o.type || pick(['len', 'len', 'pair', 'zero']), s, e, ans, why, segs, text;
    if (type === 'pair') {
      var s1, l1, s2, l2;
      do { s1 = rand(0, 5); l1 = rand(3, 8); s2 = rand(0, 5); l2 = rand(2, 8); } while (l1 === l2 || s1 + l1 > 11 || s2 + l2 > 11 || (s1 === 0 && s2 === 0));
      segs = [{ s: s1, e: s1 + l1, lab: 'А' }, { s: s2, e: s2 + l2, lab: 'Б' }];
      ans = Math.abs(l1 - l2);
      text = 'На линейке отмечены два отрезка. На сколько сантиметров ' + (l1 > l2 ? 'отрезок А длиннее отрезка Б' : 'отрезок Б длиннее отрезка А') + '?';
      why = 'Отрезок А: от ' + s1 + ' до ' + (s1 + l1) + ', длина ' + (s1 + l1) + ' − ' + s1 + ' = ' + l1 + ' см. Отрезок Б: от ' + s2 + ' до ' + (s2 + l2) + ', длина ' + (s2 + l2) + ' − ' + s2 + ' = ' + l2 +
        ' см. Разность: ' + Math.max(l1, l2) + ' − ' + Math.min(l1, l2) + ' = ' + ans + '. Ответ: ' + ans + ' см.';
    } else {
      s = type === 'zero' ? 0 : rand(1, 6); e = s + rand(3, Math.min(9, 11 - s));
      segs = [{ s: s, e: e }]; ans = e - s;
      text = 'Отрезок приложили к линейке. Чему равна его длина в сантиметрах?';
      why = s === 0 ? 'Отрезок начинается у нуля, поэтому его длина — число у правого конца: ' + e + ' см.'
        : 'Левый конец отрезка стоит у отметки ' + s + ', правый — у отметки ' + e + '. Длина: ' + e + ' − ' + s + ' = ' + ans + ' см. (Читать просто «' + e + '» нельзя: линейка приложена не от нуля.)';
    }
    return {
      kind: 'num', html: R.arRulerSVG(segs) + '<span class="ar-q">' + text + '</span>', answer: ans,
      hint: 'Найди отметки, у которых стоят левый и правый концы отрезка. Если левый конец не у нуля, вычти из большей отметки меньшую.', explain: why
    };
  });

  var EUN = ['мм', 'см', 'дм', 'м', 'км'], EMM = [1, 10, 100, 1000, 1000000];
  var EYE = [
    ['длина нового карандаша', 18, 1], ['толщина карандаша', 7, 0], ['ширина школьной тетради', 17, 1], ['длина школьной линейки', 30, 1],
    ['высота школьной парты', 75, 1], ['высота двери в классе', 2, 3], ['длина классной доски', 3, 3], ['высота потолка в классе', 3, 3],
    ['длина футбольного поля', 100, 3], ['длина легкового автомобиля', 4, 3], ['длина олимпийского плавательного бассейна', 50, 3],
    ['длина одного круга на школьном стадионе', 400, 3], ['ширина ладони взрослого человека', 1, 2], ['длина шага ученика', 50, 1],
    ['толщина монеты', 2, 0], ['рост взрослого человека', 170, 1], ['длина пассажирского железнодорожного вагона', 25, 3],
    ['высота девятиэтажного дома', 27, 3], ['длина спичечного коробка', 5, 1], ['длина столовой ложки', 20, 1], ['ширина входной двери в квартиру', 9, 2]
  ];
  reg('arEyeUnit', function (o) {
    o = o || {};
    var it = o.item != null ? EYE[o.item] : pick(EYE), v = it[1], u = it[2], right = { v: v, u: u }, cands = [], seen = {};
    seen[v * EMM[u]] = 1;
    [-2, -1, 1, 2].forEach(function (d) { if (u + d >= 0 && u + d <= 4) cands.push({ v: v, u: u + d }); });
    cands.push({ v: v * 10, u: u });
    if (v % 10 === 0) cands.push({ v: v / 10, u: u });
    var wrong = [];
    shuffle(cands).forEach(function (c) { var mm = c.v * EMM[c.u]; if (wrong.length < 3 && !seen[mm]) { seen[mm] = 1; wrong.push(c); } });
    var all = shuffle([right].concat(wrong));
    function t(c) { return fmt(c.v) + ' ' + EUN[c.u]; }
    var idx = all.indexOf(right);
    var lines = all.map(function (c) {
      if (c === right) return t(c) + ' — подходит.';
      var rr = c.v * EMM[c.u] / (v * EMM[u]);
      return t(c) + ' — ' + (rr > 1 ? 'в ' + fmt(rr) + ' ' + R.plural(rr, ['раз', 'раза', 'раз']) + ' больше правдоподобного: слишком много' : 'в ' + fmt(1 / rr) + ' ' + R.plural(1 / rr, ['раз', 'раза', 'раз']) + ' меньше правдоподобного: слишком мало') + '.';
    });
    return {
      kind: 'choice', wide: false, options: all.map(t), answer: idx,
      html: 'Выбери самое правдоподобное значение: <b>' + it[0] + '</b>.',
      hint: 'Сравни с тем, что хорошо знаешь: ладонь взрослого — около 1 дм, шаг — около 50 см, рост ученика четвёртого класса — около 140 см.',
      explain: 'Правдоподобно: ' + t(right) + '.<br>' + lines.filter(function (l, i) { return all[i] !== right; }).join('<br>')
    };
  });

  var VERTS = [['A', 'B', 'C', 'D'], ['K', 'L', 'M', 'N'], ['M', 'N', 'P', 'Q'], ['E', 'F', 'G', 'H']];
  reg('arRectSides', function (o) {
    o = o || {};
    var v = pick(VERTS), a = rand(3, 15), b, u = pick(['см', 'дм', 'м']), type = o.type || pick(['opp', 'sum3', 'opp']);
    do { b = rand(2, 12); } while (b === a);
    var AB = v[0] + v[1], BC = v[1] + v[2], CD = v[2] + v[3], DA = v[3] + v[0];
    var pic = R.arRectSVG(Math.max(a, b) === a ? 3 : 2, Math.max(a, b) === a ? 2 : 3, { verts: v, top: AB + ' = ' + a + ' ' + u, right: BC + ' = ' + b + ' ' + u, label: 'Прямоугольник ' + v.join('') });
    if (type === 'sum3') {
      var ans = 2 * a + b;
      return {
        kind: 'num', html: pic + '<span class="ar-q">' + v.join('') + ' — прямоугольник. Чему равна сумма длин трёх его сторон ' + AB + ', ' + BC + ' и ' + CD + '? (Ответ в ' + (u === 'м' ? 'метрах' : u === 'дм' ? 'дециметрах' : 'сантиметрах') + '.)</span>',
        answer: ans, hint: 'У прямоугольника противоположные стороны равны. Найди длину стороны ' + CD + '.',
        explain: 'Противоположные стороны равны: ' + CD + ' = ' + AB + ' = ' + a + ' ' + u + '. Сумма: ' + a + ' + ' + b + ' + ' + a + ' = ' + ans + ' ' + u + '. Ответ: ' + ans + '.'
      };
    }
    return {
      kind: 'nums', html: pic + '<span class="ar-q">' + v.join('') + ' — прямоугольник. Найди длины сторон ' + CD + ' и ' + DA + ' (в ' + (u === 'м' ? 'метрах' : u === 'дм' ? 'дециметрах' : 'сантиметрах') + ').</span>',
      fields: [{ label: CD }, { label: DA }], answer: [a, b],
      hint: 'У прямоугольника равны противоположные стороны: напротив ' + AB + ' лежит ' + CD + ', напротив ' + BC + ' лежит ' + DA + '.',
      explain: 'Противоположные стороны прямоугольника равны. ' + CD + ' = ' + AB + ' = ' + a + ' ' + u + ', ' + DA + ' = ' + BC + ' = ' + b + ' ' + u + '. Ответ: ' + a + ' и ' + b + '.'
    };
  });

  var PMIX = [['м', 'дм', 10], ['м', 'см', 100], ['дм', 'см', 10]];
  var PMIX_BIG = [['ковра', 'ковра'], ['прямоугольной клумбы', 'клумбы'], ['прямоугольного бассейна', 'бассейна'], ['стенда в школьном коридоре', 'стенда'], ['прямоугольной грядки', 'грядки'], ['сцены в актовом зале', 'сцены']];
  var PMIX_SMALL = [['рамы для картины', 'рамы'], ['крышки парты', 'парты'], ['стенгазеты', 'стенгазеты'], ['листа фанеры', 'листа'], ['школьной таблички', 'таблички']];
  function twoUnits(n, pr) { var f = pr[2]; return Math.floor(n / f) + ' ' + pr[0] + (n % f ? ' ' + (n % f) + ' ' + pr[1] : ''); }
  reg('arPerimMixed', function (o) {
    o = o || {};
    var pr = pick(PMIX), f = pr[2], a, b;
    var step = f === 100 ? 10 : 1;
    do {
      a = rand(2, 6) * f + rand(1, 9) * step; b = rand(1, 5) * f + rand(1, 9) * step;
    } while (a === b);
    var P = 2 * (a + b), ob = pick(pr[0] === 'м' ? PMIX_BIG : PMIX_SMALL);
    var unitName = ({ 'дм': 'дециметрах', 'см': 'сантиметрах' })[pr[1]];
    return {
      kind: 'num', html: 'Длина ' + ob[0] + ' — ' + twoUnits(a, pr) + ', ширина — ' + twoUnits(b, pr) + '. Найди периметр ' + ob[1] + ' в ' + unitName + '.', answer: P,
      hint: 'Сначала вырази длину и ширину в мелких мерах (' + pr[1] + '), потом найди периметр.',
      explain: steps(['Длина: ' + twoUnits(a, pr) + ' = ' + fmt(a) + ' ' + pr[1] + '; ширина: ' + twoUnits(b, pr) + ' = ' + fmt(b) + ' ' + pr[1],
        'Периметр: (' + fmt(a) + ' + ' + fmt(b) + ') × 2 = ' + fmt(a + b) + ' × 2 = ' + fmt(P) + ' (' + pr[1] + ')'], fmt(P))
    };
  });

  reg('arRectBound', function (o) {
    o = o || {};
    var half = rand(4, 24) * 25, P = half * 2, u = 'м', right, wrongs = [], i;
    function mk(sum) { var a = rand(2, Math.floor(sum / 25) - 1) * 25; return [a, sum - a]; }
    right = mk(half);
    var sums = [P, half + pick([-1, 1]) * rand(1, 3) * 50, Math.round(half / 2 / 5) * 5 + pick([0, 50]), half - 25];
    sums = sums.filter(function (x) { return x > 50 && x !== half; });
    var seen = {}; seen[half] = 1;
    sums.forEach(function (x) { if (!seen[x] && wrongs.length < 3) { seen[x] = 1; wrongs.push(mk(x)); } });
    while (wrongs.length < 3) { var x2 = half + rand(1, 8) * 25 * pick([-1, 1]); if (x2 > 50 && !seen[x2]) { seen[x2] = 1; wrongs.push(mk(x2)); } }
    var all = shuffle([right].concat(wrongs)), idx = all.indexOf(right);
    function t(p) { return fmt(p[0]) + ' м и ' + fmt(p[1]) + ' м'; }
    return {
      kind: 'choice', wide: false, options: all.map(t), answer: idx,
      html: 'Огород имеет форму прямоугольника, длина его границы — ' + fmt(P) + ' м. Какие размеры (длину и ширину) он может иметь?',
      hint: 'Длина границы — периметр. Длина и ширина вместе составляют половину периметра.',
      explain: 'Половина периметра: ' + fmt(P) + ' : 2 = ' + fmt(half) + ' м — столько составляют длина и ширина вместе. ' +
        all.map(function (p) { return t(p) + ': ' + fmt(p[0]) + ' + ' + fmt(p[1]) + ' = ' + fmt(p[0] + p[1]) + (p[0] + p[1] === half ? ' — подходит' : ' — не подходит'); }).join('; ') + '.'
    };
  });

  /* ---------- задачи: ограда и обход границы ---------- */
  function lenSpeed(mph) { var km = Math.floor(mph / 1000), m = mph % 1000; return (km ? km + ' км' : '') + (km && m ? ' ' : '') + (m ? m + ' м' : ''); }
  reg('arPWalk', function (o) {
    o = o || {};
    var heroes = [['Мальчик', 'мальчика', 'обходит границу участка', 'обойдёт границу', [3000, 3600, 4200, 4500, 4800, 5400]],
      ['Турист', 'туриста', 'обходит границу поляны', 'обойдёт границу', [3000, 3600, 4200, 4500, 4800, 5400]],
      ['Девочка', 'девочки', 'обходит границу парка', 'обойдёт границу', [3000, 3600, 4200, 4500, 4800]],
      ['Сторож', 'сторожа', 'обходит границу территории склада', 'обойдёт границу', [3000, 3600, 4200, 4500, 4800, 5400]],
      ['Лыжник', 'лыжника', 'идёт на лыжах вдоль границы лесной поляны', 'пройдёт всю границу', [6000, 7200, 9000]]];
    var h = pick(heroes), mph = pick(h[4]), v = mph / 60, t, P, half, a, b;
    do { t = rand(10, 45); P = v * t; half = P / 2; } while (half !== Math.floor(half));
    var lo = Math.ceil(half * 0.35 / 10), hi = Math.floor(half * 0.65 / 10);
    if (hi < lo) hi = lo;
    do { a = rand(lo, hi) * 10; b = half - a; } while (b < 30 || a === b);
    var big = Math.max(a, b), small = Math.min(a, b);
    var text = h[0] + ' ' + h[2] + ' прямоугольной формы: длина ' + fmt(big) + ' м, ширина ' + fmt(small) + ' м. Скорость ' + h[1] + ' — ' + lenSpeed(mph) + ' в час. За сколько минут ' + h[0].toLowerCase() + ' ' + h[3] + '?';
    return {
      kind: 'num', html: text, answer: t,
      hint: 'Длина границы — периметр. Скорость в час переведи в скорость за одну минуту: раздели на 60.',
      explain: steps(['Периметр: (' + fmt(big) + ' + ' + fmt(small) + ') × 2 = ' + fmt(P) + ' м', 'Скорость за минуту: ' + fmt(mph) + ' : 60 = ' + v + ' м', 'Время: ' + fmt(P) + ' : ' + v + ' = ' + t + ' мин'], t + ' мин')
    };
  });

  reg('arPPerim', function (o) {
    o = o || {};
    var type = o.type || pick(['wire', 'posts', 'diff', 'price', 'gate']), a, b, P, text, why, ans, hint;
    if (type === 'wire') {
      var wire = pick([['Проволоку', 'согнули в форме прямоугольника', 'см'], ['Верёвку', 'натянули вокруг прямоугольной площадки', 'м'], ['Ленту', 'приклеили по краю прямоугольной рамки', 'см']]);
      a = rand(6, 30); b = rand(3, a - 1); P = 2 * (a + b);
      text = wire[0] + ' длиной ' + fmt(P) + ' ' + wire[2] + ' ' + wire[1] + '. Одна сторона получилась ' + a + ' ' + wire[2] + '. Какой длины другая сторона?';
      ans = b;
      why = steps(['Половина длины: ' + fmt(P) + ' : 2 = ' + (P / 2) + ' ' + wire[2] + ' — длина и ширина вместе', 'Другая сторона: ' + (P / 2) + ' − ' + a + ' = ' + b + ' ' + wire[2]], b + ' ' + wire[2]);
      hint = 'Вся длина — это периметр. Половина периметра — сумма двух соседних сторон.';
    } else if (type === 'posts') {
      var k = pick([2, 5, 10]); a = rand(3, 10) * k; do { b = rand(2, 9) * k; } while (b === a);
      P = 2 * (a + b); ans = P / k;
      text = 'Участок прямоугольной формы ' + a + ' м на ' + b + ' м огородили забором. Столбы поставили по всей границе через каждые ' + k + ' м (в том числе в углах). Сколько столбов потребовалось?';
      why = steps(['Длина забора — периметр: (' + a + ' + ' + b + ') × 2 = ' + P + ' м', 'Столбы стоят через ' + k + ' м, граница замкнутая: ' + P + ' : ' + k + ' = ' + ans], ans + ' ' + R.plural(ans, ['столб', 'столба', 'столбов']));
      hint = 'Найди длину всей границы и узнай, сколько раз по ' + k + ' м она укладывается.';
    } else if (type === 'diff') {
      var s = rand(8, 30) * 5; a = s + rand(2, 8) * 5; b = rand(4, s / 5 - 1) * 5;
      var P1 = 4 * s, P2 = 2 * (a + b); ans = Math.abs(P1 - P2);
      if (ans === 0) return gens.arPPerim(o);
      var longer = P1 > P2 ? 'квадратного' : 'прямоугольного';
      text = 'Квадратное поле со стороной ' + s + ' м и прямоугольное поле ' + a + ' м на ' + b + ' м надо огородить. На сколько метров ограда вокруг ' + longer + ' поля длиннее ограды вокруг ' + (P1 > P2 ? 'прямоугольного' : 'квадратного') + '?';
      why = steps(['Вокруг квадратного: ' + s + ' × 4 = ' + P1 + ' м', 'Вокруг прямоугольного: (' + a + ' + ' + b + ') × 2 = ' + P2 + ' м', 'Разность: ' + Math.max(P1, P2) + ' − ' + Math.min(P1, P2) + ' = ' + ans + ' м'], ans + ' м');
      hint = 'Найди периметр квадрата и периметр прямоугольника, потом вычти меньший из большего.';
    } else if (type === 'price') {
      a = rand(4, 20) * 5; do { b = rand(3, 16) * 5; } while (a === b); P = 2 * (a + b);
      var pr = pick([50, 60, 80, 100, 120, 150, 200]); ans = P * pr;
      text = 'Огород прямоугольной формы ' + a + ' м на ' + b + ' м надо обнести сеткой. Один метр сетки стоит ' + pr + ' руб. Сколько рублей стоит вся сетка?';
      why = steps(['Длина сетки — периметр: (' + a + ' + ' + b + ') × 2 = ' + P + ' м', 'Стоимость: ' + P + ' × ' + pr + ' = ' + fmt(ans) + ' руб.'], fmt(ans) + ' руб.');
      hint = 'Сначала найди, сколько метров сетки нужно (периметр), потом умножь на цену одного метра.';
    } else {
      a = rand(6, 20) * 5; do { b = rand(4, 16) * 5; } while (a === b); P = 2 * (a + b);
      var gate = pick([3, 4, 5]); ans = P - gate;
      text = 'Двор прямоугольной формы ' + a + ' м на ' + b + ' м решили обнести забором, оставив место для ворот шириной ' + gate + ' м. Сколько метров забора нужно построить?';
      why = steps(['Вся граница двора: (' + a + ' + ' + b + ') × 2 = ' + P + ' м', 'Без ворот: ' + P + ' − ' + gate + ' = ' + ans + ' м'], ans + ' м');
      hint = 'Найди периметр двора и вычти ширину ворот: в этом месте забор не нужен.';
    }
    return { kind: 'num', html: text, answer: ans, hint: hint, explain: why };
  });

  /* ================= урок 86: понятие о площади ================= */
  var UNAME = { 'см²': 'квадратных сантиметрах', 'дм²': 'квадратных дециметрах', 'м²': 'квадратных метрах' };
  function clk(n) { return fmt(n) + NB + R.plural(n, ['клетка', 'клетки', 'клеток']); }
  function figCounts(cells) { var rc = rowCounts(cells); return plusSum(rc) + ' = ' + rc.reduce(function (s, x) { return s + x; }, 0); }

  reg('arCmpArea', function (o) {
    o = o || {};
    var mode = o.mode || 'poly', res = o.res || pick(['A', 'B', 'eq']), ask = o.ask || (res === 'eq' ? 'which' : pick(['which', 'which', 'diff']));
    var fa, fb, ka, kb, i, picA, picB, sa, sb;
    if (mode === 'poly') {
      var k = rand(5, 10), d = rand(1, 3);
      ka = res === 'B' ? k - d : k; kb = res === 'A' ? k - d : k;
      if (res === 'eq') { ka = kb = k; }
      if (res === 'A') { ka = k; kb = k - d; } else if (res === 'B') { ka = k - d; kb = k; }
      var tries = 0;
      do { fa = polyo(ka, 4, 5); fb = polyo(kb, 4, 5); tries++; } while (cellSig(fa) === cellSig(fb) && tries < 20);
      picA = R.arCellsSVG(fa, { label: 'Фигура А' }); picB = R.arCellsSVG(fb, { label: 'Фигура Б' });
      sa = figCounts(fa); sb = figCounts(fb);
    } else {
      var prods = [12, 16, 18, 20, 24, 30, 36], S = pick(prods), pr = [], x, y;
      for (x = 2; x <= 9; x++) if (S % x === 0 && S / x <= 9 && S / x >= 2 && x <= S / x) pr.push([x, S / x]);
      var p1 = pick(pr), p2;
      var wa, wb;
      if (res === 'eq') {
        var others = pr.filter(function (p) { return p[0] !== p1[0]; });
        if (!others.length) return gens.arCmpArea(o);
        p2 = pick(others);
      } else {
        var dd = pick([-1, 1]) * rand(1, 2);
        var xx = rand(2, 8), yy = rand(2, 6);
        p2 = [xx, yy];
        if (p2[0] * p2[1] === S || (p2[0] === p1[0] && p2[1] === p1[1])) return gens.arCmpArea(o);
        if (Math.abs(p2[0] * p2[1] - S) > 12) return gens.arCmpArea(o);
      }
      var ra = Math.random() < 0.5;
      var A = ra ? p1 : p2, B = ra ? p2 : p1;
      /* для неравных нужно, чтобы bigger совпал с res */
      var aa = A[0] * A[1], bb = B[0] * B[1];
      if (res === 'A' && aa < bb || res === 'B' && bb < aa) { var t0 = A; A = B; B = t0; aa = A[0] * A[1]; bb = B[0] * B[1]; }
      if (res === 'A' && aa <= bb || res === 'B' && bb <= aa) return gens.arCmpArea(o);
      if (Math.random() < 0.5) { A = [A[1], A[0]]; }
      if (Math.random() < 0.5) { B = [B[1], B[0]]; }
      ka = A[0] * A[1]; kb = B[0] * B[1];
      picA = R.arRectGridSVG(A[0], A[1], { cs: 20, label: 'Фигура А' }); picB = R.arRectGridSVG(B[0], B[1], { cs: 20, label: 'Фигура Б' });
      sa = A[0] + ' × ' + A[1] + ' = ' + ka; sb = B[0] + ' × ' + B[1] + ' = ' + kb;
    }
    var html = pair(picA, picB, 'Фигура А', 'Фигура Б');
    var whyBase = 'Считаем клетки. Фигура А: ' + sa + ' ' + R.plural(ka, ['клетка', 'клетки', 'клеток']) + '. Фигура Б: ' + sb + ' ' + R.plural(kb, ['клетка', 'клетки', 'клеток']) + '. ';
    if (ask === 'diff' && ka !== kb) {
      var dif = Math.abs(ka - kb), bigName = ka > kb ? 'А' : 'Б', smName = ka > kb ? 'Б' : 'А';
      return {
        kind: 'num', html: html + '<span class="ar-q">Размер клетки у обеих фигур одинаковый. На сколько клеток площадь фигуры ' + bigName + ' больше площади фигуры ' + smName + '?</span>', answer: dif,
        hint: 'Сосчитай клетки в каждой фигуре (удобно по рядам) и вычти меньшее число из большего.',
        explain: whyBase + 'Разность: ' + Math.max(ka, kb) + ' − ' + Math.min(ka, kb) + ' = ' + dif + '. Ответ: ' + dif + '.'
      };
    }
    var opts = ['Фигура А', 'Фигура Б', 'Площади равны'], ans = ka === kb ? 2 : (ka > kb ? 0 : 1);
    return {
      kind: 'choice', wide: false, options: opts, answer: ans,
      html: html + '<span class="ar-q">Клетки у обеих фигур одинаковые. У какой фигуры площадь больше?</span>',
      hint: 'Сосчитай клетки в каждой фигуре. Удобно считать по рядам. Форма фигуры не важна — важно, сколько места она занимает.',
      explain: whyBase + (ka === kb ? 'Клеток поровну, значит, площади равны, хотя фигуры выглядят по-разному.' : 'Больше клеток у фигуры ' + (ka > kb ? 'А' : 'Б') + ', значит, и площадь у неё больше.') + ' Ответ: ' + opts[ans] + '.'
    };
  });

  reg('arCountCells', function (o) {
    o = o || {};
    var mode = o.mode || pick(['poly', 'rect', 'L']), unit = o.unit, cells, pic, why, n, a, b, c, d, hint;
    if (mode === 'rect') {
      a = rand(3, 8); b = rand(2, 6); n = a * b;
      pic = R.arRectGridSVG(a, b, { cs: 24, stripes: true });
      why = 'Прямоугольник разбит на ряды. В каждом ряду ' + a + ' ' + R.plural(a, ['клетка', 'клетки', 'клеток']) + ', рядов ' + b + '. Всего: ' + (b <= 4 ? Array(b + 1).join(a + ' + ').slice(0, -3) + ' = ' : '') + a + ' × ' + b + ' = ' + n + '.';
      hint = 'Сосчитай, сколько клеток в одном ряду и сколько рядов. Сложи или умножь.';
    } else {
      if (mode === 'L') {
        a = rand(4, 8); b = rand(3, 6); c = rand(1, a - 2); d = rand(1, b - 2);
        cells = lCells(a, b, c, d);
      } else { cells = polyo(rand(o.kmin || 6, o.kmax || 13), 4, 5); }
      n = cells.length;
      pic = R.arCellsSVG(cells);
      why = 'Считаем по рядам сверху вниз: ' + figCounts(cells) + '.';
      hint = 'Считай клетки по рядам и складывай, чтобы ничего не пропустить и не посчитать дважды.';
    }
    var text = unit ? 'Одна клетка — 1 ' + unit + '. Найди площадь фигуры в ' + UNAME[unit] + '.' : 'Сколько клеток занимает фигура? Это число показывает её площадь.';
    if (unit) why += ' Одна клетка — 1 ' + unit + ', поэтому площадь ' + n + ' ' + unit + '.';
    return { kind: 'num', html: pic + '<span class="ar-q">' + text + '</span>', answer: n, hint: hint, explain: why + ' Ответ: ' + n + '.' };
  });

  var CONCEPT = {
    basic: [
      ['Что показывает площадь фигуры?', 'сколько места на плоскости занимает фигура', ['сколько метров она тянется в длину', 'сумму длин всех её сторон', 'сколько углов у фигуры'], 'Площадь — это величина той части плоскости, которую занимает фигура. Сумма длин сторон — это периметр.'],
      ['Один прямоугольник целиком положили на другой так, что он оказался внутри него. Что можно сказать о площадях?', 'площадь внутреннего прямоугольника меньше', ['площади равны', 'площадь внутреннего прямоугольника больше', 'сравнить нельзя'], 'То, что поместилось внутри, занимает меньше места, значит, его площадь меньше.'],
      ['Два прямоугольника наложили друг на друга, и они совпали полностью. Что верно?', 'площади равны', ['площадь первого больше', 'площадь второго больше', 'сравнить нельзя'], 'Совпали при наложении — занимают одинаковое место, площади равны.'],
      ['Фигуру разрезали на части и сложили из этих же частей другую фигуру, ничего не потеряв. Что можно сказать о площадях?', 'площади равны', ['новая фигура больше', 'новая фигура меньше', 'новая фигура в два раза больше'], 'Части те же самые, места они занимают столько же. Форма изменилась, площадь — нет.'],
      ['У двух прямоугольников одинаковый периметр. Верно ли, что и площади у них одинаковые?', 'нет, площади могут быть разными', ['да, площади обязательно одинаковые', 'да, периметр и площадь — одно и то же', 'нет, площади у них всегда разные'], 'Например, прямоугольники 1 × 7 и 3 × 5 клеток имеют периметр 16, а площади 7 и 15 клеток.'],
      ['У двух прямоугольников одинаковая площадь. Верно ли, что у них одинаковые длина и ширина?', 'нет, стороны могут быть разными', ['да, стороны обязательно одинаковые', 'да, но только длины', 'нет, у таких прямоугольников площади разные'], 'Например, прямоугольники 2 × 6 и 3 × 4 клетки состоят из 12 клеток, а стороны у них разные.'],
      ['Закрасили на листе несколько клеток. Что можно сказать, если закрашено больше клеток?', 'площадь закрашенной части больше', ['площадь закрашенной части меньше', 'периметр обязательно больше', 'площадь не изменится'], 'Клетки одинаковые, поэтому чем их больше, тем больше площадь.'],
      ['Что из этого можно назвать площадью?', 'размер крышки стола', ['длину края стола', 'число ножек стола', 'высоту стола'], 'Площадь крышки — размер её поверхности. Длина края, число ножек и высота — это другое.'],
      ['Слово «площадь» встречается и в жизни. В каком случае оно означает ту же величину, что и в математике?', 'площадь квартиры — 54 квадратных метра', ['на площади города прошёл праздник', 'площадь у вокзала назвали в честь поэта', 'на площади всегда много голубей'], 'Площадь квартиры — размер её пола, это величина, которую можно измерить.']
    ],
    units: [
      ['Какой фигурой изображают единицу площади «квадратный сантиметр»?', 'квадратом со стороной 1 см', ['отрезком длиной 1 см', 'квадратом со стороной 1 дм', 'прямоугольником 1 см на 2 см'], 'Единицы площади — квадраты. У квадратного сантиметра сторона 1 см.'],
      ['Какой фигурой изображают квадратный дециметр?', 'квадратом со стороной 1 дм', ['отрезком длиной 1 дм', 'квадратом со стороной 1 см', 'квадратом со стороной 1 м'], 'Сторона квадратного дециметра — 1 дм.'],
      ['Что такое квадратный метр?', 'квадрат со стороной 1 м', ['отрезок длиной 1 м', 'квадрат со стороной 1 дм', 'прямоугольник 1 м на 2 м'], 'Квадратный метр — единица площади, квадрат со стороной в один метр.'],
      ['Что показывает запись «12 см²»?', 'в фигуре помещается 12 квадратов со стороной 1 см', ['длина фигуры 12 см', 'периметр фигуры 12 см', 'фигура состоит из 12 отрезков'], 'Площадь измеряют квадратными единицами: 12 см² — это 12 квадратных сантиметров.'],
      ['Чем измеряют длину и чем измеряют площадь?', 'длину — отрезками (см, дм, м), площадь — квадратами (см², дм², м²)', ['и то, и другое — отрезками', 'длину — квадратами, площадь — отрезками', 'и то, и другое — квадратами'], 'Линейные меры измеряют линии, квадратные меры — площади.'],
      ['Одну и ту же фигуру измерили сначала квадратами со стороной 1 см, потом квадратами со стороной 1 дм. В каком случае число квадратов больше?', 'когда измеряли квадратными сантиметрами', ['когда измеряли квадратными дециметрами', 'число квадратов одинаковое', 'сказать нельзя'], 'Чем меньше единица, тем больше таких единиц понадобится.'],
      ['Какие меры нужны, чтобы измерить площадь?', 'квадратные', ['линейные', 'только метры', 'только килограммы'], 'Площадь измеряют квадратными мерами, а линейные меры служат для измерения длины.'],
      ['Площадь фигуры равна 20 дм². Что это значит?', 'фигуру можно покрыть 20 квадратами со стороной 1 дм', ['фигура имеет длину 20 дм', 'сумма сторон фигуры равна 20 дм', 'фигуру можно покрыть 20 квадратами со стороной 1 см'], 'Число при единице площади говорит, сколько таких единичных квадратов помещается в фигуре.']
    ],
    rule: [
      ['Как найти площадь прямоугольника, если известны длина и ширина в одинаковых единицах?', 'умножить длину на ширину', ['сложить длину и ширину', 'сложить длину и ширину и умножить на 2', 'умножить длину на 4'], 'Площадь прямоугольника равна произведению его длины на ширину: S = a × b.'],
      ['Как найти площадь квадрата со стороной a?', 'умножить сторону на себя: a × a', ['умножить сторону на 4', 'умножить сторону на 2', 'сложить длины сторон'], 'У квадрата длина и ширина равны, поэтому S = a × a. Умножить сторону на 4 — это периметр.'],
      ['Прямоугольник длиной 6 дм и шириной 3 дм разбили на полосы шириной 1 дм. Что обозначает число 6 в записи «6 дм² × 3 = 18 дм²»?', 'сколько квадратных дециметров в одной полосе', ['сколько полос в прямоугольнике', 'сколько всего квадратных дециметров', 'периметр прямоугольника'], 'Длина 6 дм — значит, в полосе 6 квадратных дециметров.'],
      ['В записи «6 дм² × 3 = 18 дм²» число 3 показывает…', 'сколько полос получилось', ['сколько квадратов в полосе', 'длину прямоугольника', 'сумму сторон'], 'Ширина 3 дм — значит, полос получилось 3.'],
      ['Сторона квадрата 5 см. Какая запись даёт его площадь?', '5 × 5 = 25 (см²)', ['5 × 4 = 20 (см)', '5 + 5 = 10 (см)', '5 × 2 = 10 (см²)'], 'Площадь квадрата — сторона, умноженная на себя; единица — квадратный сантиметр. 5 × 4 — периметр.'],
      ['Площадь прямоугольника со сторонами в сантиметрах выражается…', 'в квадратных сантиметрах', ['в сантиметрах', 'в метрах', 'в граммах'], 'Умножаем число сантиметров на число сантиметров, получаем квадратные сантиметры.'],
      ['Длина прямоугольника 2 м, ширина 50 см. Что надо сделать, чтобы найти площадь?', 'выразить обе стороны в одинаковых единицах', ['сразу умножить 2 на 50', 'сложить 2 и 50', 'вычесть 50 из 2'], 'Умножать можно, только когда обе стороны измерены в одних единицах: 200 см и 50 см или 2 м и 0,5 м.'],
      ['Чем площадь прямоугольника отличается от его периметра?', 'площадь — размер поверхности, периметр — длина границы', ['площадь — длина границы, периметр — размер поверхности', 'ничем, это одно и то же', 'площадь всегда меньше периметра'], 'Периметр измеряют в линейных единицах (см, м), площадь — в квадратных (см², м²).']
    ]
  };
  reg('arAreaConcept', function (o) {
    o = o || {};
    var bank = CONCEPT[o.bank || 'basic'], it = o.item != null ? bank[o.item] : pick(bank), opts = shuffle([it[1]].concat(it[2]));
    return {
      kind: 'choice', wide: true, options: opts, answer: opts.indexOf(it[1]), html: it[0],
      hint: 'Вспомни рисунки и примеры из теории урока.',
      explain: 'Верно: ' + it[1] + '. ' + it[3]
    };
  });

  reg('arAreaPerim', function (o) {
    o = o || {};
    var mode = o.mode || pick(['both', 'compare', 'compare']);
    if (mode === 'both') {
      var a = rand(3, 9), b = rand(2, 6);
      if (a === b) b = a - 1;
      var S = a * b, P = 2 * (a + b);
      return {
        kind: 'nums', html: R.arRectGridSVG(a, b, { cs: 22 }) + '<span class="ar-q">Найди площадь прямоугольника (в клетках) и длину его границы (в сторонах клеток).</span>',
        fields: [{ label: 'площадь, клеток' }, { label: 'граница, сторон клеток' }], answer: [S, P],
        hint: 'Площадь — сколько клеток внутри (по рядам). Граница — сколько сторон клеток идёт по краю: длина, ширина, длина, ширина.',
        explain: 'Площадь: в ряду ' + a + ' клеток, рядов ' + b + ': ' + a + ' × ' + b + ' = ' + S + '. Граница: (' + a + ' + ' + b + ') × 2 = ' + P + '. Ответ: ' + S + ' и ' + P + '.'
      };
    }
    var fam = o.fam || pick(['sameP', 'sameS']), ask = o.ask || pick(['area', 'perim']), p1, p2, pr = [], x, y;
    if (fam === 'sameP') {
      var h = rand(5, 10);
      for (x = 1; x <= h / 2; x++) if (h - x <= 9) pr.push([x, h - x]);
    } else {
      var S2 = pick([8, 12, 16, 18, 24, 36]);
      for (x = 1; x * x <= S2; x++) if (S2 % x === 0 && S2 / x <= 9) pr.push([x, S2 / x]);
    }
    if (pr.length < 2) return gens.arAreaPerim(o);
    var two = shuffle(pr).slice(0, 2);
    p1 = two[0]; p2 = two[1];
    var s1 = p1[0] * p1[1], s2 = p2[0] * p2[1], q1 = 2 * (p1[0] + p1[1]), q2 = 2 * (p2[0] + p2[1]);
    var v1 = ask === 'area' ? s1 : q1, v2 = ask === 'area' ? s2 : q2, opts = ['Фигура А', 'Фигура Б', 'Поровну'], ans = v1 === v2 ? 2 : (v1 > v2 ? 0 : 1);
    var html = pair(R.arRectGridSVG(p1[0], p1[1], { cs: 20 }), R.arRectGridSVG(p2[0], p2[1], { cs: 20 }), 'Фигура А', 'Фигура Б');
    return {
      kind: 'choice', wide: false, options: opts, answer: ans,
      html: html + '<span class="ar-q">' + (ask === 'area' ? 'У какой фигуры площадь больше?' : 'У какой фигуры длина границы (периметр) больше?') + '</span>',
      hint: ask === 'area' ? 'Сосчитай клетки в каждой фигуре: по рядам.' : 'Найди длину границы каждой фигуры: длина + ширина + длина + ширина.',
      explain: 'Фигура А: ' + p1[0] + ' × ' + p1[1] + ' = ' + s1 + ' клеток, граница ' + q1 + '. Фигура Б: ' + p2[0] + ' × ' + p2[1] + ' = ' + s2 + ' клеток, граница ' + q2 + '. ' +
        (ask === 'area' ? 'Сравниваем площади: ' + s1 + ' и ' + s2 : 'Сравниваем границы: ' + q1 + ' и ' + q2) + ' — ' + (v1 === v2 ? 'поровну' : 'больше у фигуры ' + (v1 > v2 ? 'А' : 'Б')) + '. Ответ: ' + opts[ans] + '.'
    };
  });

  var CELLSTORY = {
    union: [
      ['На плане школьного двора, нарисованном на листе в клетку,', 'спортивная площадка занимает', 'газон', 'дорожки', 'весь двор'],
      ['Дачный участок нарисовали на клетчатом листе:', 'огород занимает', 'сад', 'дом со двором', 'весь участок'],
      ['На схеме детской площадки (лист в клетку)', 'песочница с качелями занимает', 'футбольное поле', 'скамейки и дорожки', 'вся площадка'],
      ['На плане парка, нарисованном на листе в клетку,', 'пруд занимает', 'лужайка', 'аллеи', 'весь парк'],
      ['Аппликацию из цветной бумаги наклеили на клетчатый лист:', 'красная часть занимает', 'синяя часть', 'зелёная часть', 'вся аппликация']
    ],
    cut: [
      ['Площадь листа картона — ', 'Из него вырезали две заготовки: площадью ', 'Сколько клеток осталось от картона?'],
      ['Площадь куска ткани — ', 'Из него выкроили два лоскута: площадью ', 'Сколько клеток ткани осталось?'],
      ['Площадь листа фанеры — ', 'Из него выпилили две детали: площадью ', 'Сколько клеток фанеры осталось?'],
      ['Площадь листа цветной бумаги — ', 'Для поделки отрезали две части: площадью ', 'Сколько клеток бумаги осталось?']
    ],
    cmp: ['огород', 'цветник', 'пруд', 'газон', 'каток']
  };
  function onCl(n) { return fmt(n) + NB + R.plural(n, ['клетке', 'клетках', 'клетках']); }
  reg('arPCells', function (o) {
    o = o || {};
    var type = o.type || pick(['union', 'cut', 'cmp', 'rows']), ans, text, why, hint;
    if (type === 'union') {
      var st = pick(CELLSTORY.union), A = rand(8, 24), dd = rand(2, Math.min(7, A - 3)), C = rand(6, 20), Bv = A - dd;
      ans = A + Bv + C;
      text = st[0] + ' ' + st[1] + ' ' + clk(A) + ', ' + st[2] + ' — на ' + clk(dd) + ' меньше, ' + st[3] + ' — ' + clk(C) + '. Сколько клеток занимает ' + st[4] + '?';
      why = steps([cap(st[2]) + ' занимает ' + A + ' − ' + dd + ' = ' + clk(Bv), 'Всё вместе: ' + A + ' + ' + Bv + ' + ' + C + ' = ' + ans], clk(ans));
      hint = 'Сначала узнай, сколько клеток занимает вторая часть. Потом сложи площади всех частей.';
    } else if (type === 'cut') {
      var sc = pick(CELLSTORY.cut), p = rand(6, 18), q = rand(5, 16), S = p + q + rand(5, 20);
      ans = S - p - q;
      text = sc[0] + clk(S) + '. ' + sc[1] + clk(p) + ' и ' + clk(q) + '. ' + sc[2];
      why = steps(['Взяли всего: ' + p + ' + ' + q + ' = ' + clk(p + q), 'Осталось: ' + S + ' − ' + (p + q) + ' = ' + ans], clk(ans));
      hint = 'Площадь целого составлена из площадей частей. Сложи площади взятых частей и вычти из площади целого.';
    } else if (type === 'cmp') {
      var f = rand(4, 12) * 2, dd2 = rand(3, 10), nm = pick(CELLSTORY.cmp);
      ans = f + (f + dd2) + f / 2;
      text = 'Первый ' + nm + ' на плане занимает ' + clk(f) + ', второй — на ' + clk(dd2) + ' больше, а третий — в 2 раза меньше, чем первый. Сколько клеток занимают все три ' + nm + 'а вместе?';
      why = steps(['Второй: ' + f + ' + ' + dd2 + ' = ' + clk(f + dd2), 'Третий: ' + f + ' : 2 = ' + clk(f / 2), 'Все три: ' + f + ' + ' + (f + dd2) + ' + ' + (f / 2) + ' = ' + ans], clk(ans));
      hint = 'Найди площадь второй и третьей части, потом сложи все три.';
    } else {
      var rr = rand(3, 6), cc = rand(5, 8), t1 = rand(2, 4) * 3, t2 = rand(2, 5), total = rr * cc;
      while (t1 + t2 >= total - 2) { t1 = rand(2, 4) * 2; t2 = rand(2, 4); }
      ans = total - t1 - t2;
      text = 'Огород на плане занимает ' + rr + ' ' + R.plural(rr, ['ряд', 'ряда', 'рядов']) + ' по ' + cc + ' клеток. Картофель посадили на ' + onCl(t1) + ', морковь — на ' + onCl(t2) + '. Сколько клеток осталось под остальные овощи?';
      why = steps(['Весь огород: ' + rr + ' × ' + cc + ' = ' + clk(total), 'Занято: ' + t1 + ' + ' + t2 + ' = ' + clk(t1 + t2), 'Осталось: ' + total + ' − ' + (t1 + t2) + ' = ' + ans], clk(ans));
      hint = 'Сначала узнай, сколько клеток во всём огороде: рядов по столько-то клеток.';
    }
    return { kind: 'num', html: text, answer: ans, hint: hint, explain: why };
  });

  /* ================= уроки 87–88: единицы площади, площадь прямоугольника ================= */
  var SQLOC = { 'см': 'квадратных сантиметрах', 'дм': 'квадратных дециметрах', 'м': 'квадратных метрах' };
  function sq2(u) { return u + '²'; }
  function repeatSum(a, b) { var out = [], i; for (i = 0; i < b; i++) out.push(a); return out.join(' + '); }
  var UNITOBJ = [
    ['обложка школьной тетради', 'см²', 'около 17 см на 20 см'], ['почтовая марка', 'см²', 'около 3 см на 2 см'], ['игральная карта', 'см²', 'около 6 см на 9 см'],
    ['экран смартфона', 'см²', 'около 6 см на 13 см'], ['фотография для альбома', 'см²', 'около 10 см на 15 см'],
    ['крышка парты', 'дм²', 'около 12 дм на 6 дм'], ['крышка письменного стола', 'дм²', 'около 12 дм на 6 дм'], ['дверца шкафа', 'дм²', 'около 5 дм на 20 дм'],
    ['разделочная доска', 'дм²', 'около 4 дм на 3 дм'], ['оконное стекло', 'дм²', 'около 8 дм на 12 дм'],
    ['пол в классе', 'м²', 'около 8 м на 6 м'], ['пол спортивного зала', 'м²', 'около 24 м на 12 м'], ['стена комнаты', 'м²', 'около 5 м на 3 м'],
    ['волейбольная площадка', 'м²', 'около 18 м на 9 м'], ['школьный двор', 'м²', 'около 40 м на 30 м'], ['огород', 'м²', 'около 20 м на 10 м']
  ];
  reg('arPickUnit', function (o) {
    o = o || {};
    var it = o.item != null ? UNITOBJ[o.item] : pick(UNITOBJ), right = it[1], lin = pick(['см', 'дм', 'м']);
    var opts = shuffle(['см²', 'дм²', 'м²', lin]);
    return {
      kind: 'choice', wide: false, options: opts, answer: opts.indexOf(right),
      html: 'В каких единицах удобнее всего измерять площадь: <b>' + it[0] + '</b>?',
      hint: 'Единица площади — квадрат. Представь размеры предмета и выбери такой квадрат, чтобы он был заметно меньше предмета, но не слишком мелкий.',
      explain: it[0].charAt(0).toUpperCase() + it[0].slice(1) + ': ' + it[2] + '. Удобнее всего ' + ({ 'см²': 'квадратные сантиметры', 'дм²': 'квадратные дециметры', 'м²': 'квадратные метры' })[right] + ' (' + right + '). ' +
        'Площадь измеряют квадратными единицами, поэтому «' + lin + '» не подходит: это единица длины. Ответ: ' + right + '.'
    };
  });

  reg('arCountRect', function (o) {
    o = o || {};
    var mode = o.mode || pick(['pic', 'pic', 'text']), unit = o.unit || pick(['см²', 'дм²', 'м²']), a, b, S, pic = '', text;
    var lin = unit.charAt(0) === 'с' ? 'см' : unit.charAt(0) === 'д' ? 'дм' : 'м';
    if (mode === 'pic') {
      a = rand(3, 9); b = rand(2, 6); S = a * b;
      pic = R.arRectGridSVG(a, b, { cs: 24, stripes: true });
      text = 'Прямоугольник разбит на квадраты. Площадь одного квадрата — 1 ' + unit + '. Найди площадь прямоугольника (в ' + SQLOC[lin] + ').';
    } else {
      a = rand(4, 12); b = rand(3, 9); S = a * b;
      text = 'Прямоугольник разбит на ряды квадратов со стороной 1 ' + lin + '. В каждом ряду ' + a + ' ' + R.plural(a, ['квадрат', 'квадрата', 'квадратов']) + ', рядов ' + b + '. Найди площадь прямоугольника (в ' + SQLOC[lin] + ').';
    }
    return {
      kind: 'num', html: pic + '<span class="ar-q">' + text + '</span>', answer: S,
      hint: 'Площадь — это число единичных квадратов. Сосчитай квадраты в одном ряду и умножь на число рядов.',
      explain: 'В одном ряду ' + a + ' ' + R.plural(a, ['квадрат', 'квадрата', 'квадратов']) + ', рядов ' + b + '. Квадратов всего: ' + (b <= 4 ? repeatSum(a, b) + ' = ' + S + ', или короче ' : '') + a + ' × ' + b + ' = ' + S + '. Площадь ' + S + ' ' + unit + '. Ответ: ' + S + '.'
    };
  });

  var TILESTORY = {
    area: [
      ['Пол в кладовке выложили квадратными плитками со стороной 1 дм.', 'дм', 'Чему равна площадь пола кладовки (в квадратных дециметрах)?', 8, 14, 5, 12],
      ['Мозаику на стене выложили из квадратиков со стороной 1 см.', 'см', 'Чему равна площадь мозаики (в квадратных сантиметрах)?', 12, 24, 6, 15],
      ['Детскую площадку разметили на квадраты со стороной 1 м.', 'м', 'Чему равна площадь площадки (в квадратных метрах)?', 8, 20, 6, 14],
      ['Покрывало сшили из квадратных лоскутов со стороной 1 дм.', 'дм', 'Чему равна площадь покрывала (в квадратных дециметрах)?', 12, 25, 8, 16],
      ['Дорожку в парке вымостили квадратными плитами со стороной 1 м.', 'м', 'Чему равна площадь дорожки (в квадратных метрах)?', 15, 30, 2, 4]
    ]
  };
  reg('arPTiles', function (o) {
    o = o || {};
    var type = o.type || pick(['area', 'left', 'cmp', 'plants']), ans, text, why, hint, a, b, st;
    if (type === 'area' || type === 'left') {
      st = pick(TILESTORY.area); a = rand(st[3], st[4]); b = rand(st[5], st[6]);
      var S = a * b, un = sq2(st[1]);
      if (type === 'area') {
        ans = S;
        text = st[0] + ' В каждом ряду ' + a + ' ' + R.plural(a, ['квадрат', 'квадрата', 'квадратов']) + ', рядов ' + b + '. ' + st[2];
        why = steps(['Квадратов всего: ' + a + ' × ' + b + ' = ' + fmt(S), 'Площадь одного квадрата 1 ' + un + ', значит, площадь: ' + fmt(S) + ' ' + un], fmt(S) + ' ' + un);
        hint = 'Сколько всего квадратов? Столько единиц площади и будет.';
      } else {
        var bought = S + rand(5, 20);
        ans = bought - S;
        text = st[0] + ' В каждом ряду ' + a + ' ' + R.plural(a, ['квадрат', 'квадрата', 'квадратов']) + ', рядов ' + b + '. Всего заготовили ' + fmt(bought) + ' ' + R.plural(bought, ['квадрат', 'квадрата', 'квадратов']) + '. Сколько квадратов осталось?';
        why = steps(['Использовали: ' + a + ' × ' + b + ' = ' + fmt(S), 'Осталось: ' + fmt(bought) + ' − ' + fmt(S) + ' = ' + fmt(ans)], fmt(ans));
        hint = 'Сначала узнай, сколько квадратов ушло: рядов по столько-то. Потом вычти.';
      }
    } else if (type === 'cmp') {
      var a1 = rand(5, 9), b1 = rand(4, 8), a2 = rand(8, 14), b2 = rand(5, 9), S1 = a1 * b1, S2 = a2 * b2;
      if (S1 === S2) return gens.arPTiles(o);
      var bigName = S2 > S1 ? 'зала' : 'класса', smName = S2 > S1 ? 'класса' : 'зала';
      ans = Math.abs(S2 - S1);
      text = 'Пол в классе разметили на квадраты по 1 м²: ' + b1 + ' ' + R.plural(b1, ['ряд', 'ряда', 'рядов']) + ' по ' + a1 + ' ' + R.plural(a1, ['квадрат', 'квадрата', 'квадратов']) + '. В спортивном зале — ' + b2 + ' ' + R.plural(b2, ['ряд', 'ряда', 'рядов']) + ' по ' + a2 + ' ' + R.plural(a2, ['квадрат', 'квадрата', 'квадратов']) + '. На сколько квадратных метров ' +
        (S2 > S1 ? 'площадь зала больше площади класса' : 'площадь класса больше площади зала') + '?';
      why = steps(['Класс: ' + a1 + ' × ' + b1 + ' = ' + S1 + ' м²', 'Зал: ' + a2 + ' × ' + b2 + ' = ' + S2 + ' м²', 'Разность: ' + Math.max(S1, S2) + ' − ' + Math.min(S1, S2) + ' = ' + ans + ' м²'], ans + ' м²');
      hint = 'Найди площадь класса и площадь зала (квадратов в ряду, умноженных на число рядов), потом вычти.';
    } else {
      a = rand(4, 9); b = rand(3, 6); var k = rand(2, 6), nm = pick([['Клумбу', 'клумбе', 'кустов', 'куста', 'куст'], ['Грядку', 'грядке', 'кустов', 'куста', 'куст']]);
      ans = a * b * k;
      text = nm[0] + ' разделили на квадраты со стороной 1 м: в каждом ряду ' + a + ' ' + R.plural(a, ['квадрат', 'квадрата', 'квадратов']) + ', рядов ' + b + '. На каждом квадрате посадили по ' + k + ' ' + R.plural(k, ['куст', 'куста', 'кустов']) + '. Сколько кустов посадили?';
      why = steps(['Площадь: ' + a + ' × ' + b + ' = ' + (a * b) + ' м²', 'Кустов: ' + (a * b) + ' × ' + k + ' = ' + ans], ans + ' ' + R.plural(ans, ['куст', 'куста', 'кустов']));
      hint = 'Сколько квадратных метров занимает посадка? На каждом из них растёт по несколько кустов.';
    }
    return { kind: 'num', html: text, answer: ans, hint: hint, explain: why };
  });

  /* ---------- площадь прямоугольника и квадрата ---------- */
  /* [родительный падеж, мин. длина, макс. длина, мин. ширина, макс. ширина] */
  var AOBJ = {
    'м': [['огорода', 10, 60, 5, 40], ['участка', 20, 80, 10, 50], ['двора', 15, 50, 10, 40], ['спортивного зала', 20, 40, 10, 24], ['комнаты', 4, 9, 3, 6],
      ['лесной поляны', 30, 90, 20, 70], ['футбольного поля', 40, 100, 30, 70], ['газона перед школой', 10, 40, 5, 20], ['актового зала', 10, 30, 8, 16], ['катка', 20, 60, 10, 30]],
    'дм': [['крышки стола', 8, 16, 5, 9], ['крышки парты', 10, 14, 5, 7], ['школьной доски', 24, 40, 8, 12], ['оконного стекла', 8, 20, 6, 14], ['листа фанеры', 12, 25, 10, 15], ['витрины', 15, 30, 8, 15]],
    'см': [['обложки тетради', 18, 24, 14, 17], ['открытки', 14, 22, 9, 14], ['фотографии', 10, 30, 8, 20], ['страницы блокнота', 12, 20, 8, 14], ['билета', 15, 25, 6, 9], ['листа бумаги', 25, 30, 18, 21]]
  };
  var AOBJ_SQ = {
    'м': [['двора', 10, 40], ['площадки', 10, 30], ['поляны', 20, 60], ['клумбы', 3, 10], ['огорода', 10, 30]],
    'дм': [['коврика', 6, 15], ['плитки', 2, 4], ['столика', 6, 10], ['листа фанеры', 10, 20]],
    'см': [['салфетки', 20, 40], ['картонки', 10, 30], ['плитки', 10, 30], ['наклейки', 4, 10], ['платка', 50, 80]]
  };
  var BIGOBJ = [['участка', 40, 90, 22, 50], ['лесной поляны', 40, 90, 21, 58], ['футбольного поля', 60, 96, 40, 60], ['поля', 40, 96, 20, 60], ['огорода', 40, 90, 20, 40]];
  var MENTALOBJ = ['участка', 'поля', 'двора', 'огорода', 'газона'];
  function mulBlock(a, b) {
    return 'Столбиком:' + R.mulHTML(a, b) + '<span class="colsteps">' + R.mulSteps(a, b).join('<br>') + '</span>';
  }
  reg('arAreaRect', function (o) {
    o = o || {};
    var u = o.u || pick(['см', 'дм', 'м']), sqr = o.sq != null ? o.sq : (o.mental ? false : Math.random() < 0.25), a, b, S, text, pic = '', why, big = !!o.big, gen, ob;
    var form = o.form || pick(['pic', 'text', 'text']);
    if (big) { u = 'м'; ob = pick(BIGOBJ); gen = ob[0]; a = rand(ob[1], ob[2]); b = rand(ob[3], ob[4]); }
    else if (o.mental) {
      u = 'м'; gen = pick(MENTALOBJ);
      a = rand(2, 9) * 10; b = Math.random() < 0.5 ? rand(2, 9) : rand(2, 6) * 10;
    } else if (sqr) { ob = pick(AOBJ_SQ[u]); gen = ob[0]; a = rand(ob[1], ob[2]); }
    else { ob = pick(AOBJ[u]); gen = ob[0]; a = rand(ob[1], ob[2]); b = rand(ob[3], ob[4]); }
    if (sqr) b = a; else if (a === b) a += 1;
    if (sqr && (big || o.mental)) { /* в этих режимах квадрат — отдельный случай */ b = a; }
    S = a * b;
    var usq = sq2(u);
    if (sqr) {
      if (form === 'pic') {
        pic = R.arRectSVG(1, 1, { top: fmt(a) + ' ' + u, right: fmt(a) + ' ' + u, W: 220, H: 150, mx: 60, label: 'Квадрат со стороной ' + a + ' ' + u });
        text = 'Найди площадь квадрата (в ' + SQLOC[u] + ').';
      } else text = 'Сторона ' + gen + ' квадратной формы — ' + fmt(a) + ' ' + u + '. Найди площадь (в ' + SQLOC[u] + ').';
      why = 'У квадрата длина и ширина равны, поэтому его площадь — сторона, умноженная на себя: ' + a + ' × ' + a + ' = ' + fmt(S) + ' (' + usq + ').';
    } else {
      if (form === 'pic') {
        pic = R.arRectSVG(a, b, { top: fmt(a) + ' ' + u, right: fmt(b) + ' ' + u, label: 'Прямоугольник ' + a + ' на ' + b + ' ' + u });
        text = 'Найди площадь прямоугольника (в ' + SQLOC[u] + ').';
      } else {
        text = 'Длина ' + gen + ' — ' + fmt(a) + ' ' + u + ', ширина — ' + fmt(b) + ' ' + u + '. Найди площадь ' + gen + ' (в ' + SQLOC[u] + ').';
      }
      why = 'Площадь прямоугольника равна длине, умноженной на ширину: S = ' + a + ' × ' + b + ' = ' + fmt(S) + ' (' + usq + ').';
    }
    if (big) why = 'Площадь: S = ' + a + ' × ' + b + ' = ' + fmt(S) + ' (' + usq + ').<br>' + mulBlock(a, b);
    return {
      kind: 'num', html: pic + '<span class="ar-q">' + text + '</span>', answer: S,
      hint: sqr ? 'Площадь квадрата — сторона, умноженная на себя.' : 'Площадь прямоугольника — длина, умноженная на ширину. Единица получится квадратная.',
      explain: why + ' Ответ: ' + fmt(S) + '.'
    };
  });

  reg('arAreaExpr', function (o) {
    o = o || {};
    var u = pick(['см', 'дм', 'м']), sqr = o.sq != null ? o.sq : Math.random() < 0.4, a, b, right, wrong, t;
    if (sqr) {
      do { a = rand(3, 12); } while (a === 4 || a === 2);
      t = 'квадрата со стороной ' + a + ' ' + u;
      right = a + ' × ' + a + ' = ' + (a * a) + ' (' + sq2(u) + ')';
      wrong = [a + ' × 4 = ' + (a * 4) + ' (' + u + ')', a + ' × 2 = ' + (a * 2) + ' (' + sq2(u) + ')', a + ' + ' + a + ' = ' + (a * 2) + ' (' + u + ')'];
    } else {
      do { a = rand(3, 14); b = rand(2, 9); } while (a === b || a + b === a * b || 2 * (a + b) === a * b);
      t = 'прямоугольника со сторонами ' + a + ' ' + u + ' и ' + b + ' ' + u;
      right = a + ' × ' + b + ' = ' + (a * b) + ' (' + sq2(u) + ')';
      wrong = [(a + b) * 2 === a * b ? '' : '(' + a + ' + ' + b + ') × 2 = ' + ((a + b) * 2) + ' (' + u + ')', a + ' + ' + b + ' = ' + (a + b) + ' (' + u + ')', a + ' × ' + b + ' = ' + (a * b) + ' (' + u + ')'];
    }
    var opts = shuffle([right].concat(wrong));
    return {
      kind: 'choice', wide: true, options: opts, answer: opts.indexOf(right),
      html: 'Какая запись верно даёт площадь ' + t + '?',
      hint: sqr ? 'У квадрата площадь — сторона, умноженная на себя. Площадь измеряется в квадратных единицах.' : 'Площадь измеряется в квадратных единицах. Для прямоугольника числа длины и ширины перемножают.',
      explain: 'Верно: ' + right + '. ' + (sqr ? 'Остальные записи не подходят: ' + a + ' × 4 — это периметр, ' + a + ' × 2 и ' + a + ' + ' + a + ' — удвоенная сторона; кроме того, площадь надо выражать в квадратных единицах (' + sq2(u) + ').' :
        'Остальные записи не подходят: сумма сторон и периметр — это не площадь, а запись с единицей «' + u + '» неверна по смыслу: площадь выражают в квадратных единицах (' + sq2(u) + ').')
    };
  });

  reg('arStrips', function (o) {
    o = o || {};
    var u = pick(['см', 'дм', 'м']), a = rand(3, 9), b = rand(2, 6);
    if (a === b) a += 1;
    var pic = R.arRectGridSVG(a, b, { cs: 24, hiRow: 0, top: a + ' ' + u, right: b + ' ' + u });
    return {
      kind: 'nums', html: pic + '<span class="ar-q">Прямоугольник разбили на полосы шириной 1 ' + u + ' (первая полоса выделена). Сколько квадратов по 1 ' + sq2(u) + ' в одной полосе, сколько полос и сколько квадратов всего?</span>',
      fields: [{ label: 'в одной полосе' }, { label: 'полос' }, { label: 'всего' }], answer: [a, b, a * b],
      hint: 'Длина показывает, сколько квадратов в полосе; ширина — сколько получилось полос. Всего — умножь одно на другое.',
      explain: 'Длина ' + a + ' ' + u + ' — в одной полосе ' + a + ' ' + sq2(u) + '. Ширина ' + b + ' ' + u + ' — полос ' + b + '. Всего: ' + a + ' ' + sq2(u) + ' × ' + b + ' = ' + (a * b) + ' ' + sq2(u) + '. Ответ: ' + a + ', ' + b + ', ' + (a * b) + '.'
    };
  });

  var UP = [['м', 'дм', 10], ['м', 'см', 100], ['дм', 'см', 10]];
  var UOBJ_BIG = ['ковра', 'скатерти', 'витрины', 'окна', 'школьной доски'], UOBJ_SMALL = ['рамки для картины', 'коврика', 'доски для резки', 'планшета для рисования'];
  reg('arAreaUnits', function (o) {
    o = o || {};
    var pr = pick(UP), f = pr[2], type = o.type || pick(['two', 'comp']), a, b, A, B, S, text, why;
    if (type === 'two') {
      var m = pr[0] === 'м' && pr[1] === 'см' ? rand(2, 5) : rand(2, 9);
      a = m; b = f === 100 ? rand(4, 9) * 10 : rand(12, 40);
      A = a * f; B = b; S = A * B;
      text = 'Длина прямоугольника ' + a + ' ' + pr[0] + ', ширина ' + b + ' ' + pr[1] + '. Найди площадь прямоугольника (в ' + SQLOC[pr[1]] + ').';
      why = steps(['Выразим длину в ' + (pr[1] === 'дм' ? 'дециметрах' : 'сантиметрах') + ': ' + a + ' ' + pr[0] + ' = ' + fmt(A) + ' ' + pr[1], 'Площадь: ' + fmt(A) + ' × ' + fmt(B) + ' = ' + fmt(S) + ' (' + sq2(pr[1]) + ')'], fmt(S));
    } else {
      var a1 = rand(1, 3), b1 = rand(1, 2), a2 = rand(1, 9) * (f === 100 ? 10 : 1), b2 = rand(1, 9) * (f === 100 ? 10 : 1);
      if (pr[0] === 'дм') { a1 = rand(3, 8); b1 = rand(2, 5); }
      A = a1 * f + a2; B = b1 * f + b2; S = A * B;
      if (A === B) return gens.arAreaUnits(o);
      var gen = pick(pr[0] === 'м' ? UOBJ_BIG : UOBJ_SMALL);
      text = 'Длина ' + gen + ' — ' + a1 + ' ' + pr[0] + ' ' + a2 + ' ' + pr[1] + ', ширина — ' + b1 + ' ' + pr[0] + ' ' + b2 + ' ' + pr[1] + '. Найди площадь ' + gen + ' (в ' + SQLOC[pr[1]] + ').';
      why = steps(['Длина: ' + a1 + ' ' + pr[0] + ' ' + a2 + ' ' + pr[1] + ' = ' + fmt(A) + ' ' + pr[1] + '; ширина: ' + b1 + ' ' + pr[0] + ' ' + b2 + ' ' + pr[1] + ' = ' + fmt(B) + ' ' + pr[1], 'Площадь: ' + fmt(A) + ' × ' + fmt(B) + ' = ' + fmt(S) + ' (' + sq2(pr[1]) + ')'], fmt(S));
    }
    return {
      kind: 'num', html: text, answer: S,
      hint: 'Перемножать можно только числа, выраженные в одинаковых единицах. Сначала вырази обе стороны в мелкой единице.', explain: why
    };
  });

  reg('arAreaFromSide', function (o) {
    o = o || {};
    var u = pick(['см', 'дм', 'м']), a = rand(4, 24), b = rand(3, 15);
    if (a === b) a += 2;
    var S = a * b, big = Math.max(a, b), small = Math.min(a, b), ask = Math.random() < 0.5 ? big : small;
    var known = ask === big ? small : big;
    var pic = R.arRectSVG(big, small, { top: ask === big ? '?' : fmt(known) + ' ' + u, right: ask === big ? fmt(known) + ' ' + u : '?', label: 'Прямоугольник с неизвестной стороной' });
    return {
      kind: 'num', html: pic + '<span class="ar-q">Площадь прямоугольника ' + fmt(S) + ' ' + sq2(u) + ', одна его сторона ' + fmt(known) + ' ' + u + '. Найди другую сторону (в ' + ({ 'см': 'сантиметрах', 'дм': 'дециметрах', 'м': 'метрах' })[u] + ').</span>',
      answer: ask,
      hint: 'Площадь равна длине, умноженной на ширину. Если известна площадь и один множитель, как найти второй?',
      explain: 'S = длина × ширина, поэтому неизвестная сторона равна площади, делённой на известную сторону: ' + fmt(S) + ' : ' + fmt(known) + ' = ' + ask + ' (' + u + '). Проверка: ' + fmt(known) + ' × ' + ask + ' = ' + fmt(S) + '. Ответ: ' + ask + '.'
    };
  });

  /* ================= урок 90: составные фигуры ================= */
  function rectPts(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
  /* описание составной фигуры: pts, подписи, площадь, разбиения для разбора */
  function compSpec(shape, u, o) {
    o = o || {};
    var sp = { shape: shape, u: u }, W, H, nw, nh, aw, rw, bh, sw, sh, x1;
    function L(n, extra) { return n + ' ' + u; }
    if (shape === 'L') {
      W = rand(8, 15); H = rand(7, 12); nw = rand(3, W - 4); nh = rand(3, H - 4);
      sp.W = W; sp.H = H; sp.nw = nw; sp.nh = nh;
      sp.pts = [[0, 0], [W - nw, 0], [W - nw, nh], [W, nh], [W, H], [0, H]];
      sp.given = [{ edge: 4, t: L(W) }, { edge: 5, t: L(H) }, { edge: 2, t: L(nw), inside: true }, { edge: 1, t: L(nh), inside: true }];
      sp.area = W * H - nw * nh;
      sp.unk = [{ edge: 0, val: W - nw, why: 'Верхняя сторона: ' + W + ' − ' + nw + ' = ' + (W - nw) + ' (' + u + ')' }, { edge: 3, val: H - nh, why: 'Правая сторона: ' + H + ' − ' + nh + ' = ' + (H - nh) + ' (' + u + ')' }];
      sp.diff = function () {
        return { fig: R.arPolySVG(rectPts(0, 0, W, H), { holes: [[W - nw, 0, nw, nh]], labels: [{ edge: 0, t: L(W) }, { edge: 3, t: L(H) }], texts: [{ x: W - nw / 2, y: nh / 2 + 0.25, t: L(nw) + ' × ' + L(nh), cls: 'ar-t2 ar-small' }], W: 300, H: 190, label: 'Достроенный прямоугольник с вырезом' }),
          text: 'Достроим фигуру до прямоугольника ' + W + ' × ' + H + ' и вычтем вырезанный угол ' + nw + ' × ' + nh + '.',
          calc: [W + ' × ' + H + ' = ' + (W * H), nw + ' × ' + nh + ' = ' + (nw * nh), (W * H) + ' − ' + (nw * nh) + ' = ' + sp.area] };
      };
      sp.sum = function () {
        var a1 = W - nw, a2 = H - nh;
        return { fig: R.arPolySVG(sp.pts, { fills: [{ pts: rectPts(0, 0, W - nw, H), cls: 'p1' }, { pts: rectPts(W - nw, nh, nw, H - nh), cls: 'p2' }], cuts: [[W - nw, nh, W - nw, H]], texts: [{ x: (W - nw) / 2, y: H / 2 + 0.3, t: L(a1) + ' × ' + L(H), cls: 'ar-t2 ar-small' }, { x: W - nw / 2, y: nh + (H - nh) / 2 + 0.3, t: L(nw) + ' × ' + L(a2), cls: 'ar-t2 ar-small' }], W: 300, H: 190, label: 'Фигура, разрезанная на два прямоугольника' }),
          text: 'Разрежем фигуру на два прямоугольника: левый ' + a1 + ' × ' + H + ' (ширина ' + W + ' − ' + nw + ' = ' + a1 + ') и правый ' + nw + ' × ' + a2 + ' (высота ' + H + ' − ' + nh + ' = ' + a2 + ').',
          calc: [a1 + ' × ' + H + ' = ' + (a1 * H), nw + ' × ' + a2 + ' = ' + (nw * a2), (a1 * H) + ' + ' + (nw * a2) + ' = ' + sp.area] };
      };
    } else if (shape === 'U') {
      W = rand(10, 16); nw = rand(3, W - 6); aw = rand(3, W - nw - 3); rw = W - nw - aw; H = rand(7, 12); nh = rand(3, H - 3);
      sp.W = W; sp.H = H; sp.nw = nw; sp.nh = nh; sp.aw = aw; sp.rw = rw;
      sp.pts = [[0, 0], [aw, 0], [aw, nh], [aw + nw, nh], [aw + nw, 0], [W, 0], [W, H], [0, H]];
      sp.given = [{ edge: 6, t: L(W) }, { edge: 7, t: L(H) }, { edge: 2, t: L(nw), inside: true }, { edge: 1, t: L(nh), inside: true }];
      sp.area = W * H - nw * nh;
      sp.unk = [{ edge: 4, val: rw, why: 'Правая «ножка» по верху: ' + W + ' − ' + aw + ' − ' + nw + ' = ' + rw + ' (' + u + ')', give: [{ edge: 0, t: L(aw) }, { edge: 6, t: L(W) }, { edge: 2, t: L(nw), inside: true }, { edge: 7, t: L(H) }] }];
      sp.diff = function () {
        return { fig: R.arPolySVG(rectPts(0, 0, W, H), { holes: [[aw, 0, nw, nh]], labels: [{ edge: 0, t: L(W) }, { edge: 3, t: L(H) }], texts: [{ x: aw + nw / 2, y: nh / 2 + 0.25, t: L(nw) + ' × ' + L(nh), cls: 'ar-t2 ar-small' }], W: 300, H: 190, label: 'Достроенный прямоугольник с вырезом' }),
          text: 'Достроим фигуру до прямоугольника ' + W + ' × ' + H + ' и вычтем вырез ' + nw + ' × ' + nh + '.',
          calc: [W + ' × ' + H + ' = ' + (W * H), nw + ' × ' + nh + ' = ' + (nw * nh), (W * H) + ' − ' + (nw * nh) + ' = ' + sp.area] };
      };
      sp.sum = sp.diff;
    } else {
      W = rand(9, 16); sw = rand(2, W - 5); if ((W - sw) % 2) sw += (sw + 1 <= W - 4 ? 1 : -1);
      bh = rand(2, 5); sh = rand(3, 8); x1 = (W - sw) / 2; H = bh + sh;
      sp.W = W; sp.H = H; sp.bh = bh; sp.sw = sw; sp.sh = sh; sp.x1 = x1;
      sp.pts = [[0, 0], [W, 0], [W, bh], [x1 + sw, bh], [x1 + sw, H], [x1, H], [x1, bh], [0, bh]];
      sp.given = [{ edge: 0, t: L(W) }, { edge: 1, t: L(bh) }, { edge: 3, t: L(sh) }, { edge: 4, t: L(sw) }];
      sp.area = W * bh + sw * sh;
      sp.unk = [{ edge: 6, val: x1, why: 'Ширина стебля ' + sw + ' ' + u + ', вся ширина ' + W + ' ' + u + '. На обе стороны остаётся ' + W + ' − ' + sw + ' = ' + (W - sw) + ', на одну: ' + (W - sw) + ' : 2 = ' + x1 + ' (' + u + ')' }];
      sp.sum = function () {
        return { fig: R.arPolySVG(sp.pts, { fills: [{ pts: rectPts(0, 0, W, bh), cls: 'p1' }, { pts: rectPts(x1, bh, sw, sh), cls: 'p2' }], cuts: [[x1, bh, x1 + sw, bh]], texts: [{ x: W / 2, y: bh / 2 + 0.3, t: L(W) + ' × ' + L(bh), cls: 'ar-t2 ar-small' }, { x: W / 2, y: bh + sh / 2 + 0.3, t: L(sw) + ' × ' + L(sh), cls: 'ar-t2 ar-small' }], W: 300, H: 200, label: 'Фигура, разрезанная на два прямоугольника' }),
          text: 'Разрежем фигуру на две части: верхняя полоса ' + W + ' × ' + bh + ' и нижняя часть ' + sw + ' × ' + sh + '.',
          calc: [W + ' × ' + bh + ' = ' + (W * bh), sw + ' × ' + sh + ' = ' + (sw * sh), (W * bh) + ' + ' + (sw * sh) + ' = ' + sp.area] };
      };
      sp.diff = sp.sum;
    }
    return sp;
  }

  reg('arComp', function (o) {
    o = o || {};
    var shape = o.shape || pick(['L', 'L', 'U', 'T']), u = o.u || pick(['м', 'дм', 'см']), sp = compSpec(shape, u), way = o.way || pick(['sum', 'diff']);
    var res = (way === 'sum' ? sp.sum : sp.diff)();
    var pic = R.arPolySVG(sp.pts, { labels: sp.given, W: 300, H: 200, label: 'Составная фигура' });
    var hint = shape === 'T' ? 'Разрежь фигуру на два прямоугольника, найди площадь каждого и сложи.' : 'Разрежь фигуру на два прямоугольника и сложи площади, либо дострой до большого прямоугольника и вычти вырез.';
    return {
      kind: 'num', html: pic + '<span class="ar-q">Найди площадь фигуры (все углы прямые, размеры даны в ' + ({ 'м': 'метрах', 'дм': 'дециметрах', 'см': 'сантиметрах' })[u] + ').</span>', answer: sp.area, hint: hint,
      explain: res.text + '<br>' + res.calc.join('<br>') + '<br>' + res.fig + 'Площадь фигуры — ' + fmt(sp.area) + ' ' + sq2(u) + '. Ответ: ' + fmt(sp.area) + '.'
    };
  });

  reg('arCompSide', function (o) {
    o = o || {};
    var shape = o.shape || pick(['L', 'L', 'U', 'T']), u = o.u || pick(['м', 'дм', 'см']), sp = compSpec(shape, u), k = pick(sp.unk);
    var labels = (k.give || sp.given).concat([{ edge: k.edge, t: '?' }]);
    return {
      kind: 'num', html: R.arPolySVG(sp.pts, { labels: labels, W: 300, H: 200, label: 'Составная фигура, одна сторона неизвестна' }) + '<span class="ar-q">Все углы фигуры прямые. Найди длину стороны, отмеченной «?» (в ' + ({ 'м': 'метрах', 'дм': 'дециметрах', 'см': 'сантиметрах' })[u] + ').</span>',
      answer: k.val,
      hint: shape === 'T' ? 'Из всей ширины вычти ширину средней части — останется на две одинаковые стороны.' : 'Противоположные стороны фигуры в сумме дают длину большой стороны. Найди, какой отрезок не хватает.',
      explain: k.why + '. Ответ: ' + k.val + '.'
    };
  });

  var FRAME_CTX = [['Стена', 'стены', 'окно', 'на ней', ['м']], ['Лужайка', 'лужайки', 'пруд', 'на ней', ['м']], ['Лист картона', 'листа картона', 'отверстие', 'на нём', ['дм', 'см']], ['Школьный двор', 'двора', 'бассейн', 'на нём', ['м']], ['Лист фанеры', 'листа фанеры', 'отверстие', 'в нём', ['дм']]];
  reg('arFrame', function (o) {
    o = o || {};
    var type = o.type || pick(['path', 'ring']), u = o.u || pick(['м', 'дм', 'см']), un = ({ 'м': 'метрах', 'дм': 'дециметрах', 'см': 'сантиметрах' })[u];
    if (type === 'path') {
      u = 'м';
      var a = rand(4, 12), b = rand(3, 8), w = rand(1, 3), A = a + 2 * w, B = b + 2 * w, S = A * B - a * b;
      var pic = R.arPolySVG(rectPts(0, 0, A, B), {
        holes: [[w, w, a, b]], labels: [{ edge: 0, t: '' }], texts: [{ x: A / 2, y: B / 2 + 0.25, t: 'клумба ' + a + ' ' + u + ' × ' + b + ' ' + u, cls: 'ar-t2 ar-small' }],
        extra: function (X, Y) { return '<path class="ar-dim" d="M' + X(0) + ' ' + Y(B / 2 - 1.2) + 'H' + X(w) + 'M' + X(0) + ' ' + Y(B / 2 - 1.2 - 0.3) + 'v' + f1(0.6 * (Y(1) - Y(0))) + 'M' + X(w) + ' ' + Y(B / 2 - 1.2 - 0.3) + 'v' + f1(0.6 * (Y(1) - Y(0))) + '"/><text class="ar-t2" x="' + X(w / 2) + '" y="' + Y(B / 2 - 1.2 - 0.6) + '" text-anchor="middle">' + w + ' ' + u + '</text>'; },
        W: 300, H: 200, label: 'Клумба с дорожкой вокруг'
      });
      return {
        kind: 'num', html: pic + '<span class="ar-q">Прямоугольную клумбу ' + a + ' ' + u + ' × ' + b + ' ' + u + ' обошли дорожкой одинаковой ширины ' + w + ' ' + u + ' со всех сторон. Найди площадь дорожки (в ' + SQLOC[u] + ').</span>', answer: S,
        hint: 'Дорожка вместе с клумбой — большой прямоугольник. Найди его стороны (к каждой стороне клумбы прибавь две ширины дорожки), потом вычти клумбу.',
        explain: steps(['Длина с дорожкой: ' + a + ' + ' + w + ' + ' + w + ' = ' + A + ' ' + u + '; ширина с дорожкой: ' + b + ' + ' + w + ' + ' + w + ' = ' + B + ' ' + u,
          'Площадь большого прямоугольника: ' + A + ' × ' + B + ' = ' + (A * B), 'Площадь клумбы: ' + a + ' × ' + b + ' = ' + (a * b), 'Площадь дорожки: ' + (A * B) + ' − ' + (a * b) + ' = ' + S], S + ' ' + sq2(u))
      };
    }
    var cx = pick(FRAME_CTX), AA = rand(8, 16), BB = rand(6, 11), c = rand(2, AA - 4), d = rand(2, BB - 4), hx = rand(1, AA - c - 1), hy = rand(1, BB - d - 1), SS = AA * BB - c * d;
    u = o.u || pick(cx[4]); un = ({ 'м': 'метрах', 'дм': 'дециметрах', 'см': 'сантиметрах' })[u];
    var pic2 = R.arPolySVG(rectPts(0, 0, AA, BB), {
      holes: [[hx, hy, c, d]], labels: [{ edge: 0, t: AA + ' ' + u }, { edge: 1, t: BB + ' ' + u }], texts: [{ x: hx + c / 2, y: hy + d / 2 + 0.25, t: c + ' × ' + d, cls: 'ar-t2 ar-small' }],
      W: 300, H: 200, label: cx[0] + ' с вырезом'
    });
    var holeGen = { 'окно': 'окна', 'пруд': 'пруда', 'отверстие': 'отверстия', 'бассейн': 'бассейна' }[cx[2]];
    var holeAcc = { 'окно': 'окно', 'пруд': 'пруд', 'отверстие': 'отверстие', 'бассейн': 'бассейн' }[cx[2]];
    return {
      kind: 'num', html: pic2 + '<span class="ar-q">' + cx[0] + ' имеет форму прямоугольника ' + AA + ' ' + u + ' × ' + BB + ' ' + u + '. ' + cap(cx[3]) + ' есть ' + holeAcc + ' прямоугольной формы ' + c + ' ' + u + ' × ' + d + ' ' + u + '. Найди площадь ' + cx[1] + ' без ' + holeGen + ' (в ' + SQLOC[u] + ').</span>', answer: SS,
      hint: 'Найди площадь всего прямоугольника и вычти площадь выреза.',
      explain: steps(['Весь прямоугольник: ' + AA + ' × ' + BB + ' = ' + (AA * BB), 'Вырез: ' + c + ' × ' + d + ' = ' + (c * d), 'Остаётся: ' + (AA * BB) + ' − ' + (c * d) + ' = ' + SS], SS + ' ' + sq2(u))
    };
  });

  /* ---------- задачи на площадь ---------- */
  function plSq(n) { return fmt(n) + NB + 'м²'; }
  var YIELD = [
    { who: 'Огород', form: 'прямоугольной формы', unit: 'кг', q: 'Сколько килограммов моркови собрали со всего огорода?', per: 'С каждого квадратного метра собрали по ', amin: 12, amax: 40, bmin: 8, bmax: 25, ks: [2, 3, 4, 5, 6], suffix: ' кг моркови' },
    { who: 'Газон', form: 'прямоугольной формы', unit: 'г', q: 'Сколько граммов семян потребовалось на весь газон?', per: 'На каждый квадратный метр высыпали по ', amin: 10, amax: 30, bmin: 6, bmax: 15, ks: [20, 25, 30, 40, 50], suffix: ' г семян' }
  ];
  reg('arPRect', function (o) {
    o = o || {};
    var type = o.type || pick(['yield', 'sq', 'cmp', 'both', 'tiles', 'orchard', 'scale', 'revP']), a, b, S, P, ans, text, why, hint, pic = '', kind = 'num', extra = {};
    if (type === 'yield') {
      var sub = o.sub || pick(['crop', 'paint', 'cost', 'seed']), k;
      if (sub === 'crop') {
        a = rand(12, 40); b = rand(8, a > 9 ? Math.min(25, a - 1) : 9); k = pick([2, 3, 4, 5, 6]); S = a * b; ans = S * k;
        text = 'Огород прямоугольной формы: длина ' + a + ' м, ширина ' + b + ' м. С каждого квадратного метра собрали по ' + k + ' кг моркови. Сколько килограммов моркови собрали со всего огорода?';
        why = steps(['Площадь огорода: ' + a + ' × ' + b + ' = ' + S + ' м²', 'Урожай: ' + S + ' × ' + k + ' = ' + fmt(ans) + ' кг'], fmt(ans) + ' кг');
        hint = 'Сначала найди площадь огорода. На каждом квадратном метре собрали одинаково.';
      } else if (sub === 'paint') {
        a = rand(4, 9); b = rand(2, 3); k = pick([150, 200, 250]); S = a * b; ans = S * k;
        text = 'Стену длиной ' + a + ' м и высотой ' + b + ' м надо покрасить. На каждый квадратный метр идёт ' + k + ' г краски. Сколько граммов краски потребуется?';
        why = steps(['Площадь стены: ' + a + ' × ' + b + ' = ' + S + ' м²', 'Краски: ' + S + ' × ' + k + ' = ' + fmt(ans) + ' г'], fmt(ans) + ' г');
        hint = 'Найди площадь стены и умножи на расход краски на один квадратный метр.';
      } else if (sub === 'cost') {
        a = rand(3, 7); b = rand(3, 5); k = pick([200, 250, 300, 400, 500]); S = a * b; ans = S * k;
        text = 'Пол в комнате длиной ' + a + ' м и шириной ' + b + ' м покрыли линолеумом. Один квадратный метр линолеума стоит ' + k + ' руб. Сколько стоит линолеум для всего пола?';
        why = steps(['Площадь пола: ' + a + ' × ' + b + ' = ' + S + ' м²', 'Стоимость: ' + S + ' × ' + k + ' = ' + fmt(ans) + ' руб.'], fmt(ans) + ' руб.');
        hint = 'Сначала найди площадь пола в квадратных метрах, потом умножи на цену одного квадратного метра.';
      } else {
        a = rand(10, 30); b = rand(6, 15); k = pick([20, 25, 30, 40, 50]); S = a * b; ans = S * k;
        text = 'Газон прямоугольной формы ' + a + ' м на ' + b + ' м засеяли травой. На каждый квадратный метр высыпали по ' + k + ' г семян. Сколько граммов семян потребовалось?';
        why = steps(['Площадь газона: ' + a + ' × ' + b + ' = ' + S + ' м²', 'Семян: ' + S + ' × ' + k + ' = ' + fmt(ans) + ' г'], fmt(ans) + ' г');
        hint = 'Найди площадь газона и умножи на количество семян на один квадратный метр.';
      }
    } else if (type === 'sq') {
      var s1 = rand(6, 60), sub2 = o.sub || pick(['area', 'cost', 'rows']);
      S = s1 * s1;
      if (sub2 === 'area') {
        ans = S;
        text = pick(['Квадратное поле со стороной ' + s1 + ' м вспахали. Сколько квадратных метров земли вспахали?', 'Квадратный двор со стороной ' + s1 + ' м залили асфальтом. Сколько квадратных метров двора покрыто асфальтом?', 'Квадратную площадку со стороной ' + s1 + ' м засеяли травой. Сколько квадратных метров площадки засеяли?']);
        why = steps(['У квадрата длина и ширина равны: ' + s1 + ' м', 'Площадь: ' + s1 + ' × ' + s1 + ' = ' + fmt(S) + ' м²'], plSq(S));
        hint = 'Площадь квадрата — сторона, умноженная на себя.';
      } else if (sub2 === 'cost') {
        s1 = rand(6, 30); S = s1 * s1; var pr = pick([20, 30, 40, 50, 60, 100]); ans = S * pr;
        text = 'Площадку квадратной формы со стороной ' + s1 + ' м покрыли резиновым покрытием. Один квадратный метр покрытия стоит ' + pr + ' руб. Сколько стоит всё покрытие?';
        why = steps(['Площадь площадки: ' + s1 + ' × ' + s1 + ' = ' + fmt(S) + ' м²', 'Стоимость: ' + fmt(S) + ' × ' + pr + ' = ' + fmt(ans) + ' руб.'], fmt(ans) + ' руб.');
        hint = 'Найди площадь квадрата и умножи на цену одного квадратного метра.';
      } else {
        s1 = rand(3, 10); S = s1 * s1; var kk = rand(2, 6); ans = S * kk;
        text = 'Квадратную клумбу со стороной ' + s1 + ' м засадили цветами: на каждом квадратном метре — ' + kk + ' ' + R.plural(kk, ['куст', 'куста', 'кустов']) + '. Сколько кустов посадили?';
        why = steps(['Площадь клумбы: ' + s1 + ' × ' + s1 + ' = ' + S + ' м²', 'Кустов: ' + S + ' × ' + kk + ' = ' + ans], ans + ' ' + R.plural(ans, ['куст', 'куста', 'кустов']));
        hint = 'Сначала найди площадь клумбы в квадратных метрах.';
      }
    } else if (type === 'cmp') {
      var a1 = rand(20, 80), b1 = rand(10, 50), a2 = rand(20, 80), b2 = rand(10, 50), S1 = a1 * b1, S2 = a2 * b2;
      if (S1 === S2) return gens.arPRect(o);
      var th = pick([['Первое поле', 'второе', 'первого поля', 'второго поля'], ['Первый участок', 'второй', 'первого участка', 'второго участка'], ['Первый огород', 'второй', 'первого огорода', 'второго огорода']]);
      var big1 = S1 > S2;
      ans = Math.abs(S1 - S2);
      text = th[0] + ' имеет длину ' + a1 + ' м и ширину ' + b1 + ' м, ' + th[1] + ' — длину ' + a2 + ' м и ширину ' + b2 + ' м. На сколько квадратных метров площадь ' + (big1 ? th[2] : th[3]) + ' больше площади ' + (big1 ? th[3] : th[2]) + '?';
      why = steps(['Первое: ' + a1 + ' × ' + b1 + ' = ' + fmt(S1) + ' м²', 'Второе: ' + a2 + ' × ' + b2 + ' = ' + fmt(S2) + ' м²', 'Разность: ' + fmt(Math.max(S1, S2)) + ' − ' + fmt(Math.min(S1, S2)) + ' = ' + fmt(ans) + ' м²'], plSq(ans));
      hint = 'Найди площадь каждого прямоугольника, потом вычти меньшую из большей.';
    } else if (type === 'both') {
      a = rand(12, 60); do { b = rand(8, 40); } while (a === b);
      S = a * b; P = 2 * (a + b); kind = 'nums';
      var ob = pick(['участка', 'огорода', 'двора', 'поля']);
      text = 'Длина ' + ob + ' прямоугольной формы — ' + a + ' м, ширина — ' + b + ' м. Найди длину ограды вокруг ' + ob + ' и его площадь.';
      extra = { fields: [{ label: 'ограда, м' }, { label: 'площадь, м²' }] };
      ans = [P, S];
      why = steps(['Ограда — периметр: (' + a + ' + ' + b + ') × 2 = ' + P + ' м', 'Площадь: ' + a + ' × ' + b + ' = ' + fmt(S) + ' м²'], P + ' и ' + fmt(S));
      hint = 'Длина ограды — это периметр, площадь — длина, умноженная на ширину. Это разные величины.';
    } else if (type === 'tiles') {
      var wm = rand(2, 5), hm = rand(2, 3), place = pick([['Стену ванной комнаты', 'облицовывают'], ['Стену кухни над столом', 'облицовывают'], ['Пол в прихожей', 'вымащивают']]);
      var t = place[0].indexOf('Пол') === 0 ? pick([2, 5]) : pick([1, 2]), WD = wm * 10, HD = hm * 10;
      ans = (WD / t) * (HD / t);
      var dimsText = place[0].indexOf('Пол') === 0 ? 'длиной ' + wm + ' м и шириной ' + hm + ' м' : 'длиной ' + wm + ' м и высотой ' + hm + ' м';
      text = place[0] + ' ' + dimsText + ' ' + place[1] + ' квадратной плиткой со стороной ' + t + ' дм. Сколько плиток нужно?';
      why = steps(['Выразим размеры в дециметрах: ' + wm + ' м = ' + WD + ' дм, ' + hm + ' м = ' + HD + ' дм', 'Площадь: ' + WD + ' × ' + HD + ' = ' + fmt(WD * HD) + ' дм²; площадь одной плитки: ' + t + ' × ' + t + ' = ' + (t * t) + ' дм²', 'Плиток: ' + fmt(WD * HD) + ' : ' + (t * t) + ' = ' + fmt(ans)], fmt(ans) + ' ' + R.plural(ans, ['плитка', 'плитки', 'плиток']));
      hint = 'Выразите размеры в дециметрах, найдите площадь и площадь одной плитки, потом узнайте, сколько раз вторая укладывается в первой.';
    } else if (type === 'orchard') {
      var side = pick([4, 5, 6, 8, 10]), ra = rand(6, 15), rb = rand(4, 10);
      a = side * ra; b = side * rb; ans = ra * rb;
      var trees = pick([['яблони', 'яблонь', ['яблоня', 'яблони', 'яблонь']], ['вишни', 'вишен', ['вишня', 'вишни', 'вишен']], ['груши', 'груш', ['груша', 'груши', 'груш']], ['сливы', 'слив', ['слива', 'сливы', 'слив']]]);
      text = 'Сад прямоугольной формы: длина ' + a + ' м, ширина ' + b + ' м. Для каждой ' + trees[0].replace(/и$/, 'и').replace('яблони', 'яблони') + ' отвели квадратный участок со стороной ' + side + ' м. Сколько ' + trees[1] + ' можно посадить в таком саду?';
      why = steps(['Площадь сада: ' + a + ' × ' + b + ' = ' + fmt(a * b) + ' м²', 'Площадь участка одного дерева: ' + side + ' × ' + side + ' = ' + (side * side) + ' м²', 'Деревьев: ' + fmt(a * b) + ' : ' + (side * side) + ' = ' + ans], ans + ' ' + R.plural(ans, trees[2]));
      hint = 'Найди площадь сада и площадь участка одного дерева. Сколько раз второе укладывается в первом?';
    } else if (type === 'scale') {
      var scl = pick([10, 20, 25, 40, 50, 100]), ca = rand(3, 7), cb = rand(2, 5);
      if (ca === cb) ca += 1;
      a = ca * scl; b = cb * scl; S = a * b; ans = S;
      pic = R.arRectSVG(ca, cb, { top: ca + ' см', right: cb + ' см', W: 240, H: 140, label: 'Чертёж участка в масштабе' });
      text = 'На чертеже участок изображён прямоугольником со сторонами ' + ca + ' см и ' + cb + ' см. Масштаб: в 1 см — ' + scl + ' м. Найди площадь участка (в квадратных метрах).';
      why = steps(['Длина участка: ' + ca + ' × ' + scl + ' = ' + a + ' м; ширина: ' + cb + ' × ' + scl + ' = ' + b + ' м', 'Площадь: ' + a + ' × ' + b + ' = ' + fmt(S) + ' м²'], plSq(S));
      hint = 'Сначала узнай настоящие длину и ширину участка по масштабу, потом найди площадь.';
    } else {
      var bb = rand(5, 40), aa = rand(bb + 1, 60); S = aa * bb; P = 2 * (aa + bb);
      ans = P;
      text = 'Площадь прямоугольного поля ' + fmt(S) + ' м², его длина ' + aa + ' м. Сколько метров изгороди нужно, чтобы огородить всё поле?';
      why = steps(['Ширина поля: ' + fmt(S) + ' : ' + aa + ' = ' + bb + ' м', 'Периметр: (' + aa + ' + ' + bb + ') × 2 = ' + P + ' м'], P + ' м');
      hint = 'Чтобы найти длину изгороди, нужна и ширина. Найди её из площади и длины.';
    }
    var q = { kind: kind, html: pic + text, answer: ans, hint: hint, explain: why };
    if (extra.fields) q.fields = extra.fields;
    return q;
  });

  var GSTORY = [
    { who: 'Огород', gen: 'огорода', crops: ['капусту', 'корнеплоды', 'картофель'] },
    { who: 'Поле', gen: 'поля', crops: ['пшеницу', 'рожь', 'ячмень'] },
    { who: 'Участок земли', gen: 'участка', crops: ['цветы', 'газон', 'плодовые деревья'] }
  ];
  reg('arPComp', function (o) {
    o = o || {};
    var type = o.type || pick(['garden', 'wall', 'carpet', 'pond', 'two', 'yield', 'rest']), a, b, S, ans, text, why, hint;
    if (type === 'garden') {
      var st = pick(GSTORY), pq = pick([[4, 8], [2, 4], [5, 10], [3, 6]]), p = pq[0], q = pq[1], d;
      var tries = 0;
      do { a = rand(8, 14) * 10; d = rand(1, 3) * 10; b = a - d; S = a * b; tries++; } while ((S % q !== 0) && tries < 100);
      if (S % q !== 0) { a = 100; b = 80; S = 8000; d = 20; if (S % q) { return gens.arPComp(o); } }
      var s1 = S / p, s2 = S / q; ans = S - s1 - s2;
      text = st.who + ' прямоугольной формы: длина ' + a + ' м, а ширина на ' + d + ' м меньше. Под ' + st.crops[0] + ' отвели площадь в ' + p + ' ' + R.plural(p, ['раз', 'раза', 'раз']) + ' меньше площади всего ' + (st.gen === 'участка' ? 'участка' : st.gen) + ', под ' + st.crops[1] + ' — в ' + q + ' ' + R.plural(q, ['раз', 'раза', 'раз']) + ' меньше, а остальную площадь заняли под ' + st.crops[2] + '. Сколько квадратных метров занято под ' + st.crops[2] + '?';
      why = steps(['Ширина: ' + a + ' − ' + d + ' = ' + b + ' м', 'Площадь: ' + a + ' × ' + b + ' = ' + fmt(S) + ' м²', 'Под ' + st.crops[0] + ': ' + fmt(S) + ' : ' + p + ' = ' + fmt(s1) + ' м²; под ' + st.crops[1] + ': ' + fmt(S) + ' : ' + q + ' = ' + fmt(s2) + ' м²',
        'Под обе культуры: ' + fmt(s1) + ' + ' + fmt(s2) + ' = ' + fmt(s1 + s2) + ' м²', 'Под ' + st.crops[2] + ': ' + fmt(S) + ' − ' + fmt(s1 + s2) + ' = ' + fmt(ans) + ' м²'], plSq(ans));
      hint = 'Найди ширину, потом площадь всего участка. Затем площади частей, и вычти их из целого.';
    } else if (type === 'wall') {
      a = rand(5, 9); b = 3; var kw = rand(1, 3), ww = pick([1, 2]), wv = pick([1, 2]), hasDoor = Math.random() < 0.7;
      if (kw * ww > a - 2) kw = 1;
      S = a * b; var win = kw * ww * wv, door = hasDoor ? 2 : 0; ans = S - win - door;
      text = 'Стена длиной ' + a + ' м и высотой ' + b + ' м. В ней ' + kw + ' ' + R.plural(kw, ['окно', 'окна', 'окон']) + ' размером ' + ww + ' м на ' + wv + ' м' + (kw > 1 ? ' каждое' : '') + (hasDoor ? ' и дверь размером 1 м на 2 м' : '') + '. Сколько квадратных метров стены надо покрасить?';
      why = steps(['Площадь стены: ' + a + ' × ' + b + ' = ' + S + ' м²', 'Окна: ' + (kw > 1 ? kw + ' × ' + ww + ' × ' + wv : ww + ' × ' + wv) + ' = ' + win + ' м²' + (hasDoor ? '; дверь: 1 × 2 = 2 м²' : ''), 'Покрасить надо: ' + S + ' − ' + win + (hasDoor ? ' − 2' : '') + ' = ' + ans + ' м²'], plSq(ans));
      hint = 'Окрашивают стену без окон и двери: найди площадь стены и вычти площади окон и двери.';
    } else if (type === 'carpet') {
      a = rand(5, 9); b = rand(3, a - 1); var ca = rand(2, a - 2), cb = rand(2, b - 2);
      S = a * b; ans = S - ca * cb;
      text = 'Пол в комнате имеет длину ' + a + ' м и ширину ' + b + ' м. Посреди комнаты лежит ковёр размером ' + ca + ' м на ' + cb + ' м. Сколько квадратных метров пола не закрыто ковром?';
      why = steps(['Площадь пола: ' + a + ' × ' + b + ' = ' + S + ' м²', 'Площадь ковра: ' + ca + ' × ' + cb + ' = ' + (ca * cb) + ' м²', 'Не закрыто: ' + S + ' − ' + (ca * cb) + ' = ' + ans + ' м²'], plSq(ans));
      hint = 'Из площади пола вычти площадь ковра.';
    } else if (type === 'pond') {
      var sc = pick([['Участок земли', 'пруд', 'дом', 'огород'], ['Школьный двор', 'клумбу', 'спортивную площадку', 'газон'], ['Парк', 'фонтан', 'детскую площадку', 'лужайку']]);
      a = rand(30, 60); b = rand(20, a - 5); var sq1 = rand(4, 10), ra2 = rand(8, 14), rb2 = rand(6, 10);
      S = a * b; ans = S - sq1 * sq1 - ra2 * rb2;
      text = sc[0] + ' имеет форму прямоугольника ' + a + ' м на ' + b + ' м. На нём устроили ' + sc[1] + ' квадратной формы со стороной ' + sq1 + ' м и ' + sc[2] + ' размером ' + ra2 + ' м на ' + rb2 + ' м. Остальная площадь — ' + sc[3] + '. Сколько квадратных метров занимает ' + sc[3] + '?';
      why = steps(['Площадь всего: ' + a + ' × ' + b + ' = ' + fmt(S) + ' м²', 'Квадрат: ' + sq1 + ' × ' + sq1 + ' = ' + (sq1 * sq1) + ' м²; прямоугольник: ' + ra2 + ' × ' + rb2 + ' = ' + (ra2 * rb2) + ' м²', 'Остальное: ' + fmt(S) + ' − ' + (sq1 * sq1) + ' − ' + (ra2 * rb2) + ' = ' + fmt(ans) + ' м²'], plSq(ans));
      hint = 'Найди площади всех занятых частей и вычти их из площади всего участка.';
    } else if (type === 'two') {
      var a1 = rand(20, 60), b1 = rand(10, 40), a2 = rand(15, 50), b2 = rand(10, 40), S1 = a1 * b1, S2 = a2 * b2;
      ans = S1 + S2;
      text = 'Земельный участок состоит из двух прямоугольных частей. Размеры первой части — ' + a1 + ' м на ' + b1 + ' м, второй — ' + a2 + ' м на ' + b2 + ' м. Чему равна площадь всего участка?';
      why = steps(['Первая часть: ' + a1 + ' × ' + b1 + ' = ' + fmt(S1) + ' м²', 'Вторая часть: ' + a2 + ' × ' + b2 + ' = ' + fmt(S2) + ' м²', 'Весь участок: ' + fmt(S1) + ' + ' + fmt(S2) + ' = ' + fmt(ans) + ' м²'], plSq(ans));
      hint = 'Площадь целого равна сумме площадей его частей.';
    } else if (type === 'yield') {
      var ds = pick([10, 20, 30]), k = pick([2, 3, 4, 5]), cr = pick([['мешок', 'мешка', 'мешков', 'картофеля'], ['ящик', 'ящика', 'ящиков', 'моркови'], ['ящик', 'ящика', 'ящиков', 'помидоров']]);
      a = pick([60, 70, 80, 90, 100, 120]); b = a - ds; S = a * b; var hundreds = S / 100; ans = hundreds * k;
      text = 'Длина огорода прямоугольной формы ' + a + ' м, а ширина на ' + ds + ' м меньше. С каждых 100 м² собрали ' + k + ' ' + R.plural(k, cr.slice(0, 3)) + ' ' + cr[3] + '. Сколько ' + cr[2] + ' ' + cr[3] + ' собрали со всего огорода?';
      why = steps(['Ширина: ' + a + ' − ' + ds + ' = ' + b + ' м', 'Площадь: ' + a + ' × ' + b + ' = ' + fmt(S) + ' м²', 'Сколько раз по 100 м²: ' + fmt(S) + ' : 100 = ' + hundreds, 'Урожай: ' + hundreds + ' × ' + k + ' = ' + ans], ans + ' ' + R.plural(ans, cr.slice(0, 3)));
      hint = 'Найди площадь огорода, потом узнай, сколько участков по 100 м² в нём помещается.';
    } else {
      var dl = pick([15, 20, 25, 30]), wd = pick([40, 50, 60]), pa = wd + dl, pl = rand(2, 6) * 10 + 20, pw = rand(2, 4) * 10 + 10;
      if (pl >= pa) pl = pa - 10;
      if (pw >= wd) pw = wd - 10;
      S = pa * wd; ans = S - pl * pw;
      text = 'Ширина огорода прямоугольной формы ' + wd + ' м, а длина на ' + dl + ' м больше. Под картофель выделен участок длиной ' + pl + ' м и шириной ' + pw + ' м, а остальная площадь отведена под капусту и другие овощи. Сколько квадратных метров отведено под капусту и другие овощи?';
      why = steps(['Длина огорода: ' + wd + ' + ' + dl + ' = ' + pa + ' м', 'Площадь огорода: ' + pa + ' × ' + wd + ' = ' + fmt(S) + ' м²', 'Под картофель: ' + pl + ' × ' + pw + ' = ' + fmt(pl * pw) + ' м²', 'Под капусту и другие овощи: ' + fmt(S) + ' − ' + fmt(pl * pw) + ' = ' + fmt(ans) + ' м²'], plSq(ans));
      hint = 'Найди площадь всего огорода и площадь картофельного участка, потом вычти.';
    }
    return { kind: 'num', html: text, answer: ans, hint: hint, explain: why };
  });

  /* ================= виджеты урока 85–88 ================= */
  /* прямоугольник: вводим длину и ширину — видим вид фигуры и периметр */
  R.widgetMounts.arRectExp = function (host) {
    var h = '<div class="ar-wrow"><label class="fld"><span class="wlabel">Длина</span><input class="winput sm ar-a" inputmode="numeric" autocomplete="off" value="7"></label>' +
      '<label class="fld"><span class="wlabel">Ширина</span><input class="winput sm ar-b" inputmode="numeric" autocomplete="off" value="4"></label>' +
      '<label class="fld"><span class="wlabel">Единица</span><select class="wsel"><option>см</option><option>дм</option><option>м</option></select></label></div><div class="w-out ar-wout" aria-live="polite"></div>';
    host.innerHTML = h;
    var ia = host.querySelector('.ar-a'), ib = host.querySelector('.ar-b'), sel = host.querySelector('select'), out = host.querySelector('.ar-wout');
    function upd() {
      var a = digitsOf(ia, 2), b = digitsOf(ib, 2), u = sel.value;
      if (a < 1 || b < 1) { out.innerHTML = '<p class="facts ar-warn">Впиши длину и ширину — числа от 1 до 99.</p>'; return; }
      var P = (a + b) * 2, sqr = a === b;
      out.innerHTML = R.arRectSVG(a, b, { top: a + ' ' + u, right: b + ' ' + u, W: 280, H: 150 }) +
        '<p class="facts"><b>' + (sqr ? 'Это квадрат: все стороны равны.' : 'Это прямоугольник: противоположные стороны равны, а соседние разные.') + '</b><br>' +
        'Периметр: (' + a + ' + ' + b + ') × 2 = ' + P + ' ' + u + (sqr ? '<br>Для квадрата можно короче: ' + a + ' × 4 = ' + P + ' ' + u + '.' : '') + '</p>';
    }
    sel.addEventListener('change', upd);
    [ia, ib].forEach(function (x) { R.groupInput(x, 2); x.addEventListener('input', upd); });
    upd();
  };

  /* закрась клетки: площадь (число клеток) и длина границы */
  R.widgetMounts.arPaint = function (host) {
    var cols = 10, rows = 6, cs = 30, on = {}, i, j;
    var svg = '<svg class="fig" viewBox="0 0 ' + (cols * cs + 4) + ' ' + (rows * cs + 4) + '" width="' + (cols * cs + 4) + '" role="group" aria-label="Клетчатое поле: нажимай на клетки, чтобы закрасить">';
    for (i = 0; i < rows; i++) for (j = 0; j < cols; j++) svg += '<rect class="ar-pc" data-r="' + i + '" data-c="' + j + '" x="' + (2 + j * cs) + '" y="' + (2 + i * cs) + '" width="' + cs + '" height="' + cs + '"/>';
    svg += '</svg>';
    host.innerHTML = '<div class="ar-paint">' + svg + '</div><div class="ar-wbtns"><button type="button" class="btn soft" data-p="clear">Очистить</button>' +
      '<button type="button" class="btn soft" data-p="row">Полоска 1 × 8</button><button type="button" class="btn soft" data-p="rect">Прямоугольник 2 × 4</button><button type="button" class="btn soft" data-p="sq">Квадрат 3 × 3</button><button type="button" class="btn soft" data-p="l">Уголок из 8 клеток</button></div>' +
      '<div class="w-out ar-wout" aria-live="polite"></div>';
    var cells = host.querySelectorAll('.ar-pc'), out = host.querySelector('.ar-wout');
    function key(r, c) { return r + ',' + c; }
    function draw() {
      var n = 0, edges = 0;
      Array.prototype.forEach.call(cells, function (el) {
        var r = +el.getAttribute('data-r'), c = +el.getAttribute('data-c'), isOn = !!on[key(r, c)];
        el.setAttribute('class', 'ar-pc' + (isOn ? ' on' : ''));
        if (isOn) {
          n++;
          [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) { if (!on[key(r + d[0], c + d[1])]) edges++; });
        }
      });
      out.innerHTML = n ? '<p class="facts ar-big">Закрашено клеток — это <b>площадь</b>: <b>' + n + '</b>.<br>Длина границы фигуры: <b>' + edges + '</b> ' + R.plural(edges, ['сторона клетки', 'стороны клетки', 'сторон клетки']) + '.</p><p class="facts">Попробуй закрасить 8 клеток разными способами: площадь будет одна и та же, а граница — разной длины.</p>'
        : '<p class="facts">Нажимай на клетки, чтобы их закрасить; ещё раз — чтобы убрать закраску.</p>';
    }
    function set(list) { on = {}; list.forEach(function (p) { on[key(p[0], p[1])] = 1; }); draw(); }
    host.querySelector('svg').addEventListener('click', function (e) {
      var t = e.target;
      if (!t.getAttribute || t.getAttribute('data-r') == null) return;
      var k = key(+t.getAttribute('data-r'), +t.getAttribute('data-c'));
      if (on[k]) delete on[k]; else on[k] = 1;
      draw();
    });
    host.querySelector('.ar-wbtns').addEventListener('click', function (e) {
      var p = e.target.getAttribute && e.target.getAttribute('data-p'), l = [], r, c;
      if (!p) return;
      if (p === 'clear') l = [];
      else if (p === 'row') for (c = 1; c <= 8; c++) l.push([2, c]);
      else if (p === 'rect') for (r = 1; r <= 2; r++) for (c = 3; c <= 6; c++) l.push([r, c]);
      else if (p === 'sq') for (r = 1; r <= 3; r++) for (c = 3; c <= 5; c++) l.push([r, c]);
      else if (p === 'l') { for (r = 1; r <= 4; r++) l.push([r, 2]); for (c = 3; c <= 6; c++) l.push([4, c]); }
      set(l);
    });
    draw();
  };

  /* укладываем ряды квадратов в прямоугольник: площадь = квадратов в ряду × число рядов */
  R.widgetMounts.arTiles = function (host) {
    var formula = host.getAttribute('data-formula') === '1', u = host.getAttribute('data-unit') || 'дм', usq = u + '²', k = 0, i;
    var h = '<div class="ar-wrow"><label class="fld"><span class="wlabel">Длина, ' + u + '</span><select class="wsel ar-sa"></select></label>' +
      '<label class="fld"><span class="wlabel">Ширина, ' + u + '</span><select class="wsel ar-sb"></select></label></div>' +
      '<div class="ar-wbtns"><button type="button" class="btn primary" data-t="next">Выложить ряд</button><button type="button" class="btn soft" data-t="all">Выложить все ряды</button><button type="button" class="btn soft" data-t="reset">Сначала</button></div>' +
      '<div class="w-out ar-wout" aria-live="polite"></div>';
    host.innerHTML = h;
    var sa = host.querySelector('.ar-sa'), sb = host.querySelector('.ar-sb'), out = host.querySelector('.ar-wout');
    for (i = 2; i <= 10; i++) sa.innerHTML += '<option value="' + i + '"' + (i === 6 ? ' selected' : '') + '>' + i + '</option>';
    for (i = 2; i <= 6; i++) sb.innerHTML += '<option value="' + i + '"' + (i === 3 ? ' selected' : '') + '>' + i + '</option>';
    function draw() {
      var a = +sa.value, b = +sb.value, txt;
      if (k > b) k = b;
      if (k === 0) txt = 'Пока нет ни одного квадрата. Нажми «Выложить ряд»: в каждом ряду поместится ' + a + ' ' + R.plural(a, ['квадрат', 'квадрата', 'квадратов']) + ' по 1 ' + usq + '.';
      else {
        var parts = []; for (i = 0; i < k; i++) parts.push(a);
        txt = 'Выложено рядов: <b>' + k + '</b> из ' + b + '. Квадратов: ' + (k > 1 ? parts.join(' + ') + ' = ' : '') + '<b>' + (a * k) + '</b>' + (k > 1 ? ' (это ' + a + ' × ' + k + ')' : '') + '.';
        if (k === b) txt += '<br><b>Весь прямоугольник заполнен. Площадь: ' + (formula ? 'S = ' + a + ' × ' + b + ' = ' : '') + (a * b) + ' ' + usq + '.</b>' + (formula ? '<br>Длина ' + a + ' ' + u + ' показывает, сколько квадратов в ряду, ширина ' + b + ' ' + u + ' — сколько рядов.' : '');
      }
      out.innerHTML = R.arRectGridSVG(a, b, { rows: k, hiRow: k - 1, top: a + ' ' + u, right: b + ' ' + u, cs: 26 }) + '<p class="facts">' + txt + '</p>';
    }
    sa.addEventListener('change', function () { k = 0; draw(); });
    sb.addEventListener('change', function () { k = 0; draw(); });
    host.querySelector('.ar-wbtns').addEventListener('click', function (e) {
      var t = e.target.getAttribute && e.target.getAttribute('data-t'), b = +sb.value;
      if (!t) return;
      if (t === 'next') k = Math.min(b, k + 1); else if (t === 'all') k = b; else k = 0;
      draw();
    });
    draw();
  };

  /* ==== КОНЕЦ ==== */

  /* ================= общая чистка текста ================= */
  var tidy = R.tidy;
  created.forEach(function (name) {
    var raw = gens[name];
    gens[name] = function (o) {
      var qq = raw(o);
      qq.html = tidy(qq.html); qq.explain = tidy(qq.explain); qq.hint = tidy(qq.hint);
      return qq;
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
