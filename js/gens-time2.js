/* Блок «Время: умножение и деление» (уроки 132–142).
   Составные именованные числа в мерах времени (сут., ч, мин, с; год, мес.) и метрические меры:
   сложение, вычитание, умножение на число, деление на число и на именованное число, выражения, задачи.
   Префикс имён — t2 / R.t2…; классы CSS — .t2…
   Все числа строятся от ответа обратным ходом, деление всегда нацело. */
(function (G) {
  'use strict';
  var R = G.RKS;
  var rand = R.rand, pick = R.pick, shuffle = R.shuffle, fmt = R.fmt, NB = R.NB;
  var gens = R.gens;
  var MINE = [];
  function reg(name, fn) {
    if (gens[name]) throw new Error('дубль ' + name);
    gens[name] = function (o) {
      var q = fn(o);
      q.html = tdy(q.html); q.hint = tdy(q.hint); q.explain = tdy(q.explain);
      return q;
    };
    MINE.push(name);
  }
  function tdy(t) { return typeof t === 'string' ? R.tidy(t).replace(/\.<\/b>\./g, '.</b>').replace(/\.<\/span>\./g, '.</span>') : t; }
  function plur(n, a, b, c) { return R.plural(n, [a, b, c]); }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }

  /* ================= единицы измерения ================= */
  /* size — число самых мелких единиц своего «измерения» в одной такой единице */
  var UN = {
    'сут': { s: 'сут.', nom: 'Сутки', loc: 'сутках', dat: 'суткам', gen: 'суток', lbl: 'сут.', dim: 'time', size: 86400 },
    'ч':   { s: 'ч', nom: 'Часы', loc: 'часах', dat: 'часам', gen: 'часов', lbl: 'ч', dim: 'time', size: 3600 },
    'мин': { s: 'мин', nom: 'Минуты', loc: 'минутах', dat: 'минутам', gen: 'минут', lbl: 'мин', dim: 'time', size: 60 },
    'с':   { s: 'с', nom: 'Секунды', loc: 'секундах', dat: 'секундам', gen: 'секунд', lbl: 'с', dim: 'time', size: 1 },
    'год': { f: ['год', 'года', 'лет'], nom: 'Годы', loc: 'годах', dat: 'годам', gen: 'лет', lbl: 'лет', dim: 'yr', size: 12 },
    'мес': { s: 'мес.', nom: 'Месяцы', loc: 'месяцах', dat: 'месяцам', gen: 'месяцев', lbl: 'мес.', dim: 'yr', size: 1 },
    'км':  { s: 'км', nom: 'Километры', loc: 'километрах', gen: 'километров', lbl: 'км', dim: 'len', size: 1e6 },
    'м':   { s: 'м', nom: 'Метры', loc: 'метрах', gen: 'метров', lbl: 'м', dim: 'len', size: 1000 },
    'дм':  { s: 'дм', nom: 'Дециметры', loc: 'дециметрах', gen: 'дециметров', lbl: 'дм', dim: 'len', size: 100 },
    'см':  { s: 'см', nom: 'Сантиметры', loc: 'сантиметрах', gen: 'сантиметров', lbl: 'см', dim: 'len', size: 10 },
    'мм':  { s: 'мм', nom: 'Миллиметры', loc: 'миллиметрах', gen: 'миллиметров', lbl: 'мм', dim: 'len', size: 1 },
    'т':   { s: 'т', nom: 'Тонны', loc: 'тоннах', gen: 'тонн', lbl: 'т', dim: 'wt', size: 1e6 },
    'ц':   { s: 'ц', nom: 'Центнеры', loc: 'центнерах', gen: 'центнеров', lbl: 'ц', dim: 'wt', size: 1e5 },
    'кг':  { s: 'кг', nom: 'Килограммы', loc: 'килограммах', gen: 'килограммов', lbl: 'кг', dim: 'wt', size: 1000 },
    'г':   { s: 'г', nom: 'Граммы', loc: 'граммах', gen: 'граммов', lbl: 'г', dim: 'wt', size: 1 },
    'руб': { s: 'руб.', nom: 'Рубли', loc: 'рублях', gen: 'рублей', lbl: 'руб.', dim: 'money', size: 100 },
    'коп': { s: 'коп.', nom: 'Копейки', loc: 'копейках', gen: 'копеек', lbl: 'коп.', dim: 'money', size: 1 }
  };
  function ulab(u, n) { var d = UN[u]; return d.f ? plur(n, d.f[0], d.f[1], d.f[2]) : d.s; }
  function nu(n, u) { return fmt(n) + NB + ulab(u, n); }                     /* «20 мин» */
  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function expr(s) { return '<span class="expr t2e">' + s + '</span>'; }
  var SOFT0 = '<br><span class="soft">Нет меры — впиши 0.</span>';

  /* ---------- системы мер: цепочка соседних единиц ---------- */
  var MC = {};
  function M_(key) {
    if (MC[key]) return MC[key];
    var units = key.split('-'), n = units.length, f = [], size = [], i;
    for (i = 0; i < n - 1; i++) f.push(UN[units[i]].size / UN[units[i + 1]].size);
    for (i = 0; i < n; i++) size.push(UN[units[i]].size / UN[units[n - 1]].size);
    return (MC[key] = { key: key, units: units, n: n, f: f, size: size, dim: UN[units[0]].dim, last: units[n - 1], first: units[0] });
  }
  function toT(M, parts) { var t = 0; for (var i = 0; i < M.n; i++) t += parts[i] * M.size[i]; return t; }
  function split(M, t) {
    var p = [], i;
    for (i = 0; i < M.n; i++) { p.push(Math.floor(t / M.size[i])); t = t % M.size[i]; }
    return p;
  }
  function nm(M, parts, all) {
    var out = [];
    for (var i = 0; i < M.n; i++) if (parts[i] || all) out.push(nu(parts[i], M.units[i]));
    if (!out.length) out.push(nu(0, M.last));
    return out.join(' ');
  }
  function nf(M, t) { return nm(M, split(M, t)); }
  function fieldsOf(M) { return M.units.map(function (u) { return { label: UN[u].lbl }; }); }
  function ansB(M, t) { return '<b>' + nf(M, t) + '</b>'; }
  function fact1(ub, us) { return nu(1, ub) + ' = ' + nu(UN[ub].size / UN[us].size, us); }
  function factsOf(M) {
    var out = [];
    for (var i = 0; i < M.n - 1; i++) out.push(fact1(M.units[i], M.units[i + 1]));
    return out.join('; ');
  }
  function plainSteps(list) { return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>'); }
  function lines(list) { return list.join('<br>'); }
  var TIME_SYS = ['ч-мин', 'мин-с', 'сут-ч', 'ч-мин-с', 'сут-ч-мин'];
  var METRIC_SYS = ['км-м', 'м-см', 'т-кг', 'ц-кг', 'кг-г', 'руб-коп'];
  R.t2M = M_; R.t2Nm = function (key, parts) { return nm(M_(key), parts); }; R.t2Nf = function (key, t) { return nf(M_(key), t); };
  R.t2Nu = nu;

  /* ---------- случайные величины ---------- */
  function lowPart(f) {
    var r = Math.random();
    if (f === 60) return r < 0.6 ? pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]) : rand(1, 59);
    if (f === 24) return r < 0.5 ? pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 18, 20, 21, 22]) : rand(1, 23);
    if (f === 12) return rand(1, 11);
    if (f === 1000) return r < 0.45 ? rand(1, 199) * 5 : r < 0.75 ? rand(1, 99) * 10 : rand(1, 999);
    if (f === 100) return r < 0.65 ? rand(1, 19) * 5 : rand(1, 99);
    if (f === 10) return rand(1, 9);
    return rand(1, f - 1);
  }
  function topRange(M) {
    switch (M.key) {
      case 'ч-мин': return [1, 12];
      case 'мин-с': return [1, 45];
      case 'сут-ч': return [1, 20];
      case 'ч-мин-с': return [1, 9];
      case 'сут-ч-мин': return [1, 9];
      case 'сут-ч-мин-с': return [2, 30];
      case 'год-мес': return [1, 30];
      case 'км-м': return [2, 60];
      case 'м-см': case 'ц-кг': case 'кг-г': return [2, 90];
      case 'т-кг': return [2, 60];
      default: return [2, 60];
    }
  }
  /* составное число: все меры ненулевые; o.top = [от, до] */
  function mkQ(M, o) {
    o = o || {};
    var r = o.top || topRange(M), parts = [rand(r[0], r[1])], i;
    for (i = 1; i < M.n; i++) parts.push(lowPart(M.f[i - 1]));
    return { M: M, parts: parts, t: toT(M, parts) };
  }
  function opd(M, parts) { return { M: M, parts: parts, t: toT(M, parts), base: toT(M, parts) * UN[M.last].size, txt: nm(M, parts) }; }
  function opdT(M, t) { return opd(M, split(M, t)); }

  /* ================= вычисления по мерам ================= */
  function addCalc(M, pa, pb) {
    var lv = [], carry = 0, i, nc = 0;
    for (i = M.n - 1; i >= 0; i--) {
      var val = pa[i] + pb[i] + carry, f = i > 0 ? M.f[i - 1] : 0;
      lv[i] = { a: pa[i], b: pb[i], cin: carry, val: val, dig: i > 0 ? val % f : val, cout: i > 0 ? Math.floor(val / f) : 0 };
      carry = lv[i].cout; if (carry) nc++;
    }
    var res = lv.map(function (x) { return x.dig; });
    return { lv: lv, res: res, t: toT(M, res), nc: nc };
  }
  function subCalc(M, pa, pb) {
    var lv = [], borrow = 0, i, nb = 0;
    for (i = M.n - 1; i >= 0; i--) {
      var a = pa[i] - borrow, add = 0, bo = 0;
      if (a < pb[i] && i > 0) { add = M.f[i - 1]; bo = 1; nb++; }
      lv[i] = { a0: pa[i], bin: borrow, a: a, add: add, cur: a + add, b: pb[i], dig: a + add - pb[i], bout: bo };
      borrow = bo;
    }
    var res = lv.map(function (x) { return x.dig; });
    return { lv: lv, res: res, t: toT(M, res), nb: nb };
  }
  function mulCalc(M, parts, k) {
    var lv = [], carry = 0, i, nc = 0;
    for (i = M.n - 1; i >= 0; i--) {
      var raw = parts[i] * k, val = raw + carry, f = i > 0 ? M.f[i - 1] : 0;
      lv[i] = { p: parts[i], raw: raw, cin: carry, val: val, dig: i > 0 ? val % f : val, cout: i > 0 ? Math.floor(val / f) : 0 };
      carry = lv[i].cout; if (carry) nc++;
    }
    var res = lv.map(function (x) { return x.dig; });
    return { lv: lv, res: res, t: toT(M, res), nc: nc };
  }
  function divCalc(M, parts, k) {
    var lv = [], rem = 0, i, q = [];
    for (i = 0; i < M.n; i++) {
      var cur = (i === 0) ? parts[0] : rem * M.f[i - 1] + parts[i];
      var x = { p: parts[i], rin: rem, cur: cur, q: Math.floor(cur / k), r: cur % k };
      lv.push(x); q.push(x.q); rem = x.r;
    }
    return { lv: lv, res: q, rem: rem, t: toT(M, q), nr: lv.filter(function (x) { return x.r > 0; }).length };
  }

  /* ---------- пояснения (строки текста) ---------- */
  function addLines(M, pa, pb) {
    var c = addCalc(M, pa, pb), L = [], i;
    for (i = M.n - 1; i >= 0; i--) {
      var x = c.lv[i], u = M.units[i], s = UN[u].nom + ': ' + fmt(x.a) + ' + ' + fmt(x.b) + (x.cin ? ' + ' + x.cin + ' (запомнили)' : '') + ' = ' + nu(x.val, u);
      if (i > 0 && x.cout) {
        var ub = M.units[i - 1];
        s += '. ' + fact1(ub, u) + ', поэтому ' + nu(x.val, u) + ' = ' + nu(x.cout, ub) + (x.dig ? ' ' + nu(x.dig, u) : ' ровно') + ': ' +
          (x.dig ? 'пишем ' + x.dig + ', ' : 'пишем 0, ') + 'запоминаем ' + nu(x.cout, ub) + '.';
      } else if (i > 0) s += ': пишем ' + fmt(x.dig) + '.';
      else s += '.';
      L.push(s);
    }
    return L;
  }
  function subLines(M, pa, pb) {
    var c = subCalc(M, pa, pb), L = [], i;
    for (i = M.n - 1; i >= 0; i--) {
      var x = c.lv[i], u = M.units[i], s = UN[u].nom + ': ', ub = i > 0 ? M.units[i - 1] : null;
      if (x.bin) s += (x.a0 > 0 ? nu(x.a0, u) + ' − ' + nu(1, u) + ' (заняли) = ' + nu(x.a, u) : 'было 0, а 1 заняли — не хватает') + '. ';
      if (x.bout) {
        var f = M.f[i - 1];
        s += (x.a < 0 ? '' : nu(x.a, u) + ' меньше ' + nu(x.b, u) + '. ') + 'Занимаем 1 ' + ulab(ub, 1) + ' = ' + nu(f, u) + ': ' + fmt(x.a) + ' + ' + fmt(f) + ' = ' + nu(x.cur, u) + '; ' + fmt(x.cur) + ' − ' + fmt(x.b) + ' = ' + nu(x.dig, u) + '.';
      } else {
        s += fmt(x.a) + ' − ' + fmt(x.b) + ' = ' + nu(x.dig, u) + '.';
      }
      L.push(s);
    }
    return L;
  }
  /* умножение: A × k по мерам */
  function mulDecomp(a, k) {
    if (k < 10) return '';
    var tens = Math.floor(k / 10) * 10, un = k % 10;
    if (a * k < 200) return '';
    if (!un) return k === 10 ? fmt(a) + ' × 10 = ' + fmt(a * 10) : fmt(a) + ' × ' + fmt(k) + ' = ' + fmt(a * (k / 10)) + ' × 10 = ' + fmt(a * k);
    return fmt(a) + ' × ' + fmt(k) + ' = ' + fmt(a) + ' × ' + tens + ' + ' + fmt(a) + ' × ' + un + ' = ' + fmt(a * tens) + ' + ' + fmt(a * un) + ' = ' + fmt(a * k);
  }
  function mulLines(M, parts, k) {
    var c = mulCalc(M, parts, k), L = [], i;
    for (i = M.n - 1; i >= 0; i--) {
      var x = c.lv[i], u = M.units[i], ub = i > 0 ? M.units[i - 1] : null;
      var s = UN[u].nom + ': ' + (k >= 10 && x.raw >= 200 ? mulDecomp(x.p, k) + NB + ulab(u, x.raw) : fmt(x.p) + ' × ' + fmt(k) + ' = ' + nu(x.raw, u));
      if (x.cin) s += ', и ещё ' + nu(x.cin, u) + ' запомненных: ' + fmt(x.raw) + ' + ' + fmt(x.cin) + ' = ' + nu(x.val, u);
      if (i > 0 && x.cout) {
        s += '. ' + fact1(ub, u) + ', поэтому ' + nu(x.val, u) + ' = ' + nu(x.cout, ub) + (x.dig ? ' ' + nu(x.dig, u) : ' ровно') + ': ' +
          (x.dig ? 'пишем ' + x.dig + ', ' : 'мелких мер не осталось, пишем 0, ') + 'запоминаем ' + nu(x.cout, ub) + '.';
      } else if (i > 0) s += '. Это меньше 1 ' + (ub === 'год' ? 'года' : ulab(ub, 1)) + ', переносить нечего: пишем ' + fmt(x.dig) + '.';
      else s += '.';
      L.push(s);
    }
    return L;
  }
  /* раздробление по шагам: parts → в самую мелкую меру */
  function toSmall(M, parts) {
    var L = [], cur = parts[0], i;
    for (i = 1; i < M.n; i++) {
      var f = M.f[i - 1], big = cur * f;
      var s = nu(cur, M.units[i - 1]) + ' = ' + fmt(cur) + ' × ' + fmt(f) + ' = ' + nu(big, M.units[i]);
      if (parts[i]) s += ', и ещё ' + nu(parts[i], M.units[i]) + ': ' + fmt(big) + ' + ' + fmt(parts[i]) + ' = ' + nu(big + parts[i], M.units[i]);
      L.push(s + '.');
      cur = big + parts[i];
    }
    return { lines: L, t: cur };
  }
  /* превращение по шагам: t мелких мер → parts */
  function toBig(M, t) {
    var L = [], cur = t, i;
    for (i = M.n - 1; i >= 1; i--) {
      var f = M.f[i - 1], q = Math.floor(cur / f), r = cur % f;
      L.push(fmt(cur) + ' : ' + fmt(f) + ' = ' + fmt(q) + (r ? ' (ост. ' + r + ')' : '') + ', то есть ' + nu(cur, M.units[i]) + ' = ' + nu(q, M.units[i - 1]) + (r ? ' ' + nu(r, M.units[i]) : '') + '.');
      cur = q;
    }
    return L;
  }
  /* деление составного на число по мерам */
  function divLines(M, parts, k) {
    var c = divCalc(M, parts, k), L = [], i;
    for (i = 0; i < M.n; i++) {
      var x = c.lv[i], u = M.units[i], ub = i > 0 ? M.units[i - 1] : null, s = UN[u].nom + ': ';
      if (i > 0 && x.rin) s += 'остаток ' + nu(x.rin, ub) + ' = ' + nu(x.rin * M.f[i - 1], u) + (x.p ? '; ' + fmt(x.rin * M.f[i - 1]) + ' + ' + fmt(x.p) + ' = ' + nu(x.cur, u) : '') + '. ';
      if (x.cur < k) s += fmt(x.cur) + ' меньше ' + k + ', в частном ' + nu(0, u) + '; остаток ' + nu(x.cur, u) + '.';
      else s += fmt(x.cur) + ' : ' + k + ' = ' + nu(x.q, u) + (x.r ? ', остаток ' + nu(x.r, u) : ' (без остатка)') + '.';
      L.push(s);
    }
    return L;
  }
  /* число в мерах: (p0 × f0 + p1) × f1 + p2 */
  function hornerTxt(M, parts, extra) {
    var s = fmt(parts[0]), i;
    for (i = 1; i < M.n; i++) {
      s = (i > 1 ? '(' + s + ')' : s) + ' × ' + fmt(M.f[i - 1]) + (parts[i] ? ' + ' + fmt(parts[i]) : '');
    }
    return s;
  }
  /* число в одинаковых мерах: строка «3 ч 20 мин = 3 × 60 + 20 = 200 мин» */
  function convTo(X, cu) {
    var M = X.M, tsm = X.t, fac = UN[M.last].size / UN[cu].size, s;
    if (M.n === 1 && fac === 1) return { txt: X.txt + ' уже в ' + UN[cu].loc, v: X.t, same: true };
    if (M.n === 1) return { txt: X.txt + ' = ' + fmt(tsm) + ' × ' + fmt(fac) + ' = ' + nu(tsm * fac, cu), v: tsm * fac, same: false };
    s = X.txt + ' = ' + hornerTxt(M, X.parts) + ' = ' + nu(tsm, M.last);
    if (fac !== 1) s += ' = ' + fmt(tsm) + ' × ' + fmt(fac) + ' = ' + nu(tsm * fac, cu);
    return { txt: s, v: tsm * fac, same: false };
  }
  function commonUnit(A, B) {
    return UN[A.M.last].size <= UN[B.M.last].size ? A.M.last : B.M.last;
  }
  function divNamedLines(A, B) {
    var cu = commonUnit(A, B), a = convTo(A, cu), b = convTo(B, cu), L = [];
    if (a.same && b.same) L.push('Меры одинаковые (' + UN[cu].s + '), делим сразу: ' + fmt(a.v) + ' : ' + fmt(b.v) + ' = ' + fmt(a.v / b.v) + '.');
    else if (A.M.n === 1 && B.M.n === 1 && A.M.last === B.M.last) L.push('Меры одинаковые (' + UN[cu].s + '), делим сразу: ' + fmt(a.v) + ' : ' + fmt(b.v) + ' = ' + fmt(a.v / b.v) + '.');
    else {
      L.push('Выразим оба числа в одинаковых мерах, в ' + UN[cu].loc + ':');
      L.push(a.txt + '.'); L.push(b.txt + '.');
      L.push('Делим: ' + fmt(a.v) + ' : ' + fmt(b.v) + ' = ' + fmt(a.v / b.v) + '.');
    }
    L.push('Частное — число без наименования: оно показывает, сколько раз ' + B.txt + ' содержится в ' + A.txt + '.');
    return { L: L, a: a.v, b: b.v, q: a.v / b.v, cu: cu };
  }

  /* ================= рисунки и таблицы ================= */
  function unitCell(u, n) { return '<td class="u">' + ulab(u, n) + '</td>'; }
  /* строка столбика: vals — массив строк/чисел ('' — пусто), units: показывать ли названия */
  function trow(M, cls, sign, vals, units, parts) {
    var h = '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td class="op">' + (sign || '') + '</td>', i;
    for (i = 0; i < M.n; i++) {
      var v = vals[i];
      h += '<td class="d">' + (v === '' || v == null ? '' : (typeof v === 'number' ? fmt(v) : v)) + '</td>';
      h += (units && v !== '' && v != null) ? unitCell(M.units[i], parts ? parts[i] : v) : '<td class="u"></td>';
    }
    return h + '</tr>';
  }
  function blanks(M) { var a = []; for (var i = 0; i < M.n; i++) a.push(''); return a; }
  function lastOnly(M, v) { var a = blanks(M); a[M.n - 1] = v; return a; }
  function tableWrap(M, inner, label) {
    return '<table class="t2col" role="img" aria-label="' + label + '"><tbody>' + inner + '</tbody></table>';
  }
  function carryRow(M, c, key) {          /* key: 'cout' — перенос идёт в более крупную меру */
    var v = blanks(M), any = false, i;
    for (i = 0; i < M.n - 1; i++) { var co = c.lv[i + 1][key]; if (co) { v[i] = '+' + co; any = true; } }
    return any ? trow(M, 'cr', '', v, false) : '';
  }
  function addTable(M, pa, pb) {
    var c = addCalc(M, pa, pb), inner = carryRow(M, c, 'cout');
    inner += trow(M, '', '', pa, true, pa) + trow(M, '', '+', pb, true, pb) + trow(M, 'ln', '', c.res, true, c.res);
    return tableWrap(M, inner, nm(M, pa) + ' плюс ' + nm(M, pb) + ' равно ' + nf(M, c.t));
  }
  function subTable(M, pa, pb) {
    var c = subCalc(M, pa, pb), i, cr = blanks(M), any = false, mk = blanks(M);
    /* над уменьшаемым: «−1» у меры, из которой заняли, «+60» у меры, которой добавили */
    for (i = 0; i < M.n; i++) {
      var x = c.lv[i], txt = '';
      if (x.bin) txt += '−1';
      if (x.add) txt += (txt ? ' ' : '') + '+' + x.add;
      if (txt) { cr[i] = txt; any = true; }
    }
    var inner = any ? trow(M, 'cr', '', cr, false) : '';
    inner += trow(M, '', '', pa, true, pa) + trow(M, '', '−', pb, true, pb) + trow(M, 'ln', '', c.res, true, c.res);
    return tableWrap(M, inner, nm(M, pa) + ' минус ' + nm(M, pb) + ' равно ' + nf(M, c.t));
  }
  /* столбик умножения по мерам: множимое, множитель, произведения мер, переносы, ответ */
  function mulTable(M, parts, k) {
    var c = mulCalc(M, parts, k), i, raw = [], res = c.res;
    for (i = 0; i < M.n; i++) raw.push(c.lv[i].raw);
    var inner = trow(M, '', '', parts, true, parts) + trow(M, '', '×', lastOnly(M, k), false);
    inner += trow(M, 'ln raw', '', raw, true, raw);
    inner += carryRow(M, c, 'cout');
    inner += trow(M, 'ln res', '', res, true, res);
    return tableWrap(M, inner, nm(M, parts) + ' умножить на ' + k + ' равно ' + nf(M, c.t));
  }
  /* таблица деления по мерам */
  function divTable(M, parts, k) {
    var c = divCalc(M, parts, k), h = '<table class="t2dv" role="img" aria-label="' + nm(M, parts) + ' разделить на ' + k + ' равно ' + nf(M, c.t) + '"><thead><tr><th>мера</th><th>что делим</th><th>частное</th><th>остаток</th></tr></thead><tbody>', i;
    for (i = 0; i < M.n; i++) {
      var x = c.lv[i], u = M.units[i], what = '';
      if (i > 0 && x.rin && x.p) what = fmt(x.rin * M.f[i - 1]) + ' + ' + fmt(x.p) + ' = ' + fmt(x.cur) + ';<br>';
      what += fmt(x.cur) + ' : ' + k;
      h += '<tr><td>' + ulab(u, 2) + '</td><td>' + what + '</td><td class="q">' + nu(x.q, u) + '</td><td>' + (x.r ? nu(x.r, u) + (i < M.n - 1 ? ' = ' + nu(x.r * M.f[i], M.units[i + 1]) : '') : '—') + '</td></tr>';
    }
    return h + '</tbody></table>';
  }
  function flowHTML(steps) {
    return '<div class="t2flow">' + steps.map(function (st, i) {
      return '<div class="t2st"><b class="t2h">' + (i + 1) + '. ' + st.h + '</b><span class="t2t">' + st.t + '</span></div>';
    }).join('<span class="t2ar" aria-hidden="true">→</span>') + '</div>';
  }
  R.t2Flow = flowHTML;
  /* лестница мер времени */
  R.t2Ladder = function (o) {
    o = o || {};
    var steps = [['сут.', '24', 'ч'], ['ч', '60', 'мин'], ['мин', '60', 'с']], h = '<div class="t2ladder" role="img" aria-label="1 сутки = 24 часа, 1 час = 60 минут, 1 минута = 60 секунд">';
    h += '<span class="t2lu">сут.</span>';
    steps.forEach(function (s) {
      h += '<span class="t2la"><i>× ' + s[1] + '</i><i>: ' + s[1] + '</i></span><span class="t2lu">' + s[2] + '</span>';
    });
    return h + '</div>';
  };
  /* ленточная схема: k равных частей по partTxt, всего totalTxt (k = null — число частей неизвестно) */
  R.t2Tape = function (k, partTxt, totalTxt, o) {
    o = o || {};
    var W = 360, H = 104, bw = 76, dw = 34, x = 12, y = 30, h = 34, cells = [], i, s = '', many = (k == null || k > 4);
    if (!many) for (i = 0; i < k; i++) cells.push('b'); else cells = ['b', 'b', 'b', 'd', 'b'];
    var x0 = x;
    cells.forEach(function (c) {
      if (c === 'b') {
        s += '<rect class="r" x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="3"/>' +
          '<text x="' + (x + bw / 2) + '" y="' + (y + h / 2 + 5) + '" text-anchor="middle" style="font-size:12.5px">' + partTxt + '</text>';
        x += bw;
      } else {
        s += '<text x="' + (x + dw / 2) + '" y="' + (y + h / 2 + 6) + '" text-anchor="middle" style="font-size:20px">…</text>';
        x += dw;
      }
    });
    var x1 = x;
    s += '<path class="ra" d="M' + x0 + ' ' + (y + h + 10) + 'v8h' + (x1 - x0) + 'v-8"/>' +
      '<text x="' + ((x0 + x1) / 2) + '" y="' + (y + h + 38) + '" text-anchor="middle" style="font-size:14px">' + totalTxt + '</text>';
    if (o.top) s += '<text x="' + ((x0 + x1) / 2) + '" y="' + (y - 9) + '" text-anchor="middle" style="font-size:13px">' + o.top + '</text>';
    return '<svg class="fig t2tape" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="' + (o.label || 'Ленточная схема') + '">' + s + '</svg>';
  };

  /* ---------- готовые блоки для теории (вызываются из lessons-time2.js) ---------- */
  function colrow(table, L, tail) { return '<div class="colrow">' + table + '<div class="colsteps">' + plainSteps(L) + (tail ? '<br>' + tail : '') + '</div></div>'; }
  R.t2AddW = function (key, pa, pb) { var M = M_(key), c = addCalc(M, pa, pb); return colrow(addTable(M, pa, pb), addLines(M, pa, pb), '<b>Итого: ' + nf(M, c.t) + '</b>'); };
  R.t2SubW = function (key, pa, pb) { var M = M_(key), c = subCalc(M, pa, pb); return colrow(subTable(M, pa, pb), subLines(M, pa, pb), '<b>Итого: ' + nf(M, c.t) + '</b>'); };
  R.t2MulW = function (key, parts, k) { var M = M_(key), c = mulCalc(M, parts, k); return colrow(mulTable(M, parts, k), mulLines(M, parts, k), '<b>Итого: ' + nf(M, c.t) + '</b>'); };
  R.t2DivW = function (key, parts, k) { var M = M_(key), c = divCalc(M, parts, k); return '<div class="t2divrow">' + divTable(M, parts, k) + '<div class="colsteps">' + plainSteps(divLines(M, parts, k)) + '<br><b>Итого: ' + nf(M, c.t) + '</b></div></div>'; };
  /* способ «раздробить — выполнить — превратить» для умножения */
  function mulFragBlock(M, parts, k, withFlow) {
    var sm = toSmall(M, parts), t = sm.t, res = t * k, L = [], big = toBig(M, res), h = '';
    L.push('Раздробляем в ' + UN[M.last].loc + ': ' + (sm.lines.length ? sm.lines.join(' ') : nm(M, parts) + ' = ' + nu(t, M.last) + '.'));
    L.push('Умножаем как обычные числа: ' + fmt(t) + ' × ' + fmt(k) + ' = ' + fmt(res) + ', это ' + nu(res, M.last) + '.');
    L.push('Превращаем: ' + (big.length ? big.join(' ') : nu(res, M.last) + ' — дальше превращать нечего.') + ' Получилось ' + nf(M, res) + '.');
    if (withFlow) h += flowHTML([{ h: 'Раздробить', t: nm(M, parts) + '<br>= ' + nu(t, M.last) }, { h: 'Умножить', t: fmt(t) + ' × ' + fmt(k) + '<br>= ' + nu(res, M.last) }, { h: 'Превратить', t: nu(res, M.last) + '<br>= ' + nf(M, res) }]);
    return h + colrow(R.mulHTML(t, k), L, '<b>Итого: ' + nf(M, res) + '</b>');
  }
  R.t2MulFragW = function (key, parts, k, withFlow) { return mulFragBlock(M_(key), parts, k, withFlow); };
  R.t2DivFragW = function (key, parts, k) {
    var M = M_(key), sm = toSmall(M, parts), t = sm.t, q = t / k, big = toBig(M, q), L = [];
    L.push('Раздробляем делимое: ' + (sm.lines.length ? sm.lines.join(' ') : nm(M, parts) + ' = ' + nu(t, M.last) + '.'));
    L.push('Делим: ' + fmt(t) + ' : ' + fmt(k) + ' = ' + fmt(q) + ', это ' + nu(q, M.last) + '.');
    L.push('Превращаем: ' + (big.length ? big.join(' ') : nu(q, M.last) + ' — дальше превращать нечего.') + ' Получилось ' + nf(M, q) + '.');
    return colrow(R.divHTML(t, k), L, '<b>Итого: ' + nf(M, q) + '</b>');
  };
  R.t2ConvW = function (key, parts) {
    var M = M_(key), sm = toSmall(M, parts);
    return plainSteps(sm.lines);
  };
  R.t2DivNamedW = function (keyA, pa, keyB, pb) {
    var A = opd(M_(keyA), pa), B = opd(M_(keyB), pb), d = divNamedLines(A, B);
    var col = (d.a >= 100 && d.b >= 10) ? R.divHTML(d.a, d.b) : '';
    return '<div class="colrow">' + col + '<div class="colsteps">' + plainSteps(d.L) + '</div></div>';
  };

  /* @@INSERT-1 */

  /* ================= устный счёт: раздробление и превращение ================= */
  var CONV_PAIRS = [['ч', 'мин'], ['мин', 'с'], ['сут', 'ч'], ['ч', 'с'], ['сут', 'мин'], ['год', 'мес']];
  function pairFactor(a, b) { return UN[a].size / UN[b].size; }
  reg('t2Conv', function (o) {
    o = o || {};
    var dir = o.dir || pick(['down', 'comp', 'up', 'turn']), M, q, k, pr, f, t;
    if (dir === 'down' || dir === 'up') {
      pr = pick(o.pairs || CONV_PAIRS); f = pairFactor(pr[0], pr[1]);
      var kk = f >= 3600 ? pick([2, 3, 4, 5, 6, 8, 9, 10]) : f >= 1000 ? pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]) : pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 24, 25, 30, 40, 45]);
      if (pr[0] === 'год') kk = pick([2, 3, 4, 5, 6, 8, 9, 10, 15, 20]);
      var fc = pairFactor(pr[0], pr[1]);
      var chain = (fc === 3600 ? '1 ч = 60 мин = 3 600 с' : fc === 1440 ? '1 сут. = 24 ч = 1 440 мин' : fact1(pr[0], pr[1]));
      if (dir === 'down') {
        var st = Math.random() < 0.5;
        return {
          kind: 'num',
          html: st ? 'Сколько ' + UN[pr[1]].gen + ' в ' + nu(kk, pr[0]) + '?' : 'Раздроби: ' + expr(nu(kk, pr[0]) + ' = □ ' + ulab(pr[1], 5)),
          answer: kk * fc,
          hint: chain + '. Крупную меру заменяем мелкой — умножаем.',
          explain: chain + '. Значит, ' + nu(kk, pr[0]) + ' = ' + fmt(kk) + ' × ' + fmt(fc) + ' ' + ulab(pr[1], 5) + ' = ' + nu(kk * fc, pr[1]) + '.'
        };
      }
      var st2 = Math.random() < 0.5;
      return {
        kind: 'num',
        html: st2 ? 'Сколько ' + UN[pr[0]].gen + ' в ' + nu(kk * fc, pr[1]) + '?' : 'Преврати: ' + expr(nu(kk * fc, pr[1]) + ' = □ ' + ulab(pr[0], 5)),
        answer: kk,
        hint: chain + '. Мелкую меру заменяем крупной — делим.',
        explain: chain + '. Значит, ' + nu(kk * fc, pr[1]) + ' = ' + fmt(kk * fc) + ' : ' + fmt(fc) + ' ' + ulab(pr[0], 5) + ' = ' + nu(kk, pr[0]) + '.'
      };
    }
    M = M_(pick(o.systems || ['ч-мин', 'мин-с', 'сут-ч', 'ч-мин-с', 'сут-ч-мин', 'год-мес']));
    if (dir === 'comp') {
      q = mkQ(M, { top: o.top });
      var sm = toSmall(M, q.parts);
      return {
        kind: 'num',
        html: 'Раздроби: ' + expr(nm(M, q.parts) + ' = □ ' + ulab(M.last, 5)),
        answer: q.t,
        hint: factsOf(M) + '. Переведи крупные меры в мелкие и прибавь то, что уже есть в мелких мерах.',
        explain: factsOf(M) + '. ' + sm.lines.join(' ') + ' Ответ: <b>' + nu(q.t, M.last) + '</b>.'
      };
    }
    /* turn: мелкие меры → в несколько мер */
    var top = o.top || (M.n === 2 ? [Math.max(2, topRange(M)[0]), M.key === 'сут-ч' ? 60 : M.key === 'ч-мин' ? 99 : M.key === 'мин-с' ? 99 : 40] : [2, 12]);
    q = mkQ(M, { top: top });
    var tb = toBig(M, q.t);
    return {
      kind: 'nums',
      html: 'Преврати в более крупные меры: ' + expr(nu(q.t, M.last) + ' = ' + M.units.map(function (u) { return '□ ' + ulab(u, 5); }).join(' ')) + SOFT0,
      fields: fieldsOf(M), answer: q.parts,
      hint: factsOf(M) + '. Дели на ' + (M.n === 2 ? fmt(M.f[0]) + ': частное — крупные меры, остаток — мелкие' : 'числа по очереди, начиная с мелких мер: остатки — это мелкие меры') + '.',
      explain: factsOf(M) + '. ' + tb.join(' ') + ' Значит, ' + nu(q.t, M.last) + ' = <b>' + nm(M, q.parts) + '</b>.'
    };
  });

  /* ================= сложение и вычитание в мерах ================= */
  reg('t2Op', function (o) {
    o = o || {};
    var op = o.op || pick(['add', 'sub']), M, A, B, c, g = 0, ok;
    do {
      M = M_(pick(o.systems || ['ч-мин', 'мин-с', 'сут-ч', 'ч-мин-с']));
      A = mkQ(M, { top: o.top }); B = mkQ(M, { top: o.top }); g++;
      if (op === 'sub') {
        if (A.t < B.t) { var tmp = A; A = B; B = tmp; }
        c = subCalc(M, A.parts, B.parts);
        ok = A.t > B.t && A.parts[0] >= B.parts[0];
        if (o.carry === true) ok = ok && c.nb > 0; else if (o.carry === false) ok = ok && c.nb === 0;
      } else {
        c = addCalc(M, A.parts, B.parts);
        ok = true;
        if (o.carry === true) ok = c.nc > 0; else if (o.carry === false) ok = c.nc === 0;
      }
    } while (!ok && g < 400);
    var sign = op === 'add' ? '+' : '−';
    var table = op === 'add' ? addTable(M, A.parts, B.parts) : subTable(M, A.parts, B.parts);
    var L = op === 'add' ? addLines(M, A.parts, B.parts) : subLines(M, A.parts, B.parts);
    var rest = c.res, tot = c.t;
    return {
      kind: 'nums',
      html: (op === 'add' ? 'Сложи' : 'Вычти') + ': ' + expr(nm(M, A.parts) + ' ' + sign + ' ' + nm(M, B.parts) + ' =') + SOFT0,
      fields: fieldsOf(M), answer: rest,
      hint: 'Ставь меры друг под другом и считай с самой мелкой. ' + factsOf(M) + '. ' + (op === 'add' ? 'Если мелких мер набралось много — преврати лишнее в крупные.' : 'Если мелких мер не хватает — займи одну крупную меру и раздроби её.'),
      explain: colrow(table, L, 'Ответ: ' + ansB(M, tot) + '.')
    };
  });

  /* ================= общие построители ================= */
  var TIME_ALL = ['ч-мин', 'мин-с', 'сут-ч', 'ч-мин-с', 'сут-ч-мин', 'год-мес'];
  var TIME_2 = ['ч-мин', 'мин-с', 'сут-ч', 'год-мес'];
  function capTop(M, k, o) {
    if (o && o.top) return o.top;
    var r = topRange(M).slice(), lim = Math.floor(500 / Math.max(1, k));
    r[1] = Math.max(r[0], Math.min(r[1], lim));
    return r;
  }
  function nonzero(parts) { return parts.filter(function (x) { return x > 0; }).length; }
  function mulBlock(M, parts, k, tail) {
    return colrow(mulTable(M, parts, k), mulLines(M, parts, k), tail);
  }
  function divBlock(M, parts, k, tail) {
    return '<div class="t2divrow">' + divTable(M, parts, k) + '<div class="colsteps">' + plainSteps(divLines(M, parts, k)) + (tail ? '<br>' + tail : '') + '</div></div>';
  }
  function addBlock(M, pa, pb, tail) { return colrow(addTable(M, pa, pb), addLines(M, pa, pb), tail); }
  function subBlock(M, pa, pb, tail) { return colrow(subTable(M, pa, pb), subLines(M, pa, pb), tail); }
  /* делим именованное на именованное: блок разбора */
  function dnBlock(A, B, tail) {
    var d = divNamedLines(A, B), col = (d.a >= 100 && d.b >= 10) ? R.divHTML(d.a, d.b) : '';
    return '<div class="colrow">' + col + '<div class="colsteps">' + plainSteps(d.L) + '<br>' + (tail || 'Ответ: <b>' + fmt(d.q) + '</b>.') + '</div></div>';
  }
  function eq(s) { return expr(s); }

  /* ================= умножение составного именованного числа ================= */
  function mulOperand(M, k, none, top) {
    var parts = [rand(top[0], top[1])], i, mx;
    for (i = 1; i < M.n; i++) {
      var f = M.f[i - 1];
      if (none) { mx = Math.floor((f - 1) / k); parts.push(mx >= 1 ? rand(1, mx) : lowPart(f)); }
      else parts.push(lowPart(f));
    }
    return parts;
  }
  /* A × k по мерам; o.k=[от,до]; o.carry true/false; o.zero — мелкая мера в ответе ровно 0; o.res 'small' — ответ в самой мелкой мере;
     o.way 'frag' — разбор способом «раздробить — умножить — превратить» */
  reg('t2Mul', function (o) {
    o = o || {};
    var kr = o.k || [2, 9], g = 0, M, k, parts, c, ok, systems = o.systems || TIME_ALL, top, f, cand, p;
    do {
      g++;
      M = M_(pick(systems)); k = rand(kr[0], kr[1]); ok = true;
      top = capTop(M, k, o);
      parts = mulOperand(M, k, o.carry === false, top);
      if (o.zero) {
        f = M.f[M.n - 2]; cand = [];
        for (p = 1; p < f; p++) if ((p * k) % f === 0) cand.push(p);
        if (!cand.length) { ok = false; continue; }
        parts[M.n - 1] = pick(cand);
      }
      c = mulCalc(M, parts, k);
      if (o.carry === true) ok = c.nc > 0;
      if (o.carry === false) ok = c.nc === 0;
      if (o.zero) ok = ok && c.res[M.n - 1] === 0 && c.nc > 0;
    } while (!ok && g < 800);
    var tm = nm(M, parts), tot = c.t;
    var hintMeas = factsOf(M) + '. Умножай каждую меру отдельно, начиная с самой мелкой. Если мелких мер набралось больше, чем в одной крупной, преврати лишнее в крупные и прибавь их к следующей мере.';
    if (o.res === 'small') {
      var sm = toSmall(M, parts), prod = sm.t * k;
      return {
        kind: 'num',
        html: 'Вырази результат в ' + UN[M.last].loc + ': ' + eq(tm + ' × ' + fmt(k) + ' = □ ' + ulab(M.last, 5)),
        answer: prod,
        hint: 'Сначала раздроби множимое в ' + UN[M.last].loc + ' (' + factsOf(M) + '), потом умножь на ' + fmt(k) + '.',
        explain: 'Раздробляем: ' + sm.lines.join(' ') + ' Умножаем: ' + fmt(sm.t) + ' × ' + fmt(k) + ' = ' + fmt(prod) + '. Ответ: <b>' + nu(prod, M.last) + '</b>.'
      };
    }
    if (o.way === 'frag') {
      return {
        kind: 'nums',
        html: 'Реши способом «раздробить — умножить — превратить»: ' + eq(tm + ' × ' + fmt(k) + ' =') + SOFT0,
        fields: fieldsOf(M), answer: c.res,
        hint: 'Раздроби множимое в ' + UN[M.last].loc + ', умножь на ' + fmt(k) + ' как обычные числа и преврати результат в крупные меры (' + factsOf(M) + ').',
        explain: mulFragBlock(M, parts, k, false)
      };
    }
    return {
      kind: 'nums',
      html: 'Умножь: ' + eq(tm + ' × ' + fmt(k) + ' =') + SOFT0,
      fields: fieldsOf(M), answer: c.res,
      hint: hintMeas,
      explain: mulBlock(M, parts, k, 'Ответ: ' + ansB(M, tot) + '.')
    };
  });

  /* одна мера × число, результат превращаем в крупные меры: 15 мин × 6 = 1 ч 30 мин */
  reg('t2MulOne', function (o) {
    o = o || {};
    var kr = o.k || [3, 12], g = 0, M, v, k, prod, f;
    do {
      g++;
      M = M_(pick(o.systems || TIME_2));
      f = M.f[0];
      v = f === 60 ? pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50]) : f === 24 ? pick([2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 21]) : rand(2, 11);
      k = rand(kr[0], kr[1]); prod = v * k;
    } while ((prod < f || prod >= f * 60 || (o.inexact && prod % f === 0)) && g < 500);
    var res = split(M, prod);
    return {
      kind: 'nums',
      html: 'Умножь и запиши результат в более крупных мерах: ' + eq(nu(v, M.last) + ' × ' + fmt(k) + ' =') + SOFT0,
      fields: fieldsOf(M), answer: res,
      hint: factsOf(M) + '. Сначала умножь, потом преврати результат: сколько целых ' + UN[M.units[0]].gen + ' в нём поместилось?',
      explain: fmt(v) + ' × ' + fmt(k) + ' = ' + nu(prod, M.last) + '. ' + factsOf(M) + '. ' + toBig(M, prod).join(' ') + ' Ответ: ' + ansB(M, prod) + '.'
    };
  });

  /* ================= деление составного именованного числа на число ================= */
  function divOperand(M, k, o) {
    /* возвращает {parts, q} — делимое и частное, деление нацело */
    var mode = o.rem || 'any', g = 0, top, qq, t, parts, i, c;
    var cap = Math.max(1, Math.min(topRange(M)[1], Math.floor(400 / k)));
    top = o.qtop || [1, cap];
    do {
      g++;
      if (mode === 'none') {
        parts = [k * rand(top[0], top[1])];
        for (i = 1; i < M.n; i++) {
          var mx = Math.floor((M.f[i - 1] - 1) / k);
          parts.push(mx >= 1 ? k * rand(1, mx) : 0);
        }
        if (parts.slice(1).some(function (x) { return x === 0; }) && M.n > 1 && Math.floor((M.f[0] - 1) / k) < 1) continue;
        parts = parts.map(function (x, j) { return j === 0 || x > 0 ? x : k; });
        if (parts.some(function (x, j) { return j > 0 && x >= M.f[j - 1]; })) continue;
      } else if (o.zeroTop) {
        qq = [0]; for (i = 1; i < M.n; i++) qq.push(i === 1 ? rand(Math.ceil(M.f[0] / k), M.f[0] - 1) : lowPart(M.f[i - 1]));
        t = toT(M, qq) * k; parts = split(M, t);
        if (parts[0] < 1 || parts[0] >= k) continue;
      } else {
        qq = mkQ(M, { top: top }); t = qq.t * k; parts = split(M, t);
      }
      c = divCalc(M, parts, k);
      if (c.rem !== 0) continue;
      if (!o.zeroTop && nonzero(parts.slice(1)) < 1) continue;
      if (mode === 'pass' && c.nr < 1) continue;
      if (mode === 'none' && c.nr > 0) continue;
      return { parts: parts, c: c };
    } while (g < 800);
    qq = mkQ(M, { top: [1, 3] }); t = qq.t * k; parts = split(M, t);
    return { parts: parts, c: divCalc(M, parts, k) };
  }
  var SIMPLE_D = { 'ч-мин': [2, 40], 'мин-с': [2, 59], 'сут-ч': [2, 30], 'год-мес': [2, 40], 'ч-мин-с': [2, 9], 'сут-ч-мин': [2, 9] };
  /* A : k по мерам; o.src 'simple' — делимое одна мера (23 ч : 5); o.rem 'none' | 'pass'; o.zeroTop — в частном первая мера 0 */
  reg('t2Div', function (o) {
    o = o || {};
    var kr = o.k || [2, 9], src = o.src || 'comp', systems = o.systems || TIME_ALL, g = 0, M, k, parts, c, ok, D, tot, key;
    if (src === 'simple') {
      do {
        g++; ok = true;
        M = M_(pick(systems)); key = SIMPLE_D[M.key] || [2, 20];
        k = rand(kr[0], kr[1]); D = rand(key[0], key[1]);
        tot = D * M.size[0];
        if (tot % k !== 0 || D % k === 0 || D < k) ok = false;
        if (ok) { parts = [D]; for (var i = 1; i < M.n; i++) parts.push(0); c = divCalc(M, parts, k); ok = c.rem === 0 && c.res[M.n - 1] !== 0; }
      } while (!ok && g < 800);
    } else {
      do {
        g++;
        M = M_(pick(systems)); k = rand(kr[0], kr[1]);
        var r = divOperand(M, k, o); parts = r.parts; c = r.c;
        ok = !(o.zeroTop && parts[0] >= k);
      } while (!ok && g < 200);
    }
    var tm = nm(M, parts);
    return {
      kind: 'nums',
      html: 'Раздели: ' + eq(tm + ' : ' + fmt(k) + ' =') + SOFT0,
      fields: fieldsOf(M), answer: c.res,
      hint: 'Дели, начиная с самой крупной меры. Остаток раздроби в следующую меру (' + factsOf(M) + ') и прибавь те меры, которые уже были в делимом.',
      explain: divBlock(M, parts, k, 'Ответ: ' + ansB(M, c.t) + '.')
    };
  });

  /* ================= деление именованного числа на именованное ================= */
  var DN_TIME = ['сут-ч', 'ч-мин', 'мин-с', 'сут-ч-мин', 'ч-мин-с'];
  var DN_METRIC = ['км-м', 'м-см', 'т-кг', 'ц-кг', 'кг-г', 'руб-коп'];
  var SS_TIME = [['ч', 'мин'], ['ч', 'мин'], ['мин', 'с'], ['мин', 'с'], ['сут', 'ч'], ['сут', 'ч'], ['ч', 'с'], ['год', 'мес']];
  var SS_METRIC = [['км', 'м'], ['м', 'см'], ['м', 'дм'], ['т', 'ц'], ['т', 'кг'], ['ц', 'кг'], ['кг', 'г'], ['руб', 'коп'], ['дм', 'см']];
  function gcd2(a, b) { return b ? gcd2(b, a % b) : a; }
  function simpleVal(M, j) {
    if (j === 0) return M.n === 1 ? rand(2, 40) : (M.key === 'км-м' || M.key === 'м-см' || M.key === 'т-кг' || M.key === 'ц-кг' || M.key === 'кг-г' || M.key === 'руб-коп' ? rand(2, 30) : rand(2, 12));
    return Math.max(2, lowPart(M.f[j - 1]));
  }
  function mkOpd(M, parts) { return opd(M, parts); }
  function topB(MB) { return MB.key === 'ч-мин' ? 6 : MB.key === 'мин-с' ? 12 : MB.key === 'сут-ч' ? 6 : 9; }
  /* shape: ss — оба простые; cs — составное : простое; sc — простое : составное; cc — оба составные */
  function dnBuild(shape, fam, qr) {
    var chains = fam === 'metric' ? DN_METRIC : DN_TIME, g = 0, MA, MB, A, B, q, parts, j, base, b;
    if (shape === 'ss') {
      var pairs = fam === 'metric' ? SS_METRIC : SS_TIME;
      do {
        g++;
        var pr = pick(pairs), fac = UN[pr[0]].size / UN[pr[1]].size;
        var D = pr[0] === 'мин' ? rand(2, 59) : pr[0] === 'год' ? rand(2, 40) : pr[0] === 'сут' ? rand(2, 20) : pr[0] === 'ч' ? rand(2, 30) :
          pr[0] === 'руб' ? rand(10, 99) : pr[0] === 'км' ? rand(2, 60) : rand(2, 99);
        var total = D * fac, divs = [];
        for (b = 2; b <= Math.min(fac - 1, 99); b++) if (total % b === 0 && total / b >= qr[0] && total / b <= qr[1] && b !== D) divs.push(b);
        if (!divs.length) continue;
        b = pick(divs);
        return { A: mkOpd(M_(pr[0]), [D]), B: mkOpd(M_(pr[1]), [b]), q: total / b };
      } while (g < 500);
      return null;
    }
    do {
      g++;
      MB = M_(pick(chains)); MA = Math.random() < 0.8 ? MB : M_(pick(chains));
      if (MA.dim !== MB.dim) continue;
      if (shape === 'sc') {
        B = mkOpd(MB, mkQ(MB, { top: [1, topB(MB)] }).parts);
        var usz = UN[MB.units[0]].size, mq = usz / gcd2(usz, B.base), qmax = Math.floor(qr[1] / mq);
        if (qmax < 1) continue;
        q = mq * rand(Math.max(1, Math.ceil(qr[0] / mq)), qmax);
        if (q < 2) continue;
        return { A: mkOpd(M_(MB.units[0]), [B.base * q / usz]), B: B, q: q };
      }
      if (shape === 'cs') {
        j = rand(0, MB.n - 1);
        B = mkOpd(M_(MB.units[j]), [simpleVal(MB, j)]);
      } else {
        B = mkOpd(MB, mkQ(MB, { top: [1, topB(MB)] }).parts);
      }
      q = rand(qr[0], qr[1]);
      base = B.base * q;
      if (base % UN[MA.last].size !== 0) continue;
      parts = split(MA, base / UN[MA.last].size);
      if (nonzero(parts) < 2 || parts[0] > 999) continue;
      return { A: mkOpd(MA, parts), B: B, q: q };
    } while (g < 3000);
    return null;
  }
  reg('t2DivNamed', function (o) {
    o = o || {};
    var shape = o.shape || pick(['ss', 'cs', 'sc', 'cc']), fam = o.fam || pick(['time', 'metric']), qr = o.q || [2, 60], r = null, tries = 0;
    if (Array.isArray(shape)) shape = pick(shape);
    while (!r && tries++ < 20) r = dnBuild(shape, fam, qr);
    if (!r) r = dnBuild('ss', fam, qr);
    var A = r.A, B = r.B, hint = 'Приведи делимое и делитель к одинаковым мерам (к более мелким) и дели как обычные числа. Частное — число без названия.';
    return {
      kind: 'num',
      html: 'Раздели: ' + eq(A.txt + ' : ' + B.txt + ' ='),
      answer: r.q,
      hint: hint,
      explain: dnBlock(A, B)
    };
  });

  /* ================= неизвестный компонент действия ================= */
  reg('t2Unk', function (o) {
    o = o || {};
    var types = Array.isArray(o.type) ? o.type : (o.type ? [o.type] : ['sum1', 'minus1', 'minus2', 'mulf', 'mulm', 'divd', 'divr']);
    var type = pick(types), M = M_(pick(o.systems || TIME_ALL)), form = o.form || pick(['word', 'eq']);
    var A, B, D, S, q, k, P, t, parts, html, hint, expl, ans, kind = 'nums', top = o.top;
    function Qs(tp) { return mkQ(M, { top: tp || top }); }
    var cap = function (m) { return capTop(M, m, o); };
    switch (type) {
      case 'sum1':
        A = Qs(); B = Qs(); t = A.t + B.t; S = split(M, t);
        html = form === 'word' ? 'Найди слагаемое, если сумма — ' + nf(M, t) + ', а другое слагаемое — ' + nm(M, B.parts) + '.'
          : 'Найди неизвестное слагаемое: ' + eq('□ + ' + nm(M, B.parts) + ' = ' + nf(M, t));
        hint = 'Чтобы найти слагаемое, из суммы вычти известное слагаемое.';
        expl = 'Слагаемое = сумма − известное слагаемое: ' + nf(M, t) + ' − ' + nm(M, B.parts) + '.' +
          subBlock(M, S, B.parts, 'Ответ: ' + ansB(M, A.t) + '. Проверка: ' + nm(M, A.parts) + ' + ' + nm(M, B.parts) + ' = ' + nf(M, t) + '.');
        ans = A.parts; break;
      case 'minus1':
        D = Qs(); B = Qs(); t = D.t + B.t; A = { parts: split(M, t), t: t };
        html = form === 'word' ? 'Найди уменьшаемое, если вычитаемое — ' + nm(M, B.parts) + ', а разность — ' + nm(M, D.parts) + '.'
          : 'Найди неизвестное уменьшаемое: ' + eq('□ − ' + nm(M, B.parts) + ' = ' + nm(M, D.parts));
        hint = 'Уменьшаемое = вычитаемое + разность.';
        expl = 'Уменьшаемое = вычитаемое + разность: ' + nm(M, B.parts) + ' + ' + nm(M, D.parts) + '.' +
          addBlock(M, B.parts, D.parts, 'Ответ: ' + ansB(M, t) + '. Проверка: ' + nf(M, t) + ' − ' + nm(M, B.parts) + ' = ' + nm(M, D.parts) + '.');
        ans = A.parts; break;
      case 'minus2':
        D = Qs(); B = Qs(); t = D.t + B.t; A = { parts: split(M, t), t: t };
        html = form === 'word' ? 'Найди вычитаемое, если уменьшаемое — ' + nf(M, t) + ', а разность — ' + nm(M, D.parts) + '.'
          : 'Найди неизвестное вычитаемое: ' + eq(nf(M, t) + ' − □ = ' + nm(M, D.parts));
        hint = 'Вычитаемое = уменьшаемое − разность.';
        expl = 'Вычитаемое = уменьшаемое − разность: ' + nf(M, t) + ' − ' + nm(M, D.parts) + '.' +
          subBlock(M, A.parts, D.parts, 'Ответ: ' + ansB(M, B.t) + '. Проверка: ' + nf(M, t) + ' − ' + nm(M, B.parts) + ' = ' + nm(M, D.parts) + '.');
        ans = B.parts; break;
      case 'mulf': {
        var qr = o.k || [2, 30];
        q = rand(qr[0], qr[1]); B = Qs(cap(q)); t = B.t * q; P = split(M, t);
        html = form === 'word' ? 'Найди множитель, если произведение — ' + nf(M, t) + ', а множимое — ' + nm(M, B.parts) + '.'
          : 'Найди неизвестный множитель: ' + eq(nm(M, B.parts) + ' × □ = ' + nf(M, t));
        hint = 'Множитель = произведение : множимое. Делимое и делитель — именованные числа, значит, приведи их к одним мерам.';
        expl = 'Множитель = произведение : множимое: ' + nf(M, t) + ' : ' + nm(M, B.parts) + '.' + dnBlock(opd(M, P), opd(M, B.parts)) +
          'Проверка: ' + nm(M, B.parts) + ' × ' + q + ' = ' + nf(M, t) + '.';
        ans = q; kind = 'num'; break;
      }
      case 'mulm': {
        var kr = o.k || [2, 9];
        k = rand(kr[0], kr[1]); A = Qs(cap(k)); t = A.t * k; P = split(M, t);
        html = form === 'word' ? 'Найди множимое, если множитель — ' + k + ', а произведение — ' + nf(M, t) + '.'
          : 'Найди неизвестное множимое: ' + eq('□ × ' + k + ' = ' + nf(M, t));
        hint = 'Множимое = произведение : множитель. Дели по мерам, начиная с самой крупной.';
        expl = 'Множимое = произведение : множитель: ' + nf(M, t) + ' : ' + k + '.' + divBlock(M, P, k, 'Ответ: ' + ansB(M, A.t) + '. Проверка: ' + nm(M, A.parts) + ' × ' + k + ' = ' + nf(M, t) + '.');
        ans = A.parts; break;
      }
      case 'divd': {
        var dt = o.dtype || pick(['named', 'abstract']);
        if (dt === 'named') {
          q = rand(2, 30); B = Qs(cap(q)); t = B.t * q;
          html = form === 'word' ? 'Найди делимое, если делитель — ' + nm(M, B.parts) + ', а частное — ' + q + '.'
            : 'Найди неизвестное делимое: ' + eq('□ : ' + nm(M, B.parts) + ' = ' + q);
          hint = 'Делимое = частное × делитель.';
          expl = 'Делимое = частное × делитель: ' + nm(M, B.parts) + ' × ' + q + '.' + mulBlock(M, B.parts, q, 'Ответ: ' + ansB(M, t) + '. Проверка: ' + nf(M, t) + ' : ' + nm(M, B.parts) + ' = ' + q + '.');
        } else {
          k = rand(2, 12); D = Qs(cap(k)); t = D.t * k;
          html = form === 'word' ? 'Найди делимое, если делитель — ' + k + ', а частное — ' + nm(M, D.parts) + '.'
            : 'Найди неизвестное делимое: ' + eq('□ : ' + k + ' = ' + nm(M, D.parts));
          hint = 'Делимое = частное × делитель. Умножай каждую меру на делитель.';
          expl = 'Делимое = частное × делитель: ' + nm(M, D.parts) + ' × ' + k + '.' + mulBlock(M, D.parts, k, 'Ответ: ' + ansB(M, t) + '. Проверка: ' + nf(M, t) + ' : ' + k + ' = ' + nm(M, D.parts) + '.');
        }
        ans = split(M, t); break;
      }
      default: {   /* divr */
        q = rand(2, 30); B = Qs(cap(q)); t = B.t * q; P = split(M, t);
        html = form === 'word' ? 'Найди делитель, если делимое — ' + nf(M, t) + ', а частное — ' + nm(M, B.parts) + '.'
          : 'Найди неизвестный делитель: ' + eq(nf(M, t) + ' : □ = ' + nm(M, B.parts));
        hint = 'Делитель = делимое : частное. Оба числа именованные — приведи их к одним мерам.';
        expl = 'Делитель = делимое : частное: ' + nf(M, t) + ' : ' + nm(M, B.parts) + '.' + dnBlock(opd(M, P), opd(M, B.parts)) +
          'Проверка: ' + nf(M, t) + ' : ' + q + ' = ' + nm(M, B.parts) + '.';
        ans = q; kind = 'num';
      }
    }
    var out = { kind: kind, html: html + (kind === 'nums' ? SOFT0 : ''), answer: ans, hint: hint, explain: expl };
    if (kind === 'nums') out.fields = fieldsOf(M);
    return out;
  });

  /* ================= выбор верного ответа: типичные ошибки ================= */
  function wrongF(f) { return f === 60 ? 100 : f === 24 ? 10 : f === 12 ? 10 : f === 1000 ? 100 : 10; }
  function optList(M, correct, cands, nOpt) {
    /* cands: [{p, why}] — частями; возвращает {options, ai, whys} */
    var seen = {}, list = [], key = nm(M, correct);
    seen[key] = 1;
    cands.forEach(function (c) {
      if (c.str == null) {
        if (c.p.some(function (x) { return x < 0 || !isFinite(x) || x !== Math.floor(x); })) return;
        c.str = nm(M, c.p);
      }
      if (seen[c.str]) return;
      seen[c.str] = 1; list.push(c);
    });
    var fill = [[1, 0], [-1, 0], [2, 0], [-2, 0], [0, 10], [0, -10], [3, 0]], fi = 0;
    while (list.length < nOpt - 1 && fi < fill.length) {
      var pp = correct.slice(); pp[0] += fill[fi][0]; pp[pp.length - 1] += fill[fi][1]; fi++;
      if (pp.some(function (x) { return x < 0; }) || (M.n > 1 && pp[pp.length - 1] >= M.f[M.n - 2])) continue;
      var st = nm(M, pp);
      if (seen[st]) continue;
      seen[st] = 1; list.push({ str: st, p: pp, why: 'арифметическая ошибка при умножении, делении, сложении или вычитании мер: проверь обратным действием.' });
    }
    list = list.slice(0, nOpt - 1);
    var items = shuffle([{ str: key, ok: true }].concat(list));
    return { options: items.map(function (x) { return x.str; }), ai: items.findIndex(function (x) { return x.ok; }), wrong: list };
  }
  function whyLines(wrong) {
    return wrong.map(function (c) { return '«' + c.str + '» — ' + c.why; }).join('<br>');
  }
  reg('t2Pick', function (o) {
    o = o || {};
    var op = o.op || pick(['add', 'sub', 'mul', 'div', 'divn']), M = M_(pick(o.systems || TIME_2)), f = M.f[0], wf = wrongF(f), u0 = M.units[0], u1 = M.units[1];
    var A, B, pa, pb, c, k, g = 0, cands, r, correct, html, hint, expl, sg;
    var loc1 = UN[u1].loc;
    if (op === 'mul') {
      do { g++; k = rand(o.k ? o.k[0] : 2, o.k ? o.k[1] : 9); pa = mulOperand(M, k, false, capTop(M, k, o)); c = mulCalc(M, pa, k); } while (c.nc === 0 && g < 300);
      var r0 = c.lv[0].raw, r1 = c.lv[1].raw;
      correct = c.res;
      cands = [
        { p: [r0, r1 % f], why: 'забыли прибавить запомненное (' + nu(Math.floor(r1 / f), u0) + ').' },
        { p: [r0 + Math.floor(r1 / wf), r1 % wf], why: 'превращали по ' + wf + ' вместо ' + f + ': ' + factsOf(M) + '.' },
        { p: [r0, r1], why: 'не превратили ' + nu(r1, u1) + ' в крупные меры.' },
        { p: [r0 + (r1 % f), Math.floor(r1 / f)], why: 'перепутали: целые ' + UN[u0].gen + ' надо запомнить, а остаток записать.' }
      ];
      r = optList(M, correct, cands, 4);
      html = 'Выбери верный ответ: ' + eq(nm(M, pa) + ' × ' + k + ' =');
      hint = 'Реши пример сам, потом найди ответ среди вариантов. Следи за переносом: ' + factsOf(M) + '.';
      expl = mulBlock(M, pa, k, 'Верно: <b>' + nf(M, c.t) + '</b>.') + 'Остальные варианты:<br>' + whyLines(r.wrong);
    } else if (op === 'add') {
      do { g++; pa = mkQ(M, o).parts; pb = mkQ(M, o).parts; c = addCalc(M, pa, pb); } while (c.nc === 0 && g < 300);
      var s0 = pa[0] + pb[0], s1 = pa[1] + pb[1];
      correct = c.res;
      cands = [
        { p: [s0, s1 % f], why: 'забыли прибавить запомненное (' + nu(1, u0) + ').' },
        { p: [s0 + Math.floor(s1 / wf), s1 % wf], why: 'превращали по ' + wf + ' вместо ' + f + '.' },
        { p: [s0, s1], why: 'не превратили ' + nu(s1, u1) + ' в крупные меры.' },
        { p: [s0, s1 % f + 1], why: 'запомненное (' + nu(1, u0) + ') прибавили не к ' + UN[u0].dat + ', а к ' + UN[u1].dat + '.' }
      ];
      r = optList(M, correct, cands, 4);
      html = 'Выбери верный ответ: ' + eq(nm(M, pa) + ' + ' + nm(M, pb) + ' =');
      hint = 'Сложи меры по отдельности, начиная с самой мелкой, и преврати лишнее.';
      expl = addBlock(M, pa, pb, 'Верно: <b>' + nf(M, c.t) + '</b>.') + 'Остальные варианты:<br>' + whyLines(r.wrong);
    } else if (op === 'sub') {
      do { g++; pa = mkQ(M, o).parts; pb = mkQ(M, o).parts; c = subCalc(M, pa, pb); } while ((c.nb === 0 || pa[0] <= pb[0] || pa[1] >= pb[1]) && g < 400);
      var a0 = pa[0], a1 = pa[1], b0 = pb[0], b1 = pb[1];
      correct = c.res;
      cands = [
        { p: [a0 - b0, a1 + f - b1], why: 'заняли ' + nu(1, u0) + ', но не уменьшили на 1 число ' + UN[u0].gen + ' в уменьшаемом.' },
        { p: [a0 - b0, b1 - a1], why: 'из большего числа ' + UN[u1].gen + ' вычли меньшее, а надо было занять и вычитать из уменьшаемого.' },
        { p: [a0 - b0 - 1, a1 + wf - b1], why: 'раздробили занятую единицу по ' + wf + ' вместо ' + f + ': ' + fact1(u0, u1) + '.' },
        { p: [a0 - b0 - 1, a1 + 1 - b1], why: 'заняли ' + nu(1, u0) + ', но прибавили к ' + UN[u1].dat + ' только 1.' }
      ];
      r = optList(M, correct, cands, 4);
      html = 'Выбери верный ответ: ' + eq(nm(M, pa) + ' − ' + nm(M, pb) + ' =');
      hint = 'Если вычитаемых ' + UN[u1].gen + ' больше, чем в уменьшаемом, займи одну ' + ulab(u0, 1) + ' и раздроби её: ' + factsOf(M) + '.';
      expl = subBlock(M, pa, pb, 'Верно: <b>' + nf(M, c.t) + '</b>.') + 'Остальные варианты:<br>' + whyLines(r.wrong);
    } else if (op === 'div') {
      do { g++; k = rand(o.k ? o.k[0] : 2, o.k ? o.k[1] : 9); var dd = divOperand(M, k, { rem: 'pass', qtop: o.qtop }); pa = dd.parts; c = dd.c; } while ((c.nr < 1 || pa[0] % k === 0) && g < 300);
      var p0 = pa[0], p1 = pa[1], q0 = Math.floor(p0 / k), rr = p0 % k, cur = rr * f + p1;
      correct = c.res;
      cands = [
        { p: [q0, Math.floor(p1 / k)], why: 'остаток ' + nu(rr, u0) + ' не раздробили и не поделили.' },
        { p: [q0, Math.floor(rr * f / k)], why: 'раздробили остаток, но забыли прибавить ' + nu(p1, u1) + ', которые были в делимом.' },
        { p: [q0, Math.floor((rr * wf + p1) / k)], why: 'раздробили остаток по ' + wf + ' вместо ' + f + '.' },
        { p: [q0, cur], why: 'раздробили остаток и сложили, но не поделили полученные ' + UN[u1].gen + ' на ' + k + '.' }
      ];
      r = optList(M, correct, cands, 4);
      html = 'Выбери верный ответ: ' + eq(nm(M, pa) + ' : ' + k + ' =');
      hint = 'Дели с самой крупной меры, остаток раздроби в следующую меру и прибавь меры, которые уже есть: ' + factsOf(M) + '.';
      expl = divBlock(M, pa, k, 'Верно: <b>' + nf(M, c.t) + '</b>.') + 'Остальные варианты:<br>' + whyLines(r.wrong);
    } else {   /* divn: составное : простое в мелкой мере */
      var dn = null;
      do { g++; dn = dnBuild('cs', o.fam || 'time', o.q || [2, 60]); } while ((!dn || dn.A.M.n !== 2 || dn.B.M.n !== 1 || dn.B.M.last !== dn.A.M.last) && g < 400);
      if (!dn || dn.A.M.n !== 2) dn = { A: opd(M_('ч-мин'), [12, 18]), B: opd(M_('мин'), [9]), q: 82 };
      A = dn.A; B = dn.B;
      var Mx = A.M, fx = Mx.f[0], wx = wrongF(fx), x0 = A.parts[0], x1 = A.parts[1], bv = B.parts[0], q = dn.q;
      var ustr = ulab(Mx.last, q);
      var raw = [
        { v: Math.floor((x0 * wx + x1) / bv), why: 'в ' + UN[Mx.units[0]].loc + ' считали по ' + wx + ' ' + UN[Mx.last].gen + ' вместо ' + fx + '.' },
        { v: Math.floor(x0 * fx / bv), why: 'забыли про ' + nu(x1, Mx.last) + ' в делимом: раздробили только ' + nu(x0, Mx.units[0]) + '.' },
        { str: fmt(q) + NB + ustr, why: 'частное при делении именованного числа на именованное не имеет названия.' },
        { v: Math.floor(x0 / bv), why: 'поделили числа ' + x0 + ' и ' + bv + ', не обращая внимания на меры.' },
        { v: q + 1, why: 'ошиблись при делении, проверь умножением.' }
      ];
      cands = raw.map(function (x) { return x.str ? { str: x.str, why: x.why } : { str: fmt(x.v), why: x.why, p: [x.v] }; });
      var seenS = {}; seenS[fmt(q)] = 1;
      var wl = cands.filter(function (x) { if (seenS[x.str]) return false; seenS[x.str] = 1; return true; }).slice(0, 3);
      var items = shuffle([{ str: fmt(q), ok: true }].concat(wl));
      r = { options: items.map(function (x) { return x.str; }), ai: items.findIndex(function (x) { return x.ok; }), wrong: wl };
      html = 'Выбери верный ответ: ' + eq(A.txt + ' : ' + B.txt + ' =');
      hint = 'Приведи оба числа к одной мере (к более мелкой) и дели. Частное — число без названия.';
      expl = dnBlock(A, B) + 'Остальные варианты:<br>' + whyLines(wl);
    }
    return { kind: 'choice', html: html, options: r.options, answer: r.ai, hint: hint, explain: expl };
  });

  /* ================= любое действие: метрические меры и меры времени ================= */
  var MIX_TIME = ['ч-мин', 'мин-с', 'сут-ч', 'ч-мин-с', 'сут-ч-мин'];
  reg('t2Mix', function (o) {
    o = o || {};
    var op = pick(o.ops || ['add', 'sub', 'mul', 'div', 'divn']), fam = o.fam || pick(['time', 'metric']);
    var sys = fam === 'time' ? (o.tsys || MIX_TIME) : (o.msys || METRIC_SYS);
    if (op === 'add' || op === 'sub') return gens.t2Op({ op: op, systems: sys, carry: o.carry });
    if (op === 'mul') return gens.t2Mul({ systems: sys, k: o.k || [2, 9] });
    if (op === 'div') return gens.t2Div({ systems: sys, k: o.k || [2, 9], rem: o.rem });
    return gens.t2DivNamed({ shape: o.shape || ['cs', 'cc', 'sc', 'ss'], fam: fam, q: o.q });
  });

  /* ================= устный счёт: цепочки с именованными числами ================= */
  var CHAIN_C = { 1000: [25, 50, 100, 200, 250, 500], 100: [5, 10, 20, 25, 50], 60: [5, 10, 15, 20, 30], 24: [2, 3, 4, 6, 8, 12], 12: [2, 3, 4, 6] };
  reg('t2Chain', function (o) {
    o = o || {};
    var pat = o.pat || pick(['p1', 'p2']), M = M_(pick(o.systems || ['кг-г', 'км-м', 'м-см', 'ч-мин', 'мин-с', 'ц-кг', 'т-кг'])), f = M.f[0], last = M.last;
    var C = pick(CHAIN_C[f] || [10, 20]), g = 0, steps, ans, A, html, expl, ok, k, j, v, Yv, Av, q1, m, n;
    if (pat === 'p1') {
      /* A : k + v : C = ответ */
      do {
        g++; k = rand(2, 9); j = rand(1, 3); v = j * C; ans = rand(3, 24);
        Yv = (ans - j) * C; Av = Yv * k;
        ok = ans - j >= 2 && Av >= f && Av < f * 60 && !(Av % f === 0 && Math.random() < 0.5);
      } while (!ok && g < 300);
      A = opd(M, split(M, Av));
      steps = [A.txt, ': ' + k, '+ ' + nu(v, last), ': ' + nu(C, last)];
      expl = A.txt + ' : ' + k + ' = ' + nu(Yv, last) + '; ' + nu(Yv, last) + ' + ' + nu(v, last) + ' = ' + nu(Yv + v, last) + '; ' + nu(Yv + v, last) + ' : ' + nu(C, last) + ' = ' + ans + '.' +
        (A.txt === nu(Av, last) ? '' : ' (Для первого шага удобно раздробить: ' + A.txt + ' = ' + nu(Av, last) + '.)');
    } else {
      /* A : C × m : n = ответ */
      do {
        g++; q1 = rand(4, 30); m = pick([2, 3, 4, 5, 6, 8, 9, 12, 15, 20, 25, 30, 40, 45, 48]); var cand = [];
        for (n = 2; n <= 60; n++) if ((q1 * m) % n === 0 && n !== m && n !== q1) cand.push(n);
        if (!cand.length) continue; n = pick(cand); ans = q1 * m / n; Av = q1 * C;
        ok = ans >= 2 && ans <= 200 && Av >= f && Av < f * 60;
      } while (!ok && g < 400);
      A = opd(M, split(M, Av));
      steps = [A.txt, ': ' + nu(C, last), '× ' + m, ': ' + n];
      expl = (A.txt === nu(Av, last) ? '' : A.txt + ' = ' + nu(Av, last) + '. ') + nu(Av, last) + ' : ' + nu(C, last) + ' = ' + q1 + '; ' + q1 + ' × ' + m + ' = ' + (q1 * m) + '; ' + (q1 * m) + ' : ' + n + ' = ' + ans + '.';
    }
    html = 'Выполни цепочку действий по порядку: ' + '<span class="expr t2e">' + steps.map(function (s, i) { return (i ? '<span class="t2cs"> → </span>' : '') + '<span class="t2cn">' + s.replace(/ /g, NB) + '</span>'; }).join('') + '<span class="t2cs"> → </span>?</span>';
    return {
      kind: 'num', html: html, answer: ans,
      hint: 'Считай по порядку, шаг за шагом. Когда делишь именованное число на именованное, получается число без названия. Мелкие меры при желании раздроби.',
      explain: expl + ' Ответ: <b>' + ans + '</b>.'
    };
  });

  /* ================= устный счёт: на смекалку ================= */
  reg('t2Think', function (o) {
    o = o || {};
    var type = o.type || pick(['sleep', 'slow', 'week', 'sum60']), html, ans, hint, expl, h, L, m, w, x;
    if (type === 'sleep') {
      var sp = pick([{ h: 8, d: 3, who: 'Человек', verb: 'спит' }, { h: 6, d: 4, who: 'Человек', verb: 'спит' }, { h: 12, d: 2, who: 'Ёж', verb: 'спит' }, { h: 16, d: 3, who: 'Кошка', verb: 'спит', k: 2 }]);
      var Ls = sp.k ? [3, 6, 9, 12, 15] : sp.d === 3 ? [30, 45, 60, 75, 90] : sp.d === 4 ? [40, 60, 80] : [4, 6, 8, 10, 12];
      L = pick(Ls); ans = L * sp.h / 24;
      html = sp.who + ' в среднем ' + sp.verb + ' ' + sp.h + ' ч в сутки. Сколько ' + (sp.who === 'Человек' ? 'лет из ' + L + ' ' + R.plural(L, ['года', 'лет', 'лет']).replace('года', 'года') : 'лет из ' + L + ' ' + R.plural(L, ['года', 'лет', 'лет'])) + ' жизни ' + (sp.who === 'Человек' ? 'он' : sp.who === 'Кошка' ? 'она' : 'он') + ' проводит во сне?';
      hint = 'Сутки — 24 ч. Какую часть суток длится сон: ' + sp.h + ' ч от 24 ч?';
      expl = 'В сутках 24 ч. ' + sp.h + ' ч — это ' + (sp.h === 8 ? 'третья часть' : sp.h === 6 ? 'четвёртая часть' : sp.h === 12 ? 'половина' : 'две трети') + ' суток, поэтому и жизни ' + (sp.h === 8 ? 'третья часть' : sp.h === 6 ? 'четвёртая часть' : sp.h === 12 ? 'половина' : 'две трети') + ' уходит на сон. ' +
        (sp.h === 8 ? L + ' : 3 = ' + ans : sp.h === 6 ? L + ' : 4 = ' + ans : sp.h === 12 ? L + ' : 2 = ' + ans : L + ' : 3 × 2 = ' + ans) + ' (лет).';
      html = html.replace(/лет из (\d+) года жизни/, 'лет из $1 лет жизни');
    } else if (type === 'slow') {
      m = pick([2, 3, 4, 5, 6]); h = pick([5, 6, 8, 10, 12]);
      var nameG = pick([['Часы', 'отстают', 'отстанут'], ['Часы', 'спешат', 'убегут вперёд']]);
      html = nameG[0] + ' ' + nameG[1] + ' на ' + m + ' мин за каждый час. На сколько минут они ' + (nameG[1] === 'отстают' ? 'отстанут' : 'убегут вперёд') + ' за ' + h + ' ч?';
      ans = m * h; hint = 'За каждый час набегает ' + m + ' мин. Сколько таких часов?';
      expl = 'За 1 ч — ' + m + ' мин, за ' + h + ' ч — ' + m + ' × ' + h + ' = ' + ans + ' мин.';
    } else if (type === 'week') {
      w = rand(2, 9); ans = w * 168;
      html = 'В неделе 7 суток. Сколько часов в ' + w + ' ' + R.plural(w, ['неделе', 'неделях', 'неделях']) + '?';
      hint = 'Сначала узнай, сколько часов в одной неделе: 7 × 24.';
      expl = 'В неделе 7 × 24 = 168 ч. В ' + w + ' ' + R.plural(w, ['неделе', 'неделях', 'неделях']) + ' — 168 × ' + w + ' = ' + fmt(ans) + ' ч.';
    } else {
      x = rand(2, 9) * 5 + 5; var y = 60 - x;
      html = 'Сколько минут не хватает до целого часа, если прошло ' + x + ' мин? Реши так: ' + eq(x + ' мин + □ мин = 1 ч');
      ans = y; hint = '1 ч = 60 мин. Дополни ' + x + ' до 60.';
      expl = '1 ч = 60 мин; 60 − ' + x + ' = ' + y + ', проверка: ' + x + ' + ' + y + ' = 60.';
    }
    return { kind: 'num', html: html, answer: ans, hint: hint, explain: expl };
  });

  /* ================= текстовые задачи ================= */
  var PEOPLE = [{ n: 'Маша', f: 1 }, { n: 'Петя', f: 0 }, { n: 'Аня', f: 1 }, { n: 'Игорь', f: 0 }, { n: 'Лена', f: 1 }, { n: 'Саша', f: 0 },
    { n: 'Оля', f: 1 }, { n: 'Миша', f: 0 }, { n: 'Катя', f: 1 }, { n: 'Дима', f: 0 }, { n: 'Вика', f: 1 }, { n: 'Тимур', f: 0 }];
  function who() { return pick(PEOPLE); }
  function vb(p, m, f) { return p.f ? f : m; }
  function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function qty(n, forms) { return fmt(n) + NB + R.plural(n, forms); }
  function solved(M, t) { return { parts: split(M, t), t: t }; }
  function stepsHTML(list, tailB) { return plainSteps(list) + (tailB ? '<br>' + tailB : ''); }
  function qOut(M, html, hint, expl, parts) {
    return { kind: 'nums', html: html + SOFT0, fields: fieldsOf(M), answer: parts, hint: hint, explain: expl };
  }

  /* ---------- сложение и вычитание времени ---------- */
  var PA_TOTAL = [
    { sys: 'ч-мин', top: [1, 4], t: function (A, B) { return 'Туристы шли до привала ' + A + ', а после привала ещё ' + B + '. Сколько времени они шли?'; } },
    { sys: 'ч-мин', top: [1, 5], t: function (A, B) { return 'Мастер собирал шкаф ' + A + ', а затем красил его ' + B + '. Сколько времени заняла вся работа?'; } },
    { sys: 'мин-с', top: [8, 40], t: function (A, B) { return 'Лыжник прошёл первую часть дистанции за ' + A + ', а вторую — за ' + B + '. За какое время он прошёл всю дистанцию?'; } },
    { sys: 'ч-мин', top: [1, 3], t: function (A, B) { return 'На дорогу до вокзала ушло ' + A + ', а поездка на электричке заняла ' + B + '. Сколько времени ушло на весь путь?'; } },
    { sys: 'сут-ч', top: [1, 6], t: function (A, B) { return 'Теплоход шёл по реке ' + A + ', а затем по озеру ещё ' + B + '. Сколько времени он был в пути?'; } },
    { sys: 'сут-ч', top: [2, 12], t: function (A, B) { return 'Экспедиция провела на первой стоянке ' + A + ', а на второй — ' + B + '. Сколько времени длились обе стоянки?'; } },
    { sys: 'мин-с', top: [2, 30], t: function (A, B) { return 'Первый ролик идёт ' + A + ', второй — ' + B + '. Сколько времени займёт просмотр обоих роликов?'; } }
  ];
  var PA_DIFF = [
    { sys: 'ч-мин', top: [4, 12], t: function (big, sm) { return 'Пассажирский поезд идёт между двумя городами ' + big + ', а скорый — ' + sm + '. На сколько меньше времени тратит скорый поезд?'; } },
    { sys: 'мин-с', top: [3, 6], t: function (big, sm) { return 'Первую песню исполняли ' + big + ', а вторую — ' + sm + '. На сколько первая песня длиннее второй?'; } },
    { sys: 'мин-с', top: [6, 25], t: function (big, sm) { return 'Один школьник решил задачу за ' + big + ', а другой — за ' + sm + '. На сколько быстрее справился второй?'; } },
    { sys: 'ч-мин', top: [5, 9], t: function (big, sm) { return 'Туристы шли в первый день ' + big + ', а во второй — ' + sm + '. На сколько меньше они шли во второй день?'; } },
    { sys: 'ч-мин', top: [2, 5], t: function (big, sm) { return 'До посёлка можно доехать на автобусе за ' + big + ', а на машине — за ' + sm + '. Сколько времени можно сэкономить, поехав на машине?'; } },
    { sys: 'сут-ч', top: [2, 9], small0: [6, 15], t: function (big, sm) { return 'Поездом путь занимает ' + big + ', а самолётом — ' + sm + '. Сколько времени можно сэкономить, если лететь самолётом?'; } }
  ];
  var PA_REST = [
    { sys: 'ч-мин', top: [2, 3], t: function (T, A) { return 'Спектакль идёт ' + T + '. Прошло уже ' + A + '. Сколько времени осталось до конца спектакля?'; } },
    { sys: 'ч-мин', top: [3, 8], who: 1, t: function (T, A, p) { return 'На подготовку проекта дали ' + T + '. ' + p.n + ' уже ' + vb(p, 'работал', 'работала') + ' ' + A + '. Сколько времени осталось?'; } },
    { sys: 'мин-с', top: [20, 55], t: function (T, A) { return 'Запись подкаста длится ' + T + '. Прослушали уже ' + A + '. Сколько времени осталось дослушать?'; } },
    { sys: 'сут-ч', top: [4, 12], t: function (T, A) { return 'Посылка должна идти ' + T + '. Она уже в пути ' + A + '. Сколько времени ей осталось ехать?'; } },
    { sys: 'ч-мин', top: [3, 6], t: function (T, A) { return 'Соревнования продлятся ' + T + '. С начала прошло ' + A + '. Сколько времени осталось до конца?'; } }
  ];
  reg('t2pAddSub', function (o) {
    o = o || {};
    var type = o.type || pick(['total', 'diff', 'rest', 'days3', 'sumdiff']), g = 0, M, pl, A, B, T, p = who(), c, d, ok, tot;
    if (type === 'total') {
      do {
        g++; pl = pick(PA_TOTAL); M = M_(pl.sys); A = mkQ(M, { top: pl.top }); B = mkQ(M, { top: pl.top }); c = addCalc(M, A.parts, B.parts);
        ok = o.carry === false ? c.nc === 0 : c.nc > 0;
      } while (!ok && g < 300);
      return qOut(M, pl.t(nm(M, A.parts), nm(M, B.parts)), 'Время всех частей складывается. Складывай меры отдельно, начиная с самых мелких.',
        'Складываем: ' + nm(M, A.parts) + ' + ' + nm(M, B.parts) + '.' + addBlock(M, A.parts, B.parts, 'Ответ: ' + ansB(M, c.t) + '.'), c.res);
    }
    if (type === 'diff' || type === 'rest') {
      do {
        g++;
        if (type === 'diff') {
          pl = pick(PA_DIFF); M = M_(pl.sys); A = mkQ(M, { top: pl.top });
          B = pl.small0 ? opdT(M, rand(pl.small0[0], pl.small0[1])) : mkQ(M, { top: pl.top });
        } else {
          pl = pick(PA_REST); M = M_(pl.sys); A = mkQ(M, { top: pl.top }); B = mkQ(M, { top: [1, Math.max(1, pl.top[1] - 1)] });
        }
        ok = A.t > B.t && A.parts[0] >= B.parts[0];
        if (ok) { c = subCalc(M, A.parts, B.parts); ok = o.borrow === false ? c.nb === 0 : c.nb > 0; }
      } while (!ok && g < 400);
      var text = type === 'diff' ? pl.t(nm(M, A.parts), nm(M, B.parts)) : pl.t(nm(M, A.parts), nm(M, B.parts), p);
      var what = type === 'diff' ? 'Разность времени — вычитание: из большего времени вычитаем меньшее.' : 'Чтобы узнать, сколько осталось, из всего времени вычитаем то, что уже прошло.';
      return qOut(M, text, what + ' Вычитай меры отдельно; если мелких мер не хватает, займи одну крупную.',
        'Вычитаем: ' + nm(M, A.parts) + ' − ' + nm(M, B.parts) + '.' + subBlock(M, A.parts, B.parts, 'Ответ: ' + ansB(M, c.t) + '.'), c.res);
    }
    if (type === 'days3') {
      M = M_('ч-мин');
      do {
        g++;
        A = mkQ(M, { top: [9, 14] }); d = opdT(M, rand(5, 14) * 5);
        var t2 = A.t - d.t, C = mkQ(M, { top: [7, 12] });
        tot = A.t + t2 + C.t;
        ok = t2 > 0 && tot <= 60 * 48;
      } while (!ok && g < 300);
      var s2 = solved(M, t2), s12 = solved(M, A.t + t2), sT = solved(M, tot);
      return qOut(M, 'Путешественник был в дороге три дня, всего ' + nf(M, tot) + '. В первый день он был в пути ' + nm(M, A.parts) + ', во второй — на ' + nm(M, d.parts) + ' меньше. Сколько времени он был в пути в третий день?',
        'Сначала найди время второго дня, потом время двух дней вместе. Остальное — третий день.',
        stepsHTML(['Второй день: ' + nm(M, A.parts) + ' − ' + nm(M, d.parts) + ' = ' + nf(M, t2) + '.',
          'Первые два дня вместе: ' + nm(M, A.parts) + ' + ' + nf(M, t2) + ' = ' + nf(M, A.t + t2) + '.',
          'Третий день: ' + nf(M, tot) + ' − ' + nf(M, A.t + t2) + ' = ' + nf(M, C.t) + '.'], 'Ответ: ' + ansB(M, C.t) + '.'), C.parts);
    }
    /* sumdiff: в понедельник A, во вторник на d дольше; сколько за два дня */
    M = M_(pick(['ч-мин', 'мин-с']));
    do { g++; A = mkQ(M, { top: M.key === 'ч-мин' ? [1, 3] : [10, 40] }); d = opdT(M, rand(3, 11) * 5); t2 = A.t + d.t; tot = A.t + t2; c = addCalc(M, A.parts, solved(M, t2).parts); } while (c.nc === 0 && g < 300);
    var act = pick(['читал', 'занимался', 'тренировался']), actF = { читал: 'читала', занимался: 'занималась', тренировался: 'тренировалась' }[act];
    return qOut(M, p.n + ' ' + vb(p, act, actF) + ' в понедельник ' + nm(M, A.parts) + ', а во вторник — на ' + nm(M, d.parts) + ' дольше. Сколько времени ' + p.n + ' ' + vb(p, act, actF) + ' за эти два дня?',
      'Найди время во вторник (оно больше), потом сложи время двух дней.',
      stepsHTML(['Во вторник: ' + nm(M, A.parts) + ' + ' + nm(M, d.parts) + ' = ' + nf(M, t2) + '.', 'За два дня: ' + nm(M, A.parts) + ' + ' + nf(M, t2) + ' = ' + nf(M, tot) + '.'], 'Ответ: ' + ansB(M, tot) + '.'), split(M, tot));
  });

  /* ---------- длина дня: восход и заход Солнца ---------- */
  reg('t2pDay', function (o) {
    o = o || {};
    var M = M_('ч-мин'), cmp = o.cmp !== false, g = 0, sr1, ss1, sr2, ss2, d1, d2, c1, c2, c3;
    function clock(h, m) { return nu(h, 'ч') + (m ? ' ' + nu(m, 'мин') : ''); }
    do {
      g++;
      sr1 = [rand(3, 4), rand(5, 55)]; ss1 = [rand(20, 21), rand(5, 55)];
      sr2 = [rand(8, 9), rand(5, 55)]; ss2 = [rand(15, 16), rand(5, 55)];
      d1 = (ss1[0] - sr1[0]) * 60 + ss1[1] - sr1[1]; d2 = (ss2[0] - sr2[0]) * 60 + ss2[1] - sr2[1];
      c1 = subCalc(M, ss1, sr1); c2 = subCalc(M, ss2, sr2);
    } while (!(c1.nb > 0 && (!cmp || (c2.nb > 0 || g > 100))) && g < 400);
    var town = pick(['в одном северном городе', 'в городе на севере страны', 'в нашем северном городе']);
    var t1 = nm(M, c1.res), t2 = nm(M, c2.res);
    if (!cmp) {
      return qOut(M, 'Летом ' + town + ' Солнце взошло в ' + clock(sr1[0], sr1[1]) + ' утра, а зашло в ' + clock(ss1[0], ss1[1]) + ' по 24-часовым часам. Сколько времени длился этот день — от восхода до захода?',
        'Длина дня — это время между восходом и заходом. Из времени захода вычти время восхода.',
        'От восхода до захода: ' + nm(M, ss1) + ' − ' + nm(M, sr1) + '.' + subBlock(M, ss1, sr1, 'Ответ: ' + ansB(M, d1) + '.'), c1.res);
    }
    var cd = subCalc(M, c1.res, c2.res);
    return qOut(M, 'Летом ' + town + ' Солнце взошло в ' + clock(sr1[0], sr1[1]) + ' утра и зашло в ' + clock(ss1[0], ss1[1]) + ' (по 24-часовым часам). Зимой оно взошло в ' + clock(sr2[0], sr2[1]) + ' утра и зашло в ' + clock(ss2[0], ss2[1]) + '. На сколько летний день длиннее зимнего?',
      'Сначала найди длину каждого дня: из времени захода вычти время восхода. Потом сравни.',
      stepsHTML(['Летний день: ' + nm(M, ss1) + ' − ' + nm(M, sr1) + ' = ' + t1 + '.', 'Зимний день: ' + nm(M, ss2) + ' − ' + nm(M, sr2) + ' = ' + t2 + '.',
        'Разница: ' + t1 + ' − ' + t2 + ' = ' + nf(M, d1 - d2) + '.'], 'Ответ: ' + ansB(M, d1 - d2) + '.'), cd.res);
  });

  /* ---------- умножение времени ---------- */
  var PM = [
    { sys: 'ч-мин', top: [1, 2], k: [5, 24], t: function (A, k) { return 'Школьник тратит на дорогу в школу и обратно ' + A + ' в день. Сколько времени он тратит на дорогу за ' + k + ' ' + R.plural(k, ['учебный день', 'учебных дня', 'учебных дней']) + '?'; } },
    { sys: 'мин-с', top: [8, 25], k: [3, 12], t: function (A, k) { return 'Одна серия мультфильма идёт ' + A + '. Сколько времени идут ' + k + ' ' + R.plural(k, ['такая серия', 'такие серии', 'таких серий']) + ' подряд?'; } },
    { sys: 'мин-с', top: [1, 3], k: [6, 20], t: function (A, k) { return 'Бегун пробегает один круг по стадиону за ' + A + '. За какое время он пробежит ' + qty(k, ['круг', 'круга', 'кругов']) + ' в таком же темпе?'; } },
    { sys: 'ч-мин', top: [1, 4], k: [3, 9], t: function (A, k) { return 'Автобус проезжает свой маршрут за ' + A + '. Сколько времени он затратит на ' + qty(k, ['рейс', 'рейса', 'рейсов']) + ' подряд?'; } },
    { sys: 'ч-мин', top: [2, 6], k: [4, 12], t: function (A, k) { return 'На окраску одной секции забора уходит ' + A + '. Сколько времени понадобится, чтобы покрасить ' + qty(k, ['секцию', 'секции', 'секций']) + ' забора?'; } },
    { sys: 'сут-ч', top: [1, 4], k: [2, 9], t: function (A, k) { return 'Теплоход проходит маршрут от порта до порта за ' + A + '. Сколько времени он проведёт в пути, пройдя этот маршрут ' + qty(k, ['раз', 'раза', 'раз']) + '?'; } },
    { sys: 'мин-с', top: [1, 3], k: [4, 15], t: function (A, k) { return 'Электричка стоит на каждой станции ' + A + '. Сколько времени она простоит на ' + qty(k, ['станции', 'станциях', 'станциях']) + '?'; } },
    { sys: 'сут-ч', fixed: [365, 6], k: [2, 12], t: function (A, k) { return 'Земля делает полный оборот вокруг Солнца за ' + A + '. За какое время она сделает ' + qty(k, ['оборот', 'оборота', 'оборотов']) + '?'; } },
    { sys: 'сут-ч-мин', fixed: [27, 7, 43], k: [2, 12], t: function (A, k) { return 'Луна делает полный оборот вокруг Земли за ' + A + '. За какое время она сделает ' + qty(k, ['оборот', 'оборота', 'оборотов']) + '?'; } }
  ];
  reg('t2pMul', function (o) {
    o = o || {};
    var pl = pick(o.plots ? o.plots.map(function (i) { return PM[i]; }) : PM), M = M_(pl.sys), kr = o.k || pl.k, k = rand(kr[0], kr[1]), parts, c;
    if (o.k && pl.k) { k = rand(Math.max(o.k[0], 2), o.k[1]); }
    parts = pl.fixed ? pl.fixed.slice() : mkQ(M, { top: capTop(M, k, { top: pl.top }) }).parts;
    c = mulCalc(M, parts, k);
    var A = nm(M, parts), extra = '';
    if (pl.fixed && pl.fixed[0] === 365 && k % 4 === 0) extra = ' (Каждые четыре года набегает ровно ' + nu(1, 'сут') + ': так получаются високосные годы.)';
    return qOut(M, pl.t(A, k), 'Одно и то же время повторяется ' + qty(k, ['раз', 'раза', 'раз']) + ' — это умножение. Умножай каждую меру отдельно, начиная с мелкой.',
      stepsHTML(['Действие — умножение: ' + A + ' × ' + k + '.'].concat(mulLines(M, parts, k)), 'Ответ: ' + ansB(M, c.t) + '.' + extra), c.res);
  });

  /* ---------- деление времени на число ---------- */
  var PD = [
    { sys: 'мин-с', top: [1, 4], k: [3, 12], t: function (T, k) { return 'Спортсмен пробежал ' + qty(k, ['круг', 'круга', 'кругов']) + ' за ' + T + '. Сколько времени он тратил на один круг, если бежал равномерно?'; } },
    { sys: 'ч-мин', top: [1, 3], k: [3, 9], t: function (T, k) { return 'Мастер изготовил ' + qty(k, ['одинаковую табуретку', 'одинаковые табуретки', 'одинаковых табуреток']) + ' за ' + T + '. Сколько времени уходило на одну табуретку?'; } },
    { sys: 'ч-мин', top: [1, 2], k: [3, 8], t: function (T, k) { return 'Фильм состоит из ' + k + ' равных по длине частей и идёт ' + T + '. Сколько времени длится одна часть?'; } },
    { sys: 'ч-мин', top: [2, 5], k: [3, 9], t: function (T, k) { return 'Школьники совершили ' + qty(k, ['одинаковую поездку', 'одинаковые поездки', 'одинаковых поездок']) + ' на автобусе и провели в пути ' + T + '. Сколько времени длилась одна поездка?'; } },
    { sys: 'мин-с', top: [1, 6], k: [4, 15], t: function (T, k) { return 'Станок обрабатывает ' + qty(k, ['одинаковую деталь', 'одинаковые детали', 'одинаковых деталей']) + ' за ' + T + '. Сколько времени уходит на одну деталь?'; } },
    { sys: 'ч-мин', top: [1, 4], k: [3, 8], t: function (T, k) { return 'Садовник подстриг ' + qty(k, ['одинаковый газон', 'одинаковых газона', 'одинаковых газонов']) + ' за ' + T + '. Сколько времени ушло на один газон?'; } },
    { sys: 'сут-ч', top: [1, 5], k: [3, 9], t: function (T, k) { return 'Экспедиция прошла ' + k + ' одинаковых по длине участка маршрута за ' + T + '. Сколько времени она тратила на один участок?'; } }
  ];
  reg('t2pDiv', function (o) {
    o = o || {};
    var pl = pick(PD), M = M_(pl.sys), kr = o.k || pl.k, k = rand(kr[0], kr[1]), Q, t, g = 0, ok, c, tot;
    do {
      g++;
      Q = mkQ(M, { top: pl.top }); t = Q.t * k; tot = split(M, t); c = divCalc(M, tot, k);
      ok = o.pass === false ? c.nr === 0 : c.nr > 0;
    } while (!ok && g < 300);
    return qOut(M, pl.t(nf(M, t), k), 'Время делится поровну на ' + qty(k, ['одинаковую часть', 'одинаковые части', 'одинаковых частей']) + ' — это деление. Дели с самой крупной меры, остаток раздроби.',
      'Действие — деление: ' + nf(M, t) + ' : ' + k + '.' + divBlock(M, tot, k, 'Ответ: ' + ansB(M, c.t) + '.'), c.res);
  });

  /* ---------- сколько раз: деление времени на время ---------- */
  var PC = [
    { A: 'ч-мин', B: 'мин-с', btop: [2, 5], q: [8, 40], n: ['песня', 'песни', 'песен'], t: function (A, B) { return 'Одна песня звучит ' + B + '. Сколько таких песен поместится в плейлист длиной ' + A + '?'; } },
    { A: 'ч-мин', B: 'мин-с', btop: [1, 4], q: [10, 50], n: ['деталь', 'детали', 'деталей'], t: function (A, B) { return 'На изготовление одной детали токарь тратит ' + B + '. Сколько деталей он изготовит за ' + A + '?'; } },
    { A: 'ч-мин', B: 'мин-с', btop: [9, 14], q: [3, 20], n: ['километр', 'километра', 'километров'], t: function (A, B) { return 'Турист проходит один километр за ' + B + '. Сколько километров он пройдёт за ' + A + ', если будет идти в таком же темпе?'; } },
    { A: 'ч-мин', B: 'мин-с', btop: [8, 25], q: [3, 12], n: ['серия', 'серии', 'серий'], t: function (A, B) { return 'Одна серия мультфильма идёт ' + B + '. Сколько серий можно посмотреть за ' + A + '?'; } },
    { A: 'сут-ч', B: 'ч-мин', btop: [1, 5], q: [6, 30], n: ['цистерна', 'цистерны', 'цистерн'], t: function (A, B) { return 'Насос наполняет одну цистерну за ' + B + '. Сколько цистерн он наполнит за ' + A + '?'; } },
    { A: 'ч-мин', B: 'мин-с', btop: [5, 12], q: [4, 14], n: ['доклад', 'доклада', 'докладов'], t: function (A, B) { return 'На один доклад на конференции отводится ' + B + '. Сколько докладов можно заслушать за ' + A + '?'; } },
    { A: 'ч-мин', B: 'мин-с', btop: [2, 4], q: [6, 30], n: ['километр', 'километра', 'километров'], t: function (A, B) { return 'Велосипедист проезжает один километр за ' + B + '. Сколько километров он проедет за ' + A + '?'; } },
    { A: 'ч-мин', B: 'мин', btop: [10, 55], q: [4, 16], n: ['ванна', 'ванны', 'ванн'], t: function (A, B) { return 'Одну ванну наполняют водой за ' + B + '. Сколько ванн можно наполнить за ' + A + '?'; } }
  ];
  reg('t2pCount', function (o) {
    o = o || {};
    var pl = pick(PC), MA = M_(pl.A), MB = M_(pl.B), g = 0, B, q, base, parts, A, ok, qr = o.q || pl.q;
    do {
      g++;
      B = MB.n === 1 ? opd(MB, [rand(pl.btop[0], pl.btop[1])]) : opd(MB, mkQ(MB, { top: pl.btop }).parts);
      q = rand(qr[0], Math.min(qr[1], pl.q[1]) );
      base = B.base * q; ok = base % UN[MA.last].size === 0;
      if (ok) { parts = split(MA, base / UN[MA.last].size); ok = parts[0] >= 1 && parts[0] <= 999; }
    } while (!ok && g < 800);
    A = opd(MA, parts);
    return {
      kind: 'num', html: pl.t(A.txt, B.txt), answer: q,
      hint: 'Нужно узнать, сколько раз одно время помещается в другом: это деление. Приведи оба времени к одним мерам.',
      explain: 'Действие — деление: ' + A.txt + ' : ' + B.txt + '.' + dnBlock(A, B, 'Ответ: <b>' + qty(q, pl.n) + '</b>.')
    };
  });

  /* ---------- скорость и время: метры и секунды ---------- */
  var PR_DIST = [
    { v: [4, 5, 6], vt: 'м в секунду', name: function (v) { return 'Парашютист снижается со скоростью ' + v + ' м в секунду.'; }, T: 'мин-с', top: [4, 9], q: function (D) { return 'Какую высоту он пролетит за ' + D + '?'; } },
    { v: [10, 12, 15], vt: 'м в секунду', name: function (v) { return 'Катер идёт по озеру со скоростью ' + v + ' м в секунду.'; }, T: 'мин-с', top: [2, 9], q: function (D) { return 'Какое расстояние он пройдёт за ' + D + '?'; } },
    { v: [340], vt: 'м в секунду', name: function (v) { return 'Звук в воздухе распространяется со скоростью около ' + v + ' м в секунду.'; }, T: 'с', top: [3, 30], q: function (D) { return 'Какое расстояние пройдёт звук за ' + D + '?'; } }
  ];
  var PR_TIME = [
    { v: [3, 4, 5], vt: 'м в секунду', name: function (v, H) { return 'Парашютист снижается со скоростью ' + v + ' м в секунду. Он прыгнул с высоты ' + H + '. Сколько времени продолжался спуск?'; }, h: [300, 1500] },
    { v: [2, 3, 4], vt: 'м в секунду', name: function (v, H) { return 'Скоростной лифт поднимается со скоростью ' + v + ' м в секунду. За какое время он поднимется на высоту ' + H + '?'; }, h: [60, 300] },
    { v: [10, 12, 15], vt: 'м в секунду', name: function (v, H) { return 'Катер идёт со скоростью ' + v + ' м в секунду. За какое время он пройдёт ' + H + '?'; }, h: [1200, 9000] },
    { v: [15, 20], vt: 'м в секунду', name: function (v, H) { return 'Поезд метро идёт по тоннелю со скоростью ' + v + ' м в секунду. За какое время он проедет перегон длиной ' + H + '?'; }, h: [1200, 6000] }
  ];
  reg('t2pRate', function (o) {
    o = o || {};
    var type = o.type || pick(['dist', 'time']), g = 0, ok, pl, v, M;
    if (type === 'dist') {
      var MT, MD = M_('км-м');
      do {
        g++;
        pl = pick(PR_DIST); v = pick(pl.v); MT = M_(pl.T);
        var T = MT.n === 1 ? opd(MT, [rand(pl.top[0], pl.top[1])]) : opd(MT, mkQ(MT, { top: pl.top }).parts);
        var dist = v * T.base;
        ok = dist >= 1000 && dist <= 99000 && dist % 1 === 0;
      } while (!ok && g < 500);
      var tsec = T.base;
      var Tc = T.M.n === 1 ? nu(T.parts[0], T.M.last) : nm(T.M, T.parts);
      var secLine = T.M.n === 1 ? '' : Tc + ' = ' + nu(tsec, 'с') + '. ';
      return qOut(MD, pl.name(v) + ' ' + pl.q(Tc), 'Расстояние = скорость × время. Время сначала переведи в секунды. Ответ запиши в километрах и метрах.',
        stepsHTML([secLine + 'Расстояние: ' + fmt(v) + ' × ' + fmt(tsec) + ' = ' + nu(dist, 'м') + '.', factsOf(MD) + '. ' + nu(dist, 'м') + ' = ' + nf(MD, dist) + '.'], 'Ответ: ' + ansB(MD, dist) + '.'), split(MD, dist));
    }
    var MS = M_('мин-с'), H, t;
    do {
      g++;
      pl = pick(PR_TIME); v = pick(pl.v);
      var hr = pl.h; H = rand(hr[0] / 20, hr[1] / 20) * 20;
      ok = H % v === 0 && H / v >= 20 && H / v <= 60 * 45;
    } while (!ok && g < 800);
    t = H / v;
    var MH = H >= 1000 ? M_('км-м') : M_('м');
    var Htxt = MH.n === 1 ? nu(H, 'м') : nm(MH, split(MH, H));
    var html = pl.name(v, Htxt);
    return qOut(MS, html, 'Время = расстояние : скорость. Раздели расстояние в метрах на скорость, получишь секунды, и преврати их в минуты и секунды.',
      stepsHTML([(MH.n === 1 ? '' : Htxt + ' = ' + nu(H, 'м') + '. ') + 'Время: ' + fmt(H) + ' : ' + fmt(v) + ' = ' + nu(t, 'с') + '.', 'Превращаем: ' + toBig(MS, t).join(' ') + ' Получилось ' + nf(MS, t) + '.'], 'Ответ: ' + ansB(MS, t) + '.'), split(MS, t));
  });

  /* ---------- задачи в два действия ---------- */
  var P2_ADD = [
    { sys: 'ч-мин', b: [1, 2], a: [6, 11], k: [3, 6], t: function (B, k, A) { return 'Поход состоял из ' + qty(k, ['одинакового перехода', 'одинаковых переходов', 'одинаковых переходов']) + ' по ' + B + ' и привала продолжительностью ' + A + '. Сколько времени занял поход?'; } },
    { sys: 'мин-с', b: [2, 8], a: [5, 15], k: [3, 8], t: function (B, k, A) { return 'Спортсмен выполнил ' + qty(k, ['одинаковую серию', 'одинаковые серии', 'одинаковых серий']) + ' упражнений по ' + B + ' и ещё ' + A + ' потратил на разминку. Сколько времени длилась тренировка?'; } },
    { sys: 'ч-мин', b: [0, 0, 4, 10], a: [0, 0, 6, 11], k: [4, 8], t: function (B, k, A) { return 'Экскурсия по музею: школьники осмотрели ' + qty(k, ['одинаковый зал', 'одинаковых зала', 'одинаковых залов']) + ' по ' + B + ' в каждом, а потом ' + A + ' слушали рассказ экскурсовода. Сколько времени длилась экскурсия?'; } },
    { sys: 'мин-с', b: [1, 3], a: [8, 25], k: [4, 12], t: function (B, k, A) { return 'Диктор прочитал ' + qty(k, ['одинаковую новость', 'одинаковые новости', 'одинаковых новостей']) + ' по ' + B + ' и ещё ' + A + ' шёл прогноз погоды. Сколько времени длился выпуск?'; } }
  ];
  var P2_SUB = [
    { sys: 'мин-с', b: [2, 6], k: [3, 7], t: function (T, k, B) { return 'Для записи подкаста выделили ' + T + '. Уже записали ' + qty(k, ['одинаковую рубрику', 'одинаковые рубрики', 'одинаковых рубрик']) + ' по ' + B + '. Сколько времени осталось?'; } },
    { sys: 'ч-мин', b: [0, 0, 3, 8], k: [2, 4], t: function (T, k, B) { return 'Фильм идёт ' + T + '. Зрители уже посмотрели ' + qty(k, ['одинаковую часть', 'одинаковые части', 'одинаковых частей']) + ' по ' + B + '. Сколько времени осталось до конца фильма?'; } },
    { sys: 'ч-мин', b: [0, 0, 6, 11], k: [3, 6], t: function (T, k, B) { return 'Туристам нужно идти ' + T + '. Они прошли ' + qty(k, ['одинаковый участок', 'одинаковых участка', 'одинаковых участков']) + ' по ' + B + '. Сколько времени им осталось идти?'; } },
    { sys: 'мин-с', b: [1, 4], k: [4, 9], t: function (T, k, B) { return 'Лента с песнями идёт ' + T + '. Прослушали ' + qty(k, ['одинаковую песню', 'одинаковые песни', 'одинаковых песен']) + ' по ' + B + '. Сколько времени осталось дослушать?'; } }
  ];
  function p2part(M, rg) {
    /* rg: [от, до] — старшая мера; [0, 0, a, b] — только мелкая мера в шагах по 5 */
    return rg.length === 4 ? opdT(M, rand(rg[2], rg[3]) * 5) : mkQ(M, { top: rg });
  }
  reg('t2pTwo', function (o) {
    o = o || {};
    var type = o.type || pick(['mulAdd', 'mulSub']), g = 0, pl, M, B, A, k, tot, c, ok, take, rest;
    if (type === 'mulAdd') {
      do {
        g++;
        pl = pick(P2_ADD); M = M_(pl.sys); k = rand(pl.k[0], pl.k[1]);
        B = p2part(M, pl.b); A = p2part(M, pl.a);
        tot = B.t * k + A.t; c = mulCalc(M, B.parts, k);
        ok = c.nc > 0 && tot < 60 * 40;
      } while (!ok && g < 400);
      return qOut(M, pl.t(nm(M, B.parts), k, nm(M, A.parts)), 'Сначала найди время всех одинаковых частей (умножение), потом прибавь оставшееся время.',
        stepsHTML(['Одинаковые части: ' + nm(M, B.parts) + ' × ' + k + ' = ' + nf(M, B.t * k) + '.', 'Всего: ' + nf(M, B.t * k) + ' + ' + nm(M, A.parts) + ' = ' + nf(M, tot) + '.'], 'Ответ: ' + ansB(M, tot) + '.'), split(M, tot));
    }
    do {
      g++;
      pl = pick(P2_SUB); M = M_(pl.sys); k = rand(pl.k[0], pl.k[1]);
      B = p2part(M, pl.b); take = B.t * k;
      rest = opdT(M, rand(2, 9) * 5); tot = take + rest.t;
      c = mulCalc(M, B.parts, k);
      ok = c.nc > 0 && tot < (M.key === 'ч-мин' ? 60 * 12 : 60 * 80);
    } while (!ok && g < 400);
    return qOut(M, pl.t(nf(M, tot), k, nm(M, B.parts)), 'Сначала узнай, сколько времени прошло (умножение), потом вычти это время из всего.',
      stepsHTML(['Прошло: ' + nm(M, B.parts) + ' × ' + k + ' = ' + nf(M, take) + '.', 'Осталось: ' + nf(M, tot) + ' − ' + nf(M, take) + ' = ' + nf(M, rest.t) + '.'], 'Ответ: ' + ansB(M, rest.t) + '.'), rest.parts);
  });

  /* ================= виджеты теории ================= */
  R.widgetMounts = R.widgetMounts || {};
  var SYS_NAME = {
    'ч-мин': 'часы и минуты', 'мин-с': 'минуты и секунды', 'сут-ч': 'сутки и часы', 'ч-мин-с': 'часы, минуты, секунды', 'сут-ч-мин': 'сутки, часы, минуты', 'год-мес': 'годы и месяцы',
    'км-м': 'километры и метры', 'м-см': 'метры и сантиметры', 'т-кг': 'тонны и килограммы', 'ц-кг': 'центнеры и килограммы', 'кг-г': 'килограммы и граммы', 'руб-коп': 'рубли и копейки',
    'сут': 'только сутки', 'ч': 'только часы', 'мин': 'только минуты', 'с': 'только секунды', 'км': 'только километры', 'м': 'только метры', 'т': 'только тонны', 'ц': 'только центнеры', 'кг': 'только килограммы', 'г': 'только граммы', 'руб': 'только рубли', 'коп': 'только копейки'
  };
  var W_TIME = ['ч-мин', 'мин-с', 'сут-ч', 'ч-мин-с', 'сут-ч-мин', 'год-мес'], W_METRIC = ['км-м', 'м-см', 'т-кг', 'ц-кг', 'кг-г', 'руб-коп'];
  var W_DEF = {
    'ч-мин': [3, 50], 'мин-с': [2, 45], 'сут-ч': [2, 18], 'ч-мин-с': [2, 15, 40], 'сут-ч-мин': [1, 7, 43], 'год-мес': [3, 8],
    'км-м': [3, 260], 'м-см': [4, 85], 'т-кг': [3, 620], 'ц-кг': [7, 5], 'кг-г': [3, 250], 'руб-коп': [2, 25]
  };
  var W_DIV = {
    'ч-мин': [9, 20, 4], 'мин-с': [56, 42, 18], 'сут-ч': [67, 12, 18], 'ч-мин-с': [5, 40, 30, 6], 'сут-ч-мин': [3, 12, 40, 4], 'год-мес': [9, 6, 6],
    'км-м': [7, 280, 7], 'м-см': [6, 80, 4], 'т-кг': [4, 500, 5], 'ц-кг': [3, 60, 6], 'кг-г': [2, 500, 4], 'руб-коп': [9, 60, 8]
  };
  function wChains(fam) { return fam === 'metric' ? W_METRIC : fam === 'all' ? W_TIME.concat(W_METRIC) : W_TIME; }
  function wSingles(fam) { return fam === 'metric' ? ['км', 'м', 'т', 'ц', 'кг', 'г', 'руб', 'коп'] : fam === 'all' ? ['сут', 'ч', 'мин', 'с', 'м', 'кг', 'ц', 'т', 'г', 'руб', 'коп'] : ['сут', 'ч', 'мин', 'с']; }
  function wEl(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function wRead(inp) { var d = inp.value.replace(/\D/g, ''); return d === '' ? null : Number(d); }
  /* редактор именованного числа: выбор мер + поля для каждой меры */
  function wEditor(list, key, vals, label, onChange) {
    var box = wEl('div', 'conv-row'), sel = wEl('select', 'wsel'), inner = wEl('span', 't2ed'), inputs = [], M = null;
    sel.setAttribute('aria-label', label + ': какие меры');
    sel.innerHTML = list.map(function (k) { return '<option value="' + k + '">' + SYS_NAME[k] + '</option>'; }).join('');
    function build(k, v) {
      M = M_(k); inner.innerHTML = ''; inputs = [];
      M.units.forEach(function (u, i) {
        var inp = wEl('input', 'winput sm'); inp.setAttribute('inputmode', 'numeric'); inp.setAttribute('autocomplete', 'off'); inp.maxLength = 4;
        inp.value = v && v[i] != null ? v[i] : 0; inp.setAttribute('aria-label', label + ': ' + UN[u].nom.toLowerCase());
        inp.addEventListener('input', function () { var d = inp.value.replace(/\D/g, ''); if (d !== inp.value) inp.value = d; onChange(); });
        inner.appendChild(inp); inner.appendChild(wEl('span', 'conv-eq t2u', UN[u].lbl + ' ')); inputs.push(inp);
      });
    }
    sel.value = key; build(key, vals);
    sel.addEventListener('change', function () { var k = sel.value; build(k, W_DEF[k] || [1]); onChange(); });
    box.appendChild(sel); box.appendChild(inner);
    return {
      el: box, key: function () { return sel.value; },
      get: function () {
        var parts = inputs.map(wRead), i;
        for (i = 0; i < parts.length; i++) if (parts[i] === null) return { err: 'Впиши числа во все поля (если меры нет, поставь 0).' };
        for (i = 1; i < parts.length; i++) if (parts[i] >= M.f[i - 1]) return { err: 'Меньших мер должно быть меньше, чем в одной большей: ' + fact1(M.units[i - 1], M.units[i]) + '. Лишнее преврати в крупную меру.' };
        if (!parts.some(function (x) { return x > 0; })) return { err: 'Число не может быть нулём.' };
        return { M: M, key: sel.value, parts: parts };
      }
    };
  }
  function wMsg(out, t) { out.innerHTML = '<p class="facts">' + R.tidy(t) + '</p>'; }
  function wNumInput(val, label, onChange) {
    var inp = wEl('input', 'winput sm'); inp.setAttribute('inputmode', 'numeric'); inp.setAttribute('autocomplete', 'off'); inp.maxLength = 3; inp.value = val; inp.setAttribute('aria-label', label);
    inp.addEventListener('input', function () { var d = inp.value.replace(/\D/g, ''); if (d !== inp.value) inp.value = d; onChange(); });
    return inp;
  }
  function wList(host) {
    var d = host.dataset || {}, fam = d.fam || 'time';
    return { fam: fam, d: d, list: wChains(fam) };
  }
  function wInitVals(d, name, key, dflt) {
    if (d[name]) return d[name].split(',').map(Number);
    return dflt;
  }
  /* умножение: A × k, два способа */
  R.widgetMounts.t2mul = function (host) {
    host.classList.add('t2w');
    var W = wList(host), d = W.d, key0 = d.sys || (W.fam === 'metric' ? 'км-м' : 'ч-мин'), out = wEl('div', 't2out');
    var kin, meth = wEl('select', 'wsel');
    meth.setAttribute('aria-label', 'Способ');
    meth.innerHTML = '<option value="parts">Способ: умножаем по мерам</option><option value="frag">Способ: раздробить, умножить, превратить</option>';
    if (d.method) meth.value = d.method;
    function calc() {
      var a = ed.get();
      if (a.err) return wMsg(out, a.err);
      var k = wRead(kin);
      if (k === null || k < 2 || k > 99) return wMsg(out, 'Множитель — число от 2 до 99.');
      var big = a.parts[0] * k > 9999;
      if (big) return wMsg(out, 'Давай числа поменьше: тогда и столбик получится аккуратным.');
      out.innerHTML = R.tidy('<p class="facts">Помним: ' + factsOf(a.M) + '.</p>' + (meth.value === 'frag' ? mulFragBlock(a.M, a.parts, k, true) : mulBlock(a.M, a.parts, k, '<b>Итого: ' + nf(a.M, toT(a.M, a.parts) * k) + '</b>')));
    }
    var ed = wEditor(W.list, key0, wInitVals(d, 'parts', key0, W_DEF[key0]), 'Множимое', calc);
    kin = wNumInput(d.k || 4, 'Множитель', calc);
    var row = wEl('div', 'conv-row'); row.appendChild(wEl('span', 'conv-eq', '×')); row.appendChild(kin);
    host.appendChild(ed.el); host.appendChild(row);
    var mrow = wEl('div', 'conv-row'); mrow.appendChild(meth); host.appendChild(mrow); host.appendChild(out);
    meth.addEventListener('change', calc);
    calc();
  };
  /* деление: A : k */
  R.widgetMounts.t2div = function (host) {
    host.classList.add('t2w');
    var W = wList(host), d = W.d, key0 = d.sys || (W.fam === 'metric' ? 'км-м' : 'ч-мин'), out = wEl('div', 't2out'), kin;
    var init = W_DIV[key0], vals = wInitVals(d, 'parts', key0, init.slice(0, init.length - 1)), k0 = d.k || init[init.length - 1];
    function calc() {
      var a = ed.get();
      if (a.err) return wMsg(out, a.err);
      var k = wRead(kin);
      if (k === null || k < 2 || k > 99) return wMsg(out, 'Делитель — число от 2 до 99.');
      var c = divCalc(a.M, a.parts, k);
      if (c.rem !== 0) return wMsg(out, nm(a.M, a.parts) + ' нацело на ' + k + ' не делится: в конце остаётся ' + nu(c.rem, a.M.last) + '. В этом уроке делим без остатка, подбери другие числа.');
      out.innerHTML = R.tidy('<p class="facts">Помним: ' + factsOf(a.M) + '.</p>' + divBlock(a.M, a.parts, k, '<b>Итого: ' + nf(a.M, c.t) + '</b>'));
    }
    var ed = wEditor(W.list, key0, vals, 'Делимое', calc);
    kin = wNumInput(k0, 'Делитель', calc);
    var row = wEl('div', 'conv-row'); row.appendChild(wEl('span', 'conv-eq', ':')); row.appendChild(kin);
    host.appendChild(ed.el); host.appendChild(row); host.appendChild(out);
    calc();
  };
  /* деление именованного на именованное */
  R.widgetMounts.t2divn = function (host) {
    host.classList.add('t2w');
    var W = wList(host), d = W.d, out = wEl('div', 't2out'), keyA = d.sys || (W.fam === 'metric' ? 'км-м' : 'ч-мин'), keyB = d.sysb || (W.fam === 'metric' ? 'м' : 'мин');
    var listB = W.list.concat(wSingles(W.fam));
    var vA = wInitVals(d, 'parts', keyA, keyA === 'ч-мин' ? [12, 18] : [14, 0]), vB = wInitVals(d, 'partsb', keyB, keyB === 'мин' ? [9] : [280]);
    function calc() {
      var a = A.get(), b = B.get();
      if (a.err) return wMsg(out, 'Делимое: ' + a.err);
      if (b.err) return wMsg(out, 'Делитель: ' + b.err);
      if (a.M.dim !== b.M.dim) return wMsg(out, 'Это меры разных величин — их делить нельзя. Выбери меры одной величины (например, обе — времени).');
      var X = opd(a.M, a.parts), Y = opd(b.M, b.parts);
      if (X.base < Y.base) return wMsg(out, 'Делимое меньше делителя, частное получится меньше 1. Поменяй числа местами.');
      if (X.base % Y.base !== 0) { var cuw = commonUnit(X, Y); return wMsg(out, X.txt + ' : ' + Y.txt + ' нацело не делится (остаток ' + nu((X.base % Y.base) / UN[cuw].size, cuw) + '). В этом уроке делим без остатка, подбери другие числа.'); }
      var q = X.base / Y.base;
      out.innerHTML = R.tidy(dnBlock(X, Y, 'Ответ: ' + expr(X.txt + ' : ' + Y.txt + ' = <b>' + fmt(q) + '</b>')));
    }
    var A = wEditor(W.list, keyA, vA, 'Делимое', calc), B = wEditor(listB, keyB, vB, 'Делитель', calc);
    var lbl1 = wEl('p', 'wlabel', 'Делимое'), lbl2 = wEl('p', 'wlabel', 'Делитель');
    host.appendChild(lbl1); host.appendChild(A.el); host.appendChild(lbl2); host.appendChild(B.el); host.appendChild(out);
    calc();
  };

  /* @@INSERT-6 */





  R.t2Mine = MINE;
})(typeof window !== 'undefined' ? window : globalThis);
