/* Генераторы заданий для повторения курса 3 класса (уроки 1–12):
   нумерация, четыре действия с многозначными числами, порядок действий, меры длины и веса, геометрия.
   Формат вопроса тот же, что в gens.js. Числа каждый раз новые. */
(function (G) {
  'use strict';
  var R = G.RKS;
  var rand = R.rand, pick = R.pick, shuffle = R.shuffle, fmt = R.fmt, NB = R.NB;
  var gens = R.gens;

  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function expr(s) { return '<span class="expr">' + s + '</span>'; }
  function rn(d) { return rand(Math.pow(10, d - 1), Math.pow(10, d) - 1); }
  function unit(n, forms) { return fmt(n) + NB + R.plural(n, forms); }
  function steps(list, ans) {
    return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>') + '<br>Ответ: ' + ans + '.';
  }
  function divisors(n, lo, hi) { var o = []; for (var i = lo; i <= hi; i++) if (n % i === 0) o.push(i); return o; }
  function tens(lo, hi) { return rand(lo, hi) * 10; }
  function distinctOptions(right, cands, k) {
    var seen = {}, out = []; seen[right] = 1;
    shuffle(cands).forEach(function (c) { if (out.length < k && !seen[c]) { seen[c] = 1; out.push(c); } });
    return out;
  }

  /* ================= названия компонентов действий ================= */
  var NAMES = ['слагаемое', 'сумма', 'уменьшаемое', 'вычитаемое', 'разность', 'множитель', 'произведение', 'делимое', 'делитель', 'частное'];
  gens.compName = function (o) {
    o = o || {};
    var op = pick(o.ops || ['+', '−', '×', ':']), a, b, c, eq, list;
    if (op === '+') { a = rand(12, 99); b = rand(12, 99); c = a + b; list = [[a, 'слагаемое'], [b, 'слагаемое'], [c, 'сумма']]; }
    else if (op === '−') { b = rand(12, 60); c = rand(12, 60); a = b + c; list = [[a, 'уменьшаемое'], [b, 'вычитаемое'], [c, 'разность']]; }
    else if (op === '×') { a = rand(4, 19); b = rand(3, 9); c = a * b; list = [[a, 'множитель'], [b, 'множитель'], [c, 'произведение']]; }
    else { b = rand(3, 9); c = rand(4, 19); a = b * c; list = [[a, 'делимое'], [b, 'делитель'], [c, 'частное']]; }
    eq = a + ' ' + op + ' ' + b + ' = ' + c;
    var t = pick(list);
    var opts = shuffle([t[1]].concat(distinctOptions(t[1], NAMES, 3)));
    return {
      kind: 'choice',
      html: 'В равенстве ' + expr(eq) + ' число <b>' + t[0] + '</b> называется…',
      options: opts, answer: opts.indexOf(t[1]),
      hint: 'Вспомни названия чисел при сложении, вычитании, умножении и делении.',
      explain: 'В записи «' + eq + '» число ' + t[0] + ' — это ' + t[1] + '. ' + ({ '+': 'Числа, которые складывают, — слагаемые, результат — сумма.', '−': 'Из уменьшаемого вычитают вычитаемое, получается разность.', '×': 'Числа, которые умножают, — множители, результат — произведение.', ':': 'Делимое делят на делитель, получается частное.' })[op]
    };
  };

  /* ================= сложение нескольких чисел ================= */
  gens.addMany = function (o) {
    o = o || {};
    var k = o.terms || pick([3, 3, 4]), nums = [], i, sum = 0;
    for (i = 0; i < k; i++) nums.push(rn(rand(o.dmin || 3, o.dmax || 6)));
    nums.forEach(function (x) { sum += x; });
    return {
      kind: 'num', html: 'Вычисли столбиком: ' + expr(nums.map(fmt).join(' + ') + ' ='), answer: sum,
      hint: 'Подпиши числа одно под другим: единицы под единицами. Складывай справа налево, десятки запоминай.',
      explain: 'Столбиком:' + R.sumColHTML(nums) + '<span class="colsteps">' + R.sumSteps(nums).join('<br>') + '</span>Ответ: ' + num(sum) + '.'
    };
  };

  /* ================= умножение ================= */
  function mulExplain(a, b) {
    var r = a * b;
    return 'Столбиком:' + R.mulHTML(a, b) + '<span class="colsteps">' + R.mulSteps(a, b).join('<br>') + '</span>Ответ: ' + num(r) +
      '. Проверка делением: ' + fmt(r) + ' : ' + fmt(b) + ' = ' + fmt(a) + '.';
  }
  /* o.amin/amax — цифр в первом множителе; o.bmin/bmax — во втором; o.bmode: 'zero' (0 внутри множителя), 'round' (круглый множитель) */
  gens.mulCol = function (o) {
    o = o || {};
    var da = rand(o.amin || 3, o.amax || 4), db = rand(o.bmin || 1, o.bmax || 1), a = rn(da), b;
    if (o.zeroA && da >= 3) { var sa = String(a).split(''); sa[rand(1, da - 2)] = '0'; a = Number(sa.join('')); }
    if (o.bmode === 'zero') { b = rand(1, 9) * 100 + rand(1, 9); if (Math.random() < 0.4) b = b * 10 + rand(1, 9); if (b > 9999) b = rand(1, 9) * 100 + rand(1, 9); }
    else if (o.bmode === 'round') { b = rand(2, 9) * Math.pow(10, rand(1, 2)); if (Math.random() < 0.3) b = rand(2, 9) * 100 + rand(1, 9) * 10; }
    else if (db === 1) b = rand(2, 9);
    else b = rn(db);
    if (a * b > 2e9) a = Math.floor(a / 10);
    var hint = String(b).length === 1
      ? 'Умножай каждую цифру справа налево. Десятки, которые получились, запоминай и прибавляй к следующему произведению.'
      : 'Умножь первое число на каждую цифру второго, начиная с единиц. Каждую следующую строку пиши на разряд левее. В конце сложи строки.';
    return { kind: 'num', html: 'Вычисли столбиком: ' + expr(fmt(a) + ' × ' + fmt(b) + ' ='), answer: a * b, hint: hint, explain: mulExplain(a, b) };
  };

  gens.mulMental = function (o) {
    o = o || {};
    var t = o.type || pick(['small', 'round', 'x10']), a, b, ans, why, hint;
    if (t === 'small') {
      a = rand(12, 99); if (a % 10 === 0) a += 3; b = rand(3, 9); ans = a * b;
      var t10 = Math.floor(a / 10) * 10, u = a % 10;
      hint = 'Раздели ' + a + ' на десятки и единицы и умножь каждую часть.';
      why = fmt(a) + ' × ' + b + ' = ' + t10 + ' × ' + b + ' + ' + u + ' × ' + b + ' = ' + (t10 * b) + ' + ' + (u * b) + ' = ' + ans + '.';
    } else if (t === 'round') {
      a = rand(12, 99); b = pick([20, 30, 40, 50, 60, 70, 80, 90]); ans = a * b;
      hint = 'Умножь на число десятков, потом припиши справа ноль.';
      why = fmt(a) + ' × ' + b + ' = ' + a + ' × ' + (b / 10) + ' × 10 = ' + (a * b / 10) + ' × 10 = ' + fmt(ans) + '.';
    } else {
      a = rand(12, 990); b = pick([10, 100]); ans = a * b;
      hint = 'Чтобы умножить на 10, припиши справа один ноль; на 100 — два нуля.';
      why = fmt(a) + ' × ' + b + ' = ' + fmt(ans) + ': приписываем справа ' + (b === 10 ? 'один ноль' : 'два нуля') + '.';
    }
    return { kind: 'num', html: expr(fmt(a) + ' × ' + b + ' ='), answer: ans, hint: hint, explain: why };
  };

  gens.mulTimes = function () {
    var k = pick([6, 7, 8, 9]), base = pick([12, 15, 16, 18, 25, 32, 35, 45, 60, 70, 85, 100, 130, 250, 500]);
    return {
      kind: 'num', html: 'Увеличь число ' + num(base) + ' в ' + k + ' ' + R.plural(k, ['раз', 'раза', 'раз']) + '.', answer: base * k,
      hint: 'Увеличить в несколько раз — значит умножить.',
      explain: fmt(base) + ' × ' + k + ' = ' + fmt(base * k) + '.'
    };
  };

  /* ================= деление ================= */
  function divExplain(a, d) {
    var c = R.divCalc(a, d);
    return 'Делим уголком:' + R.divHTML(a, d) + '<span class="colsteps">' + R.divSteps(a, d).join('<br>') + '</span>Ответ: ' + num(c.q) +
      '. Проверка умножением: ' + fmt(c.q) + ' × ' + fmt(d) + ' = ' + fmt(a) + '.';
  }
  /* o.ddig — цифр в делителе (1–3); o.qmin/qmax — цифр в частном; o.zeroQ — ноль внутри частного */
  gens.divCol = function (o) {
    o = o || {};
    var dd = o.ddig || 1, qd = rand(o.qmin || 2, o.qmax || 3), d, q, g = 0;
    do {
      d = dd === 1 ? rand(2, 9) : dd === 2 ? rand(11, 99) : rand(101, 999);
      g++;
    } while (dd > 1 && d % 10 === 0 && g < 40);
    q = rn(qd);
    if (o.zeroQ && qd >= 3) { var sq = String(q).split(''); sq[rand(1, qd - 1)] = '0'; q = Number(sq.join('')); }
    var a = q * d;
    return {
      kind: 'num', html: 'Вычисли уголком: ' + expr(fmt(a) + ' : ' + fmt(d) + ' ='), answer: q,
      hint: dd === 1 ? 'Возьми первое неполное делимое, подбери цифру частного, умножь, вычти и снеси следующую цифру.'
        : 'Подбери цифру частного: округли делитель и неполное делимое и раздели. Проверь: остаток должен быть меньше делителя.',
      explain: divExplain(a, d)
    };
  };

  /* деление на 10, 100 и круглые десятки */
  gens.divRound = function (o) {
    o = o || {};
    var t = o.type || pick(['pow', 'tens', 'tens']), a, d, q, why, hint;
    if (t === 'pow') {
      d = pick([10, 100]); q = rand(12, 990); a = q * d;
      hint = 'Чтобы разделить на ' + d + ', отбрось справа ' + (d === 10 ? 'один ноль' : 'два нуля') + '.';
      why = fmt(a) + ' : ' + d + ' = ' + fmt(q) + ': отбрасываем справа ' + (d === 10 ? 'один ноль' : 'два нуля') + '.';
    } else {
      var t1 = rand(2, 9); d = t1 * 10; q = rand(12, 400); a = q * d;
      hint = 'Убери по одному нулю у делимого и у делителя и раздели.';
      why = fmt(a) + ' : ' + d + ' = ' + fmt(a / 10) + ' : ' + t1 + ' = ' + fmt(q) + ' (убрали по одному нулю у делимого и делителя).';
    }
    return { kind: 'num', html: expr(fmt(a) + ' : ' + fmt(d) + ' ='), answer: q, hint: hint, explain: why };
  };

  gens.divMental = function (o) {
    o = o || {};
    var t = o.type || pick(['round', 'small', 'tens']), a, d, q, why, hint;
    if (t === 'round') {
      d = rand(2, 9); q = rand(2, 9) * pick([10, 10, 100]); a = q * d;
      hint = 'Раздели сначала число десятков (сотен), потом припиши нули.';
      var u = q >= 100 ? 100 : 10;
      why = fmt(a) + ' : ' + d + ' = ' + (a / u) + ' : ' + d + ' × ' + u + ' = ' + (q / u) + ' × ' + u + ' = ' + fmt(q) + '.';
    } else if (t === 'small') {
      d = rand(3, 9); q = rand(12, 60); a = q * d;
      var big = Math.floor(q / 10) * 10 * d, rest = a - big;
      hint = 'Раздели ' + a + ' на удобные части: круглую и оставшуюся.';
      why = fmt(a) + ' : ' + d + ' = (' + big + ' + ' + rest + ') : ' + d + ' = ' + (big / d) + ' + ' + (rest / d) + ' = ' + q + '.';
    } else {
      var td = rand(2, 9); d = td * 10; q = rand(2, 9); a = q * d;
      hint = 'Раздели десятки на десятки: убери по нулю.';
      why = fmt(a) + ' : ' + d + ' = ' + (a / 10) + ' : ' + td + ' = ' + q + '.';
    }
    return { kind: 'num', html: expr(fmt(a) + ' : ' + fmt(d) + ' ='), answer: q, hint: hint, explain: why };
  };

  gens.seqDiv = function () {
    var pr = pick([[2, 2], [2, 3], [2, 4], [3, 3], [2, 6], [4, 4], [3, 4]]), d = pr[0] * pr[1], q = rand(21, 79);
    var a = q * d;
    return {
      kind: 'num', html: 'Раздели последовательно: ' + expr(fmt(a) + ' : ' + d + ' ='), answer: q,
      hint: 'Раздели ' + d + ' на два множителя: ' + d + ' = ' + pr[0] + ' × ' + pr[1] + ' — и дели по очереди.',
      explain: fmt(a) + ' : ' + d + ' = ' + fmt(a) + ' : ' + pr[0] + ' : ' + pr[1] + ' = ' + fmt(a / pr[0]) + ' : ' + pr[1] + ' = ' + q + '.'
    };
  };

  var PARTS = { 2: 'половину', 3: 'третью часть', 4: 'четвёртую часть', 5: 'пятую часть', 6: 'шестую часть', 8: 'восьмую часть', 10: 'десятую часть' };
  gens.partOf = function () {
    var k = pick([2, 3, 4, 5, 6, 8, 10]), q = rand(6, 90), a = q * k;
    return {
      kind: 'num', html: 'Найди ' + PARTS[k] + ' от числа ' + num(a) + '.', answer: q,
      hint: 'Найти ' + (k === 2 ? 'половину' : 'одну из ' + k + ' равных частей') + ' — значит разделить число на ' + k + '.',
      explain: fmt(a) + ' : ' + k + ' = ' + q + '.'
    };
  };

  /* ================= порядок действий ================= */
  /* шаблоны без скобок; каждый возвращает массив токенов */
  var T_SAME = [
    function () { var a = tens(10, 70), b = tens(5, 50), c = tens(3, Math.floor((a + b) / 10) - 1); return [a, '+', b, '−', c]; },
    function () { var a = tens(30, 95), b = tens(3, Math.floor(a / 10) - 1), c = tens(5, 80); return [a, '−', b, '+', c]; },
    function () { var a = tens(50, 99), b = tens(3, 20), c = tens(3, 20); return [a, '−', b, '−', c]; },
    function () { var b = rand(2, 9), c = pick([2, 3, 4, 5, 6, 8]), a = c * rand(4, 30); return [a, '×', b, ':', c]; },
    function () { var b = pick([2, 3, 4, 6, 8]), c = rand(2, 9), a = b * rand(6, 40); return [a, ':', b, '×', c]; },
    function () { var b = pick([2, 3, 4, 5]), c = pick([2, 3, 4, 5]), a = b * c * rand(3, 30); return [a, ':', b, ':', c]; },
    function () { var b = 10, c = rand(2, 9) * 10, a = b * rand(20, 90); return [a, ':', b, '×', c]; }
  ];
  var T_MIX = [
    function () { return [tens(10, 90), '+', tens(2, 9) * 1, '×', rand(2, 9)]; },
    function () { var b = tens(2, 9), c = rand(2, 9), a = b * c + tens(2, 40); return [a, '−', b, '×', c]; },
    function () { return [rand(12, 60), '×', rand(3, 9), '+', tens(5, 60)]; },
    function () { var a = rand(12, 60), b = rand(3, 9); return [a, '×', b, '−', rand(2, Math.max(3, a * b - 5))]; },
    function () { var c = rand(2, 9), b = c * rand(4, 30), a = b / c + tens(3, 50); return [a, '−', b, ':', c]; },
    function () { var c = rand(2, 9), b = c * rand(4, 30); return [tens(10, 80), '+', b, ':', c]; },
    function () { var b = rand(2, 9), a = b * rand(6, 30); return [a, ':', b, '+', tens(5, 60)]; },
    function () { var b = rand(2, 9), q = rand(6, 40), a = b * q; return [a, ':', b, '−', rand(2, q - 1)]; },
    function () { return [rand(12, 40) * 5, '×', rand(2, 4), '+', rand(12, 40), '×', 5]; },
    function () { var a = rand(4, 12) * 10, b = rand(4, 9), c = rand(4, 9), d = rand(2, 3); return [a, '×', b, '−', c * 10, '×', d]; },
    function () { var b = 90, x = rand(3, 9), y = rand(3, 9); return [b * x, ':', b, '+', 50 * y, ':', 50]; },
    function () { var d1 = pick([2, 3, 4, 5, 6]), d2 = pick([2, 3, 4, 5, 6]), q1 = rand(20, 60), q2 = rand(5, q1 - 5); return [d1 * q1, ':', d1, '−', d2 * q2, ':', d2]; },
    function () { var b = rand(3, 9), c = rand(2, 9); return [tens(20, 90), '+', tens(2, 9), '×', b, '−', c * 10]; },
    function () { var b = rand(2, 9), c = rand(2, 9); return [b * rand(6, 30), ':', b, '×', c, '+', tens(10, 90)]; }
  ];
  /* шаблоны со скобками */
  var T_BR = [
    function () { return ['(', tens(5, 30), '+', tens(3, 30), ')', '×', rand(2, 9)]; },
    function () { var a = tens(10, 60); return ['(', a, '−', tens(2, a / 10 - 1), ')', '×', rand(2, 9)]; },
    function () { return [rand(3, 9), '×', '(', rand(12, 60), '+', rand(12, 60), ')']; },
    function () { var b = tens(50, 99); return [rand(3, 9) * 5, '×', '(', b * 10, '−', rand(1, 9) * 100, ')']; },
    function () { var c = pick([2, 3, 4, 5, 6, 8]), t = c * rand(20, 90), a = tens(2, t / 10 - 1); if (a >= t) a = 10; return ['(', a, '+', t - a, ')', ':', c]; },
    function () { var c = pick([2, 3, 4, 5, 6]), t = c * rand(20, 90), a = t + tens(3, 30); return ['(', a, '−', a - t, ')', ':', c]; },
    function () { var q = rand(2, 9), t = rand(12, 40), a = t * q, b = rand(2, t - 1); return [a, ':', '(', b, '+', t - b, ')']; },
    function () { var t = rand(3, 9), b = rand(100, 300), q = rand(3, 25); return [t * q, ':', '(', b, '−', b - t, ')']; },
    function () { var a = tens(50, 99), b = tens(3, 20), c = tens(3, 20); return [a, '−', '(', b, '+', c, ')']; },
    function () { var a = tens(50, 99), c = tens(3, 20), b = c + tens(3, 20); return [a, '+', '(', b, '−', c, ')']; },
    function () { var a = tens(50, 99), c = tens(3, 20), b = c + tens(3, 20); return [a, '−', '(', b, '−', c, ')']; },
    function () { var c = rand(2, 9), t = c * rand(10, 40), b = rand(2, t - 1); return ['(', b, '+', t - b, ')', ':', c, '+', tens(5, 60)]; },
    function () { var a = tens(5, 30); return [rand(3, 9), '×', '(', a, '+', tens(3, 20), ')', '−', tens(3, 20)]; },
    function () { var a = rand(3, 9); return ['(', tens(40, 90), '−', tens(3, 30), ')', '×', a, '+', tens(3, 50)]; },
    function () { var c = rand(2, 9), t = c * rand(5, 20), b = rand(2, t - 1); return ['(', b, '+', t - b, ')', ':', c, '×', rand(2, 9)]; },
    function () { return ['(', tens(20, 60), '+', tens(10, 40), ')', '×', rand(2, 9), ':', 10]; }
  ];

  function buildTokens(list, tries) {
    var g = 0, tk, ev;
    do { tk = pick(list)(); ev = R.evalSteps(tk); g++; } while (g < (tries || 80) && (!ev.ok || ev.value <= 0 || ev.value > 200000 || tk.some(function (t) { return typeof t === 'number' && (t <= 0 || t > 1000000); })));
    return { tokens: tk, ev: ev };
  }
  function hasOps(tk, set) { return tk.some(function (t) { return set.indexOf(t) >= 0; }); }
  function orderExplain(tk, ev) {
    return steps(ev.steps.map(function (s) { return s.text; }), num(ev.value)) + '<br><span class="ex">' + R.exprText(tk) + ' = ' + fmt(ev.value) + '</span>';
  }
  function orderHint(tk) {
    if (tk.indexOf('(') >= 0) return 'Сначала выполни действия в скобках. Потом — умножение и деление, затем сложение и вычитание (слева направо).';
    var hi = hasOps(tk, ['×', ':']), lo = hasOps(tk, ['+', '−']);
    return hi && lo ? 'Сначала умножение и деление (слева направо), потом сложение и вычитание.' : 'Действия одной ступени выполняй по порядку, слева направо.';
  }

  /* o.level: 'same' (действия одной ступени), 'mix' (разных ступеней), 'any' */
  gens.orderNoBr = function (o) {
    o = o || {};
    var lvl = o.level || 'any', list = lvl === 'same' ? T_SAME : lvl === 'mix' ? T_MIX : T_SAME.concat(T_MIX, T_MIX);
    var b = buildTokens(list);
    return { kind: 'num', html: 'Найди значение выражения: ' + expr(R.exprText(b.tokens)), answer: b.ev.value, hint: orderHint(b.tokens), explain: orderExplain(b.tokens, b.ev) };
  };
  gens.orderBr = function (o) {
    var b = buildTokens(T_BR);
    return { kind: 'num', html: 'Найди значение выражения: ' + expr(R.exprText(b.tokens)), answer: b.ev.value, hint: orderHint(b.tokens), explain: orderExplain(b.tokens, b.ev) };
  };

  var OPNAMES = ['Сложение', 'Вычитание', 'Умножение', 'Деление'], OPSIGN = ['+', '−', '×', ':'];
  gens.orderFirst = function (o) {
    o = o || {};
    var list = o.br ? T_BR.concat(T_MIX) : T_MIX, b, g = 0, ops;
    do { b = buildTokens(list); ops = {}; b.ev.steps.forEach(function (s) { ops[s.op] = 1; }); g++; } while (g < 30 && Object.keys(ops).length < 2);
    var ask = pick(['first', 'last']), st = b.ev.steps, t = ask === 'first' ? st[0] : st[st.length - 1];
    var idx = OPSIGN.indexOf(t.op);
    return {
      kind: 'choice',
      html: 'Какое действие в выражении ' + expr(R.exprText(b.tokens)) + ' выполняется <b>' + (ask === 'first' ? 'первым' : 'последним') + '</b>?',
      options: OPNAMES, answer: idx, wide: false,
      hint: orderHint(b.tokens),
      explain: 'Порядок действий: ' + st.map(function (s, i) { return (i + 1) + ') ' + s.text; }).join('; ') + '. ' +
        (ask === 'first' ? 'Первым выполняется ' : 'Последним выполняется ') + OPNAMES[idx].toLowerCase().replace('ение', 'ение') + ' (' + t.text + ').'
    };
  };

  /* где поставить скобки: a ∘ b ∘ c */
  gens.bracketsPlace = function () {
    var g = 0, a, b, c, o1, o2, v1, v2, tk1, tk2;
    do {
      a = rand(2, 9) * 10; b = rand(2, 9); c = rand(2, 9);
      o1 = pick(['+', '−']); o2 = pick(['×', ':']);
      if (o2 === ':') { b = c * rand(2, 9); }
      tk1 = ['(', a, o1, b, ')', o2, c]; tk2 = [a, o1, '(', b, o2, c, ')'];
      var e1 = R.evalSteps(tk1), e2 = R.evalSteps(tk2);
      v1 = e1.value; v2 = e2.value;
      g++;
    } while (g < 60 && (!e1.ok || !e2.ok || v1 === v2 || (o1 === '−' && a <= b)));
    var useFirst = Math.random() < 0.5, target = useFirst ? v1 : v2;
    var opts = [R.exprText(tk1), R.exprText(tk2)];
    var plain = [a, o1, b, o2, c], ep = R.evalSteps(plain);
    if (ep.ok && ep.value === target) return gens.bracketsPlace();
    return {
      kind: 'choice',
      html: 'Как надо поставить скобки, чтобы равенство было верным?<br>' + expr(a + NB + o1 + NB + b + NB + o2 + NB + c + ' = ' + target),
      options: opts, answer: useFirst ? 0 : 1, wide: true,
      hint: 'Проверь оба варианта: сосчитай значение выражения с каждой расстановкой скобок.',
      explain: R.exprText(tk1) + ' = ' + fmt(v1) + '; ' + R.exprText(tk2) + ' = ' + fmt(v2) + '. Нужный результат ' + fmt(target) + ' даёт ' + R.exprText(useFirst ? tk1 : tk2) + '.'
    };
  };

  /* ================= задачи ================= */

  /* было + на … больше + на … больше (цепочка сложений) */
  gens.pSumChain = function () {
    var ctx = pick([0, 1, 2]), A = rand(200, 950), B = rand(50, 480), C = rand(80, 900), X = A + B, Y = X + C, text, l1, l2, tot = A + X + Y;
    if (ctx === 0) {
      text = 'В город за неделю доставили ' + fmt(A) + ' т слив, груш — на ' + fmt(B) + ' т больше, чем слив, а яблок — на ' + fmt(C) + ' т больше, чем груш. Сколько всего тонн фруктов доставили в город?';
      l1 = ['Сколько тонн груш? ' + fmt(A) + ' + ' + fmt(B) + ' = ' + fmt(X), 'Сколько тонн яблок? ' + fmt(X) + ' + ' + fmt(C) + ' = ' + fmt(Y)];
    } else if (ctx === 1) {
      text = 'В первый день турист прошёл ' + fmt(A) + ' км, во второй — на ' + fmt(B) + ' км больше, чем в первый, а в третий — на ' + fmt(C) + ' км больше, чем во второй. Сколько километров он прошёл за три дня?';
      l1 = ['Сколько километров прошёл во второй день? ' + fmt(A) + ' + ' + fmt(B) + ' = ' + fmt(X), 'Сколько километров прошёл в третий день? ' + fmt(X) + ' + ' + fmt(C) + ' = ' + fmt(Y)];
    } else {
      text = 'На склад привезли ' + fmt(A) + ' ц картофеля, моркови — на ' + fmt(B) + ' ц больше, чем картофеля, а свёклы — на ' + fmt(C) + ' ц больше, чем моркови. Сколько центнеров овощей привезли на склад?';
      l1 = ['Сколько центнеров моркови? ' + fmt(A) + ' + ' + fmt(B) + ' = ' + fmt(X), 'Сколько центнеров свёклы? ' + fmt(X) + ' + ' + fmt(C) + ' = ' + fmt(Y)];
    }
    l2 = ['Сколько всего? ' + fmt(A) + ' + ' + fmt(X) + ' + ' + fmt(Y) + ' = ' + fmt(tot)];
    return {
      kind: 'num', html: text, answer: tot,
      hint: 'Сначала найди, сколько во втором случае («на … больше» — прибавляем), потом в третьем, и сложи всё.',
      explain: steps(l1.concat(l2), fmt(tot))
    };
  };

  /* две покупки: n по p + m по q */
  gens.pBuy2 = function () {
    var ctx = pick([0, 1, 2]), n = rand(12, 60), m = rand(10, 45), p, q, text, ans, l;
    if (ctx === 0) {
      p = tens(10, 90); q = tens(10, 60);
      text = 'Строительная фирма купила ' + unit(n, ['банку', 'банки', 'банок']) + ' с краской по ' + fmt(p) + ' руб. и ' + unit(m, ['мешок', 'мешка', 'мешков']) + ' шпаклёвки по ' + fmt(q) + ' руб. Сколько всего рублей заплатила фирма?';
      l = ['Сколько стоит краска? ' + fmt(n) + ' × ' + fmt(p) + ' = ' + fmt(n * p), 'Сколько стоит шпаклёвка? ' + fmt(m) + ' × ' + fmt(q) + ' = ' + fmt(m * q)];
    } else if (ctx === 1) {
      p = rand(12, 48); q = rand(12, 48);
      text = 'В магазин привезли ' + unit(n, ['ящик', 'ящика', 'ящиков']) + ' яблок по ' + p + ' кг и ' + unit(m, ['ящик', 'ящика', 'ящиков']) + ' груш по ' + q + ' кг. Сколько всего килограммов фруктов привезли?';
      l = ['Сколько килограммов яблок? ' + fmt(n) + ' × ' + p + ' = ' + fmt(n * p), 'Сколько килограммов груш? ' + fmt(m) + ' × ' + q + ' = ' + fmt(m * q)];
    } else {
      p = tens(5, 30); q = rand(6, 20) * 5;
      text = 'Школа купила ' + unit(n, ['учебник', 'учебника', 'учебников']) + ' по ' + fmt(p) + ' руб. и ' + unit(m, ['комплект', 'комплекта', 'комплектов']) + ' тетрадей по ' + fmt(q) + ' руб. Сколько рублей заплатила школа?';
      l = ['Сколько стоят учебники? ' + fmt(n) + ' × ' + fmt(p) + ' = ' + fmt(n * p), 'Сколько стоят тетради? ' + fmt(m) + ' × ' + fmt(q) + ' = ' + fmt(m * q)];
    }
    ans = n * p + m * q; l.push('Сколько всего? ' + fmt(n * p) + ' + ' + fmt(m * q) + ' = ' + fmt(ans));
    return { kind: 'num', html: text, answer: ans, hint: 'Сначала узнай стоимость (массу) каждой части, потом сложи.', explain: steps(l, fmt(ans)) };
  };

  /* три группы работников */
  gens.pFarm = function () {
    var T = rand(10, 30) * 10, n1 = rand(2, 9) * 10 + rand(0, 9), n2 = rand(2, 9) * 10 + rand(0, 9), k1 = rand(5, 12) * 10, k2 = rand(4, 10) * 10, k3 = rand(4, 9) * 10 + 5, rest;
    while (n1 + n2 >= T - 10) { n1 = Math.floor(n1 / 2); n2 = Math.floor(n2 / 2); }
    rest = T - n1 - n2;
    var ctx = pick([0, 1]), thing = ctx ? 'картофеля' : 'хлопка', verb = ctx ? 'выкопали' : 'собрали', text;
    text = 'На уборке ' + thing + ' работают ' + T + ' человек. За день ' + n1 + ' человек ' + verb + ' по ' + k1 + ' кг, ' + n2 + ' человек — по ' + k2 + ' кг, а остальные — по ' + k3 + ' кг. Сколько всего килограммов ' + thing + ' ' + verb + ' за день все работники?';
    var ans = n1 * k1 + n2 * k2 + rest * k3;
    return {
      kind: 'num', html: text, answer: ans,
      hint: 'Сначала узнай, сколько человек в третьей группе: из общего числа вычти две другие группы.',
      explain: steps(['Сколько человек в третьей группе? ' + T + ' − ' + n1 + ' − ' + n2 + ' = ' + rest,
        'Первая группа: ' + n1 + ' × ' + k1 + ' = ' + fmt(n1 * k1), 'Вторая группа: ' + n2 + ' × ' + k2 + ' = ' + fmt(n2 * k2),
        'Третья группа: ' + rest + ' × ' + k3 + ' = ' + fmt(rest * k3),
        'Всего: ' + fmt(n1 * k1) + ' + ' + fmt(n2 * k2) + ' + ' + fmt(rest * k3) + ' = ' + fmt(ans)], fmt(ans))
    };
  };

  /* сколько мест в зале */
  gens.pGroups = function () {
    var D = rand(3, 9), E = rand(2, 5), seats = rand(20, 80) * 5, S = D * E * seats, ctx = pick([0, 1, 2]), text;
    if (ctx === 0) text = 'За ' + unit(D, ['день', 'дня', 'дней']) + ' в кинотеатре фильм посмотрели ' + fmt(S) + ' зрителей. Ежедневно было по ' + E + ' ' + R.plural(E, ['сеансу', 'сеанса', 'сеансов']) + ', и на каждом были заняты все места. На сколько мест рассчитан зал?';
    else if (ctx === 1) text = 'За ' + unit(D, ['день', 'дня', 'дней']) + ' спектакль посмотрели ' + fmt(S) + ' зрителей. Каждый день было по ' + E + ' ' + R.plural(E, ['показу', 'показа', 'показов']) + ', и зал был полон. Сколько мест в зале?';
    else text = 'Цирковое представление за ' + unit(D, ['день', 'дня', 'дней']) + ' посмотрели ' + fmt(S) + ' зрителей. Ежедневно давали по ' + E + ' ' + R.plural(E, ['представлению', 'представления', 'представлений']) + ', и всё время были заняты все места. Сколько мест в цирке?';
    return {
      kind: 'num', html: text, answer: seats,
      hint: 'Сначала узнай, сколько было показов за все дни, потом раздели число зрителей на число показов.',
      explain: steps(['Сколько было показов? ' + D + ' × ' + E + ' = ' + (D * E), 'Сколько мест в зале? ' + fmt(S) + ' : ' + (D * E) + ' = ' + fmt(seats)], fmt(seats))
    };
  };

  /* во сколько раз скорость больше */
  gens.pSpeedRatio = function () {
    var v1 = rand(4, 9) * 10, a = rand(3, 12), k = rand(4, 12), v2 = v1 * k, c = rand(2, 7), b = v1 * a, d = v2 * c;
    return {
      kind: 'num', html: 'Поезд за ' + unit(a, ['час', 'часа', 'часов']) + ' прошёл ' + fmt(b) + ' км, а самолёт за ' + unit(c, ['час', 'часа', 'часов']) + ' пролетел ' + fmt(d) + ' км. Во сколько раз скорость самолёта больше скорости поезда?',
      answer: k,
      hint: 'Скорость — это расстояние, делённое на время. Найди скорости и раздели большую на меньшую.',
      explain: steps(['Скорость поезда: ' + fmt(b) + ' : ' + a + ' = ' + v1 + ' км/ч', 'Скорость самолёта: ' + fmt(d) + ' : ' + c + ' = ' + fmt(v2) + ' км/ч', 'Во сколько раз больше? ' + fmt(v2) + ' : ' + v1 + ' = ' + k], k)
    };
  };

  /* в n таких — всего A, сколько в m таких */
  gens.pUnitValue = function () {
    var ctx = pick([0, 1, 2]), n = rand(3, 9), m = rand(10, 30), u, A, text, unitName, thing;
    if (ctx === 0) { u = rand(15, 40) * 10; A = n * u; text = 'В ' + n + ' одинаковых стаканах ' + fmt(A) + ' г воды. Сколько граммов воды в ' + m + ' таких стаканах?'; }
    else if (ctx === 1) { u = rand(8, 60); A = n * u; text = 'В ' + n + ' одинаковых мешках ' + fmt(A) + ' кг муки. Сколько килограммов муки в ' + m + ' таких мешках?'; }
    else { u = rand(12, 48); A = n * u; text = 'В ' + n + ' одинаковых коробках ' + fmt(A) + ' карандашей. Сколько карандашей в ' + m + ' таких коробках?'; }
    return {
      kind: 'num', html: text, answer: u * m,
      hint: 'Сначала узнай, сколько в одном (стакане, мешке, коробке).',
      explain: steps(['Сколько в одном? ' + fmt(A) + ' : ' + n + ' = ' + fmt(u), 'Сколько в ' + m + ' таких? ' + fmt(u) + ' × ' + m + ' = ' + fmt(u * m)], fmt(u * m))
    };
  };

  /* поделили покупку между двумя */
  gens.pSplitPay = function () {
    var n1 = rand(3, 9), n2 = rand(3, 9), pr = rand(9, 60) * 5, tot = (n1 + n2) * pr, ctx = pick([0, 1]);
    while (n1 === n2) n2 = rand(3, 9), tot = (n1 + n2) * pr;
    var text = ctx === 0
      ? 'Две хозяйки купили одинаковые тарелки, всего на ' + fmt(tot) + ' руб. Первая взяла ' + n1 + ' ' + R.plural(n1, ['тарелку', 'тарелки', 'тарелок']) + ', а вторая — ' + n2 + '. Сколько рублей должна заплатить каждая?'
      : 'Двое ребят купили одинаковые блокноты, всего на ' + fmt(tot) + ' руб. Первый взял ' + n1 + ' ' + R.plural(n1, ['блокнот', 'блокнота', 'блокнотов']) + ', а второй — ' + n2 + '. Сколько рублей должен заплатить каждый?';
    return {
      kind: 'nums', html: text, fields: [{ label: 'первый, руб.' }, { label: 'второй, руб.' }], answer: [n1 * pr, n2 * pr],
      hint: 'Узнай, сколько всего куплено штук, потом найди цену одной штуки.',
      explain: steps(['Сколько всего куплено? ' + n1 + ' + ' + n2 + ' = ' + (n1 + n2), 'Сколько стоит одна? ' + fmt(tot) + ' : ' + (n1 + n2) + ' = ' + fmt(pr), 'Первому: ' + n1 + ' × ' + fmt(pr) + ' = ' + fmt(n1 * pr) + '; второму: ' + n2 + ' × ' + fmt(pr) + ' = ' + fmt(n2 * pr)], fmt(n1 * pr) + ' и ' + fmt(n2 * pr))
    };
  };

  /* сколько было тех и других машин */
  gens.pFuel = function () {
    var g = 0, k, q, lCnt, L, total, p, gCnt, ds;
    do {
      q = pick([10, 15, 20, 25, 30, 40]); lCnt = rand(4, 30); k = rand(3, 9); L = lCnt * q; total = L * k;
      ds = divisors(total, 15, 80).filter(function (x) { return x % 5 === 0 && total / x >= 5 && total / x <= 90; });
      g++;
    } while (ds.length === 0 && g < 200);
    p = ds.length ? pick(ds) : 25; gCnt = total / p;
    return {
      kind: 'nums',
      html: 'В транспортной компании грузовые машины израсходовали за день ' + fmt(total) + ' л бензина, а легковые — в ' + k + ' ' + R.plural(k, ['раз', 'раза', 'раз']) + ' меньше. Грузовая машина расходовала в день ' + p + ' л, а легковая — ' + q + ' л. Сколько было грузовых и сколько легковых машин?',
      fields: [{ label: 'грузовых' }, { label: 'легковых' }], answer: [gCnt, lCnt],
      hint: 'Узнай, сколько бензина израсходовали легковые машины, потом раздели расход на расход одной машины.',
      explain: steps(['Сколько литров израсходовали легковые? ' + fmt(total) + ' : ' + k + ' = ' + fmt(L), 'Сколько грузовых машин? ' + fmt(total) + ' : ' + p + ' = ' + gCnt, 'Сколько легковых машин? ' + fmt(L) + ' : ' + q + ' = ' + lCnt], gCnt + ' грузовых и ' + lCnt + ' легковых')
    };
  };

  /* на нескольких станках за несколько часов */
  gens.pMachines = function () {
    var M = rand(2, 5), H = rand(4, 12), rate = rand(5, 90) * 10, T = M * H * rate, ctx = pick([0, 1, 2]), what = ['торфоперегнойных горшочков', 'деталей', 'кирпичей'][ctx], stan = 'станках';
    return {
      kind: 'num',
      html: 'На ' + M + ' одинаковых ' + stan + ' за ' + unit(H, ['час', 'часа', 'часов']) + ' можно изготовить ' + fmt(T) + ' ' + what + '. Сколько ' + what + ' можно изготовить на одном станке за 1 час?',
      answer: rate,
      hint: 'Можно найти, сколько делает один станок за все часы, а потом — за один час.',
      explain: steps(['Сколько делает один станок за ' + H + ' ч? ' + fmt(T) + ' : ' + M + ' = ' + fmt(T / M), 'Сколько за 1 час? ' + fmt(T / M) + ' : ' + H + ' = ' + fmt(rate)], fmt(rate))
    };
  };

  /* ---------- задачи «в одно выражение» ---------- */
  function exprProblem(br) {
    var list = [], v, a, b, p, q, n, m, k;
    if (!br) {
      list.push(function () {
        n = rand(3, 9); p = rand(6, 30); q = rand(12, 60);
        return { text: 'Ученик купил ' + unit(n, ['тетрадь', 'тетради', 'тетрадей']) + ' по ' + p + ' руб. каждая и ручку за ' + q + ' руб. Сколько стоила вся покупка?', tokens: [n, '×', p, '+', q] };
      });
      list.push(function () {
        var n1 = rand(4, 9), k1 = rand(10, 24), n2 = rand(3, 8), k2 = rand(10, 24);
        return { text: 'В зале кинотеатра ' + unit(n1, ['ряд', 'ряда', 'рядов']) + ' по ' + k1 + ' мест и ' + unit(n2, ['ряд', 'ряда', 'рядов']) + ' по ' + k2 + ' мест. Сколько всего мест в зале?', tokens: [n1, '×', k1, '+', n2, '×', k2] };
      });
      list.push(function () {
        var a1 = rand(2, 6), b1 = a1 + rand(1, 5); v = rand(4, 12) * 5;
        return { text: 'Поезд за ' + unit(a1, ['час', 'часа', 'часов']) + ' прошёл ' + (v * a1) + ' км. Сколько километров он пройдёт за ' + unit(b1, ['час', 'часа', 'часов']) + ', если будет идти с той же скоростью?', tokens: [v * a1, ':', a1, '×', b1] };
      });
      list.push(function () {
        var k1 = rand(3, 6), k2 = rand(3, 6), c1 = rand(20, 45), c2 = rand(8, c1 - 3);
        return { text: k1 + ' ' + R.plural(k1, ['шоколадка стоит', 'шоколадки стоят', 'шоколадок стоят']) + ' ' + (k1 * c1) + ' руб., а ' + k2 + ' ' + R.plural(k2, ['булочка стоит', 'булочки стоят', 'булочек стоят']) + ' ' + (k2 * c2) + ' руб. На сколько рублей шоколадка дороже булочки?', tokens: [k1 * c1, ':', k1, '−', k2 * c2, ':', k2] };
      });
      list.push(function () {
        n = rand(4, 9); p = rand(12, 40); m = rand(3, 8);
        return { text: 'В магазине было ' + fmt(n * 100) + ' кг яблок. За день продали ' + unit(m, ['мешок', 'мешка', 'мешков']) + ' по ' + p + ' кг. Сколько килограммов яблок осталось?', tokens: [n * 100, '−', m, '×', p] };
      });
    } else {
      list.push(function () {
        n = rand(3, 8); p = rand(12, 40); q = p * n + tens(3, 30);
        var s = tens(5, 25); q = n * p + s;
        return { text: 'Ученик заплатил ' + fmt(q) + ' руб. за ' + unit(n, ['одинаковую тетрадь', 'одинаковые тетради', 'одинаковых тетрадей']) + ' и получил сдачу ' + s + ' руб. Сколько стоит одна тетрадь?', tokens: ['(', q, '−', s, ')', ':', n] };
      });
      list.push(function () {
        var n1 = rand(12, 40), n2 = rand(12, 40); p = rand(6, 25);
        return { text: 'В первой бригаде ' + n1 + ' человек, во второй — ' + n2 + '. Каждый рабочий сделал за смену по ' + p + ' деталей. Сколько деталей сделали обе бригады?', tokens: ['(', n1, '+', n2, ')', '×', p] };
      });
      list.push(function () {
        k = rand(3, 8); var t = k * rand(12, 40), x = rand(2, t - 1) * 1;
        return { text: 'В магазин привезли ' + fmt(x * 10) + ' кг яблок и ' + fmt((t - x) * 10) + ' кг груш. Всё разложили в пакеты по ' + (k * 10) + ' кг. Сколько получилось пакетов?', tokens: ['(', x * 10, '+', (t - x) * 10, ')', ':', k * 10] };
      });
      list.push(function () {
        n = rand(3, 8); p = rand(12, 40); var d = rand(2, 9) * 10; var tot = n * p + d;
        return { text: 'Мама дала сыну ' + fmt(tot) + ' руб. Он купил ' + unit(n, ['билет', 'билета', 'билетов']) + ' по ' + p + ' руб. Сколько рублей у него осталось?', tokens: [tot, '−', n, '×', p] };
      });
      list.push(function () {
        var m1 = rand(12, 32), p1 = rand(2, 9), p2 = rand(2, 9);
        return { text: 'На каждого из ' + m1 + ' учеников выдали по ' + unit(p1, ['карандашу', 'карандаша', 'карандашей']) + ' и по ' + unit(p2, ['ручке', 'ручки', 'ручек']) + '. Сколько всего предметов выдали?', tokens: [m1, '×', '(', p1, '+', p2, ')'] };
      });
    }
    var g = 0, t, ev;
    do { t = pick(list)(); ev = R.evalSteps(t.tokens); g++; } while (g < 60 && (!ev.ok || ev.value <= 0));
    return { text: t.text, tokens: t.tokens, ev: ev };
  }

  gens.pExpr = function (o) {
    o = o || {};
    var e = exprProblem(!!o.br);
    return {
      kind: 'num', html: e.text + '<br><span class="soft">Запиши решение выражением и найди ответ.</span>', answer: e.ev.value,
      hint: 'Подумай, какие действия нужны и в каком порядке. Если нужно сначала сложить (вычесть), а потом умножить (разделить), понадобятся скобки.',
      explain: 'Выражение: <span class="ex">' + R.exprText(e.tokens) + '</span><br>' + steps(e.ev.steps.map(function (s) { return s.text; }), fmt(e.ev.value))
    };
  };

  /* какое выражение решает задачу */
  gens.pExprChoice = function (o) {
    o = o || {};
    var e = exprProblem(!!o.br), right = R.exprText(e.tokens), cands = [], g = 0, ops = ['+', '−', '×', ':'];
    while (cands.length < 8 && g++ < 80) {
      var tk = e.tokens.slice(), idxs = [];
      tk.forEach(function (t, i) { if (ops.indexOf(t) >= 0) idxs.push(i); });
      var i = pick(idxs), old = tk[i], nw;
      do { nw = pick(ops); } while (nw === old);
      tk[i] = nw;
      var ev = R.evalSteps(tk);
      if (ev.ok && ev.value > 0 && ev.value !== e.ev.value) cands.push(R.exprText(tk));
      if (e.tokens.indexOf('(') >= 0 && Math.random() < 0.4) {
        var t2 = e.tokens.filter(function (x) { return x !== '(' && x !== ')'; }), ev2 = R.evalSteps(t2);
        if (ev2.ok && ev2.value > 0 && ev2.value !== e.ev.value) cands.push(R.exprText(t2));
      }
    }
    var wrong = distinctOptions(right, cands, 3);
    if (wrong.length < 3) return gens.pExprChoice(o);
    var opts = shuffle([right].concat(wrong));
    return {
      kind: 'choice', html: e.text + '<br><span class="soft">Какое выражение решает задачу?</span>', options: opts, answer: opts.indexOf(right), wide: true,
      hint: 'Реши задачу по действиям, а потом запиши все действия одним выражением.',
      explain: 'Правильное выражение: <span class="ex">' + right + '</span> = ' + fmt(e.ev.value) + '.<br>' + e.ev.steps.map(function (s, i) { return (i + 1) + ') ' + s.text; }).join('<br>')
    };
  };

  /* поезд: путь, потом изменил скорость */
  gens.pTrainSpeed = function () {
    var ctx = pick([0, 1, 2]), v = rand(4, 15) * 5, H = rand(3, 12), T = rand(3, 9), C = rand(1, 4) * 5, dec = Math.random() < 0.3, D = v * H;
    if (dec && v - C < 10) dec = false;
    var v2 = dec ? v - C : v + C, total = D + v2 * T;
    var who = ['Поезд', 'Автобус', 'Теплоход'][ctx], w = ['прошёл', 'прошёл', 'прошёл'][ctx], verb = dec ? 'уменьшил' : 'увеличил';
    var text = who + ' ' + w + ' ' + fmt(D) + ' км за ' + unit(H, ['час', 'часа', 'часов']) + '. Затем ' + who.toLowerCase() + ' ' + verb + ' скорость на ' + C + ' км в час и ещё ' + unit(T, ['час', 'часа', 'часов']) + ' шёл с новой скоростью. Сколько всего километров прошёл ' + who.toLowerCase() + '?';
    var tk = [D, '+', '(', D, ':', H, dec ? '−' : '+', C, ')', '×', T];
    return {
      kind: 'num', html: text, answer: total,
      hint: 'Сначала узнай скорость в начале пути, потом — новую скорость и путь с ней.',
      explain: steps(['Первоначальная скорость: ' + fmt(D) + ' : ' + H + ' = ' + v + ' км/ч', 'Новая скорость: ' + v + (dec ? ' − ' : ' + ') + C + ' = ' + v2 + ' км/ч',
        'Путь с новой скоростью: ' + v2 + ' × ' + T + ' = ' + fmt(v2 * T), 'Весь путь: ' + fmt(D) + ' + ' + fmt(v2 * T) + ' = ' + fmt(total)], fmt(total)) + '<br>Одним выражением: <span class="ex">' + R.exprText(tk) + ' = ' + fmt(total) + '</span>'
    };
  };

  /* сначала по r1 в день k дней, потом по r2: за сколько дней */
  gens.pTwoRates = function () {
    var ctx = pick([0, 1, 2]), k = rand(3, 6), r1 = rand(3, 9) * 60 + rand(0, 9) * 5, r2 = rand(30, 90) * 10 / 10 + rand(4, 9) * 10, m = rand(3, 9), first, total, text;
    if (ctx === 0) {
      r1 = rand(40, 90) * 5 + rand(0, 4) * 5; r2 = rand(50, 95) * 5 + rand(0, 4) * 5 + 3; first = k * r1; total = first + m * r2;
      text = 'Путешественники должны были проехать ' + fmt(total) + ' км. В первые ' + k + ' ' + R.plural(k, ['день', 'дня', 'дней']) + ' они проезжали по ' + r1 + ' км в день, а потом стали проезжать по ' + r2 + ' км. За сколько дней путешественники проехали весь путь?';
    } else if (ctx === 1) {
      r1 = rand(60, 130) * 5; r2 = rand(80, 160) * 5 + 3; first = k * r1; total = first + m * r2;
      text = 'В городе родилось ' + fmt(total) + ' малышей. В первые ' + k + ' месяцев рождалось по ' + r1 + ' малышей в месяц, а потом — по ' + r2 + ' ежемесячно. За сколько месяцев родилось столько малышей?';
    } else {
      r1 = rand(12, 30) * 5; r2 = rand(15, 40) * 5 + 2; first = k * r1; total = first + m * r2;
      text = 'В книге ' + fmt(total) + ' страниц. Первые ' + k + ' ' + R.plural(k, ['день', 'дня', 'дней']) + ' Оля читала по ' + r1 + ' страниц, а потом стала читать по ' + r2 + ' страниц в день. За сколько дней она прочитала всю книгу?';
    }
    var unitWord = ctx === 1 ? 'месяцев' : 'дней';
    return {
      kind: 'num', html: text, answer: k + m,
      hint: 'Сначала узнай, сколько прошли (прочитали, родилось) за первые дни, потом — сколько осталось и за сколько дней это будет с новой скоростью.',
      explain: steps(['Сколько было за первые ' + k + ' ' + (ctx === 1 ? 'месяцев' : 'дней') + '? ' + k + ' × ' + r1 + ' = ' + fmt(first), 'Сколько осталось? ' + fmt(total) + ' − ' + fmt(first) + ' = ' + fmt(total - first),
        'За сколько ' + unitWord + ' по ' + r2 + '? ' + fmt(total - first) + ' : ' + r2 + ' = ' + m, 'Всего: ' + k + ' + ' + m + ' = ' + (k + m)], k + m)
    };
  };

  /* ================= меры длины и веса ================= */
  var LEN = [['км', 'м', 1000], ['м', 'дм', 10], ['м', 'см', 100], ['дм', 'см', 10], ['см', 'мм', 10], ['м', 'мм', 1000], ['дм', 'мм', 100]];
  var WT = [['т', 'ц', 10], ['т', 'кг', 1000], ['ц', 'кг', 100], ['кг', 'г', 1000]];
  var UNIT_FACT = { 'км': '1 км = 1 000 м', 'м-дм': '1 м = 10 дм', 'м-см': '1 м = 100 см', 'дм-см': '1 дм = 10 см', 'см-мм': '1 см = 10 мм', 'м-мм': '1 м = 1 000 мм', 'дм-мм': '1 дм = 100 мм',
    'т-ц': '1 т = 10 ц', 'т-кг': '1 т = 1 000 кг', 'ц-кг': '1 ц = 100 кг', 'кг-г': '1 кг = 1 000 г' };
  function pairOf(o) {
    o = o || {};
    var all = o.kind === 'len' ? LEN : o.kind === 'wt' ? WT : LEN.concat(WT);
    return pick(all);
  }
  function fact(pr) { return pr[0] === 'км' ? UNIT_FACT['км'] : UNIT_FACT[pr[0] + '-' + pr[1]]; }

  /* o.dir: 'down' (крупные в мелкие), 'up' (мелкие в крупные) */
  gens.unitConv = function (o) {
    o = o || {};
    var pr = pairOf(o), f = pr[2], dir = o.dir || pick(['down', 'up']), k = pick([2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 25, 40, 60, 70, 90]), big = k, small = k * f;
    if (dir === 'down') {
      return {
        kind: 'num', html: 'Выразите в ' + ({ 'м': 'метрах', 'дм': 'дециметрах', 'см': 'сантиметрах', 'мм': 'миллиметрах', 'ц': 'центнерах', 'кг': 'килограммах', 'г': 'граммах' })[pr[1]] + ': ' + expr(big + ' ' + pr[0] + ' = □ ' + pr[1]),
        answer: small, hint: fact(pr) + '. Крупную меру заменяем мелкой — умножаем.',
        explain: fact(pr) + '. Значит, ' + big + ' ' + pr[0] + ' = ' + big + ' × ' + fmt(f) + ' ' + pr[1] + ' = ' + fmt(small) + ' ' + pr[1] + '.'
      };
    }
    return {
      kind: 'num', html: 'Выразите в ' + ({ 'км': 'километрах', 'м': 'метрах', 'дм': 'дециметрах', 'см': 'сантиметрах', 'т': 'тоннах', 'ц': 'центнерах', 'кг': 'килограммах' })[pr[0]] + ': ' + expr(fmt(small) + ' ' + pr[1] + ' = □ ' + pr[0]),
      answer: big, hint: fact(pr) + '. Мелкую меру заменяем крупной — делим.',
      explain: fact(pr) + '. Значит, ' + fmt(small) + ' ' + pr[1] + ' = ' + fmt(small) + ' : ' + fmt(f) + ' ' + pr[0] + ' = ' + big + ' ' + pr[0] + '.'
    };
  };

  /* составные величины: 3 км 250 м ↔ 3 250 м */
  gens.unitCompound = function (o) {
    o = o || {};
    var pr = pick((o.kind === 'len' ? LEN : o.kind === 'wt' ? WT : LEN.concat(WT)).filter(function (p) { return p[2] >= 100; })), f = pr[2];
    var big = rand(2, 9), small = rand(1, f - 1);
    if (small % 5 !== 0 && Math.random() < 0.6) small = Math.max(5, Math.floor(small / 5) * 5);
    var total = big * f + small, dir = o.dir || pick(['down', 'up']);
    if (dir === 'down') {
      return {
        kind: 'num', html: 'Выразите в ' + ({ 'м': 'метрах', 'дм': 'дециметрах', 'см': 'сантиметрах', 'мм': 'миллиметрах', 'ц': 'центнерах', 'кг': 'килограммах', 'г': 'граммах' })[pr[1]] + ': ' + expr(big + ' ' + pr[0] + ' ' + small + ' ' + pr[1] + ' = □ ' + pr[1]),
        answer: total, hint: fact(pr) + '. Сначала переведи крупные меры в мелкие, потом прибавь остаток.',
        explain: fact(pr) + '. ' + big + ' ' + pr[0] + ' = ' + fmt(big * f) + ' ' + pr[1] + ', и ещё ' + small + ' ' + pr[1] + ': ' + fmt(big * f) + ' + ' + small + ' = ' + fmt(total) + ' ' + pr[1] + '.'
      };
    }
    return {
      kind: 'nums', html: 'Выразите в двух мерах: ' + expr(fmt(total) + ' ' + pr[1] + ' = □ ' + pr[0] + ' □ ' + pr[1]), fields: [{ label: pr[0] }, { label: pr[1] }],
      answer: [big, small], hint: fact(pr) + '. Раздели число на ' + fmt(f) + ': частное — крупные меры, остаток — мелкие.',
      explain: fact(pr) + '. ' + fmt(total) + ' : ' + fmt(f) + ' = ' + big + ' (ост. ' + small + '). Значит, ' + fmt(total) + ' ' + pr[1] + ' = ' + big + ' ' + pr[0] + ' ' + small + ' ' + pr[1] + '.'
    };
  };

  gens.unitCompare = function (o) {
    o = o || {};
    var pr = pick((o.kind === 'wt' ? WT : LEN).filter(function (p) { return p[2] >= 100; })), f = pr[2], big = rand(2, 9), small = rand(1, 9) * (f / 10), total = big * f + small;
    var delta = pick([0, 0, small, -small, f / 10 * pick([1, -1, 2])]), other = total + delta;
    if (other <= 0) other = total + f / 10;
    var idx = total < other ? 0 : total === other ? 1 : 2, ops = ['<', '=', '>'];
    return {
      kind: 'choice', html: 'Сравни: ' + expr(big + ' ' + pr[0] + ' ' + small + ' ' + pr[1] + ' … ' + fmt(other) + ' ' + pr[1]), options: ops, answer: idx, wide: false,
      hint: 'Выразите обе величины в одинаковых мерах.',
      explain: fact(pr) + '. ' + big + ' ' + pr[0] + ' ' + small + ' ' + pr[1] + ' = ' + fmt(total) + ' ' + pr[1] + '. Сравниваем ' + fmt(total) + ' и ' + fmt(other) + ': ' + fmt(total) + ' ' + ops[idx] + ' ' + fmt(other) + '.'
    };
  };

  /* задачи на меры */
  gens.pMeasures = function () {
    var ctx = pick([0, 1, 2, 3]), text, ans, st;
    if (ctx === 0) {
      var X, N;
      do { X = pick([250, 500, 200, 400, 100, 50]); N = pick([2, 3, 4, 5, 6, 8, 10, 12]); } while ((N * 1000) % X !== 0);
      ans = N * 1000 / X;
      text = 'Для перевозки ' + N + ' т зерна выделили подводы. На одной подводе везут ' + X + ' кг. Сколько подвод нужно?';
      st = ['Сколько килограммов в ' + N + ' т? ' + N + ' × 1 000 = ' + fmt(N * 1000), 'Сколько подвод? ' + fmt(N * 1000) + ' : ' + X + ' = ' + ans];
    } else if (ctx === 1) {
      var a1 = rand(2, 9), a2 = rand(1, 9) * 10 + 5 * rand(0, 1), b1 = rand(2, 9), b2 = rand(1, 9) * 10;
      ans = a1 * 100 + a2 + b1 * 100 + b2;
      text = 'Длина одной дорожки ' + a1 + ' м ' + a2 + ' см, а другой — ' + b1 + ' м ' + b2 + ' см. Сколько сантиметров в двух дорожках вместе?';
      st = ['Первая дорожка: ' + a1 + ' м ' + a2 + ' см = ' + (a1 * 100 + a2) + ' см', 'Вторая дорожка: ' + b1 + ' м ' + b2 + ' см = ' + (b1 * 100 + b2) + ' см', 'Вместе: ' + (a1 * 100 + a2) + ' + ' + (b1 * 100 + b2) + ' = ' + ans];
    } else if (ctx === 2) {
      var h = rand(2, 9), y = rand(2, 9) * 5 + rand(0, 4) * 5;
      ans = y * h * 100;
      text = 'С одного гектара поля собрали ' + y + ' ц пшеницы. Сколько килограммов пшеницы собрали со всех ' + h + ' таких гектаров? (1 ц = 100 кг)';
      st = ['Сколько центнеров с ' + h + ' га? ' + y + ' × ' + h + ' = ' + (y * h), 'Переведём в килограммы: ' + (y * h) + ' × 100 = ' + fmt(ans)];
    } else {
      var g = rand(2, 9) * 50, d = rand(6, 30);
      ans = g * d / 1000;
      while (g * d % 1000 !== 0) { g = rand(2, 9) * 50; d = rand(6, 40); ans = g * d / 1000; }
      text = 'Кошке в день дают ' + g + ' г корма. Сколько килограммов корма нужно кошке на ' + unit(d, ['день', 'дня', 'дней']) + '? (1 кг = 1 000 г)';
      st = ['Сколько граммов на ' + d + ' дней? ' + g + ' × ' + d + ' = ' + fmt(g * d), 'Переведём в килограммы: ' + fmt(g * d) + ' : 1 000 = ' + ans];
    }
    return { kind: 'num', html: text, answer: ans, hint: 'Сначала посчитай в одной мере, потом переведи в нужную.', explain: steps(st, fmt(ans)) };
  };

  /* ================= геометрия ================= */
  function svgRect(w, h, lw, lh, o) {
    o = o || {};
    var W = 260, H = 150, m = 30, sc = Math.min((W - 2 * m) / w, (H - 2 * m) / h), rw = w * sc, rh = h * sc, x = (W - rw) / 2, y = (H - rh) / 2;
    return '<svg class="fig" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="' + (o.label || 'Прямоугольник') + '">' +
      '<rect class="r" x="' + x + '" y="' + y + '" width="' + rw + '" height="' + rh + '"/>' +
      (o.right !== false ? '<path class="ra" d="M' + (x + 10) + ' ' + y + 'v10h-10"/>' : '') +
      '<text x="' + (W / 2) + '" y="' + (y - 8) + '" text-anchor="middle">' + lw + '</text>' +
      '<text x="' + (x + rw + 8) + '" y="' + (H / 2 + 5) + '" text-anchor="start">' + lh + '</text></svg>';
  }
  gens.perimSquare = function () {
    var a = rand(3, 40), u = pick(['см', 'м', 'дм']), toSide = Math.random() < 0.4, P = 4 * a;
    if (!toSide) {
      return {
        kind: 'num', html: 'Сторона квадрата ' + a + ' ' + u + '. Чему равна сумма длин всех его сторон (периметр)?<br>' + svgRect(1, 1, a + ' ' + u, a + ' ' + u, { label: 'Квадрат со стороной ' + a + ' ' + u }),
        answer: P, hint: 'У квадрата четыре равные стороны.',
        explain: 'Сторон четыре, все равны: ' + a + ' + ' + a + ' + ' + a + ' + ' + a + ' = ' + a + ' × 4 = ' + P + ' ' + u + '.'
      };
    }
    return {
      kind: 'num', html: 'Сумма длин всех сторон квадрата равна ' + P + ' ' + u + '. Чему равна длина его стороны?', answer: a,
      hint: 'Все четыре стороны квадрата равны, значит, периметр надо разделить на 4.',
      explain: P + ' : 4 = ' + a + ' ' + u + '. Проверка: ' + a + ' × 4 = ' + P + '.'
    };
  };
  gens.perimRect = function () {
    var a = rand(4, 60), b = rand(3, a - 1), u = pick(['см', 'м', 'дм']), P = 2 * (a + b);
    return {
      kind: 'num', html: 'Длина прямоугольника ' + a + ' ' + u + ', ширина ' + b + ' ' + u + '. Найди его периметр.<br>' + svgRect(a, b, a + ' ' + u, b + ' ' + u, { label: 'Прямоугольник ' + a + ' на ' + b + ' ' + u }),
      answer: P, hint: 'Периметр — сумма длин всех сторон: длина, ширина, длина и ширина. Можно сложить длину и ширину и умножить на 2.',
      explain: '(' + a + ' + ' + b + ') × 2 = ' + (a + b) + ' × 2 = ' + P + ' ' + u + '. Или: ' + a + ' + ' + b + ' + ' + a + ' + ' + b + ' = ' + P + ' ' + u + '.'
    };
  };
  gens.sideFromP = function () {
    var a = rand(6, 60), b = rand(3, a - 1), u = pick(['см', 'м', 'дм']), P = 2 * (a + b);
    return {
      kind: 'num', html: 'Периметр прямоугольника ' + P + ' ' + u + ', его длина ' + a + ' ' + u + '. Найди ширину.<br>' + svgRect(a, b, a + ' ' + u, '?', { label: 'Прямоугольник, ширина неизвестна' }),
      answer: b, hint: 'Половина периметра — это длина плюс ширина. Вычти длину.',
      explain: steps([P + ' : 2 = ' + (P / 2) + ' — столько составляют длина и ширина вместе', (P / 2) + ' − ' + a + ' = ' + b + ' ' + u], b + ' ' + u)
    };
  };
  gens.pFence = function () {
    var ctx = pick([0, 1, 2]), A = rand(3, 20) * 5, D = rand(2, 9) * 2, text, B, more = ctx === 1;
    if (ctx === 0) { B = A - D; text = 'Надо поставить изгородь вокруг огорода прямоугольной формы. Длина огорода ' + A + ' м, а ширина на ' + D + ' м меньше. Какой длины нужна изгородь?'; }
    else if (ctx === 1) { B = A + D; A = rand(2, 9) * 5 + 30; B = A + D; text = 'Сад прямоугольной формы обнесли забором. Ширина сада ' + A + ' м, а длина на ' + D + ' м больше. Найди длину забора.'; }
    else { B = A; text = 'Двор квадратной формы со стороной ' + A + ' м огородили забором. Какой длины получился забор?'; }
    var P = 2 * (A + B);
    return {
      kind: 'num', html: text, answer: P, hint: 'Длина забора — это периметр. Сначала найди вторую сторону.',
      explain: ctx === 2 ? A + ' × 4 = ' + P + ' м.'
        : steps([ctx === 0 ? 'Ширина: ' + A + ' − ' + D + ' = ' + B + ' м' : 'Длина: ' + A + ' + ' + D + ' = ' + B + ' м', 'Периметр: (' + A + ' + ' + B + ') × 2 = ' + P + ' м'], P + ' м')
    };
  };
  /* угол ang (в градусах) с показанным прямым углом для сравнения */
  function svgAngle(ang, withRef) {
    var vx = 50, vy = 120, L = 100, rad = ang * Math.PI / 180, ex = vx + L * Math.cos(rad), ey = vy - L * Math.sin(rad);
    return '<svg class="fig" viewBox="0 0 220 140" width="220" role="img" aria-label="Угол">' +
      (withRef !== false ? '<path class="ref" d="M' + vx + ' ' + vy + 'V' + (vy - 100) + '"/>' : '') +
      (ang === 90 ? '<path class="ra" d="M' + (vx + 12) + ' ' + vy + 'v-12h-12"/>' : '') +
      '<path class="ray" d="M' + (vx + 120) + ' ' + vy + 'H' + vx + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + '"/></svg>';
  }
  R.svgRect = svgRect; R.svgAngle = svgAngle;
  gens.angleKind = function () {
    var kinds = ['прямой', 'острый', 'тупой'], ang = pick([90, 90, rand(20, 75), rand(105, 160)]), t = ang === 90 ? 0 : ang < 90 ? 1 : 2;
    return {
      kind: 'choice', html: 'Какой это угол? Штриховая линия показывает, где проходит сторона прямого угла.<br>' + svgAngle(ang), options: kinds, answer: t, wide: false,
      hint: 'Сравни угол с прямым: меньше прямого — острый, ровно прямой — прямой, больше прямого — тупой.',
      explain: 'Это ' + kinds[t] + ' угол: он ' + (t === 0 ? 'совпадает с прямым' : t === 1 ? 'меньше прямого' : 'больше прямого') + '.'
    };
  };
  var FIG_Q = [
    ['У какой фигуры все четыре стороны равны и все четыре угла прямые?', 'квадрат', ['прямоугольник, у которого стороны разные', 'любой четырёхугольник', 'треугольник']],
    ['Сколько прямых углов у прямоугольника?', '4', ['2', '3', '0']],
    ['Какие стороны у прямоугольника всегда равны?', 'противоположные', ['все четыре', 'соседние', 'никакие']],
    ['Чем квадрат отличается от прямоугольника, у которого стороны разной длины?', 'у квадрата все стороны равны', ['у квадрата нет прямых углов', 'у квадрата три стороны', 'ничем не отличается']],
    ['Как найти периметр квадрата со стороной a?', 'a × 4', ['a × 2', 'a + 4', 'a × a']],
    ['Как найти периметр прямоугольника со сторонами a и b?', '(a + b) × 2', ['a + b', 'a × b', 'a × 4']]
  ];
  gens.figFacts = function () {
    var q = pick(FIG_Q), opts = shuffle([q[1]].concat(q[2]));
    return { kind: 'choice', html: q[0], options: opts, answer: opts.indexOf(q[1]), wide: true, hint: 'Вспомни свойства квадрата и прямоугольника.', explain: 'Правильный ответ: ' + q[1] + '.' };
  };
  gens.landUnit = function () {
    var t = pick([0, 1, 2]), items = [['Участок в форме квадрата со стороной 10 м — это…', 'ар'], ['Участок в форме квадрата со стороной 100 м — это…', 'гектар'], ['1 гектар — это квадрат со стороной…', '100 м']];
    var it = items[t], pool = t === 2 ? ['100 м', '10 м', '1 км', '1 000 м'] : ['ар', 'гектар', 'квадратный метр', 'квадратный километр'], opts = shuffle(pool.slice());
    return { kind: 'choice', html: it[0], options: opts, answer: opts.indexOf(it[1]), wide: false, hint: 'Ар — маленький участок, гектар — большой.', explain: 'Квадрат со стороной 10 м — это 1 ар, а квадрат со стороной 100 м — это 1 гектар (1 га = 100 ар).' };
  };

  /* ================= проверка и прикидка ================= */
  gens.checkMulDiv = function (o) {
    o = o || {};
    var op = o.op || pick(['×', ':']), good = Math.random() < 0.5, line, back, ok, why;
    if (op === '×') {
      var a = rn(rand(3, 4)), b = rand(11, 99), r = a * b, shown = r;
      if (!good) { var e = Math.pow(10, rand(1, Math.min(3, String(r).length - 1))) * pick([1, -1, 2]); shown = r + e; if (shown <= 0) shown = r + 10; }
      ok = shown === r; line = fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(shown);
      back = shown / b;
      why = 'Проверяем делением: ' + fmt(shown) + ' : ' + fmt(b) + (ok ? ' = ' + fmt(a) + ' — получилось первое число, значит верно.' : ' — не получается ' + fmt(a) + ', значит, ошибка. Правильно: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(r) + '.');
    } else {
      var d = rand(11, 99), q = rn(rand(2, 3)), a2 = q * d, shownQ = q;
      if (!good) { shownQ = q + pick([10, -10, 100, 1, -1, 2]) ; if (shownQ <= 0) shownQ = q + 10; }
      ok = shownQ === q; line = fmt(a2) + ' : ' + fmt(d) + ' = ' + fmt(shownQ);
      why = 'Проверяем умножением: ' + fmt(shownQ) + ' × ' + fmt(d) + ' = ' + fmt(shownQ * d) + (ok ? ' — получилось делимое ' + fmt(a2) + ', значит верно.' : ', а делимое — ' + fmt(a2) + '. Значит, ошибка. Правильно: ' + fmt(a2) + ' : ' + fmt(d) + ' = ' + fmt(q) + '.');
    }
    return {
      kind: 'choice', html: 'Проверь обратным действием, верно ли записано:<br>' + expr(line), options: ['Верно', 'Неверно'], answer: ok ? 0 : 1, wide: false,
      hint: op === '×' ? 'Произведение раздели на один из множителей — должен получиться другой.' : 'Частное умножь на делитель — должно получиться делимое.',
      explain: why
    };
  };

  gens.estimateMD = function () {
    var op = pick(['×', ':']), a, b, ans, approx, text, why;
    function rnd(n) { var s = String(Math.abs(n)), p = Math.pow(10, s.length - 1); return Math.round(n / p) * p; }
    if (op === '×') {
      a = rand(120, 899); b = rand(12, 89); ans = a * b; approx = rnd(a) * rnd(b);
      text = expr(fmt(a) + ' × ' + b + ' ≈ …');
      why = 'Округляем: ' + fmt(rnd(a)) + ' × ' + rnd(b) + ' = ' + fmt(approx) + '. Ответ должен быть около ' + fmt(approx) + '.';
    } else {
      b = rand(12, 89); var q = rand(12, 89); a = b * q; ans = q; approx = Math.round(rnd(a) / rnd(b));
      text = expr(fmt(a) + ' : ' + b + ' ≈ …');
      why = 'Округляем: ' + fmt(rnd(a)) + ' : ' + rnd(b) + ' ≈ ' + approx + '. Ответ должен быть около ' + approx + '.';
    }
    var real = op === '×' ? ans : ans;
    var cands = op === '×' ? [ans, ans * 10, Math.round(ans / 10), ans * 100, Math.round(ans / 100)] : [ans, ans * 10, Math.max(1, Math.round(ans / 10)), ans * 100, ans + 500];
    var good = ans, wrong = distinctOptions(good, cands, 3);
    if (wrong.length < 3) return gens.estimateMD();
    var opts = shuffle([good].concat(wrong)).map(fmt);
    return {
      kind: 'choice', html: 'Не вычисляя точно, выбери, какой ответ подходит: ' + text, options: opts, answer: opts.indexOf(fmt(good)), wide: false,
      hint: 'Округли числа до старшего разряда и посчитай примерно — сколько цифр должно быть в ответе.',
      explain: why + ' Точный ответ: ' + fmt(ans) + '.'
    };
  };

  /* ================= общая чистка текста ================= */
  var tidy = R.tidy;
  ['compName', 'addMany', 'mulCol', 'mulMental', 'mulTimes', 'divCol', 'divRound', 'divMental', 'seqDiv', 'partOf', 'orderNoBr', 'orderBr', 'orderFirst', 'bracketsPlace',
    'pSumChain', 'pBuy2', 'pFarm', 'pGroups', 'pSpeedRatio', 'pUnitValue', 'pSplitPay', 'pFuel', 'pMachines', 'pExpr', 'pExprChoice', 'pTrainSpeed', 'pTwoRates',
    'unitConv', 'unitCompound', 'unitCompare', 'pMeasures', 'perimSquare', 'perimRect', 'sideFromP', 'pFence', 'angleKind', 'figFacts', 'landUnit', 'checkMulDiv', 'estimateMD'].forEach(function (name) {
    var raw = gens[name];
    if (!raw) throw new Error('gens-review: нет генератора ' + name);
    gens[name] = function (o) {
      var q = raw(o);
      q.html = tidy(q.html); q.explain = tidy(q.explain); q.hint = tidy(q.hint);
      return q;
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
