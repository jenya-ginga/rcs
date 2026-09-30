/* Блок «Именованные числа: умножение и деление», уроки 71–83.
   Составные именованные числа (3 км 250 м, 5 т 300 кг, 28 руб. 72 коп.): умножение на отвлечённое число,
   деление на равные части, деление по содержанию, выражения и задачи. Префикс имён — n2 / pn2 / R.n2….
   Все числа генерируются от ответа обратным ходом, деление всегда нацело. */
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

  /* ================= пары мер ================= */
  var PAIRS = {
    'км-м':    { big: 'км',   small: 'м',    f: 1000, kind: 'len' },
    'м-см':    { big: 'м',    small: 'см',   f: 100,  kind: 'len' },
    'м-дм':    { big: 'м',    small: 'дм',   f: 10,   kind: 'len' },
    'дм-см':   { big: 'дм',   small: 'см',   f: 10,   kind: 'len' },
    'см-мм':   { big: 'см',   small: 'мм',   f: 10,   kind: 'len' },
    'т-кг':    { big: 'т',    small: 'кг',   f: 1000, kind: 'wt' },
    'т-ц':     { big: 'т',    small: 'ц',    f: 10,   kind: 'wt' },
    'ц-кг':    { big: 'ц',    small: 'кг',   f: 100,  kind: 'wt' },
    'кг-г':    { big: 'кг',   small: 'г',    f: 1000, kind: 'wt' },
    'руб-коп': { big: 'руб.', small: 'коп.', f: 100,  kind: 'money' }
  };
  Object.keys(PAIRS).forEach(function (k) {
    var P = PAIRS[k]; P.key = k; P.fact = '1 ' + P.big + ' = ' + fmt(P.f) + ' ' + P.small;
  });
  var MAIN = ['км-м', 'м-см', 'т-кг', 'ц-кг', 'кг-г', 'руб-коп'];
  var MORE = MAIN.concat(['м-дм', 'т-ц', 'дм-см', 'см-мм']);
  function PP(x) { return typeof x === 'string' ? PAIRS[x] : x; }

  var LOC = { 'км': 'километрах', 'м': 'метрах', 'дм': 'дециметрах', 'см': 'сантиметрах', 'мм': 'миллиметрах', 'т': 'тоннах', 'ц': 'центнерах', 'кг': 'килограммах', 'г': 'граммах', 'руб.': 'рублях', 'коп.': 'копейках' };
  var GEN = { 'км': 'километров', 'м': 'метров', 'дм': 'дециметров', 'см': 'сантиметров', 'мм': 'миллиметров', 'т': 'тонн', 'ц': 'центнеров', 'кг': 'килограммов', 'г': 'граммов', 'руб.': 'рублей', 'коп.': 'копеек' };

  /* ================= запись именованных чисел ================= */
  function nu(n, u) { return fmt(n) + NB + u; }                                  /* «250 м» */
  function nm(P, b, s) { return nu(b, P.big) + ' ' + nu(s, P.small); }         /* «3 км 250 м» */
  function nf(P, t) {                                                            /* нормальная запись величины по числу мелких единиц */
    var b = Math.floor(t / P.f), s = t % P.f;
    if (b === 0) return nu(s, P.small);
    if (s === 0) return nu(b, P.big);
    return nm(P, b, s);
  }
  function sm(P, t) { return nu(t, P.small); }
  function expr(s) { return '<span class="expr n2e">' + s + '</span>'; }
  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function fields(P) { return [{ label: P.big }, { label: P.small }]; }
  function splitT(P, t) { return [Math.floor(t / P.f), t % P.f]; }
  function stepsL(list, ans) {
    return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>') + '<br>Ответ: ' + ans + '.';
  }
  function plainSteps(list) { return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>'); }
  function ansC(P, t) { return '<b>' + nf(P, t) + '</b>'; }
  function plur(n, a, b, c) { return R.plural(n, [a, b, c]); }

  /* ================= выбор чисел ================= */
  function smallPart(P) {
    var f = P.f, r = Math.random();
    if (f === 10) return rand(1, 9);
    if (f === 100) return r < 0.65 ? rand(1, 19) * 5 : rand(1, 99);
    return r < 0.45 ? rand(1, 199) * 5 : r < 0.75 ? rand(1, 99) * 10 : rand(1, 999);
  }
  function bigRange(P) {
    switch (P.key) {
      case 'км-м': return [2, 60];
      case 'м-см': case 'ц-кг': case 'кг-г': return [2, 90];
      case 'т-кг': case 'т-ц': return [2, 60];
      default: return [2, 99];
    }
  }
  function randBig(P, lo, hi) { var r = bigRange(P); return rand(lo == null ? r[0] : lo, hi == null ? r[1] : hi); }
  /* составное число: {b, s, t} */
  function mkQ(P, lo, hi) { var b = randBig(P, lo, hi), s = smallPart(P); return { b: b, s: s, t: b * P.f + s }; }
  /* k, не оканчивающееся на 1 (для «таких», «в 21 ящике» и т. п.) */
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function randK(lo, hi) { var k, g = 0; do { k = rand(lo, hi); g++; } while (k % 10 === 1 && g < 50); return k; }
  var NICE = { 1000: [5, 10, 20, 25, 40, 50, 100, 125, 200, 250, 300, 400, 500, 600, 750], 100: [5, 10, 15, 20, 25, 30, 40, 50, 60, 75], 10: [2, 3, 4, 5, 6, 8] };

  /* ================= общие пошаговые записи (для теории и разборов) ================= */
  R.n2Nm = function (p, b, s) { return nm(PP(p), b, s); };
  R.n2Nf = function (p, t) { return nf(PP(p), t); };

  R.n2FlowHTML = function (steps) {
    return '<div class="n2flow">' + steps.map(function (st, i) {
      return '<div class="n2st"><b class="n2h">' + (i + 1) + '. ' + st.h + '</b><span class="n2t">' + st.t + '</span></div>';
    }).join('<span class="n2ar" aria-hidden="true">→</span>') + '</div>';
  };

  /* ленточная схема: k равных частей по partTxt, всего totalTxt (k = null — число частей неизвестно) */
  R.n2TapeSVG = function (k, partTxt, totalTxt, o) {
    o = o || {};
    var W = 360, H = 104, bw = 76, dw = 34, x = 12, y = 30, h = 34, cells = [], i, s = '', many = (k == null || k > 4);
    if (!many) for (i = 0; i < k; i++) cells.push('b');
    else cells = ['b', 'b', 'b', 'd', 'b'];
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
    return '<svg class="fig n2tape" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="' + (o.label || 'Ленточная схема') + '">' + s + '</svg>';
  };

  /* ---------- умножение ---------- */
  function mulCalc(P, b, s, k) {
    var f = P.f, smk = s * k, carry = Math.floor(smk / f);
    return { sm: smk, carry: carry, rs: smk % f, bm: b * k, rb: b * k + carry, total: (b * f + s) * k };
  }
  /* столбик с именами мер (умножение на однозначное число) */
  function colMulTable(P, b, s, k) {
    var c = mulCalc(P, b, s, k);
    var h = '<table class="n2col" role="img" aria-label="' + nm(P, b, s) + ' умножить на ' + k + ' равно ' + nf(P, c.total) + '"><tbody>';
    if (c.carry) h += '<tr class="cr"><td></td><td>+' + c.carry + '</td><td></td><td></td><td></td></tr>';
    h += '<tr><td></td><td>' + fmt(b) + '</td><td class="u">' + P.big + '</td><td>' + s + '</td><td class="u">' + P.small + '</td></tr>';
    h += '<tr><td class="op">×</td><td></td><td></td><td>' + k + '</td><td></td></tr>';
    h += '<tr class="ln"><td></td><td>' + fmt(c.rb) + '</td><td class="u">' + P.big + '</td><td>' + (c.rs ? c.rs : '') + '</td><td class="u">' + (c.rs ? P.small : '') + '</td></tr>';
    return h + '</tbody></table>';
  }
  /* строки пояснения «по мерам» */
  function mulLinesByMeasures(P, b, s, k) {
    var c = mulCalc(P, b, s, k), L = [];
    var l1 = 'Умножаем мелкую меру: ' + nu(s, P.small) + ' × ' + k + ' = ' + sm(P, c.sm) + '.';
    if (c.carry) {
      if (c.rs) l1 += ' Это ' + nm(P, c.carry, c.rs) + ': ' + nu(c.rs, P.small) + ' пишем, а ' + nu(c.carry, P.big) + ' запоминаем.';
      else l1 += ' Это ровно ' + nu(c.carry, P.big) + ': мелких мер не осталось, ' + nu(c.carry, P.big) + ' запоминаем.';
    } else l1 += ' Это меньше 1 ' + P.big + ', переносить нечего: пишем ' + sm(P, c.rs) + '.';
    L.push(l1);
    var l2 = 'Умножаем крупную меру: ' + nu(b, P.big) + ' × ' + k + ' = ' + nu(c.bm, P.big) + '.';
    if (c.carry) l2 += ' Прибавляем запомненные ' + nu(c.carry, P.big) + ': ' + fmt(c.bm) + ' + ' + c.carry + ' = ' + nu(c.rb, P.big) + '.';
    L.push(l2);
    return { lines: L, calc: c };
  }
  /* строки пояснения «раздробить — умножить — превратить» */
  function mulLinesFrag(P, b, s, k) {
    var a = b * P.f + s, res = a * k;
    return [
      'Раздробляем: ' + nm(P, b, s) + ' = ' + sm(P, a) + '.',
      'Умножаем как обычные числа: ' + fmt(a) + ' × ' + fmt(k) + ' = ' + fmt(res) + ', это ' + sm(P, res) + '.',
      'Превращаем: ' + sm(P, res) + ' = ' + nf(P, res) + '.'
    ];
  }
  /* R.n2MulHTML(пара, b, s, k, {method:1|2, flow:true}) */
  R.n2MulHTML = function (p, b, s, k, o) {
    var P = PP(p); o = o || {};
    var method = o.method || (k < 10 ? 2 : 1), h = '';
    if (method === 2) {
      var r = mulLinesByMeasures(P, b, s, k);
      h = '<div class="colrow">' + colMulTable(P, b, s, k) + '<div class="colsteps">' + plainSteps(r.lines) + '<br><b>Итого: ' + nf(P, r.calc.total) + '</b></div></div>';
    } else {
      var a = b * P.f + s, res = a * k;
      if (o.flow) {
        h += R.n2FlowHTML([
          { h: 'Раздробить', t: nm(P, b, s) + '<br>= ' + sm(P, a) },
          { h: 'Умножить', t: fmt(a) + ' × ' + fmt(k) + '<br>= ' + sm(P, res) },
          { h: 'Превратить', t: sm(P, res) + '<br>= ' + nf(P, res) }
        ]);
      }
      h += '<div class="colrow">' + R.mulHTML(a, k) + '<div class="colsteps">' + plainSteps(mulLinesFrag(P, b, s, k)) + '<br><b>Итого: ' + nf(P, res) + '</b></div></div>';
    }
    return h;
  };
  R.n2MulLine = function (p, b, s, k) {   /* одна строка для записи решения задачи */
    var P = PP(p), r;
    if (k < 10) {
      r = mulLinesByMeasures(P, b, s, k);
      return nm(P, b, s) + ' × ' + k + ': ' + nu(s, P.small) + ' × ' + k + ' = ' + sm(P, r.calc.sm) + (r.calc.carry ? ' = ' + nf(P, r.calc.sm) : '') + '; ' +
        nu(b, P.big) + ' × ' + k + ' = ' + nu(r.calc.bm, P.big) + (r.calc.carry ? '; ' + nu(r.calc.bm, P.big) + ' + ' + nu(r.calc.carry, P.big) + ' = ' + nu(r.calc.rb, P.big) : '') + '; получилось ' + nf(P, r.calc.total);
    }
    var a = b * P.f + s;
    return nm(P, b, s) + ' × ' + fmt(k) + ' = ' + sm(P, a) + ' × ' + fmt(k) + ' = ' + sm(P, a * k) + ' = ' + nf(P, a * k);
  };

  /* ---------- деление на отвлечённое число ---------- */
  function divRoute2(P, b, s, k) {
    var q1 = Math.floor(b / k), r1 = b % k, rest = r1 * P.f + s;
    return { q1: q1, r1: r1, rest: rest, q2: rest / k };
  }
  /* строки пояснения деления на число по мерам (b ≥ k) */
  function divLinesByMeasures(P, b, s, k) {
    var d = divRoute2(P, b, s, k), L = [], f = P.f;
    if (d.r1) {
      L.push('Делим крупную меру: ' + nu(b, P.big) + ' : ' + k + ' = ' + nu(d.q1, P.big) + ', остаток ' + nu(d.r1, P.big) + '.');
      L.push('Остаток раздробляем: ' + nu(d.r1, P.big) + ' = ' + sm(P, d.r1 * f) + (s ? ' и прибавляем ' + sm(P, s) + ': ' + fmt(d.r1 * f) + ' + ' + fmt(s) + ' = ' + sm(P, d.rest) : '') + '.');
      L.push('Делим: ' + sm(P, d.rest) + ' : ' + k + ' = ' + sm(P, d.q2) + '.');
    } else {
      L.push('Делим крупную меру: ' + nu(b, P.big) + ' : ' + k + ' = ' + nu(d.q1, P.big) + ' — без остатка.');
      L.push('Делим мелкую меру: ' + sm(P, s) + ' : ' + k + ' = ' + sm(P, d.q2) + '.');
    }
    L.push('Записываем вместе: ' + nf(P, d.q1 * f + d.q2) + '.');
    return { lines: L, d: d };
  }
  function divLinesFrag(P, b, s, k) {
    var t = b * P.f + s, q = t / k, L = [];
    L.push('Раздробляем делимое: ' + (s ? nm(P, b, s) : nu(b, P.big)) + ' = ' + sm(P, t) + '.');
    L.push('Делим: ' + sm(P, t) + ' : ' + fmt(k) + ' = ' + sm(P, q) + '.');
    L.push(q >= P.f ? 'Превращаем: ' + sm(P, q) + ' = ' + nf(P, q) + '.' : sm(P, q) + ' — меньше 1 ' + P.big + ', поэтому оставляем в ' + LOC[P.small] + '.');
    return L;
  }
  /* R.n2DivAbsHTML(пара, b, s, k, {route:1|2}) — деление именованного числа на отвлечённое */
  R.n2DivAbsHTML = function (p, b, s, k, o) {
    var P = PP(p); o = o || {};
    var route = o.route || (b >= k ? 2 : 1), t = b * P.f + s, h;
    if (route === 2 && b >= k) {
      var r = divLinesByMeasures(P, b, s, k);
      h = '<div class="colrow">' + R.divHTML(r.d.rest, k) + '<div class="colsteps">' + plainSteps(r.lines) + '</div></div>';
    } else {
      h = '<div class="colrow">' + R.divHTML(t, k) + '<div class="colsteps">' + plainSteps(divLinesFrag(P, b, s, k)) + '</div></div>';
    }
    return h;
  };

  /* ---------- деление по содержанию ---------- */
  /* описатель числа: {P, t, big} — big: записано ли с крупной мерой; txt — как напечатано */
  function dsc(P, t, style) {   /* style: 's' простое в мелких, 'b' простое в крупных, 'c' составное */
    var d = { P: P, t: t, style: style };
    if (style === 's') { d.txt = sm(P, t); d.big = false; }
    else if (style === 'b') { d.txt = nu(t / P.f, P.big); d.big = true; }
    else { d.txt = nm(P, Math.floor(t / P.f), t % P.f); d.big = true; }
    return d;
  }
  function divNamedLines(A, B) {
    var P = A.P, L = [], fr = [];
    [A, B].forEach(function (D) { if (D.big) fr.push(D.txt + ' = ' + sm(P, D.t)); });
    var sameBig = A.style === 'b' && B.style === 'b';
    if (sameBig) {
      L.push('Меры одинаковые (' + P.big + '), поэтому делим сразу: ' + fmt(A.t / P.f) + ' : ' + fmt(B.t / P.f) + ' = ' + fmt(A.t / B.t) + '.');
    } else if (A.style === 's' && B.style === 's') {
      L.push('Меры одинаковые (' + P.small + '), поэтому делим сразу: ' + fmt(A.t) + ' : ' + fmt(B.t) + ' = ' + fmt(A.t / B.t) + '.');
    } else {
      L.push('Выражаем оба числа в одинаковых (мелких) мерах, в ' + LOC[P.small] + ': ' + fr.join('; ') + (fr.length === 1 ? '; второе число уже в ' + LOC[P.small] + '.' : '.'));
      L.push('Делим: ' + sm(P, A.t) + ' : ' + sm(P, B.t) + ' = ' + fmt(A.t / B.t) + '.');
    }
    L.push('Частное — число без наименования: оно показывает, сколько раз ' + B.txt + ' содержится в ' + A.txt + '.');
    return L;
  }
  R.n2DivNamedHTML = function (A, B, o) {
    o = o || {};
    var L = divNamedLines(A, B), col = '';
    if (!o.nocol && A.t >= 100 && B.t >= 10 && !(A.style === 'b' && B.style === 'b')) col = R.divHTML(A.t, B.t);
    return '<div class="colrow">' + col + '<div class="colsteps">' + plainSteps(L) + '</div></div>';
  };
  R.n2Dsc = function (p, t, style) { return dsc(PP(p), t, style); };

  /* @@INSERT-1 */

  /* ================= устный счёт ================= */

  /* единицы и соотношения */
  reg('n2Conv', function (o) {
    o = o || {};
    var P = PP(pick(o.pairs || MORE)), dir = o.dir || pick(['down', 'up', 'comp', 'turn']), f = P.f, k, b, s, t;
    if (dir === 'down') {
      k = pick([2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 20, 25, 40, 60, 70, 90]);
      return { kind: 'num', html: 'Сколько ' + GEN[P.small] + ' в ' + nu(k, P.big) + '?', answer: k * f,
        hint: P.fact + '. Крупную меру заменяем мелкой — умножаем.',
        explain: P.fact + '. Значит, ' + nu(k, P.big) + ' = ' + k + ' × ' + fmt(f) + ' ' + P.small + ' = ' + sm(P, k * f) + '.' };
    }
    if (dir === 'up') {
      k = pick([2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 20, 25, 40, 60, 70, 90]);
      return { kind: 'num', html: 'Сколько ' + GEN[P.big] + ' в ' + sm(P, k * f) + '?', answer: k,
        hint: P.fact + '. Мелкую меру заменяем крупной — делим.',
        explain: P.fact + '. Значит, ' + sm(P, k * f) + ' = ' + fmt(k * f) + ' : ' + fmt(f) + ' = ' + nu(k, P.big) + '.' };
    }
    if (dir === 'comp') {
      var q = mkQ(P, o.bmin, o.bmax); b = q.b; s = q.s; t = q.t;
      return { kind: 'num', html: 'Вырази в ' + LOC[P.small] + ': ' + expr(nm(P, b, s) + ' = □ ' + P.small), answer: t,
        hint: P.fact + '. Сначала переведи крупные меры в мелкие, потом прибавь остаток.',
        explain: P.fact + '. ' + nu(b, P.big) + ' = ' + sm(P, b * f) + ', и ещё ' + sm(P, s) + ': ' + fmt(b * f) + ' + ' + fmt(s) + ' = ' + sm(P, t) + '.' };
    }
    var q2 = mkQ(P, o.bmin, o.bmax);
    return { kind: 'nums', html: 'Вырази в двух мерах: ' + expr(sm(P, q2.t) + ' = □ ' + P.big + ' □ ' + P.small), fields: fields(P), answer: [q2.b, q2.s],
      hint: P.fact + '. Раздели число на ' + fmt(f) + ': частное — крупные меры, остаток — мелкие.',
      explain: P.fact + '. ' + fmt(q2.t) + ' : ' + fmt(f) + ' = ' + fmt(q2.b) + ' (ост. ' + q2.s + '). Значит, ' + sm(P, q2.t) + ' = ' + nm(P, q2.b, q2.s) + '.' };
  });

  /* умножение и деление на 10, 100, 1 000 */
  reg('n2Pow', function (o) {
    o = o || {};
    var t = o.type || pick(['mul', 'mul', 'div', 'div', 'named']), p = pick([10, 100, 1000]);
    var z = p === 10 ? 'один ноль' : p === 100 ? 'два нуля' : 'три нуля', a, q, u;
    if (t === 'mul') {
      a = Math.random() < 0.6 ? rand(2, 99) : rand(100, 999);
      return { kind: 'num', html: expr(fmt(a) + ' × ' + fmt(p) + ' ='), answer: a * p,
        hint: 'Чтобы умножить на ' + fmt(p) + ', припиши справа ' + z + '.',
        explain: fmt(a) + ' × ' + fmt(p) + ' = ' + fmt(a * p) + ': приписываем справа ' + z + '.' };
    }
    if (t === 'div') {
      q = rand(2, 999); a = q * p;
      return { kind: 'num', html: expr(fmt(a) + ' : ' + fmt(p) + ' ='), answer: q,
        hint: 'Чтобы разделить на ' + fmt(p) + ', отбрось справа ' + z + '.',
        explain: fmt(a) + ' : ' + fmt(p) + ' = ' + fmt(q) + ': отбрасываем справа ' + z + '.' };
    }
    u = pick(['м', 'кг', 'см', 'г', 'руб.', 'ц', 'т', 'км', 'дм', 'коп.']);
    if (Math.random() < 0.5) {
      a = rand(2, 99);
      return { kind: 'num', html: expr(nu(a, u) + ' × ' + fmt(p) + ' = □ ' + u), answer: a * p,
        hint: 'Величину умножают на число, а название меры оставляют. Припиши справа ' + z + '.',
        explain: fmt(a) + ' × ' + fmt(p) + ' = ' + fmt(a * p) + ', название меры сохраняем: ' + sm({ small: u }, a * p) + '.' };
    }
    q = rand(2, 99); a = q * p;
    return { kind: 'num', html: expr(nu(a, u) + ' : ' + fmt(p) + ' = □ ' + u), answer: q,
      hint: 'Величину делят на число, а название меры оставляют. Отбрось справа ' + z + '.',
      explain: fmt(a) + ' : ' + fmt(p) + ' = ' + fmt(q) + ', название меры сохраняем: ' + nu(q, u) + '.' };
  });

  /* круглые числа */
  function stripZ(n) { var z = 0; while (n % 10 === 0) { n /= 10; z++; } return [n, z]; }
  reg('n2Round', function (o) {
    o = o || {};
    var t = o.type || pick(['mul', 'div', 'add', 'sub']), a, b, q, r, z;
    if (t === 'mul') {
      a = rand(2, 99) * pick([10, 10, 100]); b = rand(2, 9) * pick([10, 10, 100]);
      var sa = stripZ(a), sb = stripZ(b); z = sa[1] + sb[1];
      return { kind: 'num', html: expr(fmt(a) + ' × ' + fmt(b) + ' ='), answer: a * b,
        hint: 'Умножь числа без нулей, а потом припиши все нули справа.',
        explain: fmt(sa[0]) + ' × ' + sb[0] + ' = ' + fmt(sa[0] * sb[0]) + ', приписываем ' + z + ' ' + plur(z, 'ноль', 'нуля', 'нулей') + ': ' + fmt(a * b) + '.' };
    }
    if (t === 'div') {
      b = rand(2, 9) * pick([10, 10, 100]); q = rand(2, 99) * pick([1, 1, 10]); a = q * b;
      var sb2 = stripZ(b);
      return { kind: 'num', html: expr(fmt(a) + ' : ' + fmt(b) + ' ='), answer: q,
        hint: 'Убери одинаковое число нулей у делимого и делителя и раздели.',
        explain: fmt(a) + ' : ' + fmt(b) + ' = ' + fmt(a / Math.pow(10, sb2[1])) + ' : ' + sb2[0] + ' = ' + fmt(q) + ' (убрали по ' + sb2[1] + ' ' + plur(sb2[1], 'нулю', 'нуля', 'нулей') + ').' };
    }
    if (t === 'add') {
      a = rand(2, 60) * pick([100, 100, 1000]); b = rand(2, 60) * 100;
      return { kind: 'num', html: expr(fmt(a) + ' + ' + fmt(b) + ' ='), answer: a + b,
        hint: 'Считай сотнями (тысячами): сложи числа без нулей.',
        explain: fmt(a / 100) + ' сот. + ' + fmt(b / 100) + ' сот. = ' + fmt((a + b) / 100) + ' сот. = ' + fmt(a + b) + '.' };
    }
    b = rand(2, 40) * 100; a = b + rand(2, 40) * 100 * pick([1, 1, 10]);
    return { kind: 'num', html: expr(fmt(a) + ' − ' + fmt(b) + ' ='), answer: a - b,
      hint: 'Считай сотнями: вычти числа без двух нулей.',
      explain: fmt(a / 100) + ' сот. − ' + fmt(b / 100) + ' сот. = ' + fmt((a - b) / 100) + ' сот. = ' + fmt(a - b) + '.' };
  });

  /* дополнения до круглых чисел и до целой меры */
  reg('n2Compl', function (o) {
    o = o || {};
    var t = o.type || pick(['abs', 'unit', 'unit']), p, x, P, f;
    if (t === 'abs') {
      p = pick([100, 1000, 1000, 10000]);
      x = p === 100 ? rand(1, 19) * 5 : p === 1000 ? (Math.random() < 0.5 ? rand(1, 39) * 25 : rand(1, 99) * 10) : rand(1, 99) * 100;
      if (p === 100 && Math.random() < 0.4) x = rand(11, 99);
      return { kind: 'num', html: expr(fmt(p) + ' − ' + fmt(x) + ' ='), answer: p - x,
        hint: 'Дополни ' + fmt(x) + ' до круглого числа, потом до ' + fmt(p) + '.',
        explain: fmt(p) + ' − ' + fmt(x) + ' = ' + fmt(p - x) + '. Проверка: ' + fmt(p - x) + ' + ' + fmt(x) + ' = ' + fmt(p) + '.' };
    }
    P = PP(pick(o.pairs || ['км-м', 'м-см', 'т-кг', 'ц-кг', 'кг-г', 'руб-коп', 'м-дм']));
    f = P.f;
    x = f === 10 ? rand(1, 9) : f === 100 ? rand(1, 19) * 5 : (Math.random() < 0.5 ? rand(1, 39) * 25 : rand(1, 99) * 10);
    return { kind: 'num', html: expr(nu(1, P.big) + ' − ' + sm(P, x) + ' = □ ' + P.small), answer: f - x,
      hint: P.fact + '. Значит, надо вычесть ' + x + ' из ' + fmt(f) + '.',
      explain: P.fact + '. ' + fmt(f) + ' − ' + fmt(x) + ' = ' + fmt(f - x) + ', то есть ' + nu(1, P.big) + ' − ' + sm(P, x) + ' = ' + sm(P, f - x) + '.' };
  });

  /* сравнение величин */
  reg('n2Compare', function (o) {
    o = o || {};
    var P, q, f, cand, g = 0, r, leftTxt, rightTxt, opts = ['<', '=', '>'];
    do {
      P = PP(pick(o.pairs || MORE)); f = P.f; q = mkQ(P, 1, Math.min(bigRange(P)[1], 20)); g++;
    } while (g < 50 && (f === 10 && q.s === 0));
    cand = [q.t, q.t, q.t + f / 10, q.t - f / 10];
    if (q.s * 10 < f) cand.push(q.b * f + q.s * 10);
    if (f >= 100) cand.push(q.b * (f / 10) + q.s);
    if (q.s >= 10) cand.push(q.b * f + Math.floor(q.s / 10));
    cand = cand.filter(function (x) { return x > 0 && x === Math.floor(x); });
    r = pick(cand);
    leftTxt = nm(P, q.b, q.s);
    if (r % f === 0 && r >= f && Math.random() < 0.6) rightTxt = nu(r / f, P.big);
    else rightTxt = sm(P, r);
    var idx = q.t < r ? 0 : q.t === r ? 1 : 2, swap = Math.random() < 0.5;
    var L = swap ? rightTxt : leftTxt, Rr = swap ? leftTxt : rightTxt, lv = swap ? r : q.t, rv = swap ? q.t : r, ri = swap ? 2 - idx : idx;
    var conv = [leftTxt + ' = ' + sm(P, q.t)];
    if (rightTxt !== sm(P, r)) conv.push(rightTxt + ' = ' + sm(P, r)); else conv.push(rightTxt + ' уже записано в ' + LOC[P.small]);
    if (swap) conv.reverse();
    return { kind: 'choice', html: 'Сравни: ' + expr(L + ' … ' + Rr), options: opts, answer: ri, wide: false,
      hint: 'Вырази обе величины в одинаковых мерах — в мелких.',
      explain: P.fact + '. ' + conv.join('; ') + '. Сравниваем ' + fmt(lv) + ' и ' + fmt(rv) + ': ' + fmt(lv) + ' ' + opts[ri] + ' ' + fmt(rv) + '.' };
  });

  /* цепочка круглых чисел */
  reg('n2Chain', function (o) {
    var g = 0, start, v, log, items = [], i, ops;
    do {
      var b0 = pick([5, 6, 8, 9, 12, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90]), q0 = rand(2, 40), a0 = q0 * b0;
      items = [];
      if (a0 > 2000) { g++; continue; }
      start = fmt(a0) + ' : ' + b0; v = q0; log = [fmt(a0) + ' : ' + b0 + ' = ' + q0]; items = [];
      var steps = (o && o.steps) || 3;
      for (i = 0; i < steps; i++) {
        var opt = [], k;
        for (k = 2; k <= 9; k++) if (v * k <= 2000) opt.push(['×', k, v * k]);
        [10, 20, 30, 40, 50, 60, 70, 80, 90].forEach(function (m) { if (v * m <= 2000 && v > 1) opt.push(['×', m, v * m]); });
        [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90].forEach(function (d) { if (v % d === 0 && v / d >= 1 && d < v) opt.push([':', d, v / d]); });
        [10, 20, 30, 40, 50, 60, 100, 120, 150, 200, 250].forEach(function (m) { if (v + m <= 2000) opt.push(['+', m, v + m]); });
        [10, 20, 30, 40, 50, 60, 100, 120, 150, 200, 250, 300, 400, 500].forEach(function (m) { if (v > m) opt.push(['−', m, v - m]); });
        var ch = pick(opt); if (!ch) break;
        items.push(ch[0] + NB + ch[1]); log.push(fmt(v) + ' ' + ch[0] + ' ' + ch[1] + ' = ' + fmt(ch[2])); v = ch[2];
      }
      g++;
    } while (g < 60 && (items.length < (o && o.steps || 3) || v > 1000 || v < 1));
    var html = '<div class="chain"><span class="chain-start">' + start + '</span>' +
      items.map(function (t) { return '<span class="chain-op">' + t + '</span>'; }).join('') + '</div>';
    return { kind: 'num', html: 'Выполни цепочку по порядку:' + html, answer: v,
      hint: 'Начни с первого действия и выполняй действия одно за другим.',
      explain: 'По шагам: ' + log.join('; ') + '. Ответ: ' + fmt(v) + '.' };
  });

  /* сколько раз содержится / во сколько раз больше */
  reg('n2Ratio', function (o) {
    o = o || {};
    var P = PP(pick(o.pairs || MAIN)), f = P.f, q, D, T, Ttxt, Dtxt, g = 0, mode = o.mode || pick(['diff', 'diff', 'same', 'rev']);
    var lst = NICE[f] || [2, 3, 4, 5, 6, 8];
    if (mode === 'same') {
      var u = pick(['т', 'ц', 'кг', 'м', 'км', 'руб.', 'см']);
      D = rand(2, 40); q = rand(2, 30); T = q * D; Ttxt = nu(T, u); Dtxt = nu(D, u);
    } else if (mode === 'rev') {
      D = rand(2, 9) * f; q = rand(2, 40); T = q * D; Ttxt = sm(P, T); Dtxt = nu(D / f, P.big);
    } else {
      do { D = pick(lst); q = rand(2, 150); T = q * D; g++; } while (g < 300 && (T % f !== 0 || T / f < 2 || T / f > 200));
      if (T % f !== 0) { D = lst[0]; q = f / D * rand(2, 20); T = q * D; }
      Ttxt = nu(T / f, P.big); Dtxt = sm(P, D);
    }
    var w = pick([0, 1, 2, 3]), html;
    if (w === 0) html = 'Сколько раз ' + Dtxt + ' содержится в ' + Ttxt + '?';
    else if (w === 1) html = 'Во сколько раз ' + Ttxt + ' больше, чем ' + Dtxt + '?';
    else if (w === 2) html = 'Раздели ' + Ttxt + ' на части по ' + Dtxt + '. Сколько получилось частей?';
    else html = 'Во сколько раз ' + Dtxt + ' меньше, чем ' + Ttxt + '?';
    var same = mode === 'same';
    return { kind: 'num', html: html, answer: q,
      hint: same ? 'Меры одинаковые — дели числа.' : 'Вырази оба числа в одинаковых мерах — в мелких — и раздели.',
      explain: same ? fmt(T) + ' : ' + fmt(D) + ' = ' + fmt(q) + '. Частное — число без наименования.' :
        (mode === 'rev' ? nu(D / f, P.big) + ' = ' + sm(P, D) + '. ' : nu(T / f, P.big) + ' = ' + sm(P, T) + '. ') + fmt(T) + ' : ' + fmt(D) + ' = ' + fmt(q) + '. Частное — число без наименования.' };
  });

  /* увеличить / уменьшить в … раз, на … */
  reg('n2IncDec', function (o) {
    o = o || {};
    var t = o.type || pick(['times', 'less', 'plus', 'minus']), u = pick(['м', 'кг', 'ц', 'т', 'км', 'руб.', 'см', 'г', 'дм']), a, k, q;
    if (t === 'times') {
      a = rand(2, 99); k = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 100]);
      return { kind: 'num', html: 'Увеличь ' + nu(a, u) + ' в ' + fmt(k) + ' ' + plur(k, 'раз', 'раза', 'раз') + '. Сколько получилось ' + GEN[u] + '?', answer: a * k,
        hint: 'Увеличить в несколько раз — значит умножить.', explain: fmt(a) + ' × ' + fmt(k) + ' = ' + fmt(a * k) + ', то есть ' + nu(a * k, u) + '.' };
    }
    if (t === 'less') {
      q = rand(2, 99); k = pick([2, 3, 4, 5, 6, 8, 10, 100]); a = q * k;
      return { kind: 'num', html: 'Уменьши ' + nu(a, u) + ' в ' + fmt(k) + ' ' + plur(k, 'раз', 'раза', 'раз') + '. Сколько получилось ' + GEN[u] + '?', answer: q,
        hint: 'Уменьшить в несколько раз — значит разделить.', explain: fmt(a) + ' : ' + fmt(k) + ' = ' + fmt(q) + ', то есть ' + nu(q, u) + '.' };
    }
    if (t === 'plus') {
      a = rand(20, 99) * pick([1, 5]); k = rand(2, 19);
      return { kind: 'num', html: 'Увеличь ' + nu(a, u) + ' на ' + nu(k, u) + '. Сколько получилось ' + GEN[u] + '?', answer: a + k,
        hint: 'Увеличить на несколько единиц — значит прибавить.', explain: fmt(a) + ' + ' + fmt(k) + ' = ' + fmt(a + k) + ', то есть ' + nu(a + k, u) + '.' };
    }
    a = rand(20, 99) * pick([1, 5]); k = rand(2, a - 1);
    return { kind: 'num', html: 'Уменьши ' + nu(a, u) + ' на ' + nu(k, u) + '. Сколько получилось ' + GEN[u] + '?', answer: a - k,
      hint: 'Уменьшить на несколько единиц — значит вычесть.', explain: fmt(a) + ' − ' + fmt(k) + ' = ' + fmt(a - k) + ', то есть ' + nu(a - k, u) + '.' };
  });

  /* когда частное — число без наименования */
  reg('n2Which', function (o) {
    o = o || {};
    var wantAbs = o.abs == null ? Math.random() < 0.5 : !!o.abs, opts = [], rights = [], all = [], i, u, P, q, d, a, seen = {};
    function mk(named) {
      var tries = 0, txt, val, ex;
      do {
        P = PP(pick(MAIN)); q = rand(2, 40); tries++;
        if (named) {
          var mode = pick(['same', 'diff']);
          if (mode === 'same') { u = pick(['м', 'кг', 'т', 'км', 'ц', 'см', 'г']); d = rand(2, 9) * pick([1, 10]); a = q * d; txt = nu(a, u) + ' : ' + nu(d, u); ex = fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(q) + ' (число без наименования)'; }
          else { d = pick(NICE[P.f] || [2, 4, 5]); a = q * d; if (a % P.f !== 0) { txt = null; continue; } txt = nu(a / P.f, P.big) + ' : ' + sm(P, d); ex = fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(q) + ' (число без наименования)'; }
        } else {
          u = pick(['м', 'кг', 'т', 'км', 'ц', 'см', 'г', 'руб.']); d = rand(2, 9); a = q * d; txt = nu(a, u) + ' : ' + d; ex = fmt(a) + ' : ' + d + ' = ' + nu(q, u) + ' (именованное число)';
        }
      } while ((!txt || seen[txt]) && tries < 100);
      seen[txt] = 1; return { txt: txt, ex: ex };
    }
    var right = mk(wantAbs), others = [mk(!wantAbs), mk(!wantAbs), mk(!wantAbs)];
    all = [right].concat(others);
    var order = shuffle([0, 1, 2, 3]), options = order.map(function (i2) { return all[i2].txt; });
    return { kind: 'choice', html: 'В каком примере частное будет ' + (wantAbs ? '<b>числом без наименования</b>' : '<b>именованным числом</b>') + '?<span hidden>' + options.join('|') + '</span>', options: options, answer: order.indexOf(0), wide: false,
      hint: wantAbs ? 'Частное — число без наименования, когда величину делят на величину (делитель тоже с названием меры).' : 'Частное — именованное число, когда величину делят на число без названия.',
      explain: 'Сравним все примеры. ' + order.map(function (i2) { return all[i2].txt + ' — ' + all[i2].ex; }).join('; ') + '.' };
  });

  /* вид деления по вопросу задачи */
  var KIND_PLOTS = [
    { eq: function (T, k) { return fmt(T) + ' кг яблок разложили поровну в ' + k + ' ' + plur(k, 'ящик', 'ящика', 'ящиков') + '. Сколько килограммов яблок в каждом ящике?'; },
      ct: function (T, D) { return fmt(T) + ' кг яблок разложили в ящики по ' + fmt(D) + ' кг. Сколько ящиков потребовалось?'; } },
    { eq: function (T, k) { return 'Ленту длиной ' + fmt(T) + ' м разрезали поровну на ' + k + ' ' + plur(k, 'часть', 'части', 'частей') + '. Какова длина каждой части?'; },
      ct: function (T, D) { return 'Ленту длиной ' + fmt(T) + ' м разрезали на куски по ' + fmt(D) + ' м. Сколько получилось кусков?'; } },
    { eq: function (T, k) { return 'За ' + k + ' ' + plur(k, 'тетрадь', 'тетради', 'тетрадей') + ' заплатили ' + fmt(T) + ' руб. Сколько стоит одна тетрадь, если все они одинаковые по цене?'; },
      ct: function (T, D) { return 'На ' + fmt(T) + ' руб. купили тетради по ' + fmt(D) + ' руб. Сколько тетрадей купили?'; } },
    { eq: function (T, k) { return fmt(T) + ' т зерна погрузили поровну на ' + k + ' ' + plur(k, 'машину', 'машины', 'машин') + '. Сколько тонн зерна на каждой машине?'; },
      ct: function (T, D) { return fmt(T) + ' т зерна перевозят на машинах по ' + fmt(D) + ' т. Сколько машин нужно?'; } },
    { eq: function (T, k) { return 'За ' + k + ' ' + plur(k, 'час', 'часа', 'часов') + ' поезд прошёл ' + fmt(T) + ' км. Сколько километров он проходил за один час, если шёл равномерно?'; },
      ct: function (T, D) { return 'Путь в ' + fmt(T) + ' км разбили на этапы по ' + fmt(D) + ' км. Сколько этапов получилось?'; } },
    { eq: function (T, k) { return fmt(T) + ' кг муки поровну насыпали в ' + k + ' ' + plur(k, 'мешок', 'мешка', 'мешков') + '. Сколько килограммов муки в одном мешке?'; },
      ct: function (T, D) { return fmt(T) + ' кг муки насыпали в мешки по ' + fmt(D) + ' кг. Сколько понадобилось мешков?'; } }
  ];
  reg('n2DivKind', function (o) {
    var pl = pick(KIND_PLOTS), eq = Math.random() < 0.5, k, D, q = rand(3, 40), T, html;
    if (eq) { k = randK(3, 9); T = k * rand(12, 90); html = pl.eq(T, k); }
    else { D = rand(3, 9) * pick([5, 10, 20, 25]); T = D * q; html = pl.ct(T, D); }
    var opts = shuffle(['на равные части', 'по содержанию']);
    var right = eq ? 'на равные части' : 'по содержанию';
    return { kind: 'choice', html: html + '<br><span class="soft">Какое здесь нужно деление?</span>', options: opts, answer: opts.indexOf(right), wide: false,
      hint: 'Подумай: что известно — на сколько частей делят или сколько в одной части?',
      explain: eq ? 'Известно, на сколько равных частей делят (' + k + '), а надо найти, сколько в одной части. Это деление на равные части: делитель — число без наименования, частное — именованное число.'
        : 'Известно, сколько в одной части (' + fmt(D) + '), а надо узнать, сколько таких частей. Это деление по содержанию: делитель — величина, частное — число без наименования.' };
  });

  /* в каких мерах выразить */
  reg('n2Mes', function (o) {
    var P = PP(pick(o.pairs || MAIN)), f = P.f, D, q, T, A, B, styleA = pick(['b', 'c']), g = 0, dz;
    do {
      D = pick(NICE[f] || [2, 4, 5]); q = rand(2, 60); T = q * D; g++;
    } while (g < 200 && (styleA === 'b' ? T % f !== 0 : (T % f === 0 || T < f)));
    if (styleA === 'b' && T % f !== 0) styleA = 'c';
    if (styleA === 'c' && (T % f === 0 || T < f)) { T = f * rand(2, 9); D = f / (f === 10 ? 2 : 4); styleA = 'b'; }
    A = dsc(P, T, styleA); B = dsc(P, D, 's');
    var pool = ['в ' + LOC[P.big], 'в ' + LOC[P.small], 'в ' + ((P.kind === 'wt' || P.kind === 'money') ? 'метрах' : 'килограммах'), 'ничего выражать не нужно, можно делить сразу'];
    var right = 'в ' + LOC[P.small];
    var opts = shuffle(pool.slice());
    return { kind: 'choice', html: 'Надо разделить ' + expr(A.txt + ' : ' + B.txt) + '. В каких мерах удобно выразить оба числа?', options: opts, answer: opts.indexOf(right), wide: true,
      hint: 'Выбери такие меры, в которых оба числа получатся целыми.',
      explain: 'Мелкая мера — ' + P.small + ' (' + P.fact + '). В ' + LOC[P.big] + ' число ' + B.txt + ' не получится целым. Поэтому выражаем оба числа в ' + LOC[P.small] + ': ' + (A.big ? A.txt + ' = ' + sm(P, A.t) + '; ' : '') + B.txt + '.' };
  });

  /* ================= умножение на число ================= */

  /* ошибки в умножении: массив {t, why} */
  function mulErrors(P, b, s, k) {
    var c = mulCalc(P, b, s, k), f = P.f, right = c.total, out = [], h = f / 10;
    out.push({ t: c.bm * f + s, why: 'умножили только крупную меру, а мелкую ' + sm(P, s) + ' оставили без изменения' });
    if (c.carry) out.push({ t: c.bm * f + c.rs, why: 'забыли прибавить к крупным мерам запомненные ' + nu(c.carry, P.big) });
    out.push({ t: (c.rb + (Math.random() < 0.5 ? 1 : -1)) * f + c.rs, why: 'ошиблись при сложении крупных мер' });
    if (h >= 10 && c.sm >= h) out.push({ t: (c.bm + Math.floor(c.sm / h)) * f + (c.sm % h), why: 'считали, что 1 ' + P.big + ' = ' + fmt(h) + ' ' + P.small + ' (а не ' + fmt(f) + ')' });
    out.push({ t: right + (Math.random() < 0.5 ? h : -h), why: 'ошиблись в вычислении мелких мер' });
    out = out.filter(function (e) { return e.t !== right && e.t > 0; });
    var seen = {}; return out.filter(function (e) { if (seen[e.t]) return false; seen[e.t] = 1; return true; });
  }

  reg('n2Mul', function (o) {
    o = o || {};
    var src = o.src || 'comp', kmin = o.kmin || 2, kmax = o.kmax || 9, P, b, s, k, t, res, g = 0, ok, c;
    do {
      P = PP(pick(o.pairs || MAIN));
      var r = bigRange(P), hi = kmax >= 10 ? Math.min(r[1], 40) : r[1];
      b = rand(o.bmin || r[0], Math.min(o.bmax || hi, hi > (o.bmin || r[0]) ? (o.bmax || hi) : hi + 5));
      k = o.kset ? pick(o.kset) : rand(kmin, kmax);
      if (o.rz) { var gg = gcd(P.f, k); s = gg > 1 ? (P.f / gg) * rand(1, gg - 1) : 0; }
      else s = o.sr ? rand(o.sr[0], Math.min(o.sr[1], P.f - 1)) : smallPart(P);
      t = b * P.f + s; res = t * k; c = mulCalc(P, b, s, k); g++;
      ok = res <= 2000000;
      if (src === 'comp') {
        ok = ok && s > 0 && (o.rz ? res % P.f === 0 : res % P.f !== 0);
        if (o.ov === true) ok = ok && c.carry > 0;
        if (o.ov === false) ok = ok && c.carry === 0;
      }
    } while (!ok && g < 400);
    if (src === 'simple') {
      /* простое именованное число (в мелкой мере) × число; ответ либо в той же мере, либо в двух мерах */
      var x, ans;
      g = 0;
      do { x = smallPart(P); k = o.kset ? pick(o.kset) : rand(kmin, kmax); res = x * k; g++; } while (g < 200 && (o.res === 'turn' ? (res < P.f || res % P.f === 0) : false));
      if (o.res === 'turn') {
        var sp = splitT(P, res);
        return { kind: 'nums', html: 'Умножь и запиши ответ в двух мерах: ' + expr(sm(P, x) + ' × ' + fmt(k) + ' ='), fields: fields(P), answer: sp,
          hint: 'Умножь число, название меры оставь. Потом преврати результат: ' + P.fact + '.',
          explain: sm(P, x) + ' × ' + fmt(k) + ': ' + fmt(x) + ' × ' + fmt(k) + ' = ' + fmt(res) + ', это ' + sm(P, res) + '. Превращаем: ' + fmt(res) + ' : ' + fmt(P.f) + ' = ' + fmt(sp[0]) + ' (ост. ' + sp[1] + '), то есть ' + nf(P, res) + '.' };
      }
      return { kind: 'num', html: 'Умножь: ' + expr(sm(P, x) + ' × ' + fmt(k) + ' = □ ' + P.small), answer: res,
        hint: 'Умножь число на число, название меры оставь.', explain: fmt(x) + ' × ' + fmt(k) + ' = ' + fmt(res) + ', значит ' + sm(P, x) + ' × ' + fmt(k) + ' = ' + sm(P, res) + '.' };
    }
    var sp2 = splitT(P, res);
    var hint = k < 10 ? 'Умножь сначала мелкую меру, потом крупную. Если мелких мер стало больше, чем в одной крупной (' + P.fact + '), преврати лишнее в крупные и прибавь к ним.' + (sp2[1] === 0 ? ' Если мелких мер не осталось, во второе поле впиши 0.' : '')
      : 'Раздроби число в мелкие меры (' + P.fact + '), умножь как обычные числа, а результат преврати в крупные меры.';
    var explain = (k < 10 ? 'Умножаем по мерам:' : 'Раздробили — умножили — превратили:') + R.n2MulHTML(P, b, s, k) + 'Ответ: ' + ansC(P, res) + '.';
    return { kind: 'nums', html: 'Умножь: ' + expr(nm(P, b, s) + ' × ' + fmt(k) + ' ='), fields: fields(P), answer: sp2, hint: hint, explain: explain };
  });

  /* выбор верного результата умножения */
  reg('n2MulCheck', function (o) {
    o = o || {};
    var P, b, s, k, c, g = 0, errs;
    do {
      P = PP(pick(o.pairs || MAIN)); b = randBig(P, 2, 30); s = smallPart(P); k = rand(o.kmin || 3, o.kmax || 9); c = mulCalc(P, b, s, k); errs = mulErrors(P, b, s, k); g++;
    } while (g < 200 && (c.carry === 0 || c.rs === 0 || errs.length < 3));
    var wrong = shuffle(errs).slice(0, 3), right = nf(P, c.total);
    var opts = shuffle([{ txt: right, why: '' }].concat(wrong.map(function (e) { return { txt: nf(P, e.t), why: e.why }; })));
    var idx = 0; opts.forEach(function (e, i) { if (e.txt === right) idx = i; });
    return { kind: 'choice', html: 'Выбери верный результат: ' + expr(nm(P, b, s) + ' × ' + k + ' ='), options: opts.map(function (e) { return e.txt; }), answer: idx, wide: false,
      hint: 'Не забудь умножить обе меры и превратить лишние мелкие меры в крупные (' + P.fact + ').',
      explain: 'Верно: ' + R.n2MulLine(P, b, s, k) + '. Остальные ответы неверны: ' + opts.filter(function (e) { return e.txt !== right; }).map(function (e) { return e.txt + ' — ' + e.why; }).join('; ') + '.' };
  });

  /* «верно ли равенство» */
  reg('n2Verify', function (o) {
    o = o || {};
    var op = o.op || pick(['mul', 'div']), good = Math.random() < 0.5, P, b, s, k, g = 0;
    if (op === 'mul') {
      var c, errs;
      do { P = PP(pick(o.pairs || MAIN)); b = randBig(P, 2, 40); s = smallPart(P); k = rand(3, 9); c = mulCalc(P, b, s, k); errs = mulErrors(P, b, s, k); g++; } while (g < 200 && (c.rs === 0 || errs.length < 1));
      var er = pick(errs), shown = good ? c.total : er.t;
      return { kind: 'choice', html: 'Верно ли равенство?<br>' + expr(nm(P, b, s) + ' × ' + k + ' = ' + nf(P, shown)), options: ['Верно', 'Неверно'], answer: good ? 0 : 1, wide: false,
        hint: 'Пересчитай произведение сам: умножь обе меры и преврати лишнее.',
        explain: 'Пересчитаем: ' + R.n2MulLine(P, b, s, k) + '. ' + (good ? 'Получилось то же число, значит равенство верно.' : 'В равенстве записано ' + nf(P, er.t) + ' — это ошибка: ' + er.why + '. Верно: ' + nf(P, c.total) + '.') };
    }
    var q, tot, d, errD;
    do {
      P = PP(pick(o.pairs || MAIN)); k = rand(3, 9); q = mkQ(P, 1, 30); tot = q.t * k; d = splitT(P, tot); g++;
    } while (g < 200 && (d[1] === 0 || d[0] < 1 || q.s === 0));
    var wrongT = [];
    wrongT.push({ t: q.t + (Math.random() < 0.5 ? 1 : -1) * Math.max(1, P.f / 10), why: 'ошибка в вычислении' });
    var dv = divRoute2(P, d[0], d[1], k);
    if (d[0] >= k && dv.r1) wrongT.push({ t: dv.q1 * P.f + Math.floor(d[1] / k), why: 'остаток крупной меры не раздробили и не прибавили к мелкой мере' });
    if (q.s >= 10) wrongT.push({ t: q.b * P.f + Math.floor(q.s / 10), why: 'потеряли ноль в мелкой мере' });
    wrongT = wrongT.filter(function (e) { return e.t > 0 && e.t !== q.t; });
    var ew = pick(wrongT), sh = good ? q.t : ew.t;
    return { kind: 'choice', html: 'Верно ли равенство?<br>' + expr(nm(P, d[0], d[1]) + ' : ' + k + ' = ' + nf(P, sh)), options: ['Верно', 'Неверно'], answer: good ? 0 : 1, wide: false,
      hint: 'Проверь обратным действием: умножь частное на делитель — должно получиться делимое.',
      explain: 'Проверка умножением: ' + nf(P, sh) + ' × ' + k + ' = ' + nf(P, sh * k) + (good ? ' — получилось делимое ' + nm(P, d[0], d[1]) + ', значит, равенство верно.' : ', а делимое — ' + nm(P, d[0], d[1]) + '. Значит, ошибка (' + ew.why + '). Верно: ' + nf(P, q.t) + '.') };
  });

  /* ================= деление ================= */
  reg('n2DivAbs', function (o) {
    o = o || {};
    var src = o.src || pick(['simple', 'comp']), P, k, g = 0, kmin = o.kmin || 2, kmax = o.kmax || 9;
    if (src === 'simple') {
      var mode = o.mode || pick(['same', 'frag']);
      if (mode === 'same') {
        var u = pick(['м', 'кг', 'см', 'г', 'руб.', 'ц', 'т', 'км', 'дм']), qq = o.qmax ? rand(2, o.qmax) : rand(2, 999) * pick([1, 1, 10]);
        k = rand(kmin, kmax); var X = qq * k;
        while (X > 900000) { qq = Math.floor(qq / 10) || 2; X = qq * k; }
        return { kind: 'num', html: 'Раздели: ' + expr(nu(X, u) + ' : ' + k + ' = □ ' + u), answer: qq,
          hint: 'Величину делят на число как обычные числа, а название меры оставляют.',
          explain: '<div class="colrow">' + R.divHTML(X, k) + '<div class="colsteps">Делим числа: ' + fmt(X) + ' : ' + k + ' = ' + fmt(qq) + '. Название меры сохраняем: ' + nu(qq, u) + '.</div></div>Ответ: ' + num(qq) + ' ' + u + '.' };
      }
      var X2, qt;
      do {
        P = PP(pick(o.pairs || MAIN)); k = rand(kmin, kmax); X2 = rand(2, 99); qt = X2 * P.f / k; g++;
      } while (g < 500 && (Math.floor(qt) !== qt || X2 % k === 0 || qt % P.f === 0));
      var sp = splitT(P, qt), t2 = X2 * P.f;
      var ex = 'Число крупных мер (' + X2 + ') ' + (X2 >= k ? 'не делится на ' + k + ' нацело, поэтому остаток надо раздробить.' : 'меньше делителя ' + k + ', поэтому сразу раздробляем.') + R.n2DivAbsHTML(P, X2, 0, k, { route: X2 >= k ? 2 : 1 });
      if (qt >= P.f) {
        return { kind: 'nums', html: 'Раздели: ' + expr(nu(X2, P.big) + ' : ' + k + ' ='), fields: fields(P), answer: sp,
          hint: 'Разделить нацело не получается — раздроби остаток (или всё число) в мелкие меры (' + P.fact + ').',
          explain: ex + 'Ответ: ' + ansC(P, qt) + '.' };
      }
      return { kind: 'num', html: 'Раздели: ' + expr(nu(X2, P.big) + ' : ' + k + ' = □ ' + P.small) + '<br><span class="soft">Ответ запиши в ' + LOC[P.small] + '.</span>', answer: qt,
        hint: 'Раздроби число в мелкие меры (' + P.fact + ') и раздели.',
        explain: ex + 'Ответ: ' + sm(P, qt) + '.' };
    }
    /* составное ÷ число */
    var qform = o.qform || (o.route === 'frag' ? 'small' : o.route === 'measures' ? 'comp' : pick(['comp', 'comp', 'small'])), qt2, tot, b, s, ok;
    do {
      P = PP(pick(o.pairs || MAIN)); k = rand(kmin, kmax);
      if (qform === 'comp') { var qc = mkQ(P, 1, o.qbmax || (kmax > 20 ? 12 : 30)); qt2 = qc.t; } else { qt2 = smallPart(P); }
      tot = qt2 * k; b = Math.floor(tot / P.f); s = tot % P.f; g++;
      ok = tot <= 2000000 && s !== 0 && b >= 1 && (qform === 'comp' ? (qt2 >= P.f && qt2 % P.f !== 0) : qt2 < P.f);
      if (ok && o.route === 'frag') ok = b < k;
      if (ok && o.route === 'measures') ok = b >= k;
    } while (!ok && g < 800);
    var route = b >= k ? 2 : 1, spq = splitT(P, qt2);
    var expl = 'Делим на число ' + k + ' (частное — величина):' + R.n2DivAbsHTML(P, b, s, k, { route: route }) + 'Ответ: ' + ansC(P, qt2) + '. Проверка умножением: ' + nf(P, qt2) + ' × ' + k + ' = ' + nf(P, tot) + '.';
    var hint = 'Раздроби делимое в мелкие меры (' + P.fact + '), раздели и преврати результат. Или дели по мерам: сначала крупную, остаток раздробляй.';
    if (qt2 >= P.f) return { kind: 'nums', html: 'Раздели: ' + expr(nm(P, b, s) + ' : ' + k + ' ='), fields: fields(P), answer: spq, hint: hint, explain: expl };
    return { kind: 'num', html: 'Раздели: ' + expr(nm(P, b, s) + ' : ' + k + ' = □ ' + P.small) + '<br><span class="soft">Ответ запиши в ' + LOC[P.small] + '.</span>', answer: qt2, hint: hint, explain: expl };
  });

  /* выбор чисел для деления по содержанию: mode ss | sc | cs | cc; возвращает {P, A, B, q, T, D} */
  function sampleDiv(mode, o) {
    o = o || {};
    var g = 0, P, f, q, D, T, styleA, styleB, ok, lst, pat, dq, pairs = o.pairs || MAIN, tmax = o.tmax || 2000000;
    do {
      P = PP(pick(pairs)); f = P.f; lst = NICE[f] || [2, 4, 5]; g++; ok = true;
      if (mode === 'ss') {
        q = rand(o.qmin || 2, o.qmax || 60);
        pat = pick(o.pats || ['bs', 'bs', 'bs', 'bs', 'bs', 'bs', 'sb', 'bb', 'ss']);
        if (pat === 'bs') { D = pick(lst); styleA = 'b'; styleB = 's'; }
        else if (pat === 'sb') { D = rand(2, 12) * f; styleA = 's'; styleB = 'b'; }
        else if (pat === 'bb') { D = rand(2, 20) * f; styleA = 'b'; styleB = 'b'; }
        else { D = pick(lst); styleA = 's'; styleB = 's'; }
        T = q * D;
        ok = T <= tmax && (styleA !== 'b' || (T % f === 0 && T / f >= 2 && T / f <= 999)) && (styleA !== 's' || T < 200000);
      } else if (mode === 'cs') {
        q = rand(o.qmin || 2, o.qmax || 40); D = pick(lst); styleB = 's'; styleA = 'c'; T = q * D;
        ok = T <= tmax && T % f !== 0 && T >= f;
      } else {
        q = rand(o.qmin || 2, o.qmax || 30); dq = mkQ(P, 1, Math.min(o.dbmax || 12, f >= 1000 ? 6 : 12)); D = dq.t; styleB = 'c';
        if (D > 1000 && q > 25) q = rand(o.qmin || 2, 25);
        T = q * D;
        if (mode === 'sc') {
          styleA = (g < 500) ? 'b' : 's';
          ok = T <= tmax && D % f !== 0 && (styleA === 'b' ? (T % f === 0 && T / f >= 2 && T / f <= 999) : T < 200000);
        } else {
          styleA = 'c';
          ok = T <= tmax && T % f !== 0 && D % f !== 0;
        }
      }
    } while (!ok && g < 1500);
    return { P: P, A: dsc(P, T, styleA), B: dsc(P, D, styleB), q: q, T: T, D: D };
  }
  reg('n2DivNamed', function (o) {
    o = o || {};
    var x = sampleDiv(pick(o.modes || [o.mode || 'ss']), o), P = x.P;
    return { kind: 'num', html: 'Раздели: ' + expr(x.A.txt + ' : ' + x.B.txt + ' ='), answer: x.q,
      hint: 'Если меры разные, вырази оба числа в одинаковых мерах — в мелких (' + P.fact + '). Частное будет числом без наименования.',
      explain: R.n2DivNamedHTML(x.A, x.B) + 'Ответ: ' + num(x.q) + '. Проверка: ' + x.B.txt + ' × ' + fmt(x.q) + ' = ' + x.A.txt + '.' };
  });


  /* названия чисел при действиях с именованными числами */
  reg('n2Role', function (o) {
    o = o || {};
    var op = o.op || pick(['mul', 'divabs', 'divnamed']), P = PP(pick(MAIN)), eq, roles, names, k, q, D, T, A, B, C, g = 0;
    if (op === 'mul') {
      do { q = mkQ(P, 1, 30); k = rand(2, 9); g++; } while (g < 100 && (q.t * k) % P.f === 0);
      A = nf(P, q.t); B = String(k); C = nf(P, q.t * k);
      eq = A + ' × ' + B + ' = ' + C; names = ['множимое', 'множитель', 'произведение'];
      roles = [[A, names[0], 'именованное число'], [B, names[1], 'число без наименования'], [C, names[2], 'именованное число']];
    } else if (op === 'divabs') {
      do { q = mkQ(P, 1, 30); k = rand(2, 9); g++; } while (g < 100 && (q.t * k) % P.f === 0);
      A = nf(P, q.t * k); B = String(k); C = nf(P, q.t);
      eq = A + ' : ' + B + ' = ' + C; names = ['делимое', 'делитель', 'частное'];
      roles = [[A, names[0], 'именованное число'], [B, names[1], 'число без наименования'], [C, names[2], 'именованное число']];
    } else {
      D = pick(NICE[P.f] || [2, 4, 5]); q = rand(3, 30); T = q * D;
      A = nf(P, T); B = sm(P, D); C = String(q);
      eq = A + ' : ' + B + ' = ' + C; names = ['делимое', 'делитель', 'частное'];
      roles = [[A, names[0], 'именованное число'], [B, names[1], 'именованное число'], [C, names[2], 'число без наименования']];
    }
    if (Math.random() < 0.5) {
      var r = pick(roles), opts = shuffle(names.slice());
      return { kind: 'choice', html: 'В равенстве ' + expr(eq) + ' число <b>' + r[0] + '</b> называется…', options: opts, answer: opts.indexOf(r[1]), wide: false,
        hint: 'Вспомни названия чисел при ' + (op === 'mul' ? 'умножении: множимое × множитель = произведение.' : 'делении: делимое : делитель = частное.'),
        explain: 'В записи «' + eq + '» число ' + r[0] + ' — это ' + r[1] + ' (' + r[2] + ').' };
    }
    var abs = roles.filter(function (x) { return x[2] === 'число без наименования'; })[0];
    var texts = shuffle(roles.map(function (x) { return x[0]; }));
    return { kind: 'choice', html: 'Какое из чисел в равенстве ' + expr(eq) + ' записано <b>без названия меры</b>?', options: texts, answer: texts.indexOf(abs[0]), wide: false,
      hint: 'Ищи число, рядом с которым нет км, м, кг, руб. и других названий.',
      explain: 'Без названия меры записано число ' + abs[0] + ' — это ' + abs[1] + '. ' + (op === 'divnamed' ? 'Когда величину делят на величину, частное — число без наименования.' : op === 'mul' ? 'Множитель всегда число без наименования: он показывает, сколько раз повторяют величину.' : 'Делитель — число без наименования: оно показывает, на сколько равных частей делят.') };
  });

  /* выбор верного частного при делении именованных чисел */
  reg('n2DivCheck', function (o) {
    o = o || {};
    var x = sampleDiv(pick(o.modes || ['cs', 'sc', 'cc']), o), P = x.P, A = x.A, B = x.B, q = x.q, f = P.f, cand = [], seen = {}, out = [], right = { v: q, why: '' };
    function add(v, why) { if (v > 0 && v === Math.floor(v) && v !== q && !seen[v]) { seen[v] = 1; cand.push({ v: v, why: why }); } }
    var Tb = Math.floor(x.T / f), Db = Math.floor(x.D / f);
    if (Db >= 1 && Tb >= Db) add(Math.floor(Tb / Db), 'разделили только крупные меры (' + fmt(Tb) + ' : ' + fmt(Db) + '), а мелкие забыли');
    if (B.style === 'b' && A.style !== 'b') add(x.T / Db, 'не раздробили делитель: делили ' + fmt(x.T) + ' на ' + fmt(Db) + ', а надо на ' + fmt(x.D));
    if (A.style === 'c' && B.style === 's') add(Math.floor((Tb * f) / x.D), 'раздробили только крупную часть делимого и не прибавили мелкую');
    add(q * 10, 'лишний ноль в частном'); if (q % 10 === 0) add(q / 10, 'потеряли ноль в частном');
    add(q + 1, 'ошибка при делении'); add(q - 1, 'ошибка при делении'); add(q + 2, 'ошибка при делении');
    var wrong = cand.slice(0, 3), k2 = 3;
    while (wrong.length < 3 && k2 < 12) { if (!seen[q + k2]) { seen[q + k2] = 1; wrong.push({ v: q + k2, why: 'ошибка при делении' }); } k2++; }
    var opts = shuffle([right].concat(wrong)), idx = 0; opts.forEach(function (e, i) { if (e === right) idx = i; });
    return { kind: 'choice', html: 'Выбери верное частное: ' + expr(A.txt + ' : ' + B.txt + ' ='), options: opts.map(function (e) { return fmt(e.v); }), answer: idx, wide: false,
      hint: 'Сначала вырази оба числа в одинаковых мерах, потом дели.',
      explain: 'Верно: ' + fmt(q) + '. ' + plainSteps(divNamedLines(A, B).slice(0, 2)) + '<br>Остальные ответы неверны: ' + opts.filter(function (e) { return e !== right; }).map(function (e) { return fmt(e.v) + ' — ' + e.why; }).join('; ') + '.' };
  });

  /* @@INSERT-2 */

  /* ================= выражения с именованными числами ================= */
  function Ql(P, t) { return { ty: 'Q', P: P, v: t }; }
  function Kl(v) { return { ty: 'K', v: v }; }
  function Op(op, a, b, br) { return { op: op, a: a, b: b, br: !!br }; }
  var EB = 99;
  function mq(P, lo, hi) { return mkQ(P, Math.min(lo, EB), Math.min(hi, EB)); }
  function rQ(P, lo, hi) { return Ql(P, mq(P, lo, hi).t); }
  function rSmall(P) { return Ql(P, pick(NICE[P.f] || [2, 4, 5])); }
  function showNode(n) {
    if (n.op === undefined) return n.ty === 'Q' ? nf(n.P, n.v) : fmt(n.v);
    var t = showNode(n.a) + NB + n.op + NB + showNode(n.b);
    return n.br ? '(' + t + ')' : t;
  }
  function valTxt(x) { return x.ty === 'Q' ? nf(x.P, x.v) : fmt(x.v); }
  function isCompV(x) { return x.ty === 'Q' && x.v >= x.P.f && x.v % x.P.f !== 0; }
  function styleV(x) { return isCompV(x) ? 'c' : x.v >= x.P.f && x.v % x.P.f === 0 ? 'b' : 's'; }
  function stepTxt(op, a, b, r) {
    var P = a.P || b.P, parts = [valTxt(a) + ' ' + op + ' ' + valTxt(b)], mid = null;
    if (P) {
      var needs = isCompV(a) || isCompV(b) || (a.ty === 'Q' && b.ty === 'Q' && styleV(a) !== styleV(b));
      if ((op === '+' || op === '−') && needs) mid = sm(P, a.v) + ' ' + op + ' ' + sm(P, b.v) + ' = ' + (r.ty === 'Q' ? sm(P, r.v) : fmt(r.v));
      else if ((op === '×' || op === ':') && a.ty === 'Q' && b.ty === 'K' && isCompV(a)) mid = sm(P, a.v) + ' ' + op + ' ' + fmt(b.v) + ' = ' + sm(P, r.v);
      else if (op === ':' && a.ty === 'Q' && b.ty === 'Q' && needs) mid = sm(P, a.v) + ' : ' + sm(P, b.v) + ' = ' + fmt(r.v);
    }
    var fin = valTxt(r);
    if (mid !== null && mid.slice(-fin.length) !== fin) return parts[0] + ' = ' + mid + ' = ' + fin;
    return parts[0] + ' = ' + (mid !== null ? mid : fin);
  }
  function evalNode(n, steps) {
    if (n.op === undefined) return n;
    var a = evalNode(n.a, steps), b = a && evalNode(n.b, steps), r, P;
    if (!a || !b) return null;
    P = a.P || b.P;
    switch (n.op) {
      case '+': if (a.ty !== b.ty) return null; r = { ty: a.ty, P: P, v: a.v + b.v }; break;
      case '−': if (a.ty !== b.ty || a.v < b.v) return null; r = { ty: a.ty, P: P, v: a.v - b.v }; break;
      case '×':
        if (a.ty === 'Q' && b.ty === 'K') r = { ty: 'Q', P: P, v: a.v * b.v };
        else if (a.ty === 'K' && b.ty === 'K') r = { ty: 'K', v: a.v * b.v };
        else return null;
        break;
      default:
        if (b.v === 0 || a.v % b.v !== 0) return null;
        if (a.ty === 'Q' && b.ty === 'K') r = { ty: 'Q', P: P, v: a.v / b.v };
        else if (a.ty === 'Q' && b.ty === 'Q') r = { ty: 'K', v: a.v / b.v };
        else if (a.ty === 'K' && b.ty === 'K') r = { ty: 'K', v: a.v / b.v };
        else return null;
    }
    if (r.v > 1e7) return null;
    steps.push(stepTxt(n.op, a, b, r));
    return r;
  }
  function split2(P, S) { var a = rand(Math.max(1, Math.floor(S * 0.25)), Math.max(1, Math.floor(S * 0.75))); return [Ql(P, a), Ql(P, S - a)]; }
  function K9() { return Kl(rand(2, 9)); }
  var EXP_MUL = [
    function (P) { return Op('×', Op('+', rQ(P, 1, 30), rQ(P, 1, 30), true), K9()); },
    function (P) { var A = rQ(P, 3, 40), B = rQ(P, 1, Math.floor(A.v / P.f) - 1); return Op('×', Op('−', A, B, true), K9()); },
    function (P) { return Op('+', Op('×', rQ(P, 1, 25), K9()), rQ(P, 1, 30)); },
    function (P) { var A = rQ(P, 1, 25), k = rand(2, 9); return Op('−', Op('×', A, Kl(k)), rQ(P, 1, Math.max(1, Math.floor(A.v * k / P.f) - 1))); },
    function (P) { var A = rQ(P, 1, 15), k = rand(2, 9); return Op('−', Ql(P, A.v * k + mq(P, 1, 20).t), Op('×', A, Kl(k))); },
    function (P) { return Op('+', rQ(P, 1, 30), Op('×', rQ(P, 1, 25), K9())); },
    function (P) { return Op('+', Op('×', rQ(P, 1, 20), K9()), Op('×', rQ(P, 1, 20), K9())); },
    function (P) { var A = rQ(P, 3, 25), B = rQ(P, 1, 20); return Op('−', Op('×', A, K9()), Op('×', B, Kl(rand(2, 5)))); }
  ];
  var EXP_DIV = [
    function (P) { var k = rand(2, 9), R_ = mq(P, 1, 25).t, ab = split2(P, R_ * k); return Op(':', Op('+', ab[0], ab[1], true), Kl(k)); },
    function (P) { var k = rand(2, 9), R_ = mq(P, 1, 25).t; return Op('+', Op(':', Ql(P, R_ * k), Kl(k)), rQ(P, 1, 30)); },
    function (P) { var k = rand(2, 9), R_ = mq(P, 1, 20).t; return Op('×', Op(':', Ql(P, R_ * k), Kl(k)), Kl(rand(2, 9))); },
    function (P) {
      var A = rQ(P, 1, 20), k = rand(2, 9), T = A.v * k, ds = []; for (var m = 2; m <= 9; m++) if (T % m === 0 && m !== k) ds.push(m);
      return ds.length ? Op(':', Op('×', A, Kl(k)), Kl(pick(ds))) : null;
    },
    function (P) { var k = rand(2, 9), R_ = mq(P, 1, 15).t; return Op('−', Ql(P, R_ + mq(P, 1, 25).t), Op(':', Ql(P, R_ * k), Kl(k))); },
    function (P) { var k = rand(2, 9), R_ = mq(P, 3, 30), B = rQ(P, 1, Math.floor(R_.t / P.f) - 1); return Op('−', Op(':', Ql(P, R_.t * k), Kl(k)), B); },
    function (P) { var k = rand(2, 9), D = mq(P, 1, 15).t * k, B = rQ(P, 1, 20); return Op(':', Op('−', Ql(P, B.v + D), B, true), Kl(k)); },
    function (P) { var A = rQ(P, 3, 25), k = rand(2, 9), m = rand(2, 9), R_ = mq(P, 1, 10).t; return Op('−', Op('×', A, Kl(k)), Op(':', Ql(P, R_ * m), Kl(m))); }
  ];
  function divisorLeaf(P) { return Math.random() < 0.5 ? rSmall(P) : rQ(P, 1, P.f >= 1000 ? 4 : 9); }
  function qq(C, lo, hi) { return rand(lo, C.v > 1000 ? Math.min(hi, Math.max(lo + 2, 20)) : hi); }
  var EXP_K = [
    function (P) { var C = divisorLeaf(P), ab = split2(P, qq(C, 2, 60) * C.v); return Op(':', Op('+', ab[0], ab[1], true), C); },
    function (P) { var B = divisorLeaf(P); return Op('+', Op(':', Ql(P, qq(B, 2, 40) * B.v), B), Kl(rand(2, 30))); },
    function (P) { var B = divisorLeaf(P); return Op('×', Op(':', Ql(P, qq(B, 2, 40) * B.v), B), K9()); },
    function (P) { var C = divisorLeaf(P), B = rQ(P, 1, 20); return Op(':', Op('−', Ql(P, B.v + qq(C, 2, 50) * C.v), B, true), C); },
    function (P) {
      var A = rQ(P, 1, 15), k = rand(2, 9), T = A.v * k, ds = (NICE[P.f] || []).filter(function (d) { return T % d === 0 && T / d >= 2 && T / d <= 300; });
      return ds.length ? Op(':', Op('×', A, Kl(k)), Ql(P, pick(ds))) : null;
    },
    function (P) { var B = divisorLeaf(P), q = qq(B, 6, 40); return Op('−', Op(':', Ql(P, q * B.v), B), Kl(rand(2, q - 1))); },
    function (P) { var B = divisorLeaf(P), D = divisorLeaf(P); return Op('+', Op(':', Ql(P, qq(B, 2, 30) * B.v), B), Op(':', Ql(P, qq(D, 2, 30) * D.v), D)); }
  ];
  reg('n2Expr', function (o) {
    o = o || {};
    var lvl = o.level || 'all', list = lvl === 'mul' ? EXP_MUL : lvl === 'div' ? EXP_DIV : lvl === 'K' ? EXP_K : lvl === 'Q' ? EXP_MUL.concat(EXP_DIV) : EXP_MUL.concat(EXP_DIV, EXP_K);
    var g = 0, tree, steps, res, P, ok;
    EB = o.bmax || 99;
    do {
      P = PP(pick(o.pairs || MAIN)); tree = pick(list)(P); steps = []; res = tree ? evalNode(tree, steps) : null; g++;
      ok = !!res && (res.ty === 'Q' ? (res.v >= P.f && res.v % P.f !== 0 && res.v <= 3000000) : (res.v >= 2 && res.v <= 100000)) && steps.length >= 2;
    } while (!ok && g < 600);
    var hint = 'Порядок действий такой же, как у обычных чисел: сначала скобки, потом умножение и деление, потом сложение и вычитание. Величины складывай и вычитай в одинаковых мерах (' + P.fact + ').';
    var head = 'Найди значение выражения: ' + expr(showNode(tree));
    if (res.ty === 'Q') {
      return { kind: 'nums', html: head, fields: fields(P), answer: splitT(P, res.v), hint: hint, explain: plainSteps(steps) + '<br>Ответ: ' + ansC(P, res.v) + '.' };
    }
    return { kind: 'num', html: head + '<br><span class="soft">В ответе получится число без наименования.</span>', answer: res.v, hint: hint, explain: plainSteps(steps) + '<br>Ответ: ' + num(res.v) + '.' };
  });

  /* @@INSERT-3 */

  /* ================= текстовые задачи ================= */
  function gu(u) { return u ? GEN[u] + ' ' : ''; }
  function fin2(P, t) { return ansC(P, t); }

  /* --- умножение: n одинаковых величин --- */
  var PL_MUL = [
    { pair: 'м-см', bb: [2, 5], kk: [2, 48], t: function (Q, k) { return 'На пошив одного платья нужно ' + Q + ' ткани. Сколько ткани нужно на ' + k + ' таких ' + plur(k, 'платье', 'платья', 'платьев') + '?'; } },
    { pair: 'кг-г', bb: [1, 4], kk: [2, 48], t: function (Q, k) { return 'В один пакет насыпали ' + Q + ' гречки. Сколько гречки в ' + k + ' таких пакетах?'; } },
    { pair: 'км-м', bb: [2, 9], kk: [2, 30], t: function (Q, k) { return 'Лыжник на каждой тренировке пробегает ' + Q + '. Какое расстояние он пробежит за ' + k + ' ' + plur(k, 'тренировку', 'тренировки', 'тренировок') + '?'; } },
    { pair: 'т-кг', bb: [2, 9], kk: [2, 48], t: function (Q, k) { return 'В один вагон погрузили ' + Q + ' угля. Сколько угля погрузили в ' + k + ' таких ' + plur(k, 'вагон', 'вагона', 'вагонов') + '?'; } },
    { pair: 'руб-коп', bb: [5, 60], kk: [2, 48], t: function (Q, k) { return 'Одна тетрадь стоит ' + Q + '. Сколько стоят ' + k + ' ' + plur(k, 'тетрадь', 'тетради', 'тетрадей') + ' по такой цене?'; } },
    { pair: 'м-дм', bb: [8, 25], kk: [2, 9], t: function (Q, k) { return 'Сильный ветер пролетает за одну секунду ' + Q + '. Какое расстояние он пролетит за ' + k + ' ' + plur(k, 'секунду', 'секунды', 'секунд') + '?'; } },
    { pair: 'ц-кг', bb: [5, 40], kk: [2, 24], t: function (Q, k) { return 'С одного участка собрали ' + Q + ' картофеля. Сколько картофеля собрали с ' + k + ' таких участков?'; } },
    { pair: 'м-см', bb: [1, 3], kk: [2, 24], t: function (Q, k) { return 'Длина одной доски ' + Q + '. Какова длина ' + k + ' таких досок, положенных встык?'; } }
  ];
  reg('pn2Mul', function (o) {
    o = o || {};
    var pl, P, b, s, k, res, g = 0, lo, hi, ok;
    do {
      pl = pick(PL_MUL); P = PAIRS[pl.pair]; lo = Math.max(o.kmin || 2, pl.kk[0]); hi = Math.min(o.kmax || 99, pl.kk[1]); g++; ok = false;
      if (lo > hi) continue;
      k = randK(lo, hi); b = rand(pl.bb[0], pl.bb[1]); s = smallPart(P); res = (b * P.f + s) * k;
      ok = res % P.f !== 0 && res <= 2000000;
    } while (!ok && g < 500);
    return { kind: 'nums', html: pl.t(nm(P, b, s), k), fields: fields(P), answer: splitT(P, res),
      hint: 'Одна и та же величина повторяется несколько раз — значит, надо умножить. Мелкую меру умножай отдельно и не забудь превратить лишнее (' + P.fact + ').',
      explain: stepsL(['Одинаковые величины повторяются ' + k + ' ' + plur(k, 'раз', 'раза', 'раз') + ', поэтому умножаем: ' + R.n2MulLine(P, b, s, k)], fin2(P, res)) };
  });

  /* --- деление на равные части --- */
  var PL_SHARE = [
    { pair: 'т-кг', us: 'b', kk: [2, 9], qb: [1, 9], t: function (Q, k) { return 'В хранилище привезли ' + Q + ' зерна. Зерно разложили поровну по ' + k + ' амбарам.'; }, ask: function (u) { return 'Сколько ' + gu(u) + 'зерна в каждом амбаре?'; } },
    { pair: 'м-см', sq: [150, 300, 5], kk: [2, 12], qb: [1, 3], t: function (Q, k) { return 'Из куска ткани длиной ' + Q + ' сшили ' + k + ' одинаковых ' + plur(k, 'халат', 'халата', 'халатов') + '.'; }, ask: function (u) { return 'Сколько ' + gu(u) + 'ткани пошло на один халат?'; } },
    { pair: 'руб-коп', us: 'b', kk: [2, 12], qb: [5, 45], t: function (Q, k) { return 'За ' + k + ' ' + plur(k, 'тетрадь', 'тетради', 'тетрадей') + ' заплатили ' + Q + '. Все тетради стоят одинаково.'; }, ask: function (u) { return 'Сколько ' + gu(u) + 'стоит одна тетрадь?'; } },
    { pair: 'км-м', us: 'b', kk: [2, 9], qb: [10, 30], t: function (Q, k) { return 'Велосипедист за ' + k + ' ' + plur(k, 'час', 'часа', 'часов') + ' проехал ' + Q + ', всё время двигаясь с одной и той же скоростью.'; }, ask: function (u) { return 'Сколько ' + gu(u) + 'он проезжал за один час?'; } },
    { pair: 'м-см', sq: [40, 300, 5], kk: [2, 9], qb: [2, 25], t: function (Q, k) { return 'Проволоку длиной ' + Q + ' разрезали на ' + k + ' ' + plur(k, 'часть', 'части', 'частей') + ' одинаковой длины.'; }, ask: function (u) { return u ? 'Найди длину одной части в ' + LOC[u] + '.' : 'Найди длину одной части.'; } },
    { pair: 'кг-г', sq: [250, 900, 50], kk: [2, 9], qb: [1, 5], t: function (Q, k) { return 'Муку массой ' + Q + ' поровну насыпали в ' + k + ' ' + plur(k, 'пакет', 'пакета', 'пакетов') + '.'; }, ask: function (u) { return 'Сколько ' + gu(u) + 'муки в одном пакете?'; } },
    { pair: 'км-м', us: 's', only: 'simple', sq: [50, 900, 10], kk: [2, 9], qb: [1, 3], t: function (Q, k) { return 'Дорожная бригада за ' + k + ' ' + plur(k, 'день', 'дня', 'дней') + ' построила ' + Q + ' дороги, строя каждый день поровну.'; }, ask: function (u) { return 'Сколько ' + gu(u) + 'дороги строила бригада за один день?'; } },
    { pair: 'м-см', us: 'b', kk: [2, 9], qb: [5, 15], t: function (Q, k) { return 'Бригада из ' + k + ' рабочих проложила ' + Q + ' трубопровода. Каждый рабочий проложил одинаковую длину.'; }, ask: function (u) { return u ? 'Найди длину трубопровода, который проложил каждый рабочий, в ' + LOC[u] + '.' : 'Найди длину трубопровода, который проложил каждый рабочий.'; } }
  ];
  /* o.mode: 'simple' (простое число ÷ число), 'frag' (крупная мера ÷ число, нужно раздробить), 'comp' (составное ÷ число) */
  reg('pn2Share', function (o) {
    o = o || {};
    var mode = o.mode || pick(['simple', 'frag', 'comp']), pl, P, f, k, g = 0, ok, qt, T, X, u, qb, qs, lo, hi;
    do {
      pl = pick(PL_SHARE); P = PAIRS[pl.pair]; f = P.f; lo = Math.max(o.kmin || 2, pl.kk[0]); hi = Math.min(o.kmax || 99, pl.kk[1]); g++; ok = false;
      if (lo > hi || (pl.only && pl.only !== mode)) continue;
      k = randK(lo, hi);
      if (mode === 'comp') { qt = mkQ(P, pl.qb[0], pl.qb[1]).t; T = qt * k; ok = T % f !== 0 && T <= 2000000; }
      else if (mode === 'frag') { X = rand(k * pl.qb[0], k * pl.qb[1]); qt = X * f / k; ok = (X * f) % k === 0 && X % k !== 0 && qt > f && qt % f !== 0; }
      else { var us = pl.us || 'bs'; u = us === 's' ? P.small : us === 'b' ? P.big : (Math.random() < 0.55 ? P.small : P.big);
        if (u === P.small) { qt = rand(pl.sq[0] / pl.sq[2], pl.sq[1] / pl.sq[2]) * pl.sq[2]; T = qt * k; ok = T <= 900000; }
        else { qt = rand(pl.qb[0], pl.qb[1]); T = qt * k; ok = true; } }
    } while (!ok && g < 800);
    if (mode === 'simple') {
      return { kind: 'num', html: pl.t(nu(T, u), k) + ' ' + pl.ask(u), answer: qt,
        hint: 'Раздели число на ' + k + ', а название меры оставь.',
        explain: '<div class="colrow">' + R.divHTML(T, k) + '<div class="colsteps">Делим числа: ' + fmt(T) + ' : ' + k + ' = ' + fmt(qt) + '. Название меры оставляем.</div></div>Ответ: ' + nu(qt, u) + '.' };
    }
    var b0, s0, tt;
    if (mode === 'frag') { b0 = X; s0 = 0; tt = X * f; } else { b0 = Math.floor(T / f); s0 = T % f; tt = T; }
    var dvd = mode === 'frag' ? nu(b0, P.big) : nm(P, b0, s0);
    return { kind: 'nums', html: pl.t(dvd, k) + ' ' + pl.ask(null), fields: fields(P), answer: splitT(P, qt),
      hint: 'Раздели поровну — значит, раздели величину на ' + k + '. Если крупные меры не делятся нацело, раздроби остаток в мелкие (' + P.fact + ').',
      explain: stepsL(['Делим поровну: ' + dvd + ' : ' + k + '.' + R.n2DivAbsHTML(P, b0, s0, k, { route: b0 >= k ? 2 : 1 })], fin2(P, qt)) };
  });

  /* --- деление по содержанию --- */
  /* Ds — «простые» размеры порции (в мелких мерах), Dc — составные; q — границы числа порций */
  var PL_COUNT = [
    { pair: 'кг-г', Ds: [200, 250, 300, 400, 500, 600, 750, 2000], Dc: [1250, 1500, 2250, 2500], q: [4, 40], t: function (A, B) { return A + ' конфет расфасовали в пакеты по ' + B + '. Сколько пакетов получилось?'; }, nn: ['пакет', 'пакета', 'пакетов'] },
    { pair: 'м-см', Ds: [200, 300, 400], Dc: [225, 250, 275, 325, 350, 375, 425, 450], q: [3, 25], t: function (A, B) { return 'Из ' + A + ' шёлка сшили платья, расходуя на каждое ' + B + '. Сколько платьев сшили?'; }, nn: ['платье', 'платья', 'платьев'] },
    { pair: 'т-кг', Ds: [40, 50, 60, 80], Dc: null, q: [10, 60], t: function (A, B) { return 'На машину погрузили ' + A + ' картофеля в мешках по ' + B + '. Сколько мешков погрузили?'; }, nn: ['мешок', 'мешка', 'мешков'] },
    { pair: 'т-кг', Ds: [2000, 3000, 4000, 5000, 6000, 8000], Dc: [2500, 3500, 4500, 7500], q: [3, 25], t: function (A, B) { return 'Для перевозки ' + A + ' груза выделили машины, каждая из которых берёт ' + B + '. Сколько машин потребуется?'; }, nn: ['машина', 'машины', 'машин'] },
    { pair: 'кг-г', Ds: [250, 400, 500, 600, 800, 2000, 5000], Dc: [1250, 1500, 2250, 2500, 4250], q: [5, 40], t: function (A, B) { return 'В столовой было ' + A + ' крупы. Каждый день расходовали по ' + B + '. На сколько дней хватило крупы?'; }, nn: ['день', 'дня', 'дней'] },
    { pair: 'руб-коп', Ds: [500, 800, 1000, 1500, 2000, 2500], Dc: [1250, 1550, 1850, 2450, 3550], q: [3, 30], t: function (A, B) { return 'На ' + A + ' купили ручки по ' + B + '. Сколько ручек купили?'; }, nn: ['ручка', 'ручки', 'ручек'] },
    { pair: 'руб-коп', Ds: [20, 25, 40, 50, 60, 75], Dc: null, q: [6, 40], t: function (A, B) { return 'На ' + A + ' купили леденцы по ' + B + ' за штуку. Сколько леденцов купили?'; }, nn: ['леденец', 'леденца', 'леденцов'] },
    { pair: 'м-см', Ds: [20, 25, 30, 40, 50, 60, 75, 200], Dc: [125, 150, 175, 225, 250], q: [4, 40], t: function (A, B) { return 'Из проволоки длиной ' + A + ' нарезали куски по ' + B + '. Сколько кусков получилось?'; }, nn: ['кусок', 'куска', 'кусков'] },
    { pair: 'км-м', Ds: [250, 400, 500, 600, 750, 2000, 5000], Dc: [1250, 1500, 2250, 2500, 3500], q: [3, 30], t: function (A, B) { return 'Дорогу длиной ' + A + ' разделили на участки по ' + B + '. Сколько получилось участков?'; }, nn: ['участок', 'участка', 'участков'] }
  ];
  /* o.mode / o.modes: ss | sc | cs | cc (первая буква — делимое, вторая — делитель) */
  reg('pn2Count', function (o) {
    o = o || {};
    var mode = pick(o.modes || [o.mode || 'ss']), pl, P, f, q, D, T, A, B, g = 0, ok, list, sA = mode.charAt(0), sB = mode.charAt(1), styA, styB, tmax = o.tmax || 2000000;
    do {
      pl = pick(PL_COUNT); P = PAIRS[pl.pair]; f = P.f; g++; ok = false;
      list = sB === 's' ? pl.Ds : pl.Dc;
      if (!list) continue;
      D = pick(list);
      q = rand(Math.max(o.qmin || 2, pl.q[0]), Math.min(o.qmax || 99, pl.q[1]));
      if (D > 1000 && q > 25) q = rand(pl.q[0], 25);
      T = q * D;
      styB = sB === 'c' ? 'c' : (D >= f && D % f === 0 ? 'b' : 's');
      if (sA === 's') {
        if (T % f === 0 && T / f >= 2 && T / f <= 999) styA = 'b';
        else if (T < f) styA = 's';
        else continue;
      } else { if (T % f === 0 || T < f) continue; styA = 'c'; }
      if (T > tmax) continue;
      if (styA === 'b' && styB === 'b' && Math.random() < 0.7 && g < 200) continue;
      ok = true;
    } while (!ok && g < 3000);
    A = dsc(P, T, styA); B = dsc(P, D, styB);
    var L = divNamedLines(A, B); L.pop();
    return { kind: 'num', html: pl.t(A.txt, B.txt), answer: q,
      hint: 'Надо узнать, сколько раз меньшая величина содержится в большей. Если меры разные, вырази обе величины в одинаковых мерах и раздели.',
      explain: plainSteps(L) + '<br>Ответ: ' + fmt(q) + ' ' + plur(q, pl.nn[0], pl.nn[1], pl.nn[2]) + '.' };
  });

  /* --- два произведения и их сумма --- */
  var PL_TWO = [
    { pair: 'кг-г', a: [10, 30], b: [8, 25], t: function (n1, A, n2, B) { return 'В магазин привезли ' + n1 + ' ' + plur(n1, 'ящик', 'ящика', 'ящиков') + ' яблок по ' + A + ' и ' + n2 + ' ' + plur(n2, 'ящик', 'ящика', 'ящиков') + ' груш по ' + B + '. Сколько всего фруктов привезли?'; } },
    { pair: 'м-см', a: [2, 4], b: [2, 4], t: function (n1, A, n2, B) { return 'На один костюм идёт ' + A + ' ткани, а на одно платье — ' + B + '. Сколько ткани нужно на ' + n1 + ' ' + plur(n1, 'костюм', 'костюма', 'костюмов') + ' и ' + n2 + ' ' + plur(n2, 'платье', 'платья', 'платьев') + '?'; } },
    { pair: 'км-м', a: [8, 18], b: [5, 14], t: function (n1, A, n2, B) { return 'Лыжник в первые ' + n1 + ' ' + plur(n1, 'день', 'дня', 'дней') + ' проходил по ' + A + ', а в следующие ' + n2 + ' ' + plur(n2, 'день', 'дня', 'дней') + ' — по ' + B + '. Сколько всего он прошёл?'; } },
    { pair: 'т-кг', a: [3, 9], b: [2, 8], t: function (n1, A, n2, B) { return 'На стройку привезли ' + n1 + ' ' + plur(n1, 'машину', 'машины', 'машин') + ' с песком по ' + A + ' и ' + n2 + ' ' + plur(n2, 'машину', 'машины', 'машин') + ' со щебнем по ' + B + '. Сколько всего груза привезли?'; } },
    { pair: 'руб-коп', a: [8, 40], b: [10, 60], t: function (n1, A, n2, B) { return 'Ученик купил ' + n1 + ' ' + plur(n1, 'тетрадь', 'тетради', 'тетрадей') + ' по ' + A + ' и ' + n2 + ' ' + plur(n2, 'блокнот', 'блокнота', 'блокнотов') + ' по ' + B + '. Сколько он заплатил?'; } },
    { pair: 'м-см', a: [2, 4], b: [1, 3], t: function (n1, A, n2, B) { return 'Для ограды взяли ' + n1 + ' ' + plur(n1, 'доску', 'доски', 'досок') + ' длиной ' + A + ' и ' + n2 + ' ' + plur(n2, 'доску', 'доски', 'досок') + ' длиной ' + B + '. Какова общая длина всех досок?'; } }
  ];
  reg('pn2Two', function (o) {
    o = o || {};
    var pl = pick(PL_TWO), P = PAIRS[pl.pair], n1 = rand(o.nmin || 2, o.nmax || 9), n2 = rand(o.nmin || 2, o.nmax || 9), g = 0, A, B;
    do { A = mkQ(P, pl.a[0], pl.a[1]); B = mkQ(P, pl.b[0], pl.b[1]); g++; } while (g < 100 && ((A.t * n1 + B.t * n2) % P.f === 0));
    var t1 = A.t * n1, t2 = B.t * n2, tot = t1 + t2;
    return { kind: 'nums', html: pl.t(n1, nm(P, A.b, A.s), n2, nm(P, B.b, B.s)), fields: fields(P), answer: splitT(P, tot),
      hint: 'Сначала найди каждую из двух частей (умножением), потом сложи их в одинаковых мерах.',
      explain: stepsL(['Первая часть: ' + R.n2MulLine(P, A.b, A.s, n1), 'Вторая часть: ' + R.n2MulLine(P, B.b, B.s, n2), 'Всего: ' + nf(P, t1) + ' + ' + nf(P, t2) + ' = ' + sm(P, t1) + ' + ' + sm(P, t2) + ' = ' + sm(P, tot) + ' = ' + nf(P, tot)], fin2(P, tot)) };
  });

  /* --- было, взяли несколько раз по …, осталось --- */
  var PL_REST = [
    { pair: 'ц-кг', v: 'выдали', y: [2, 9], z: [3, 20], t: function (X, k, Y) { return 'На складе было ' + X + ' муки. Муку выдали ' + k + ' пекарням по ' + Y + ' каждой. Сколько муки осталось на складе?'; } },
    { pair: 'м-см', v: 'отрезали', y: [1, 4], z: [3, 20], t: function (X, k, Y) { return 'В рулоне было ' + X + ' ткани. От него отрезали ' + k + ' ' + plur(k, 'кусок', 'куска', 'кусков') + ' по ' + Y + '. Сколько ткани осталось в рулоне?'; } },
    { pair: 'кг-г', v: 'продали', y: [5, 40], z: [10, 90], t: function (X, k, Y) { return 'В магазине было ' + X + ' сахара. За день продали ' + k + ' ' + plur(k, 'мешок', 'мешка', 'мешков') + ' по ' + Y + '. Сколько сахара осталось?'; } },
    { pair: 'км-м', v: 'построили', y: [1, 6], z: [3, 30], t: function (X, k, Y) { return 'Длина дороги ' + X + '. Уже построили ' + k + ' ' + plur(k, 'участок', 'участка', 'участков') + ' по ' + Y + '. Сколько дороги осталось построить?'; } },
    { pair: 'руб-коп', v: 'потратила', y: [10, 80], z: [5, 90], t: function (X, k, Y) { return 'У Маши было ' + X + '. Она купила ' + k + ' ' + plur(k, 'билет', 'билета', 'билетов') + ' в театр по ' + Y + '. Сколько денег у неё осталось?'; } }
  ];
  reg('pn2Rest', function (o) {
    o = o || {};
    var pl = pick(PL_REST), P = PAIRS[pl.pair], k = rand(2, 9), Y = mkQ(P, pl.y[0], pl.y[1]), Z = mkQ(P, pl.z[0], pl.z[1]), X = Y.t * k + Z.t;
    return { kind: 'nums', html: pl.t(nf(P, X), k, nm(P, Y.b, Y.s)), fields: fields(P), answer: [Z.b, Z.s],
      hint: 'Сначала узнай, сколько всего ' + pl.v + ' (умножением), потом вычти это из того, что было.',
      explain: stepsL(['Сколько ' + pl.v + ' всего: ' + R.n2MulLine(P, Y.b, Y.s, k), 'Сколько осталось: ' + nf(P, X) + ' − ' + nf(P, Y.t * k) + ' = ' + sm(P, X) + ' − ' + sm(P, Y.t * k) + ' = ' + sm(P, Z.t) + ' = ' + nf(P, Z.t)], fin2(P, Z.t)) };
  });

  /* --- «в … раз больше (меньше)» --- */
  var PL_TIMES = [
    { pair: 'м-см', bb: [1, 6], kmax: 9, in: function (A, k, m) { return 'Длина первой ленты ' + A + ', а длина второй — в ' + k + ' ' + plur(k, 'раз', 'раза', 'раз') + ' ' + (m ? 'больше' : 'меньше') + '.'; }, qs: 'Какова длина двух лент вместе?', qd: function (m) { return 'На сколько вторая лента ' + (m ? 'длиннее' : 'короче') + ' первой?'; } },
    { pair: 'кг-г', bb: [2, 9], kmax: 6, in: function (A, k, m) { return 'Масса первого мешка с мукой ' + A + ', а второго — в ' + k + ' ' + plur(k, 'раз', 'раза', 'раз') + ' ' + (m ? 'больше' : 'меньше') + '.'; }, qs: 'Какова масса двух мешков вместе?', qd: function (m) { return 'На сколько второй мешок ' + (m ? 'тяжелее' : 'легче') + ' первого?'; } },
    { pair: 'км-м', bb: [1, 6], kmax: 4, in: function (A, k, m) { return 'В первый день турист прошёл ' + A + ', а во второй день — в ' + k + ' ' + plur(k, 'раз', 'раза', 'раз') + ' ' + (m ? 'больше' : 'меньше') + '.'; }, qs: 'Сколько всего прошёл турист за два дня?', qd: function (m) { return 'На сколько ' + (m ? 'больше' : 'меньше') + ' турист прошёл во второй день, чем в первый?'; } },
    { pair: 'руб-коп', bb: [10, 60], kmax: 4, in: function (A, k, m) { return 'Первая книга стоит ' + A + ', а вторая — в ' + k + ' ' + plur(k, 'раз', 'раза', 'раз') + ' ' + (m ? 'дороже' : 'дешевле') + '.'; }, qs: 'Сколько стоят обе книги вместе?', qd: function (m) { return 'На сколько вторая книга ' + (m ? 'дороже' : 'дешевле') + ' первой?'; } },
    { pair: 'т-кг', bb: [2, 9], kmax: 9, in: function (A, k, m) { return 'В первый день на элеватор привезли ' + A + ' зерна, а во второй — в ' + k + ' ' + plur(k, 'раз', 'раза', 'раз') + ' ' + (m ? 'больше' : 'меньше') + '.'; }, qs: 'Сколько зерна привезли за два дня?', qd: function (m) { return 'На сколько ' + (m ? 'больше' : 'меньше') + ' зерна привезли во второй день, чем в первый?'; } }
  ];
  reg('pn2Times', function (o) {
    o = o || {};
    var pl = pick(PL_TIMES), P = PAIRS[pl.pair], k = rand(2, pl.kmax), more = o.dir ? o.dir === 'more' : Math.random() < 0.6, ask = o.ask || pick(['sum', 'diff']), g = 0, A, S, second, first, tot, diff;
    do {
      if (more) { first = mkQ(P, pl.bb[0], pl.bb[1]).t; second = first * k; }
      else { second = mkQ(P, pl.bb[0], pl.bb[1]).t; first = second * k; }
      tot = first + second; diff = Math.abs(first - second); g++;
    } while (g < 100 && (ask === 'sum' ? tot % P.f === 0 : diff % P.f === 0 || diff < P.f));
    var ans = ask === 'sum' ? tot : diff, l2;
    if (more) l2 = 'Второе: ' + nf(P, first) + ' × ' + k + ' = ' + sm(P, first) + ' × ' + k + ' = ' + sm(P, second) + ' = ' + nf(P, second);
    else l2 = 'Второе: ' + nf(P, first) + ' : ' + k + ' = ' + sm(P, first) + ' : ' + k + ' = ' + sm(P, second) + ' = ' + nf(P, second);
    var l3 = ask === 'sum' ? 'Вместе: ' + nf(P, first) + ' + ' + nf(P, second) + ' = ' + sm(P, first) + ' + ' + sm(P, second) + ' = ' + sm(P, tot) + ' = ' + nf(P, tot)
      : 'Разность: ' + nf(P, Math.max(first, second)) + ' − ' + nf(P, Math.min(first, second)) + ' = ' + sm(P, Math.max(first, second)) + ' − ' + sm(P, Math.min(first, second)) + ' = ' + sm(P, diff) + ' = ' + nf(P, diff);
    return { kind: 'nums', html: pl.in(nf(P, first), k, more) + ' ' + (ask === 'sum' ? pl.qs : pl.qd(more)), fields: fields(P), answer: splitT(P, ans),
      hint: '«В несколько раз больше» — значит, умножаем, «в несколько раз меньше» — делим. Потом ответь на вопрос: ' + (ask === 'sum' ? 'сложи обе величины.' : 'из большей величины вычти меньшую.'),
      explain: stepsL([l2, l3], fin2(P, ans)) };
  });

  /* --- многодневная задача: сколько в остальные дни --- */
  var PL_DELIV = [
    { pair: 'т-кг', a: [5, 9], b: [3, 6], x: [2, 6], t: function (D, T) { return 'На кондитерскую фабрику в течение ' + D + ' дней привезли ' + T + ' сахара.'; }, w: 'сахара' },
    { pair: 'ц-кг', a: [3, 9], b: [2, 7], x: [2, 6], t: function (D, T) { return 'В пекарню в течение ' + D + ' дней привезли ' + T + ' муки.'; }, w: 'муки' },
    { pair: 'м-см', a: [8, 30], b: [5, 25], x: [4, 20], t: function (D, T) { return 'В ателье в течение ' + D + ' дней привезли ' + T + ' ткани.'; }, w: 'ткани' },
    { pair: 'т-кг', a: [4, 9], b: [3, 8], x: [2, 7], t: function (D, T) { return 'На стройку в течение ' + D + ' дней привезли ' + T + ' песка.'; }, w: 'песка' },
    { pair: 'ц-кг', a: [10, 40], b: [8, 30], x: [5, 25], t: function (D, T) { return 'В школьную столовую в течение ' + D + ' дней привезли ' + T + ' картофеля.'; }, w: 'картофеля' }
  ];
  reg('pn2Deliver', function (o) {
    o = o || {};
    var pl = pick(PL_DELIV), P = PAIRS[pl.pair], d1 = rand(2, 6), d2 = rand(2, 6), r = rand(2, 6), D = d1 + d2 + r, A = mkQ(P, pl.a[0], pl.a[1]), B = mkQ(P, pl.b[0], pl.b[1]), X = mkQ(P, pl.x[0], pl.x[1]);
    var p1 = A.t * d1, p2 = B.t * d2, T = p1 + p2 + X.t * r, first = p1 + p2, rest = T - first;
    var text = pl.t(D, nf(P, T)) + ' В первые ' + d1 + ' ' + plur(d1, 'день', 'дня', 'дней') + ' привозили по ' + nm(P, A.b, A.s) + ', в следующие ' + d2 + ' ' + plur(d2, 'день', 'дня', 'дней') + ' — по ' + nm(P, B.b, B.s) + '. Сколько ' + pl.w + ' привозили в каждый из остальных дней, если в эти дни привозили поровну?';
    return { kind: 'nums', html: text, fields: fields(P), answer: [X.b, X.s],
      hint: 'Найди, сколько привезли в первые дни, вычти из общего количества, найди число остальных дней и раздели.',
      explain: stepsL([
        'В первые ' + d1 + ' ' + plur(d1, 'день', 'дня', 'дней') + ': ' + R.n2MulLine(P, A.b, A.s, d1),
        'В следующие ' + d2 + ' ' + plur(d2, 'день', 'дня', 'дней') + ': ' + R.n2MulLine(P, B.b, B.s, d2),
        'Всего за эти дни: ' + nf(P, p1) + ' + ' + nf(P, p2) + ' = ' + nf(P, first),
        'Осталось привезти: ' + nf(P, T) + ' − ' + nf(P, first) + ' = ' + nf(P, rest),
        'Остальных дней: ' + D + ' − ' + d1 + ' − ' + d2 + ' = ' + r,
        'В каждый из остальных дней: ' + nf(P, rest) + ' : ' + r + ' = ' + sm(P, rest) + ' : ' + r + ' = ' + sm(P, X.t) + ' = ' + nf(P, X.t)], fin2(P, X.t)) };
  });

  /* --- периметр с составными числами --- */
  var PL_SQ = [
    { r: [1, 6], t: function (Q) { return 'Сторона квадратной клумбы равна ' + Q + '. Клумбу обнесли бордюром. Найди длину бордюра.'; } },
    { r: [4, 30], t: function (Q) { return 'Каждая сторона квадратной площадки равна ' + Q + '. Найди периметр площадки.'; } },
    { r: [8, 40], t: function (Q) { return 'Квадратный участок огородили забором. Сторона участка ' + Q + '. Какой длины получился забор?'; } },
    { r: [1, 3], t: function (Q) { return 'Сторона квадратной картины равна ' + Q + '. Картину обрамили рамкой. Какой длины багет пошёл на рамку?'; } }
  ];
  var PL_RECT = [
    { a: [12, 60], b: [6, 40], t: function (A, B) { return 'Длина прямоугольного участка ' + A + ', а ширина ' + B + '. Участок огородили забором. Найди длину забора.'; } },
    { a: [4, 9], b: [3, 6], t: function (A, B) { return 'Длина прямоугольной комнаты ' + A + ', ширина ' + B + '. Найди периметр комнаты.'; } },
    { a: [15, 50], b: [8, 30], t: function (A, B) { return 'Стороны прямоугольного пруда ' + A + ' и ' + B + '. Найди сумму длин всех его сторон.'; } },
    { a: [10, 40], b: [5, 25], t: function (A, B) { return 'Прямоугольный двор имеет длину ' + A + ' и ширину ' + B + '. Найди периметр двора.'; } }
  ];
  reg('pn2Perim', function (o) {
    o = o || {};
    var P = PAIRS['м-см'], shape = o.shape || pick(['sq', 'rect']), g = 0, A, B, pl;
    if (shape === 'sq') {
      pl = pick(PL_SQ);
      do { A = mkQ(P, pl.r[0], pl.r[1]); g++; } while (g < 100 && (A.t * 4) % P.f === 0);
      var t4 = A.t * 4;
      return { kind: 'nums', html: pl.t(nm(P, A.b, A.s)), fields: fields(P), answer: splitT(P, t4),
        hint: 'У квадрата четыре равные стороны. Периметр — это сумма длин всех сторон.',
        explain: stepsL(['Периметр квадрата: сторона × 4. ' + R.n2MulLine(P, A.b, A.s, 4)], fin2(P, t4)) };
    }
    pl = pick(PL_RECT);
    do { A = mkQ(P, pl.a[0], pl.a[1]); B = mkQ(P, pl.b[0], Math.max(pl.b[0], Math.min(pl.b[1], A.b))); g++; } while (g < 100 && (((A.t + B.t) * 2) % P.f === 0 || B.t >= A.t));
    var sum = A.t + B.t, per = sum * 2;
    return { kind: 'nums', html: pl.t(nm(P, A.b, A.s), nm(P, B.b, B.s)), fields: fields(P), answer: splitT(P, per),
      hint: 'Периметр прямоугольника — это (длина + ширина) × 2. Складывай величины в одинаковых мерах.',
      explain: stepsL(['Длина и ширина вместе: ' + nm(P, A.b, A.s) + ' + ' + nm(P, B.b, B.s) + ' = ' + sm(P, A.t) + ' + ' + sm(P, B.t) + ' = ' + sm(P, sum) + ' = ' + nf(P, sum),
        'Периметр: ' + nf(P, sum) + ' × 2 = ' + sm(P, sum) + ' × 2 = ' + sm(P, per) + ' = ' + nf(P, per)], fin2(P, per)) };
  });

  /* ================= виджеты теории ================= */
  R.widgetMounts = R.widgetMounts || {};
  var W_PAIRS = ['м-см', 'км-м', 'кг-г', 'т-кг', 'ц-кг', 'руб-коп'];
  function wPairOpts() {
    return W_PAIRS.map(function (k) { return '<option value="' + k + '">' + PAIRS[k].big + ' и ' + PAIRS[k].small + '</option>'; }).join('');
  }
  function wInp(val, max, label) {
    return '<input class="winput sm" inputmode="numeric" autocomplete="off" maxlength="' + max + '" value="' + val + '" aria-label="' + label + '">';
  }
  function wRead(inp) { var d = inp.value.replace(/\D/g, ''); return d === '' ? null : Number(d); }
  function wDigits(inp) { inp.addEventListener('input', function () { var v = inp.value.replace(/\D/g, ''); if (v !== inp.value) inp.value = v; }); }
  /* начальные значения из data-pair / data-<имя> */
  function wInit(host, sel, inputs, names) {
    var d = host.dataset || {};
    if (d.pair && PAIRS[d.pair]) sel.value = d.pair;
    inputs.forEach(function (inp, i) { if (d[names[i]] != null) inp.value = d[names[i]]; });
  }
  function wMsg(out, t) { out.innerHTML = '<p class="facts">' + R.tidy(t) + '</p>'; }

  /* умножение составного именованного числа на число */
  R.widgetMounts.n2mul = function (host) {
    host.classList.add('n2w');
    host.innerHTML = '<div class="conv-row"><select class="wsel" aria-label="Какие меры">' + wPairOpts() + '</select></div>' +
      '<div class="conv-row">' + wInp(4, 3, 'Крупная мера') + '<span class="conv-eq n2u1">м</span>' + wInp(85, 3, 'Мелкая мера') + '<span class="conv-eq n2u2">см</span>' +
      '<span class="conv-eq">×</span>' + wInp(6, 2, 'Множитель') + '</div>' +
      '<div class="conv-row"><select class="wsel n2meth" aria-label="Способ"><option value="2">Способ: умножаем по мерам</option><option value="1">Способ: раздробляем, умножаем, превращаем</option></select></div>' +
      '<div class="n2out"></div>';
    var sel = host.querySelector('select'), inp = host.querySelectorAll('input'), ib = inp[0], is = inp[1], ik = inp[2],
      u1 = host.querySelector('.n2u1'), u2 = host.querySelector('.n2u2'), ms = host.querySelector('.n2meth'), out = host.querySelector('.n2out');
    [ib, is, ik].forEach(wDigits);
    wInit(host, sel, [ib, is, ik], ['b', 's', 'k']);
    function calc() {
      var P = PAIRS[sel.value], b = wRead(ib), sv = wRead(is), k = wRead(ik);
      u1.textContent = P.big; u2.textContent = P.small;
      if (b === null || sv === null || k === null) return wMsg(out, 'Впиши все три числа.');
      if (b < 1) return wMsg(out, 'Крупных единиц должно быть хотя бы одна.');
      if (sv >= P.f) return wMsg(out, 'Мелких единиц должно быть меньше ' + fmt(P.f) + ': ведь ' + P.fact + '. Лишнее надо превратить в крупные.');
      if (k < 2) return wMsg(out, 'Множитель должен быть не меньше 2.');
      ms.disabled = k >= 10;
      var method = (k >= 10 || ms.value === '1') ? 1 : 2, res = (b * P.f + sv) * k;
      out.innerHTML = R.tidy('<p class="facts">Помним: ' + P.fact + '.</p>' + R.n2MulHTML(P, b, sv, k, { method: method, flow: true }) +
        '<p class="facts">Ответ: ' + expr(nf(P, b * P.f + sv) + ' × ' + k + ' = ' + ansC(P, res)) + (k >= 10 ? '<br>Множитель двузначный, поэтому удобнее раздробить.' : '') + '</p>');
    }
    sel.addEventListener('change', calc); ms.addEventListener('change', calc);
    [ib, is, ik].forEach(function (i) { i.addEventListener('input', calc); });
    calc();
  };

  /* деление составного именованного числа на число */
  R.widgetMounts.n2div = function (host) {
    host.classList.add('n2w');
    host.innerHTML = '<div class="conv-row"><select class="wsel" aria-label="Какие меры">' + wPairOpts() + '</select></div>' +
      '<div class="conv-row">' + wInp(9, 3, 'Крупная мера') + '<span class="conv-eq n2u1">м</span>' + wInp(60, 3, 'Мелкая мера') + '<span class="conv-eq n2u2">см</span>' +
      '<span class="conv-eq">:</span>' + wInp(4, 2, 'Делитель') + '</div>' +
      '<div class="conv-row"><select class="wsel n2meth" aria-label="Способ"><option value="2">Способ: делим по мерам</option><option value="1">Способ: сначала раздробляем</option></select></div>' +
      '<div class="n2out"></div>';
    var sel = host.querySelector('select'), inp = host.querySelectorAll('input'), ib = inp[0], is = inp[1], ik = inp[2],
      u1 = host.querySelector('.n2u1'), u2 = host.querySelector('.n2u2'), ms = host.querySelector('.n2meth'), out = host.querySelector('.n2out');
    [ib, is, ik].forEach(wDigits);
    wInit(host, sel, [ib, is, ik], ['b', 's', 'k']);
    function calc() {
      var P = PAIRS[sel.value], b = wRead(ib), sv = wRead(is), k = wRead(ik);
      u1.textContent = P.big; u2.textContent = P.small;
      if (b === null || sv === null || k === null) return wMsg(out, 'Впиши все три числа.');
      if (b < 1) return wMsg(out, 'Крупных единиц должно быть хотя бы одна.');
      if (sv >= P.f) return wMsg(out, 'Мелких единиц должно быть меньше ' + fmt(P.f) + ': ведь ' + P.fact + '.');
      if (k < 2) return wMsg(out, 'Делитель должен быть не меньше 2.');
      var t = b * P.f + sv;
      if (t % k !== 0) return wMsg(out, nm(P, b, sv) + ' = ' + sm(P, t) + ', а ' + fmt(t) + ' не делится на ' + k + ' нацело (остаток ' + (t % k) + '). Подбери другие числа: в этом уроке делим без остатка.');
      var canMeasures = b >= k;
      ms.disabled = !canMeasures;
      var route = (canMeasures && ms.value === '2') ? 2 : 1;
      out.innerHTML = R.tidy('<p class="facts">Помним: ' + P.fact + '.</p>' + R.n2DivAbsHTML(P, b, sv, k, { route: route }) +
        '<p class="facts">Ответ: ' + expr(nf(P, t) + ' : ' + k + ' = ' + ansC(P, t / k)) + (canMeasures ? '' : '<br>Крупных единиц меньше ' + k + ', поэтому сначала раздробляем.') + '</p>');
    }
    sel.addEventListener('change', calc); ms.addEventListener('change', calc);
    [ib, is, ik].forEach(function (i) { i.addEventListener('input', calc); });
    calc();
  };

  /* деление именованного числа на именованное */
  R.widgetMounts.n2divn = function (host) {
    host.classList.add('n2w');
    host.innerHTML = '<div class="conv-row"><select class="wsel" aria-label="Какие меры">' + wPairOpts() + '</select></div>' +
      '<div class="conv-row">' + wInp(3, 3, 'Делимое, крупная мера') + '<span class="conv-eq n2u1">м</span>' + wInp(60, 3, 'Делимое, мелкая мера') + '<span class="conv-eq n2u2">см</span>' +
      '<span class="conv-eq">:</span>' + wInp(0, 3, 'Делитель, крупная мера') + '<span class="conv-eq n2u1">м</span>' + wInp(60, 3, 'Делитель, мелкая мера') + '<span class="conv-eq n2u2">см</span></div>' +
      '<div class="n2out"></div>';
    var sel = host.querySelector('select'), inp = host.querySelectorAll('input'), out = host.querySelector('.n2out');
    Array.prototype.forEach.call(inp, wDigits);
    wInit(host, sel, Array.prototype.slice.call(inp), ['a', 'b', 'c', 'd']);
    function style(P, b, sv) { return b === 0 ? 's' : sv === 0 ? 'b' : 'c'; }
    function calc() {
      var P = PAIRS[sel.value], v = Array.prototype.map.call(inp, wRead), i;
      Array.prototype.forEach.call(host.querySelectorAll('.n2u1'), function (e) { e.textContent = P.big; });
      Array.prototype.forEach.call(host.querySelectorAll('.n2u2'), function (e) { e.textContent = P.small; });
      for (i = 0; i < 4; i++) if (v[i] === null) return wMsg(out, 'Впиши все четыре числа (если меры нет, поставь 0).');
      if (v[1] >= P.f || v[3] >= P.f) return wMsg(out, 'Мелких единиц должно быть меньше ' + fmt(P.f) + ': ведь ' + P.fact + '.');
      var ta = v[0] * P.f + v[1], tb = v[2] * P.f + v[3];
      if (ta === 0 || tb === 0) return wMsg(out, 'Число не может быть нулём.');
      if (ta < tb) return wMsg(out, 'Делимое меньше делителя, частное получится меньше 1. Поменяй числа местами.');
      if (ta % tb !== 0) return wMsg(out, sm(P, ta) + ' : ' + sm(P, tb) + ' не делится нацело (остаток ' + (ta % tb) + '). Подбери другие числа: в этом уроке делим без остатка.');
      var A = dsc(P, ta, style(P, v[0], v[1])), B = dsc(P, tb, style(P, v[2], v[3]));
      out.innerHTML = R.tidy('<p class="facts">Помним: ' + P.fact + '.</p>' + R.n2DivNamedHTML(A, B) +
        '<p class="facts">Ответ: ' + expr(A.txt + ' : ' + B.txt + ' = <b>' + fmt(ta / tb) + '</b>') + '</p>');
    }
    sel.addEventListener('change', calc);
    Array.prototype.forEach.call(inp, function (i) { i.addEventListener('input', calc); });
    calc();
  };

  /* @@INSERT-5 */


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
