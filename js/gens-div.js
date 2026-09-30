/* Генераторы заданий блока «Деление больших чисел» (уроки 41–51).
   Префикс всех имён — dv. Числа в заданиях генерируются при каждом запуске.
   Формат заданий — как в gens.js: { kind: 'num'|'nums'|'choice', html, answer, hint, explain, … }. */
(function (G) {
  'use strict';
  var R = G.RKS;
  var rand = R.rand, pick = R.pick, shuffle = R.shuffle, fmt = R.fmt, NB = R.NB;
  var gens = R.gens;

  /* ================= вспомогательные функции ================= */
  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function expr(s) { return '<span class="expr">' + s + '</span>'; }
  function rn(d) { return rand(Math.pow(10, d - 1), Math.pow(10, d) - 1); }
  function len(n) { return String(n).length; }
  function p10(k) { return Math.pow(10, k); }
  /* число нулей на конце (само число 0 — без нулей) */
  function tz(n) { var s = String(n), k = 0; while (k < s.length - 1 && s.charAt(s.length - 1 - k) === '0') k++; return k; }
  function unit(n, forms) { return fmt(n) + NB + R.plural(n, forms); }
  function steps(list, ans) {
    return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>') + '<br>Ответ: ' + ans + '.';
  }
  /* в конструкции «по N …» числа 21, 31, … требуют дательного падежа — такие числа не берём */
  function po(n) { return n % 10 !== 1 || n % 100 === 11; }
  function poRand(lo, hi) { var v, g = 0; do { v = rand(lo, hi); g++; } while (!po(v) && g < 50); return v; }
  function notEnd0(n) { return n % 10 !== 0; }
  function divisorsOf(n, lo, hi) { var o = []; for (var i = lo; i <= hi; i++) if (n % i === 0) o.push(i); return o; }
  function distinct(list) { var seen = {}, out = []; list.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); return out; }

  function reg(name, fn) {
    if (gens[name]) throw new Error('дубль ' + name);
    gens[name] = function (o) {
      var q = fn(o || {});
      q.html = R.tidy(q.html); q.explain = R.tidy(q.explain); q.hint = R.tidy(q.hint);
      return q;
    };
  }

  /* случайный делитель из dd цифр (без нулей на конце, если не разрешено) */
  function rDiv(dd, allowZero) {
    var d, g = 0;
    do { d = dd === 1 ? rand(2, 9) : rn(dd); g++; } while (!allowZero && dd > 1 && d % 10 === 0 && g < 60);
    return d;
  }
  /* случайное частное из qd цифр; zq: 'mid' — нуль внутри, 'end' — нули на конце, 'both' — и то и другое, 'none' — без нулей */
  function rQuot(qd, zq) {
    var digs = [rand(1, 9)], i, z;
    for (i = 1; i < qd; i++) digs.push(rand(1, 9));
    if (zq === 'mid' && qd >= 3) digs[rand(1, qd - 2)] = 0;
    else if (zq === 'end' && qd >= 2) { z = (qd >= 4 && Math.random() < 0.3) ? 2 : 1; for (i = 0; i < z; i++) digs[qd - 1 - i] = 0; }
    else if (zq === 'both' && qd >= 4) { digs[qd - 1] = 0; digs[rand(1, qd - 3)] = 0; }
    else if (!zq && qd >= 3 && Math.random() < 0.15) digs[rand(1, qd - 2)] = 0;
    return Number(digs.join(''));
  }

  /* ================= записи и пошаговые разборы для деления ================= */

  /* шаги деления уголком (свой вариант R.divSteps: аккуратнее с последним шагом и с остатком).
     o.count — первой строкой сказать, сколько цифр будет в частном */
  R.dvSteps = function (a, d, o) {
    o = o || {};
    var c = R.divCalc(a, d), n = c.n, out = [], nd = R.plural;
    if (o.count) {
      var pre = c.s.slice(0, c.m), extra = n - c.m;
      out.push('Первое неполное делимое — ' + fmt(Number(pre)) + (c.m === 1 ? ' (первая цифра). ' : ' (первые ' + c.m + ' ' + nd(c.m, ['цифры', 'цифры', 'цифр']) + '). ') +
        (extra === 1 ? 'Останется снести ещё одну цифру, значит, в частном 2 цифры.' : extra > 1 ? 'Останется снести ещё ' + extra + ' ' + nd(extra, ['цифру', 'цифры', 'цифр']) + ' — по одной, значит, в частном ' + (extra + 1) + ' ' + nd(extra + 1, ['цифра', 'цифры', 'цифр']) + '.' : 'Сносить больше нечего, значит, в частном одна цифра.'));
    }
    c.steps.forEach(function (t, k) {
      var r = n - t.i, rc = R.rankCount(t.cur, r), last = t.i === n - 1, tx;
      if (k === 0) {
        if (c.m === 1) tx = 'Берём первую цифру: ' + rc + '.';
        else {
          var pm = Number(c.s.slice(0, c.m - 1));
          tx = (c.m - 1 === 1 ? 'Первая цифра ' + pm : 'Первые ' + (c.m - 1) + ' ' + nd(c.m - 1, ['цифра', 'цифры', 'цифр']) + ' — число ' + fmt(pm) + ' —') +
            ' меньше ' + fmt(d) + ', берём ' + c.m + ' ' + nd(c.m, ['цифру', 'цифры', 'цифр']) + ': ' + rc + '.';
        }
      } else {
        tx = 'Сносим ' + c.s.charAt(t.i) + ' — получилось ' + rc + '.';
      }
      if (t.q === 0) {
        if (t.cur === 0) tx += ' Ноль делится на любое число: в частном пишем 0.';
        else if (last) tx += ' ' + fmt(t.cur) + ' меньше ' + fmt(d) + ', поэтому в частном пишем 0. Цифр больше нет, число ' + fmt(t.cur) + ' — остаток.';
        else tx += ' ' + fmt(t.cur) + ' меньше ' + fmt(d) + ', поэтому в частном пишем 0 и сносим следующую цифру.';
      } else {
        tx += ' Сколько раз по ' + fmt(d) + ' в ' + fmt(t.cur) + '? ' + t.q + ' ' + nd(t.q, ['раз', 'раза', 'раз']) + ': ' + t.q + ' × ' + fmt(d) + ' = ' + fmt(t.prod) + '; ' + fmt(t.cur) + ' − ' + fmt(t.prod) + ' = ' + fmt(t.rem) + '.';
      }
      out.push(tx);
    });
    out.push(c.rem ? 'Остаток ' + fmt(c.rem) + ', он меньше делителя ' + fmt(d) + '.' : 'Остатка нет — деление выполнено.');
    return out;
  };

  /* строки проверки */
  function chkMul(a, d) { var c = R.divCalc(a, d); return 'Проверка умножением: ' + fmt(c.q) + ' × ' + fmt(d) + ' = ' + fmt(a) + '.'; }
  function chkDiv(a, d) { var c = R.divCalc(a, d); return 'Проверка делением: ' + fmt(a) + ' : ' + fmt(c.q) + ' = ' + fmt(d) + '.'; }
  function chkRem(a, d) {
    var c = R.divCalc(a, d), p = c.q * d;
    return 'Проверка: ' + fmt(d) + ' × ' + fmt(c.q) + ' + ' + fmt(c.rem) + ' = ' + fmt(p) + ' + ' + fmt(c.rem) + ' = ' + fmt(a) + '.';
  }
  R.dvChk = { mul: chkMul, div: chkDiv, rem: chkRem };

  /* столбик + пояснения в одной строке (для теории): R.dvWorked(a, d, {count, check:'mul'|'div'|'rem'}) */
  R.dvWorked = function (a, d, o) {
    o = o || {};
    var t = '<div class="colrow">' + R.divHTML(a, d) + '<span class="colsteps">' + R.dvSteps(a, d, o).join('<br>');
    if (o.check === 'mul') t += '<br>' + chkMul(a, d);
    else if (o.check === 'rem') t += '<br>' + chkRem(a, d);
    return t + '</span></div>';
  };
  /* то же, но для разбора в задании: без обёртки .colrow */
  function workedBox(a, d, o) {
    return R.divHTML(a, d) + '<span class="colsteps">' + R.dvSteps(a, d, o).join('<br>') + '</span>';
  }
  R.dvSolve = workedBox;

  /* число с зачёркнутыми k нулями на конце */
  R.dvCross = function (n, k) {
    var s = String(n), L = s.length, out = '';
    for (var i = 0; i < L; i++) {
      var r = L - i;
      if (r === k && k > 0) out += '<s class="dv-cz">';
      out += s.charAt(i);
      if (r === 1 && k > 0) out += '</s>';
      if (r > 1 && (r - 1) % 3 === 0) out += NB;
    }
    return out;
  };
  function zerosWord(k) { return k + ' ' + (k === 1 ? 'нулю' : 'нуля'); }   /* «по 1 нулю», «по 2 нуля» */

  /* ================= деление уголком без остатка ================= */
  /* o.ddig | o.dmin–o.dmax — цифр в делителе; o.qmin–o.qmax — цифр в частном;
     o.zq — нули в частном ('mid' | 'end' | 'both'); o.check — 'mul' | 'div' | 'both' (просьба проверить) */
  var CHECK_HEAD = {
    mul: 'Выполни деление уголком и проверь умножением: ',
    div: 'Выполни деление уголком и проверь делением: ',
    both: 'Выполни деление уголком и проверь двумя способами — умножением и делением: '
  };
  reg('dvCol', function (o) {
    var dd = o.ddig || rand(o.dmin || 1, o.dmax || 2), qd = rand(o.qmin || 2, o.qmax || 3);
    var d = rDiv(dd, o.dzero), q = rQuot(qd, o.zq), a = q * d;
    var ex = 'Делим уголком:' + workedBox(a, d, { count: qd >= 3 }) + 'Ответ: ' + num(q) + '. ' + chkMul(a, d);
    if (o.check === 'div' || o.check === 'both') ex += ' ' + chkDiv(a, d);
    return {
      kind: 'num', html: (CHECK_HEAD[o.check] || 'Вычисли уголком: ') + expr(fmt(a) + ' : ' + fmt(d) + ' ='), answer: q,
      hint: dd === 1
        ? 'Возьми первое неполное делимое, подбери цифру частного, умножь её на делитель, вычти и снеси следующую цифру. Если после сноса получилось число меньше делителя, в частном пиши 0.'
        : 'Выдели первое неполное делимое. Цифру частного подбирай, округлив делитель и делимое; проверь: остаток должен быть меньше делителя.',
      explain: ex
    };
  });

  /* ================= деление с остатком уголком ================= */
  /* те же параметры + o.pz — вероятность деления без остатка (по умолчанию 0.08) */
  reg('dvRemCol', function (o) {
    var dd = o.ddig || rand(o.dmin || 1, o.dmax || 2), qd = rand(o.qmin || 2, o.qmax || 3);
    var d = rDiv(dd, o.dzero), q = rQuot(qd, o.zq), r = Math.random() < (o.pz == null ? 0.08 : o.pz) ? 0 : rand(1, d - 1), a = q * d + r;
    var ex = 'Делим уголком:' + workedBox(a, d, { count: qd >= 3 }) + 'Ответ: частное ' + num(q) + ', остаток ' + num(r) + '. ' + (r ? chkRem(a, d) : chkMul(a, d));
    return {
      kind: 'nums', html: 'Найди частное и остаток: ' + expr(fmt(a) + ' : ' + fmt(d) + ' ='),
      fields: [{ label: 'частное' }, { label: 'остаток' }], answer: [q, r],
      hint: 'Делим уголком до конца. Остаток — то, что осталось после последнего вычитания; он должен быть меньше делителя. Если остатка нет, пиши 0.',
      explain: ex
    };
  });

  /* ================= сколько цифр в частном ================= */
  var DIGADJ = [null, 'однозначное', 'двузначное', 'трёхзначное', 'четырёхзначное'];
  function digs(n) { return n + ' ' + R.plural(n, ['цифра', 'цифры', 'цифр']); }
  reg('dvQDigits', function (o) {
    var dd = o.ddig || rand(o.dmin || 1, o.dmax || 3), qd = rand(o.qmin || 1, o.qmax || 5), d = rDiv(dd), q = rQuot(qd, o.zq),
      r = (o.rem !== false && Math.random() < 0.4) ? rand(1, d - 1) : 0, a = q * d + r, c = R.divCalc(a, d);
    var k = len(d), pre = Number(String(a).slice(0, k)), left = c.n - c.m, first = Number(String(a).slice(0, c.m)), why;
    if (c.m === k) {
      why = 'Делитель ' + fmt(d) + ' — ' + DIGADJ[k] + ' число. ' + (k === 1 ? 'Берём первую цифру делимого: ' : 'Берём первые ' + digs(k) + ' делимого: ') + fmt(pre) +
        '. Это число не меньше делителя, значит, первое неполное делимое — ' + fmt(pre) + '.';
    } else {
      why = (k === 1 ? 'Первая цифра делимого — ' : 'Первые ' + digs(k) + ' делимого дают ') + fmt(pre) + ', это меньше делителя ' + fmt(d) + '. Берём ещё одну цифру: первое неполное делимое — ' + fmt(first) + '.';
    }
    why += ' ' + (left === 0 ? 'Сносить больше нечего, поэтому в частном 1 цифра.'
      : left === 1 ? 'Остаётся ещё одна цифра — её снесём, поэтому в частном 2 цифры.'
        : 'Остальные ' + digs(left) + ' будем сносить по одной, поэтому в частном ' + digs(left + 1) + '.');
    why += ' Проверим: ' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(q) + (r ? ' (ост. ' + fmt(r) + ')' : '') + '.';
    return {
      kind: 'num', html: 'Не выполняя деления, определи, сколько цифр будет в частном: ' + expr(fmt(a) + ' : ' + fmt(d)),
      answer: left + 1,
      hint: 'Найди первое неполное делимое: возьми столько первых цифр делимого, сколько цифр в делителе. Если получилось число меньше делителя, возьми ещё одну цифру. Остальные цифры сносят по одной.',
      explain: why
    };
  });

  /* ================= деление круглых чисел (сокращаем нули) ================= */
  /* o.lvl: 'mental' (однозначные ядра), 'c1' (двузначный делитель), 'c2' (трёхзначный делитель);
     o.form: 'expr' | 'fill' | 'content'; o.k — сколько нулей у делителя; o.ex — сколько лишних нулей у делимого */
  reg('dvZeros', function (o) {
    var lvl = o.lvl || 'mental', form = o.form || 'expr', D, Q, k, ex, a, d, g = 0;
    if (lvl !== 'mental' && form === 'content') form = 'expr';
    do {
      k = o.k || rand(1, 2); ex = o.ex != null ? o.ex : rand(0, 2);
      if (lvl === 'mental') { D = rand(2, 9); Q = rand(2, 9); }
      else if (lvl === 'c1') { D = rDiv(2); Q = rand(11, 99); }
      else { D = rDiv(3); Q = rand(11, 199); }
      a = D * Q * p10(k + ex); d = D * p10(k); g++;
    } while (a > 2e9 && g < 50);
    var ans = Q * p10(ex), a1 = D * Q * p10(ex);           /* сокращённое делимое */
    var cut = 'Зачёркиваем у делимого и делителя по ' + zerosWord(k) + ': ' + R.dvCross(a, k) + ' : ' + R.dvCross(d, k) + ' = ' + fmt(a1) + ' : ' + fmt(D);
    if (form === 'fill') {
      var askDiv = Math.random() < 0.35, shown = fmt(a) + ' : ' + fmt(d) + ' = ' + (askDiv ? fmt(a1) + ' : □' : '□ : ' + fmt(D));
      return {
        kind: 'num', html: 'Впиши пропущенное число: ' + expr(shown), answer: askDiv ? D : a1,
        hint: 'Сколько нулей на конце делителя? Столько же нулей зачёркивают у делимого, и частное не меняется.',
        explain: 'У делителя ' + fmt(d) + ' на конце ' + k + ' ' + R.plural(k, ['нуль', 'нуля', 'нулей']) + '. Столько же нулей убираем у делимого: ' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(a1) + ' : ' + fmt(D) + '. Пропущено число ' + fmt(askDiv ? D : a1) + '.'
      };
    }
    var body = cut + (lvl === 'mental' ? ' = ' + fmt(ans) + '. ' : '.' + workedBox(a1, D) + 'Ответ: ' + num(ans) + '. ') + chkMul(a, d);
    if (form === 'content') {
      return {
        kind: 'num', html: 'Сколько раз по ' + num(d) + ' содержится в ' + num(a) + '?', answer: ans,
        hint: 'Узнать, сколько раз одно число содержится в другом, — значит разделить. Зачеркни поровну нулей у обоих чисел.',
        explain: 'Надо разделить ' + fmt(a) + ' на ' + fmt(d) + '. ' + body
      };
    }
    return {
      kind: 'num', html: (lvl === 'mental' ? 'Вычисли: ' : 'Вычисли, сократив нули, и раздели уголком: ') + expr(fmt(a) + ' : ' + fmt(d) + ' ='), answer: ans,
      hint: 'Зачеркни на конце делимого и делителя поровну нулей и раздели то, что осталось. Нули, которые остались у делимого, попадут в частное.',
      explain: body
    };
  });

  /* ================= сколько десятков, сотен, тысяч в числе ================= */
  var UNITS = [[10, 'десятков', 'в одном десятке 10 единиц', 2], [100, 'сотен', 'в одной сотне 100 единиц', 3], [1000, 'тысяч', 'в одной тысяче 1 000 единиц', 4]];
  reg('dvUnitsIn', function (o) {
    var u = o.u ? UNITS.filter(function (x) { return x[0] === o.u; })[0] : pick(UNITS), base = rand(2, 99) * pick([1, 1, 10, u[0] === 1000 ? 1 : 100]);
    var n = base * u[0];
    return {
      kind: 'num', html: 'Сколько всего ' + u[1] + ' в числе ' + num(n) + '?', answer: base,
      hint: 'Сколько единиц ' + (u[0] === 10 ? 'в одном десятке' : u[0] === 100 ? 'в одной сотне' : 'в одной тысяче') + '? Раздели число на это количество.',
      explain: u[2].charAt(0).toUpperCase() + u[2].slice(1) + ', поэтому ' + fmt(n) + ' : ' + fmt(u[0]) + ' = ' + fmt(base) + '. Всего ' + R.rankCount(base, u[3]) + '.'
    };
  });

  /* ================= деление на 10, 100, 1 000 ================= */
  reg('dvPow', function (o) {
    var t = o.type || pick(['div', 'div', 'ratio']), f = pick(o.fs || [10, 100, 1000]), z = len(f) - 1, base = rand(2, 999);
    if (Math.random() < 0.3 && base % 10 !== 0) base *= 10;
    var a = base * f, zw = z === 1 ? 'один нуль' : z === 2 ? 'два нуля' : 'три нуля';
    if (t === 'ratio') {
      return {
        kind: 'num', html: 'Во сколько раз число ' + num(a) + ' больше числа ' + num(base) + '?', answer: f,
        hint: 'Чтобы узнать, во сколько раз одно число больше другого, надо большее разделить на меньшее.',
        explain: fmt(a) + ' : ' + fmt(base) + ' = ' + fmt(f) + '. К числу ' + fmt(base) + ' приписали справа ' + zw + ', поэтому оно увеличилось в ' + fmt(f) + ' раз.'
      };
    }
    return {
      kind: 'num', html: 'Вычисли: ' + expr(fmt(a) + ' : ' + fmt(f) + ' ='), answer: base,
      hint: 'Чтобы разделить на ' + fmt(f) + ', убери справа ' + zw + '.',
      explain: fmt(a) + ' : ' + fmt(f) + ' = ' + fmt(base) + ': убираем справа ' + zw + '.'
    };
  });

  /* ================= неизвестные компоненты деления ================= */
  function mulBox(a, b) {
    if (a < b) { var t = a; a = b; b = t; }
    return 'Умножаем столбиком:' + R.mulHTML(a, b) + '<span class="colsteps">' + R.mulSteps(a, b).join('<br>') + '</span>';
  }
  /* тройка d, q, a = d × q нужного уровня: 'mental' | 'small' | 'mid' | 'big' */
  function triple(lvl, o) {
    var t, g = 0;
    do { t = triple1(lvl, o); g++; } while (t.d === t.q && g < 30);
    return t;
  }
  function triple1(lvl, o) {
    o = o || {};
    var d, q;
    if (lvl === 'mental') { d = rand(2, 9); q = rand(2, 9) * pick([10, 10, 100]); }
    else if (lvl === 'small') { d = rand(2, 9); q = rand(11, 99); if (q % 10 === 0) q += 3; }
    else if (lvl === 'big') { d = rDiv(rand(2, 3)); q = rQuot(rand(2, 3), o.zq); if (q < 12) q += 100; }
    else { d = rDiv(2); q = rQuot(rand(2, 3), o.zq); }
    return { d: d, q: q, a: d * q };
  }

  /* x : d = q */
  reg('dvUnkDividend', function (o) {
    var t = triple(o.lvl || 'mid', o), lab = o.label !== false, big = t.a >= 1000 && t.d > 9;
    var ex = 'Неизвестно делимое. Делимое равно частному, умноженному на делитель: x = ' + fmt(t.q) + ' × ' + fmt(t.d) + (big ? '.' + mulBox(t.q, t.d) + 'x = ' + fmt(t.a) : ' = ' + fmt(t.a)) + '. Проверка: ' + fmt(t.a) + ' : ' + fmt(t.d) + ' = ' + fmt(t.q) + '.';
    return {
      kind: 'num', html: (lab ? 'Найди неизвестное делимое: ' : 'Найди x: ') + expr('x : ' + fmt(t.d) + ' = ' + fmt(t.q)), answer: t.a,
      hint: 'Вспомни, как связаны делимое, делитель и частное: какое действие «возвращает» нас к делимому?',
      explain: ex
    };
  });

  /* a : x = q */
  reg('dvUnkDivisor', function (o) {
    var t = triple(o.lvl || 'mid', o), lab = o.label !== false, qBig = t.q > 9 && t.a >= 1000;
    var ex = 'Неизвестен делитель. Делитель равен делимому, делённому на частное: x = ' + fmt(t.a) + ' : ' + fmt(t.q) + (qBig ? '.' + workedBox(t.a, t.q) + 'x = ' + fmt(t.d) : ' = ' + fmt(t.d)) + '. Проверка: ' + fmt(t.a) + ' : ' + fmt(t.d) + ' = ' + fmt(t.q) + '.';
    return {
      kind: 'num', html: (lab ? 'Найди неизвестный делитель: ' : 'Найди x: ') + expr(fmt(t.a) + ' : x = ' + fmt(t.q)), answer: t.d,
      hint: 'Вспомни, как связаны делимое, делитель и частное: какое действие даст делитель, если известны делимое и частное?',
      explain: ex
    };
  });

  /* неизвестное в любой позиции: o.types ⊂ ['dividend','divisor','quot','factor']; o.lvl; o.label — называть ли неизвестное */
  var UNK_TITLE = { dividend: 'Найди неизвестное делимое: ', divisor: 'Найди неизвестный делитель: ', quot: 'Найди неизвестное частное: ', factor: 'Найди неизвестный множитель: ' };
  reg('dvUnkAny', function (o) {
    var ty = pick(o.types || ['dividend', 'divisor', 'quot', 'factor']), t = triple(o.lvl || 'mid', o), a = t.a, d = t.d, q = t.q, eq, ans, rule, calc, corner = '', big = a >= 1000;
    if (ty === 'dividend') {
      eq = 'x : ' + fmt(d) + ' = ' + fmt(q); ans = a;
      rule = 'Неизвестно делимое: оно равно частному, умноженному на делитель.'; calc = 'x = ' + fmt(q) + ' × ' + fmt(d) + ' = ' + fmt(a);
      if (big && d > 9) corner = mulBox(q, d);
    } else if (ty === 'divisor') {
      eq = fmt(a) + ' : x = ' + fmt(q); ans = d;
      rule = 'Неизвестен делитель: он равен делимому, делённому на частное.'; calc = 'x = ' + fmt(a) + ' : ' + fmt(q) + ' = ' + fmt(d);
      if (big && q > 9) corner = workedBox(a, q);
    } else if (ty === 'quot') {
      eq = fmt(a) + ' : ' + fmt(d) + ' = x'; ans = q;
      rule = 'Неизвестно частное: надо делимое разделить на делитель.'; calc = 'x = ' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(q);
      if (big && d > 9) corner = workedBox(a, d);
    } else {
      eq = Math.random() < 0.5 ? fmt(d) + ' × x = ' + fmt(a) : 'x × ' + fmt(d) + ' = ' + fmt(a); ans = q;
      rule = 'Неизвестен множитель: он равен произведению, делённому на известный множитель.'; calc = 'x = ' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(q);
      if (big && d > 9) corner = workedBox(a, d);
    }
    var chk = ty === 'factor' ? 'Проверка: ' + fmt(d) + ' × ' + fmt(q) + ' = ' + fmt(a) + '.' : 'Проверка: ' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(q) + '.';
    return {
      kind: 'num', html: (o.label === false ? 'Найди x: ' : UNK_TITLE[ty]) + expr(eq), answer: ans,
      hint: ty === 'factor' ? 'Множитель находят делением: произведение раздели на известный множитель.' : 'Сначала назови числа в записи: где делимое, где делитель, где частное. Потом вспомни правило для неизвестного.',
      explain: rule + ' ' + (corner ? calc.replace(/ = [\d ]+$/, '') + '.' + corner + calc.replace(/^x = .* = /, 'x = ') : calc) + '. ' + chk
    };
  });

  /* неизвестное, когда известная часть записана выражением: x : 15 = 240 : 6 */
  reg('dvUnkExpr', function (o) {
    var ty = o.type || pick(['dividend', 'divisor']), t = triple(o.lvl || 'mid', o), a = t.a, d = t.d, q = t.q, side, sideTxt, ans, ex, eq, g = 0;
    /* q записываем выражением */
    var kind = pick(['sum', 'diff', 'quot', 'prod']), u, v;
    if (kind === 'sum') { u = rand(1, q - 1); v = q - u; sideTxt = fmt(u) + ' + ' + fmt(v); }
    else if (kind === 'diff') { v = rand(2, 9) * 10 + rand(0, 9); u = q + v; sideTxt = fmt(u) + ' − ' + fmt(v); }
    else if (kind === 'quot') { v = rand(2, 9); u = q * v; sideTxt = fmt(u) + ' : ' + v; }
    else { var fs = divisorsOf(q, 2, 9); if (fs.length) { v = pick(fs); u = q / v; sideTxt = fmt(u) + ' × ' + v; } else { u = rand(1, q - 1); v = q - u; sideTxt = fmt(u) + ' + ' + fmt(v); } }
    var first = sideTxt + ' = ' + fmt(q);
    if (ty === 'dividend') {
      eq = 'x : ' + fmt(d) + ' = ' + sideTxt; ans = a;
      ex = 'Сначала найдём частное: ' + first + '. Получилось x : ' + fmt(d) + ' = ' + fmt(q) + '. Неизвестно делимое, поэтому x = ' + fmt(q) + ' × ' + fmt(d) + ' = ' + fmt(a) + '.';
    } else {
      eq = fmt(a) + ' : x = ' + sideTxt; ans = d;
      ex = 'Сначала найдём частное: ' + first + '. Получилось ' + fmt(a) + ' : x = ' + fmt(q) + '. Неизвестен делитель, поэтому x = ' + fmt(a) + ' : ' + fmt(q) + ' = ' + fmt(d) + '.';
    }
    return {
      kind: 'num', html: 'Найди x: ' + expr(eq), answer: ans,
      hint: 'Сначала вычисли то, что известно (запись справа от знака «=»), а потом определи, какой компонент деления неизвестен.',
      explain: ex + ' Проверка: ' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(q) + '.'
    };
  });

  /* какое выражение позволяет найти x */
  reg('dvWhich', function (o) {
    var ty = o.type || pick(['dividend', 'divisor', 'quot', 'factor']), t = triple(o.lvl || 'mid'), a = t.a, d = t.d, q = t.q, eq, good, bad, why;
    var f = fmt;
    if (ty === 'dividend') { eq = 'x : ' + f(d) + ' = ' + f(q); good = f(q) + ' × ' + f(d); bad = [f(q) + ' : ' + f(d), f(q) + ' + ' + f(d), f(d) + ' : ' + f(q), f(q) + ' − ' + f(d)]; why = 'Неизвестно делимое, а делимое равно частному, умноженному на делитель: x = ' + good + '.'; }
    else if (ty === 'divisor') { eq = f(a) + ' : x = ' + f(q); good = f(a) + ' : ' + f(q); bad = [f(a) + ' × ' + f(q), f(q) + ' : ' + f(a), f(a) + ' − ' + f(q), f(a) + ' + ' + f(q)]; why = 'Неизвестен делитель, а делитель равен делимому, делённому на частное: x = ' + good + '.'; }
    else if (ty === 'quot') { eq = f(a) + ' : ' + f(d) + ' = x'; good = f(a) + ' : ' + f(d); bad = [f(a) + ' × ' + f(d), f(d) + ' : ' + f(a), f(a) + ' − ' + f(d), f(a) + ' + ' + f(d)]; why = 'Неизвестно частное: делимое делим на делитель, x = ' + good + '.'; }
    else { eq = f(d) + ' × x = ' + f(a); good = f(a) + ' : ' + f(d); bad = [f(a) + ' × ' + f(d), f(d) + ' : ' + f(a), f(a) + ' − ' + f(d), f(a) + ' + ' + f(d)]; why = 'Неизвестен множитель: произведение делим на известный множитель, x = ' + good + '.'; }
    var opts = shuffle([good].concat(shuffle(bad).slice(0, 3)));
    return {
      kind: 'choice', html: 'Какое выражение позволяет найти x в равенстве ' + expr(eq) + '?', options: opts, answer: opts.indexOf(good), wide: false,
      hint: 'Назови числа в равенстве: делимое, делитель, частное. Потом вспомни, как найти неизвестное.',
      explain: why
    };
  });

  /* как проверить деление */
  reg('dvCheckPick', function (o) {
    var mode = o.mode || pick(['mul', 'div']), t = triple(o.lvl || 'mid'), a = t.a, d = t.d, q = t.q, good, bad, why, f = fmt;
    if (mode === 'mul') {
      good = f(q) + ' × ' + f(d); bad = [f(q) + ' + ' + f(d), f(a) + ' − ' + f(q), f(a) + ' × ' + f(d), f(a) + ' + ' + f(d)];
      why = 'Деление проверяют умножением: частное умножают на делитель, должно получиться делимое. ' + good + ' = ' + f(a) + '.';
    } else {
      good = f(a) + ' : ' + f(q); bad = [f(a) + ' : ' + f(d), f(q) + ' : ' + f(d), f(a) + ' × ' + f(q), f(a) + ' − ' + f(d)];
      why = 'Деление проверяют делением: делимое делят на частное, должен получиться делитель. ' + good + ' = ' + f(d) + '.';
    }
    var opts = shuffle([good].concat(shuffle(bad).slice(0, 3)));
    return {
      kind: 'choice', html: 'Как проверить ' + (mode === 'mul' ? 'умножением' : 'делением') + ' равенство ' + expr(f(a) + ' : ' + f(d) + ' = ' + f(q)) + '? Выбери нужное действие.',
      options: opts, answer: opts.indexOf(good), wide: false,
      hint: mode === 'mul' ? 'Проверочное умножение возвращает нас к делимому.' : 'Проверочное деление должно дать делитель.',
      explain: why
    };
  });

  /* верно ли выполнено деление (проверка умножением) */
  function wrongQuot(q) {
    var s = String(q).split(''), out = q, g = 0, i, j, t;
    while ((out === q || out <= 0) && g++ < 30) {
      var m = pick(['zero', 'digit', 'swap', 'carry']);
      s = String(q).split('');
      if (m === 'zero') { var z = []; for (i = 1; i < s.length; i++) if (s[i] === '0') z.push(i); if (!z.length) continue; s.splice(pick(z), 1); }
      else if (m === 'digit') { i = rand(0, s.length - 1); var nd = (Number(s[i]) + pick([1, 2, 3, -1, -2, 5]) + 10) % 10; if (i === 0 && nd === 0) continue; s[i] = String(nd); }
      else if (m === 'swap') { if (s.length < 2) continue; i = rand(0, s.length - 2); if (s[i] === s[i + 1] || (i === 0 && s[i + 1] === '0')) continue; t = s[i]; s[i] = s[i + 1]; s[i + 1] = t; }
      else { j = rand(1, Math.max(1, s.length - 1)); out = q + pick([1, -1]) * p10(s.length - j); if (out > 0 && out !== q) return out; continue; }
      out = Number(s.join(''));
    }
    return out === q ? q + 1 : out;
  }
  reg('dvVerify', function (o) {
    var t = triple(o.lvl || 'mid', { zq: o.zq }), a = t.a, d = t.d, q = t.q, good = Math.random() < 0.45, shown = good ? q : wrongQuot(q), prod = shown * d;
    var why = 'Проверяем умножением: ' + fmt(shown) + ' × ' + fmt(d) + ' = ' + fmt(prod) + (good
      ? ' — получилось делимое ' + fmt(a) + ', значит, деление выполнено верно.'
      : ', а делимое — ' + fmt(a) + '. Не сошлось, значит, в делении ошибка. Правильно: ' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(q) + '.');
    return {
      kind: 'choice', html: 'Проверь умножением, верно ли выполнено деление:<br>' + expr(fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(shown)), options: ['Верно', 'Неверно'], answer: good ? 0 : 1, wide: false,
      hint: 'Умножь частное на делитель. Если получится делимое — деление верное.',
      explain: why
    };
  });

  /* таблица «Найди x»: в каждой строке неизвестен один из трёх компонентов */
  reg('dvTable', function (o) {
    var kinds = shuffle(['dividend', 'divisor', 'quot']), rows = [], answers = [], lines = [];
    kinds.forEach(function (ty, i) {
      var t = triple(o.lvl || 'mid', o), cells = [fmt(t.a), fmt(t.d), fmt(t.q)], ans, line;
      if (ty === 'dividend') { cells[0] = '<b>x</b>'; ans = t.a; line = 'Строка ' + (i + 1) + ': неизвестно делимое: x = ' + fmt(t.q) + ' × ' + fmt(t.d) + ' = ' + fmt(t.a) + '.'; }
      else if (ty === 'divisor') { cells[1] = '<b>x</b>'; ans = t.d; line = 'Строка ' + (i + 1) + ': неизвестен делитель: x = ' + fmt(t.a) + ' : ' + fmt(t.q) + ' = ' + fmt(t.d) + '.'; }
      else { cells[2] = '<b>x</b>'; ans = t.q; line = 'Строка ' + (i + 1) + ': неизвестно частное: x = ' + fmt(t.a) + ' : ' + fmt(t.d) + ' = ' + fmt(t.q) + '.'; }
      rows.push('<tr><td>' + cells.join('</td><td>') + '</td></tr>'); answers.push(ans); lines.push(line);
    });
    return {
      kind: 'nums', html: 'Найди неизвестное число x в каждой строке таблицы:<div class="tbl-wrap"><table class="mt"><tr><th>Делимое</th><th>Делитель</th><th>Частное</th></tr>' + rows.join('') + '</table></div>',
      fields: [{ label: 'x в 1-й строке' }, { label: 'x во 2-й строке' }, { label: 'x в 3-й строке' }], answer: answers,
      hint: 'В каждой строке сначала определи, какого числа не хватает: делимого, делителя или частного, и вспомни правило.',
      explain: lines.join('<br>')
    };
  });

  /* ================= деление с остатком ================= */
  function remTxt(q, r) { return fmt(q) + ' (ост. ' + fmt(r) + ')'; }

  /* устно: найди частное и остаток; o.lvl: 'table' | 'two' | 'mid' */
  reg('dvRem', function (o) {
    var lvl = o.lvl || 'table', d, q, r, a;
    if (lvl === 'table') { d = rand(3, 9); q = rand(2, 9); }
    else if (lvl === 'two') { d = rand(3, 9); q = rand(10, 29); }
    else { d = rand(11, 19); q = rand(3, 9); }
    r = rand(1, d - 1); a = d * q + r;
    return {
      kind: 'nums', html: 'Найди частное и остаток: ' + expr(fmt(a) + ' : ' + fmt(d)), fields: [{ label: 'частное' }, { label: 'остаток' }], answer: [q, r],
      hint: 'Найди наибольшее число, которое делится на ' + d + ' без остатка и не больше ' + a + '. Остаток — разность между ' + a + ' и этим числом.',
      explain: 'Наибольшее число, не большее ' + fmt(a) + ', которое делится на ' + d + ' нацело, — это ' + fmt(d * q) + ' (' + fmt(d) + ' × ' + q + '). Остаток: ' + fmt(a) + ' − ' + fmt(d * q) + ' = ' + r + '. Значит, ' +
        fmt(a) + ' : ' + fmt(d) + ' = ' + remTxt(q, r) + '. Проверка: ' + fmt(d) + ' × ' + q + ' + ' + r + ' = ' + fmt(a) + '.'
    };
  });

  /* найти делимое по делителю, частному и остатку */
  reg('dvRemDividend', function (o) {
    var lvl = o.lvl || 'mid', d, q, r, a, style = o.style || pick(['words', 'eq']);
    if (lvl === 'small') { d = rand(3, 9); q = rand(4, 29); }
    else if (lvl === 'big') { d = rDiv(2); q = rand(101, 999); }
    else { d = rDiv(2); q = rand(11, 99); }
    r = rand(1, d - 1); a = d * q + r;
    var p = d * q, mult = (d > 9 && q > 9 && p >= 1000) ? mulBox(q, d) : '';
    var html = style === 'words'
      ? 'Делитель ' + num(d) + ', частное ' + num(q) + ', остаток ' + num(r) + '. Найди делимое.'
      : 'Найди неизвестное делимое: ' + expr('x : ' + fmt(d) + ' = ' + fmt(q) + ' (ост. ' + fmt(r) + ')');
    return {
      kind: 'num', html: html, answer: a,
      hint: 'При делении с остатком делимое равно делителю, умноженному на частное, плюс остаток.',
      explain: 'Делимое = делитель × частное + остаток. x = ' + fmt(d) + ' × ' + fmt(q) + ' + ' + fmt(r) + (mult ? '.' + mult + 'x = ' + fmt(p) + ' + ' + fmt(r) : ' = ' + fmt(p) + ' + ' + fmt(r)) + ' = ' + fmt(a) + '. Проверка: ' + fmt(a) + ' : ' + fmt(d) + ' = ' + remTxt(q, r) + '.'
    };
  });

  /* какая запись деления с остатком верна */
  reg('dvRemOK', function (o) {
    var d = o.dsmall ? rand(3, 9) : rDiv(rand(1, 2)), q = o.dsmall ? rand(3, 29) : rand(3, 99), r = rand(1, d - 1), a = d * q + r, cands = [];
    function ok(qq, rr) { return rr >= 0 && rr < d && d * qq + rr === a; }
    cands.push([q - 1, r + d]);                  /* остаток не меньше делителя */
    if (q > 2) cands.push([q - 2, r + 2 * d]);
    cands.push([q, r + 1]); if (r > 1) cands.push([q, r - 1]);
    cands.push([q + 1, r]); cands.push([q + 1, r > 1 ? r - 1 : r + 1]);
    cands.push([q, r + d]);
    var bad = [], seen = {};
    shuffle(cands).forEach(function (c) { var k = c.join('/'); if (c[0] >= 0 && !ok(c[0], c[1]) && !seen[k]) { seen[k] = 1; bad.push(c); } });
    var good = fmt(a) + ' : ' + fmt(d) + ' = ' + remTxt(q, r), opts = shuffle([good].concat(bad.slice(0, 3).map(function (c) { return fmt(a) + ' : ' + fmt(d) + ' = ' + remTxt(c[0], c[1]); })));
    return {
      kind: 'choice', html: 'Раздели с остатком ' + num(a) + ' на ' + num(d) + '. Какая запись верна?', options: opts, answer: opts.indexOf(good), wide: true,
      hint: 'В верной записи остаток меньше делителя, а делитель × частное + остаток равно делимому.',
      explain: 'Проверяем: остаток должен быть меньше делителя ' + fmt(d) + ', и должно получиться ' + fmt(d) + ' × частное + остаток = ' + fmt(a) + '. Верна запись ' + good + ': ' + fmt(d) + ' × ' + fmt(q) + ' + ' + fmt(r) + ' = ' + fmt(a) + ', и ' + fmt(r) + ' < ' + fmt(d) + '.'
    };
  });

  /* проверка деления с остатком: верно / неверно */
  reg('dvRemCheck', function (o) {
    var d = o.dsmall ? rand(3, 9) : rDiv(rand(1, 2)), q = rand(o.dsmall ? 4 : 11, o.dsmall ? 29 : 99), r = rand(1, d - 1), a = d * q + r, good = Math.random() < 0.45, sq = q, sr = r, m, why;
    if (!good) {
      m = pick(['bigrem', 'rem', 'quot']);
      if (m === 'bigrem') { sq = q - 1; sr = r + d; }
      else if (m === 'rem') { sr = r + pick([1, 2, 3]); if (sr >= d) { sr = r > 1 ? r - 1 : r + 1; } if (sr === r) sr = r + 1; }
      else { sq = q + pick([1, 2, -1]); if (sq <= 0) sq = q + 1; }
    }
    var prod = d * sq;
    if (good) why = 'Проверка: ' + fmt(d) + ' × ' + fmt(sq) + ' + ' + fmt(sr) + ' = ' + fmt(prod) + ' + ' + fmt(sr) + ' = ' + fmt(prod + sr) + ' — получилось делимое, и остаток ' + fmt(sr) + ' меньше делителя ' + fmt(d) + '. Запись верна.';
    else if (sr >= d) why = 'Остаток ' + fmt(sr) + ' не меньше делителя ' + fmt(d) + ' — так не бывает: в делимом можно взять ещё один делитель. Правильно: ' + fmt(a) + ' : ' + fmt(d) + ' = ' + remTxt(q, r) + '.';
    else why = 'Проверка: ' + fmt(d) + ' × ' + fmt(sq) + ' + ' + fmt(sr) + ' = ' + fmt(prod) + ' + ' + fmt(sr) + ' = ' + fmt(prod + sr) + ', а делимое — ' + fmt(a) + '. Не сошлось, запись неверна. Правильно: ' + fmt(a) + ' : ' + fmt(d) + ' = ' + remTxt(q, r) + '.';
    return {
      kind: 'choice', html: 'Проверь, верно ли выполнено деление с остатком:<br>' + expr(fmt(a) + ' : ' + fmt(d) + ' = ' + remTxt(sq, sr)), options: ['Верно', 'Неверно'], answer: good ? 0 : 1, wide: false,
      hint: 'Умножь делитель на частное, прибавь остаток — должно получиться делимое. И посмотри, меньше ли остаток делителя.',
      explain: why
    };
  });

  /* факты об остатках: наибольший, возможный, «какое число даёт такой остаток», сколько разных */
  reg('dvRemFact', function (o) {
    var ty = o.type || pick(['max', 'possible', 'which', 'count']), d = pick(o.ds || [3, 4, 5, 6, 7, 8, 9, 12, 13, 15, 20]), r, i, opts, good;
    if (ty === 'max') {
      return {
        kind: 'num', html: 'Какой наибольший остаток может получиться при делении на ' + num(d) + '?', answer: d - 1,
        hint: 'Остаток всегда меньше делителя.',
        explain: 'Остаток должен быть меньше делителя ' + d + ', поэтому наибольший остаток равен ' + d + ' − 1 = ' + (d - 1) + '.'
      };
    }
    if (ty === 'count') {
      return {
        kind: 'num', html: 'Сколько разных остатков (считая остаток 0) может получиться при делении на ' + num(d) + '?', answer: d,
        hint: 'Выпиши все числа, которые меньше делителя, — начиная с нуля.',
        explain: 'Остатки: 0, 1, 2, …, ' + (d - 1) + '. Всего ' + d + ' ' + R.plural(d, ['остаток', 'остатка', 'остатков']) + '.'
      };
    }
    if (ty === 'possible') {
      r = rand(1, d - 1); good = String(r);
      var pool = distinct([d, d + 1, d + 2, d + 3, 2 * d, 2 * d + 1, d + 5].filter(function (x) { return x >= d; }));
      opts = shuffle([good].concat(shuffle(pool).slice(0, 3).map(String)));
      return {
        kind: 'choice', html: 'Какой остаток может получиться при делении на ' + num(d) + '?', options: opts, answer: opts.indexOf(good), wide: false,
        hint: 'Остаток всегда меньше делителя.',
        explain: 'Остаток должен быть меньше делителя ' + d + '. Из предложенных чисел меньше ' + d + ' только ' + good + '.'
      };
    }
    /* which: какое число при делении на d даёт остаток r */
    r = rand(1, d - 1);
    var base = rand(3, 12) * d + r, goodTxt = fmt(base), rems = [], list = [goodTxt], guard = 0;
    while (list.length < 4 && guard++ < 60) {
      var x = rand(3, 12) * d + rand(0, d - 1);
      if (x % d !== r && list.indexOf(fmt(x)) < 0) list.push(fmt(x));
    }
    opts = shuffle(list);
    list.forEach(function (t) { var v = R.parseNum(t); rems.push(t + ' : ' + d + ' = ' + Math.floor(v / d) + ' (ост. ' + (v % d) + ')'); });
    return {
      kind: 'choice', html: 'Какое из чисел при делении на ' + num(d) + ' даёт остаток ' + num(r) + '?', options: opts, answer: opts.indexOf(goodTxt), wide: false,
      hint: 'Раздели каждое число на ' + d + ' с остатком и посмотри на остаток.',
      explain: 'Делим каждое число: ' + rems.join('; ') + '. Остаток ' + r + ' даёт число ' + goodTxt + '.'
    };
  });

  /* сколько чисел ряда делятся на d без остатка */
  reg('dvDivisibleCount', function (o) {
    var d = rand(3, 9), k = rand(1, 4), list = [], i, seen = {}, cnt;
    while (list.length < k) { var m = d * rand(2, 14); if (!seen[m]) { seen[m] = 1; list.push(m); } }
    while (list.length < 7) { var x = rand(d * 2, d * 15); if (x % d !== 0 && !seen[x]) { seen[x] = 1; list.push(x); } }
    list = shuffle(list); cnt = list.filter(function (x) { return x % d === 0; }).length;
    var who = list.filter(function (x) { return x % d === 0; }), other = list.filter(function (x) { return x % d !== 0; });
    return {
      kind: 'num', html: 'Сколько чисел в ряду делятся на ' + num(d) + ' без остатка? ' + expr(list.join('; ')), answer: cnt,
      hint: 'Раздели каждое число на ' + d + ': если получился остаток, число не подходит.',
      explain: 'Делятся без остатка: ' + who.map(function (x) { return x + ' (' + d + ' × ' + (x / d) + ')'; }).join(', ') + '. Не делятся: ' +
        other.map(function (x) { return x + ' (ост. ' + (x % d) + ')'; }).join(', ') + '. Ответ: ' + cnt + '.'
    };
  });

  /* ================= названия чисел при делении, особые случаи ================= */
  var DIVNAMES = ['делимое', 'делитель', 'частное'];
  reg('dvName', function (o) {
    var ty = o.type || pick(['eq', 'def']), a, d, q;
    do { d = rand(3, 90); q = rand(4, 90); } while (d === q);
    a = d * q;
    if (ty === 'def') {
      var it = pick([['Число, которое делят, называется…', 'делимое'], ['Число, на которое делят, называется…', 'делитель'], ['Результат деления называется…', 'частное']]);
      var opts1 = shuffle(DIVNAMES.concat(['произведение']));
      return {
        kind: 'choice', html: it[0], options: opts1, answer: opts1.indexOf(it[1]), wide: false,
        hint: 'Вспомни запись деления и подпиши каждое число.',
        explain: 'В записи «' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(q) + '» число ' + fmt(a) + ' — делимое (его делят), ' + fmt(d) + ' — делитель (на него делят), ' + fmt(q) + ' — частное (результат). Ответ: ' + it[1] + '.'
      };
    }
    var pr = pick([[a, 'делимое'], [d, 'делитель'], [q, 'частное']]), others = DIVNAMES.filter(function (x) { return x !== pr[1]; });
    var opts = shuffle([pr[1]].concat(others).concat([pick(['сумма', 'разность', 'вычитаемое', 'слагаемое'])]));
    return {
      kind: 'choice', html: 'В равенстве ' + expr(fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(q)) + ' число <b>' + fmt(pr[0]) + '</b> называется…', options: opts, answer: opts.indexOf(pr[1]), wide: false,
      hint: 'Делимое стоит первым, делитель — после знака «:», частное — после знака «=».',
      explain: 'Первое число (' + fmt(a) + ') — делимое, второе (' + fmt(d) + ') — делитель, результат (' + fmt(q) + ') — частное. Число ' + fmt(pr[0]) + ' — ' + pr[1] + '.'
    };
  });

  reg('dvRole', function (o) {
    var d = rand(3, 99), q = rand(4, 99) * pick([1, 1, 10]), a = d * q, role = pick(DIVNAMES), ans = role === 'делимое' ? a : role === 'делитель' ? d : q;
    return {
      kind: 'num', html: 'В записи ' + expr(fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(q)) + ' запиши число, которое является ' + (role === 'делимое' ? '<b>делимым</b>' : role === 'делитель' ? '<b>делителем</b>' : '<b>частным</b>') + '.', answer: ans,
      hint: 'Делимое — число, которое делят; делитель — число, на которое делят; частное — результат деления.',
      explain: 'Делимое — ' + fmt(a) + ', делитель — ' + fmt(d) + ', частное — ' + fmt(q) + '. Значит, ' + role + ' — это ' + fmt(ans) + '.'
    };
  });

  /* зная умножение, найти деление */
  reg('dvKnown', function (o) {
    var a = pick(o.as || [12, 15, 16, 18, 24, 25, 32, 35, 45, 48, 64, 75, 125]), b = rand(o.bmin || 6, o.bmax || 19), p = a * b, first = Math.random() < 0.5, dv = first ? a : b, ans = first ? b : a;
    return {
      kind: 'num', html: 'Известно, что ' + expr(fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(p)) + '. Не вычисляя, найди частное ' + expr(fmt(p) + ' : ' + fmt(dv) + ' ='), answer: ans,
      hint: 'Деление — действие, обратное умножению: произведение делят на один множитель и получают другой.',
      explain: 'Из ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(p) + ' следует, что ' + fmt(p) + ' : ' + fmt(dv) + ' = ' + fmt(ans) + ', потому что ' + fmt(ans) + ' × ' + fmt(dv) + ' = ' + fmt(p) + '.'
    };
  });

  /* на равные части или по содержанию */
  var KIND_OPTS = ['на равные части', 'по содержанию'];
  function eqParts(k) { return k + ' ' + (k < 5 ? 'равные части' : 'равных частей'); }
  var EQ_STORIES = [
    function (T, k) { return 'В корзине ' + unit(T, ['яблоко', 'яблока', 'яблок']) + '. Их раздали поровну ' + k + ' детям. Сколько яблок получил каждый ребёнок?'; },
    function (T, k) { return unit(T, ['конфету', 'конфеты', 'конфет']) + ' разложили поровну в ' + unit(k, ['пакет', 'пакета', 'пакетов']) + '. Сколько конфет в каждом пакете?'; },
    function (T, k) { return 'Верёвку длиной ' + T + ' м разрезали на ' + eqParts(k) + '. Какова длина каждой части?'; },
    function (T, k) { return 'За ' + unit(k, ['час', 'часа', 'часов']) + ' принтер напечатал ' + unit(T, ['страницу', 'страницы', 'страниц']) + '. Сколько страниц он печатал за один час?'; },
    function (T, k) { return unit(T, ['тетрадь', 'тетради', 'тетрадей']) + ' поровну распределили между ' + k + ' классами. Сколько тетрадей получил каждый класс?'; }
  ];
  var CT_STORIES = [
    function (T, p) { return 'Из ' + unit(T, ['яблока', 'яблок', 'яблок']) + ' составили наборы по ' + p + ' ' + R.plural(p, ['яблоку', 'яблока', 'яблок']) + '. Сколько наборов получилось?'; },
    function (T, p) { return 'Ленту длиной ' + T + ' м разрезали на куски по ' + p + ' м. Сколько кусков получилось?'; },
    function (T, p) { return unit(T, ['ученика', 'ученика', 'учеников']) + ' разместили в лодки по ' + p + ' ' + R.plural(p, ['человеку', 'человека', 'человек']) + ' в каждую. Сколько лодок понадобилось?'; },
    function (T, p) { return T + ' кг конфет разложили в пакеты по ' + p + ' кг. Сколько пакетов потребовалось?'; },
    function (T, p) { return 'Сок из бочки в ' + T + ' л разлили в банки по ' + p + ' л. Сколько банок наполнили?'; }
  ];
  reg('dvKind', function (o) {
    var isEq = Math.random() < 0.5, k = rand(2, 9), per = rand(3, 25), T = k * per, text, why;
    if (isEq) {
      text = pick(EQ_STORIES)(T, k);
      why = 'Всё количество делят на ' + eqParts(k) + ' и узнают, сколько в одной части: ' + T + ' : ' + k + ' = ' + per + '. Это деление на равные части.';
    } else {
      var p = per; if (p < 2) p = 2;
      text = pick(CT_STORIES)(T, p);
      why = 'Узнаём, сколько раз по ' + p + ' содержится в ' + T + ': ' + T + ' : ' + p + ' = ' + k + '. Это деление по содержанию.';
    }
    return {
      kind: 'choice', html: text + '<br>Какое это деление?', options: KIND_OPTS.slice(), answer: isEq ? 0 : 1, wide: false,
      hint: 'Что известно: на сколько частей делят (тогда узнаём, сколько в одной части) или сколько в одной части (тогда узнаём, сколько раз она содержится)?',
      explain: why
    };
  });

  /* сколько раз содержится / во сколько раз больше; o.small — устный вариант (маленькие числа) */
  var TIMES_U = ['кг', 'м', 'руб.', 'л', 'см', 'т'];
  reg('dvTimes', function (o) {
    var ty = o.type || pick(['content', 'ratio']), u = pick(TIMES_U), p = o.small ? rand(2, 9) : rand(2, 99), k = o.small ? rand(2, 12) : rand(2, 99) * pick([1, 1, 10]), T = p * k;
    if (ty === 'content') {
      return {
        kind: 'num', html: 'Сколько раз по ' + p + ' ' + u + ' содержится в ' + fmt(T) + ' ' + u + '?', answer: k,
        hint: 'Чтобы узнать, сколько раз одно число содержится в другом, надо большее число разделить на меньшее.',
        explain: fmt(T) + ' : ' + p + ' = ' + fmt(k) + ', потому что ' + p + ' × ' + fmt(k) + ' = ' + fmt(T) + '.'
      };
    }
    return {
      kind: 'num', html: 'Во сколько раз ' + fmt(T) + ' ' + u + ' больше, чем ' + p + ' ' + u + '?', answer: k,
      hint: 'Чтобы узнать, во сколько раз одно число больше другого, надо большее разделить на меньшее.',
      explain: fmt(T) + ' : ' + p + ' = ' + fmt(k) + '. Число ' + fmt(T) + ' в ' + fmt(k) + ' ' + R.plural(k, ['раз', 'раза', 'раз']) + ' больше, чем ' + p + '.'
    };
  });

  /* деление на 1, само на себя, нуля, меньшего на большее (types: 'one' | 'self' | 'zero' | 'less'; o.small — маленькие числа для 'less') */
  reg('dvSpecial', function (o) {
    var ty = pick(o.types || ['one', 'self', 'zero']), a = rand(2, 999) * pick([1, 1, 10]);
    if (ty === 'one') return { kind: 'num', html: 'Вычисли: ' + expr(fmt(a) + ' : 1 ='), answer: a, hint: 'Что получится, если разделить число на единицу?', explain: fmt(a) + ' : 1 = ' + fmt(a) + ', потому что ' + fmt(a) + ' × 1 = ' + fmt(a) + '. При делении на 1 число не меняется.' };
    if (ty === 'self') return { kind: 'num', html: 'Вычисли: ' + expr(fmt(a) + ' : ' + fmt(a) + ' ='), answer: 1, hint: 'Сколько раз число содержится в самом себе?', explain: fmt(a) + ' : ' + fmt(a) + ' = 1, потому что 1 × ' + fmt(a) + ' = ' + fmt(a) + '. Число делится само на себя ровно один раз.' };
    if (ty === 'zero') return { kind: 'num', html: 'Вычисли: ' + expr('0 : ' + fmt(a) + ' ='), answer: 0, hint: 'Какое число, умноженное на ' + a + ', даст нуль?', explain: '0 : ' + fmt(a) + ' = 0, потому что 0 × ' + fmt(a) + ' = 0. Нуль, делённый на любое число (не нуль), равен нулю.' };
    a = o.small ? rand(2, 30) : rand(12, 400); var d = a + rand(1, o.small ? 12 : 60);
    return {
      kind: 'nums', html: 'Раздели с остатком: ' + expr(fmt(a) + ' : ' + fmt(d)), fields: [{ label: 'частное' }, { label: 'остаток' }], answer: [0, a],
      hint: 'Помещается ли делитель в делимом хотя бы один раз?',
      explain: fmt(a) + ' меньше ' + fmt(d) + ', поэтому ' + fmt(d) + ' в ' + fmt(a) + ' не помещается ни разу: ' + fmt(a) + ' : ' + fmt(d) + ' = 0 (ост. ' + fmt(a) + '). Проверка: ' + fmt(d) + ' × 0 + ' + fmt(a) + ' = ' + fmt(a) + '.'
    };
  });

  /* ================= устное деление ================= */
  /* o.types ⊂ ['table','table10','parts','twoDigit'] */
  reg('dvMental', function (o) {
    var ty = pick(o.types || ['table', 'table10', 'parts', 'twoDigit']), d, q, a, hint, why;
    if (ty === 'table') {
      d = rand(3, 9); q = rand(3, 9); a = d * q;
      hint = 'Вспомни таблицу умножения: на какое число надо умножить ' + d + ', чтобы получить ' + a + '?';
      why = fmt(a) + ' : ' + d + ' = ' + q + ', потому что ' + q + ' × ' + d + ' = ' + a + '.';
    } else if (ty === 'table10') {
      d = rand(3, 9); q = rand(3, 9) * pick([10, 10, 100]); a = d * q; var u = q >= 100 ? 100 : 10;
      hint = 'Раздели число ' + (u === 100 ? 'сотен' : 'десятков') + ', а потом припиши ' + (u === 100 ? 'два нуля' : 'нуль') + '.';
      why = fmt(a) + ' : ' + d + ' = ' + (a / u) + ' ' + (u === 100 ? 'сот.' : 'дес.') + ' : ' + d + ' = ' + (q / u) + ' ' + (u === 100 ? 'сот.' : 'дес.') + ' = ' + fmt(q) + '.';
    } else if (ty === 'parts') {
      d = rand(3, 9); q = rand(12, 49); if (q % 10 === 0) q += rand(1, 9); a = d * q;
      var big = Math.floor(q / 10) * 10 * d, rest = a - big;
      hint = 'Разбей ' + a + ' на два удобных слагаемых, каждое из которых делится на ' + d + '.';
      why = fmt(a) + ' : ' + d + ' = (' + fmt(big) + ' + ' + rest + ') : ' + d + ' = ' + fmt(big / d) + ' + ' + (rest / d) + ' = ' + q + '.';
    } else {
      d = pick([11, 12, 13, 14, 15, 16, 18, 25]); q = rand(3, 9); a = d * q;
      hint = 'На какое число надо умножить ' + d + ', чтобы получить ' + a + '?';
      why = 'Подбираем: ' + d + ' × ' + q + ' = ' + a + ', значит, ' + a + ' : ' + d + ' = ' + q + '.';
    }
    return { kind: 'num', html: 'Вычисли устно: ' + expr(fmt(a) + ' : ' + d + ' ='), answer: q, hint: hint, explain: why };
  });

  /* приёмы: деление на 5, 25, 50, 20, 4, 8 */
  reg('dvTrick', function (o) {
    var ty = pick(o.types || ['d5', 'd25', 'd50', 'd20', 'd4', 'd8']), q, a, d, hint, why;
    if (ty === 'd5') { d = 5; q = rand(12, 199); a = d * q; hint = 'Умножь делимое на 2 и раздели на 10: это то же самое.'; why = fmt(a) + ' : 5 = (' + fmt(a) + ' × 2) : 10 = ' + fmt(a * 2) + ' : 10 = ' + fmt(q) + '.'; }
    else if (ty === 'd50') { d = 50; q = rand(12, 99); a = d * q; hint = 'Умножь делимое на 2 и раздели на 100.'; why = fmt(a) + ' : 50 = (' + fmt(a) + ' × 2) : 100 = ' + fmt(a * 2) + ' : 100 = ' + fmt(q) + '.'; }
    else if (ty === 'd25') { d = 25; q = rand(12, 99); a = d * q; hint = 'Умножь делимое на 4 и раздели на 100.'; why = fmt(a) + ' : 25 = (' + fmt(a) + ' × 4) : 100 = ' + fmt(a * 4) + ' : 100 = ' + fmt(q) + '.'; }
    else if (ty === 'd20') { d = 20; q = rand(12, 199); a = d * q; hint = 'Раздели на 10 (убери нуль), а потом на 2.'; why = fmt(a) + ' : 20 = ' + fmt(a) + ' : 10 : 2 = ' + fmt(a / 10) + ' : 2 = ' + fmt(q) + '.'; }
    else if (ty === 'd4') { d = 4; q = rand(21, 199); a = d * q; hint = 'Раздели на 2 два раза подряд.'; why = fmt(a) + ' : 4 = ' + fmt(a) + ' : 2 : 2 = ' + fmt(a / 2) + ' : 2 = ' + fmt(q) + '.'; }
    else { d = 8; q = rand(21, 199); a = d * q; hint = 'Раздели на 2 три раза подряд.'; why = fmt(a) + ' : 8 = ' + fmt(a) + ' : 2 : 2 : 2 = ' + fmt(a / 2) + ' : 2 : 2 = ' + fmt(a / 4) + ' : 2 = ' + fmt(q) + '.'; }
    return { kind: 'num', html: 'Вычисли удобным способом: ' + expr(fmt(a) + ' : ' + d + ' ='), answer: q, hint: hint, explain: why };
  });

  /* цепочка действий с большими числами */
  function buildChain(n) {
    var v = pick([125, 60, 40, 150, 200, 250, 24, 36, 48, 72, 120, 90, 300, 45, 80, 64, 96, 144, 75, 180]), start = v, items = [], log = [], hasDiv = false, hasMul = false, i, g, op, k, nv, sign;
    for (i = 0; i < n; i++) {
      g = 0;
      do {
        op = pick(['mul', 'div', 'div', 'add', 'sub']); k = 0; nv = -1;
        if (op === 'mul') { k = pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20]); nv = v * k; }
        else if (op === 'div') { var ds = divisorsOf(v, 2, 60).filter(function (x) { return v / x >= 2; }); if (ds.length) { k = pick(ds); nv = v / k; } }
        else if (op === 'add') { k = rand(2, 30) * 10; nv = v + k; }
        else { k = rand(2, 30) * 10 + (Math.random() < 0.5 ? 0 : rand(1, 9)); nv = v - k; }
        g++;
      } while ((nv < 2 || nv > 4000 || k === 0) && g < 40);
      if (nv < 2 || nv > 4000 || k === 0) return null;
      if (op === 'div') hasDiv = true; if (op === 'mul') hasMul = true;
      sign = { mul: '×', div: ':', add: '+', sub: '−' }[op];
      items.push(sign + NB + k); log.push(fmt(v) + ' ' + sign + ' ' + k + ' = ' + fmt(nv)); v = nv;
    }
    if (!hasDiv) return null;
    return { start: start, items: items, log: log, end: v };
  }
  reg('dvChain', function (o) {
    var c = null, g = 0;
    while (!c && g++ < 300) c = buildChain(o.steps || rand(4, 5));
    var html = '<div class="chain"><span class="chain-start">' + fmt(c.start) + '</span>' + c.items.map(function (t) { return '<span class="chain-op">' + t + '</span>'; }).join('') + '</div>';
    return {
      kind: 'num', html: 'Выполни цепочку по порядку:' + html, answer: c.end,
      hint: 'Начни с первого числа и выполняй действия одно за другим, по порядку.',
      explain: 'По шагам: ' + c.log.join('; ') + '. Ответ: ' + fmt(c.end) + '.'
    };
  });

  /* ================= текстовые задачи ================= */
  function rnd10(x, o) { return (o && o.round) ? Math.max(2, Math.round(x / 10)) * 10 : x; }

  /* --- на равные части: T : k = по сколько --- */
  var EQUAL = [
    function (o) { var k = rnd10(rand(6, 30), o), per = rand(12, 60) * 10, T = k * per;
      return { T: T, k: k, per: per, f: ['куртка', 'куртки', 'курток'], q: 'Сколько курток сшивали за одну смену?',
        text: 'Швейная фабрика за ' + unit(k, ['смену', 'смены', 'смен']) + ' сшила ' + unit(T, ['куртку', 'куртки', 'курток']) + '. Каждую смену шили поровну. Сколько курток сшивали за одну смену?' }; },
    function (o) { var k = rnd10(rand(7, 30), o), per = rand(20, 90) * 100, T = k * per;
      return { T: T, k: k, per: per, f: ['кирпич', 'кирпича', 'кирпичей'], q: 'Сколько кирпичей выпускали за один день?',
        text: 'Кирпичный завод выпустил за ' + unit(k, ['день', 'дня', 'дней']) + ' ' + unit(T, ['кирпич', 'кирпича', 'кирпичей']) + '. Выпуск каждый день был одинаковым. Сколько кирпичей выпускали за один день?' }; },
    function (o) { var k = rnd10(rand(12, 150), o), per = rand(12, 60), T = k * per;
      return { T: T, k: k, per: per, f: ['книга', 'книги', 'книг'], q: 'Сколько книг в одной коробке?',
        text: 'В типографии напечатали ' + unit(T, ['книгу', 'книги', 'книг']) + ' и упаковали их поровну в ' + unit(k, ['коробку', 'коробки', 'коробок']) + '. Сколько книг в каждой коробке?' }; },
    function (o) { var k = rnd10(rand(40, 400), o), per = rand(5, 10) * 5, T = k * per;
      return { T: T, k: k, per: per, f: ['кг', 'кг', 'кг'], q: 'Сколько килограммов в одном мешке?',
        text: 'С поля собрали ' + fmt(T) + ' кг картофеля и разложили поровну в ' + unit(k, ['мешок', 'мешка', 'мешков']) + '. Сколько килограммов картофеля в каждом мешке?' }; },
    function (o) { var k = rnd10(rand(3, 12), o), per = rand(15, 35), T = k * per;
      return { T: T, k: k, per: per, f: ['км', 'км', 'км'], q: 'Сколько километров туристы проходили за один день?',
        text: 'Туристы за ' + unit(k, ['день', 'дня', 'дней']) + ' прошли ' + T + ' км, проходя каждый день одинаковое расстояние. Сколько километров они проходили за один день?' }; },
    function (o) { var k = rnd10(rand(6, 60), o), per = rand(16, 50) * 50, T = k * per;
      return { T: T, k: k, per: per, f: ['руб.', 'руб.', 'руб.'], q: 'Сколько рублей стоит один стул?',
        text: 'За ' + unit(k, ['стул', 'стула', 'стульев']) + ' одной модели магазин заплатил ' + fmt(T) + ' руб. Сколько рублей стоит один стул?' }; },
    function (o) { var k = rnd10(rand(8, 40), o), per = rand(20, 60), T = k * per;
      return { T: T, k: k, per: per, f: ['книга', 'книги', 'книг'], q: 'Сколько книг на одной полке?',
        text: 'В библиотеке ' + unit(T, ['книгу', 'книги', 'книг']) + ' поставили поровну на ' + k + ' ' + R.plural(k, ['полку', 'полки', 'полок']) + '. Сколько книг на каждой полке?' }; },
    function (o) { var k = rnd10(rand(6, 24), o), per = rand(5, 15) * 100, T = k * per;
      return { T: T, k: k, per: per, f: ['зритель', 'зрителя', 'зрителей'], q: 'Сколько зрителей вмещает один сектор?',
        text: 'Трибуны стадиона рассчитаны на ' + fmt(T) + ' зрителей и разделены на ' + unit(k, ['сектор', 'сектора', 'секторов']) + ', в каждом из которых поровну мест. Сколько зрителей вмещает один сектор?' }; }
  ];
  reg('dvPEqual', function (o) {
    var s = pick(EQUAL)(o);
    return {
      kind: 'num', html: s.text, answer: s.per,
      hint: 'Всё количество надо разделить поровну на число частей.',
      explain: steps([s.q + ' ' + fmt(s.T) + ' : ' + fmt(s.k) + ' = ' + fmt(s.per)], unit(s.per, s.f))
    };
  });

  /* --- по содержанию: T : p = сколько порций --- */
  var CONTENT = [
    function (o) { var p = pick(o.round ? [10, 20, 50] : [2, 4, 5, 10, 20, 25]), c = rnd10(rand(20, 300), o), T = p * c;
      return { T: T, p: p, c: c, f: ['пакет', 'пакета', 'пакетов'], q: 'Сколько пакетов получилось?',
        text: 'Из ' + fmt(T) + ' кг муки сделали пакеты по ' + p + ' кг. Сколько пакетов получилось?' }; },
    function (o) { var p = pick([100, 200, 250, 500]), c = rnd10(rand(12, 90), o), T = p * c;
      return { T: T, p: p, c: c, f: ['контейнер', 'контейнера', 'контейнеров'], q: 'Сколько контейнеров потребовалось?',
        text: 'Для перевозки ' + fmt(T) + ' кг груза взяли контейнеры вместимостью по ' + p + ' кг. Сколько контейнеров потребовалось?' }; },
    function (o) { var p = poRand(12, 48), c = rnd10(rand(20, 200), o), T = p * c;
      if (o.round) { p = pick([20, 30, 40, 50]); T = p * c; }
      return { T: T, p: p, c: c, f: ['пачка', 'пачки', 'пачек'], q: 'Сколько пачек получилось?',
        text: unit(T, ['тетрадь', 'тетради', 'тетрадей']) + ' упаковали в пачки по ' + p + ' ' + R.plural(p, ['тетради', 'тетради', 'тетрадей']) + ' в каждой. Сколько пачек получилось?' }; },
    function (o) { var p = pick(o.round ? [10, 20, 30, 40, 50] : [5, 8, 10, 12, 15, 20, 25]), c = rnd10(rand(30, 400), o), T = p * c;
      return { T: T, p: p, c: c, f: ['бидон', 'бидона', 'бидонов'], q: 'Сколько бидонов потребовалось?',
        text: 'В цистерне ' + fmt(T) + ' л молока. Его разлили в бидоны по ' + p + ' л. Сколько бидонов потребовалось?' }; },
    function (o) { var p = pick(o.round ? [50, 100, 200] : [40, 60, 80, 120, 150, 250]), c = rnd10(rand(15, 200), o), T = p * c;
      return { T: T, p: p, c: c, f: ['билет', 'билета', 'билетов'], q: 'Сколько билетов купили?',
        text: 'На ' + fmt(T) + ' руб. купили билеты в театр по ' + p + ' руб. Сколько билетов купили?' }; },
    function (o) { var p = rnd10(rand(12, 80), o), c = rnd10(rand(7, 60), o), T = p * c;
      return { T: T, p: p, c: c, f: ['день', 'дня', 'дней'], q: 'За сколько дней отремонтируют дорогу?',
        text: 'Дорожные рабочие ремонтируют по ' + p + ' м дороги в день. За сколько дней они отремонтируют ' + fmt(T) + ' м дороги?' }; },
    function (o) { var p = pick([100, 200, 500, 1000]), c = rnd10(rand(12, 300), o), T = p * c;
      return { T: T, p: p, c: c, f: ['купюра', 'купюры', 'купюр'], q: 'Сколько купюр выдал кассир?',
        text: 'Кассир выдал ' + fmt(T) + ' руб. купюрами по ' + fmt(p) + ' руб. Сколько купюр выдал кассир?' }; },
    function (o) { var p = pick([5, 8, 10, 12, 15]), c = rnd10(rand(40, 250), o), T = p * c;
      return { T: T, p: p, c: c, f: ['машина', 'машины', 'машин'], q: 'Сколько машин понадобилось?',
        text: 'С плантации собрали ' + fmt(T) + ' т сахарной свёклы. Её вывезли на машинах грузоподъёмностью по ' + p + ' т. Сколько машин понадобилось?' }; }
  ];
  reg('dvPContent', function (o) {
    var s = pick(CONTENT)(o);
    return {
      kind: 'num', html: s.text, answer: s.c,
      hint: 'Надо узнать, сколько раз одна порция содержится во всём количестве. Какое действие для этого нужно?',
      explain: steps([s.q + ' ' + fmt(s.T) + ' : ' + fmt(s.p) + ' = ' + fmt(s.c)], unit(s.c, s.f))
    };
  });

  /* --- часть от числа и остаток --- */
  var PART_ACC = { 2: 'половину', 3: 'третью часть', 4: 'четвёртую часть', 5: 'пятую часть', 6: 'шестую часть', 8: 'восьмую часть', 10: 'десятую часть' };
  var PART_NAME = { 2: 'половина', 3: 'третья часть', 4: 'четвёртая часть', 5: 'пятая часть', 6: 'шестая часть', 8: 'восьмая часть', 10: 'десятая часть' };
  /* lo–hi: разумные границы для всего количества; m: шаг (кратность) */
  var PARTS_ST = [
    { lo: 200, hi: 960, m: 1, f: ['страница', 'страницы', 'страниц'], a: 'Сколько страниц прочитал?', b: 'Сколько страниц осталось?',
      t: function (T, n) { return 'В книге ' + fmt(T) + ' ' + R.plural(T, ['страница', 'страницы', 'страниц']) + '. Ученик прочитал ' + PART_ACC[n] + ' книги. Сколько страниц ему осталось прочитать?'; } },
    { lo: 600, hi: 6000, m: 10, f: ['кг', 'кг', 'кг'], a: 'Сколько килограммов отправили?', b: 'Сколько килограммов осталось?',
      t: function (T, n) { var x = PART_ACC[n]; return 'На складе было ' + fmt(T) + ' кг картофеля. ' + x.charAt(0).toUpperCase() + x.slice(1) + ' картофеля отправили в магазин. Сколько килограммов картофеля осталось на складе?'; } },
    { lo: 240, hi: 1800, m: 10, f: ['км', 'км', 'км'], a: 'Сколько километров проехал?', b: 'Сколько километров осталось?',
      t: function (T, n) { return 'До города ' + fmt(T) + ' км. Поезд проехал ' + PART_ACC[n] + ' пути. Сколько километров ему осталось проехать?'; } },
    { lo: 300, hi: 3000, m: 10, f: ['кг', 'кг', 'кг'], a: 'Сколько килограммов продал?', b: 'Сколько килограммов осталось?',
      t: function (T, n) { return 'Фермер вырастил ' + fmt(T) + ' кг моркови и продал ' + PART_ACC[n] + ' урожая. Сколько килограммов моркови у него осталось?'; } },
    { lo: 2000, hi: 30000, m: 100, f: ['л', 'л', 'л'], a: 'Сколько литров слили?', b: 'Сколько литров осталось?',
      t: function (T, n) { return 'В бассейне было ' + fmt(T) + ' л воды. Из бассейна слили ' + PART_ACC[n] + ' воды. Сколько литров воды осталось в бассейне?'; } },
    { lo: 240, hi: 1200, m: 1, f: ['бревно', 'бревна', 'брёвен'], a: 'Сколько брёвен отправил на лесопилку?', b: 'Сколько брёвен осталось?',
      t: function (T, n) { var x = PART_NAME[n]; return 'Лесозаготовители подготовили ' + fmt(T) + ' ' + R.plural(T, ['бревно', 'бревна', 'брёвен']) + '. ' + x.charAt(0).toUpperCase() + x.slice(1) + ' всех брёвен отправили на лесопилку. Сколько брёвен осталось?'; } }
  ];
  reg('dvPPart', function (o) {
    var n = pick([2, 3, 4, 5, 6, 8, 10]), st = pick(PARTS_ST), m = o.round ? Math.max(10, st.m) : st.m, lo = Math.ceil(st.lo / n / m), hi = Math.floor(st.hi / n / m);
    var part = rand(lo, Math.max(lo, hi)) * m, T = part * n, rest = T - part;
    return {
      kind: 'num', html: st.t(T, n), answer: rest,
      hint: 'Найти одну из ' + n + ' равных частей — значит разделить число на ' + n + '. Потом подумай, что нужно найти.',
      explain: steps([st.a + ' ' + fmt(T) + ' : ' + n + ' = ' + fmt(part), st.b + ' ' + fmt(T) + ' − ' + fmt(part) + ' = ' + fmt(rest)], unit(rest, st.f))
    };
  });

  /* --- неизвестное делимое в задаче --- */
  var UNKDIV = [
    function () { var k = rand(12, 60), q = poRand(15, 80), a = k * q;
      return { a: a, k: k, q: q, f: ['деталь', 'детали', 'деталей'], step: 'Сколько деталей было у мастера?',
        text: 'Мастер разложил детали поровну в ' + unit(k, ['коробку', 'коробки', 'коробок']) + '. В каждой коробке оказалось по ' + q + ' ' + R.plural(q, ['детали', 'детали', 'деталей']) + '. Сколько деталей было у мастера?' }; },
    function () { var k = rand(12, 90), q = rand(30, 400), a = k * q;
      return { a: a, k: k, q: q, f: ['число', 'числа', 'чисел'], step: 'Какое число задумали?', raw: true,
        text: 'Задумали число. Его разделили на ' + k + ' и получили ' + q + '. Какое число задумали?' }; },
    function () { var k = rand(15, 80), q = rand(12, 40), a = k * q;
      return { a: a, k: k, q: q, f: ['кг', 'кг', 'кг'], step: 'Сколько килограммов яблок собрали школьники?',
        text: 'Школьники собрали яблоки и разложили их поровну в ' + unit(k, ['ящик', 'ящика', 'ящиков']) + '. В каждом ящике оказалось по ' + q + ' кг. Сколько килограммов яблок собрали школьники?' }; },
    function () { var k = rand(12, 60), q = rand(15, 90) * 5, a = k * q;
      return { a: a, k: k, q: q, f: ['м', 'м', 'м'], step: 'Какова длина дороги в метрах?',
        text: 'Дорогу разделили на ' + unit(k, ['участок', 'участка', 'участков']) + ' одинаковой длины. Длина каждого участка — ' + q + ' м. Какова длина всей дороги в метрах?' }; },
    function () { var k = rand(12, 40), q = poRand(20, 60), a = k * q;
      return { a: a, k: k, q: q, f: ['книга', 'книги', 'книг'], step: 'Сколько всего книг расставил библиотекарь?',
        text: 'Библиотекарь расставил книги поровну на ' + unit(k, ['полке', 'полках', 'полках']) + ', по ' + q + ' ' + R.plural(q, ['книге', 'книги', 'книг']) + ' на каждой. Сколько всего книг он расставил?' }; },
    function () { var k = rand(6, 30), q = rand(12, 90) * 10, a = k * q;
      return { a: a, k: k, q: q, f: ['руб.', 'руб.', 'руб.'], step: 'Какая сумма была поделена?',
        text: 'Некоторую сумму денег поровну поделили между ' + unit(k, ['учеником', 'учениками', 'учениками']) + ', и каждому досталось по ' + q + ' руб. Какая сумма была поделена?' }; }
  ];
  reg('dvPUnkDividend', function (o) {
    var s = pick(UNKDIV)();
    return {
      kind: 'num', html: s.text, answer: s.a,
      hint: 'Здесь известны делитель и частное. Как найти делимое?',
      explain: 'Неизвестно делимое: оно равно частному, умноженному на делитель.<br>' + steps([s.step + ' ' + fmt(s.q) + ' × ' + fmt(s.k) + ' = ' + fmt(s.a), 'Проверка: ' + fmt(s.a) + ' : ' + fmt(s.k) + ' = ' + fmt(s.q)], s.raw ? fmt(s.a) : unit(s.a, s.f))
    };
  });

  /* --- неизвестный делитель в задаче: сколько получателей / порций --- */
  var UNKDIVR = [
    function () { var q = rand(20, 45), k = rand(12, 40), a = k * q;
      return { a: a, k: k, q: q, f: ['класс', 'класса', 'классов'], step: 'Сколько классов в школе?',
        text: 'Школа получила ' + unit(a, ['учебник', 'учебника', 'учебников']) + ' и раздала их поровну по классам. Каждому классу досталось по ' + q + ' ' + R.plural(q, ['учебнику', 'учебника', 'учебников']) + '. Сколько классов в школе?' }; },
    function () { var q = poRand(35, 55), k = rand(8, 40), a = k * q;
      return { a: a, k: k, q: q, f: ['автобус', 'автобуса', 'автобусов'], step: 'Сколько автобусов понадобилось?',
        text: 'Автобусами перевезли ' + unit(a, ['туриста', 'туриста', 'туристов']) + ', по ' + q + ' ' + R.plural(q, ['человеку', 'человека', 'человек']) + ' в каждом автобусе. Сколько автобусов понадобилось?' }; },
    function () { var q = rand(2, 9) * 5, k = rand(20, 200), a = k * q;
      return { a: a, k: k, q: q, f: ['мешок', 'мешка', 'мешков'], step: 'Сколько мешков вывезли?',
        text: 'Со склада вывезли ' + fmt(a) + ' кг муки в мешках по ' + q + ' кг. Сколько мешков вывезли?' }; },
    function () { var q = rand(2, 9) * 2, k = rand(20, 120), a = k * q;
      return { a: a, k: k, q: q, f: ['секция', 'секции', 'секций'], step: 'Сколько секций получилось?',
        text: 'Забор длиной ' + fmt(a) + ' м разделили на секции по ' + q + ' м. Сколько секций получилось?' }; },
    function () { var q = rand(12, 60) * 5, k = rand(8, 60), a = k * q;
      return { a: a, k: k, q: q, f: ['рабочий', 'рабочих', 'рабочих'], step: 'Сколько рабочих работало в мастерской?',
        text: 'Мастерская изготовила за месяц ' + unit(a, ['деталь', 'детали', 'деталей']) + '. Каждый рабочий сделал за месяц по ' + q + ' ' + R.plural(q, ['детали', 'детали', 'деталей']) + '. Сколько рабочих работало в мастерской?' }; },
    function () { var q = rand(8, 20), k = rand(9, 60), a = k * q;
      return { a: a, k: k, q: q, f: ['рейс', 'рейса', 'рейсов'], step: 'Сколько рейсов сделал самосвал?',
        text: 'Самосвал вывез со стройки ' + fmt(a) + ' т песка. За один рейс он вывозил по ' + q + ' т. Сколько рейсов сделал самосвал?' }; }
  ];
  reg('dvPUnkDivisor', function (o) {
    var s = pick(UNKDIVR)();
    return {
      kind: 'num', html: s.text, answer: s.k,
      hint: 'Известны делимое и частное. Как найти делитель?',
      explain: 'Неизвестен делитель: он равен делимому, делённому на частное.<br>' + steps([s.step + ' ' + fmt(s.a) + ' : ' + fmt(s.q) + ' = ' + fmt(s.k), 'Проверка: ' + fmt(s.q) + ' × ' + fmt(s.k) + ' = ' + fmt(s.a)], unit(s.k, s.f))
    };
  });

  /* --- две покупки (две порции): считаем «по содержанию» дважды и складываем / вычитаем --- */
  var LOTS = [
    function () { var p1 = rand(4, 30) * 10, p2 = rand(4, 30) * 10, c1 = rand(5, 60), c2 = rand(5, 60);
      return { A: p1 * c1, B: p2 * c2, p1: p1, p2: p2, c1: c1, c2: c2, u1: 'Сколько метров первой ткани?', u2: 'Сколько метров второй ткани?', f: ['метр', 'метра', 'метров'],
        head: function (A, B) { return 'На ' + fmt(A) + ' руб. купили ткань по ' + p1 + ' руб. за метр, а на ' + fmt(B) + ' руб. — другую ткань по ' + p2 + ' руб. за метр. '; },
        sum: 'Сколько всего метров ткани купили?', diff: 'На сколько метров больше купили первой ткани, чем второй?' }; },
    function () { var p1 = pick([2, 3, 4, 5, 10]), p2 = pick([2, 3, 4, 5, 10]), c1 = rand(30, 300), c2 = rand(30, 300);
      return { A: p1 * c1, B: p2 * c2, p1: p1, p2: p2, c1: c1, c2: c2, u1: 'Сколько пакетов с яблоками?', u2: 'Сколько пакетов с грушами?', f: ['пакет', 'пакета', 'пакетов'],
        head: function (A, B) { return 'В магазине ' + fmt(A) + ' кг яблок разложили в пакеты по ' + p1 + ' кг, а ' + fmt(B) + ' кг груш — в пакеты по ' + p2 + ' кг. '; },
        sum: 'Сколько всего пакетов получилось?', diff: 'На сколько пакетов с яблоками получилось больше, чем пакетов с грушами?' }; },
    function () { var v1 = rand(6, 12) * 10, v2 = rand(6, 12) * 10, c1 = rand(3, 15), c2 = rand(3, 15);
      return { A: v1 * c1, B: v2 * c2, p1: v1, p2: v2, c1: c1, c2: c2, u1: 'Сколько часов был в пути первый поезд?', u2: 'Сколько часов был в пути второй поезд?', f: ['час', 'часа', 'часов'],
        head: function (A, B) { return 'Первый поезд прошёл ' + fmt(A) + ' км со скоростью ' + v1 + ' км/ч, а второй — ' + fmt(B) + ' км со скоростью ' + v2 + ' км/ч. '; },
        sum: 'Сколько всего часов были в пути оба поезда вместе?', diff: 'На сколько часов дольше был в пути первый поезд?' }; },
    function () { var p1 = rand(3, 9) * 100, p2 = rand(2, 8) * 50, c1 = rand(5, 40), c2 = rand(5, 40);
      return { A: p1 * c1, B: p2 * c2, p1: p1, p2: p2, c1: c1, c2: c2, u1: 'Сколько мячей купил тренер?', u2: 'Сколько скакалок купил тренер?', f: ['предмет', 'предмета', 'предметов'], fu1: ['мяч', 'мяча', 'мячей'], fu2: ['скакалка', 'скакалки', 'скакалок'],
        head: function (A, B) { return 'Тренер купил на ' + fmt(A) + ' руб. мячи по ' + p1 + ' руб., а на ' + fmt(B) + ' руб. — скакалки по ' + p2 + ' руб. '; },
        sum: 'Сколько всего предметов купил тренер?', diff: 'На сколько мячей тренер купил больше, чем скакалок?' }; },
    function () { var p1 = poRand(20, 50), p2 = poRand(20, 50), c1 = rand(5, 40), c2 = rand(5, 40);
      return { A: p1 * c1, B: p2 * c2, p1: p1, p2: p2, c1: c1, c2: c2, u1: 'Сколько рейсов сделал первый автобус?', u2: 'Сколько рейсов сделал второй автобус?', f: ['рейс', 'рейса', 'рейсов'],
        head: function (A, B) { var tf = ['туриста', 'туриста', 'туристов'], hf = ['человеку', 'человека', 'человек']; return 'Первый экскурсионный автобус перевёз ' + unit(A, tf) + ', по ' + p1 + ' ' + R.plural(p1, hf) + ' за рейс, а второй — ' + unit(B, tf) + ', по ' + p2 + ' ' + R.plural(p2, hf) + ' за рейс. '; },
        sum: 'Сколько всего рейсов сделали два автобуса?', diff: 'На сколько рейсов больше сделал первый автобус?' }; }
  ];
  reg('dvPTwoLots', function (o) {
    var op = o.op || pick(['sum', 'diff']), st, g = 0;
    do { st = pick(LOTS)(); g++; } while (((op === 'diff' && st.c1 <= st.c2) || st.p1 === st.p2) && g < 100);
    if (op === 'diff' && st.c1 <= st.c2) op = 'sum';
    var ans = op === 'sum' ? st.c1 + st.c2 : st.c1 - st.c2;
    var lines = [st.u1 + ' ' + fmt(st.A) + ' : ' + fmt(st.p1) + ' = ' + fmt(st.c1), st.u2 + ' ' + fmt(st.B) + ' : ' + fmt(st.p2) + ' = ' + fmt(st.c2),
      (op === 'sum' ? 'Сколько всего? ' + fmt(st.c1) + ' + ' + fmt(st.c2) : 'На сколько больше? ' + fmt(st.c1) + ' − ' + fmt(st.c2)) + ' = ' + fmt(ans)];
    return {
      kind: 'num', html: st.head(st.A, st.B) + (op === 'sum' ? st.sum : st.diff), answer: ans,
      hint: 'Сначала для каждой части узнай, сколько раз одна порция содержится во всём количестве. Потом ' + (op === 'sum' ? 'сложи' : 'вычти') + ' результаты.',
      explain: steps(lines, op === 'sum' ? unit(ans, st.f) : unit(ans, st.fu1 || st.f))
    };
  });

  /* --- монеты --- */
  reg('dvPCoins', function (o) {
    var ty = o.type || pick(['count', 'exchange']), c, n, T;
    if (ty === 'count') {
      c = pick([2, 5, 10]); n = rand(100, 900); T = c * n;
      var txt = pick([
        'Кассир выдал ' + fmt(T) + ' руб. монетами достоинством ' + c + ' руб. Сколько монет выдал кассир?',
        'Сумму ' + fmt(T) + ' руб. набрали монетами по ' + c + ' руб. Сколько монет потребовалось?'
      ]);
      return {
        kind: 'num', html: txt, answer: n,
        hint: 'Достоинство монеты — сколько рублей она стоит. Сколько раз это число содержится во всей сумме?',
        explain: steps(['Сколько монет? ' + fmt(T) + ' : ' + c + ' = ' + fmt(n)], unit(n, ['монета', 'монеты', 'монет']))
      };
    }
    var c1, c2, n1, g = 0;
    do { c1 = pick([5, 10, 2]); c2 = pick([2, 5, 10]); n1 = rand(20, 400); T = c1 * n1; g++; } while ((c1 === c2 || T % c2 !== 0) && g < 200);
    var n2 = T / c2;
    return {
      kind: 'num', html: 'В копилке лежат ' + unit(n1, ['монета', 'монеты', 'монет']) + ' достоинством ' + c1 + ' руб. Сколько монет достоинством ' + c2 + ' руб. нужно, чтобы набрать такую же сумму?', answer: n2,
      hint: 'Сначала узнай, сколько рублей в копилке. Потом узнай, сколько раз по ' + c2 + ' руб. содержится в этой сумме.',
      explain: steps(['Сколько рублей в копилке? ' + fmt(n1) + ' × ' + c1 + ' = ' + fmt(T), 'Сколько монет по ' + c2 + ' руб. нужно? ' + fmt(T) + ' : ' + c2 + ' = ' + fmt(n2)], unit(n2, ['монета', 'монеты', 'монет']))
    };
  });

  /* --- сложили всё и разделили на n --- */
  function three(T, minFrac) {
    var A, B, C, g = 0, m = T % 1000 === 0 ? 1000 : T % 100 === 0 ? 100 : T % 10 === 0 ? 10 : 5;
    do {
      A = Math.round(T * (0.35 + Math.random() * 0.25) / m) * m; B = Math.round(T * (0.2 + Math.random() * 0.2) / m) * m; C = T - A - B; g++;
    } while ((C < T * 0.08 || A < 1 || B < 1 || A === B) && g < 200);
    return [A, B, C];
  }
  var SHARE = [
    { nn: [100, 120, 150, 200, 250, 300], per: [250, 450], mult: 10, ask: 'граммов', f: ['грамм', 'грамма', 'граммов'],
      t: function (n, x) { return 'За день ' + n + ' человек съели ' + fmt(x[0]) + ' г белого хлеба, ' + fmt(x[1]) + ' г чёрного хлеба и ' + fmt(x[2]) + ' г булочек. Сколько граммов хлеба и булочек в среднем съел за день один человек?'; }, q: 'Сколько граммов съел один человек?' },
    { nn: [40, 60, 75, 80, 90, 120], per: [3, 9], mult: 1, ask: 'кг', f: ['кг', 'кг', 'кг'],
      t: function (n, x) { return 'Ученики трёх классов сдали ' + fmt(x[0]) + ' кг, ' + fmt(x[1]) + ' кг и ' + fmt(x[2]) + ' кг макулатуры. Всего в сборе участвовали ' + n + ' человек. Сколько килограммов макулатуры в среднем сдал один человек?'; }, q: 'Сколько килограммов сдал один человек?' },
    { nn: [24, 30, 36, 40, 48, 60, 75, 80], per: [20, 40], mult: 1, ask: 'л', f: ['л', 'л', 'л'],
      t: function (n, x) { return 'На ферме утром надоили ' + fmt(x[0]) + ' л молока, днём — ' + fmt(x[1]) + ' л, а вечером — ' + fmt(x[2]) + ' л. Всё молоко разлили поровну в ' + unit(n, ['бидон', 'бидона', 'бидонов']) + '. Сколько литров молока в каждом бидоне?'; }, q: 'Сколько литров в одном бидоне?' },
    { nn: [12, 15, 16, 20, 24, 25, 30], per: [40, 120], mult: 5, ask: 'саженцев', f: ['саженец', 'саженца', 'саженцев'],
      t: function (n, x) { return 'Три бригады посадили ' + fmt(x[0]) + ', ' + fmt(x[1]) + ' и ' + fmt(x[2]) + ' саженцев. Все саженцы поровну распределили между ' + unit(n, ['улицей', 'улицами', 'улицами']) + '. Сколько саженцев посадили на каждой улице?'; }, q: 'Сколько саженцев на одной улице?' },
    { nn: [12, 15, 16, 18, 20, 24, 30, 36], per: [100, 300], mult: 5, ask: 'книг', f: ['книга', 'книги', 'книг'],
      t: function (n, x) { return 'Библиотека получила книги тремя партиями: ' + fmt(x[0]) + ', ' + fmt(x[1]) + ' и ' + fmt(x[2]) + ' книг. Все книги поровну раздали ' + unit(n, ['школе', 'школам', 'школам']) + '. Сколько книг получила каждая школа?'; }, q: 'Сколько книг получила одна школа?' },
    { nn: [12, 15, 16, 18, 20, 24, 30], per: [60, 200], mult: 5, ask: 'деталей', f: ['деталь', 'детали', 'деталей'],
      t: function (n, x) { return 'За смену на заводе изготовили ' + fmt(x[0]) + ' деталей на первом станке, ' + fmt(x[1]) + ' — на втором и ' + fmt(x[2]) + ' — на третьем. Все детали разложили поровну в ' + unit(n, ['ящик', 'ящика', 'ящиков']) + '. Сколько деталей в каждом ящике?'; }, q: 'Сколько деталей в одном ящике?' }
  ];
  reg('dvPTotalShare', function (o) {
    var st = pick(SHARE), n = pick(st.nn), per = rand(st.per[0], st.per[1]);
    if (st.mult > 1) per = Math.round(per / st.mult) * st.mult;
    var T = n * per, x = three(T);
    return {
      kind: 'num', html: st.t(n, x), answer: per,
      hint: 'Сначала найди, сколько всего получилось, а потом раздели на число человек (ящиков, школ…).',
      explain: steps(['Сколько всего? ' + fmt(x[0]) + ' + ' + fmt(x[1]) + ' + ' + fmt(x[2]) + ' = ' + fmt(T), st.q + ' ' + fmt(T) + ' : ' + n + ' = ' + fmt(per)], unit(per, st.f))
    };
  });

  /* --- деление с остатком в задаче --- */
  var REM = [
    { p: [30, 55], q: [4, 30], f1: ['автобус', 'автобуса', 'автобусов'], f2: ['ученик', 'ученика', 'учеников'], l1: 'заполнили полностью автобусов', l2: 'едут в неполном автобусе',
      t: function (T, p) { return 'На экскурсию едут ' + unit(T, ['ученик', 'ученика', 'учеников']) + '. В один автобус помещается ' + unit(p, ['человек', 'человека', 'человек']) + '. Сколько автобусов заполнят полностью и сколько учеников поедут в неполностью заполненном автобусе?'; },
      s1: 'Сколько автобусов заполнят полностью?', s2: 'Сколько учеников поедут в неполном автобусе?' },
    { p: [12, 12], q: [20, 300], f1: ['коробка', 'коробки', 'коробок'], f2: ['яйцо', 'яйца', 'яиц'], l1: 'полных коробок', l2: 'яиц осталось',
      t: function (T, p) { return 'В магазин привезли ' + unit(T, ['яйцо', 'яйца', 'яиц']) + '. Их укладывают в коробки по ' + p + ' штук. Сколько получится полных коробок и сколько яиц останется?'; },
      s1: 'Сколько полных коробок?', s2: 'Сколько яиц останется?' },
    { p: [18, 45], q: [12, 90], f1: ['полка', 'полки', 'полок'], f2: ['книга', 'книги', 'книг'], l1: 'заполненных полок', l2: 'книг на неполной полке',
      t: function (T, p) { return 'В библиотеке ' + unit(T, ['книгу', 'книги', 'книг']) + ' расставляют на полки по ' + p + ' ' + R.plural(p, ['книге', 'книги', 'книг']) + ' на каждую. Сколько полок заполнят полностью и сколько книг окажется на последней, неполной полке?'; },
      s1: 'Сколько полок заполнят полностью?', s2: 'Сколько книг окажется на неполной полке?' },
    { p: [25, 50], q: [30, 200], f1: ['мешок', 'мешка', 'мешков'], f2: ['кг', 'кг', 'кг'], l1: 'полных мешков', l2: 'кг осталось',
      t: function (T, p) { return 'На складе ' + fmt(T) + ' кг сахарного песка. Его насыпают в мешки по ' + p + ' кг. Сколько получится полных мешков и сколько килограммов песка останется?'; },
      s1: 'Сколько полных мешков?', s2: 'Сколько килограммов останется?' },
    { p: [11, 25], q: [3, 20], f1: ['команда', 'команды', 'команд'], f2: ['школьник', 'школьника', 'школьников'], l1: 'полных команд', l2: 'школьников не вошло в команды',
      t: function (T, p) { return 'На спортивный праздник собрали ' + unit(T, ['школьника', 'школьника', 'школьников']) + ' и разбивают их на команды по ' + p + ' ' + R.plural(p, ['человеку', 'человека', 'человек']) + '. Сколько получится полных команд и сколько школьников не войдёт в команды?'; },
      s1: 'Сколько полных команд?', s2: 'Сколько школьников не войдёт в команды?' },
    { p: [6, 9], q: [40, 300], f1: ['платье', 'платья', 'платьев'], f2: ['м', 'м', 'м'], l1: 'платьев', l2: 'м ткани осталось',
      t: function (T, p) { return 'Из ' + fmt(T) + ' м ткани шьют платья, расходуя на каждое по ' + p + ' м. Сколько платьев получится и сколько метров ткани останется?'; },
      s1: 'Сколько платьев получится?', s2: 'Сколько метров ткани останется?' }
  ];
  reg('dvPRem', function (o) {
    var st = pick(REM), p = poRand(st.p[0], st.p[1]), q = rand(st.q[0], st.q[1]), r = rand(1, p - 1), T = p * q + r;
    if (st.p[0] === st.p[1]) p = st.p[0];
    T = p * q + r;
    var text = st.t(T, p);
    return {
      kind: 'nums', html: text, fields: [{ label: st.l1 }, { label: st.l2 }], answer: [q, r],
      hint: 'Раздели с остатком: частное покажет число полных порций, а остаток — сколько осталось.',
      explain: steps([st.s1 + ' Делим с остатком: ' + fmt(T) + ' : ' + p + ' = ' + remTxt(q, r), 'Проверка: ' + p + ' × ' + fmt(q) + ' + ' + r + ' = ' + fmt(p * q) + ' + ' + r + ' = ' + fmt(T), st.s2 + ' Остаток: ' + r], fmt(q) + ' и ' + fmt(r))
    };
  });

  /* --- нужно ещё одну порцию: q + 1 --- */
  var REMUP = [
    { p: [30, 55], q: [4, 40], f: ['автобус', 'автобуса', 'автобусов'], s: 'Сколько автобусов нужно?', last: 'человек',
      t: function (T, p) { return 'Нужно перевезти ' + unit(T, ['человека', 'человека', 'человек']) + '. В один автобус помещается ' + p + ' ' + R.plural(p, ['человек', 'человека', 'человек']) + '. Сколько автобусов надо заказать, чтобы перевезти всех?'; } },
    { p: [5, 8], q: [40, 300], f: ['рейс', 'рейса', 'рейсов'], s: 'Сколько рейсов нужно?', last: 'т',
      t: function (T, p) { return 'Строителям нужно вывезти ' + fmt(T) + ' т строительного мусора. За один рейс самосвал вывозит ' + p + ' т. Сколько рейсов должен сделать самосвал?'; } },
    { p: [12, 36], q: [30, 250], f: ['коробка', 'коробки', 'коробок'], s: 'Сколько коробок нужно?', last: 'штук',
      t: function (T, p) { return 'Для упаковки ' + unit(T, ['карандаша', 'карандашей', 'карандашей']) + ' используют коробки, в каждую из которых входит по ' + p + ' ' + R.plural(p, ['карандашу', 'карандаша', 'карандашей']) + '. Сколько коробок потребуется?'; } },
    { p: [20, 45], q: [4, 25], f: ['группа', 'группы', 'групп'], s: 'Сколько групп получится?', last: 'человек',
      t: function (T, p) { return 'Для экскурсии ' + unit(T, ['ребёнка', 'ребёнка', 'детей']) + ' разделили на группы, в каждой — не больше ' + p + ' человек. Сколько групп получилось?'; } },
    { p: [8, 15], q: [30, 250], f: ['подъём', 'подъёма', 'подъёмов'], s: 'Сколько подъёмов нужно?', last: 'ящиков',
      t: function (T, p) { return 'Грузовой лифт за один подъём поднимает не больше ' + p + ' ящиков. Сколько подъёмов надо сделать, чтобы поднять ' + unit(T, ['ящик', 'ящика', 'ящиков']) + '?'; } },
    { p: [50, 100], q: [8, 60], f: ['пачка', 'пачки', 'пачек'], s: 'Сколько пачек нужно купить?', last: 'конвертов',
      t: function (T, p) { return 'Школе нужно ' + unit(T, ['конверт', 'конверта', 'конвертов']) + '. Конверты продают пачками по ' + p + ' штук. Сколько пачек надо купить?'; } }
  ];
  reg('dvPRemUp', function (o) {
    var st = pick(REMUP), p = poRand(st.p[0], st.p[1]), q = rand(st.q[0], st.q[1]), r = rand(1, p - 1), T = p * q + r;
    if (st.p[0] === 50) { p = pick([50, 100]); r = rand(1, p - 1); T = p * q + r; }
    return {
      kind: 'num', html: st.t(T, p), answer: q + 1,
      hint: 'Раздели с остатком. Если остаток не нуль, то для оставшихся тоже нужна ещё одна порция.',
      explain: steps(['Делим с остатком: ' + fmt(T) + ' : ' + p + ' = ' + remTxt(q, r) + '. Проверка: ' + p + ' × ' + fmt(q) + ' + ' + r + ' = ' + fmt(T), 'Полных порций ' + fmt(q) + ', но остались ещё ' + r + ' — для них нужна ещё одна. ' + st.s + ' ' + fmt(q) + ' + 1 = ' + fmt(q + 1)], unit(q + 1, st.f))
    };
  });

  /* --- смешанные задачи на умножение и деление (урок 49) --- */
  var MIX = [
    function () { var b = pick([5, 10, 20, 25]), a = pick([50, 100, 150, 200, 250]), n = rand(12, 60), tot = n * a, c = tot / b;
      if (tot % b) return null;
      return { lines: ['Сколько килограммов яблок во всех ящиках? ' + n + ' × ' + a + ' = ' + fmt(tot), 'Сколько пакетов получилось? ' + fmt(tot) + ' : ' + b + ' = ' + fmt(c)], ans: c, f: ['пакет', 'пакета', 'пакетов'],
        text: 'В ' + unit(n, ['ящике', 'ящиках', 'ящиках']) + ' по ' + a + ' кг яблок. Все яблоки разложили в пакеты по ' + b + ' кг. Сколько пакетов получилось?' }; },
    function () { var d1 = rand(6, 25), per = rand(15, 90) * 10, d2 = rand(6, 30), T = d1 * per;
      if (d1 === d2) return null;
      return { lines: ['Сколько деталей выпускают за один день? ' + fmt(T) + ' : ' + d1 + ' = ' + fmt(per), 'Сколько деталей выпустят за ' + d2 + ' ' + R.plural(d2, ['день', 'дня', 'дней']) + '? ' + fmt(per) + ' × ' + d2 + ' = ' + fmt(per * d2)], ans: per * d2, f: ['деталь', 'детали', 'деталей'],
        text: 'Завод за ' + unit(d1, ['день', 'дня', 'дней']) + ' выпустил ' + unit(T, ['деталь', 'детали', 'деталей']) + '. Сколько деталей выпустит завод за ' + unit(d2, ['день', 'дня', 'дней']) + ' при такой же ежедневной выработке?' }; },
    function () { var a = pick([12, 15, 16, 18, 20, 24]), b = pick([5, 6, 8, 10, 12]), n = rand(10, 80), tot = n * a * b;
      return { lines: ['Сколько тетрадей получится? ' + fmt(tot) + ' : ' + a + ' = ' + fmt(tot / a), 'Сколько пачек? ' + fmt(tot / a) + ' : ' + b + ' = ' + fmt(n)], ans: n, f: ['пачка', 'пачки', 'пачек'],
        text: 'Из ' + unit(tot, ['листа', 'листов', 'листов']) + ' бумаги сшили тетради по ' + a + ' ' + R.plural(a, ['листу', 'листа', 'листов']) + ', а тетради упаковали в пачки по ' + b + ' штук. Сколько пачек получилось?' }; },
    function () { var n = rand(6, 24), book = Math.random() < 0.5, price = book ? rand(40, 100) * 5 : rand(4, 14) * 5, S = n * price, m = rand(8, 40);
      if (n === m) return null;
      var w1 = book ? ['учебник', 'учебника', 'учебников'] : ['тетрадь', 'тетради', 'тетрадей'], w2 = book ? ['такой учебник', 'таких учебника', 'таких учебников'] : ['такую тетрадь', 'такие тетради', 'таких тетрадей'];
      return { lines: ['Сколько стоит ' + (book ? 'один учебник' : 'одна тетрадь') + '? ' + fmt(S) + ' : ' + n + ' = ' + fmt(price), 'Сколько стоят ' + m + ' таких ' + (book ? 'учебников' : 'тетрадей') + '? ' + fmt(price) + ' × ' + m + ' = ' + fmt(price * m)], ans: price * m, f: ['руб.', 'руб.', 'руб.'],
        text: 'За ' + unit(n, w1) + ' заплатили ' + fmt(S) + ' руб. Сколько рублей надо заплатить за ' + unit(m, w2) + '?' }; },
    function () { var a = pick([2, 4, 5, 8, 10]), b = pick([6, 8, 10, 12]), n = rand(15, 120), tot = n * a * b;
      return { lines: ['Сколько коробок с гвоздями? ' + fmt(tot) + ' : ' + a + ' = ' + fmt(tot / a), 'Сколько ящиков? ' + fmt(tot / a) + ' : ' + b + ' = ' + fmt(n)], ans: n, f: ['ящик', 'ящика', 'ящиков'],
        text: 'На складе ' + fmt(tot) + ' кг гвоздей. Их расфасовали в коробки по ' + a + ' кг, а коробки уложили в ящики по ' + b + ' коробок. Сколько ящиков получилось?' }; }
  ];
  reg('dvPMix', function (o) {
    var st = null, g = 0;
    while (!st && g++ < 100) st = pick(MIX)();
    return {
      kind: 'num', html: st.text, answer: st.ans,
      hint: 'Реши в два действия. Сначала найди то, чего не хватает для ответа на главный вопрос.',
      explain: steps(st.lines, unit(st.ans, st.f))
    };
  });

  /* --- задачи на движение --- */
  var MOV = [
    { n: 'Теплоход', vb: 'прошёл', v: [24, 40], t: [6, 20], m: 1 },
    { n: 'Поезд', vb: 'прошёл', v: [60, 120], t: [3, 15], m: 10 },
    { n: 'Автобус', vb: 'проехал', v: [40, 70], t: [3, 10], m: 5 },
    { n: 'Велосипедист', vb: 'проехал', v: [12, 20], t: [2, 6], m: 1 },
    { n: 'Турист', vb: 'прошёл', v: [4, 6], t: [3, 8], m: 1 },
    { n: 'Самолёт', vb: 'пролетел', v: [600, 900], t: [2, 8], m: 50 }
  ];
  function movPick() { var m = pick(MOV), v = rand(m.v[0], m.v[1]), t = rand(m.t[0], m.t[1]); if (m.m > 1) v = Math.round(v / m.m) * m.m; return { m: m, v: v, t: t, S: v * t }; }
  reg('dvPMotion', function (o) {
    var ty = o.type || pick(['v', 't', 'two']), x = movPick();
    if (ty === 'v') {
      return {
        kind: 'num', html: x.m.n + ' ' + x.m.vb + ' ' + fmt(x.S) + ' км за ' + unit(x.t, ['час', 'часа', 'часов']) + '. С какой скоростью двигался ' + x.m.n.toLowerCase() + ' (в км/ч)?', answer: x.v,
        hint: 'Скорость — это расстояние, делённое на время.',
        explain: steps(['Скорость равна расстоянию, делённому на время: ' + fmt(x.S) + ' : ' + x.t + ' = ' + fmt(x.v)], fmt(x.v) + ' км/ч')
      };
    }
    if (ty === 't') {
      return {
        kind: 'num', html: x.m.n + ' двигался со скоростью ' + fmt(x.v) + ' км/ч и ' + x.m.vb + ' ' + fmt(x.S) + ' км. Сколько часов он был в пути?', answer: x.t,
        hint: 'Время — это расстояние, делённое на скорость.',
        explain: steps(['Время равно расстоянию, делённому на скорость: ' + fmt(x.S) + ' : ' + fmt(x.v) + ' = ' + x.t], unit(x.t, ['час', 'часа', 'часов']))
      };
    }
    var t1 = rand(2, 6), v1 = rand(6, 10) * 10;
    var S1 = v1 * t1, v2 = rand(4, 10) * 10, t2 = rand(2, 8), S2;
    if (v2 === v1) v2 = v1 === 40 ? 50 : 40;
    S2 = v2 * t2;
    return {
      kind: 'num', html: 'Автомобиль ехал ' + unit(t1, ['час', 'часа', 'часов']) + ' со скоростью ' + v1 + ' км/ч, а затем проехал ещё ' + fmt(S2) + ' км со скоростью ' + v2 + ' км/ч. Сколько всего часов автомобиль был в пути?', answer: t1 + t2,
      hint: 'Первое время известно. Второе время найди делением расстояния на скорость.',
      explain: steps(['Сколько часов ехал во второй раз? ' + fmt(S2) + ' : ' + v2 + ' = ' + t2, 'Сколько всего часов? ' + t1 + ' + ' + t2 + ' = ' + (t1 + t2)], unit(t1 + t2, ['час', 'часа', 'часов']))
    };
  });

  /* ================= выражение с делением (как в контрольной) ================= */
  reg('dvExpr', function (o) {
    var form = o.form || pick(['f1', 'f1', 'f2', 'f3']), b, q1, c, d, a, g = 0, z1, ans, lines, tx;
    do {
      b = rDiv(pick([2, 3]), true); q1 = rand(12, 99) * pick([1, 10, 10, 100]); c = rDiv(pick([2, 3]), true); d = pick([rand(2, 9) * 100, rand(10, 99) * 100, rand(10, 99) * 10]);
      a = q1 * b; g++;
    } while ((a > 2e7 || q1 * c > 5e6 || (form === 'f2' && q1 * c <= d)) && g < 200);
    var zk = Math.min(tz(a), tz(b)), divLine = zk > 0 ? fmt(a) + ' : ' + fmt(b) + ' = ' + fmt(a / p10(zk)) + ' : ' + fmt(b / p10(zk)) + ' = ' + fmt(q1) : fmt(a) + ' : ' + fmt(b) + ' = ' + fmt(q1);
    if (form === 'f3') {
      ans = d + q1; tx = fmt(d) + ' + ' + fmt(a) + ' : ' + fmt(b) + ' =';
      lines = ['Сначала деление: ' + divLine, 'Потом сложение: ' + fmt(d) + ' + ' + fmt(q1) + ' = ' + fmt(ans)];
    } else {
      var pr = q1 * c, sg = form === 'f1' ? '+' : '−'; ans = form === 'f1' ? pr + d : pr - d;
      tx = fmt(a) + ' : ' + fmt(b) + ' × ' + fmt(c) + ' ' + sg + ' ' + fmt(d) + ' =';
      lines = ['Деление и умножение — слева направо. Сначала деление: ' + divLine, 'Потом умножение: ' + fmt(q1) + ' × ' + fmt(c) + ' = ' + fmt(pr), 'Потом ' + (form === 'f1' ? 'сложение' : 'вычитание') + ': ' + fmt(pr) + ' ' + sg + ' ' + fmt(d) + ' = ' + fmt(ans)];
    }
    return {
      kind: 'num', html: 'Вычисли значение выражения: ' + expr(tx), answer: ans,
      hint: 'Сначала выполни умножение и деление по порядку слева направо, потом сложение или вычитание.',
      explain: steps(lines, fmt(ans))
    };
  });

  /* ================= составные задачи контрольной работы ================= */
  function capFirst(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function bigVeg() {
    var g = 0, A, m, n, w, X, Tot, S, P, W, ok = false;
    while (!ok && g++ < 3000) {
      A = rand(30, 150) * 10; m = pick([2, 3, 4]); n = pick([2, 3, 4, 5]); w = pick([10, 12, 15, 20, 25, 30]);
      X = A * m; Tot = A + X;
      if (Tot % n) continue;
      S = Tot / n; P = Tot - S;
      if (P % w) continue;
      W = P / w; ok = W >= 20 && W <= 400;
    }
    return {
      kind: 'num',
      html: 'В первую неделю собрали ' + fmt(A) + ' т картофеля, а во вторую — в ' + m + ' раза больше. ' + capFirst(PART_NAME[n]) + ' всего картофеля заложена на зимнее хранение, а остальной картофель отправлен на завод. В каждый вагон грузили по ' + w + ' т. Сколько вагонов потребовалось для перевозки картофеля на завод?',
      answer: W,
      hint: 'Сначала найди, сколько собрали за две недели. Потом — сколько отправили на завод. Последним действием раздели на груз одного вагона.',
      explain: steps(['Сколько тонн собрали во вторую неделю? ' + fmt(A) + ' × ' + m + ' = ' + fmt(X), 'Сколько тонн собрали за две недели? ' + fmt(A) + ' + ' + fmt(X) + ' = ' + fmt(Tot),
        'Сколько тонн заложили на хранение? ' + fmt(Tot) + ' : ' + n + ' = ' + fmt(S), 'Сколько тонн отправили на завод? ' + fmt(Tot) + ' − ' + fmt(S) + ' = ' + fmt(P), 'Сколько вагонов потребовалось? ' + fmt(P) + ' : ' + w + ' = ' + fmt(W)], unit(W, ['вагон', 'вагона', 'вагонов']))
    };
  }
  function bigFruit() {
    var g = 0, A, B2, m, n, Tot, Sd, Sold, price, S, ok = false;
    while (!ok && g++ < 3000) {
      m = pick([2, 3, 4]); n = pick([2, 4, 5, 10]); B2 = rand(20, 160) * 5; A = B2 * m; Tot = A + B2;
      if (Tot % n) continue;
      Sd = Tot / n; Sold = Tot - Sd; price = pick([20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100]); S = Sold * price; ok = S <= 300000;
    }
    return {
      kind: 'num',
      html: 'На ферме собрали в первый раз ' + fmt(A) + ' кг яблок, а во второй раз — в ' + m + ' раза меньше. ' + capFirst(PART_ACC[n]) + ' всех яблок отправили на сушильный завод, а остальные продали за ' + fmt(S) + ' руб. По какой цене (в рублях за килограмм) продавала ферма яблоки?',
      answer: price,
      hint: 'Найди, сколько килограммов яблок собрали всего и сколько из них продали. Цена — это стоимость, делённая на количество.',
      explain: steps(['Сколько килограммов собрали во второй раз? ' + fmt(A) + ' : ' + m + ' = ' + fmt(B2), 'Сколько килограммов собрали всего? ' + fmt(A) + ' + ' + fmt(B2) + ' = ' + fmt(Tot),
        'Сколько килограммов отправили на завод? ' + fmt(Tot) + ' : ' + n + ' = ' + fmt(Sd), 'Сколько килограммов продали? ' + fmt(Tot) + ' − ' + fmt(Sd) + ' = ' + fmt(Sold), 'Сколько рублей стоил килограмм? ' + fmt(S) + ' : ' + fmt(Sold) + ' = ' + fmt(price)], fmt(price) + ' руб. за килограмм')
    };
  }
  reg('dvPBig', function (o) { return (o.v === 'veg' || (o.v !== 'fruit' && Math.random() < 0.5)) ? bigVeg() : bigFruit(); });

  /* ================= «Найди ошибку» в записи деления (урок 51) ================= */
  var ERR_TXT = {
    lostzero: 'Потерян нуль в частном',
    digit: 'Одна из цифр частного подобрана неверно',
    bigrem: 'Остаток не меньше делителя',
    zeros: 'У делимого и делителя убрано разное число нулей',
    none: 'Ошибок нет'
  };
  function nulWord(k) { return k + ' ' + R.plural(k, ['нуль', 'нуля', 'нулей']); }
  reg('dvErr', function (o) {
    var ty = o.type || pick(['lostzero', 'digit', 'bigrem', 'zeros', 'none']), d, q, r, a, shown, rec, why, html, D, Q, k, ex, g = 0, s, i, z, sh;
    var hint = 'Проверь запись умножением. Ещё посмотри: сколько цифр должно быть в частном, меньше ли остаток делителя, поровну ли убрано нулей у делимого и делителя.';
    var sub = ty;
    if (ty === 'none') sub = pick(['plain', 'rem', 'zeros']);
    if (ty === 'lostzero' || ty === 'digit' || sub === 'plain') {
      d = rDiv(rand(1, 2)); q = rQuot(rand(3, 4), 'mid'); a = q * d;
      s = String(q).split('');
      if (ty === 'lostzero') {
        z = []; for (i = 1; i < s.length; i++) if (s[i] === '0') z.push(i);
        s.splice(pick(z), 1); shown = Number(s.join(''));
        why = 'Проверка умножением: ' + fmt(shown) + ' × ' + fmt(d) + ' = ' + fmt(shown * d) + ', а делимое — ' + fmt(a) + '. Не сошлось. ' +
          'Причина: в частном должно быть ' + digs(len(q)) + ', а у ученика только ' + len(shown) + '. Когда после сноса цифры получалось число меньше ' + fmt(d) + ', нужно было написать в частном 0. Правильно: ' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(q) + '.';
      } else if (ty === 'digit') {
        do { i = rand(0, s.length - 1); sh = Number(s[i]) + pick([1, 2, 3, -1, -2]); g++; } while ((sh < 0 || sh > 9 || (i === 0 && sh === 0)) && g < 50);
        s[i] = String(Math.min(9, Math.max(i === 0 ? 1 : 0, sh)));
        shown = Number(s.join('')); if (shown === q) { s[i] = String((Number(s[i]) + 1) % 10 || 1); shown = Number(s.join('')); }
        why = 'Проверка умножением: ' + fmt(shown) + ' × ' + fmt(d) + ' = ' + fmt(shown * d) + ', а делимое — ' + fmt(a) + '. Не сошлось: в частном верное число цифр, но одна из них подобрана неверно. Правильно: ' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(q) + '.';
      } else {
        shown = q;
        why = 'Проверка умножением: ' + fmt(q) + ' × ' + fmt(d) + ' = ' + fmt(a) + ' — получилось делимое. Нули в частном на месте, ошибок нет.';
      }
      rec = fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(shown);
    } else if (ty === 'bigrem' || sub === 'rem') {
      d = rDiv(rand(1, 2)); if (d < 3) d = rand(3, 9);
      q = rand(11, 99); r = rand(1, d - 1); a = d * q + r;
      if (ty === 'bigrem') {
        rec = fmt(a) + ' : ' + fmt(d) + ' = ' + remTxt(q - 1, r + d);
        why = 'Проверка сходится: ' + fmt(d) + ' × ' + fmt(q - 1) + ' + ' + fmt(r + d) + ' = ' + fmt(d * (q - 1)) + ' + ' + fmt(r + d) + ' = ' + fmt(a) + '. Но остаток ' + fmt(r + d) + ' не меньше делителя ' + fmt(d) + ': в нём ещё раз помещается делитель. Частное надо увеличить на 1, а остаток уменьшить на ' + fmt(d) + '. Правильно: ' + fmt(a) + ' : ' + fmt(d) + ' = ' + remTxt(q, r) + '.';
      } else {
        rec = fmt(a) + ' : ' + fmt(d) + ' = ' + remTxt(q, r);
        why = 'Проверка: ' + fmt(d) + ' × ' + fmt(q) + ' + ' + fmt(r) + ' = ' + fmt(d * q) + ' + ' + fmt(r) + ' = ' + fmt(a) + ' — получилось делимое, и остаток ' + fmt(r) + ' меньше делителя ' + fmt(d) + '. Ошибок нет.';
      }
    } else {
      do { k = rand(2, 3); ex = rand(1, 2); D = rDiv(rand(1, 2)); Q = rand(2, 99); g++; } while ((D * Q % 10 === 0 || Q % 10 === 0 || D * Q * p10(k + ex) > 1e9) && g < 100);
      a = D * Q * p10(k + ex); d = D * p10(k);
      var a1 = D * Q * p10(ex), right = Q * p10(ex);
      if (ty === 'zeros') {
        rec = fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(D * Q) + ' : ' + fmt(D) + ' = ' + fmt(Q);
        why = 'У делителя ' + fmt(d) + ' на конце ' + nulWord(k) + ', значит, и у делимого зачёркиваем ' + nulWord(k) + ': ' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(a1) + ' : ' + fmt(D) + ' = ' + fmt(right) + '. Ученик убрал у делимого ' + nulWord(k + ex) + ', а у делителя ' + nulWord(k) + ' — частное вышло в ' + fmt(p10(ex)) + ' раз меньше. Проверка: ' + fmt(Q) + ' × ' + fmt(d) + ' = ' + fmt(Q * d) + ', а не ' + fmt(a) + '.';
      } else {
        rec = fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(a1) + ' : ' + fmt(D) + ' = ' + fmt(right);
        why = 'У делителя ' + fmt(d) + ' на конце ' + nulWord(k) + ', и у делимого убрано столько же — ' + nulWord(k) + ': ' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(a1) + ' : ' + fmt(D) + ' = ' + fmt(right) + '. Проверка: ' + fmt(right) + ' × ' + fmt(d) + ' = ' + fmt(a) + '. Ошибок нет.';
      }
    }
    var keys = Object.keys(ERR_TXT), others = shuffle(keys.filter(function (x) { return x !== ty; })).slice(0, 3), opt = shuffle([ty].concat(others));
    return {
      kind: 'choice', html: 'Ученик записал решение:<br>' + expr(rec) + '<br>Какая ошибка допущена?', options: opt.map(function (x) { return ERR_TXT[x]; }), answer: opt.indexOf(ty),
      hint: hint, explain: why
    };
  });

  /* ================= умножение круглых чисел (повторение, урок 49) ================= */
  /* o.size: 'mental' (однозначные ядра) | 'col' (двух-трёхзначные ядра, по умолчанию) */
  reg('dvMulZeros', function (o) {
    var mental = o.size === 'mental', a0, b0, k1, k2, a, b, g = 0;
    do {
      if (mental) { a0 = rand(2, 9); b0 = rand(2, 9); k1 = rand(1, 2); k2 = rand(1, 2); }
      else {
        a0 = rand(12, 999); b0 = rand(12, 99); k1 = rand(1, 2); k2 = rand(1, 2);
        if (a0 % 10 === 0) a0 += rand(1, 9); if (b0 % 10 === 0) b0 += rand(1, 9);
      }
      a = a0 * p10(k1); b = b0 * p10(k2); g++;
    } while (a * b > 2e9 && g < 50);
    var kk = k1 + k2, core = a0 * b0, r = a * b;
    var cut = 'Зачёркиваем нули на конце обоих множителей: ' + R.dvCross(a, k1) + ' × ' + R.dvCross(b, k2) + '. Всего зачёркнуто ' + kk + ' ' + R.plural(kk, ['нуль', 'нуля', 'нулей']) + '.';
    var body = mental
      ? cut + ' Умножаем то, что осталось: ' + a0 + ' × ' + b0 + ' = ' + core + '. Приписываем ' + kk + ' ' + R.plural(kk, ['нуль', 'нуля', 'нулей']) + ': ' + fmt(r) + '.'
      : cut + ' ' + mulBox(a0, b0) + 'Приписываем ' + kk + ' ' + R.plural(kk, ['нуль', 'нуля', 'нулей']) + ' к ' + fmt(core) + ': ' + num(r) + '. Проверка делением: ' + fmt(r) + ' : ' + fmt(b) + ' = ' + fmt(a) + '.';
    return {
      kind: 'num', html: (mental ? 'Вычисли: ' : 'Вычисли, сократив нули: ') + expr(fmt(a) + ' × ' + fmt(b) + ' ='), answer: r,
      hint: 'Умножь числа без нулей на конце, а потом припиши справа столько нулей, сколько их было у обоих множителей вместе.',
      explain: body
    };
  });

  /* ================= рисунок: предметы, разложенные по группам ================= */
  /* R.dvGroupsSVG(groups, per, left): groups рамок по per точек и left лишних точек (красные, в пунктирной рамке) */
  R.dvGroupsSVG = function (groups, per, left) {
    var cols = per <= 6 ? per : Math.ceil(per / 2), rows = Math.ceil(per / cols), step = 17, bw = cols * step + 10, bh = rows * step + 10, gap = 12, W = 560;
    var perRow = Math.max(1, Math.floor((W + gap) / (bw + gap))), items = groups + (left ? 1 : 0), i, j, x, y, out = '', lr = Math.ceil(items / perRow);
    function dots(n, x0, y0, c, red) {
      var s = '', t;
      for (t = 0; t < n; t++) s += '<circle cx="' + (x0 + 5 + step / 2 + (t % c) * step) + '" cy="' + (y0 + 5 + step / 2 + Math.floor(t / c) * step) + '" r="6" ' +
        (red ? 'style="fill:var(--red)"' : 'fill="currentColor"') + '/>';
      return s;
    }
    for (i = 0; i < groups; i++) {
      x = (i % perRow) * (bw + gap) + 2; y = Math.floor(i / perRow) * (bh + gap) + 2;
      out += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>' + dots(per, x, y, cols, false);
    }
    if (left) {
      j = groups; x = (j % perRow) * (bw + gap) + 2; y = Math.floor(j / perRow) * (bh + gap) + 2;
      var lc = Math.min(cols, left), lrws = Math.ceil(left / lc);
      out += '<rect x="' + x + '" y="' + y + '" width="' + (lc * step + 10) + '" height="' + (lrws * step + 10) + '" rx="8" fill="none" stroke-width="2" stroke-dasharray="5 4" style="stroke:var(--red)"/>' + dots(left, x, y, lc, true);
    }
    var w = Math.min(perRow, items) * (bw + gap) + 2, h = lr * (bh + gap) + 2;
    return '<svg class="fig" viewBox="0 0 ' + w + ' ' + h + '" width="' + Math.min(w, W) + '" role="img" aria-label="Предметы, разложенные по группам">' + out + '</svg>';
  };

  /* ================= виджеты ================= */
  R.widgetMounts = R.widgetMounts || {};

  /* dvsplit: разложить N предметов по группам двумя способами */
  R.widgetMounts.dvsplit = function (host) {
    var N0 = Number(host.getAttribute('data-n')) || 23, K0 = Number(host.getAttribute('data-k')) || 5, mode0 = host.getAttribute('data-mode') === 'parts' ? 'parts' : 'content';
    host.innerHTML = '<div class="conv-row">' +
      '<div class="fld"><label class="wlabel">Сколько всего предметов (до 60)</label><input class="winput sm" inputmode="numeric" autocomplete="off" aria-label="Всего предметов"></div>' +
      '<div class="fld"><label class="wlabel">Число в группе или число частей</label><input class="winput sm" inputmode="numeric" autocomplete="off" aria-label="Число k"></div>' +
      '<div class="fld"><label class="wlabel">Как делим</label><select class="wsel" aria-label="Как делим"><option value="content">Раскладываем по k в каждую группу</option><option value="parts">Делим на k равных частей</option></select></div>' +
      '</div><div class="w-out"></div>';
    var ins = host.querySelectorAll('input'), sel = host.querySelector('select'), out = host.querySelector('.w-out');
    ins[0].style.width = '6ch'; ins[1].style.width = '6ch';
    ins[0].value = N0; ins[1].value = K0; sel.value = mode0;
    function calc() {
      var N = Number(ins[0].value.replace(/\D/g, '').slice(0, 2)) || 0, k = Number(ins[1].value.replace(/\D/g, '').slice(0, 2)) || 0, mode = sel.value;
      if (N < 1 || N > 60 || k < 1) { out.innerHTML = '<p class="facts">Впиши число предметов от 1 до 60 и число k (не нуль).</p>'; return; }
      if (mode === 'parts' && k > 12) { out.innerHTML = '<p class="facts">Для деления на равные части возьми k не больше 12.</p>'; return; }
      if (mode === 'content' && k > N) { out.innerHTML = '<p class="facts">В группе не может быть больше предметов, чем их всего. Возьми k не больше ' + N + '.</p>'; return; }
      var q = Math.floor(N / k), r = N % k, rec = N + ' : ' + k + ' = ' + q + (r ? ' (ост. ' + r + ')' : ''), txt;
      if (mode === 'content') {
        txt = 'Раскладываем ' + N + ' по ' + k + ' в каждую группу. Полных групп получилось <b>' + q + '</b>' + (r ? ', ещё ' + r + ' ' + R.plural(r, ['предмет', 'предмета', 'предметов']) + ' остались (красные) — на полную группу их не хватило' : ', ничего не осталось') + '. Мы узнали, сколько раз по ' + k + ' содержится в ' + N + '.';
        out.innerHTML = R.dvGroupsSVG(q, k, r) + '<p class="facts"><span class="expr">' + rec + '</span></p><p class="facts">' + txt + '</p>';
      } else {
        txt = 'Делим ' + N + ' на ' + k + ' равных ' + (k < 5 ? 'части' : 'частей') + ': в каждой части по <b>' + q + '</b>' + (r ? ', и ещё ' + r + ' ' + R.plural(r, ['предмет', 'предмета', 'предметов']) + ' остались (красные): по одному в каждую часть их не разделить' : ', ничего не осталось') + '. Мы узнали, сколько предметов в одной части.';
        out.innerHTML = R.dvGroupsSVG(k, q, r) + '<p class="facts"><span class="expr">' + rec + '</span></p><p class="facts">' + txt + '</p>';
      }
    }
    ins[0].addEventListener('input', calc); ins[1].addEventListener('input', calc); sel.addEventListener('change', calc);
    calc();
  };

  /* dvcalc: любое деление уголком с разбором (делимое до 9 цифр, делитель до 4 цифр) */
  R.widgetMounts.dvcalc = function (host) {
    host.innerHTML = '<div class="conv-row">' +
      '<div class="fld"><label class="wlabel">Делимое</label><input class="winput" inputmode="numeric" autocomplete="off" aria-label="Делимое"></div>' +
      '<span class="conv-eq">:</span>' +
      '<div class="fld"><label class="wlabel">Делитель</label><input class="winput sm" inputmode="numeric" autocomplete="off" aria-label="Делитель"></div>' +
      '</div><div class="w-out"></div>';
    var ins = host.querySelectorAll('input'), out = host.querySelector('.w-out');
    ins[0].style.width = '12ch'; ins[1].style.width = '7ch';
    ins[0].value = fmt(Number(host.getAttribute('data-a')) || 4359); ins[1].value = fmt(Number(host.getAttribute('data-d')) || 7);
    R.groupInput(ins[0], 9); R.groupInput(ins[1], 4);
    function calc() {
      var a = R.parseNum(ins[0].value), d = R.parseNum(ins[1].value);
      if (!(a >= 0) || !(d >= 0) || ins[0].value.replace(/\D/g, '') === '' || ins[1].value.replace(/\D/g, '') === '') { out.innerHTML = '<p class="facts">Впиши два числа: делимое и делитель.</p>'; return; }
      if (d === 0) { out.innerHTML = '<p class="facts"><b>На нуль делить нельзя.</b> Возьми другой делитель.</p>'; return; }
      var c = R.divCalc(a, d), tail = c.rem ? 'Частное: <b>' + fmt(c.q) + '</b>, остаток: <b>' + fmt(c.rem) + '</b>. Проверка: ' + fmt(d) + ' × ' + fmt(c.q) + ' + ' + fmt(c.rem) + ' = ' + fmt(a) + '.'
        : 'Частное: <b>' + fmt(c.q) + '</b>, остатка нет. Проверка: ' + fmt(c.q) + ' × ' + fmt(d) + ' = ' + fmt(a) + '.';
      out.innerHTML = '<div class="colrow">' + R.divHTML(a, d) + '<span class="colsteps">' + R.dvSteps(a, d).join('<br>') + '<br>' + tail + '</span></div>';
    }
    ins[0].addEventListener('input', calc); ins[1].addEventListener('input', calc);
    calc();
  };

  /* dvzeros: сократить нули у делимого и делителя */
  R.widgetMounts.dvzeros = function (host) {
    host.innerHTML = '<div class="conv-row">' +
      '<div class="fld"><label class="wlabel">Делимое</label><input class="winput" inputmode="numeric" autocomplete="off" aria-label="Делимое"></div>' +
      '<span class="conv-eq">:</span>' +
      '<div class="fld"><label class="wlabel">Делитель</label><input class="winput sm" inputmode="numeric" autocomplete="off" aria-label="Делитель"></div>' +
      '</div><div class="w-out"></div>';
    var ins = host.querySelectorAll('input'), out = host.querySelector('.w-out');
    ins[0].style.width = '12ch'; ins[1].style.width = '8ch';
    ins[0].value = fmt(Number(host.getAttribute('data-a')) || 48000); ins[1].value = fmt(Number(host.getAttribute('data-d')) || 600);
    R.groupInput(ins[0], 9); R.groupInput(ins[1], 6);
    function calc() {
      var a = R.parseNum(ins[0].value), d = R.parseNum(ins[1].value);
      if (ins[0].value.replace(/\D/g, '') === '' || ins[1].value.replace(/\D/g, '') === '') { out.innerHTML = '<p class="facts">Впиши два числа: делимое и делитель.</p>'; return; }
      if (!(d > 0)) { out.innerHTML = '<p class="facts"><b>На нуль делить нельзя.</b> Возьми другой делитель.</p>'; return; }
      if (!(a > 0)) { out.innerHTML = '<p class="facts">Нуль, делённый на любое число, — нуль.</p>'; return; }
      var k = Math.min(tz(a), tz(d)), c, a1, d1;
      if (k === 0) { out.innerHTML = '<p class="facts">У этих чисел нет общих нулей на конце, сокращать нечего. Раздели обычным уголком, например так: ' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(R.divCalc(a, d).q) + (R.divCalc(a, d).rem ? ' (ост. ' + fmt(R.divCalc(a, d).rem) + ')' : '') + '.</p>'; return; }
      a1 = a / p10(k); d1 = d / p10(k); c = R.divCalc(a1, d1);
      var head = '<p class="facts"><span class="expr">' + R.dvCross(a, k) + ' : ' + R.dvCross(d, k) + ' = ' + fmt(a1) + ' : ' + fmt(d1) + '</span></p>' +
        '<p class="facts">Зачёркиваем на конце обоих чисел по ' + zerosWord(k) + '. Частное от этого не меняется.</p>';
      if (c.rem) {
        out.innerHTML = head + '<p class="facts">Эти числа нацело не делятся. Здесь удобнее делить обычным уголком: ' + fmt(a) + ' : ' + fmt(d) + ' = ' + fmt(R.divCalc(a, d).q) + ' (ост. ' + fmt(R.divCalc(a, d).rem) + ').</p>';
        return;
      }
      out.innerHTML = head + '<div class="colrow">' + R.divHTML(a1, d1) + '<span class="colsteps">' + R.dvSteps(a1, d1).join('<br>') + '<br>Ответ: <b>' + fmt(c.q) + '</b>. ' + chkMul(a, d) + '</span></div>';
    }
    ins[0].addEventListener('input', calc); ins[1].addEventListener('input', calc);
    calc();
  };


  /* @@END@@ */
})(typeof window !== 'undefined' ? window : globalThis);
