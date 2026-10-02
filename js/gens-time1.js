/* Блок «Время: единицы и вычисления», уроки 122–131.
   Меры времени (сутки, час, минута, секунда; неделя, месяц, год, век), календарь, часы и двойное обозначение времени,
   раздробление и превращение, сложение и вычитание составных именованных чисел в мерах времени.
   Префикс имён — t1 / pt1 / R.t1…  Все числа генерируются от ответа, счёт идёт «по 60 и по 24», а не «по 10». */
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

  /* ================= цепочки мер (сколько мелких в одной крупной) ================= */
  var CH = {
    'sh':  { u: ['сут.', 'ч'], f: [24] },
    'hm':  { u: ['ч', 'мин'], f: [60] },
    'ms':  { u: ['мин', 'с'], f: [60] },
    'shm': { u: ['сут.', 'ч', 'мин'], f: [24, 60] },
    'hms': { u: ['ч', 'мин', 'с'], f: [60, 60] },
    'wd':  { u: ['нед.', 'сут.'], f: [7] },
    'wdh': { u: ['нед.', 'сут.', 'ч'], f: [7, 24] },
    'ym':  { u: ['г.', 'мес.'], f: [12] }
  };
  Object.keys(CH).forEach(function (k) { CH[k].key = k; });
  function chn(c) { return typeof c === 'string' ? CH[c] : c; }
  function tot(C, v) { var t = v[0]; for (var i = 1; i < v.length; i++) t = t * C.f[i - 1] + v[i]; return t; }
  function spl(C, t) {
    var v = [], i;
    for (i = C.u.length - 1; i >= 1; i--) { v[i] = t % C.f[i - 1]; t = Math.floor(t / C.f[i - 1]); }
    v[0] = t; return v;
  }
  function last(C) { return C.u[C.u.length - 1]; }

  /* ================= слова ================= */
  var W = {
    'сут.': { c: ['сутки', 'суток', 'суток'], gen: 'суток', loc: 'сутках', one: 'одних сутках', name: 'Сутки' },
    'ч':    { c: ['час', 'часа', 'часов'], gen: 'часов', loc: 'часах', one: 'одном часе', name: 'Часы' },
    'мин':  { c: ['минута', 'минуты', 'минут'], gen: 'минут', loc: 'минутах', one: 'одной минуте', name: 'Минуты' },
    'с':    { c: ['секунда', 'секунды', 'секунд'], gen: 'секунд', loc: 'секундах', one: 'одной секунде', name: 'Секунды' },
    'нед.': { c: ['неделя', 'недели', 'недель'], gen: 'недель', loc: 'неделях', one: 'одной неделе', name: 'Недели' },
    'мес.': { c: ['месяц', 'месяца', 'месяцев'], gen: 'месяцев', loc: 'месяцах', one: 'одном месяце', name: 'Месяцы' },
    'г.':   { c: ['год', 'года', 'лет'], gen: 'лет', loc: 'годах', one: 'одном году', name: 'Годы' },
    'век':  { c: ['век', 'века', 'веков'], gen: 'веков', loc: 'веках', one: 'одном веке', name: 'Века' },
    'лет':  { c: ['лет', 'лет', 'лет'], gen: 'лет', loc: 'годах', one: 'одном году', name: 'Годы' }
  };
  var ACC = { 'сут.': 'сутки', 'ч': 'часы', 'мин': 'минуты', 'с': 'секунды', 'нед.': 'недели', 'мес.': 'месяцы', 'г.': 'годы', 'век': 'века', 'лет': 'годы' };
  function wf(u, n) { return R.plural(n, W[u].c); }
  /* «1 год», «1 ч»: единица без числа в именительном падеже, в единственном числе */
  function one(u) { return u === 'г.' ? 'год' : u === 'век' ? 'век' : u; }
  /* подпись поля ввода */
  function lab(u) { return u === 'г.' ? 'лет' : u === 'век' ? 'веков' : u; }
  /* число с единицей: годы и века пишем словом, остальное — принятым сокращением */
  function nu(n, u) {
    if (u === 'век' || u === 'г.') return fmt(n) + NB + wf(u, n);
    return fmt(n) + NB + u;
  }
  /* составное число: нулевые меры не пишем */
  function qt(C, v) {
    var p = [];
    C.u.forEach(function (u, i) { if (v[i]) p.push(nu(v[i], u)); });
    if (!p.length) p.push(nu(0, last(C)));
    return p.join(' ');
  }
  function sm(C, t) { return nu(t, last(C)); }
  function fieldsOf(C) { return C.u.map(function (u) { return { label: lab(u) }; }); }
  function expr(s) { return '<span class="expr t1e">' + s + '</span>'; }
  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function fact(C, i) { return '1' + NB + one(C.u[i]) + ' = ' + nu(C.f[i], C.u[i + 1]); }
  function plainSteps(list) { return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>'); }
  function stepsL(list, ans) { return plainSteps(list) + '<br>Ответ: ' + ans + '.'; }
  function bold(s) { return '<b>' + s + '</b>'; }
  function ansC(C, t) { return bold(qt(C, spl(C, t))); }
  function plur(n, a, b, c) { return R.plural(n, [a, b, c]); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function rnd5(a, b) { return rand(Math.ceil(a / 5), Math.floor(b / 5)) * 5; }

  R.t1Chain = function (k) { return chn(k); };
  R.t1Q = function (k, v) { return qt(chn(k), v); };
  R.t1Sm = function (k, t) { return sm(chn(k), t); };
  R.t1Tot = function (k, v) { return tot(chn(k), v); };
  R.t1Spl = function (k, t) { return spl(chn(k), t); };
  R.t1Nu = nu;

  /* ================= случайные составные значения ================= */
  var TOPR = { sh: [1, 30], hm: [1, 23], ms: [1, 59], shm: [1, 20], hms: [1, 23], wd: [1, 12], wdh: [1, 8], ym: [1, 15] };
  /* значение мелкой меры от 1 до f−1; для минут и секунд чаще кратные пяти */
  function lowv(f, five) {
    if (f === 60) {
      if (five === true || (five !== false && Math.random() < 0.7)) return rnd5(5, 55);
      var x; do { x = rand(1, 59); } while (x % 5 === 0); return x;
    }
    return rand(1, f - 1);
  }
  /* mode: 'full' — все меры не нуль; 'simple' — только старшая; 'zmid' — в трёхзвенной цепочке нуль в середине;
     'zlow' — нуль в младшей мере; top — [от, до] для старшей меры */
  function rv(C, o) {
    o = o || {};
    var n = C.u.length, mode = o.mode || 'full', tr = o.top || TOPR[C.key] || [1, 20], v = [rand(tr[0], tr[1])], i;
    for (i = 1; i < n; i++) v.push(lowv(C.f[i - 1], o.five));
    if (mode === 'simple') { for (i = 1; i < n; i++) v[i] = 0; }
    else if (mode === 'zmid' && n === 3) v[1] = 0;
    else if (mode === 'zlow') v[n - 1] = 0;
    return v;
  }
  R.t1Rv = rv;

  /* ================= столбик с разными «основаниями» ================= */
  function cellsOf(C, v) {
    var n = C.u.length, lead = true, s = '';
    for (var i = 0; i < n; i++) {
      if (v[i] !== 0) lead = false;
      var blank = lead && i < n - 1;
      s += '<td class="n">' + (blank ? '' : fmt(v[i])) + '</td><td class="u">' + (blank ? '' : lab(C.u[i])) + '</td>';
    }
    return s;
  }
  function colTable(op, C, terms, res, marks, o) {
    o = o || {};
    var n = C.u.length, i, h = '<table class="t1col" role="img" aria-label="' + (o.label || 'Запись столбиком') + '"><tbody>';
    if (o.limits) {
      h += '<tr class="lim"><td></td>';
      for (i = 0; i < n; i++) h += '<td class="n">' + (i > 0 ? '&lt;&nbsp;' + C.f[i - 1] : '') + '</td><td class="u"></td>';
      h += '</tr>';
    }
    if (marks && marks.some(function (m) { return m !== '' && m != null; })) {
      h += '<tr class="mk"><td></td>';
      for (i = 0; i < n; i++) h += '<td class="n">' + (marks[i] != null ? marks[i] : '') + '</td><td class="u"></td>';
      h += '</tr>';
    }
    terms.forEach(function (t, k) {
      h += '<tr><td class="op">' + (k === terms.length - 1 ? op : '') + '</td>' + cellsOf(C, t) + '</tr>';
    });
    h += '<tr class="ln"><td class="op"></td>' + cellsOf(C, res) + '</tr>';
    return h + '</tbody></table>';
  }

  /* сложение: {res, marks, lines} */
  function addCalc(C, terms) {
    var n = C.u.length, carry = 0, res = [], marks = [], lines = [], i;
    for (i = 0; i < n; i++) marks.push('');
    for (i = n - 1; i >= 0; i--) {
      var ds = terms.map(function (t) { return t[i]; }), u = C.u[i], s = carry, cin = carry;
      ds.forEach(function (d) { s += d; });
      var c = 0, r = s;
      if (i > 0) { c = Math.floor(s / C.f[i - 1]); r = s % C.f[i - 1]; }
      var tx = W[u].name + ': ' + ds.join(' + ') + (cin ? ' + ' + cin + ' (запомнили)' : '') + ' = ' + nu(s, u) + '.';
      if (c) {
        tx += ' Ведь ' + fact(C, i - 1) + ', поэтому ' + nu(s, u) + ' = ' + nu(c, C.u[i - 1]) + (r ? ' ' + nu(r, u) : '') + ': ' +
          (r ? nu(r, u) + ' пишем, ' : 'пишем 0, ') + nu(c, C.u[i - 1]) + ' запоминаем.';
        marks[i - 1] = '+' + c;
      } else if (i > 0) {
        tx += ' Это меньше ' + nu(C.f[i - 1], u) + ', переносить нечего.';
      }
      lines.push(tx);
      carry = c; res[i] = r;
    }
    return { res: res, marks: marks, lines: lines };
  }
  /* вычитание: {res, marks, lines}; предполагается A > B */
  function subCalc(C, A, B) {
    var n = C.u.length, x = A.slice(), lines = [], res = [], i, k;
    for (i = n - 1; i >= 0; i--) {
      var u = C.u[i], tx = W[u].name + ': ';
      if (x[i] < B[i]) {
        var j = i - 1; while (j > 0 && x[j] === 0) j--;
        var old = x[i];
        tx += old + ' − ' + B[i] + ' не получается (' + old + ' &lt; ' + B[i] + ').';
        if (j === i - 1) {
          tx += ' Занимаем 1 ' + one(C.u[j]) + ' (' + fact(C, j) + '): ' + old + ' + ' + C.f[j] + ' = ' + nu(old + C.f[j], u) + '.';
        } else {
          tx += ' ' + cap(W[C.u[j + 1]].gen) + ' в уменьшаемом нет — занять не у кого. Занимаем 1 ' + one(C.u[j]) + ' (' + fact(C, j) + ').';
          for (k = j + 1; k <= i - 1; k++) tx += ' Из ' + nu(C.f[k - 1], C.u[k]) + ' берём 1 ' + one(C.u[k]) + ' и раздробляем в ' + ACC[C.u[k + 1]] + ' (' + fact(C, k) + '): остаётся ' + nu(C.f[k - 1] - 1, C.u[k]) + '.';
          tx += ' ' + W[u].name + ': ' + old + ' + ' + C.f[i - 1] + ' = ' + nu(old + C.f[i - 1], u) + '.';
        }
        x[j]--;
        for (k = j + 1; k <= i; k++) { x[k] += C.f[k - 1]; if (k < i) x[k]--; }
        tx += ' ' + cap(W[C.u[j]].gen) + ' осталось ' + x[j] + '.';
        tx += ' Теперь ' + x[i] + ' − ' + B[i] + ' = ' + nu(x[i] - B[i], u) + '.';
      } else {
        tx += x[i] + ' − ' + B[i] + ' = ' + nu(x[i] - B[i], u) + '.';
      }
      res[i] = x[i] - B[i];
      lines.push(tx);
    }
    var marks = x.map(function (v, m) { return v !== A[m] ? String(v) : ''; });
    return { res: res, marks: marks, lines: lines };
  }
  /* столбик со сложением или вычитанием и пояснением; op: '+' | '−'; terms: массивы мер */
  R.t1ColHTML = function (op, chain, terms, o) {
    var C = chn(chain), t = terms, cal, T;
    o = o || {};
    if (op === '+') { cal = addCalc(C, t); T = t.reduce(function (s, x) { return s + tot(C, x); }, 0); }
    else { cal = subCalc(C, t[0], t[1]); T = tot(C, t[0]) - tot(C, t[1]); }
    var lab_ = t.map(function (x) { return qt(C, x); }).join(op === '+' ? ' плюс ' : ' минус ') + ' равно ' + qt(C, cal.res);
    var lines = cal.lines.slice();
    var tail = '<b>Итого: ' + qt(C, cal.res) + '</b>';
    if (o.check) {
      if (op === '+') tail += '<br>Проверка вычитанием: ' + qt(C, cal.res) + ' − ' + qt(C, t[1]) + ' = ' + qt(C, t[0]);
      else tail += '<br>Проверка сложением: ' + qt(C, cal.res) + ' + ' + qt(C, t[1]) + ' = ' + qt(C, t[0]);
    }
    return '<div class="colrow">' + colTable(op, C, t, cal.res, cal.marks, { label: lab_, limits: !!o.limits }) +
      '<div class="colsteps">' + plainSteps(lines) + '<br>' + tail + '</div></div>';
  };
  R.t1AddCalc = function (chain, terms) { var C = chn(chain), c = addCalc(C, terms); return { res: c.res, lines: c.lines }; };
  R.t1SubCalc = function (chain, A, B) { var C = chn(chain), c = subCalc(C, A, B); return { res: c.res, lines: c.lines }; };
  /* только таблица (без пояснений) — для вставки в разбор рядом со своим текстом */
  R.t1ColOnly = function (op, chain, terms, o) {
    var C = chn(chain), cal = op === '+' ? addCalc(C, terms) : subCalc(C, terms[0], terms[1]);
    o = o || {};
    return colTable(op, C, terms, cal.res, cal.marks, { label: 'Запись столбиком', limits: !!o.limits });
  };

  /* раздробление по шагам: строки */
  function fragLines(C, v) {
    var n = C.u.length, lines = [], acc = v[0], i;
    if (n === 2 && v[1] === 0) {
      return { lines: [nu(v[0], C.u[0]) + ' = ' + v[0] + ' × ' + C.f[0] + ' = ' + nu(v[0] * C.f[0], C.u[1]) + ' (' + fact(C, 0) + ').'], t: v[0] * C.f[0] };
    }
    for (i = 1; i < n; i++) {
      var f = C.f[i - 1], p = acc * f, s = p + v[i];
      var a = fmt(acc) + ' × ' + f + ' = ' + nu(p, C.u[i]);
      if (v[i]) a += '; ' + fmt(p) + ' + ' + v[i] + ' = ' + nu(s, C.u[i]);
      else a += ' (' + W[C.u[i]].gen + ' в записи нет — прибавлять нечего)';
      lines.push(a + '.');
      acc = s;
    }
    return { lines: lines, t: acc };
  }
  R.t1FragLines = function (chain, v) { return fragLines(chn(chain), v); };
  /* превращение по шагам: деление на 60 (24, 7, 12) с остатками */
  function turnLines(C, t) {
    var n = C.u.length, lines = [], cur = t, i;
    for (i = n - 1; i >= 1; i--) {
      var f = C.f[i - 1], q = Math.floor(cur / f), r = cur % f, u = C.u[i];
      lines.push(nu(cur, u) + ' : ' + f + ' = ' + nu(q, C.u[i - 1]) + (r ? ', остаток ' + nu(r, u) : ', остатка нет') + '.');
      cur = q;
    }
    return lines;
  }
  R.t1TurnLines = function (chain, t) { return turnLines(chn(chain), t); };

  /* ================= лесенка мер и цепочка шагов ================= */
  R.t1Lad = function (kind) {
    var rows = kind === 'cal' ? [['год', '× 12', ': 12'], ['месяц']] : [['сутки', '× 24', ': 24'], ['час', '× 60', ': 60'], ['минута', '× 60', ': 60'], ['секунда']];
    var h = '<div class="t1lad" role="img" aria-label="Лесенка мер времени">';
    rows.forEach(function (r, i) {
      h += '<div class="t1lu">' + r[0] + '</div>';
      if (r[1]) h += '<div class="t1ll"><span class="t1dn">↓ ' + r[1] + '</span><span class="t1up">↑ ' + r[2] + '</span></div>';
    });
    return h + '</div>';
  };
  R.t1Flow = function (steps) {
    return '<div class="t1flow">' + steps.map(function (st, i) {
      return '<div class="t1st"><b class="t1h">' + (i + 1) + '. ' + st.h + '</b><span class="t1t">' + st.t + '</span></div>';
    }).join('<span class="t1ar" aria-hidden="true">→</span>') + '</div>';
  };

  /* ================= циферблат ================= */
  function pt(cx, cy, L, deg) {
    var a = deg * Math.PI / 180;
    return [Math.round((cx + L * Math.sin(a)) * 100) / 100, Math.round((cy - L * Math.cos(a)) * 100) / 100];
  }
  /* R.t1ClockSVG(ч, мин, {dual, size, label}) — стрелки: t1hh (часовая, короткая) и t1mh (минутная, длинная) */
  R.t1ClockSVG = function (h, m, o) {
    o = o || {};
    var size = o.size || 150, dual = !!o.dual, s = '', i, p, p2;
    s += '<circle class="t1face" cx="100" cy="100" r="95"/>';
    for (i = 0; i < 60; i++) {
      var big = i % 5 === 0;
      p = pt(100, 100, big ? 80 : 86, i * 6); p2 = pt(100, 100, 91, i * 6);
      s += '<line class="t1tick' + (big ? ' big' : '') + '" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + p2[0] + '" y2="' + p2[1] + '"/>';
    }
    for (i = 1; i <= 12; i++) {
      p = pt(100, 100, dual ? 69 : 66, i * 30);
      s += '<text class="t1num" x="' + p[0] + '" y="' + (p[1] + 6) + '" text-anchor="middle">' + i + '</text>';
      if (dual) {
        var p3 = pt(100, 100, 49, i * 30), v24 = i + 12;
        s += '<text class="t1n24" x="' + p3[0] + '" y="' + (p3[1] + 4) + '" text-anchor="middle">' + (v24 === 24 ? 24 : v24) + '</text>';
      }
    }
    var ah = ((h % 12) + m / 60) * 30, am = m * 6;
    var e1 = pt(100, 100, dual ? 34 : 40, ah), e2 = pt(100, 100, 66, am);
    s += '<line class="t1hh" x1="100" y1="100" x2="' + e1[0] + '" y2="' + e1[1] + '"/>';
    s += '<line class="t1mh" x1="100" y1="100" x2="' + e2[0] + '" y2="' + e2[1] + '"/>';
    s += '<circle class="t1hub" cx="100" cy="100" r="5"/>';
    return '<svg class="fig t1clock' + (o.mini ? ' t1cl' : '') + '" viewBox="0 0 200 200" width="' + size + '" height="' + size + '" role="img" aria-label="' + (o.label || 'Циферблат со стрелками') + '">' + s + '</svg>';
  };

  /* ================= линия времени ================= */
  function hmLab(t) {
    var h = Math.floor(t / 60) % 24, m = t % 60;
    return m ? h + ':' + (m < 10 ? '0' : '') + m : String(h === 0 && t > 0 ? 24 : h);
  }
  function clk24(T) {
    T = ((T % 1440) + 1440) % 1440;
    var h = Math.floor(T / 60), m = T % 60;
    return m ? h + NB + 'ч ' + m + NB + 'мин' : h + NB + 'ч';
  }
  /* R.t1LineSVG({a, b, step, spans:[{s,e,label}], marks:[{t,label,side}]}) — время в минутах от полуночи */
  R.t1LineSVG = function (o) {
    var W_ = 380, H = 116, x0 = 40, x1 = 340, y = 74, a = o.a, b = o.b, step = o.step || 60, s = '', t;
    function X(v) { return Math.round((x0 + (v - a) / (b - a) * (x1 - x0)) * 10) / 10; }
    s += '<line class="t1ax" x1="' + (x0 - 14) + '" y1="' + y + '" x2="' + (x1 + 14) + '" y2="' + y + '"/>';
    for (t = a; t <= b; t += step) {
      var whole = t % 60 === 0 || step >= 60;
      s += '<line class="t1tk" x1="' + X(t) + '" y1="' + (y - 5) + '" x2="' + X(t) + '" y2="' + (y + 5) + '"/>';
      s += '<text class="t1tl" x="' + X(t) + '" y="' + (y + 21) + '" text-anchor="middle">' + (o.lab ? o.lab(t) : hmLab(t)) + '</text>';
    }
    (o.spans || []).forEach(function (sp, k) {
      var xa = X(sp.s), xb = X(sp.e), yb = 42 - (sp.lvl || 0) * 0;
      s += '<path class="t1sp" d="M' + xa + ' ' + (yb + 8) + 'v-8h' + (xb - xa) + 'v8"/>';
      s += '<text class="t1sl" x="' + Math.round((xa + xb) / 2) + '" y="' + (yb - 6) + '" text-anchor="middle">' + sp.label + '</text>';
    });
    (o.marks || []).forEach(function (mk) {
      var x = X(mk.t), anc = mk.side === 'r' ? 'start' : 'end', tx = mk.side === 'r' ? x + 6 : x - 6;
      if (anc === 'end' && x < 76) { anc = 'start'; tx = x + 6; }
      if (anc === 'start' && W_ - x < 76) { anc = 'end'; tx = x - 6; }
      s += '<line class="t1dot" x1="' + x + '" y1="' + (y - 20) + '" x2="' + x + '" y2="' + y + '"/>';
      s += '<circle class="t1pt" cx="' + x + '" cy="' + y + '" r="4.5"/>';
      s += '<text class="t1ml" x="' + tx + '" y="' + (y - 12) + '" text-anchor="' + anc + '">' + mk.label + '</text>';
    });
    return '<svg class="fig t1line" viewBox="0 0 ' + W_ + ' ' + H + '" width="' + W_ + '" role="img" aria-label="' + (o.aria || 'Линия времени') + '">' + s + '</svg>';
  };
  /* линия «начало — длительность — конец»; S, E — минуты от полуночи (E может быть больше 1440) */
  R.t1ShiftSVG = function (S, E, durTxt, o) {
    o = o || {};
    var D = E - S, steps = [5, 10, 15, 30, 60, 120], step = 120, k;
    for (k = 0; k < steps.length; k++) { if ((D * 2.2) / steps[k] <= 9) { step = steps[k]; break; } }
    var a = Math.floor((S - D * 0.6) / step) * step, b = Math.ceil((E + D * 0.6) / step) * step;
    if (a < 0 && S >= 0) a = 0;
    return R.t1LineSVG({ a: a, b: b, step: step, spans: [{ s: S, e: E, label: durTxt }],
      marks: [{ t: S, label: o.sl || clk24(S), side: 'l' }, { t: E, label: o.el || clk24(E), side: 'r' }], aria: o.aria || 'Линия времени: начало, конец и длительность' });
  };

    /* ================= таблица мер времени ================= */
  var PAIRS = {
    'sh': { big: 'сут.', small: 'ч', f: 24, fact: '1 сут. = 24 ч' },
    'hm': { big: 'ч', small: 'мин', f: 60, fact: '1 ч = 60 мин' },
    'ms': { big: 'мин', small: 'с', f: 60, fact: '1 мин = 60 с' },
    'wd': { big: 'нед.', small: 'сут.', f: 7, fact: '1 нед. = 7 сут.' },
    'ym': { big: 'г.', small: 'мес.', f: 12, fact: '1 год = 12 мес.' },
    'cy': { big: 'век', small: 'лет', f: 100, fact: '1 век = 100 лет' }
  };
  R.t1Pair = function (k) { return PAIRS[k]; };
  var KS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 24, 30];
  reg('t1Fact', function (o) {
    o = o || {};
    var key = pick(o.pairs || ['sh', 'hm', 'ms', 'wd', 'ym']), P = PAIRS[key], f = P.f, kind = o.kind || pick(['down', 'down', 'up', 'one']);
    var ks = key === 'cy' ? [2, 3, 4, 5, 6, 7, 8, 9] : KS, k = pick(ks);
    for (var gd = 0; gd < 30 && kind === 'up' && (k * f) % 10 === 1 && (k * f) % 100 !== 11; gd++) k = pick(ks);
    if (kind === 'one') {
      return { kind: 'num', html: 'Сколько ' + W[P.small].gen + ' в ' + W[P.big].one + '?', answer: f,
        hint: 'Вспомни таблицу мер времени.',
        explain: 'По таблице: ' + P.fact + '. Значит, в ' + W[P.big].one + ' ' + nu(f, P.small) + '.' };
    }
    if (kind === 'up') {
      return { kind: 'num', html: 'Сколько ' + W[P.big].gen + ' в ' + fmt(k * f) + ' ' + W[P.small].loc + '?', answer: k,
        hint: 'Мелкую меру заменяем крупной: ' + P.fact + '. Значит, надо разделить на ' + f + '.',
        explain: P.fact + '. Значит, ' + nu(k * f, P.small) + ' = ' + fmt(k * f) + ' : ' + f + ' = ' + nu(k, P.big) + '.' };
    }
    return { kind: 'num', html: 'Сколько ' + W[P.small].gen + ' в ' + k + ' ' + W[P.big].loc + '?', answer: k * f,
      hint: 'Крупную меру заменяем мелкими: ' + P.fact + '. Значит, надо умножить на ' + f + '.',
      explain: P.fact + '. Значит, ' + nu(k, P.big) + ' = ' + k + ' × ' + f + ' ' + P.small + ' = ' + nu(k * f, P.small) + '.' };
  });

  /* ================= календарь ================= */
  var MON = [
    { n: 'январь', loc: 'январе', gen: 'января', d: 31 }, { n: 'февраль', loc: 'феврале', gen: 'февраля', d: 28 },
    { n: 'март', loc: 'марте', gen: 'марта', d: 31 }, { n: 'апрель', loc: 'апреле', gen: 'апреля', d: 30 },
    { n: 'май', loc: 'мае', gen: 'мая', d: 31 }, { n: 'июнь', loc: 'июне', gen: 'июня', d: 30 },
    { n: 'июль', loc: 'июле', gen: 'июля', d: 31 }, { n: 'август', loc: 'августе', gen: 'августа', d: 31 },
    { n: 'сентябрь', loc: 'сентябре', gen: 'сентября', d: 30 }, { n: 'октябрь', loc: 'октябре', gen: 'октября', d: 31 },
    { n: 'ноябрь', loc: 'ноябре', gen: 'ноября', d: 30 }, { n: 'декабрь', loc: 'декабре', gen: 'декабря', d: 31 }
  ];
  R.t1Months = MON;
  var SEAS = [
    { n: 'зима', adj: 'зимних', m: [11, 0, 1] }, { n: 'весна', adj: 'весенних', m: [2, 3, 4] },
    { n: 'лето', adj: 'летних', m: [5, 6, 7] }, { n: 'осень', adj: 'осенних', m: [8, 9, 10] }
  ];
  function isLeap(y) { return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0); }
  function mdays(i, y) { return i === 1 ? (isLeap(y) ? 29 : 28) : MON[i].d; }
  function doy(mi, d, y) { var s = d, i; for (i = 0; i < mi; i++) s += mdays(i, y); return s; }
  function dn(d) { return d + ' ' + plur(d, 'день', 'дня', 'дней'); }
  function pickYear(leap) {
    var y, g = 0;
    do { y = rand(1996, 2040); g++; } while (isLeap(y) !== leap && g < 200);
    return y;
  }
  function leapWhy(y) {
    return isLeap(y) ? 'Номер года ' + y + ' делится на 4 без остатка (' + y + ' : 4 = ' + (y / 4) + '), значит, год високосный.' :
      'Номер года ' + y + ' на 4 нацело не делится (остаток ' + (y % 4) + '), значит, год обычный.';
  }
  function joinNames(list) { return list.length === 1 ? list[0] : list.slice(0, -1).join(', ') + ' и ' + list[list.length - 1]; }
  R.t1IsLeap = isLeap;
  R.t1MDays = mdays;

  reg('t1Cal', function (o) {
    o = o || {};
    var kind = o.kind || pick(['days', 'days', 'sum', 'between', 'count', 'season']), i, y, a, b, d;
    if (kind === 'days') {
      i = o.month != null ? o.month : rand(0, 11); y = pickYear(Math.random() < 0.5);
      d = mdays(i, y);
      if (i === 1) {
        return { kind: 'num', html: 'Сколько дней в феврале ' + y + ' года?', answer: d,
          hint: 'Февраль короче остальных месяцев, а его длина зависит от года. Проверь, делится ли номер года на 4.',
          explain: leapWhy(y) + ' В феврале ' + dn(d) + '.' };
      }
      return { kind: 'num', html: 'Сколько дней в ' + MON[i].loc + '?', answer: d,
        hint: 'Вспомни «кулак»: месяцы на косточках — по 31 дню, во впадинках — по 30 (и февраль).',
        explain: 'В ' + MON[i].loc + ' ' + dn(d) + (d === 31 ? ': это один из месяцев с 31 днём (январь, март, май, июль, август, октябрь, декабрь).' : ': это один из месяцев с 30 днями (апрель, июнь, сентябрь, ноябрь).') };
    }
    if (kind === 'sum') {
      var cnt = o.cnt || pick([2, 3]);
      a = o.start != null ? o.start : rand(0, 12 - cnt);
      var idx = []; for (i = 0; i < cnt; i++) idx.push(a + i);
      var hasFeb = idx.indexOf(1) >= 0; y = pickYear(Math.random() < 0.5);
      var ds = idx.map(function (m) { return mdays(m, y); }), sum = ds.reduce(function (s, x) { return s + x; }, 0);
      return { kind: 'num', html: 'Сколько дней в ' + joinNames(idx.map(function (m) { return MON[m].loc; })) + (hasFeb ? ' ' + y + ' года' : '') + ' вместе?', answer: sum,
        hint: 'Узнай, сколько дней в каждом месяце, и сложи.' + (hasFeb ? ' Не забудь про февраль: год високосный или обычный?' : ''),
        explain: (hasFeb ? leapWhy(y) + ' ' : '') + ds.join(' + ') + ' = ' + sum + ' (' + plur(sum, 'день', 'дня', 'дней') + ').' };
    }
    if (kind === 'between') {
      var g = 0, m1, m2, d1, d2;
      y = pickYear(Math.random() < 0.5);
      do { m1 = rand(0, 9); m2 = m1 + rand(1, 3); g++; } while (m2 > 11 && g < 50);
      d1 = rand(1, mdays(m1, y)); d2 = rand(1, mdays(m2, y));
      var need = m1 <= 1 && m2 > 1, ans = doy(m2, d2, y) - doy(m1, d1, y), L = [];
      L.push('До конца ' + MON[m1].gen + ': ' + mdays(m1, y) + ' − ' + d1 + ' = ' + (mdays(m1, y) - d1) + ' сут.');
      var parts = [mdays(m1, y) - d1];
      for (i = m1 + 1; i < m2; i++) { L.push('Целый месяц ' + MON[i].n + ': ' + mdays(i, y) + ' сут.'); parts.push(mdays(i, y)); }
      L.push('В ' + MON[m2].loc + ' до ' + d2 + ' ' + MON[m2].gen + ': ' + d2 + ' сут.'); parts.push(d2);
      L.push('Всего: ' + parts.join(' + ') + ' = ' + ans + ' сут.');
      return { kind: 'num', html: 'Сколько суток от ' + d1 + ' ' + MON[m1].gen + ' до ' + d2 + ' ' + MON[m2].gen + (need ? ' (' + y + ' год)' : '') + '?', answer: ans,
        hint: 'Сначала узнай, сколько суток остаётся до конца первого месяца, потом прибавь целые месяцы и сутки последнего месяца.',
        explain: (need ? leapWhy(y) + '<br>' : '') + plainSteps(L) };
    }
    if (kind === 'count') {
      var CT = [
        ['Сколько месяцев в году состоят из 31 дня?', 7, 'Месяцы с 31 днём: январь, март, май, июль, август, октябрь, декабрь — их семь.'],
        ['Сколько месяцев в году состоят из 30 дней?', 4, 'Месяцы с 30 днями: апрель, июнь, сентябрь, ноябрь — их четыре.'],
        ['Сколько месяцев в году состоят менее чем из 31 дня?', 5, 'Меньше 31 дня в апреле, июне, сентябре, ноябре и феврале — всего пять месяцев (4 + 1).']
      ];
      var c = o.ci != null ? CT[o.ci] : pick(CT);
      return { kind: 'num', html: c[0], answer: c[1], hint: 'Перечисли месяцы по порядку и отметь нужные (помогает «кулак»).', explain: c[2] };
    }
    if (kind === 'season') {
      var se = o.season != null ? SEAS[o.season] : pick(SEAS);
      if (se.n === 'зима') {
        var lp = Math.random() < 0.5, dd = 31 + 31 + (lp ? 29 : 28);
        return { kind: 'num', html: 'Сколько дней в декабре, январе и феврале ' + (lp ? 'високосного' : 'обычного') + ' года вместе?', answer: dd,
          hint: 'В високосном году в феврале 29 дней, в обычном — 28.',
          explain: '31 + 31 + ' + (dd - 62) + ' = ' + dd + ' (' + plur(dd, 'день', 'дня', 'дней') + ').' };
      }
      var dl = se.m.map(function (m) { return MON[m].d; }), sd = dl[0] + dl[1] + dl[2];
      return { kind: 'num', html: 'Сколько дней в трёх ' + se.adj + ' месяцах (' + joinNames(se.m.map(function (m) { return MON[m].loc; })) + ') вместе?', answer: sd,
        hint: 'Сложи число дней в каждом из трёх месяцев.', explain: dl.join(' + ') + ' = ' + sd + '.' };
    }
    /* which */
    if (Math.random() < 0.5) {
      i = rand(0, 11);
      var se2 = SEAS.filter(function (s) { return s.m.indexOf(i) >= 0; })[0], names = shuffle(SEAS.map(function (s) { return s.n; }));
      return { kind: 'choice', html: 'К какому времени года относится ' + MON[i].n + '?', options: names, answer: names.indexOf(se2.n), wide: false,
        hint: 'В каждом времени года по три месяца: зима начинается в декабре.',
        explain: 'Зима: декабрь, январь, февраль. Весна: март, апрель, май. Лето: июнь, июль, август. Осень: сентябрь, октябрь, ноябрь. ' + cap(MON[i].n) + ' — ' + se2.n + '.' };
    }
    var target = pick(SEAS), others = SEAS.filter(function (s) { return s !== target; }), right = MON[pick(target.m)].n, opts = [right];
    others.forEach(function (s) { opts.push(MON[pick(s.m)].n); });
    opts = shuffle(opts);
    var adjIn = { 'зима': 'зимним', 'весна': 'весенним', 'лето': 'летним', 'осень': 'осенним' };
    return { kind: 'choice', html: 'Какой из этих месяцев является ' + adjIn[target.n] + '?', options: opts, answer: opts.indexOf(right), wide: false,
      hint: 'Вспомни, какие три месяца входят в ' + target.n.replace('зима', 'зиму').replace('весна', 'весну').replace('осень', 'осень').replace('лето', 'лето') + '.',
      explain: cap(target.n) + ': ' + joinNames(target.m.map(function (m) { return MON[m].n; })) + '. Значит, верный ответ — ' + right + '.' };
  });

  reg('t1Leap', function (o) {
    o = o || {};
    var kind = o.kind || pick(['days', 'pick', 'next', 'years']), y, i;
    if (kind === 'days') {
      y = pickYear(Math.random() < 0.5);
      return { kind: 'num', html: 'Сколько суток в ' + y + ' году?', answer: isLeap(y) ? 366 : 365,
        hint: 'Високосный год — тот, номер которого делится на 4. В нём на одни сутки больше.',
        explain: leapWhy(y) + ' В таком году ' + (isLeap(y) ? '366' : '365') + ' суток.' };
    }
    if (kind === 'pick') {
      var wantLeap = Math.random() < 0.7, ys = [], right;
      right = pickYear(wantLeap);
      ys.push(right);
      while (ys.length < 4) { var z = pickYear(!wantLeap); if (ys.indexOf(z) < 0) ys.push(z); }
      ys = shuffle(ys);
      var lst = ys.map(function (v) { return String(v); });
      return { kind: 'choice', html: 'Какой из этих годов ' + (wantLeap ? 'високосный' : '<b>не</b> високосный') + '?', options: lst, answer: lst.indexOf(String(right)), wide: false,
        hint: 'Проверь каждый год: делится ли его номер на 4 без остатка.',
        explain: ys.map(function (v) { return v + ' : 4 ' + (v % 4 ? '— остаток ' + (v % 4) : '= ' + (v / 4) + ' — делится'); }).join('; ') + '. Ответ: ' + right + '.' };
    }
    if (kind === 'next') {
      y = rand(1993, 2093);
      var nx = y + (4 - y % 4);
      return { kind: 'num', html: 'Какой год будет ближайшим високосным после ' + y + ' года?', answer: nx,
        hint: 'Високосные годы повторяются через каждые 4 года. Найди число, следующее за ' + y + ' и делящееся на 4.',
        explain: y + ' : 4 = ' + Math.floor(y / 4) + ' (остаток ' + (y % 4) + '). ' + (y % 4 ? 'До ближайшего числа, кратного 4, не хватает ' + (4 - y % 4) + ': ' + y + ' + ' + (4 - y % 4) + ' = ' + nx + '.' : 'Этот год високосный, следующий будет через 4 года: ' + y + ' + 4 = ' + nx + '.') + ' Проверка: ' + nx + ' : 4 = ' + (nx / 4) + '.' };
    }
    var k = pick([2, 3, 4]), has = Math.random() < 0.5, KW = { 2: 'двух', 3: 'трёх', 4: 'четырёх' };
    var total = 365 * k + (has ? 1 : 0);
    return { kind: 'num', html: 'Сколько суток в ' + KW[k] + ' годах подряд' + (has ? ', среди которых один високосный' : ', ни один из которых не високосный') + '?', answer: total,
      hint: 'В обычном году 365 суток. Умножь на число лет' + (has ? ' и прибавь лишние сутки високосного года.' : '.'),
      explain: '365 × ' + k + ' = ' + fmt(365 * k) + (has ? '; в високосном году ещё одни сутки: ' + fmt(365 * k) + ' + 1 = ' + fmt(total) : '') + '. Ответ: ' + fmt(total) + ' сут.' };
  });

  /* ================= циферблат: чтение, выбор ================= */
  function readExpl(h, m, dual, after) {
    var nxt = h % 12 + 1, L = [], k;
    L.push(m === 0 ? 'Короткая (часовая) стрелка показывает точно на ' + h + ': это ' + h + ' ч.' :
      'Короткая (часовая) стрелка прошла цифру ' + h + ', но ещё не дошла до ' + nxt + ': это ' + h + ' ч.');
    if (m === 0) L.push('Длинная (минутная) стрелка показывает на 12: минут нет, ровно час.');
    else if (m % 5 === 0) L.push('Длинная (минутная) стрелка показывает на цифру ' + (m / 5) + ': ' + (m / 5) + ' × 5 = ' + m + ' мин.');
    else {
      k = Math.floor(m / 5);
      L.push('Длинная (минутная) стрелка ' + (k ? 'прошла цифру ' + k + ' (' + k + ' × 5 = ' + (k * 5) + ' мин) и ещё ' + (m % 5) + ' ' + plur(m % 5, 'деление', 'деления', 'делений') + ': ' + (k * 5) + ' + ' + (m % 5) + ' = ' + m + ' мин.' :
        'прошла цифру 12 и ещё ' + m + ' ' + plur(m, 'деление', 'деления', 'делений') + ': ' + m + ' мин.'));
    }
    if (dual) L.push(after ? 'После полудня берём красное число (24-часовой счёт): у цифры ' + h + ' стоит ' + (h + 12) + '.' : 'До полудня час читаем по чёрным цифрам: ' + h + ' ч.');
    return L;
  }
  reg('t1Clock', function (o) {
    o = o || {};
    var kind = o.kind || pick(['read', 'pick']), ms = o.mstep || 5, h, m;
    h = o.h24 ? rand(1, 11) : rand(1, 12); m = rand(0, Math.floor(59 / ms)) * ms;
    if (o.mfrom) m = rand(o.mfrom, 59);
    if (kind === 'read') {
      var lines = readExpl(h, m, false, false);
      return { kind: 'nums', html: 'Сколько времени показывают часы? Запиши часы и минуты.<br>' + R.t1ClockSVG(h, m, { size: 170, label: 'Циферблат со стрелками' }),
        fields: fieldsOf(CH.hm), answer: [h, m],
        hint: 'Короткая стрелка показывает часы, длинная — минуты (каждая цифра на циферблате — это 5 минут).',
        explain: plainSteps(lines) + '<br>Ответ: ' + bold(qt(CH.hm, [h, m])) + '.' };
    }
    if (kind === 'read24') {
      var after = o.after != null ? o.after : Math.random() < 0.6, hh = rand(1, 11), h24 = after ? hh + 12 : hh;
      var lines2 = readExpl(hh, m, true, after);
      return { kind: 'nums', html: 'Часы с двойным обозначением времени показывают время ' + (after ? 'после полудня (днём или вечером)' : 'до полудня') + '. Запиши это время по 24-часовому счёту.<br>' + R.t1ClockSVG(hh, m, { size: 190, dual: true, label: 'Циферблат с двойным обозначением времени' }),
        fields: fieldsOf(CH.hm), answer: [h24, m],
        hint: 'Чёрные числа на циферблате — с 1 до 12, красные внутри — с 13 до 24. Час найди по короткой стрелке.',
        explain: plainSteps(lines2) + '<br>Ответ: ' + bold(qt(CH.hm, [h24, m])) + '.' };
    }
    /* pick: выбрать часы с нужным временем */
    var dist = [], seen = {}, key = function (a, b) { return (a % 12) + ':' + b; };
    seen[key(h, m)] = 1;
    function add(a, b) { a = ((a - 1) % 12 + 12) % 12 + 1; if (b < 0 || b > 59) return; if (!seen[key(a, b)]) { seen[key(a, b)] = 1; dist.push([a, b]); } }
    if (m % 5 === 0 && m !== 0) add(m / 5, h * 5 % 60);
    add(h + 1, m); add(h - 1, m);
    if (m % 5 === 0) add(h, (60 - m) % 60); add(h, (m + 15) % 60); add(h, (m + 30) % 60);
    for (var g = 0; dist.length < 3 && g < 30; g++) add(rand(1, 12), rand(0, 11) * 5);
    dist = shuffle(dist).slice(0, 3);
    var all = shuffle([[h, m]].concat(dist)), idx = 0;
    all.forEach(function (t, i) { if (t[0] === h && t[1] === m) idx = i; });
    var opts = all.map(function (t) { return R.t1ClockSVG(t[0], t[1], { size: 104, mini: true, label: 'Циферблат' }); });
    var shown = o.h24 ? [h + 12, m] : [h, m];
    return { kind: 'choice', html: 'Какие часы показывают ' + bold(qt(CH.hm, shown)) + '?' + (o.h24 ? '<br><span class="soft">Время записано по 24-часовому счёту.</span>' : ''), options: opts, answer: idx, wide: false,
      hint: 'Найди часы, у которых короткая стрелка показывает нужный час, а длинная — нужные минуты.',
      explain: (o.h24 ? qt(CH.hm, shown) + ' — это ' + qt(CH.hm, [h, m]) + ' по циферблату (' + (h + 12) + ' − 12 = ' + h + '). ' : '') + 'Короткая стрелка должна стоять между ' + h + ' и ' + (h % 12 + 1) + (m === 0 ? ' (точно на ' + h + ')' : '') + ', длинная — ' + (m === 0 ? 'на 12' : m % 5 === 0 ? 'на цифре ' + (m / 5) : 'на ' + m + ' минутах') + '. Верный ответ — часы № ' + (idx + 1) + '.' };
  });

  /* ================= раздробление и превращение ================= */
  /* Раздробление: составное → число в мелкой мере. o: ch (ключ цепочки или список), form: 'simple' | 'comp' | 'zero', top, five, style */
  reg('t1Frag', function (o) {
    o = o || {};
    var C = chn(pick([].concat(o.ch || ['sh', 'hm', 'ms']))), n = C.u.length, form = o.form || 'comp';
    var mode = form === 'simple' ? 'simple' : form === 'zero' ? (n === 3 ? 'zmid' : 'simple') : 'full';
    var v = rv(C, { mode: mode, top: o.top, five: o.five });
    var T = tot(C, v), L = fragLines(C, v), uL = last(C), isSimple = v.slice(1).every(function (x) { return !x; });
    var style = o.style || pick(['expr', 'ask']);
    if (C.u[0] === 'г.') style = 'expr';
    var html = style === 'ask' ? 'Сколько ' + W[uL].gen + ' в ' + qt(C, v) + '?' : 'Выразите в ' + W[uL].loc + ': ' + expr(qt(C, v) + ' = □ ' + uL);
    var hint;
    if (n === 2 && isSimple) hint = fact(C, 0) + '. Крупную меру заменяем мелкой — значит, число надо умножить на ' + C.f[0] + '.';
    else if (n === 2) hint = fact(C, 0) + '. Сначала раздроби крупную меру (умножь на ' + C.f[0] + '), потом прибавь мелкую меру.';
    else if (isSimple) hint = 'Спускайся по ступенькам: ' + fact(C, 0) + ', ' + fact(C, 1) + '. Умножай по очереди.';
    else hint = fact(C, 0) + ', ' + fact(C, 1) + '. Раздроби старшую меру в среднюю, прибавь среднюю, потом то же в самую мелкую.' + (mode === 'zmid' ? ' Если какой-то меры в записи нет, считай, что её 0.' : '');
    return { kind: 'num', html: html, answer: T, hint: hint, explain: stepsL(L.lines, bold(nu(T, uL))),
      meta: { type: 'frag', ch: C.key, v: v, ans: T } };
  });

  /* Превращение: число в мелкой мере → составное. o: ch, form: 'full' | 'zlow' | 'zmid' | 'any', top, five */
  reg('t1Turn', function (o) {
    o = o || {};
    var C = chn(pick([].concat(o.ch || ['hm']))), n = C.u.length, form = o.form || pick(['full', 'full', 'full', 'zlow', 'zmid']);
    if (form === 'zmid' && n < 3) form = 'full';
    var v = rv(C, { mode: form === 'zlow' ? 'zlow' : form === 'zmid' ? 'zmid' : 'full', top: o.top, five: o.five });
    var T = tot(C, v), uL = last(C), lines = turnLines(C, T);
    var blanks = C.u.map(function (u) { return '□ ' + u; }).join(' ');
    var hint = n === 2 ? fact(C, 0) + '. Мелкую меру заменяем крупной — дели на ' + C.f[0] + '. Частное — крупные меры, остаток — мелкие.'
      : 'Дели по очереди: сначала на ' + C.f[1] + ', потом полученное число на ' + C.f[0] + '. Остатки — это мелкие меры.';
    return { kind: 'nums', html: 'Выразите в более крупных мерах: ' + expr(fmt(T) + ' ' + uL + ' = ' + blanks), fields: fieldsOf(C), answer: v,
      hint: hint, explain: stepsL(lines, ansC(C, T)), meta: { type: 'turn', ch: C.key, v: v, total: T } };
  });

  /* Через две и более ступеньки: «сколько секунд в часе», «выразите в сутках 14 400 мин» */
  var JUMPS = {
    'dm': { big: 'сут.', small: 'мин', fs: [24, 60] },
    'ds': { big: 'сут.', small: 'с', fs: [24, 60, 60] },
    'hs': { big: 'ч', small: 'с', fs: [60, 60] },
    'wh': { big: 'нед.', small: 'ч', fs: [7, 24] }
  };
  function prodOf(a) { return a.reduce(function (s, x) { return s * x; }, 1); }
  reg('t1Jump', function (o) {
    o = o || {};
    var key = pick(o.pairs || ['dm', 'hs', 'wh']), J = JUMPS[key], F = prodOf(J.fs), k = rand(o.kmin || 1, o.kmax || 9), dir = o.dir || pick(['down', 'up']);
    var stepsTxt = J.fs.map(function (f, i) { return null; });
    var chainU = J.big === 'сут.' ? (J.small === 'мин' ? ['сут.', 'ч', 'мин'] : ['сут.', 'ч', 'мин', 'с']) : J.big === 'ч' ? ['ч', 'мин', 'с'] : ['нед.', 'сут.', 'ч'];
    var facts = J.fs.map(function (f, i) { return '1' + NB + one(chainU[i]) + ' = ' + nu(f, chainU[i + 1]); });
    var prodTxt = J.fs.join(' × ') + ' = ' + fmt(F);
    var T = k * F;
    if (dir === 'down') {
      return { kind: 'num', html: 'Сколько ' + W[J.small].gen + ' в ' + nu(k, J.big) + '?', answer: T,
        hint: 'Иди по ступенькам: ' + facts.join(', ') + '. Сколько ' + W[J.small].gen + ' в одной крупной мере?',
        explain: plainSteps([facts.join('; ') + '.', 'В ' + W[J.big].one + ' ' + prodTxt + ' ' + W[J.small].gen + '.', nu(k, J.big) + ' = ' + k + ' × ' + fmt(F) + ' = ' + nu(T, J.small) + '.']) + '<br>Ответ: ' + bold(nu(T, J.small)) + '.',
        meta: { type: 'jump', dir: dir, k: k, F: F, big: J.big, small: J.small, ans: T } };
    }
    return { kind: 'num', html: 'Выразите в ' + W[J.big].loc + ': ' + expr(nu(T, J.small) + ' = □ ' + (J.big === 'г.' ? 'лет' : J.big)), answer: k,
      hint: 'Узнай, сколько ' + W[J.small].gen + ' в одной крупной мере (' + facts.join(', ') + '), и раздели.',
      explain: plainSteps([facts.join('; ') + '.', 'В ' + W[J.big].one + ' ' + prodTxt + ' ' + W[J.small].gen + '.', nu(T, J.small) + ' : ' + fmt(F) + ' = ' + nu(k, J.big) + '.']) + '<br>Ответ: ' + bold(nu(k, J.big)) + '.',
      meta: { type: 'jump', dir: dir, k: k, F: F, big: J.big, small: J.small, ans: k } };
  });

  /* Сколько полных крупных мер: «сколько полных часов в 200 мин?» */
  reg('t1Full', function (o) {
    o = o || {};
    var key = pick(o.pairs || ['hm', 'ms', 'sh', 'wd']), P = PAIRS[key], f = P.f, q = rand(o.qmin || 2, o.qmax || 20), r = rand(1, f - 1), T = q * f + r;
    if (key === 'ms' || key === 'hm') { r = lowv(f); T = q * f + r; }
    return { kind: 'num', html: 'Сколько полных ' + W[P.big].gen + ' в ' + nu(T, P.small) + '?', answer: q,
      hint: P.fact + '. Раздели число на ' + f + ': частное — это число полных ' + W[P.big].gen + ', а остаток в счёт не идёт.',
      explain: P.fact + '. ' + fmt(T) + ' : ' + f + ' = ' + q + ' (остаток ' + r + '). Значит, полных ' + W[P.big].gen + ' — ' + q + '. Остаток (' + nu(r, P.small) + ') меньше ' + nu(f, P.small) + ': полной меры из него не составить.',
      meta: { type: 'full', f: f, T: T, ans: q } };
  });

  /* Сравнение: составное число и число в мелкой мере */
  reg('t1Cmp', function (o) {
    o = o || {};
    var C = chn(pick([].concat(o.ch || ['hm', 'ms', 'sh']))), n = C.u.length, v = rv(C, { mode: 'full', top: o.top }), T = tot(C, v), uL = last(C), f = C.f[n - 2];
    var kind = o.kind || pick(['eq', 'near', 'near', 'trap']), other;
    if (kind === 'eq') other = T;
    else if (kind === 'near') other = T + pick([-1, 1]) * pick([5, 10, 15, 20, 30].filter(function (d) { return d < T; }));
    else { other = v[0] * 100 + v[n - 1]; if (other === T) other = v[0] * 10 + v[n - 1]; }
    if (other <= 0 || other === tot(C, v) && kind === 'trap') other = T + 10;
    var ops = ['<', '=', '>'], idx = T < other ? 0 : T === other ? 1 : 2;
    var reverse = Math.random() < 0.5, L = reverse ? nu(other, uL) : qt(C, v), Rr = reverse ? qt(C, v) : nu(other, uL);
    var ans = reverse ? 2 - idx : idx, sign = ops[ans];
    var tl = fragLines(C, v);
    return { kind: 'choice', html: 'Сравни: ' + expr(L + ' … ' + Rr), options: ops, answer: ans, wide: false,
      hint: 'Выразите обе величины в одной мере: составное число раздроби в ' + W[uL].loc + '.',
      explain: fact(C, n - 2) + '. ' + qt(C, v) + ' = ' + nu(T, uL) + ' (' + tl.lines.join(' ').replace(/\.$/, '') + '). Сравниваем ' + fmt(reverse ? other : T) + ' и ' + fmt(reverse ? T : other) + ': ' + fmt(reverse ? other : T) + ' ' + sign + ' ' + fmt(reverse ? T : other) + '.',
      meta: { type: 'cmp', ch: C.key, v: v, other: other, reverse: reverse, ans: ans } };
  });

  /* @@INSERT-B */
  /* ================= время суток и промежутки между моментами ================= */
  function partOf(h) { if (h === 0 || h === 24) return 'ночи'; return h >= 5 && h <= 11 ? 'утра' : h >= 12 && h <= 17 ? 'дня' : h >= 18 ? 'вечера' : 'ночи'; }
  function h12(h) { return h % 12 === 0 ? 12 : h % 12; }
  function hmTxt(h, m) { return m ? h + NB + 'ч ' + m + NB + 'мин' : h + NB + 'ч'; }
  function wordTime(h, m) { return hmTxt(h12(h), m) + ' ' + partOf(h); }
  function hmOf(T) { return [Math.floor(T / 60), T % 60]; }
  function tmTxt(T) { var a = hmOf(T); return hmTxt(a[0], a[1]); }
  R.t1HmTxt = hmTxt; R.t1WordTime = wordTime; R.t1PartOf = partOf;

  /* двойное обозначение времени. kind: 'to24' | 'from24' */
  reg('t1Dbl', function (o) {
    o = o || {};
    var kind = o.kind || pick(['to24', 'to24', 'from24']), h, m = pick([0, 0, 15, 30, 45, 10, 20, 40, 50]), pm = o.pm != null ? o.pm : Math.random() < 0.75;
    if (kind === 'to24') {
      if (pm) h = rand(13, 23); else h = rand(1, 12);
      var wt = wordTime(h, m), lines = [];
      if (h >= 13) lines.push('«' + wt + '» — это время после полудня. На сутки приходится 24 ч, а на циферблате только 12: к числу на циферблате прибавляем 12.', h12(h) + ' + 12 = ' + h + ' — это часы по 24-часовому счёту. Минуты остаются прежними.');
      else if (h === 12) lines.push('12 ч дня — это полдень. По 24-часовому счёту это тоже 12 ч.');
      else lines.push('«' + wt + '» — время до полудня. До полудня 24-часовой счёт совпадает с обычным: ' + h + ' ч.');
      return { kind: 'nums', html: 'Запиши по 24-часовому счёту: ' + expr(wt), fields: fieldsOf(CH.hm), answer: [h, m],
        hint: 'После полудня к числу часов на циферблате прибавляют 12 (1 ч дня — это 13 ч).',
        explain: plainSteps(lines) + '<br>Ответ: ' + bold(hmTxt(h, m)) + '.', meta: { type: 'dbl', kind: kind, h: h, m: m, ans: [h, m] } };
    }
    h = rand(13, 23);
    var right = wordTime(h, m), part = partOf(h), other = part === 'дня' ? 'вечера' : 'дня', hh = h12(h);
    var cands = [hmTxt(hh, m) + ' утра', hmTxt(hh, m) + ' ' + other, hmTxt(((hh + 1) % 12) + 1, m) + ' ' + part, hmTxt(h - 10 > 0 && h - 10 !== hh ? h - 10 : hh + 2, m) + ' ' + part];
    var opts = [right];
    cands.forEach(function (c) { if (opts.indexOf(c) < 0 && opts.length < 4) opts.push(c); });
    var gd = 0; while (opts.length < 4 && gd++ < 50) { var c2 = hmTxt(rand(1, 11), m) + ' ' + pick(['дня', 'вечера', 'утра']); if (opts.indexOf(c2) < 0) opts.push(c2); }
    opts = shuffle(opts);
    return { kind: 'choice', html: 'Часы с двойным обозначением показывают ' + bold(hmTxt(h, m)) + ' по 24-часовому счёту. Как назвать это время обычными словами?', options: opts, answer: opts.indexOf(right), wide: false,
      hint: 'Из числа по 24-часовому счёту вычти 12 — получится число на обычном циферблате. Время ' + (h < 18 ? 'до 18 ч' : 'с 18 ч') + ' — это ' + (h < 18 ? 'день' : 'вечер') + '.',
      explain: h + ' − 12 = ' + hh + '. Время ' + (part === 'дня' ? 'с 12 ч до 18 ч' : 'с 18 ч до 24 ч') + ' называют ' + (part === 'дня' ? 'днём' : 'вечером') + '. Значит, ' + hmTxt(h, m) + ' — это ' + bold(right) + '.',
      meta: { type: 'dbl', kind: kind, h: h, m: m, right: right } };
  });

  /* сколько времени между двумя моментами: o.mode: 'easy' (слова: утра/дня/вечера) | 'sub' (24-часовой счёт); borrow: true/false */
  function pickSD(o) {
    var S, D, E, g = 0, easy = o.mode === 'easy';
    while (g++ < 300) {
      if (easy) {
        var am = Math.random() < 0.5;
        S = (am ? rand(6, 9) : rand(13, 17)) * 60 + pick([0, 0, 30]);
        D = rand(1, 5) * 60 + pick([0, 30, 30]);
        if (rand(0, 3) === 0) D = pick([30, 60, 90]);
        E = S + D;
        if (am && E > 11 * 60 + 30) continue;
        if (!am && E > 22 * 60) continue;
        return { S: S, D: D, E: E };
      }
      S = rand(o.s1 || 5, o.s2 || 19) * 60 + rnd5(0, 55);
      D = rand(0, 8) * 60 + rnd5(5, 55);
      E = S + D;
      if (E >= 24 * 60 - 5) continue;
      var bor = E % 60 < S % 60;
      if (o.borrow === true && !bor) continue;
      if (o.borrow === false && bor) continue;
      return { S: S, D: D, E: E };
    }
    return { S: 9 * 60 + 35, D: 4 * 60 + 35, E: 14 * 60 + 10 };
  }
  function shiftFig(S, E, o) {
    var D = E - S, a = hmOf(D);
    return R.t1ShiftSVG(S, E, qt(CH.hm, a), o);
  }
  reg('t1Dur', function (o) {
    o = o || {};
    var P = pickSD(o), S = P.S, E = P.E, D = P.D, sa = hmOf(S), ea = hmOf(E), da = hmOf(D), easy = o.mode === 'easy';
    var sT = easy ? wordTime(sa[0], sa[1]) : hmTxt(sa[0], sa[1]), eT = easy ? wordTime(ea[0], ea[1]) : hmTxt(ea[0], ea[1]);
    var A = easy ? [h12(ea[0]), ea[1]] : ea, B = easy ? [h12(sa[0]), sa[1]] : sa, cal = subCalc(CH.hm, A, B);
    var lines = cal.lines.slice();
    var html = easy ? 'Сколько времени пройдёт от ' + sT + ' до ' + eT + '?' : 'Сколько времени прошло от ' + sT + ' до ' + eT + '?';
    var ex = (easy ? 'Считаем часы по циферблату: ' + qt(CH.hm, A) + ' − ' + qt(CH.hm, B) + '.<br>' : 'Из позднего времени вычитаем раннее: ' + qt(CH.hm, A) + ' − ' + qt(CH.hm, B) + '.<br>') +
      plainSteps(lines) + '<br>Проверка: ' + qt(CH.hm, B) + ' + ' + qt(CH.hm, da) + ' = ' + qt(CH.hm, A) + '.<br>Ответ: ' + bold(qt(CH.hm, da)) + '.';
    if (!easy && o.fig !== false) ex += shiftFig(S, E);
    return { kind: 'nums', html: html, fields: fieldsOf(CH.hm), answer: da,
      hint: easy ? 'Сначала дойди до круглого часа, потом отсчитай целые часы и остаток минут. Или вычти по мерам.' : 'Вычти из более позднего времени более раннее по мерам: сначала минуты, потом часы. Если минут не хватает, займи час.',
      explain: ex, meta: { type: 'dur', S: S, E: E, ans: da, easy: easy } };
  });

  /* начало + длительность = конец; конец − длительность = начало. o.dir: 'end' | 'start' */
  reg('t1Shift', function (o) {
    o = o || {};
    var dir = o.dir || pick(['end', 'start']), P = pickSD({ borrow: o.borrow, s1: dir === 'start' ? 7 : 5, s2: 19 }), S = P.S, E = P.E, D = P.D, sa = hmOf(S), ea = hmOf(E), da = hmOf(D);
    var who = pick(['Часы', 'Часы на вокзале', 'Часы в классе']);
    if (dir === 'end') {
      var cal = addCalc(CH.hm, [sa, da]);
      return { kind: 'nums', html: who + ' показывают ' + bold(hmTxt(sa[0], sa[1])) + '. Что они будут показывать через ' + bold(qt(CH.hm, da)) + '? Запиши по 24-часовому счёту.', fields: fieldsOf(CH.hm), answer: ea,
        hint: 'К показанию часов прибавь промежуток времени: складывай по мерам, минуты к минутам, часы к часам.',
        explain: 'Складываем: ' + qt(CH.hm, sa) + ' + ' + qt(CH.hm, da) + '.<br>' + plainSteps(cal.lines) + '<br>Ответ: ' + bold(hmTxt(ea[0], ea[1])) + '.' + shiftFig(S, E),
        meta: { type: 'shift', dir: dir, S: S, D: D, E: E, ans: ea } };
    }
    var cal2 = subCalc(CH.hm, ea, da);
    return { kind: 'nums', html: who + ' показывают ' + bold(hmTxt(ea[0], ea[1])) + '. Что они показывали ' + bold(qt(CH.hm, da)) + ' назад? Запиши по 24-часовому счёту.', fields: fieldsOf(CH.hm), answer: sa,
      hint: 'От показания часов отними промежуток времени: вычитай по мерам. Если минут не хватает, займи час.',
      explain: 'Вычитаем: ' + qt(CH.hm, ea) + ' − ' + qt(CH.hm, da) + '.<br>' + plainSteps(cal2.lines) + '<br>Ответ: ' + bold(hmTxt(sa[0], sa[1])) + '.' + shiftFig(S, E),
      meta: { type: 'shift', dir: dir, S: S, D: D, E: E, ans: sa } };
  });

  /* ================= сложение и вычитание ================= */
  function carriesOf(c) { return c.marks.filter(function (m) { return m; }).length; }
  function genAdd(C, o) {
    var cnt = o.terms || 2, n = C.u.length, g = 0, terms, k, cal, T;
    while (g++ < 600) {
      terms = [];
      for (k = 0; k < cnt; k++) {
        var v = rv(C, { top: o.tops ? o.tops[k] : o.top, five: o.five });
        if (o.single) { for (var z = 0; z < n - 1; z++) v[z] = 0; v[n - 1] = lowv(C.f[n - 2], o.five); }
        terms.push(v);
      }
      if (o.gap && !o.single) {
        var gi = rand(0, cnt - 1);
        if (n === 3 && Math.random() < 0.4) terms[gi][1] = 0; else { for (k = 1; k < n; k++) terms[gi][k] = 0; }
      }
      cal = addCalc(C, terms);
      var tt = terms.map(function (x) { return tot(C, x); });
      if (tt.some(function (x, i) { return x === 0 || tt.indexOf(x) !== i; })) continue;
      var cr = carriesOf(cal), cc = o.carry || 'any', ok = true;
      if (cc === 'none') ok = cr === 0;
      else if (cc === 'some') ok = cr >= 1;
      else if (cc === 'one') ok = cr === 1;
      else if (cc === 'all') ok = cr === n - 1;
      else if (cc === 'zero') ok = cr >= 1 && cal.res.some(function (r, i) { return i > 0 && r === 0; });
      if (!ok) continue;
      T = terms.reduce(function (s, x) { return s + tot(C, x); }, 0);
      if (o.single && T < C.f[n - 2]) continue;
      if (o.maxTop && cal.res[0] > o.maxTop) continue;
      return { terms: terms, cal: cal, T: T };
    }
    terms = [[2, 40, 0].slice(0, n), [1, 35, 0].slice(0, n)]; cal = addCalc(C, terms);
    return { terms: terms, cal: cal, T: terms.reduce(function (s, x) { return s + tot(C, x); }, 0) };
  }
  reg('t1Add', function (o) {
    o = o || {};
    var C = chn(pick([].concat(o.ch || ['hm']))), r = genAdd(C, o), terms = r.terms, cal = r.cal, n = C.u.length;
    var txt = terms.map(function (t) { return qt(C, t); });
    var ask = o.ask || 'plain', html;
    if (ask === 'words' || (ask === 'rand' && Math.random() < 0.4)) {
      html = terms.length === 2 ? pick(['Найди сумму чисел ' + bold(txt[0]) + ' и ' + bold(txt[1]) + '.', 'Увеличь ' + bold(txt[0]) + ' на ' + bold(txt[1]) + '.', 'Сложи ' + bold(txt[0]) + ' и ' + bold(txt[1]) + '.'])
        : 'Найди сумму: ' + txt.map(bold).join(', ') + '.';
    } else html = (o.single ? 'Найди сумму и запиши в двух мерах: ' : 'Вычисли: ') + expr(txt.join(' + ') + ' =');
    var expl;
    if (o.single) {
      var parts = terms.map(function (t) { return t[n - 1]; });
      expl = plainSteps([parts.join(' + ') + ' = ' + nu(r.T, last(C)) + '.', fact(C, n - 2) + ', поэтому ' + fmt(r.T) + ' : ' + C.f[n - 2] + ' = ' + Math.floor(r.T / C.f[n - 2]) + ' (остаток ' + (r.T % C.f[n - 2]) + ').']) + '<br>Ответ: ' + ansC(C, r.T) + '.';
    } else expl = R.t1ColHTML('+', C, terms, { check: o.check });
    var hint = o.single ? 'Сложи числа, а потом преврати сумму в крупные меры: раздели на ' + C.f[n - 2] + ' (' + fact(C, n - 2) + ').'
      : 'Складывай по мерам, начиная с самой мелкой. Если мелких мер набралось ' + C.f[n - 2] + ' или больше, превращай их в крупную меру (' + fact(C, n - 2) + ') и запоминай.';
    return { kind: 'nums', html: html, fields: fieldsOf(C), answer: cal.res, hint: hint, explain: expl,
      meta: { type: 'add', ch: C.key, terms: terms, ans: cal.res, single: !!o.single } };
  });

  /* вычитание */
  function subFeat(C, A, B) {
    var n = C.u.length, x = A.slice(), bor = 0, zero = false, i, j, k;
    for (i = n - 1; i >= 0; i--) {
      if (x[i] < B[i]) {
        bor++; j = i - 1; while (j > 0 && x[j] === 0) j--;
        if (j < i - 1) zero = true;
        x[j]--; for (k = j + 1; k <= i; k++) { x[k] += C.f[k - 1]; if (k < i) x[k]--; }
      }
    }
    return { borrows: bor, zero: zero };
  }
  function genSub(C, o) {
    var n = C.u.length, g = 0, A, B, mode = o.mode || 'any', k;
    while (g++ < 800) {
      A = rv(C, { top: o.top, five: o.five }); B = rv(C, { top: o.top, five: o.five });
      if (mode === 'gapA') { for (k = 1; k < n; k++) A[k] = 0; if (n === 3 && Math.random() < 0.4) A[1] = rand(1, 59); }
      if (mode === 'zero') { A[1] = 0; if (n === 3 && Math.random() < 0.5) B[1] = 0; }
      if (o.gapB) { for (k = 1; k < n; k++) B[k] = 0; }
      var ta = tot(C, A), tb = tot(C, B);
      if (ta <= tb) { var t = A; A = B; B = t; ta = tot(C, A); tb = tot(C, B); if (mode === 'gapA' || mode === 'zero') continue; }
      if (ta === tb) continue;
      var f = subFeat(C, A, B), ok = true;
      if (mode === 'plain') ok = f.borrows === 0;
      else if (mode === 'borrow') ok = f.borrows >= 1;
      else if (mode === 'two') ok = f.borrows >= 2;
      else if (mode === 'gapA') ok = f.borrows >= 1;
      else if (mode === 'zero') ok = n === 3 && f.zero;
      if (!ok) continue;
      if (o.maxTop && A[0] > o.maxTop) continue;
      return { A: A, B: B, cal: subCalc(C, A, B), T: ta - tb };
    }
    A = [5, 26, 0].slice(0, n); B = [3, 44, 0].slice(0, n);
    return { A: A, B: B, cal: subCalc(C, A, B), T: tot(C, A) - tot(C, B) };
  }
  reg('t1Sub', function (o) {
    o = o || {};
    var C = chn(pick([].concat(o.ch || ['hm']))), r = genSub(C, o), A = r.A, B = r.B, n = C.u.length;
    var a = qt(C, A), b = qt(C, B), ask = o.ask || 'plain', html;
    if (ask === 'words' || (ask === 'rand' && Math.random() < 0.5)) {
      html = pick([
        'Найди разность чисел ' + bold(a) + ' и ' + bold(b) + '.',
        'Уменьши ' + bold(a) + ' на ' + bold(b) + '.',
        'Вычти ' + bold(b) + ' из ' + bold(a) + '.',
        'На сколько ' + bold(a) + ' больше, чем ' + bold(b) + '?',
        'На сколько ' + bold(b) + ' меньше, чем ' + bold(a) + '?'
      ]);
    } else html = 'Вычисли: ' + expr(a + ' − ' + b + ' =');
    var hint = 'Вычитай по мерам, начиная с самой мелкой. Если вычесть нельзя, займи одну крупную меру (' + fact(C, n - 2) + ') и раздроби её в мелкие.';
    return { kind: 'nums', html: html, fields: fieldsOf(C), answer: r.cal.res, hint: hint, explain: R.t1ColHTML('−', C, [A, B], { check: o.check }),
      meta: { type: 'sub', ch: C.key, A: A, B: B, ans: r.cal.res } };
  });

  /* неизвестные компоненты. kind: 'term' | 'minuend' | 'subtr' */
  reg('t1Unk', function (o) {
    o = o || {};
    var C = chn(pick([].concat(o.ch || ['hm']))), kind = o.kind || pick(['term', 'minuend', 'subtr']), form = o.form || pick(['eq', 'words']), n = C.u.length;
    var X, B, S, g = 0, calc, html, expl, hint, ans, ra, rb;
    if (kind === 'term') {
      var a = genAdd(C, { carry: pick(['some', 'any']), maxTop: o.maxTop || 40, top: o.top });
      X = a.terms[0]; B = a.terms[1]; S = spl(C, a.T); ans = X;
      var sub = subCalc(C, S, B);
      html = form === 'eq' ? 'Найди неизвестное слагаемое: ' + expr('□ + ' + qt(C, B) + ' = ' + qt(C, S))
        : 'Одно из двух слагаемых равно ' + bold(qt(C, B)) + ', а сумма равна ' + bold(qt(C, S)) + '. Найди другое слагаемое.';
      hint = 'Неизвестное слагаемое = сумма − известное слагаемое.';
      expl = 'Чтобы найти слагаемое, из суммы вычитаем известное слагаемое: ' + qt(C, S) + ' − ' + qt(C, B) + '.<br>' + R.t1ColHTML('−', C, [S, B]) + '<br>Проверка: ' + qt(C, X) + ' + ' + qt(C, B) + ' = ' + qt(C, S) + '.';
    } else if (kind === 'minuend') {
      var s = genSub(C, { mode: pick(['borrow', 'any']), maxTop: o.maxTop || 40, top: o.top });
      B = s.B; var Dm = s.cal.res; X = s.A; ans = X;
      html = form === 'eq' ? 'Найди неизвестное уменьшаемое: ' + expr('□ − ' + qt(C, B) + ' = ' + qt(C, Dm))
        : 'Вычитаемое равно ' + bold(qt(C, B)) + ', разность равна ' + bold(qt(C, Dm)) + '. Найди уменьшаемое.';
      hint = 'Уменьшаемое = вычитаемое + разность.';
      expl = 'Чтобы найти уменьшаемое, к вычитаемому прибавляем разность: ' + qt(C, B) + ' + ' + qt(C, Dm) + '.<br>' + R.t1ColHTML('+', C, [B, Dm]) + '<br>Проверка: ' + qt(C, X) + ' − ' + qt(C, B) + ' = ' + qt(C, Dm) + '.';
    } else {
      var s2 = genSub(C, { mode: pick(['borrow', 'any']), maxTop: o.maxTop || 40, top: o.top });
      var Am = s2.A; X = s2.B; var Dd = s2.cal.res; ans = X;
      html = form === 'eq' ? 'Найди неизвестное вычитаемое: ' + expr(qt(C, Am) + ' − □ = ' + qt(C, Dd))
        : 'Уменьшаемое равно ' + bold(qt(C, Am)) + ', разность равна ' + bold(qt(C, Dd)) + '. Найди вычитаемое.';
      hint = 'Вычитаемое = уменьшаемое − разность.';
      expl = 'Чтобы найти вычитаемое, из уменьшаемого вычитаем разность: ' + qt(C, Am) + ' − ' + qt(C, Dd) + '.<br>' + R.t1ColHTML('−', C, [Am, Dd]) + '<br>Проверка: ' + qt(C, Am) + ' − ' + qt(C, X) + ' = ' + qt(C, Dd) + '.';
      B = Am; S = Dd;
    }
    return { kind: 'nums', html: html, fields: fieldsOf(C), answer: ans, hint: hint, explain: expl,
      meta: { type: 'unk', unk: kind, ch: C.key, X: X, B: B, S: S, ans: ans } };
  });

  /* запись без «лишних» мер: 5 ч 95 мин = 6 ч 35 мин */
  reg('t1Norm', function (o) {
    o = o || {};
    var C = chn(pick([].concat(o.ch || ['hm']))), n = C.u.length, v = rv(C, { top: o.top, five: o.five }), i;
    var bad = v.slice(), li = n - 1, f = C.f[li - 1];
    bad[li] = rand(f, f + Math.min(f, 59) + 20);
    if (bad[li] % f === 0) bad[li] += lowv(f, false);
    if (n === 3 && Math.random() < 0.3) { bad[1] = 0; }
    var Tt = tot(C, bad), good = spl(C, Tt), carry = Math.floor(bad[li] / f), rest = bad[li] % f;
    var lines = [bad[li] + ' ' + (li === n - 1 ? C.u[li] : C.u[li]) + ': ' + bad[li] + ' : ' + f + ' = ' + carry + ' (остаток ' + rest + '), то есть ' + nu(bad[li], C.u[li]) + ' = ' + nu(carry, C.u[li - 1]) + ' ' + nu(rest, C.u[li]) + '.',
      'Прибавляем ' + nu(carry, C.u[li - 1]) + ' к ' + nu(bad[li - 1], C.u[li - 1]) + ': ' + bad[li - 1] + ' + ' + carry + ' = ' + (bad[li - 1] + carry) + '.'];
    var cur = bad.slice(); cur[li - 1] += carry; cur[li] = rest;
    if (li - 1 >= 1 && cur[li - 1] >= C.f[li - 2]) {
      var c2 = Math.floor(cur[li - 1] / C.f[li - 2]), r2 = cur[li - 1] % C.f[li - 2];
      lines.push(nu(cur[li - 1], C.u[li - 1]) + ' — это тоже больше ' + nu(C.f[li - 2] - 1, C.u[li - 1]) + ': ' + cur[li - 1] + ' : ' + C.f[li - 2] + ' = ' + c2 + ' (остаток ' + r2 + ').');
    }
    return { kind: 'nums', html: 'Запиши правильно, чтобы в каждой мелкой мере было меньше ' + C.f[n - 2] + ': ' + expr(bad.map(function (x, k) { return nu(x, C.u[k]); }).join(' ') + ' = ' + C.u.map(function (u) { return '□ ' + u; }).join(' ')),
      fields: fieldsOf(C), answer: good,
      hint: 'Мелких мер не может быть ' + C.f[n - 2] + ' и больше: ' + fact(C, n - 2) + '. Лишнее превращай в крупную меру и прибавляй к ней.',
      explain: plainSteps(lines.filter(function (l, k) { return k < 2 || true; })) + '<br>Ответ: ' + ansC(C, Tt) + '.',
      meta: { type: 'norm', ch: C.key, bad: bad, ans: good } };
  });

  /* выбор верного результата (типичные ошибки). o.op: '+' | '−' */
  reg('t1Pick', function (o) {
    o = o || {};
    var C = chn(pick([].concat(o.ch || ['hm']))), op = o.op || pick(['+', '−']), n = C.u.length, li = n - 1, f = C.f[li - 1];
    var A, B, res, wrong = [], right, src;
    function show(v) { return v.map(function (x, k) { return nu(x, C.u[k]); }).join(' '); }
    function showQ(v) { return qt(C, v); }
    function showAny(v) { return v.map(function (x, k) { return x === 0 && k > 0 && k < v.length - 1 ? null : nu(x, C.u[k]); }).filter(Boolean).join(' '); }
    if (op === '+') {
      var r = genAdd(C, { carry: 'some', terms: 2, maxTop: 40 }); A = r.terms[0]; B = r.terms[1]; res = r.cal.res;
      var lowSum = A[li] + B[li], hi = res.slice();
      // 1) не превратил: мелкая мера больше f
      var e1 = res.slice(); e1[li - 1] = res[li - 1] - 1; e1[li] = lowSum;
      // 2) забыл прибавить перенос
      var e2 = res.slice(); e2[li - 1] = res[li - 1] - 1;
      // 3) перенос прибавил дважды
      var e3 = res.slice(); e3[li - 1] = res[li - 1] + 1;
      // 4) ошибка в мелкой мере на 10
      var e4 = res.slice(); e4[li] = res[li] + (res[li] + 10 < f ? 10 : -10);
      [e1, e2, e3, e4].forEach(function (e) { if (e.every(function (x) { return x >= 0; })) wrong.push(e); });
      src = [A, B];
    } else {
      var s = genSub(C, { mode: 'borrow', maxTop: 40 }); A = s.A; B = s.B; res = s.cal.res;
      var big = A[li] < B[li] ? A[li] - B[li] + f : null;
      // 1) вычел меньшую из большей без занимания
      var e1s = res.slice(); e1s[li] = Math.abs(A[li] - B[li]);
      // 2) занял, но старшую меру не уменьшил
      var e2s = res.slice(); e2s[li - 1] = res[li - 1] + 1;
      // 3) при занимании раздробил по 100 (или 10)
      var wb = f === 60 ? 100 : f === 24 ? 12 : f === 7 ? 10 : 10;
      var e3s = res.slice(); e3s[li] = A[li] + wb - B[li];
      // 4) ошибка в мелкой мере на 10
      var e4s = res.slice(); e4s[li] = res[li] + (res[li] + 10 < f ? 10 : -10);
      [e1s, e2s, e3s, e4s].forEach(function (e) { if (e.every(function (x) { return x >= 0; }) && e.some(function (x, k) { return x !== res[k]; })) wrong.push(e); });
      src = [A, B];
    }
    var seen = {}; seen[show(res)] = 1; var optsV = [res];
    wrong.forEach(function (e) { var k = show(e); if (!seen[k] && optsV.length < 4) { seen[k] = 1; optsV.push(e); } });
    var gd = 0;
    while (optsV.length < 4 && gd++ < 40) { var e5 = res.slice(); e5[li] = Math.max(0, res[li] + pick([-5, 5, -10, 10, 15, -15])); if (e5[li] >= f) continue; var k5 = show(e5); if (!seen[k5]) { seen[k5] = 1; optsV.push(e5); } }
    var correctStr = show(res);
    var optsS = shuffle(optsV.map(showAny));
    var rightS = showAny(res);
    var html = 'Выбери верный результат: ' + expr(src.map(showQ).join(' ' + op + ' ') + ' =');
    var expl = (op === '+' ? R.t1ColHTML('+', C, src) : R.t1ColHTML('−', C, src)) + '<br>Верный ответ: ' + bold(qt(C, res)) + '.';
    return { kind: 'choice', html: html, options: optsS, answer: optsS.indexOf(rightS), wide: false,
      hint: 'Проверь два места: сколько мелких мер получилось (их должно быть меньше ' + f + ') и не потерялась ли одна крупная мера при переносе или занимании.',
      explain: expl, meta: { type: 'pick', op: op, ch: C.key, src: src, res: res } };
  });

  /* удобный порядок слагаемых: две мелкие меры дают ровно крупную */
  reg('t1Comm', function (o) {
    o = o || {};
    var C = chn(pick([].concat(o.ch || ['hm', 'ms']))), f = C.f[0], u0 = C.u[0], u1 = C.u[1], a = lowv(f, true), g = 0;
    var h1 = rand(1, 6), h2 = rand(1, 6), b = lowv(f, true);
    while ((b === a || b === f - a) && g++ < 20) b = lowv(f, true);
    var t1 = [h1, a], t2 = [h2, b], t3 = [Math.random() < 0.5 ? 0 : rand(1, 3), f - a];
    var order = [t1, t2, t3], T = order.reduce(function (s, x) { return s + tot(C, x); }, 0), res = spl(C, T), ht = h1 + h2 + t3[0];
    var hs = [h1, h2, t3[0]].filter(function (x) { return x; });
    var expl = plainSteps([
      'Заметим: ' + nu(a, u1) + ' и ' + nu(f - a, u1) + ' вместе дают ровно ' + nu(f, u1) + ' = 1' + NB + u0 + '. Поставим эти слагаемые рядом.',
      W[u0].name + ': ' + hs.join(' + ') + ' + 1 (из ' + a + ' + ' + (f - a) + ') = ' + nu(ht + 1, u0) + '.',
      W[u1].name + ' остаются: ' + nu(b, u1) + '.'
    ]) + '<br>Ответ: ' + ansC(C, T) + '.';
    return { kind: 'nums', html: 'Вычисли удобным способом: ' + expr(order.map(function (t) { return qt(C, t); }).join(' + ') + ' ='), fields: fieldsOf(C), answer: res,
      hint: 'Найди две мелкие меры, которые вместе дают ровно ' + nu(f, u1) + ', и сложи их первыми.',
      explain: expl, meta: { type: 'comm', ch: C.key, terms: order, ans: res } };
  });

  /* ================= месяцы, дни недели, века ================= */
  reg('t1Mon', function (o) {
    o = o || {};
    var kind = o.kind || pick(['ord', 'next', 'prev', 'cnt', 'left']), i = rand(0, 11), names = MON.map(function (m) { return m.n; });
    function opts4(right) {
      var o4 = [right], g = 0; while (o4.length < 4 && g++ < 60) { var c = pick(names); if (o4.indexOf(c) < 0) o4.push(c); }
      return shuffle(o4);
    }
    var loc = function (k) { return MON[k].loc; };
    if (kind === 'ord') {
      return { kind: 'num', html: 'Каким по счёту месяцем года является ' + MON[i].n + '?', answer: i + 1,
        hint: 'Перечисли месяцы по порядку, начиная с января.',
        explain: 'Месяцы по порядку: ' + names.slice(0, i + 1).join(', ') + '. Значит, ' + MON[i].n + ' — ' + (i + 1) + '-й месяц.', meta: { type: 'mon', ans: i + 1 } };
    }
    if (kind === 'next' || kind === 'prev') {
      var j = kind === 'next' ? (i + 1) % 12 : (i + 11) % 12, op = opts4(names[j]);
      return { kind: 'choice', html: 'Какой месяц идёт сразу ' + (kind === 'next' ? 'после' : 'перед') + ' месяцем «' + MON[i].n + '»?', options: op, answer: op.indexOf(names[j]), wide: false,
        hint: 'Вспомни порядок месяцев в году: после декабря снова идёт январь.',
        explain: 'Порядок месяцев: январь, февраль, март, апрель, май, июнь, июль, август, сентябрь, октябрь, ноябрь, декабрь. ' + (kind === 'next' ? 'После месяца «' : 'Перед месяцем «') + MON[i].n + '» идёт ' + names[j] + '.', meta: { type: 'mon' } };
    }
    if (kind === 'cnt') {
      var a = rand(0, 7), b = a + rand(2, 11 - a);
      return { kind: 'num', html: 'Сколько месяцев пройдёт от 1 ' + MON[a].gen + ' до 1 ' + MON[b].gen + '?', answer: b - a,
        hint: 'Считай месяцы по порядку: с 1 ' + MON[a].gen + ' до 1 следующего месяца проходит один месяц.',
        explain: 'От 1 ' + MON[a].gen + ' до 1 ' + MON[a + 1].gen + ' — 1 месяц, и так далее. Номера месяцев: ' + (a + 1) + ' и ' + (b + 1) + ', разность ' + (b + 1) + ' − ' + (a + 1) + ' = ' + (b - a) + '.', meta: { type: 'mon', ans: b - a } };
    }
    var k = rand(0, 9);
    return { kind: 'num', html: 'Сколько целых месяцев остаётся в году после ' + MON[k].gen + '?', answer: 11 - k,
      hint: 'В году 12 месяцев. Сколько из них уже прошло к концу ' + MON[k].gen + '?',
      explain: MON[k].n.charAt(0).toUpperCase() + MON[k].n.slice(1) + ' — ' + (k + 1) + '-й месяц. 12 − ' + (k + 1) + ' = ' + (11 - k) + ' мес.', meta: { type: 'mon', ans: 11 - k } };
  });

  var DOW = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
  var DOWG = ['понедельника', 'вторника', 'среды', 'четверга', 'пятницы', 'субботы', 'воскресенья'];
  reg('t1Week', function (o) {
    o = o || {};
    var d = rand(0, 6), k = o.k || pick([8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 22, 23, 25, 30, 14, 21]), back = o.back != null ? o.back : Math.random() < 0.3;
    var q = Math.floor(k / 7), r = k % 7, res = back ? ((d - r) % 7 + 7) % 7 : (d + r) % 7;
    var opts = [DOW[res]], g = 0; while (opts.length < 4 && g++ < 50) { var c = DOW[rand(0, 6)]; if (opts.indexOf(c) < 0) opts.push(c); }
    opts = shuffle(opts);
    var dw = k + ' ' + plur(k, 'день', 'дня', 'дней');
    var expl = dw + ' = ' + q + ' ' + plur(q, 'неделя', 'недели', 'недель') + (r ? ' и ' + r + ' ' + plur(r, 'день', 'дня', 'дней') : '') + ' (' + k + ' : 7 = ' + q + ', остаток ' + r + '). Целые недели день недели не меняют. ' +
      (r ? 'Отсчитываем ' + r + ' ' + plur(r, 'день', 'дня', 'дней') + (back ? ' назад' : ' вперёд') + ' от ' + DOWG[d] + ': получится ' + DOW[res] + '.' : 'Значит, день недели тот же: ' + DOW[res] + '.');
    return { kind: 'choice', html: 'Сегодня ' + DOW[d] + '. Какой день недели ' + (back ? 'был ' + dw + ' назад?' : 'будет через ' + dw + '?'), options: opts, answer: opts.indexOf(DOW[res]), wide: false,
      hint: 'В неделе 7 дней. Раздели число дней на 7: целые недели день недели не меняют, считать надо только остаток.', explain: expl,
      meta: { type: 'week', d: d, k: k, back: back, res: res } };
  });

  var CENT_EV = [
    ['Куликовская битва', 1380, 'Куликовская битва произошла в 1380 году'],
    ['основание Санкт-Петербурга', 1703, 'Санкт-Петербург основан в 1703 году'],
    ['Бородинское сражение', 1812, 'Бородинское сражение состоялось в 1812 году'],
    ['первый полёт человека в космос', 1961, 'Юрий Гагарин совершил первый в мире полёт в космос в 1961 году'],
    ['запуск первого искусственного спутника Земли', 1957, 'Первый искусственный спутник Земли запущен в 1957 году'],
    ['основание Московского университета', 1755, 'Московский университет основан в 1755 году'],
    ['открытие Америки Колумбом', 1492, 'Христофор Колумб достиг берегов Америки в 1492 году'],
    ['Крещение Руси', 988, 'Крещение Руси произошло в 988 году'],
    ['первое упоминание Москвы в летописи', 1147, 'Москва впервые упомянута в летописи в 1147 году'],
    ['открытие первой железной дороги в России', 1837, 'Первая в России железная дорога (Царское Село — Павловск) открыта в 1837 году'],
    ['основание Томска', 1604, 'Томск основан в 1604 году'],
    ['Олимпийские игры в Москве', 1980, 'Летние Олимпийские игры в Москве прошли в 1980 году'],
    ['зимние Олимпийские игры в Сочи', 2014, 'Зимние Олимпийские игры в Сочи прошли в 2014 году'],
    ['открытие первой линии московского метро', 1935, 'Первая линия московского метро открыта в 1935 году'],
    ['основание Екатеринбурга', 1723, 'Екатеринбург основан в 1723 году']
  ];
  function centOf(y) { return Math.ceil(y / 100); }
  R.t1CentOf = centOf;
  function centWhy(y) {
    var a = Math.floor(y / 100), b = y % 100;
    if (b === 0) return y + ' = ' + a + ' × 100: сотен лет ровно ' + a + ', поэтому ' + y + ' год — последний год ' + a + '-го века. Век считается с года «01» до года «00».';
    return y + ' = ' + a + ' × 100 + ' + b + ': прошло ' + a + ' ' + plur(a, 'полный век', 'полных века', 'полных веков') + ', и идёт следующий, ' + (a + 1) + '-й век.' + (b === 1 ? ' Год ' + y + ' — первый год этого века.' : '');
  }
  reg('t1Cent', function (o) {
    o = o || {};
    var kind = o.kind || pick(['cent', 'cent', 'event', 'range', 'between']), y, c;
    if (kind === 'cent') {
      y = rand(1001, 2025);
      if (Math.random() < 0.3) y = rand(11, 20) * 100 + pick([0, 1]);
      c = centOf(y);
      return { kind: 'num', html: 'В каком веке был ' + y + ' год? Запиши номер века.', answer: c,
        hint: 'Первый век — это годы с 1-го по 100-й, второй — со 101-го по 200-й. Год, который оканчивается на «00», — последний год века.',
        explain: centWhy(y) + ' Ответ: ' + c + '-й век.', meta: { type: 'cent', kind: kind, y: y, ans: c } };
    }
    if (kind === 'event') {
      var ev = pick(CENT_EV); y = ev[1]; c = centOf(y);
      return { kind: 'num', html: ev[2] + '. В каком веке это произошло? Запиши номер века.', answer: c,
        hint: 'Сколько полных сотен лет в этом году? Следующий век и есть искомый.',
        explain: centWhy(y) + ' Ответ: ' + c + '-й век.', meta: { type: 'cent', kind: kind, y: y, ans: c } };
    }
    if (kind === 'range') {
      c = rand(2, 21); var a = (c - 1) * 100 + 1, b = c * 100;
      return { kind: 'nums', html: 'Назови первый и последний годы ' + c + '-го века.', fields: [{ label: 'первый год' }, { label: 'последний год' }], answer: [a, b],
        hint: 'В веке 100 лет. Первый век начинается с 1-го года и заканчивается 100-м.',
        explain: 'До ' + c + '-го века прошло ' + (c - 1) + ' ' + plur(c - 1, 'век', 'века', 'веков') + ', то есть ' + (c - 1) + ' × 100 = ' + (c - 1) * 100 + ' лет. Значит, ' + c + '-й век начинается с года ' + (c - 1) * 100 + ' + 1 = ' + a + ' и заканчивается годом ' + b + '.', meta: { type: 'cent', kind: kind, c: c, ans: [a, b] } };
    }
    var e1 = pick(CENT_EV), e2 = pick(CENT_EV), g = 0;
    while ((e2[1] === e1[1] || Math.abs(e2[1] - e1[1]) < 30) && g++ < 50) e2 = pick(CENT_EV);
    if (e1[1] > e2[1]) { var t = e1; e1 = e2; e2 = t; }
    var d = e2[1] - e1[1];
    return { kind: 'num', html: 'Сколько лет прошло между событиями: «' + e1[0] + '» (' + e1[1] + ' г.) и «' + e2[0] + '» (' + e2[1] + ' г.)?', answer: d,
      hint: 'Из большего года вычти меньший.', explain: e2[1] + ' − ' + e1[1] + ' = ' + d + ' (' + plur(d, 'год', 'года', 'лет') + ').', meta: { type: 'cent', kind: kind, a: e1[1], b: e2[1], ans: d } };
  });

  /* ================= текстовые задачи ================= */
  function sample(arr) { return pick(arr); }
  function pad(s) { return s; }

  /* --- раздробление / превращение в сюжете --- */
  var CONV_ST = {
    hm: {
      frag: [
        { top: [1, 2], t: function (q) { return 'Фильм в кинотеатре идёт ' + q + '. Сколько минут длится сеанс?'; } },
        { top: [1, 4], t: function (q) { return 'Школьная экскурсия в музей продолжалась ' + q + '. Сколько минут длилась экскурсия?'; } },
        { top: [1, 3], t: function (q) { return 'Лыжники пробыли на трассе ' + q + '. Сколько минут они катались?'; } },
        { top: [2, 6], t: function (q) { return 'Поход к озеру занял ' + q + '. Сколько это минут?'; } },
        { top: [1, 4], t: function (q) { return 'Мастер чинил велосипед ' + q + '. Сколько минут он работал?'; } },
        { top: [2, 5], t: function (q) { return 'Дорога от посёлка до города на автобусе занимает ' + q + '. Сколько минут автобус находится в пути?'; } }
      ],
      turn: [
        { top: [1, 3], t: function (T) { return 'Спектакль в театре длился ' + T + ' мин. Сколько это часов и минут?'; } },
        { top: [1, 6], t: function (T) { return 'Автобус ехал от города до посёлка ' + T + ' мин. Сколько часов и минут он был в пути?'; } },
        { top: [1, 3], t: function (T) { return 'Тренировка по плаванию продолжалась ' + T + ' мин. Выразите это время в часах и минутах.'; } },
        { top: [1, 4], t: function (T) { return 'Экскурсия по городу заняла ' + T + ' мин. Сколько это часов и минут?'; } },
        { top: [1, 5], t: function (T) { return 'Школьный концерт шёл ' + T + ' мин. Сколько часов и минут он длился?'; } }
      ]
    },
    ms: {
      frag: [
        { top: [2, 5], t: function (q) { return 'Песня звучит ' + q + '. Сколько секунд она длится?'; } },
        { top: [1, 4], t: function (q) { return 'Пловец проплыл дистанцию за ' + q + '. Сколько это секунд?'; } },
        { top: [1, 6], t: function (q) { return 'Короткий мультфильм идёт ' + q + '. Сколько секунд он длится?'; } },
        { top: [1, 3], t: function (q) { return 'Бегун пробежал круг по стадиону за ' + q + '. Сколько секунд он бежал?'; } },
        { top: [2, 8], t: function (q) { return 'Видеоролик в интернете идёт ' + q + '. Сколько секунд длится ролик?'; } }
      ],
      turn: [
        { top: [2, 4], t: function (T) { return 'Фигуристка выступала ' + T + ' с. Сколько это минут и секунд?'; } },
        { top: [2, 7], t: function (T) { return 'Видеоролик длится ' + T + ' с. Сколько это минут и секунд?'; } },
        { top: [1, 4], t: function (T) { return 'Лыжник прошёл круг за ' + T + ' с. Выразите это время в минутах и секундах.'; } },
        { top: [2, 5], t: function (T) { return 'Песня звучит ' + T + ' с. Сколько это минут и секунд?'; } },
        { top: [1, 3], t: function (T) { return 'Пловец проплыл дистанцию за ' + T + ' с. Сколько это минут и секунд?'; } }
      ]
    },
    sh: {
      frag: [
        { top: [2, 9], t: function (q) { return 'Научная экспедиция продолжалась ' + q + '. Сколько часов длилась экспедиция?'; } },
        { top: [2, 9], t: function (q) { return 'Теплоход шёл от порта до порта ' + q + '. Сколько часов он был в пути?'; } },
        { top: [1, 5], t: function (q) { return 'Поезд ехал ' + q + '. Сколько часов поезд был в пути?'; } },
        { top: [1, 4], t: function (q) { return 'Туристы провели в походе ' + q + '. Сколько часов длился поход?'; } }
      ],
      turn: [
        { top: [2, 6], t: function (T) { return 'Поезд был в пути ' + T + ' ч. Сколько это суток и часов?'; } },
        { top: [2, 8], t: function (T) { return 'Экспедиция продолжалась ' + T + ' ч. Сколько это суток и часов?'; } },
        { top: [2, 6], t: function (T) { return 'Теплоход находился в рейсе ' + T + ' ч. Выразите это время в сутках и часах.'; } }
      ]
    },
    wd: {
      frag: [
        { top: [2, 6], t: function (q) { return 'Школьные каникулы продолжались ' + q + '. Сколько суток отдыхали школьники?'; } },
        { top: [2, 8], t: function (q) { return 'Бригада строителей закончила работу за ' + q + '. Сколько суток шла работа?'; } },
        { top: [1, 4], t: function (q) { return 'Смена в детском лагере длилась ' + q + '. Сколько суток дети провели в лагере?'; } }
      ],
      turn: [
        { top: [2, 6], t: function (T) { return 'Отпуск длился ' + T + ' сут. Сколько это недель и суток?'; } },
        { top: [3, 9], t: function (T) { return 'Ремонт школы шёл ' + T + ' сут. Сколько это недель и суток?'; } },
        { top: [2, 7], t: function (T) { return 'Экспедиция продолжалась ' + T + ' сут. Выразите это время в неделях и сутках.'; } }
      ]
    },
    ym: {
      frag: [
        { top: [1, 4], t: function (q) { return 'Малышу ' + q + '. Сколько всего месяцев малышу?'; } },
        { top: [1, 3], t: function (q) { return 'Дом строили ' + q + '. Сколько месяцев шло строительство?'; } },
        { top: [1, 5], t: function (q) { return 'Щенку ' + q + '. Сколько это месяцев?'; } }
      ],
      turn: [
        { top: [1, 3], t: function (T) { return 'Мост строили ' + T + ' мес. Сколько это лет и месяцев?'; } },
        { top: [1, 5], t: function (T) { return 'Саженцу яблони ' + T + ' мес. Сколько ему лет и месяцев?'; } },
        { top: [1, 3], t: function (T) { return 'Спортивная школа открылась ' + T + ' мес. назад. Сколько это лет и месяцев?'; } }
      ]
    },
    hms: {
      frag: [
        { top: [1, 3], t: function (q) { return 'Лыжник прошёл трассу за ' + q + '. Сколько это секунд?'; } },
        { top: [1, 3], t: function (q) { return 'Велогонщик проехал дистанцию за ' + q + '. Сколько секунд он был в гонке?'; } },
        { top: [1, 2], t: function (q) { return 'Бегун пробежал забег за ' + q + '. Сколько это секунд?'; } }
      ],
      turn: [
        { top: [1, 3], t: function (T) { return 'Лыжная гонка продолжалась ' + T + ' с. Сколько это часов, минут и секунд?'; } },
        { top: [1, 3], t: function (T) { return 'Велогонщик проехал дистанцию за ' + T + ' с. Выразите время в часах, минутах и секундах.'; } },
        { top: [1, 2], t: function (T) { return 'Бегун пробежал забег за ' + T + ' с. Сколько это часов, минут и секунд?'; } }
      ]
    },
    shm: {
      frag: [
        { top: [1, 3], t: function (q) { return 'Путешествие длилось ' + q + '. Сколько минут продолжалось путешествие?'; } },
        { top: [1, 3], t: function (q) { return 'Экспедиция работала ' + q + '. Сколько это минут?'; } }
      ],
      turn: [
        { top: [1, 3], t: function (T) { return 'Эксперимент продолжался ' + T + ' мин. Сколько это суток, часов и минут?'; } },
        { top: [1, 3], t: function (T) { return 'Корабль находился в рейсе ' + T + ' мин. Сколько это суток, часов и минут?'; } }
      ]
    }
  };
  reg('pt1Conv', function (o) {
    o = o || {};
    var key = pick([].concat(o.ch || ['hm', 'ms', 'sh', 'wd', 'ym'])), C = chn(key), dir = o.dir || pick(['frag', 'turn']);
    var st = pick(CONV_ST[key][dir]), n = C.u.length;
    var v = rv(C, { mode: dir === 'turn' ? pick(['full', 'full', 'zlow']) : (n === 3 && Math.random() < 0.3 ? 'zmid' : 'full'), top: o.top || st.top }), T = tot(C, v), uL = last(C);
    if (dir === 'frag') {
      var L = fragLines(C, v);
      return { kind: 'num', html: st.t(qt(C, v)), answer: T, hint: 'Выразите крупные меры в мелких: ' + fact(C, 0) + (n === 3 ? ', ' + fact(C, 1) : '') + '. Умножь и прибавь остаток.',
        explain: stepsL(L.lines, bold(nu(T, uL))), meta: { type: 'pconv', dir: dir, ch: key, v: v, ans: T } };
    }
    var lines = turnLines(C, T);
    return { kind: 'nums', html: st.t(fmt(T)), fields: fieldsOf(C), answer: v, hint: 'Раздели число на ' + C.f[n - 2] + (n === 3 ? ', а потом на ' + C.f[0] : '') + ': частные и остатки дадут крупные и мелкие меры.',
      explain: stepsL(lines, ansC(C, T)), meta: { type: 'pconv', dir: dir, ch: key, total: T, ans: v } };
  });

  /* --- сумма промежутков времени --- */
  var SUM_ST = {
    hm: {
      2: [
        { tops: [[1, 3], [0, 0]], t: function (a, b) { return 'Дорога до дачи заняла: на электричке ' + a + ', а пешком ещё ' + b + '. Сколько времени ушло на всю дорогу?'; } },
        { tops: [[1, 2], [0, 1]], t: function (a, b) { return 'В субботу Лена занималась музыкой ' + a + ', а в воскресенье — ' + b + '. Сколько времени она занималась музыкой за эти два дня?'; } },
        { tops: [[0, 0], [0, 0]], t: function (a, b) { return 'Первая серия мультфильма идёт ' + a + ', вторая — ' + b + '. Сколько времени идут обе серии?'; } },
        { tops: [[1, 3], [0, 2]], t: function (a, b) { return 'Туристы шли до привала ' + a + ', а после привала — ещё ' + b + '. Сколько времени они были в пути?'; } },
        { tops: [[1, 3], [1, 3]], t: function (a, b) { return 'Мастер красил забор ' + a + ' утром и ' + b + ' после обеда. Сколько времени он красил забор?'; } },
        { tops: [[1, 4], [1, 3]], t: function (a, b) { return 'Самолёт летел до пересадки ' + a + ', а после пересадки — ' + b + '. Сколько времени пассажиры были в воздухе?'; } }
      ],
      3: [
        { tops: [[1, 3], [0, 0], [1, 3]], t: function (a, b, c) { return 'Автобус ехал ' + a + ', потом стоял на остановке ' + b + ' и после этого ехал ещё ' + c + '. Сколько времени автобус был в пути?'; } },
        { tops: [[0, 0], [0, 0], [0, 0]], t: function (a, b, c) { return 'Праздничный концерт состоял из трёх частей: ' + a + ', ' + b + ' и ' + c + '. Сколько времени продолжался концерт?'; } },
        { tops: [[1, 2], [0, 0], [0, 1]], t: function (a, b, c) { return 'Вася сделал уроки за ' + a + ', прочитал книгу ' + b + ' и погулял с собакой ' + c + '. Сколько времени ушло на всё это?'; } },
        { tops: [[1, 3], [0, 0], [1, 2]], t: function (a, b, c) { return 'Экскурсанты шли по лесу ' + a + ', отдыхали ' + b + ' и потом шли к автобусу ' + c + '. Сколько времени длилась прогулка?'; } }
      ]
    },
    ms: {
      2: [
        { tops: [[8, 25], [8, 25]], t: function (a, b) { return 'Первую часть дистанции лыжник прошёл за ' + a + ', а вторую — за ' + b + '. За какое время он прошёл всю дистанцию?'; } },
        { tops: [[2, 5], [2, 5]], t: function (a, b) { return 'Первая песня звучала ' + a + ', вторая — ' + b + '. Сколько времени звучали обе песни?'; } },
        { tops: [[1, 5], [1, 5]], t: function (a, b) { return 'Один видеоролик идёт ' + a + ', другой — ' + b + '. Сколько времени идут оба ролика?'; } },
        { tops: [[1, 3], [1, 3]], t: function (a, b) { return 'Пловец проплыл первый круг за ' + a + ', а второй — за ' + b + '. Сколько времени он плыл?'; } }
      ],
      3: [
        { tops: [[1, 3], [1, 3], [1, 3]], t: function (a, b, c) { return 'Бегун пробежал три круга по стадиону за ' + a + ', ' + b + ' и ' + c + '. Сколько времени он бежал всего?'; } },
        { tops: [[2, 5], [2, 5], [2, 5]], t: function (a, b, c) { return 'В школьном концерте прозвучали три песни: ' + a + ', ' + b + ' и ' + c + '. Сколько времени длились все три песни?'; } },
        { tops: [[1, 4], [1, 4], [1, 4]], t: function (a, b, c) { return 'Ролики в сборнике идут ' + a + ', ' + b + ' и ' + c + '. Сколько времени идёт весь сборник?'; } }
      ]
    },
    sh: {
      2: [
        { tops: [[1, 6], [1, 6]], t: function (a, b) { return 'Теплоход шёл до первой остановки ' + a + ', а до конечного порта ещё ' + b + '. Сколько времени теплоход был в пути?'; } },
        { tops: [[1, 6], [1, 6]], t: function (a, b) { return 'Экспедиция работала в горах ' + a + ', а потом в долине ' + b + '. Сколько времени продолжалась экспедиция?'; } },
        { tops: [[1, 5], [1, 5]], t: function (a, b) { return 'Поезд ехал до границы ' + a + ', а потом до конечной станции ещё ' + b + '. Сколько времени поезд был в пути?'; } }
      ]
    }
  };
  reg('pt1Sum', function (o) {
    o = o || {};
    var key = pick([].concat(o.ch || ['hm', 'ms'])), C = chn(key), cnt = o.terms || pick([2, 2, 3]);
    if (!SUM_ST[key][cnt]) cnt = 2;
    var st = pick(SUM_ST[key][cnt]), r = genAdd(C, { terms: cnt, carry: o.carry || 'some', tops: st.tops, five: o.five });
    var txt = r.terms.map(function (t) { return qt(C, t); });
    var html = st.t.apply(null, txt.map(bold));
    var expl = 'Всё время — это сумма промежутков: ' + txt.join(' + ') + '.<br>' + R.t1ColHTML('+', C, r.terms);
    return { kind: 'nums', html: html, fields: fieldsOf(C), answer: r.cal.res, hint: 'Сложи промежутки времени по мерам, начиная с самой мелкой. Не забудь превратить лишние мелкие меры в крупные.',
      explain: expl, meta: { type: 'psum', ch: key, terms: r.terms, ans: r.cal.res } };
  });

  /* --- разность промежутков --- */
  var DIFF_ST = {
    hm: [
      { top: [2, 6], t: function (a, b) { return 'Пассажирский поезд проходит маршрут за ' + a + ', а скорый — за ' + b + '. На сколько меньше времени тратит скорый поезд?'; } },
      { top: [1, 4], t: function (a, b) { return 'Первый самолёт был в воздухе ' + a + ', второй — ' + b + '. На сколько дольше летел первый самолёт?'; } },
      { top: [1, 3], t: function (a, b) { return 'Первый фильм идёт ' + a + ', второй — ' + b + '. На сколько второй фильм короче первого?'; } },
      { top: [1, 4], t: function (a, b) { return 'Катя занималась английским ' + a + ', а Оля — ' + b + '. На сколько дольше занималась Катя?'; } },
      { top: [2, 8], t: function (a, b) { return 'На путь в гору туристы потратили ' + a + ', а на спуск — ' + b + '. На сколько спуск был короче подъёма?'; } }
    ],
    ms: [
      { top: [3, 12], t: function (a, b) { return 'Первый лыжник прошёл круг за ' + a + ', а второй — за ' + b + '. На сколько быстрее прошёл круг второй лыжник?'; } },
      { top: [2, 6], t: function (a, b) { return 'Одна песня звучит ' + a + ', другая — ' + b + '. На сколько вторая песня короче первой?'; } },
      { top: [1, 5], t: function (a, b) { return 'Первый пловец проплыл дистанцию за ' + a + ', второй — за ' + b + '. На сколько быстрее проплыл второй?'; } },
      { top: [4, 20], t: function (a, b) { return 'Мальчик решил первую задачу за ' + a + ', а вторую — за ' + b + '. На сколько меньше времени он потратил на вторую задачу?'; } }
    ]
  };
  reg('pt1Diff', function (o) {
    o = o || {};
    var key = pick([].concat(o.ch || ['hm', 'ms'])), C = chn(key), st = pick(DIFF_ST[key]);
    var s = genSub(C, { mode: o.mode || pick(['borrow', 'borrow', 'plain', 'any']), top: o.top || st.top, five: o.five });
    var html = st.t(bold(qt(C, s.A)), bold(qt(C, s.B)));
    return { kind: 'nums', html: html, fields: fieldsOf(C), answer: s.cal.res, hint: 'Чтобы узнать, на сколько одно время больше другого, вычти меньшее из большего. Вычитай по мерам.',
      explain: 'Разность: ' + qt(C, s.A) + ' − ' + qt(C, s.B) + '.<br>' + R.t1ColHTML('−', C, [s.A, s.B]), meta: { type: 'pdiff', ch: key, A: s.A, B: s.B, ans: s.cal.res } };
  });

  /* --- «сколько осталось» --- */
  var LEFT_ST = {
    hm: [
      { top: [1, 3], t: function (T, t) { return 'Фильм идёт ' + T + '. Зрители смотрят его уже ' + t + '. Сколько времени осталось до конца фильма?'; } },
      { top: [3, 9], t: function (T, t) { return 'Поезд должен быть в пути ' + T + '. Он едет уже ' + t + '. Сколько времени поезду ещё ехать?'; } },
      { top: [1, 3], t: function (T, t) { return 'На контрольную работу отвели ' + T + '. Ученики работают уже ' + t + '. Сколько времени осталось до конца работы?'; } },
      { top: [1, 2], t: function (T, t) { return 'Мама разрешила Мише играть на компьютере не больше ' + T + ' в день. Миша играл уже ' + t + '. Сколько времени ему ещё можно играть?'; } },
      { top: [2, 6], t: function (T, t) { return 'Самолёт должен лететь ' + T + '. Он находится в воздухе уже ' + t + '. Сколько времени осталось лететь?'; } }
    ],
    ms: [
      { top: [3, 7], t: function (T, t) { return 'Песня звучит ' + T + '. Она играет уже ' + t + '. Сколько времени осталось до конца песни?'; } },
      { top: [5, 15], t: function (T, t) { return 'Таймер на кухне отсчитывает ' + T + '. Прошло уже ' + t + '. Сколько времени осталось до сигнала?'; } },
      { top: [2, 6], t: function (T, t) { return 'Видеоролик идёт ' + T + '. Лиза смотрит его уже ' + t + '. Сколько времени осталось смотреть?'; } },
      { top: [1, 4], t: function (T, t) { return 'Пловец должен проплыть дистанцию за ' + T + '. Он плывёт уже ' + t + '. Сколько времени ему осталось плыть, если он уложится в срок?'; } }
    ],
    sh: [
      { top: [3, 9], t: function (T, t) { return 'Теплоход должен прийти в порт через ' + T + '. Прошло уже ' + t + '. Сколько времени осталось до прихода?'; } },
      { top: [3, 9], t: function (T, t) { return 'Экспедиция запланирована на ' + T + '. Участники работают уже ' + t + '. Сколько времени осталось работать?'; } }
    ]
  };
  reg('pt1Left', function (o) {
    o = o || {};
    var key = pick([].concat(o.ch || ['hm', 'ms'])), C = chn(key), st = pick(LEFT_ST[key]);
    var s = genSub(C, { mode: o.mode || pick(['borrow', 'borrow', 'any']), top: o.top || st.top, five: o.five });
    var html = st.t(bold(qt(C, s.A)), bold(qt(C, s.B)));
    return { kind: 'nums', html: html, fields: fieldsOf(C), answer: s.cal.res, hint: 'Оставшееся время — это разность: из всего времени вычти то, что уже прошло.',
      explain: 'Осталось: ' + qt(C, s.A) + ' − ' + qt(C, s.B) + '.<br>' + R.t1ColHTML('−', C, [s.A, s.B], { check: true }), meta: { type: 'pleft', ch: key, A: s.A, B: s.B, ans: s.cal.res } };
  });

  /* --- время суток в задаче: начало, длительность, конец --- */
  var CLK_END = [
    function (S, D) { return 'Поезд отправился в ' + S + ' и ехал ' + D + '. Во сколько он прибыл на станцию назначения?'; },
    function (S, D) { return 'Киносеанс начался в ' + S + ' и длился ' + D + '. Во сколько он закончился?'; },
    function (S, D) { return 'Туристы вышли из лагеря в ' + S + ' и шли до вершины ' + D + '. Во сколько они пришли на вершину?'; },
    function (S, D) { return 'Мастер начал работу в ' + S + ' и работал ' + D + '. Во сколько он закончил работу?'; },
    function (S, D) { return 'Самолёт вылетел в ' + S + ' и находился в воздухе ' + D + '. Во сколько он приземлился?'; },
    function (S, D) { return 'Тренировка по футболу началась в ' + S + ' и шла ' + D + '. Во сколько она закончилась?'; }
  ];
  var CLK_START = [
    function (E, D) { return 'Поезд прибыл на станцию в ' + E + ', проведя в пути ' + D + '. Во сколько он отправился?'; },
    function (E, D) { return 'Спектакль закончился в ' + E + ' и шёл ' + D + '. Во сколько он начался?'; },
    function (E, D) { return 'Лыжники вернулись на базу в ' + E + ', пробыв на трассе ' + D + '. Во сколько они вышли на трассу?'; },
    function (E, D) { return 'Мама пришла с работы в ' + E + '. Дорога домой заняла ' + D + '. Во сколько она вышла с работы?'; }
  ];
  var CLK_DUR = [
    function (S, E) { return 'Поезд отправился в ' + S + ', а прибыл в ' + E + '. Сколько времени он был в пути?'; },
    function (S, E) { return 'Фильм начался в ' + S + ' и закончился в ' + E + '. Сколько времени он шёл?'; },
    function (S, E) { return 'Кружок рисования начался в ' + S + ', а закончился в ' + E + '. Сколько времени длилось занятие?'; },
    function (S, E) { return 'Экскурсия вышла из музея в ' + S + ' и вернулась в ' + E + '. Сколько времени она длилась?'; },
    function (S, E) { return 'Бабушка поставила пирог в духовку в ' + S + ' и вынула в ' + E + '. Сколько времени пирог пёкся?'; }
  ];
  function inTxt(T) { var a = hmOf(T); return hmTxt(a[0], a[1]); }
  reg('pt1Clock', function (o) {
    o = o || {};
    var dir = o.dir || pick(['end', 'start', 'dur']), P = pickSD({ borrow: o.borrow, s1: 6, s2: 18 }), S = P.S, E = P.E, D = P.D, sa = hmOf(S), ea = hmOf(E), da = hmOf(D), cal;
    if (dir === 'end') {
      cal = addCalc(CH.hm, [sa, da]);
      return { kind: 'nums', html: pick(CLK_END)(bold(inTxt(S)), bold(qt(CH.hm, da))) + ' <span class="soft">Ответ запиши по 24-часовому счёту.</span>', fields: fieldsOf(CH.hm), answer: ea,
        hint: 'Время окончания — это начало плюс длительность. Складывай по мерам.',
        explain: 'Конец = начало + длительность: ' + qt(CH.hm, sa) + ' + ' + qt(CH.hm, da) + '.<br>' + R.t1ColHTML('+', CH.hm, [sa, da]) + shiftFig(S, E),
        meta: { type: 'pclock', dir: dir, S: S, D: D, E: E, ans: ea } };
    }
    if (dir === 'start') {
      return { kind: 'nums', html: pick(CLK_START)(bold(inTxt(E)), bold(qt(CH.hm, da))) + ' <span class="soft">Ответ запиши по 24-часовому счёту.</span>', fields: fieldsOf(CH.hm), answer: sa,
        hint: 'Время начала — это конец минус длительность. Вычитай по мерам; если минут не хватает, займи час.',
        explain: 'Начало = конец − длительность: ' + qt(CH.hm, ea) + ' − ' + qt(CH.hm, da) + '.<br>' + R.t1ColHTML('−', CH.hm, [ea, da]) + shiftFig(S, E),
        meta: { type: 'pclock', dir: dir, S: S, D: D, E: E, ans: sa } };
    }
    return { kind: 'nums', html: pick(CLK_DUR)(bold(inTxt(S)), bold(inTxt(E))), fields: fieldsOf(CH.hm), answer: da,
      hint: 'Длительность — это конец минус начало. Вычитай по мерам; если минут не хватает, займи час.',
      explain: 'Длительность = конец − начало: ' + qt(CH.hm, ea) + ' − ' + qt(CH.hm, sa) + '.<br>' + R.t1ColHTML('−', CH.hm, [ea, sa], { check: true }) + shiftFig(S, E),
      meta: { type: 'pclock', dir: dir, S: S, D: D, E: E, ans: da } };
  });

  /* уроки по расписанию: N уроков по 45 мин с переменами; когда закончится последний */
  reg('pt1Bells', function (o) {
    o = o || {};
    var S = rand(8, 14) * 60 + pick([0, 0, 30, 20, 40]), N = rand(2, 4), L = pick([40, 45, 45]), B = pick([10, 10, 15, 20]);
    var tl = N * L, tb = (N - 1) * B, D = tl + tb, E = S + D, g = 0;
    if (E >= 1380) { S = 8 * 60 + 30; E = S + D; }
    var ordw = ['первый', 'второй', 'третий', 'четвёртый', 'пятый'];
    var da = spl(CH.hm, D), sa = hmOf(S), ea = hmOf(E);
    var cnt = N + ' ' + plur(N, 'урок', 'урока', 'уроков'), brk = (N - 1) + ' ' + plur(N - 1, 'перемена', 'перемены', 'перемен');
    var expl = plainSteps([
      'Уроки идут ' + N + ' × ' + L + ' = ' + (tl) + ' мин.',
      'Перемен между ' + N + ' уроками на одну меньше: ' + (N - 1) + '. Они длятся ' + (N - 1) + ' × ' + B + ' = ' + tb + ' мин.',
      'Всё вместе: ' + tl + ' + ' + tb + ' = ' + D + ' мин = ' + qt(CH.hm, da) + '.',
      'Начало плюс длительность: ' + qt(CH.hm, sa) + ' + ' + qt(CH.hm, da) + ' = ' + qt(CH.hm, ea) + '.'
    ]) + '<br>Ответ: ' + bold(hmTxt(ea[0], ea[1])) + '.';
    return { kind: 'nums', html: 'Первый урок начинается в ' + bold(hmTxt(sa[0], sa[1])) + '. Каждый урок длится ' + L + ' мин, а перемена между уроками — ' + B + ' мин. Во сколько закончится ' + ordw[N - 1] + ' урок (то есть после ' + cnt + ' и ' + brk + ')?',
      fields: fieldsOf(CH.hm), answer: ea, hint: 'Узнай, сколько минут проходит от начала первого урока до конца последнего: уроки плюс перемены (перемен на одну меньше, чем уроков). Потом прибавь к началу.',
      explain: expl, meta: { type: 'pbells', S: S, N: N, L: L, B: B, E: E, ans: ea } };
  });

  /* сеанс с рекламой: начало + два промежутка */
  reg('pt1Show', function (o) {
    o = o || {};
    var S = rand(10, 19) * 60 + pick([0, 10, 15, 20, 30, 40, 45]), A = pick([10, 15, 20, 25]), F = rand(1, 2) * 60 + rnd5(5, 55), D = A + F, E = S + D;
    var sa = hmOf(S), fa = spl(CH.hm, F), da = spl(CH.hm, D), ea = hmOf(E);
    var expl = plainSteps(['Реклама и фильм вместе идут ' + A + ' мин + ' + qt(CH.hm, fa) + ' = ' + qt(CH.hm, da) + '.', 'Сеанс начался в ' + qt(CH.hm, sa) + ', значит, закончится: ' + qt(CH.hm, sa) + ' + ' + qt(CH.hm, da) + ' = ' + qt(CH.hm, ea) + '.']) + '<br>Ответ: ' + bold(hmTxt(ea[0], ea[1])) + '.';
    return { kind: 'nums', html: 'Сеанс в кинотеатре начинается в ' + bold(hmTxt(sa[0], sa[1])) + '. Сначала показывают рекламу ' + A + ' мин, а потом фильм, который идёт ' + bold(qt(CH.hm, fa)) + '. Во сколько закончится сеанс?',
      fields: fieldsOf(CH.hm), answer: ea, hint: 'Сложи рекламу и фильм — это длительность сеанса. Потом прибавь её к началу.', explain: expl,
      meta: { type: 'pshow', S: S, A: A, F: F, E: E, ans: ea } };
  });

  /* простое именованное число × число */
  reg('pt1Times', function (o) {
    o = o || {};
    var kind = o.kind || pick(['lessons', 'read', 'work', 'week', 'pulse', 'breath']);
    if (kind === 'lessons') {
      var N = rand(3, 6), L = pick([40, 45, 45]), T = N * L, ta = spl(CH.hm, T);
      return { kind: 'nums', html: 'В школе ' + N + ' ' + plur(N, 'урок', 'урока', 'уроков') + ' по ' + L + ' мин. Сколько часов и минут длятся все уроки (без перемен)?', fields: fieldsOf(CH.hm), answer: ta,
        hint: 'Сначала найди, сколько минут длятся все уроки, потом переведи минуты в часы и минуты.',
        explain: stepsL([L + ' × ' + N + ' = ' + T + ' мин — длятся все уроки', 'Превращаем минуты в часы: ' + T + ' : 60 = ' + ta[0] + ' (остаток ' + ta[1] + ')'], bold(qt(CH.hm, ta))), meta: { type: 'ptimes', kind: kind, ans: ta, n: N, m: L } };
    }
    if (kind === 'read') {
      var m = pick([20, 25, 30, 40, 45]), d = rand(5, 14), T2 = m * d;
      return { kind: 'nums', html: 'Каждый вечер Маша читает ' + m + ' мин. Сколько часов и минут она читает за ' + d + ' ' + plur(d, 'день', 'дня', 'дней') + '?', fields: fieldsOf(CH.hm), answer: spl(CH.hm, T2),
        hint: 'Найди общее число минут, а потом переведи его в часы и минуты.',
        explain: stepsL([m + ' × ' + d + ' = ' + T2 + ' мин', T2 + ' : 60 = ' + Math.floor(T2 / 60) + ' (остаток ' + (T2 % 60) + ')'], ansC(CH.hm, T2)), meta: { type: 'ptimes', kind: kind, ans: spl(CH.hm, T2), n: d, m: m } };
    }
    if (kind === 'work') {
      var P = rand(20, 40), Q = P - rand(5, 14), sh = pick([6, 7, 8]), save = (P - Q) * sh;
      return { kind: 'num', html: 'По плану бригаде отводилось ' + P + ' ' + plur(P, 'смена', 'смены', 'смен') + ' на работу, а она закончила её за ' + Q + ' ' + plur(Q, 'смену', 'смены', 'смен') + '. Сколько часов сэкономила бригада, если смена длится ' + sh + ' ч?', answer: save,
        hint: 'Сначала узнай, на сколько смен бригада закончила работу раньше, потом переведи смены в часы.',
        explain: stepsL([P + ' − ' + Q + ' = ' + (P - Q) + ' — на столько смен раньше', sh + ' × ' + (P - Q) + ' = ' + save + ' ч'], nu(save, 'ч')), meta: { type: 'ptimes', kind: kind, ans: save, P: P, Q: Q, sh: sh } };
    }
    if (kind === 'week') {
      var h = rand(2, 4), wk = rand(2, 6), tt = h * 7 * wk;
      return { kind: 'num', html: 'Спортсмен тренируется по ' + h + ' ч каждый день без выходных. Сколько часов он тренируется за ' + wk + ' ' + plur(wk, 'неделю', 'недели', 'недель') + '?', answer: tt,
        hint: 'Сколько суток в ' + wk + ' неделях? А потом умножь на часы в одних сутках тренировки.',
        explain: stepsL(['1 нед. = 7 сут., значит, ' + wk + ' нед. = ' + wk + ' × 7 = ' + (7 * wk) + ' сут.', h + ' × ' + (7 * wk) + ' = ' + tt + ' ч'], nu(tt, 'ч')), meta: { type: 'ptimes', kind: kind, ans: tt, h: h, wk: wk } };
    }
    if (kind === 'pulse') {
      var b = pick([60, 65, 70, 72, 75, 80]), mm = pick([10, 15, 30, 60]), tt2 = b * mm;
      return { kind: 'num', html: 'У спокойно сидящего школьника сердце бьётся примерно ' + b + ' раз в минуту. Сколько примерно ударов сделает сердце за ' + (mm === 60 ? '1 ч' : mm + ' мин') + '?', answer: tt2,
        hint: mm === 60 ? 'Сколько минут в часе? Столько раз повтори число ударов за минуту.' : 'Умножь число ударов за минуту на число минут.',
        explain: stepsL([(mm === 60 ? '1 ч = 60 мин. ' : '') + b + ' × ' + mm + ' = ' + fmt(tt2)], fmt(tt2) + ' ' + plur(tt2, 'удар', 'удара', 'ударов')), meta: { type: 'ptimes', kind: kind, ans: tt2, b: b, mm: mm } };
    }
    var br = pick([15, 16, 18, 20]), mm2 = pick([5, 10, 30, 60]), tt3 = br * mm2;
    return { kind: 'num', html: 'Человек делает примерно ' + br + ' вдохов в минуту. Сколько примерно вдохов он сделает за ' + (mm2 === 60 ? '1 ч' : mm2 + ' мин') + '?', answer: tt3,
      hint: mm2 === 60 ? 'Сколько минут в часе? Столько раз повтори число вдохов за минуту.' : 'Умножь число вдохов за минуту на число минут.',
      explain: stepsL([(mm2 === 60 ? '1 ч = 60 мин. ' : '') + br + ' × ' + mm2 + ' = ' + fmt(tt3)], fmt(tt3) + ' ' + plur(tt3, 'вдох', 'вдоха', 'вдохов')), meta: { type: 'ptimes', kind: kind, ans: tt3, b: br, mm: mm2 } };
  });

  /* сколько времени из прожитого проводит во сне */
  reg('pt1Sleep', function (o) {
    o = o || {};
    var kind = o.kind || pick(['human', 'human', 'cat', 'koala']), h, Y, ans, html, expl;
    if (kind === 'human') {
      var variants = [{ h: 8, ys: [18, 24, 30, 36, 45, 54, 60, 75] }, { h: 6, ys: [20, 28, 40, 48, 60, 72] }, { h: 12, ys: [10, 14, 20, 30, 50] }];
      var vr = o.h ? variants.filter(function (x) { return x.h === o.h; })[0] : pick(variants);
      h = vr.h; Y = pick(vr.ys); ans = Y * h / 24;
      var intro = h === 8 ? 'Взрослый человек в среднем спит около 8 ч в сутки.' : h === 6 ? 'Один человек спит по 6 ч в сутки.' : 'Предположим, что человек спит по 12 ч в сутки.';
      html = intro + ' Сколько лет из ' + Y + ' ' + plur(Y, 'прожитого года', 'прожитых года', 'прожитых лет') + ' такой человек проводит во сне?';
      var part = 24 / h;
      expl = stepsL(['В сутках 24 ч, а спит человек ' + h + ' ч — это ' + (part === 2 ? 'половина' : part === 3 ? 'треть' : 'четверть') + ' суток (24 : ' + h + ' = ' + part + ')', 'Значит, во сне проходит ' + (part === 2 ? 'половина' : part === 3 ? 'треть' : 'четверть') + ' жизни: ' + Y + ' : ' + part + ' = ' + ans + ' ' + plur(ans, 'год', 'года', 'лет')], nu(ans, 'г.'));
      return { kind: 'num', html: html, answer: ans, hint: 'Какую часть суток человек спит? Такую же часть от всех прожитых лет он проводит во сне.', explain: expl, meta: { type: 'psleep', kind: kind, ans: ans, Y: Y, h: h } };
    }
    var cat = kind === 'cat', hh = cat ? 16 : 20, ND = pick(cat ? [3, 6, 9, 12, 15, 18, 24, 27, 30] : [6, 12, 18, 24, 30]), tt = ND * hh / 24;
    return { kind: 'num', html: (cat ? 'Кошка спит примерно 16 ч в сутки.' : 'Коала спит примерно 20 ч в сутки.') + ' Сколько суток из ' + ND + ' ' + plur(ND, 'суток', 'суток', 'суток') + ' ' + (cat ? 'кошка' : 'коала') + ' проводит во сне?', answer: tt,
      hint: 'Сначала узнай, сколько часов животное спит за ' + ND + ' сут., а потом переведи часы в сутки.',
      explain: stepsL([ND + ' × ' + hh + ' = ' + (ND * hh) + ' ч — столько часов ' + (cat ? 'кошка' : 'коала') + ' спит за ' + ND + ' сут.', (ND * hh) + ' : 24 = ' + tt + ' сут.'], nu(tt, 'сут.')), meta: { type: 'psleep', kind: kind, ans: tt, ND: ND, h: hh } };
  });

  /* сутки между датами (без перехода через февраль) */
  var CAL_ST = [
    { m: [5, 7], t: function (a, b) { return 'Летние каникулы у школьника начались ' + a + ', а закончились ' + b + '. Сколько суток прошло от начала до конца каникул?'; } },
    { m: [2, 8], t: function (a, b) { return 'Строители начали ремонт школы ' + a + ' и закончили ' + b + '. Сколько суток шёл ремонт?'; } },
    { m: [3, 9], t: function (a, b) { return 'Семья уехала в отпуск ' + a + ' и вернулась ' + b + '. Сколько суток семья отсутствовала дома?'; } },
    { m: [3, 7], t: function (a, b) { return 'Весной на клумбе высадили рассаду ' + a + ', а первые цветы распустились ' + b + '. Сколько суток прошло от посадки до цветения?'; } },
    { m: [4, 10], t: function (a, b) { return 'Экспедиция вышла в поход ' + a + ' и вернулась ' + b + '. Сколько суток продолжалась экспедиция?'; } }
  ];
  reg('pt1Cal', function (o) {
    o = o || {};
    var st = pick(CAL_ST), m1 = rand(st.m[0], st.m[1] - 1), m2 = m1 + rand(1, Math.min(3, st.m[1] - m1)), g = 0, d1, d2;
    if (m2 > 10) m2 = 10;
    if (m2 <= m1) m2 = m1 + 1;
    d1 = rand(1, MON[m1].d); d2 = rand(1, MON[m2].d);
    var y = 2025, ans = doy(m2, d2, y) - doy(m1, d1, y), L = [], parts = [MON[m1].d - d1];
    L.push('До конца ' + MON[m1].gen + ': ' + MON[m1].d + ' − ' + d1 + ' = ' + (MON[m1].d - d1) + ' сут.');
    for (var i = m1 + 1; i < m2; i++) { L.push('Весь ' + MON[i].n + ': ' + MON[i].d + ' сут.'); parts.push(MON[i].d); }
    L.push('В ' + MON[m2].loc + ' до ' + d2 + ' ' + MON[m2].gen + ': ' + d2 + ' сут.'); parts.push(d2);
    L.push('Всего: ' + parts.join(' + ') + ' = ' + ans + ' сут.');
    return { kind: 'num', html: st.t(bold(d1 + ' ' + MON[m1].gen), bold(d2 + ' ' + MON[m2].gen)), answer: ans,
      hint: 'Сначала узнай, сколько суток остаётся до конца первого месяца, потом прибавь целые месяцы и сутки последнего месяца. Сколько дней в каждом месяце — вспомни «кулак».',
      explain: stepsL(L, nu(ans, 'сут.')), meta: { type: 'pcal', m1: m1, d1: d1, m2: m2, d2: d2, ans: ans } };
  });

  /* встречное движение: найти время */
  reg('pt1Meet', function (o) {
    o = o || {};
    var kind = pick([0, 1, 2]), v1, v2, t = rand(2, 9), D, who, text;
    if (kind === 0) { v1 = rand(9, 16); v2 = rand(9, 16); who = 'Две группы школьников выехали навстречу друг другу на велосипедах из двух лагерей.'; }
    else if (kind === 1) { v1 = rand(3, 6); v2 = rand(3, 6); who = 'Два друга вышли навстречу друг другу из двух деревень.'; }
    else { v1 = rand(8, 14); v2 = rand(8, 14); who = 'Две лыжные группы вышли навстречу друг другу из двух посёлков.'; }
    D = (v1 + v2) * t;
    text = who + ' Расстояние между ними ' + D + ' км. Одна группа движется со скоростью ' + v1 + ' км/ч, а другая — ' + v2 + ' км/ч. Через сколько часов они встретятся?';
    if (kind === 1) text = who + ' Расстояние между деревнями ' + D + ' км. Один идёт со скоростью ' + v1 + ' км/ч, а другой — ' + v2 + ' км/ч. Через сколько часов они встретятся?';
    return { kind: 'num', html: text, answer: t, hint: 'Каждый час они сближаются на сумму скоростей. Узнай эту «скорость сближения» и раздели на неё расстояние.',
      explain: stepsL([v1 + ' + ' + v2 + ' = ' + (v1 + v2) + ' км/ч — на столько километров в час сближаются', D + ' : ' + (v1 + v2) + ' = ' + t + ' ч'], nu(t, 'ч')), meta: { type: 'pmeet', ans: t, v1: v1, v2: v2, D: D } };
  });

  /* ================= рисунки и таблицы для теории ================= */
  /* «кулак»: месяцы на косточках и во впадинках */
  R.t1Fist = function () {
    var s = '', i, x, mon1 = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл'], mon2 = ['авг', 'сен', 'окт', 'ноя', 'дек'];
    s += '<path class="t1fl" d="M20 112 Q40 62 66 62 Q86 62 93 104 Q99 62 119 62 Q146 62 146 104 Q146 62 172 62 Q199 62 199 104 Q199 62 225 62 Q252 62 252 104 Q252 62 278 62 Q305 62 305 104 Q305 62 331 62 Q360 62 372 112"/>';
    for (i = 0; i < 7; i++) {
      x = 40 + i * 53;
      s += (i % 2 === 0 ? '<circle class="t1kn" cx="' + x + '" cy="82" r="21"/>' : '<circle class="t1vl" cx="' + x + '" cy="98" r="6"/>');
      s += '<text class="t1m1' + (i % 2 === 0 ? ' k' : '') + '" x="' + x + '" y="40" text-anchor="middle">' + mon1[i] + '</text>';
      if (i < 5) s += '<text class="t1m2' + (i % 2 === 0 ? ' k' : '') + '" x="' + x + '" y="148" text-anchor="middle">' + mon2[i] + '</text>';
    }
    s += '<text class="t1mc" x="200" y="22" text-anchor="middle">первый круг</text><text class="t1mc" x="146" y="172" text-anchor="middle">второй круг: снова с первой косточки</text>';
    return '<svg class="fig t1fist" viewBox="0 0 400 184" width="400" role="img" aria-label="Счёт месяцев по костяшкам кулака: на косточках месяцы по 31 дню, во впадинках — по 30 дней">' + s + '</svg>';
  };
  /* таблица месяцев по временам года */
  R.t1MonthsHTML = function () {
    var rows = [['Зима', [11, 0, 1]], ['Весна', [2, 3, 4]], ['Лето', [5, 6, 7]], ['Осень', [8, 9, 10]]];
    var h = '<table class="mt t1mon"><tr><th>Время года</th><th>Месяцы и число дней</th></tr>';
    rows.forEach(function (r) {
      h += '<tr><td>' + r[0] + '</td><td>' + r[1].map(function (m) { return MON[m].n + ' — ' + (m === 1 ? '28 или 29' : MON[m].d); }).join('; ') + '</td></tr>';
    });
    return h + '</table>';
  };
  /* таблица мер времени */
  R.t1MeasHTML = function (o) {
    o = o || {};
    var rows = [['1 неделя', '7 суток'], ['1 сутки', '24 часа'], ['1 час', '60 минут'], ['1 минута', '60 секунд'], ['1 месяц', '28, 29, 30 или 31 сутки'], ['1 год', '12 месяцев = 365 или 366 суток'], ['1 век', '100 лет']];
    if (o.short) rows = rows.filter(function (r, i) { return i < 4; });
    var h = '<table class="mt t1meas"><tr><th>мера</th><th>равна</th></tr>';
    rows.forEach(function (r) { h += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; });
    return h + '</table>';
  };
  /* цепочка делений уголком при превращении */
  R.t1TurnCorner = function (chain, total) {
    var C = chn(chain), n = C.u.length, cur = total, h = '<div class="t1turn">', i;
    for (i = n - 1; i >= 1; i--) {
      var f = C.f[i - 1], q = Math.floor(cur / f), r = cur % f;
      h += '<div class="t1tc">' + R.divHTML(cur, f) + '<div class="t1cap">' + nu(cur, C.u[i]) + ' : ' + f + ' = ' + nu(q, C.u[i - 1]) + (r ? ', остаток ' + nu(r, C.u[i]) : '') + '</div></div>';
      cur = q;
    }
    return h + '</div>';
  };

  /* ================= виджеты ================= */
  R.widgetMounts = R.widgetMounts || {};
  var WCH = [['hm', 'часы и минуты'], ['ms', 'минуты и секунды'], ['sh', 'сутки и часы'], ['wd', 'недели и сутки'], ['ym', 'годы и месяцы'], ['hms', 'часы, минуты и секунды'], ['shm', 'сутки, часы и минуты']];
  function chainOptions(def, only) {
    return WCH.filter(function (c) { return !only || only.indexOf(c[0]) >= 0; }).map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === def ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('');
  }
  function digs(inp, maxLen) { return Number(String(inp.value).replace(/\D/g, '').slice(0, maxLen || 5)) || 0; }
  function inp(cls, val) { return '<input class="winput sm ' + cls + '" inputmode="numeric" autocomplete="off" value="' + val + '">'; }

  /* раздробление или превращение с объяснением: data-mode="frag" | "turn", data-ch="hm" */
  R.widgetMounts.t1conv = function (host) {
    var mode = host.getAttribute('data-mode') === 'turn' ? 'turn' : 'frag', def = host.getAttribute('data-ch') || (mode === 'turn' ? 'hms' : 'hm');
    var vals = (host.getAttribute('data-v') || (mode === 'turn' ? '75340' : '3,25')).split(',').map(Number);
    host.className += ' t1w';
    host.innerHTML = '<div class="t1wrow"><label class="fld"><span class="wlabel">Какие меры</span><select class="wsel">' + chainOptions(def) + '</select></label>' +
      (mode === 'frag' ? [0, 1, 2].map(function (k) { return '<label class="fld t1f' + k + '"><span class="wlabel t1l' + k + '"></span>' + inp('t1i' + k, vals[k] != null ? vals[k] : 0) + '</label>'; }).join('')
        : '<label class="fld"><span class="wlabel t1lt"></span>' + inp('t1it', vals[0]) + '</label>') +
      '</div><div class="w-out" aria-live="polite"></div>';
    var sel = host.querySelector('select'), out = host.querySelector('.w-out');
    var ins = mode === 'frag' ? [0, 1, 2].map(function (k) { return host.querySelector('.t1i' + k); }) : [host.querySelector('.t1it')];
    function upd() {
      var C = chn(sel.value), n = C.u.length, h = '', k;
      if (mode === 'frag') {
        for (k = 0; k < 3; k++) {
          host.querySelector('.t1f' + k).style.display = k < n ? '' : 'none';
          if (k < n) host.querySelector('.t1l' + k).textContent = lab(C.u[k]);
        }
        var v = []; for (k = 0; k < n; k++) v.push(digs(ins[k], 4));
        if (v.slice(1).some(function (x, i) { return x >= C.f[i]; })) {
          out.innerHTML = '<p class="facts t1warn">В составном числе мелких мер должно быть меньше, чем в одной крупной: ' + C.f.map(function (f, i) { return fact(C, i); }).join('; ') + '.</p>';
          return;
        }
        var L = fragLines(C, v);
        h = '<p class="facts">' + C.f.map(function (f, i) { return fact(C, i); }).join('; ') + '.</p>' + '<p class="facts">' + plainSteps(L.lines) + '</p>' +
          '<p class="facts"><b>' + qt(C, v) + ' = ' + nu(L.t, last(C)) + '</b></p>';
      } else {
        host.querySelector('.t1lt').textContent = 'Сколько ' + W[last(C)].gen;
        var T = digs(ins[0], 8);
        h = '<p class="facts">' + C.f.map(function (f, i) { return fact(C, i); }).join('; ') + '. Делим по очереди.</p>' + '<p class="facts">' + plainSteps(turnLines(C, T)) + '</p>' +
          '<p class="facts"><b>' + nu(T, last(C)) + ' = ' + qt(C, spl(C, T)) + '</b></p>';
      }
      out.innerHTML = h;
    }
    sel.addEventListener('change', upd);
    ins.forEach(function (i) { R.groupInput(i, 8); i.addEventListener('input', upd); });
    upd();
  };

  /* столбик сложения или вычитания: data-op="+" | "-", data-ch="hm", data-v="3,45,2,50" */
  R.widgetMounts.t1calc = function (host) {
    var op = host.getAttribute('data-op') === '-' ? '−' : '+', def = host.getAttribute('data-ch') || 'hm';
    var vals = (host.getAttribute('data-v') || (op === '+' ? '2,45,3,50' : '6,20,2,45')).split(',').map(Number);
    var names = op === '+' ? ['Первое слагаемое', 'Второе слагаемое'] : ['Уменьшаемое', 'Вычитаемое'];
    host.className += ' t1w';
    function row(r) {
      return '<div class="t1wrow"><span class="wlabel t1rn">' + names[r] + '</span>' + [0, 1, 2].map(function (k) {
        return '<span class="t1cell t1c' + r + k + '">' + inp('t1i' + r + k, vals[r * 2 + k] != null && k < 2 ? vals[r * 2 + k] : 0) + '<span class="t1ul"></span></span>';
      }).join('') + '</div>';
    }
    host.innerHTML = '<div class="t1wrow"><label class="fld"><span class="wlabel">Какие меры</span><select class="wsel">' + chainOptions(def, ['hm', 'ms', 'sh', 'wd', 'ym', 'hms']) + '</select></label></div>' + row(0) + row(1) + '<div class="w-out" aria-live="polite"></div>';
    var sel = host.querySelector('select'), out = host.querySelector('.w-out');
    var ins = [[0, 1, 2].map(function (k) { return host.querySelector('.t1i0' + k); }), [0, 1, 2].map(function (k) { return host.querySelector('.t1i1' + k); })];
    function upd() {
      var C = chn(sel.value), n = C.u.length, r, k, a = [], b = [];
      for (r = 0; r < 2; r++) for (k = 0; k < 3; k++) {
        host.querySelector('.t1c' + r + k).style.display = k < n ? '' : 'none';
        if (k < n) host.querySelector('.t1c' + r + k + ' .t1ul').textContent = lab(C.u[k]);
      }
      for (k = 0; k < n; k++) { a.push(digs(ins[0][k], 4)); b.push(digs(ins[1][k], 4)); }
      var bad = [a, b].some(function (v) { return v.slice(1).some(function (x, i) { return x >= C.f[i]; }); });
      if (bad) { out.innerHTML = '<p class="facts t1warn">В мелкой мере должно быть меньше ' + C.f.join(' и ') + ' (' + C.f.map(function (f, i) { return fact(C, i); }).join('; ') + '). Сначала преврати лишнее в крупную меру.</p>'; return; }
      if (!tot(C, a) || !tot(C, b)) { out.innerHTML = '<p class="facts t1warn">Впиши оба числа.</p>'; return; }
      if (op === '−' && tot(C, a) <= tot(C, b)) { out.innerHTML = '<p class="facts t1warn">Вычитаемое должно быть меньше уменьшаемого.</p>'; return; }
      out.innerHTML = R.t1ColHTML(op, C, [a, b], { check: true });
    }
    sel.addEventListener('change', upd);
    ins.forEach(function (row2) { row2.forEach(function (i) { R.groupInput(i, 4); i.addEventListener('input', upd); }); });
    upd();
  };

  /* часы с двойным обозначением: ползунки часа и минут */
  R.widgetMounts.t1clock = function (host) {
    host.className += ' t1w';
    var h0 = Number(host.getAttribute('data-h')) || 15, m0 = Number(host.getAttribute('data-m')) || 20;
    host.innerHTML = '<div class="t1wrow t1ck"><div class="t1cf"></div><div class="t1cc">' +
      '<label class="fld"><span class="wlabel">Часы (по 24-часовому счёту): <b class="t1hv"></b></span><input class="t1rng t1rh" type="range" min="1" max="24" step="1" value="' + h0 + '"></label>' +
      '<label class="fld"><span class="wlabel">Минуты: <b class="t1mv"></b></span><input class="t1rng t1rm" type="range" min="0" max="55" step="5" value="' + m0 + '"></label>' +
      '<div class="w-out" aria-live="polite"></div></div></div>';
    var rh = host.querySelector('.t1rh'), rm = host.querySelector('.t1rm'), face = host.querySelector('.t1cf'), out = host.querySelector('.w-out');
    function upd() {
      var h = Number(rh.value), m = Number(rm.value);
      host.querySelector('.t1hv').textContent = h; host.querySelector('.t1mv').textContent = m;
      face.innerHTML = R.t1ClockSVG(h, m, { dual: true, size: 210, label: 'Часы с двойным обозначением времени' });
      var tx = '<p class="facts">По 24-часовому счёту: <b>' + hmTxt(h, m) + '</b>.</p><p class="facts">Обычными словами: <b>' + wordTime(h, m) + '</b>.</p>';
      if (h > 12) tx += '<p class="facts">Короткая стрелка стоит у цифры ' + h12(h) + ' (чёрная цифра), а красная цифра рядом с ней — ' + h + '. Видишь: ' + h12(h) + ' + 12 = ' + h + '.</p>';
      else if (h === 12) tx += '<p class="facts">Полдень: на обоих счётах 12 ч.</p>';
      else tx += '<p class="facts">До полудня красные цифры не нужны: час читаем по чёрным.</p>';
      out.innerHTML = tx;
    }
    rh.addEventListener('input', upd); rm.addEventListener('input', upd);
    upd();
  };

  /* @@INSERT-G */

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
