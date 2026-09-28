/* Генераторы заданий для блока «Сложение и вычитание больших чисел» (уроки 21–31).
   Каждый возвращает вопрос в том же формате, что и в gens.js. Числа каждый раз новые. */
(function (G) {
  'use strict';
  var R = G.RKS;
  var rand = R.rand, pick = R.pick, fmt = R.fmt, NB = R.NB;
  var gens = R.gens;

  var LBL = ['', 'единицы', 'десятки', 'сотни', 'тысячи', 'десятки тысяч', 'сотни тысяч', 'миллионы', 'десятки миллионов', 'сотни миллионов', 'миллиарды'];
  var KW = { 10: 'десятков', 100: 'сотен', 1000: 'тысяч', 10000: 'десятков тысяч', 100000: 'сотен тысяч' };
  var KN = { 10: 'десятков', 100: 'сотен', 1000: 'тысяч', 10000: 'десятков тысяч', 100000: 'сотен тысяч' };

  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function expr(s) { return '<span class="expr">' + s + '</span>'; }
  function rn(d) { return rand(Math.pow(10, d - 1), Math.pow(10, d) - 1); }
  function digs(n) { return String(n).length; }
  function unit(n, forms) { return fmt(n) + NB + R.plural(n, forms); }
  function roundTo(n, k) { return Math.floor((n + k / 2) / k) * k; }
  function rev(n) { return String(n).split('').reverse().map(Number); }

  /* сколько раз при сложении получается перенос */
  function countCarries(a, b) {
    var A = rev(a), B = rev(b), c = 0, n = 0, w = Math.max(A.length, B.length);
    for (var i = 0; i < w; i++) { var s = (A[i] || 0) + (B[i] || 0) + c; c = s >= 10 ? 1 : 0; n += c; }
    return n;
  }
  /* сколько раз при вычитании приходится занимать */
  function countBorrows(a, b) {
    var A = rev(a), B = rev(b), br = 0, n = 0;
    for (var i = 0; i < A.length; i++) { var nb = (A[i] - br) < (B[i] || 0) ? 1 : 0; n += nb; br = nb; }
    return n;
  }

  /* ---------- запись столбиком ----------
     R.colHTML(a, b, '+'|'-', {bare:true}) — bare: без переносов и без ответа */
  R.colHTML = function (a, b, op, o) {
    o = o || {};
    var r = op === '+' ? a + b : a - b;
    var w = Math.max(digs(a), digs(b), digs(r));
    function cells(n) {
      var s = String(n), out = [];
      for (var i = 0; i < w; i++) { var k = i - (w - s.length); out.push(k >= 0 ? s.charAt(k) : ''); }
      return out;
    }
    var A = cells(a), B = cells(b), Rr = cells(r), top = [], i;
    for (i = 0; i < w; i++) top.push('');
    if (!o.bare) {
      if (op === '+') {
        var c = 0;
        for (i = w - 1; i >= 0; i--) {
          var s = (A[i] === '' ? 0 : +A[i]) + (B[i] === '' ? 0 : +B[i]) + c;
          c = s >= 10 ? 1 : 0;
          if (c && i > 0) top[i - 1] = '1';
        }
      } else {
        var br = 0;
        for (i = w - 1; i >= 0; i--) {
          var da = A[i] === '' ? 0 : +A[i], db = B[i] === '' ? 0 : +B[i], cur = da - br;
          if (br) top[i] = String(cur < 0 ? 9 : cur);
          br = cur < db ? 1 : 0;
        }
      }
    }
    function row(cls, sign, arr) {
      var h = '<span class="cc-row ' + cls + '"><span class="cc-op">' + sign + '</span>';
      for (var j = 0; j < w; j++) {
        var p = w - 1 - j, gap = (p % 3 === 2 && j > 0) ? ' gap' : '';
        h += '<span class="cc-d' + gap + '">' + (arr[j] === '' ? '&nbsp;' : arr[j]) + '</span>';
      }
      return h + '</span>';
    }
    var blank = []; for (i = 0; i < w; i++) blank.push('');
    return '<span class="colcalc" role="img" aria-label="' + fmt(a) + ' ' + (op === '+' ? 'плюс' : 'минус') + ' ' + fmt(b) +
      (o.bare ? '' : ' равно ' + fmt(r)) + '">' +
      (o.bare ? '' : row('cc-mark', '', top)) + row('cc-a', '', A) + row('cc-b', op === '+' ? '+' : '−', B) +
      row('cc-line', '', o.bare ? blank : Rr) + '</span>';
  };

  /* ---------- пошаговое объяснение ---------- */
  R.addSteps = function (a, b) {
    var A = rev(a), B = rev(b), w = Math.max(A.length, B.length), c = 0, out = [];
    for (var i = 0; i < w; i++) {
      var x = A[i] || 0, y = B[i] || 0, s = x + y + c, terms = [];
      if (i < A.length) terms.push(x);
      if (i < B.length) terms.push(y);
      if (c) terms.push('1');
      var t = LBL[i + 1] + ': ';
      if (terms.length === 1) t += 'сносим ' + terms[0];
      else {
        t += terms.join(' + ') + ' = ' + s;
        if (s >= 10) { t += ' → пишем ' + (s % 10) + ', 1 запоминаем'; c = 1; } else { t += ' → пишем ' + s; c = 0; }
        out.push(t); continue;
      }
      c = 0; out.push(t);
    }
    if (c) out.push('в самом конце остался запомненный 1 — записываем его слева');
    return out;
  };
  R.subSteps = function (a, b) {
    var A = rev(a), B = rev(b), rl = digs(a - b), br = 0, out = [];
    for (var i = 0; i < A.length; i++) {
      var da = A[i], hasB = i < B.length, db = hasB ? B[i] : 0, t = LBL[i + 1] + ': ', nb, res, cur;
      if (br && da === 0) {
        nb = 1; res = 9 - db;
        t += 'здесь 0, а разряд справа уже занял у нас — занимаем дальше слева, остаётся 10 − 1 = 9';
        t += hasB ? '; 9 − ' + db + ' = ' + res : '; пишем 9';
      } else {
        cur = da - br; nb = cur < db ? 1 : 0; res = cur + (nb ? 10 : 0) - db;
        if (br) t += 'нам заняли 1, осталось ' + da + ' − 1 = ' + cur + '; ';
        if (nb) t += cur + ' меньше ' + db + ', занимаем 1 слева: ' + (cur + 10) + ' − ' + db + ' = ' + res;
        else if (hasB) t += cur + ' − ' + db + ' = ' + res;
        else t += br ? 'пишем ' + cur : 'сносим ' + da;
      }
      if (i >= rl && res === 0) t = LBL[i + 1] + ': остался 0 — в начале числа его не пишем';
      br = nb; out.push(t);
    }
    return out;
  };
  function explainCol(a, b, op) {
    var r = op === '+' ? a + b : a - b, st = op === '+' ? R.addSteps(a, b) : R.subSteps(a, b);
    var chk = op === '+' ? 'Проверка: ' + fmt(r) + ' − ' + fmt(b) + ' = ' + fmt(a) + '.' : 'Проверка: ' + fmt(r) + ' + ' + fmt(b) + ' = ' + fmt(a) + '.';
    return 'Столбиком:' + R.colHTML(a, b, op) + '<span class="colsteps">' + st.join('<br>') + '</span>Ответ: ' + num(r) + '. ' + chk;
  }

  /* ================= письменные действия ================= */

  gens.addCol = function (o) {
    o = o || {};
    var d = rand(o.dmin || 4, o.dmax || 6), a, b, g = 0;
    do {
      a = rn(d); b = rn(rand(Math.max(2, d - 1), d));
      g++;
    } while (g < 80 && o.carry !== false && countCarries(a, b) < (o.minCarries || 1));
    return {
      kind: 'num', html: 'Вычисли столбиком: ' + expr(fmt(a) + ' + ' + fmt(b) + ' ='), answer: a + b,
      hint: 'Запиши числа разряд под разрядом и складывай справа налево. Десяток, который получился в разряде, запоминай.',
      explain: explainCol(a, b, '+')
    };
  };

  gens.subCol = function (o) {
    o = o || {};
    var d = rand(o.dmin || 4, o.dmax || 6), a, b, g = 0;
    do {
      a = rn(d); b = rn(rand(Math.max(2, d - 1), d));
      if (b > a) { var t = a; a = b; b = t; }
      g++;
    } while (g < 80 && (a === b || countBorrows(a, b) < (o.minBorrows || 1)));
    if (a === b) a += 1;
    return {
      kind: 'num', html: 'Вычисли столбиком: ' + expr(fmt(a) + ' − ' + fmt(b) + ' ='), answer: a - b,
      hint: 'Если сверху цифра меньше, чем снизу, займи 1 у соседнего разряда слева. Не забудь, что там стало на 1 меньше.',
      explain: explainCol(a, b, '-')
    };
  };

  gens.subZeros = function (o) {
    o = o || {};
    var m = rand(o.mmin || 3, o.mmax || 5), a, b, style = Math.random() < 0.55 ? 'round' : 'mid';
    if (style === 'round') a = rand(1, 9) * Math.pow(10, m);
    else a = rand(1, 9) * Math.pow(10, m) + rand(1, 9) * Math.pow(10, rand(1, Math.max(1, m - 2)));
    do { b = rand(Math.floor(a / 10) + 1, a - 1); } while (b % 10 === 0 && Math.random() < 0.7);
    return {
      kind: 'num', html: 'Вычисли: ' + expr(fmt(a) + ' − ' + fmt(b) + ' ='), answer: a - b,
      hint: 'В нулях занимать нельзя — иди влево до первой цифры, не равной 0. Пройденные нули станут девятками.',
      explain: explainCol(a, b, '-')
    };
  };

  /* ================= удобные приёмы ================= */

  gens.addProp = function (o) {
    o = o || {};
    var k = o.round || pick([100, 1000]), a, c, b, S, order;
    S = rand(2, 9) * k;
    do { a = rand(Math.floor(k / 10) + 1, S - Math.floor(k / 10) - 1); } while (a % k === 0 || a % 10 === 0);
    c = S - a;
    b = rand(k, k * 9) + rand(1, 9);
    order = Math.random() < 0.5 ? [a, b, c] : [c, b, a];
    return {
      kind: 'num', html: 'Вычисли удобным способом: ' + expr(order.map(fmt).join(' + ') + ' ='), answer: a + b + c,
      hint: 'Найди два слагаемых, которые вместе дают круглое число, и сложи их первыми.',
      explain: fmt(a) + ' + ' + fmt(c) + ' = ' + fmt(S) + ', а потом ' + fmt(S) + ' + ' + fmt(b) + ' = ' + fmt(a + b + c) + '.'
    };
  };

  gens.subSum = function (o) {
    o = o || {};
    var k = o.round || pick([100, 1000]), S = rand(1, 5) * k, b, c, a;
    do { b = rand(Math.floor(k / 10) + 1, S - Math.floor(k / 10) - 1); } while (b % 10 === 0);
    c = S - b; a = S + rand(2, 9) * k + rand(1, 9) * Math.max(1, k / 10);
    return {
      kind: 'num', html: 'Вычисли удобным способом: ' + expr(fmt(a) + ' − ' + fmt(b) + ' − ' + fmt(c) + ' ='), answer: a - S,
      hint: 'Вычесть два числа по очереди — то же, что вычесть их сумму. Посмотри, какая у них сумма.',
      explain: fmt(b) + ' + ' + fmt(c) + ' = ' + fmt(S) + '. Значит, ' + fmt(a) + ' − ' + fmt(S) + ' = ' + fmt(a - S) + '.'
    };
  };

  /* ================= неизвестное число ================= */

  gens.unkTerm = function (o) {
    o = o || {};
    var d = rand(o.dmin || 3, o.dmax || 4), t = o.type || pick(['add', 'sub1', 'sub2']), x, b, c, a, q, ans, hint, why;
    if (t === 'add') {
      x = rn(d); b = rn(rand(Math.max(1, d - 1), d)); c = x + b;
      q = Math.random() < 0.5 ? '□ + ' + fmt(b) + ' = ' + fmt(c) : fmt(b) + ' + □ = ' + fmt(c);
      ans = x; hint = 'Неизвестное слагаемое = сумма − известное слагаемое.';
      why = 'Из суммы вычитаем известное слагаемое: ' + fmt(c) + ' − ' + fmt(b) + ' = ' + fmt(x) + '. Проверка: ' + fmt(x) + ' + ' + fmt(b) + ' = ' + fmt(c) + '.';
    } else if (t === 'sub1') {
      c = rn(d); b = rn(rand(Math.max(1, d - 1), d)); x = c + b;
      q = '□ − ' + fmt(b) + ' = ' + fmt(c); ans = x; hint = 'Неизвестное уменьшаемое = разность + вычитаемое.';
      why = 'К разности прибавляем вычитаемое: ' + fmt(c) + ' + ' + fmt(b) + ' = ' + fmt(x) + '. Проверка: ' + fmt(x) + ' − ' + fmt(b) + ' = ' + fmt(c) + '.';
    } else {
      c = rn(rand(Math.max(1, d - 1), d)); x = rn(rand(Math.max(1, d - 1), d)); a = x + c;
      q = fmt(a) + ' − □ = ' + fmt(c); ans = x; hint = 'Неизвестное вычитаемое = уменьшаемое − разность.';
      why = 'Из уменьшаемого вычитаем разность: ' + fmt(a) + ' − ' + fmt(c) + ' = ' + fmt(x) + '. Проверка: ' + fmt(a) + ' − ' + fmt(x) + ' = ' + fmt(c) + '.';
    }
    return { kind: 'num', html: 'Найди неизвестное число: ' + expr(q), answer: ans, hint: hint, explain: why };
  };

  /* ================= округление и прикидка ================= */

  gens.roundTo = function (o) {
    o = o || {};
    var k = pick(o.ks || [100, 1000]), lo = String(k).length, n, g = 0;
    do { n = rn(rand(lo, lo + 2)); g++; } while (n % k === 0 && g < 30);
    var next = Math.floor(n / (k / 10)) % 10, ans = roundTo(n, k);
    return {
      kind: 'num', html: 'Округли число ' + num(n) + ' до ' + KW[k] + ':', answer: ans,
      hint: 'Посмотри на цифру справа от разряда, до которого округляешь: 0–4 — разряд не меняется, 5–9 — прибавь 1.',
      explain: 'Цифра справа от разряда ' + KN[k] + ' — ' + next + (next >= 5 ? ' (5 или больше), поэтому разряд ' + KN[k] + ' увеличиваем на 1' : ' (меньше 5), поэтому разряд ' + KN[k] + ' оставляем') +
        ', а все цифры правее заменяем нулями. Получаем ' + num(ans) + '.'
    };
  };

  gens.estimate = function (o) {
    o = o || {};
    var k = pick(o.ks || [100, 1000]), lo = String(k).length, op = o.op || pick(['+', '-']), a, b, ra, rb, g = 0;
    do {
      a = rn(rand(lo + 1, lo + 2)); b = rn(rand(lo + 1, lo + 2));
      if (op === '-' && a < b) { var t = a; a = b; b = t; }
      ra = roundTo(a, k); rb = roundTo(b, k); g++;
    } while (g < 60 && (a % k === 0 || b % k === 0 || (op === '-' && ra - rb <= 0)));
    var ans = op === '+' ? ra + rb : ra - rb, exact = op === '+' ? a + b : a - b;
    return {
      kind: 'num',
      html: 'Округли числа до ' + KW[k] + ' и найди приближённое значение: ' + expr(fmt(a) + (op === '+' ? ' + ' : ' − ') + fmt(b) + ' ≈'),
      answer: ans,
      hint: 'Сначала округли каждое число до ' + KW[k] + ', потом выполни действие с круглыми числами.',
      explain: fmt(a) + ' ≈ ' + fmt(ra) + ', ' + fmt(b) + ' ≈ ' + fmt(rb) + '. Тогда ' + fmt(ra) + (op === '+' ? ' + ' : ' − ') + fmt(rb) + ' = ' + fmt(ans) +
        '. Для сравнения точный ответ ' + fmt(exact) + ' — он близок к прикидке.'
    };
  };

  /* ================= проверка действий ================= */

  gens.checkCalc = function (o) {
    o = o || {};
    var op = o.op || pick(['+', '-']), d = rand(o.dmin || 3, o.dmax || 5), a = rn(d), b = rn(rand(Math.max(2, d - 1), d)), r, shown, good = Math.random() < 0.5;
    if (op === '-') { if (a < b) { var t = a; a = b; b = t; } if (a === b) a += 1; r = a - b; } else r = a + b;
    shown = r;
    if (!good) {
      var g = 0, e;
      do {
        e = Math.pow(10, rand(1, Math.min(3, digs(r) - 1))) * pick([1, -1]); shown = r + e; g++;
      } while (g < 30 && (shown <= 0 || shown === r));
      if (shown === r) { shown = r + 10; }
    }
    var sign = op === '+' ? ' + ' : ' − ', back, ok = shown === r;
    var line = expr(fmt(a) + sign + fmt(b) + ' = ' + fmt(shown));
    var why;
    if (op === '+') {
      back = shown - b;
      why = 'Проверяем вычитанием: ' + fmt(shown) + ' − ' + fmt(b) + ' = ' + fmt(back) + (ok ? ' — получилось первое слагаемое ' + fmt(a) + ', значит верно.' : ', а должно получиться ' + fmt(a) + '. Значит, ошибка. Правильно: ' + fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(r) + '.');
    } else {
      back = shown + b;
      why = 'Проверяем сложением: ' + fmt(shown) + ' + ' + fmt(b) + ' = ' + fmt(back) + (ok ? ' — получилось уменьшаемое ' + fmt(a) + ', значит верно.' : ', а должно получиться ' + fmt(a) + '. Значит, ошибка. Правильно: ' + fmt(a) + ' − ' + fmt(b) + ' = ' + fmt(r) + '.');
    }
    return {
      kind: 'choice', html: 'Проверь обратным действием, верно ли записано:<br>' + line, options: ['Верно', 'Неверно'], answer: ok ? 0 : 1, wide: false,
      hint: op === '+' ? 'Из суммы вычти одно слагаемое — должно получиться другое.' : 'К разности прибавь вычитаемое — должно получиться уменьшаемое.',
      explain: why
    };
  };

  /* ================= устный счёт ================= */

  /* дополнение до 10^m: все цифры до 9, последнюю ненулевую — до 10 */
  function complement(a, m) {
    var s = String(a); while (s.length < m) s = '0' + s;
    var last = s.length - 1; while (last > 0 && s.charAt(last) === '0') last--;
    var out = '';
    for (var i = 0; i < s.length; i++) out += i < last ? String(9 - s.charAt(i)) : i === last ? String(10 - s.charAt(i)) : '0';
    return Number(out);
  }
  gens.compl1000 = function (o) {
    o = o || {};
    var m = o.big ? pick([3, 4]) : 3, base = Math.pow(10, m), a, g = 0;
    if (m === 3) { do { a = rand(101, 989); g++; } while (a % 100 === 0 && g < 20); }
    else { a = rand(11, 99) * 100 + pick([0, 0, 50]); }
    var ans = base - a, res = complement(a, m);
    return {
      kind: 'num', html: expr(fmt(base) + ' − ' + fmt(a) + ' ='), answer: ans,
      hint: 'Каждую цифру, кроме последней ненулевой, дополни до 9, а последнюю ненулевую — до 10. Нули в конце остаются нулями.',
      explain: 'Дополняем: ' + fmt(a) + ' → ' + fmt(res) + '. Проверка: ' + fmt(a) + ' + ' + fmt(res) + ' = ' + fmt(base) + '.'
    };
  };

  gens.mentalBig = function () {
    var a = rand(11, 89) * 100, b = rand(11, 89) * 100, op = pick(['+', '-']);
    if (op === '-' && a < b) { var t = a; a = b; b = t; }
    if (a === b) a += 100;
    var ha = a / 100, hb = b / 100, r = op === '+' ? ha + hb : ha - hb;
    return {
      kind: 'num', html: expr(fmt(a) + (op === '+' ? ' + ' : ' − ') + fmt(b) + ' ='), answer: op === '+' ? a + b : a - b,
      hint: 'Считай сотнями: сколько сотен в каждом числе?',
      explain: ha + ' сот. ' + (op === '+' ? '+' : '−') + ' ' + hb + ' сот. = ' + r + ' сот. = ' + fmt(r * 100) + '.'
    };
  };

  gens.mentalTwo = function () {
    var a, b, op = pick(['+', '-']);
    if (op === '+') {
      do { a = rand(15, 79); b = rand(12, 89); } while ((a % 10) + (b % 10) < 10 || a + b > 160);
    } else {
      do { a = rand(52, 99); b = rand(13, 89); } while (b >= a || (a % 10) >= (b % 10));
    }
    var tens = b - (b % 10), u = b % 10, mid = op === '+' ? a + tens : a - tens, r = op === '+' ? a + b : a - b;
    return {
      kind: 'num', html: expr(a + (op === '+' ? ' + ' : ' − ') + b + ' ='), answer: r,
      hint: 'Раздели второе число на десятки и единицы и прибавляй (или вычитай) по частям.',
      explain: a + (op === '+' ? ' + ' : ' − ') + tens + ' = ' + mid + ', потом ' + mid + (op === '+' ? ' + ' : ' − ') + u + ' = ' + r + '.'
    };
  };

  /* ================= задачи ================= */

  function steps(list, ans) {
    return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>') + '<br>Ответ: ' + ans + '.';
  }
  function big(lo, hi) { return rand(lo, hi) * 10 + rand(0, 9) * (Math.random() < 0.5 ? 1 : 0); }

  /* было + прибавили + «на … больше» */
  gens.pMore = function () {
    var ctx = pick([0, 1, 2]), N = big(800, 9000), A = big(200, 900), D = big(20, 190), text, hint, list, ans;
    if (ctx === 0) {
      text = 'В библиотеке было ' + unit(N, ['книга', 'книги', 'книг']) + '. За осень в неё поступило ' + unit(A, ['книга', 'книги', 'книг']) +
        ', а за зиму — на ' + fmt(D) + ' больше, чем за осень. Сколько книг стало в библиотеке?';
      ans = N + A + (A + D);
      list = ['Сколько книг поступило за зиму? ' + fmt(A) + ' + ' + fmt(D) + ' = ' + fmt(A + D),
        'Сколько всего поступило? ' + fmt(A) + ' + ' + fmt(A + D) + ' = ' + fmt(2 * A + D),
        'Сколько стало в библиотеке? ' + fmt(N) + ' + ' + fmt(2 * A + D) + ' = ' + fmt(ans)];
    } else if (ctx === 1) {
      text = 'На складе было ' + fmt(N) + ' кг муки. В понедельник привезли ' + fmt(A) + ' кг, а во вторник — на ' + fmt(D) +
        ' кг больше, чем в понедельник. Сколько килограммов муки стало на складе?';
      ans = N + A + (A + D);
      list = ['Сколько килограммов привезли во вторник? ' + fmt(A) + ' + ' + fmt(D) + ' = ' + fmt(A + D),
        'Сколько привезли за два дня? ' + fmt(A) + ' + ' + fmt(A + D) + ' = ' + fmt(2 * A + D),
        'Сколько муки стало на складе? ' + fmt(N) + ' + ' + fmt(2 * A + D) + ' = ' + fmt(ans)];
    } else {
      text = 'В деревне было ' + unit(N, ['яблоня', 'яблони', 'яблонь']) + '. Весной посадили ещё ' + unit(A, ['яблоня', 'яблони', 'яблонь']) +
        ', а осенью — на ' + fmt(D) + ' меньше, чем весной. Сколько яблонь стало в деревне?';
      ans = N + A + (A - D);
      list = ['Сколько яблонь посадили осенью? ' + fmt(A) + ' − ' + fmt(D) + ' = ' + fmt(A - D),
        'Сколько посадили за год? ' + fmt(A) + ' + ' + fmt(A - D) + ' = ' + fmt(2 * A - D),
        'Сколько стало в деревне? ' + fmt(N) + ' + ' + fmt(2 * A - D) + ' = ' + fmt(ans)];
    }
    return {
      kind: 'num', html: text, answer: ans,
      hint: 'Сначала узнай, сколько привезли (посадили, поступило) во второй раз. «На … больше» — прибавляем, «на … меньше» — вычитаем.',
      explain: steps(list, fmt(ans))
    };
  };

  /* на сколько больше / меньше */
  gens.pDiff = function () {
    var ctx = pick([0, 1, 2]), B = big(30000, 90000), Dd = big(2000, 19000), A = B + Dd, more = Math.random() < 0.5, text;
    if (ctx === 0) {
      text = 'Первый завод выпустил за год ' + unit(A, ['деталь', 'детали', 'деталей']) + ', а второй — ' + unit(B, ['деталь', 'детали', 'деталей']) + '. ' +
        (more ? 'На сколько деталей больше выпустил первый завод?' : 'На сколько деталей меньше выпустил второй завод?');
    } else if (ctx === 1) {
      text = 'В одном городе живёт ' + unit(A, ['человек', 'человека', 'человек']) + ', а в другом — ' + unit(B, ['человек', 'человека', 'человек']) + '. ' +
        (more ? 'На сколько жителей больше в первом городе?' : 'На сколько жителей меньше во втором городе?');
    } else {
      text = 'За неделю в кинотеатре побывали ' + unit(A, ['зритель', 'зрителя', 'зрителей']) + ', а за предыдущую — ' + unit(B, ['зритель', 'зрителя', 'зрителей']) + '. ' +
        (more ? 'На сколько зрителей больше пришло за эту неделю?' : 'На сколько зрителей меньше пришло за предыдущую неделю?');
    }
    return {
      kind: 'num', html: text, answer: Dd,
      hint: 'Чтобы узнать, на сколько одно число больше или меньше другого, вычти из большего меньшее.',
      explain: 'Сравниваем ' + fmt(A) + ' и ' + fmt(B) + '. Из большего вычитаем меньшее: ' + fmt(A) + ' − ' + fmt(B) + ' = ' + fmt(Dd) + '. Ответ: ' + fmt(Dd) + '.'
    };
  };

  /* было − отдали − отдали */
  gens.pRemain = function () {
    var ctx = pick([0, 1, 2]), X = big(1200, 4800), Y = big(1200, 4800), rest = big(600, 4000), N = X + Y + rest, text;
    if (ctx === 0) text = 'В цистерне было ' + fmt(N) + ' л молока. В первый день продали ' + fmt(X) + ' л, во второй — ' + fmt(Y) + ' л. Сколько литров молока осталось?';
    else if (ctx === 1) text = 'В хранилище было ' + fmt(N) + ' кг зерна. Сначала вывезли ' + fmt(X) + ' кг, потом ещё ' + fmt(Y) + ' кг. Сколько килограммов зерна осталось в хранилище?';
    else text = 'В бассейне было ' + fmt(N) + ' л воды. За утро израсходовали ' + fmt(X) + ' л, а за вечер — ' + fmt(Y) + ' л. Сколько литров воды осталось в бассейне?';
    return {
      kind: 'num', html: text, answer: rest,
      hint: 'Можно узнать, сколько убрали всего, и вычесть это из начального количества.',
      explain: steps(['Сколько убрали за два раза? ' + fmt(X) + ' + ' + fmt(Y) + ' = ' + fmt(X + Y), 'Сколько осталось? ' + fmt(N) + ' − ' + fmt(X + Y) + ' = ' + fmt(rest)], fmt(rest)) +
        '<br>Можно и по-другому: ' + fmt(N) + ' − ' + fmt(X) + ' − ' + fmt(Y) + ' = ' + fmt(rest) + '.'
    };
  };

  /* что было сначала */
  gens.pReverse = function () {
    var kind = pick(['took', 'added', 'spent']), X = big(1500, 8000), Y = big(2000, 9000), text, ans, how;
    if (kind === 'took') {
      text = 'Со склада вывезли ' + fmt(X) + ' кг картофеля, и на складе осталось ' + fmt(Y) + ' кг. Сколько килограммов картофеля было на складе сначала?';
      ans = X + Y; how = 'Вывезли ' + fmt(X) + ' кг и осталось ' + fmt(Y) + ' кг, значит, сначала было больше: ' + fmt(X) + ' + ' + fmt(Y) + ' = ' + fmt(ans) + '.';
    } else if (kind === 'added') {
      Y = X + big(2000, 9000); text = 'В бассейн налили ещё ' + fmt(X) + ' л воды, и в нём стало ' + fmt(Y) + ' л. Сколько литров воды было в бассейне сначала?';
      ans = Y - X; how = 'Добавили ' + fmt(X) + ' л и стало ' + fmt(Y) + ' л, значит, сначала было меньше: ' + fmt(Y) + ' − ' + fmt(X) + ' = ' + fmt(ans) + '.';
    } else {
      text = 'Купили книги на ' + fmt(X) + ' руб., и у покупателя осталось ' + fmt(Y) + ' руб. Сколько рублей у него было сначала?';
      ans = X + Y; how = 'Потратили ' + fmt(X) + ' руб. и осталось ' + fmt(Y) + ' руб., значит, сначала было больше: ' + fmt(X) + ' + ' + fmt(Y) + ' = ' + fmt(ans) + '.';
    }
    return {
      kind: 'num', html: text, answer: ans,
      hint: 'Подумай: сначала было больше или меньше, чем стало? Если убрали — надо вернуть убранное; если добавили — убрать добавленное.',
      explain: how + '<br>Проверка: вернись к условию и проделай действия с найденным числом.'
    };
  };

  /* маршрут: всего, в первый день, во второй на … меньше/больше, сколько осталось */
  gens.pRoute = function () {
    var A = big(300, 900), D = big(20, 190), less = Math.random() < 0.6, B = less ? A - D : A + D, rest = big(100, 900), N = A + B + rest;
    var text = 'Расстояние между двумя городами ' + fmt(N) + ' км. Автомобиль в первый день проехал ' + fmt(A) + ' км, а во второй — на ' + fmt(D) +
      ' км ' + (less ? 'меньше' : 'больше') + ', чем в первый. Сколько километров ему осталось проехать?';
    return {
      kind: 'num', html: text, answer: rest,
      hint: 'Сначала найди, сколько километров автомобиль проехал во второй день, потом — за два дня вместе.',
      explain: steps(['Сколько км проехал во второй день? ' + fmt(A) + (less ? ' − ' : ' + ') + fmt(D) + ' = ' + fmt(B),
        'Сколько км проехал за два дня? ' + fmt(A) + ' + ' + fmt(B) + ' = ' + fmt(A + B),
        'Сколько км осталось? ' + fmt(N) + ' − ' + fmt(A + B) + ' = ' + fmt(rest)], fmt(rest))
    };
  };

  /* ================= общая чистка текста ================= */
  var tidy = R.tidy;
  ['addCol', 'subCol', 'subZeros', 'addProp', 'subSum', 'unkTerm', 'roundTo', 'estimate', 'checkCalc', 'compl1000', 'mentalBig', 'mentalTwo',
    'pMore', 'pDiff', 'pRemain', 'pReverse', 'pRoute'].forEach(function (name) {
    var raw = gens[name];
    gens[name] = function (o) {
      var q = raw(o);
      q.html = tidy(q.html); q.explain = tidy(q.explain); q.hint = tidy(q.hint);
      return q;
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
