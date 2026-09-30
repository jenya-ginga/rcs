/* Блок «Именованные числа», уроки 60–70: простые и составные именованные числа,
   раздробление и превращение, сложение и вычитание именованных чисел. Префикс имён: n1.
   Внутри — небольшой «движок» мер: длина, масса, деньги; составное число хранится как {b, s}
   (b — крупная мера, s — мелкая), значение в мелких единицах — b·f + s. */
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

  /* ================= таблицы мер ================= */
  var SIZE = { 'км': 1000000, 'м': 1000, 'дм': 100, 'см': 10, 'мм': 1, 'т': 1000000, 'ц': 100000, 'кг': 1000, 'г': 1, 'руб.': 100, 'коп.': 1 };
  var SYSOF = { 'км': 'len', 'м': 'len', 'дм': 'len', 'см': 'len', 'мм': 'len', 'т': 'wt', 'ц': 'wt', 'кг': 'wt', 'г': 'wt', 'руб.': 'money', 'коп.': 'money' };
  /* «сколько метров», «в метрах», «к метрам», «метры» */
  var GENP = { 'км': 'километров', 'м': 'метров', 'дм': 'дециметров', 'см': 'сантиметров', 'мм': 'миллиметров', 'т': 'тонн', 'ц': 'центнеров', 'кг': 'килограммов', 'г': 'граммов', 'руб.': 'рублей', 'коп.': 'копеек' };
  var PREP = { 'км': 'километрах', 'м': 'метрах', 'дм': 'дециметрах', 'см': 'сантиметрах', 'мм': 'миллиметрах', 'т': 'тоннах', 'ц': 'центнерах', 'кг': 'килограммах', 'г': 'граммах', 'руб.': 'рублях', 'коп.': 'копейках' };
  var DATP = { 'км': 'километрам', 'м': 'метрам', 'дм': 'дециметрам', 'см': 'сантиметрам', 'мм': 'миллиметрам', 'т': 'тоннам', 'ц': 'центнерам', 'кг': 'килограммам', 'г': 'граммам', 'руб.': 'рублям', 'коп.': 'копейкам' };
  var INS = { 'км': 'километрами', 'м': 'метрами', 'дм': 'дециметрами', 'см': 'сантиметрами', 'мм': 'миллиметрами', 'т': 'тоннами', 'ц': 'центнерами', 'кг': 'килограммами', 'г': 'граммами', 'руб.': 'рублями', 'коп.': 'копейками' };
  var ACC = { 'км': 'километры', 'м': 'метры', 'дм': 'дециметры', 'см': 'сантиметры', 'мм': 'миллиметры', 'т': 'тонны', 'ц': 'центнеры', 'кг': 'килограммы', 'г': 'граммы', 'руб.': 'рубли', 'коп.': 'копейки' };
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function ratio(a, b) { return SIZE[a] / SIZE[b]; }

  function mkPair(a, b) { return { a: a, b: b, f: ratio(a, b), sys: SYSOF[a], key: a + '|' + b }; }
  var PAIRS = {};
  [['км', 'м'], ['м', 'дм'], ['м', 'см'], ['дм', 'см'], ['см', 'мм'], ['т', 'ц'], ['т', 'кг'], ['ц', 'кг'], ['кг', 'г'], ['руб.', 'коп.'], ['м', 'мм'], ['дм', 'мм']]
    .forEach(function (p) { PAIRS[p[0] + '|' + p[1]] = mkPair(p[0], p[1]); });
  function PP(a, b) { return PAIRS[a + '|' + b]; }

  /* пары для составных чисел (с весами) и для простых преобразований */
  var CW = [['км', 'м', 3], ['м', 'дм', 1], ['м', 'см', 2], ['дм', 'см', 1], ['см', 'мм', 1], ['т', 'ц', 1], ['т', 'кг', 3], ['ц', 'кг', 2], ['кг', 'г', 3], ['руб.', 'коп.', 2]];
  var SW = CW.concat([['м', 'мм', 1]]);
  function poolOf(list, o) {
    o = o || {};
    var out = [];
    list.forEach(function (p) {
      var P = PP(p[0], p[1]);
      if (o.sys && P.sys !== o.sys) return;
      if (o.pairs && o.pairs.indexOf(P.key) < 0) return;
      if (o.minF && P.f < o.minF) return;
      for (var i = 0; i < p[2]; i++) out.push(P);
    });
    return out;
  }
  function pickC(o) { return pick(poolOf(CW, o)); }
  function pickS(o) { return pick(poolOf(SW, o)); }

  /* разумные пределы крупной меры */
  var BR = { 'км|м': 60, 'м|дм': 30, 'м|см': 60, 'дм|см': 12, 'см|мм': 40, 'т|ц': 50, 'т|кг': 60, 'ц|кг': 60, 'кг|г': 60, 'руб.|коп.': 300, 'м|мм': 20, 'дм|мм': 30 };
  function bigOf(P, lo, hi) {
    var top = Math.min(hi || 1e9, BR[P.key]);
    return rand(Math.min(lo || 1, top), top);
  }
  /* мелкая часть составного числа: style 'gap' — с пропущенным разрядом (15 км 50 м, 8 кг 75 г) */
  function smallOf(P, style) {
    var f = P.f;
    if (f === 10) return rand(1, 9);
    if (style === 'gap') return f === 100 ? rand(1, 9) : (Math.random() < 0.85 ? rand(11, 99) : rand(1, 9));
    if (style === 'any' || (style !== 'round' && Math.random() < 0.4)) return rand(1, f - 1);
    return f === 100 ? 5 * rand(1, 19) : 10 * rand(1, 99);
  }
  function until(gen, ok, tries) {
    var v;
    for (var i = 0; i < (tries || 400); i++) { v = gen(); if (ok(v)) return v; }
    return v;
  }

  /* ================= запись чисел ================= */
  function q(n, u) { return fmt(n) + NB + u; }                         /* 250 м */
  function cn(P, x) {                                                  /* 3 км 850 м */
    if (!x.b) return q(x.s, P.b);
    if (!x.s) return q(x.b, P.a);
    return q(x.b, P.a) + ' ' + q(x.s, P.b);
  }
  function tot(P, x) { return x.b * P.f + x.s; }
  function fromTot(P, t) { return { b: Math.floor(t / P.f), s: t % P.f }; }
  function expr(s) { return '<span class="expr">' + s + '</span>'; }
  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function fact(a, b) { return '1' + NB + a + ' = ' + q(ratio(a, b), b); }        /* 1 км = 1 000 м */
  function steps(list, ans) {
    return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>') + '<br>Ответ: ' + ans + '.';
  }
  function fieldsOf(P) { return [{ label: P.a }, { label: P.b }]; }

  /* ================= столбик для составных чисел ================= */
  /* ops — массив {b, s}; op — '+' или '-'. Строки — спаны, чтобы можно было вставлять в <p>. */
  function nzPad(s, w) {
    var t = String(s), z = '';
    while (t.length + z.length < w) z += '0';
    return (z ? '<span class="n1pad">' + z + '</span>' : '') + t;
  }
  function colRow(P, x, sign, cls) {
    var w = String(P.f - 1).length;
    var bt = x.b ? fmt(x.b) : '', st = '';
    if (x.s) st = x.b ? nzPad(x.s, w) : fmt(x.s);
    return '<span class="n1r ' + (cls || '') + '"><span class="n1c n1op">' + (sign || '') + '</span>' +
      '<span class="n1c n1b">' + bt + '</span><span class="n1c n1u">' + (x.b ? P.a : '') + '</span>' +
      '<span class="n1c n1s">' + st + '</span><span class="n1c n1u">' + (x.s ? P.b : '') + '</span></span>';
  }
  function resultOf(P, ops, op) {
    var T = tot(P, ops[0]);
    for (var i = 1; i < ops.length; i++) T += op === '+' ? tot(P, ops[i]) : -tot(P, ops[i]);
    return fromTot(P, T);
  }
  R.n1ColHTML = function (P, ops, op, o) {
    o = o || {};
    var f = P.f, res = resultOf(P, ops, op), mb = '', ms = '', k;
    if (!o.bare) {
      if (op === '+') {
        var S = 0; ops.forEach(function (x) { S += x.s; });
        if (S >= f) mb = String(Math.floor(S / f));
      } else if (ops[0].s < ops[1].s) { mb = String(ops[0].b - 1); ms = fmt(ops[0].s + f); }
    }
    var label = ops.map(function (x) { return cn(P, x); }).join(op === '+' ? ' плюс ' : ' минус ') + (o.bare ? '' : ' равно ' + cn(P, res));
    var h = '<span class="n1col" role="img" aria-label="' + label + '">';
    if (mb || ms) {
      h += '<span class="n1r n1mk"><span class="n1c n1op"></span><span class="n1c n1b">' + mb + '</span><span class="n1c n1u"></span>' +
        '<span class="n1c n1s">' + ms + '</span><span class="n1c n1u"></span></span>';
    }
    for (k = 0; k < ops.length; k++) h += colRow(P, ops[k], k === ops.length - 1 ? (op === '+' ? '+' : '−') : '', k === ops.length - 1 ? 'n1last' : '');
    if (o.bare) h += '<span class="n1r n1ln"><span class="n1c n1op"></span><span class="n1c n1b">&nbsp;</span><span class="n1c n1u"></span><span class="n1c n1s"></span><span class="n1c n1u"></span></span>';
    else h += colRow(P, res, '', 'n1ln');
    return h + '</span>';
  };

  /* пошаговое объяснение сложения нескольких составных чисел */
  function stepsAdd(P, ops) {
    var f = P.f, out = [], S = 0, sT = [], bT = [];
    ops.forEach(function (x) { S += x.s; if (x.s) sT.push(fmt(x.s)); if (x.b) bT.push(fmt(x.b)); });
    var carry = Math.floor(S / f), sr = S % f, res = resultOf(P, ops, '+');
    if (sT.length >= 2) {
      var l1 = cap(ACC[P.b]) + ': ' + sT.join(' + ') + ' = ' + fmt(S) + ' (' + P.b + ')';
      if (carry) {
        l1 += ' — это ' + (sr ? cn(P, { b: carry, s: sr }) : q(carry, P.a)) + '. Пишем ' + q(sr, P.b) + ', а ' + q(carry, P.a) + ' прибавим к ' + DATP[P.a] + '.';
      } else {
        l1 += ' — это меньше ' + q(f, P.b) + ', то есть меньше 1' + NB + P.a + ', переносить нечего.';
      }
      out.push(l1);
    } else if (sT.length === 1) {
      out.push(cap(ACC[P.b]) + ': прибавлять не к чему, сносим ' + q(S, P.b) + '.');
    }
    var terms = bT.slice();
    if (carry) terms.push(String(carry));
    if (terms.length >= 2) {
      out.push(cap(ACC[P.a]) + ': ' + terms.join(' + ') + ' = ' + fmt(res.b) + ' (' + P.a + ')' + (carry ? '; последнее слагаемое — перенесённое из ' + GENP[P.b] + '.' : '.'));
    } else if (terms.length === 1 && carry) {
      out.push(cap(ACC[P.a]) + ': пишем только перенесённые ' + q(carry, P.a) + '.');
    } else if (terms.length === 1) {
      out.push(cap(ACC[P.a]) + ': сносим ' + terms[0] + ' (' + P.a + ').');
    }
    return out;
  }
  /* пошаговое объяснение вычитания x − y */
  function stepsSub(P, x, y) {
    var f = P.f, out = [], r = fromTot(P, tot(P, x) - tot(P, y)), borrow = x.s < y.s;
    if (!y.s) {
      if (x.s) out.push(cap(ACC[P.b]) + ': в вычитаемом ' + GENP[P.b] + ' нет, сносим ' + q(x.s, P.b) + '.');
    } else if (!borrow) {
      out.push(cap(ACC[P.b]) + ': ' + fmt(x.s) + ' − ' + fmt(y.s) + ' = ' + fmt(r.s) + ' (' + P.b + ').');
    } else if (x.s) {
      out.push(cap(ACC[P.b]) + ': из ' + fmt(x.s) + ' нельзя вычесть ' + fmt(y.s) + '. Занимаем 1' + NB + P.a + ' = ' + q(f, P.b) + ': ' + fmt(x.s) + ' + ' + fmt(f) + ' = ' + fmt(x.s + f) +
        '; ' + fmt(x.s + f) + ' − ' + fmt(y.s) + ' = ' + fmt(r.s) + ' (' + P.b + ').');
    } else {
      out.push(cap(ACC[P.b]) + ': в уменьшаемом ' + GENP[P.b] + ' нет. Занимаем 1' + NB + P.a + ' = ' + q(f, P.b) + ': ' + fmt(f) + ' − ' + fmt(y.s) + ' = ' + fmt(r.s) + ' (' + P.b + ').');
    }
    if (borrow) {
      if (y.b) out.push(cap(ACC[P.a]) + ': было ' + fmt(x.b) + ', 1' + NB + P.a + ' заняли — осталось ' + fmt(x.b - 1) + '; ' + fmt(x.b - 1) + ' − ' + fmt(y.b) + ' = ' + fmt(r.b) + ' (' + P.a + ').');
      else out.push(cap(ACC[P.a]) + ': было ' + fmt(x.b) + ', 1' + NB + P.a + ' заняли — осталось ' + fmt(r.b) + ' (' + P.a + ').');
    } else if (y.b) {
      out.push(cap(ACC[P.a]) + ': ' + fmt(x.b) + ' − ' + fmt(y.b) + ' = ' + fmt(r.b) + ' (' + P.a + ').');
    } else {
      out.push(cap(ACC[P.a]) + ': сносим ' + fmt(x.b) + ' (' + P.a + ').');
    }
    return out;
  }
  R.n1Worked = function (P, ops, op) {
    var st = op === '+' ? stepsAdd(P, ops) : stepsSub(P, ops[0], ops[1]);
    return '<div class="colrow">' + R.n1ColHTML(P, ops, op) + '<div class="colsteps">' + st.join('<br>') + '</div></div>';
  };
  R.n1Fmt = function (a, b, x) { return cn(PP(a, b), x); };
  R.n1Pair = PP;

  /* ================= ЗАДАНИЯ: устно и определения (урок 60) ================= */

  var OBJ = [['карандаш', 'карандаша', 'карандашей'], ['парта', 'парты', 'парт'], ['ученик', 'ученика', 'учеников'], ['книга', 'книги', 'книг'],
    ['стул', 'стула', 'стульев'], ['окно', 'окна', 'окон'], ['мяч', 'мяча', 'мячей'], ['тетрадь', 'тетради', 'тетрадей'], ['яблоко', 'яблока', 'яблок']];
  var KIND_OPTS = ['простое именованное число', 'составное именованное число', 'не именованное число'];

  /* Простое, составное или не именованное */
  reg('n1Kind', function (o) {
    o = o || {};
    var t = o.kind != null ? o.kind : pick([0, 1, 1, 2]), txt, why, P, x;
    if (t === 0) {
      var us = ['км', 'м', 'дм', 'см', 'мм', 'т', 'ц', 'кг', 'г', 'руб.', 'коп.'], u = pick(us);
      var n = (u === 'м' || u === 'кг' || u === 'г' || u === 'руб.') ? rand(2, 999) : rand(2, 99);
      txt = q(n, u);
      why = 'В записи одна мера — ' + u + '. Это простое именованное число.';
    } else if (t === 1) {
      P = pickC(o); x = { b: bigOf(P), s: smallOf(P) }; txt = cn(P, x);
      why = 'В записи две меры — ' + P.a + ' и ' + P.b + '. Это составное именованное число.';
    } else {
      if (Math.random() < 0.5) {
        var k = pick([rand(12, 99), rand(100, 999), rand(2, 9) * 1000 + rand(0, 9) * 100, 1600000]);
        txt = fmt(k);
        why = 'После числа нет названия меры — мы не знаем, что оно обозначает. Это отвлечённое, а не именованное число.';
      } else {
        var ob = pick(OBJ), m = rand(2, 40);
        txt = fmt(m) + ' ' + R.plural(m, ob);
        why = 'Здесь предметы посчитали, а не измерили: «' + R.plural(m, ob) + '» — не мера длины, массы или денег. Это не именованное число.';
      }
    }
    var opts = shuffle(KIND_OPTS.slice()), right = KIND_OPTS[t];
    return {
      kind: 'choice',
      html: 'Какое это число: <span class="num">' + txt + '</span>?',
      options: opts, answer: opts.indexOf(right),
      hint: 'Посмотри, есть ли после числа название меры и сколько таких названий записано.',
      explain: why
    };
  });

  /* Соотношения между мерами (таблица) */
  reg('n1Rel', function (o) {
    o = o || {};
    var P = pickS(o), f = P.f;
    if (Math.random() < 0.5) {
      return {
        kind: 'num', html: 'Сколько ' + GENP[P.b] + ' в 1' + NB + P.a + '?', answer: f,
        hint: 'Вспомни таблицу мер: сколько мелких единиц в одной крупной.',
        explain: fact(P.a, P.b) + '. Ответ: ' + fmt(f) + '.'
      };
    }
    return {
      kind: 'num', html: expr('1' + NB + P.a + ' = □' + NB + P.b), answer: f,
      hint: 'Вспомни таблицу мер: сколько мелких единиц в одной крупной.',
      explain: fact(P.a, P.b) + '. Ответ: ' + fmt(f) + '.'
    };
  });

  /* Запись числа через разряды: 845 = 84 дес. 5 ед. (подготовка к превращению: отделяем справа 1, 2 или 3 цифры) */
  var CUTN = { 10: ['дес.', 'десятков', 'десятки'], 100: ['сот.', 'сотен', 'сотни'], 1000: ['тыс.', 'тысяч', 'тысячи'] };
  reg('n1Cut', function (o) {
    o = o || {};
    var k = o.k || pick([10, 100, 100, 1000]), z = String(k).length - 1, nm = CUTN[k], qq, rr, n;
    qq = k === 10 ? rand(2, 99) : k === 100 ? rand(2, 40) : rand(2, 9);
    rr = Math.random() < 0.3 ? rand(1, 9) : rand(1, k - 1);
    n = qq * k + rr;
    return {
      kind: 'nums', html: 'Сколько всего ' + nm[1] + ' и сколько единиц сверх того в числе ' + num(n) + '?',
      fields: [{ label: nm[0] }, { label: 'ед.' }], answer: [qq, rr],
      hint: 'Отдели справа ' + z + ' ' + R.plural(z, ['цифру', 'цифры', 'цифр']) + ': слева останутся ' + nm[2] + ', справа — единицы.',
      explain: 'Отделяем справа ' + z + ' ' + R.plural(z, ['цифру', 'цифры', 'цифр']) + ': <span class="num">' + R.fmtCut(n, z) + '</span>. Слева ' + fmt(qq) + ' ' + nm[0] + ', справа ' + fmt(rr) + ' ед. Значит, ' + fmt(n) + ' = ' + fmt(qq) + ' ' + nm[0] + ' ' + fmt(rr) + ' ед.'
    };
  });

  /* Умножение и деление на 10, 100, 1 000 */
  reg('n1Shift', function (o) {
    o = o || {};
    var k = pick(o.ks || [10, 100, 1000]), mul = o.op ? o.op === '×' : Math.random() < 0.5, z = String(k).length - 1, base, a;
    var zw = R.plural(z, ['ноль', 'нуля', 'нулей']);
    if (mul) {
      base = k === 1000 ? rand(2, 99) : rand(2, 999);
      a = base * k;
      return {
        kind: 'num', html: expr(fmt(base) + ' × ' + fmt(k) + ' ='), answer: a,
        hint: 'Умножить на ' + fmt(k) + ' — значит приписать справа ' + z + ' ' + zw + '.',
        explain: fmt(base) + ' × ' + fmt(k) + ' = ' + fmt(a) + ' (приписали ' + z + ' ' + zw + ').'
      };
    }
    base = k === 1000 ? rand(2, 99) : rand(2, 999);
    a = base * k;
    return {
      kind: 'num', html: expr(fmt(a) + ' : ' + fmt(k) + ' ='), answer: base,
      hint: 'Разделить на ' + fmt(k) + ' — значит убрать справа ' + z + ' ' + zw + '.',
      explain: fmt(a) + ' : ' + fmt(k) + ' = ' + fmt(base) + ' (убрали ' + z + ' ' + zw + ').'
    };
  });

  /* Дополнение до одной крупной меры: 1 км − 650 м */
  var CP = [['км', 'м'], ['т', 'кг'], ['м', 'см'], ['кг', 'г'], ['ц', 'кг'], ['руб.', 'коп.'], ['м', 'дм'], ['дм', 'см'], ['см', 'мм'], ['т', 'ц']];
  reg('n1Compl', function (o) {
    o = o || {};
    var pr = pick(CP.filter(function (p) { return !o.sys || SYSOF[p[0]] === o.sys; })), P = PP(pr[0], pr[1]), f = P.f, s;
    if (f === 10) s = rand(1, 9);
    else if (f === 100) s = o.hard ? rand(1, 99) : 5 * rand(1, 19);
    else s = o.hard ? rand(1, 999) : 10 * rand(1, 99);
    var ans = f - s;
    var ex = fact(P.a, P.b) + '. ' + fmt(f) + ' − ' + fmt(s) + ' = ' + fmt(ans) + ' (' + P.b + ').';
    if (Math.random() < 0.5) {
      return {
        kind: 'num', html: expr('1' + NB + P.a + ' − ' + q(s, P.b) + ' = □' + NB + P.b), answer: ans,
        hint: 'Вспомни, сколько ' + GENP[P.b] + ' в одной крупной мере, и вычти то, что дано.',
        explain: ex
      };
    }
    return {
      kind: 'num', html: 'Сколько ' + GENP[P.b] + ' надо добавить к ' + q(s, P.b) + ', чтобы получилось 1' + NB + P.a + '?', answer: ans,
      hint: 'Сколько ' + GENP[P.b] + ' в одной крупной мере? Вычти то, что уже есть.',
      explain: ex
    };
  });

  /* Сравнение величин, выраженных по-разному */
  function formsOf(P, V) {
    var out = [{ t: 's', txt: q(V, P.b) }];
    if (V >= P.f && V % P.f !== 0) out.push({ t: 'c', txt: cn(P, fromTot(P, V)) });
    if (V >= P.f && V % P.f === 0) out.push({ t: 'b', txt: q(V / P.f, P.a) });
    return out;
  }
  reg('n1Cmp', function (o) {
    o = o || {};
    var P = pickC(o), f = P.f, b = bigOf(P, 1, 30), s = smallOf(P, 'any'), V1 = b * f + s, V2, r = Math.random();
    var ds = f === 10 ? [1, 2, 3] : [f / 10, 2 * f / 10, f / 2, s];
    if (r < 0.34) V2 = V1;
    else V2 = V1 + pick([1, -1]) * pick(ds);
    if (V2 < f || V2 === V1 && r >= 0.34) V2 = V1 + pick(ds);
    var F1 = formsOf(P, V1), F2 = formsOf(P, V2), a, c, guard = 0;
    do { a = pick(F1); c = pick(F2); } while (a.t === c.t && guard++ < 40);
    var idx = V1 < V2 ? 0 : V1 === V2 ? 1 : 2, ops = ['<', '=', '>'];
    var lines = [];
    if (a.t !== 's') lines.push(a.txt + ' = ' + q(V1, P.b));
    if (c.t !== 's') lines.push(c.txt + ' = ' + q(V2, P.b));
    return {
      kind: 'choice', html: 'Сравни величины: ' + expr(a.txt + ' … ' + c.txt), options: ops, answer: idx, wide: false,
      hint: 'Вырази обе величины в одной мере, а потом сравни числа.',
      explain: fact(P.a, P.b) + '. ' + lines.join('; ') + '. Сравниваем ' + fmt(V1) + ' и ' + fmt(V2) + ': ' + fmt(V1) + ' ' + ops[idx] + ' ' + fmt(V2) + '.'
    };
  });

  /* Наибольшая или наименьшая из четырёх величин */
  reg('n1Extreme', function (o) {
    o = o || {};
    var P = pickC(o), f = P.f, b = bigOf(P, 1, 20), s = smallOf(P, 'any'), V0 = b * f + s, want = o.max != null ? o.max : Math.random() < 0.5;
    var cand = f === 10 ? [1, -1, 2, -2, 3, -3] : [f / 10, -f / 10, f / 2, -f / 2, s, -s, 2 * f / 10, -2 * f / 10, f / 100 || 1];
    var vals = [V0];
    shuffle(cand).forEach(function (d) {
      var v = V0 + d;
      if (vals.length < 4 && v >= f && vals.indexOf(v) < 0) vals.push(v);
    });
    var k = 0;
    while (vals.length < 4) { k++; if (vals.indexOf(V0 + k) < 0) vals.push(V0 + k); }
    vals = shuffle(vals);
    var items = vals.map(function (V) { return pick(formsOf(P, V)); });
    var texts = items.map(function (it) { return it.txt; });
    var best = vals[0], bi = 0;
    vals.forEach(function (V, i) { if (want ? V > best : V < best) { best = V; bi = i; } });
    var conv = items.map(function (it, i) { return it.t === 's' ? null : it.txt + ' = ' + q(vals[i], P.b); }).filter(Boolean);
    return {
      kind: 'choice', html: 'Какая из этих ' + (P.sys === 'len' ? 'длин' : P.sys === 'wt' ? 'масс' : 'сумм') + ' ' + (want ? 'самая большая' : 'самая маленькая') + '?', options: texts, answer: bi,
      hint: 'Вырази все величины в одной мере (в самой мелкой) и сравни числа.',
      explain: fact(P.a, P.b) + '. ' + (conv.length ? conv.join('; ') + '. ' : '') + 'В ' + PREP[P.b] + ': ' + vals.map(fmt).join('; ') +
        '. ' + (want ? 'Наибольшее' : 'Наименьшее') + ' число ' + fmt(best) + ' — это ' + texts[bi] + '.'
    };
  });

  /* Устный счёт с округлением: 97 кг + 64 кг, 61 кг − 39 кг */
  reg('n1Mental', function (o) {
    o = o || {};
    var u = pick(o.units || ['кг', 'км', 'м', 'руб.', 'ц', 'см', 'т']), add = o.op ? o.op === '+' : Math.random() < 0.5, x, y, d, r, ex, hint;
    if (add) {
      d = rand(1, 4); r = rand(1, 4) * 100; x = r - d; y = rand(21, 88);
      ex = q(x, u) + ' + ' + q(y, u) + ' = ' + q(r, u) + ' + ' + q(y, u) + ' − ' + q(d, u) + ' = ' + q(r + y, u) + ' − ' + q(d, u) + ' = ' + q(x + y, u) + '.';
      return {
        kind: 'num', html: expr(q(x, u) + ' + ' + q(y, u) + ' = □' + NB + u), answer: x + y,
        hint: 'Округли ' + x + ' до ' + r + ', сложи, а потом вычти лишнее.', explain: ex
      };
    }
    d = rand(1, 3); var t = rand(3, 9) * 10; y = t - d; x = y + rand(12, 130);
    ex = q(x, u) + ' − ' + q(y, u) + ' = ' + q(x, u) + ' − ' + q(t, u) + ' + ' + q(d, u) + ' = ' + q(x - t, u) + ' + ' + q(d, u) + ' = ' + q(x - y, u) + '.';
    return {
      kind: 'num', html: expr(q(x, u) + ' − ' + q(y, u) + ' = □' + NB + u), answer: x - y,
      hint: 'Округли вычитаемое ' + y + ' до ' + t + ', вычти, а потом прибавь лишнее.', explain: ex
    };
  });

  /* Выбор подходящей меры: «длина карандаша — 15 …» */
  var UNIT_ITEMS = [
    { t: 'Длина карандаша', lo: 12, hi: 19, u: 'см', why: 'карандаш немного длиннее ладони' },
    { t: 'Ширина тетради', lo: 16, hi: 21, u: 'см', why: 'тетрадь чуть шире ладони' },
    { t: 'Высота двери в классе', lo: 2, hi: 2, u: 'м', why: 'дверь выше взрослого человека' },
    { t: 'Длина класса', lo: 8, hi: 10, u: 'м', why: 'это около десяти шагов взрослого человека' },
    { t: 'Путь от дома до школы', lo: 400, hi: 900, u: 'м', why: 'такой путь проходят пешком за несколько минут' },
    { t: 'Расстояние между двумя городами', lo: 120, hi: 480, u: 'км', why: 'на поезде такой путь занимает несколько часов' },
    { t: 'Толщина монеты', lo: 1, hi: 3, u: 'мм', why: 'монета очень тонкая' },
    { t: 'Длина муравья', lo: 5, hi: 9, u: 'мм', why: 'муравей меньше ногтя' },
    { t: 'Длина футбольного поля', lo: 100, hi: 110, u: 'м', why: 'это длина стометровки и чуть больше' },
    { t: 'Высота письменного стола', lo: 70, hi: 80, u: 'см', why: 'стол ниже метра, но выше полуметра' },
    { t: 'Высота девятиэтажного дома', lo: 27, hi: 30, u: 'м', why: 'один этаж — около трёх метров' },
    { t: 'Длина шага взрослого человека', lo: 60, hi: 80, u: 'см', why: 'шаг короче метра' },
    { t: 'Длина реки Волги', lo: 3530, hi: 3530, u: 'км', why: 'Волга — одна из самых длинных рек Европы' },
    { t: 'Масса яблока', lo: 120, hi: 200, u: 'г', why: 'яблоко легко держать одной рукой' },
    { t: 'Масса буханки хлеба', lo: 400, hi: 700, u: 'г', why: 'буханка легче килограмма' },
    { t: 'Масса ластика', lo: 20, hi: 40, u: 'г', why: 'ластик совсем лёгкий' },
    { t: 'Масса кошки', lo: 3, hi: 5, u: 'кг', why: 'кошку можно поднять на руки' },
    { t: 'Масса ученика четвёртого класса', lo: 30, hi: 40, u: 'кг', why: 'ребёнок тяжелее пакета сахара, но легче взрослого' },
    { t: 'Масса мешка картофеля', lo: 40, hi: 50, u: 'кг', why: 'взрослый человек поднимает такой мешок' },
    { t: 'Масса легкового автомобиля', lo: 1, hi: 2, u: 'т', why: 'автомобиль намного тяжелее человека' },
    { t: 'Масса слона', lo: 4, hi: 6, u: 'т', why: 'слон тяжелее нескольких автомобилей' }
  ];
  reg('n1Unit', function (o) {
    o = o || {};
    var items = UNIT_ITEMS.filter(function (it) { return !o.sys || SYSOF[it.u] === o.sys; }), it = pick(items), n = rand(it.lo, it.hi), sys = SYSOF[it.u];
    var all = sys === 'len' ? ['км', 'м', 'дм', 'см', 'мм'] : ['т', 'ц', 'кг', 'г'], others = shuffle(all.filter(function (u) { return u !== it.u; })).slice(0, 3);
    var opts = all.filter(function (u) { return u === it.u || others.indexOf(u) >= 0; });
    var low = it.t.charAt(0).toLowerCase() + it.t.slice(1);
    return {
      kind: 'choice', html: 'Выбери подходящую меру: ' + expr(low + ' — ' + fmt(n) + ' …'), options: opts, answer: opts.indexOf(it.u), wide: false,
      hint: sys === 'len' ? 'Представь предмет. 1 мм — толщина проволоки, 1 см — ширина пальца, 1 дм — ширина ладони, 1 м — большой шаг, 1 км — четверть часа пешком.'
        : 'Представь предмет. 1 г — скрепка, 1 кг — пакет сахара, 1 ц — сто таких пакетов, 1 т — легковой автомобиль.',
      explain: 'Разумная мера здесь — ' + ACC[it.u] + ': ' + it.why + '. В других мерах получилась бы нелепая величина.'
    };
  });

  /* ================= раздробление и превращение (уроки 61–63) ================= */
  var TRI = {
    len: { units: ['м', 'дм', 'см'], gen: function () { return [rand(2, 9), rand(1, 9), rand(1, 9)]; } },
    wt: { units: ['т', 'ц', 'кг'], gen: function () { return [rand(1, 9), rand(1, 9), rand(1, 99)]; } }
  };
  function cn3(units, v) { return v.map(function (x, i) { return q(x, units[i]); }).join(' '); }
  function triTotal(units, v) {
    var last = units[units.length - 1], T = 0;
    v.forEach(function (x, i) { T += x * ratio(units[i], last); });
    return T;
  }

  /* Раздробление: o.mode — 'simple' | 'compound' | 'zeros' | 'triple'; o.sys — 'len' | 'wt' | 'money' */
  reg('n1Split', function (o) {
    o = o || {};
    var mode = o.mode || pick(['simple', 'compound', 'compound', 'zeros']), P, x, k;
    if (o.triple) mode = 'triple';
    if (mode === 'triple') {
      var T = TRI[o.sys === 'wt' ? 'wt' : (o.sys === 'len' ? 'len' : pick(['len', 'wt']))], v = T.gen(), last = T.units[2], total = triTotal(T.units, v);
      var conv = v.map(function (a, i) { return i < 2 ? q(a, T.units[i]) + ' = ' + q(a * ratio(T.units[i], last), last) : null; }).filter(Boolean);
      var sums = v.map(function (a, i) { return fmt(a * ratio(T.units[i], last)); });
      return {
        kind: 'num', html: 'Раздроби в ' + ACC[last] + ': ' + expr(cn3(T.units, v) + ' = □' + NB + last), answer: total,
        hint: 'Вырази каждую крупную меру в ' + PREP[last] + ' и сложи результаты.',
        explain: fact(T.units[0], last) + ', ' + fact(T.units[1], last) + '. ' + conv.join('; ') + '. Складываем: ' + sums.join(' + ') + ' = ' + fmt(total) + ' (' + last + ').'
      };
    }
    if (mode === 'simple') {
      P = pickS(o); k = bigOf(P, 2);
      return {
        kind: 'num', html: 'Раздроби в ' + ACC[P.b] + ': ' + expr(q(k, P.a) + ' = □' + NB + P.b), answer: k * P.f,
        hint: fact(P.a, P.b) + '. Крупную меру заменяем мелкой: умножаем.',
        explain: fact(P.a, P.b) + '. Значит, ' + q(k, P.a) + ' = ' + fmt(k) + ' × ' + fmt(P.f) + ' ' + P.b + ' = ' + q(k * P.f, P.b) + '.'
      };
    }
    P = mode === 'zeros' ? pickC(Object.assign({}, o, { minF: 100 })) : pickC(o);
    x = { b: bigOf(P, 1), s: smallOf(P, mode === 'zeros' ? 'gap' : undefined) };
    var t = tot(P, x);
    return {
      kind: 'num', html: 'Раздроби в ' + ACC[P.b] + ': ' + expr(cn(P, x) + ' = □' + NB + P.b), answer: t,
      hint: mode === 'zeros'
        ? fact(P.a, P.b) + '. Раздроби крупную меру, потом прибавь остаток. Следи за нулями: ' + fmt(x.b * P.f) + ' — это число с нулями на конце, к нему прибавляется остаток.'
        : fact(P.a, P.b) + '. Сначала раздроби крупную меру, потом прибавь мелкую.',
      explain: fact(P.a, P.b) + '. ' + q(x.b, P.a) + ' = ' + fmt(x.b) + ' × ' + fmt(P.f) + ' = ' + q(x.b * P.f, P.b) + '. Прибавим ' + q(x.s, P.b) + ': ' + fmt(x.b * P.f) + ' + ' + fmt(x.s) + ' = ' + fmt(t) + '. ' +
        'Значит, ' + cn(P, x) + ' = ' + q(t, P.b) + '.'
    };
  });

  /* Раздробление с выбором записи: ловим потерянные и лишние нули */
  reg('n1SplitChoice', function (o) {
    o = o || {};
    var P = pickC(Object.assign({}, o, { minF: 100 })), x = { b: bigOf(P, 1, 50), s: smallOf(P, 'gap') }, f = P.f, right = tot(P, x);
    var cands = [Number(String(x.b) + String(x.s)), x.b * f + x.s * 10, x.b * f * 10 + x.s, x.b * f + x.s * 100, x.b * (f / 10) + x.s, x.b * f + Number(String(x.s) + '0')];
    var seen = {}, wrong = [];
    seen[right] = 1;
    shuffle(cands).forEach(function (c) { if (wrong.length < 3 && !seen[c] && c > 0) { seen[c] = 1; wrong.push(c); } });
    var add = 1;
    while (wrong.length < 3) { var c2 = right + add * f / 10; add++; if (!seen[c2]) { seen[c2] = 1; wrong.push(c2); } }
    var opts = shuffle([right].concat(wrong));
    return {
      kind: 'choice', html: 'Раздроби в ' + ACC[P.b] + ': ' + expr(cn(P, x)) + '<br>Какой ответ верный?',
      options: opts.map(function (v) { return q(v, P.b); }), answer: opts.indexOf(right),
      hint: 'Раздроби крупную меру, а потом посмотри, сколько цифр должно быть в остатке. Пропущенные разряды заполняются нулями.',
      explain: fact(P.a, P.b) + '. ' + q(x.b, P.a) + ' = ' + q(x.b * f, P.b) + '. ' + fmt(x.b * f) + ' + ' + fmt(x.s) + ' = ' + fmt(right) + '. Остаток ' + fmt(x.s) + ' занимает младшие разряды, а пропущенные разряды между ним и крупной мерой — нули.'
    };
  });

  /* Превращение: o.mode — 'exact' | 'compound' | 'triple' */
  reg('n1Merge', function (o) {
    o = o || {};
    var mode = o.mode || pick(['exact', 'compound', 'compound']), P, k, x;
    if (o.triple) mode = 'triple';
    if (mode === 'triple') {
      var T = TRI[o.sys === 'wt' ? 'wt' : (o.sys === 'len' ? 'len' : pick(['len', 'wt']))], v = T.gen(), U = T.units, last = U[2], total = triTotal(U, v), r = total, lines = [];
      for (var i = 0; i < 2; i++) {
        var rt = ratio(U[i], last), qq = Math.floor(r / rt), rem = r - qq * rt;
        lines.push(fmt(r) + ' : ' + fmt(rt) + ' = ' + qq + ' (ост. ' + rem + ') — это ' + q(qq, U[i]) + ' и остаток ' + q(rem, last));
        r = rem;
      }
      return {
        kind: 'nums', html: 'Вырази в ' + PREP[U[0]] + ', ' + PREP[U[1]] + ' и ' + PREP[U[2]] + ': ' + expr(q(total, last) + ' = □' + NB + U[0] + ' □' + NB + U[1] + ' □' + NB + U[2]),
        fields: [{ label: U[0] }, { label: U[1] }, { label: U[2] }], answer: v,
        hint: 'Сначала узнай, сколько получится ' + GENP[U[0]] + ' (дели на ' + fmt(ratio(U[0], last)) + '), потом с остатком поступи так же для ' + GENP[U[1]] + '.',
        explain: fact(U[0], last) + ', ' + fact(U[1], last) + '. ' + lines.join('; ') + '. Значит, ' + q(total, last) + ' = ' + cn3(U, v) + '.'
      };
    }
    if (mode === 'exact') {
      P = pickS(o); k = bigOf(P, 2);
      return {
        kind: 'num', html: 'Преврати в ' + ACC[P.a] + ': ' + expr(q(k * P.f, P.b) + ' = □' + NB + P.a), answer: k,
        hint: fact(P.a, P.b) + '. Мелкие меры заменяем крупными: делим.',
        explain: fact(P.a, P.b) + '. ' + fmt(k * P.f) + ' : ' + fmt(P.f) + ' = ' + fmt(k) + ', значит ' + q(k * P.f, P.b) + ' = ' + q(k, P.a) + '.'
      };
    }
    P = pickC(o); x = { b: bigOf(P, 1), s: smallOf(P) };
    var total2 = tot(P, x);
    return {
      kind: 'nums', html: 'Вырази в ' + PREP[P.a] + ' и ' + PREP[P.b] + ': ' + expr(q(total2, P.b) + ' = □' + NB + P.a + ' □' + NB + P.b),
      fields: fieldsOf(P), answer: [x.b, x.s],
      hint: fact(P.a, P.b) + '. Раздели число на ' + fmt(P.f) + ': частное — ' + ACC[P.a] + ', остаток — ' + ACC[P.b] + '.',
      explain: fact(P.a, P.b) + '. ' + fmt(total2) + ' : ' + fmt(P.f) + ' = ' + fmt(x.b) + ' (ост. ' + fmt(x.s) + '). Частное — это ' + ACC[P.a] + ', остаток — ' + ACC[P.b] + '. Значит, ' +
        q(total2, P.b) + ' = ' + cn(P, x) + '.'
    };
  });

  /* Превращение с выбором записи */
  reg('n1MergeChoice', function (o) {
    o = o || {};
    var P = pickC(Object.assign({}, o, { minF: 100 })), f = P.f, x = { b: bigOf(P, 1, 50), s: smallOf(P, 'gap') }, total = tot(P, x);
    var cands = [{ b: x.b, s: x.s * 10 }, { b: x.b, s: Math.floor(x.s / 10) }, { b: x.b + 1, s: f - x.s }, { b: x.b * 10, s: x.s }, { b: x.b, s: x.s + 1 }];
    var seen = {}, wrong = [];
    seen[total] = 1;
    shuffle(cands).forEach(function (c) {
      var t = tot(P, c);
      if (wrong.length < 3 && c.s > 0 && c.s < f && !seen[t]) { seen[t] = 1; wrong.push(c); }
    });
    var add = 2;
    while (wrong.length < 3) { var c3 = { b: x.b, s: x.s + add }; add++; if (c3.s < f && !seen[tot(P, c3)]) { seen[tot(P, c3)] = 1; wrong.push(c3); } }
    var all = shuffle([x].concat(wrong));
    return {
      kind: 'choice', html: 'Вырази в ' + PREP[P.a] + ' и ' + PREP[P.b] + ': ' + expr(q(total, P.b)) + '<br>Какая запись верна?',
      options: all.map(function (c) { return cn(P, c); }), answer: all.indexOf(x),
      hint: 'Раздели число на ' + fmt(f) + '. Остаток запиши целиком, с нужными нулями: он должен показывать, сколько ' + GENP[P.b] + ' осталось.',
      explain: fact(P.a, P.b) + '. ' + fmt(total) + ' : ' + fmt(f) + ' = ' + fmt(x.b) + ' (ост. ' + fmt(x.s) + '). Значит, ' + q(total, P.b) + ' = ' + cn(P, x) + '.'
    };
  });

  /* ================= сложение и вычитание именованных чисел (уроки 64–70) ================= */
  function isNZ(x) { return x.b > 0 || x.s > 0; }
  function comp(P, lo, hi, style) { return { b: bigOf(P, lo || 1, hi || 40), s: smallOf(P, style) }; }
  function bump(P, lo) { return rand(lo, Math.max(lo + 1, Math.min(25, Math.round(BR[P.key] * 0.6)))); }
  function addHint(P) {
    return 'Складывай меры с одинаковыми названиями: ' + ACC[P.b] + ' с ' + INS[P.b] + ', ' + ACC[P.a] + ' с ' + INS[P.a] + '. Если ' + GENP[P.b] +
      ' наберётся ' + fmt(P.f) + ' или больше, замени ' + q(P.f, P.b) + ' на 1' + NB + P.a + '.';
  }
  function subHint(P) {
    return 'Вычитай меры с одинаковыми названиями. Если ' + GENP[P.b] + ' в уменьшаемом меньше, чем в вычитаемом, займи одну крупную меру и раздроби её: 1' + NB + P.a + ' = ' + q(P.f, P.b) + '.';
  }
  function singleSteps(P, ops, op, T) {
    var parts = ops.map(function (x) { return cn(P, x) + ' = ' + q(tot(P, x), P.b); });
    return fact(P.a, P.b) + '. ' + parts.join('; ') + '. ' + ops.map(function (x) { return fmt(tot(P, x)); }).join(op === '+' ? ' + ' : ' − ') + ' = ' + fmt(T) + ' (' + P.b + ').';
  }

  /* слагаемые для сложения; mode: nocarry | carry | gap | mixed | simple */
  function makeAdd(P, mode, terms) {
    var f = P.f, ops;
    if (terms === 3) {
      return until(function () { return [comp(P), comp(P), comp(P)]; }, function (a) {
        var S = a[0].s + a[1].s + a[2].s;
        return S % f !== 0 && (mode === 'carry' ? S >= f : S < f);
      });
    }
    if (mode === 'nocarry') return until(function () { return [comp(P), comp(P)]; }, function (a) { return a[0].s + a[1].s < f; });
    if (mode === 'carry') return until(function () { return [comp(P), comp(P)]; }, function (a) { var S = a[0].s + a[1].s; return S >= f && S % f !== 0; });
    if (mode === 'gap') {
      return until(function () { return [comp(P, 1, 40, 'gap'), comp(P, 1, 40, 'gap')]; }, function (a) {
        var S = a[0].s + a[1].s;
        return f === 1000 ? (a[0].s > 10 && a[1].s > 10 && S >= 100) : true;
      });
    }
    if (mode === 'mixed') {
      var c = comp(P), sm;
      if (Math.random() < 0.5) {
        sm = { b: 0, s: smallOf(P) };
        while ((c.s + sm.s) % f === 0) sm.s = smallOf(P);
      } else sm = { b: bigOf(P, 1, 30), s: 0 };
      return Math.random() < 0.5 ? [c, sm] : [sm, c];
    }
    /* simple: простые числа с разными наименованиями или две мелкие меры */
    if (Math.random() < 0.55) {
      ops = [{ b: bigOf(P, 1, 40), s: 0 }, { b: 0, s: smallOf(P) }];
      return Math.random() < 0.5 ? ops : [ops[1], ops[0]];
    }
    return until(function () { return [{ b: 0, s: smallOf(P) }, { b: 0, s: smallOf(P) }]; }, function (a) { var S = a[0].s + a[1].s; return S >= f && S % f !== 0; });
  }

  reg('n1Add', function (o) {
    o = o || {};
    var P = pickC(o), f = P.f, mode = o.mode || pick(['nocarry', 'carry', 'carry', 'gap', 'mixed', 'simple']);
    if (mode === 'gap' && f === 10) mode = 'carry';
    var ops = makeAdd(P, mode, o.terms), res = resultOf(P, ops, '+'), T = tot(P, res);
    var lst = ops.map(function (x) { return cn(P, x); }).join(' + ');
    if (o.ans === 'single') {
      return {
        kind: 'num', html: 'Найди сумму и вырази её в ' + PREP[P.b] + ': ' + expr(lst),
        answer: T,
        hint: fact(P.a, P.b) + '. Раздроби каждое число в ' + ACC[P.b] + ' и сложи как обычные числа.',
        explain: singleSteps(P, ops, '+', T)
      };
    }
    return {
      kind: 'nums', html: 'Сложи и запиши ответ в ' + PREP[P.a] + ' и ' + PREP[P.b] + ': ' + expr(lst),
      fields: fieldsOf(P), answer: [res.b, res.s],
      hint: addHint(P),
      explain: 'Запишем столбиком:<br>' + R.n1ColHTML(P, ops, '+') + '<span class="colsteps">' + stepsAdd(P, ops).join('<br>') + '</span>Ответ: ' + cn(P, res) + '.'
    };
  });

  /* Сложение: выбор верного ответа (с переходом через меру) */
  reg('n1AddChoice', function (o) {
    o = o || {};
    var P = pickC(o), f = P.f, ops = makeAdd(P, 'carry'), x = ops[0], y = ops[1], S = x.s + y.s, B = x.b + y.b, res = resultOf(P, ops, '+');
    var cands = [{ b: B, s: S - f }, { b: B + 1, s: S }, { b: B + 1, s: Math.abs(x.s - y.s) }, { b: B + 1, s: (S - f + f / 10) % f }, { b: B + 2, s: S - f }];
    var seen = {}, wrong = [];
    seen[cn(P, res)] = 1;
    shuffle(cands).forEach(function (c) {
      var t = cn(P, c);
      if (wrong.length < 3 && !seen[t] && c.s > 0 && tot(P, c) !== tot(P, res)) { seen[t] = 1; wrong.push(c); }
    });
    var all = shuffle([res].concat(wrong));
    return {
      kind: 'choice', html: 'Сложи: ' + expr(cn(P, x) + ' + ' + cn(P, y)) + '<br>Какой ответ верный?',
      options: all.map(function (c) { return cn(P, c); }), answer: all.indexOf(res),
      hint: 'Сложи ' + ACC[P.b] + ' отдельно. Если получилось ' + fmt(f) + ' или больше — сделай перенос в ' + ACC[P.a] + '.',
      explain: 'Запишем столбиком:<br>' + R.n1ColHTML(P, ops, '+') + '<span class="colsteps">' + stepsAdd(P, ops).join('<br>') + '</span>Ответ: ' + cn(P, res) + '.'
    };
  });

  /* уменьшаемое и вычитаемое; mode: noborrow | borrow | gap | simple | mixed */
  function makeSub(P, mode) {
    var f = P.f, x, y;
    if (mode === 'gap' && f === 10) mode = 'borrow';
    if (mode === 'noborrow') {
      return until(function () { y = comp(P, 1, 30); return [{ b: y.b + bump(P, 1), s: smallOf(P) }, y]; }, function (a) { return a[0].s > a[1].s; });
    }
    if (mode === 'borrow') {
      return until(function () { y = comp(P, 1, 30); return [{ b: y.b + bump(P, 2), s: smallOf(P) }, y]; }, function (a) { return a[0].s < a[1].s; });
    }
    if (mode === 'gap') {
      return until(function () {
        y = { b: bigOf(P, 1, 30), s: smallOf(P, 'gap') };
        return [{ b: y.b + bump(P, 2), s: smallOf(P, 'gap') }, y];
      }, function (a) { return a[0].s < a[1].s && (f !== 1000 || (a[0].s > 0 && a[1].s > 10)); });
    }
    if (mode === 'simple') {
      y = { b: Math.random() < 0.6 ? bigOf(P, 1, 30) : 0, s: smallOf(P) };
      return [{ b: y.b + bump(P, 2), s: 0 }, y];
    }
    /* mixed: составное минус простое */
    if (Math.random() < 0.5) {
      y = { b: 0, s: smallOf(P) };
      x = until(function () { return { b: bigOf(P, 2, 30), s: smallOf(P) }; }, function (a) { return a.s !== y.s; });
      return [x, y];
    }
    y = { b: bigOf(P, 1, 30), s: 0 };
    return [{ b: y.b + bump(P, 1), s: smallOf(P) }, y];
  }

  reg('n1Sub', function (o) {
    o = o || {};
    var P = pickC(o), mode = o.mode || pick(['noborrow', 'borrow', 'borrow', 'gap', 'simple', 'mixed']);
    var ops = makeSub(P, mode), x = ops[0], y = ops[1], res = resultOf(P, ops, '-'), T = tot(P, res);
    var lst = cn(P, x) + ' − ' + cn(P, y);
    if (o.ans === 'single') {
      return {
        kind: 'num', html: 'Найди разность и вырази её в ' + PREP[P.b] + ': ' + expr(lst), answer: T,
        hint: fact(P.a, P.b) + '. Раздроби оба числа в ' + ACC[P.b] + ' и вычти как обычные числа.',
        explain: singleSteps(P, ops, '-', T)
      };
    }
    return {
      kind: 'nums', html: 'Вычти и запиши ответ в ' + PREP[P.a] + ' и ' + PREP[P.b] + ': ' + expr(lst),
      fields: fieldsOf(P), answer: [res.b, res.s], hint: subHint(P),
      explain: 'Запишем столбиком:<br>' + R.n1ColHTML(P, ops, '-') + '<span class="colsteps">' + stepsSub(P, x, y).join('<br>') + '<br>Проверка сложением: ' + cn(P, res) + ' + ' + cn(P, y) + ' = ' + cn(P, x) + '.</span>Ответ: ' + cn(P, res) + '.'
    };
  });

  /* Вычитание: выбор верного ответа (с занятием) */
  reg('n1SubChoice', function (o) {
    o = o || {};
    var P = pickC(o), f = P.f, ops = makeSub(P, 'borrow'), x = ops[0], y = ops[1], res = resultOf(P, ops, '-');
    var cands = [{ b: x.b - y.b, s: f + x.s - y.s }, { b: x.b - y.b, s: y.s - x.s }, { b: x.b - y.b - 1, s: y.s - x.s }, { b: x.b - y.b, s: x.s + y.s - f > 0 ? x.s + y.s - f : x.s }, { b: x.b - y.b - 2, s: f + x.s - y.s }];
    var seen = {}, wrong = [];
    seen[cn(P, res)] = 1;
    shuffle(cands).forEach(function (c) {
      var t = cn(P, c);
      if (wrong.length < 3 && !seen[t] && c.s > 0 && c.s < f && c.b > 0 && tot(P, c) !== tot(P, res)) { seen[t] = 1; wrong.push(c); }
    });
    var add = 1;
    while (wrong.length < 3) { var c2 = { b: res.b, s: res.s + add }; add++; if (c2.s < f && !seen[cn(P, c2)]) { seen[cn(P, c2)] = 1; wrong.push(c2); } }
    var all = shuffle([res].concat(wrong));
    return {
      kind: 'choice', html: 'Вычти: ' + expr(cn(P, x) + ' − ' + cn(P, y)) + '<br>Какой ответ верный?',
      options: all.map(function (c) { return cn(P, c); }), answer: all.indexOf(res),
      hint: 'В уменьшаемом ' + GENP[P.b] + ' меньше, чем в вычитаемом. Займи одну крупную меру и не забудь, что ' + GENP[P.a] + ' стало на 1 меньше.',
      explain: 'Запишем столбиком:<br>' + R.n1ColHTML(P, ops, '-') + '<span class="colsteps">' + stepsSub(P, x, y).join('<br>') + '</span>Ответ: ' + cn(P, res) + '.'
    };
  });

  /* Неизвестное слагаемое, уменьшаемое, вычитаемое. type: 0 □+a=c, 1 a+□=c, 2 □−a=c, 3 a−□=c */
  reg('n1Unk', function (o) {
    o = o || {};
    var P = pickC(o), type = o.type != null ? o.type : rand(0, 3), X, A, C, eq, hint, ex, rule;
    if (type <= 1) {
      X = comp(P, 1, 30); A = comp(P, 1, 30); C = fromTot(P, tot(P, X) + tot(P, A));
      eq = type === 0 ? '□ + ' + cn(P, A) + ' = ' + cn(P, C) : cn(P, A) + ' + □ = ' + cn(P, C);
      hint = 'Неизвестное слагаемое = сумма − известное слагаемое.';
      rule = 'Неизвестное слагаемое находим вычитанием: ' + cn(P, C) + ' − ' + cn(P, A) + '.';
      ex = rule + '<br>' + stepsSub(P, C, A).join('<br>') + '<br>Проверка: ' + cn(P, X) + ' + ' + cn(P, A) + ' = ' + cn(P, C) + '.';
    } else if (type === 2) {
      A = comp(P, 1, 30); X = { b: A.b + bump(P, 2), s: smallOf(P) }; C = fromTot(P, tot(P, X) - tot(P, A));
      eq = '□ − ' + cn(P, A) + ' = ' + cn(P, C);
      hint = 'Неизвестное уменьшаемое = разность + вычитаемое.';
      rule = 'Неизвестное уменьшаемое находим сложением: ' + cn(P, C) + ' + ' + cn(P, A) + '.';
      ex = rule + '<br>' + stepsAdd(P, [C, A]).join('<br>') + '<br>Проверка: ' + cn(P, X) + ' − ' + cn(P, A) + ' = ' + cn(P, C) + '.';
    } else {
      X = comp(P, 1, 30); A = { b: X.b + bump(P, 2), s: smallOf(P) }; C = fromTot(P, tot(P, A) - tot(P, X));
      eq = cn(P, A) + ' − □ = ' + cn(P, C);
      hint = 'Неизвестное вычитаемое = уменьшаемое − разность.';
      rule = 'Неизвестное вычитаемое находим вычитанием: ' + cn(P, A) + ' − ' + cn(P, C) + '.';
      ex = rule + '<br>' + stepsSub(P, A, C).join('<br>') + '<br>Проверка: ' + cn(P, A) + ' − ' + cn(P, X) + ' = ' + cn(P, C) + '.';
    }
    return {
      kind: 'nums', html: 'Найди неизвестное число и запиши его в ' + PREP[P.a] + ' и ' + PREP[P.b] + ': ' + expr(eq),
      fields: fieldsOf(P), answer: [X.b, X.s], hint: hint, explain: ex + '<br>Ответ: ' + cn(P, X) + '.'
    };
  });

  /* ================= текстовые задачи ================= */
  function r5(lo, hi) { return 5 * rand(Math.ceil(lo / 5), Math.floor(hi / 5)); }
  function r10(lo, hi) { return 10 * rand(Math.ceil(lo / 10), Math.floor(hi / 10)); }
  function S(P, a, b) { return fromTot(P, tot(P, a) + tot(P, b)); }        /* сумма */
  function D(P, a, b) { return fromTot(P, tot(P, a) - tot(P, b)); }        /* разность */
  function addLine(P, a, b) { return cn(P, a) + ' + ' + cn(P, b) + ' = ' + cn(P, S(P, a, b)); }
  function subLine(P, a, b) { return cn(P, a) + ' − ' + cn(P, b) + ' = ' + cn(P, D(P, a, b)); }
  function pickPlot(o, plots) { return o.plot != null ? plots[o.plot] : pick(plots); }
  function compNZ(P, lo, hi, style) { return { b: bigOf(P, lo, hi), s: smallOf(P, style) }; }
  function fin(P, res) { return { kind: 'nums', fields: fieldsOf(P), answer: [res.b, res.s] }; }

  /* --- простые задачи с простыми именованными числами (урок 60) --- */
  var BASIC = [
    function (three) {
      var a = r10(120, 480), d = r10(20, 90), b = a + d, tt = a + b, e = r10(50, tt - 100 - (tt % 10)), ans = three ? tt - e : tt;
      return {
        text: 'В магазин привезли ' + q(a, 'кг') + ' яблок, а груш — на ' + q(d, 'кг') + ' больше. ' + (three ? 'За день продали ' + q(e, 'кг') + ' фруктов. Сколько килограммов фруктов осталось?' : 'Сколько килограммов фруктов привезли?'),
        list: ['Сколько килограммов груш? ' + fmt(a) + ' + ' + fmt(d) + ' = ' + fmt(b), 'Сколько килограммов фруктов привезли? ' + fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(tt)].concat(three ? ['Сколько осталось? ' + fmt(tt) + ' − ' + fmt(e) + ' = ' + fmt(ans)] : []),
        ans: ans, unit: 'кг'
      };
    },
    function (three) {
      var a = rand(6, 25) * 10, d = rand(1, 4) * 10, b = a - d, tt = a + b, e = r10(30, tt - 50), ans = three ? tt - e : tt;
      return {
        text: 'Для забора купили ' + q(a, 'м') + ' сетки, а для ограды — на ' + q(d, 'м') + ' меньше. ' + (three ? 'Из всей сетки уже использовали ' + q(e, 'м') + '. Сколько метров сетки осталось?' : 'Сколько метров сетки купили всего?'),
        list: ['Сколько метров сетки купили для ограды? ' + fmt(a) + ' − ' + fmt(d) + ' = ' + fmt(b), 'Сколько метров купили всего? ' + fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(tt)].concat(three ? ['Сколько метров осталось? ' + fmt(tt) + ' − ' + fmt(e) + ' = ' + fmt(ans)] : []),
        ans: ans, unit: 'м'
      };
    },
    function (three) {
      var a = rand(20, 60), d = rand(5, 20), b = a + d, tt = a + b, pay = Math.ceil((tt + 1) / 50) * 50, ans = three ? pay - tt : tt;
      return {
        text: 'Тетрадь стоит ' + q(a, 'руб.') + ', а ручка — на ' + q(d, 'руб.') + ' дороже. ' + (three ? 'Покупатель дал за тетрадь и ручку ' + q(pay, 'руб.') + '. Сколько рублей сдачи он получил?' : 'Сколько рублей надо заплатить за тетрадь и ручку?'),
        list: ['Сколько стоит ручка? ' + fmt(a) + ' + ' + fmt(d) + ' = ' + fmt(b), 'Сколько стоит вся покупка? ' + fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(tt)].concat(three ? ['Сколько сдачи? ' + fmt(pay) + ' − ' + fmt(tt) + ' = ' + fmt(ans)] : []),
        ans: ans, unit: 'руб.'
      };
    },
    function (three) {
      var a = rand(12, 25), d = rand(2, 8), b = a + d, tt = a + b, L = tt + rand(5, 20), ans = three ? L - tt : tt;
      return {
        text: 'Туристы в первый день прошли ' + q(a, 'км') + ', а во второй — на ' + q(d, 'км') + ' больше. ' + (three ? 'Весь маршрут — ' + q(L, 'км') + '. Сколько километров им осталось пройти?' : 'Сколько километров они прошли за два дня?'),
        list: ['Сколько километров прошли во второй день? ' + fmt(a) + ' + ' + fmt(d) + ' = ' + fmt(b), 'Сколько километров за два дня? ' + fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(tt)].concat(three ? ['Сколько осталось? ' + fmt(L) + ' − ' + fmt(tt) + ' = ' + fmt(ans)] : []),
        ans: ans, unit: 'км'
      };
    },
    function (three) {
      var a = rand(40, 90), d = rand(5, 25), b = a - d, tt = a + b, e = rand(10, 40), ans = three ? tt + e : tt;
      return {
        text: 'С первого поля собрали ' + q(a, 'ц') + ' пшеницы, а со второго — на ' + q(d, 'ц') + ' меньше. ' + (three ? 'С третьего поля собрали ' + q(e, 'ц') + '. Сколько центнеров пшеницы собрали с трёх полей?' : 'Сколько центнеров пшеницы собрали с двух полей?'),
        list: ['Сколько центнеров собрали со второго поля? ' + fmt(a) + ' − ' + fmt(d) + ' = ' + fmt(b), 'Сколько с двух полей? ' + fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(tt)].concat(three ? ['Сколько с трёх полей? ' + fmt(tt) + ' + ' + fmt(e) + ' = ' + fmt(ans)] : []),
        ans: ans, unit: 'ц'
      };
    }
  ];
  reg('n1PBasic', function (o) {
    o = o || {};
    var three = o.steps === 3 || (o.steps == null && Math.random() < 0.4), pl = pickPlot(o, BASIC)(three);
    return {
      kind: 'num', html: pl.text, answer: pl.ans,
      hint: 'Сначала найди то, чего не хватает для ответа: разбери задачу на ' + (three ? 'три' : 'два') + ' действия.',
      explain: steps(pl.list.map(function (l) { return l + ' (' + pl.unit + ')'; }), q(pl.ans, pl.unit))
    };
  });

  /* --- раздробление в задачах (уроки 61, 63) --- */
  var SPLIT = [
    function () {                                    /* круги по парку: × */
      var P = PP('км', 'м'), x = { b: rand(1, 3), s: r50(100, 900) }, n = rand(2, 8), one = tot(P, x), ans = one * n;
      return {
        text: 'Длина одного круга по парку — ' + cn(P, x) + '. Сколько метров пробежит спортсмен за ' + n + ' ' + R.plural(n, ['круг', 'круга', 'кругов']) + '?',
        list: ['Сколько метров в одном круге? ' + cn(P, x) + ' = ' + fmt(one) + ' м', 'Сколько метров за ' + n + ' ' + R.plural(n, ['круг', 'круга', 'кругов']) + '? ' + fmt(one) + ' × ' + n + ' = ' + fmt(ans)],
        ans: ans, unit: 'м', hint: 'Сначала вырази длину круга в метрах.'
      };
    },
    function () {                                    /* ленточки: : */
      var P = PP('м', 'см'), m, c, p, T, guard = 0;
      do { m = rand(2, 9); c = r5(10, 95); T = m * 100 + c; p = pick([10, 15, 20, 25, 30, 40, 50, 60]); } while ((T % p !== 0 || T / p < 4 || T / p > 40) && guard++ < 500);
      var x = { b: m, s: c };
      return {
        text: 'Из куска тесьмы длиной ' + cn(P, x) + ' нарезали ленточки по ' + q(p, 'см') + '. Сколько ленточек получилось?',
        list: ['Сколько сантиметров в куске тесьмы? ' + cn(P, x) + ' = ' + fmt(T) + ' см', 'Сколько ленточек? ' + fmt(T) + ' : ' + p + ' = ' + fmt(T / p)],
        ans: T / p, unit: R.plural(T / p, ['ленточка', 'ленточки', 'ленточек']), hint: 'Сначала вырази длину куска в сантиметрах: тогда мерки будут одинаковые.'
      };
    },
    function () {                                    /* самосвал: × */
      var P = PP('т', 'кг'), x = { b: rand(2, 5), s: r50(50, 950) }, n = rand(3, 9), one = tot(P, x), ans = one * n;
      return {
        text: 'Самосвал за один рейс вывозит ' + cn(P, x) + ' песка. Сколько килограммов песка он вывезет за ' + n + ' ' + R.plural(n, ['рейс', 'рейса', 'рейсов']) + '?',
        list: ['Сколько килограммов в одном рейсе? ' + cn(P, x) + ' = ' + fmt(one) + ' кг', 'Сколько килограммов за ' + n + ' ' + R.plural(n, ['рейс', 'рейса', 'рейсов']) + '? ' + fmt(one) + ' × ' + n + ' = ' + fmt(ans)],
        ans: ans, unit: 'кг', hint: 'Сначала вырази груз одного рейса в килограммах.'
      };
    },
    function () {                                    /* мёд по банкам: : */
      var P = PP('кг', 'г'), b, s, p, T, guard = 0;
      do { b = rand(2, 9); s = 100 * rand(1, 9); T = b * 1000 + s; p = pick([100, 200, 250, 300, 400, 500]); } while ((T % p !== 0 || T / p < 4 || T / p > 40) && guard++ < 500);
      var x = { b: b, s: s };
      return {
        text: 'В бидоне ' + cn(P, x) + ' мёда. Его разложили по банкам, по ' + q(p, 'г') + ' в каждую. Сколько банок понадобилось?',
        list: ['Сколько граммов мёда в бидоне? ' + cn(P, x) + ' = ' + fmt(T) + ' г', 'Сколько банок? ' + fmt(T) + ' : ' + p + ' = ' + fmt(T / p)],
        ans: T / p, unit: R.plural(T / p, ['банка', 'банки', 'банок']), hint: 'Сначала вырази массу мёда в граммах.'
      };
    },
    function () {                                    /* тетради: × */
      var P = PP('руб.', 'коп.'), x = { b: rand(12, 48), s: r5(5, 95) }, n = rand(2, 6), one = tot(P, x), ans = one * n;
      return {
        text: 'Тетрадь стоит ' + cn(P, x) + '. Сколько копеек надо заплатить за ' + n + ' ' + R.plural(n, ['тетрадь', 'тетради', 'тетрадей']) + '?',
        list: ['Сколько копеек стоит одна тетрадь? ' + cn(P, x) + ' = ' + fmt(one) + ' коп.', 'Сколько копеек за ' + n + ' ' + R.plural(n, ['тетрадь', 'тетради', 'тетрадей']) + '? ' + fmt(one) + ' × ' + n + ' = ' + fmt(ans)],
        ans: ans, unit: 'коп.', hint: 'Сначала вырази цену тетради в копейках.'
      };
    },
    function () {                                    /* до 10 км: три действия */
      var P = PP('км', 'м'), x, n, one, T, guard = 0;
      do { x = { b: 1, s: r50(100, 900) }; n = rand(3, 8); one = tot(P, x); T = one * n; } while ((T < 3000 || T > 9600) && guard++ < 500);
      var ans = 10000 - T;
      return {
        text: 'Спортсмен готовится пробежать 10 км. Он уже пробежал ' + n + ' ' + R.plural(n, ['круг', 'круга', 'кругов']) + ' по ' + cn(P, x) + '. Сколько метров ему осталось пробежать?',
        list: ['Сколько метров в одном круге? ' + cn(P, x) + ' = ' + fmt(one) + ' м', 'Сколько метров он уже пробежал? ' + fmt(one) + ' × ' + n + ' = ' + fmt(T), 'Сколько метров осталось? 10 км = 10 000 м; 10 000 − ' + fmt(T) + ' = ' + fmt(ans)],
        ans: ans, unit: 'м', hint: 'Все длины вырази в метрах, тогда останется посчитать три действия.'
      };
    },
    function () {                                    /* грузовик и сено: три действия */
      var P = PP('ц', 'кг'), x, n, one, T, guard = 0;
      do { x = { b: rand(2, 4), s: r10(10, 90) }; n = rand(3, 9); one = tot(P, x); T = one * n; } while ((T < 1500 || T > 4800) && guard++ < 500);
      var ans = 5000 - T;
      return {
        text: 'В кузов грузовика, рассчитанного на 5 т, уже погрузили ' + n + ' ' + R.plural(n, ['тюк', 'тюка', 'тюков']) + ' сена по ' + cn(P, x) + '. Сколько килограммов груза можно ещё добавить?',
        list: ['Сколько килограммов в одном тюке? ' + cn(P, x) + ' = ' + fmt(one) + ' кг', 'Сколько килограммов уже погружено? ' + fmt(one) + ' × ' + n + ' = ' + fmt(T), 'Сколько ещё можно добавить? 5 т = 5 000 кг; 5 000 − ' + fmt(T) + ' = ' + fmt(ans)],
        ans: ans, unit: 'кг', hint: 'Вырази все массы в килограммах: 1 т = 1 000 кг, 1 ц = 100 кг.'
      };
    }
  ];
  function r50(lo, hi) { return 50 * rand(Math.ceil(lo / 50), Math.floor(hi / 50)); }
  reg('n1PSplit', function (o) {
    o = o || {};
    var pl = pickPlot(o, SPLIT)();
    return { kind: 'num', html: pl.text, answer: pl.ans, hint: pl.hint, explain: steps(pl.list, q(pl.ans, pl.unit)) };
  });

  /* --- превращение в задачах (урок 62) --- */
  var MERGE = [
    function () {                                    /* кабель */
      var P = PP('км', 'м'), a = r10(400, 900), c = r10(400, 900), T;
      while ((a + c) % 1000 === 0) c = r10(400, 900);
      T = a + c;
      var res = fromTot(P, T);
      return { P: P, res: res, text: 'В первый день электрики проложили ' + q(a, 'м') + ' кабеля, во второй — ' + q(c, 'м') + '. Сколько километров и метров кабеля проложили за два дня?',
        list: ['Сколько метров проложили за два дня? ' + fmt(a) + ' + ' + fmt(c) + ' = ' + fmt(T), 'Превратим метры в километры и метры: ' + fmt(T) + ' : 1 000 = ' + res.b + ' (ост. ' + res.s + '), то есть ' + fmt(T) + ' м = ' + cn(P, res)], hint: 'Сложи метры, а потом преврати сумму в километры и метры.' };
    },
    function () {                                    /* рыба */
      var P = PP('т', 'кг'), a = r10(400, 900), c = r10(400, 900), T;
      while ((a + c) % 1000 === 0) c = r10(400, 900);
      T = a + c;
      var res = fromTot(P, T);
      return { P: P, res: res, text: 'Рыбаки поймали утром ' + q(a, 'кг') + ' рыбы, а вечером — ' + q(c, 'кг') + '. Сколько тонн и килограммов рыбы они поймали за день?',
        list: ['Сколько килограммов рыбы за день? ' + fmt(a) + ' + ' + fmt(c) + ' = ' + fmt(T), 'Превратим килограммы в тонны и килограммы: ' + fmt(T) + ' : 1 000 = ' + res.b + ' (ост. ' + res.s + '), то есть ' + fmt(T) + ' кг = ' + cn(P, res)], hint: 'Сложи килограммы, а потом преврати сумму в тонны и килограммы.' };
    },
    function () {                                    /* шаги */
      var P = PP('м', 'см'), p = pick([50, 55, 60, 65, 70]), n, T, guard = 0;
      do { n = rand(20, 90); T = p * n; } while ((T < 1000 || T % 100 === 0) && guard++ < 500);
      var res = fromTot(P, T);
      return { P: P, res: res, text: 'Шаг мальчика — ' + q(p, 'см') + '. Сколько метров и сантиметров он пройдёт за ' + n + ' ' + R.plural(n, ['шаг', 'шага', 'шагов']) + '?',
        list: ['Сколько сантиметров в ' + n + ' ' + R.plural(n, ['шаге', 'шагах', 'шагах']) + '? ' + p + ' × ' + n + ' = ' + fmt(T), 'Превратим сантиметры в метры и сантиметры: ' + fmt(T) + ' : 100 = ' + res.b + ' (ост. ' + res.s + '), то есть ' + fmt(T) + ' см = ' + cn(P, res)], hint: 'Сначала найди длину в сантиметрах, потом преврати её в метры и сантиметры.' };
    },
    function () {                                    /* монеты */
      var P = PP('руб.', 'коп.'), c = pick([10, 50]), n, T, guard = 0;
      do { n = c === 50 ? 2 * rand(2, 19) + 1 : rand(11, 99); T = c * n; } while ((T < 100 || T % 100 === 0) && guard++ < 500);
      var res = fromTot(P, T);
      return { P: P, res: res, text: 'Мальчик копил монеты по ' + q(c, 'коп.') + ': у него накопилось ' + n + ' ' + R.plural(n, ['монета', 'монеты', 'монет']) + '. Сколько рублей и копеек он накопил?',
        list: ['Сколько копеек в ' + n + ' ' + R.plural(n, ['монете', 'монетах', 'монетах']) + '? ' + c + ' × ' + n + ' = ' + fmt(T), 'Превратим копейки в рубли и копейки: ' + fmt(T) + ' : 100 = ' + res.b + ' (ост. ' + res.s + '), то есть ' + fmt(T) + ' коп. = ' + cn(P, res)], hint: 'Найди сумму в копейках, потом преврати её в рубли и копейки.' };
    },
    function () {                                    /* комбайн */
      var P = PP('т', 'ц'), p, n, T, guard = 0;
      do { p = rand(150, 290); n = rand(2, 6); T = p * n; } while ((T % 10 === 0 || T < 100) && guard++ < 500);
      var res = fromTot(P, T);
      return { P: P, res: res, text: 'Комбайн убирает за день ' + q(p, 'ц') + ' зерна. Сколько тонн и центнеров зерна он уберёт за ' + n + ' ' + R.plural(n, ['день', 'дня', 'дней']) + '?',
        list: ['Сколько центнеров за ' + n + ' ' + R.plural(n, ['день', 'дня', 'дней']) + '? ' + p + ' × ' + n + ' = ' + fmt(T), 'Превратим центнеры в тонны и центнеры: ' + fmt(T) + ' : 10 = ' + res.b + ' (ост. ' + res.s + '), то есть ' + fmt(T) + ' ц = ' + cn(P, res)], hint: 'Найди зерно в центнерах, потом преврати в тонны и центнеры: 1 т = 10 ц.' };
    },
    function () {                                    /* ящики с яблоками */
      var P = PP('ц', 'кг'), p = rand(18, 25), n, T, guard = 0;
      do { n = rand(8, 40); T = p * n; } while ((T % 100 === 0 || T < 100) && guard++ < 500);
      var res = fromTot(P, T);
      return { P: P, res: res, text: 'На склад привезли ' + n + ' ' + R.plural(n, ['ящик', 'ящика', 'ящиков']) + ' яблок по ' + q(p, 'кг') + ' в каждом. Сколько центнеров и килограммов яблок привезли?',
        list: ['Сколько килограммов яблок привезли? ' + p + ' × ' + n + ' = ' + fmt(T), 'Превратим килограммы в центнеры и килограммы: ' + fmt(T) + ' : 100 = ' + res.b + ' (ост. ' + res.s + '), то есть ' + fmt(T) + ' кг = ' + cn(P, res)], hint: 'Найди массу в килограммах, потом преврати её в центнеры и килограммы: 1 ц = 100 кг.' };
    }
  ];
  reg('n1PMerge', function (o) {
    o = o || {};
    var pl = pickPlot(o, MERGE)();
    var r = fin(pl.P, pl.res);
    r.html = pl.text; r.hint = pl.hint; r.explain = steps(pl.list, cn(pl.P, pl.res));
    return r;
  });

  /* --- «факты»: реальные величины --- */
  var FACTS = [
    function () {
      var P = PP('м', 'см'), c; do { c = rand(250, 320); } while (c % 100 === 0);
      var res = fromTot(P, c);
      return { P: P, res: res, text: 'Размах крыльев андского кондора — около ' + q(c, 'см') + '. Сколько это метров и сантиметров?', list: [fmt(c) + ' : 100 = ' + res.b + ' (ост. ' + res.s + ')'] };
    },
    function () {
      var P = PP('м', 'дм'), c; do { c = rand(40, 55); } while (c % 10 === 0);
      var res = fromTot(P, c);
      return { P: P, res: res, text: 'Рост жирафа может достигать ' + q(c, 'дм') + '. Сколько это метров и дециметров?', list: [c + ' : 10 = ' + res.b + ' (ост. ' + res.s + ')'] };
    },
    function () {
      var P = PP('т', 'ц'), c; do { c = rand(30, 65) * 100; } while (c % 1000 === 0);
      var T = c / 100, res = fromTot(P, T);
      return { P: P, res: res, text: 'Африканский слон весит около ' + q(c, 'кг') + '. Сколько это тонн и центнеров?',
        list: ['Сколько центнеров в ' + q(c, 'кг') + '? ' + fmt(c) + ' : 100 = ' + T, 'Превратим центнеры в тонны и центнеры: ' + T + ' : 10 = ' + res.b + ' (ост. ' + res.s + ')'] };
    },
    function () {
      var kg = 5000 * rand(20, 30), t = kg / 1000;
      return { single: true, ans: t, unit: 'т', text: 'Голубой кит может весить около ' + q(kg, 'кг') + '. Сколько это тонн?', list: [fmt(kg) + ' : 1 000 = ' + t] };
    },
    function () {
      var P = PP('км', 'м'), m = pick([['Эльбрус', 5642], ['Эверест', 8849]]), res = fromTot(P, m[1]);
      return { P: P, res: res, text: 'Высота горы ' + m[0] + ' — ' + q(m[1], 'м') + '. Сколько это километров и метров?', list: [fmt(m[1]) + ' : 1 000 = ' + res.b + ' (ост. ' + res.s + ')'] };
    },
    function () {
      var P = PP('км', 'м');
      return { P: P, res: { b: 1, s: 642 }, text: 'Наибольшая глубина озера Байкал — ' + q(1642, 'м') + '. Сколько это километров и метров?', list: ['1 642 : 1 000 = 1 (ост. 642)'] };
    },
    function () {
      var P = PP('км', 'м');
      return { single: true, ans: 42195, unit: 'м', text: 'Марафонская дистанция — ' + cn(P, { b: 42, s: 195 }) + '. Сколько это метров?', list: ['42 км = 42 000 м', '42 000 + 195 = 42 195'] };
    }
  ];
  reg('n1PFact', function (o) {
    o = o || {};
    var pl = pickPlot(o, FACTS)();
    if (pl.single) {
      return { kind: 'num', html: pl.text, answer: pl.ans, hint: 'Вспомни таблицу мер и подумай, что делать: умножать или делить.', explain: steps(pl.list, q(pl.ans, pl.unit)) };
    }
    var r = fin(pl.P, pl.res);
    r.html = pl.text; r.hint = 'Мелкие меры превращаем в крупные: дели на число мелких единиц в крупной. Частное — крупные меры, остаток — мелкие.';
    r.explain = steps(pl.list, cn(pl.P, pl.res));
    return r;
  });

  /* --- сложение именованных чисел в задачах (уроки 64–66) --- */
  /* каждая функция возвращает {P, text, list, res}; steps3 — с третьим слагаемым */
  var ADDP = [
    function (three) {                               /* маршрут */
      var P = PP('км', 'м'), A, Dd, C, S2, res;
      do {
        A = compNZ(P, 8, 18); Dd = compNZ(P, 1, 6); C = compNZ(P, 3, 15); S2 = S(P, A, Dd);
        res = three ? S(P, S(P, A, S2), C) : S(P, A, S2);
      } while (res.s === 0);
      var mid = S(P, A, S2);
      return { P: P, res: res, text: 'В первый день туристы прошли ' + cn(P, A) + ', а во второй — на ' + cn(P, Dd) + ' больше' + (three ? ', в третий — ' + cn(P, C) + '. Сколько всего они прошли за три дня?' : '. Сколько всего они прошли за два дня?'),
        list: ['Сколько прошли во второй день? ' + addLine(P, A, Dd), 'Сколько за первые два дня? ' + addLine(P, A, S2)].concat(three ? ['Сколько за три дня? ' + addLine(P, mid, C)] : []) };
    },
    function (three) {                               /* склад */
      var P = PP('т', 'кг'), A, B, C, res, ab;
      do { A = compNZ(P, 2, 15); B = compNZ(P, 2, 15); C = compNZ(P, 1, 9); ab = S(P, A, B); res = S(P, ab, C); } while (res.s === 0);
      return { P: P, res: res, text: 'На склад в понедельник привезли ' + cn(P, A) + ' картофеля, во вторник — ' + cn(P, B) + ', а в среду — ' + cn(P, C) + '. Сколько картофеля привезли за три дня?',
        list: ['Сколько привезли за два дня? ' + addLine(P, A, B), 'Сколько привезли за три дня? ' + addLine(P, ab, C)] };
    },
    function (three) {                               /* ткань */
      var P = PP('м', 'см'), A, Dd, S2, res;
      do { A = compNZ(P, 1, 3); Dd = Math.random() < 0.5 ? { b: 0, s: r5(20, 95) } : compNZ(P, 1, 2); S2 = S(P, A, Dd); res = S(P, A, S2); } while (res.s === 0);
      return { P: P, res: res, text: 'На платье пошло ' + cn(P, A) + ' ткани, а на юбку — на ' + cn(P, Dd) + ' больше. Сколько ткани пошло на платье и юбку вместе?',
        list: ['Сколько ткани на юбку? ' + addLine(P, A, Dd), 'Сколько ткани на платье и юбку вместе? ' + addLine(P, A, S2)] };
    },
    function (three) {                               /* деньги */
      var P = PP('руб.', 'коп.'), A, Dd, S2, res;
      do { A = { b: rand(60, 250), s: r5(5, 95) }; Dd = { b: rand(10, 80), s: r5(5, 95) }; S2 = S(P, A, Dd); res = S(P, A, S2); } while (res.s === 0);
      return { P: P, res: res, text: 'Книга стоит ' + cn(P, A) + ', а альбом — на ' + cn(P, Dd) + ' дороже. Сколько стоят книга и альбом вместе?',
        list: ['Сколько стоит альбом? ' + addLine(P, A, Dd), 'Сколько стоят книга и альбом вместе? ' + addLine(P, A, S2)] };
    },
    function (three) {                               /* рюкзаки */
      var P = PP('кг', 'г'), A, Dd, S2, res;
      do { A = { b: rand(6, 12), s: r10(50, 950) }; Dd = { b: rand(1, 4), s: r10(50, 950) }; S2 = S(P, A, Dd); res = S(P, A, S2); } while (res.s === 0);
      return { P: P, res: res, text: 'Рюкзак с продуктами весит ' + cn(P, A) + ', а рюкзак с палаткой — на ' + cn(P, Dd) + ' тяжелее. Сколько весят оба рюкзака вместе?',
        list: ['Сколько весит рюкзак с палаткой? ' + addLine(P, A, Dd), 'Сколько весят оба рюкзака? ' + addLine(P, A, S2)] };
    },
    function (three) {                               /* ремонт дороги */
      var P = PP('км', 'м'), A, B, Dd, C3, ab, res;
      do { A = compNZ(P, 2, 12); B = compNZ(P, 2, 12); Dd = compNZ(P, 1, 4); C3 = S(P, B, Dd); ab = S(P, A, B); res = S(P, ab, C3); } while (res.s === 0);
      return { P: P, res: res, text: 'Дорожники отремонтировали в первую неделю ' + cn(P, A) + ' дороги, во вторую — ' + cn(P, B) + ', а в третью — на ' + cn(P, Dd) + ' больше, чем во вторую. Сколько всего дороги они отремонтировали?',
        list: ['Сколько отремонтировали в третью неделю? ' + addLine(P, B, Dd), 'Сколько за первые две недели? ' + addLine(P, A, B), 'Сколько за все три недели? ' + addLine(P, ab, C3)] };
    }
  ];
  reg('n1PAdd', function (o) {
    o = o || {};
    var three = o.steps === 3 || (o.steps == null && Math.random() < 0.35);
    var plots = o.plot != null ? [ADDP[o.plot]] : (three ? [ADDP[0], ADDP[1], ADDP[5]] : ADDP);
    var pl = pick(plots)(three), r = fin(pl.P, pl.res);
    r.html = pl.text; r.hint = 'Разбери задачу на действия. Складывай меры с одинаковыми названиями и не забывай про переход через меру.';
    r.explain = steps(pl.list, cn(pl.P, pl.res));
    return r;
  });

  /* --- вычитание именованных чисел в задачах (уроки 67–69) --- */
  var SUBP = [
    function (three) {                               /* осталось проехать */
      var P = PP('км', 'м'), B, C, A, res, t;
      do { B = compNZ(P, 3, 20); C = compNZ(P, 2, 12); A = { b: B.b + C.b + rand(3, 15), s: smallOf(P) }; t = D(P, A, B); res = three ? D(P, t, C) : t; } while (res.s === 0 || res.b < 1);
      return { P: P, res: res, text: 'Расстояние между двумя посёлками — ' + cn(P, A) + '. ' + (three ? 'Велосипедист сначала проехал ' + cn(P, B) + ', а потом ещё ' + cn(P, C) + '. Сколько ему осталось проехать?' : 'Велосипедист проехал ' + cn(P, B) + '. Сколько ему осталось проехать?'),
        list: three ? ['Сколько осталось проехать после первой части? ' + subLine(P, A, B), 'Сколько осталось проехать в конце? ' + subLine(P, t, C)] : ['Сколько осталось? ' + subLine(P, A, B)] };
    },
    function (three) {                               /* уголь */
      var P = PP('т', 'кг'), B, C, A, res, t;
      do { B = compNZ(P, 2, 15); C = compNZ(P, 1, 9); A = { b: B.b + C.b + rand(3, 15), s: smallOf(P) }; t = D(P, A, B); res = three ? D(P, t, C) : t; } while (res.s === 0 || res.b < 1);
      return { P: P, res: res, text: 'На складе было ' + cn(P, A) + ' угля. ' + (three ? 'Сначала вывезли ' + cn(P, B) + ', потом ещё ' + cn(P, C) + '. Сколько угля осталось на складе?' : 'Со склада вывезли ' + cn(P, B) + '. Сколько угля осталось?'),
        list: three ? ['Сколько осталось после первого вывоза? ' + subLine(P, A, B), 'Сколько осталось после второго? ' + subLine(P, t, C)] : ['Сколько осталось? ' + subLine(P, A, B)] };
    },
    function (three) {                               /* трассы */
      var P = PP('км', 'м'), A, B, res;
      do { B = compNZ(P, 5, 30); A = { b: B.b + rand(1, 12), s: smallOf(P) }; res = D(P, A, B); } while (res.s === 0 || res.b < 1);
      return { P: P, res: res, text: 'Длина первой трассы — ' + cn(P, A) + ', а второй — ' + cn(P, B) + '. На сколько первая трасса длиннее второй?',
        list: ['Чтобы узнать, на сколько одно число больше другого, вычтем меньшее из большего: ' + subLine(P, A, B)] };
    },
    function (three) {                               /* сдача */
      var P = PP('руб.', 'коп.'), B, N, res;
      do { B = { b: rand(30, 190), s: r5(5, 95) }; N = pick([100, 200, 500, 1000].filter(function (v) { return v > B.b + 1; }).slice(0, 2)); res = D(P, { b: N, s: 0 }, B); } while (res.s === 0);
      return { P: P, res: res, text: 'Книга стоит ' + cn(P, B) + '. Покупатель дал ' + q(N, 'руб.') + '. Сколько сдачи он должен получить?',
        list: ['Сдача — это разность: ' + subLine(P, { b: N, s: 0 }, B)] };
    },
    function (three) {                               /* верёвка */
      var P = PP('м', 'см'), B, A, res;
      do { B = compNZ(P, 1, 8); A = { b: B.b + rand(2, 12), s: smallOf(P) }; res = D(P, A, B); } while (res.s === 0);
      return { P: P, res: res, text: 'От верёвки длиной ' + cn(P, A) + ' отрезали ' + cn(P, B) + '. Сколько верёвки осталось?',
        list: ['Сколько осталось? ' + subLine(P, A, B)] };
    },
    function (three) {                               /* мука */
      var P = PP('кг', 'г'), N, B, A, res;
      do { N = rand(4, 12); B = { b: rand(1, N - 2), s: r10(50, 950) }; A = { b: N, s: 0 }; res = D(P, A, B); } while (res.s === 0);
      return { P: P, res: res, text: 'В мешке было ' + q(N, 'кг') + ' муки. На выпечку израсходовали ' + cn(P, B) + '. Сколько муки осталось в мешке?',
        list: ['Сколько осталось? ' + subLine(P, A, B)] };
    },
    function (three) {                               /* сколько было */
      var P = PP('т', 'кг'), B, C, res;
      do { B = compNZ(P, 1, 9); C = compNZ(P, 1, 12); res = S(P, C, B); } while (res.s === 0);
      return { P: P, res: res, text: 'На складе после отправки ' + cn(P, B) + ' сахара осталось ' + cn(P, C) + '. Сколько сахара было на складе сначала?',
        list: ['Отправили и осталось — значит, сначала было столько, сколько отправили и осталось вместе: ' + addLine(P, C, B)] };
    }
  ];
  reg('n1PSub', function (o) {
    o = o || {};
    var three = o.steps === 3 || (o.steps == null && Math.random() < 0.3);
    var plots = o.plot != null ? [SUBP[o.plot]] : (three ? [SUBP[0], SUBP[1]] : SUBP);
    var pl = pick(plots)(three), r = fin(pl.P, pl.res);
    r.html = pl.text; r.hint = 'Подумай, какое действие нужно. При вычитании смотри на мелкие меры: если их не хватает, займи одну крупную меру.';
    r.explain = steps(pl.list, cn(pl.P, pl.res));
    return r;
  });

  /* --- сложение и вычитание вместе (уроки 68–70) --- */
  var MIXP = [
    function () {                                    /* рулоны */
      var P = PP('м', 'см'), A, Dd, B2, res;
      do { A = compNZ(P, 6, 20); Dd = compNZ(P, 1, 4); B2 = D(P, A, Dd); res = S(P, A, B2); } while (res.s === 0 || D(P, A, Dd).b < 1);
      return { P: P, res: res, text: 'В первом рулоне ' + cn(P, A) + ' ткани, а во втором — на ' + cn(P, Dd) + ' меньше. Сколько ткани в двух рулонах?',
        list: ['Сколько ткани во втором рулоне? ' + subLine(P, A, Dd), 'Сколько ткани в двух рулонах? ' + addLine(P, A, B2)] };
    },
    function () {                                    /* ящики яблок */
      var P = PP('кг', 'г'), A, Dd, B2, res;
      do { A = compNZ(P, 6, 25); Dd = compNZ(P, 1, 4); B2 = D(P, A, Dd); res = S(P, A, B2); } while (res.s === 0);
      return { P: P, res: res, text: 'В первый ящик положили ' + cn(P, A) + ' яблок, а во второй — на ' + cn(P, Dd) + ' меньше. Сколько яблок положили в два ящика?',
        list: ['Сколько яблок во втором ящике? ' + subLine(P, A, Dd), 'Сколько яблок в двух ящиках? ' + addLine(P, A, B2)] };
    },
    function () {                                    /* поход: 3 действия */
      var P = PP('км', 'м'), A, Dd, C, B2, ab, res;
      do { A = compNZ(P, 12, 30); Dd = compNZ(P, 1, 6); C = compNZ(P, 5, 20); B2 = D(P, A, Dd); ab = S(P, A, B2); res = S(P, ab, C); } while (res.s === 0);
      return { P: P, res: res, text: 'В первый день турист прошёл ' + cn(P, A) + ', во второй — на ' + cn(P, Dd) + ' меньше, чем в первый, а в третий — ' + cn(P, C) + '. Сколько всего он прошёл за три дня?',
        list: ['Сколько прошёл во второй день? ' + subLine(P, A, Dd), 'Сколько за два дня? ' + addLine(P, A, B2), 'Сколько за три дня? ' + addLine(P, ab, C)] };
    },
    function () {                                    /* сено */
      var P = PP('т', 'кг'), A, Dd, B2, res;
      do { A = compNZ(P, 5, 25); Dd = compNZ(P, 1, 4); B2 = D(P, A, Dd); res = S(P, A, B2); } while (res.s === 0);
      return { P: P, res: res, text: 'На ферме для коров заготовили ' + cn(P, A) + ' сена, а для лошадей — на ' + cn(P, Dd) + ' меньше. Сколько сена заготовили для коров и лошадей вместе?',
        list: ['Сколько сена для лошадей? ' + subLine(P, A, Dd), 'Сколько сена всего? ' + addLine(P, A, B2)] };
    },
    function () {                                    /* покупка */
      var P = PP('руб.', 'коп.'), A, Dd, B2, res;
      do { A = { b: rand(120, 480), s: r5(5, 95) }; Dd = { b: rand(15, 90), s: r5(5, 95) }; B2 = D(P, A, Dd); res = S(P, A, B2); } while (res.s === 0);
      return { P: P, res: res, text: 'Мяч стоит ' + cn(P, A) + ', а скакалка — на ' + cn(P, Dd) + ' дешевле. Сколько надо заплатить за мяч и скакалку вместе?',
        list: ['Сколько стоит скакалка? ' + subLine(P, A, Dd), 'Сколько стоит вся покупка? ' + addLine(P, A, B2)] };
    },
    function () {                                    /* мука: сложить, потом вычесть */
      var P = PP('кг', 'г'), A, B, C, ab, res;
      do { A = compNZ(P, 5, 20); B = compNZ(P, 5, 20); ab = S(P, A, B); C = compNZ(P, 3, Math.max(4, ab.b - 3)); res = D(P, ab, C); } while (res.s === 0 || res.b < 1 || tot(P, ab) <= tot(P, C));
      return { P: P, res: res, text: 'В одну кладовую насыпали ' + cn(P, A) + ' муки, в другую — ' + cn(P, B) + '. Для пирогов взяли ' + cn(P, C) + '. Сколько муки осталось?',
        list: ['Сколько муки было всего? ' + addLine(P, A, B), 'Сколько муки осталось? ' + subLine(P, ab, C)] };
    }
  ];
  reg('n1PMix', function (o) {
    o = o || {};
    var pl = pickPlot(o, MIXP)(), r = fin(pl.P, pl.res);
    r.html = pl.text; r.hint = 'Разбери задачу на действия: сначала найди неизвестную величину, потом отвечай на вопрос. Помни о переходе через меру.';
    r.explain = steps(pl.list, cn(pl.P, pl.res));
    return r;
  });

  /* --- среднее арифметическое именованных чисел --- */
  var AVGP = [
    function () {                                    /* автобус */
      var P = PP('км', 'м'), A, D1, D2, B2, C2, T, res, guard = 0;
      do { A = { b: rand(20, 32), s: r50(100, 900) }; D1 = { b: rand(0, 3), s: r50(100, 900) }; D2 = { b: rand(0, 2), s: r50(100, 900) }; B2 = S(P, A, D1); C2 = S(P, B2, D2); T = tot(P, A) + tot(P, B2) + tot(P, C2); res = fromTot(P, T / 3); } while ((T % 3 !== 0 || res.s === 0) && guard++ < 800);
      var sum = fromTot(P, T);
      return { P: P, res: res, text: 'Автобус прошёл в первый час ' + cn(P, A) + ', во второй час — на ' + cn(P, D1) + ' больше, чем в первый, а в третий — на ' + cn(P, D2) + ' больше, чем во второй. Найди среднюю скорость автобуса в час.',
        list: ['Сколько прошёл во второй час? ' + addLine(P, A, D1), 'Сколько прошёл в третий час? ' + addLine(P, B2, D2), 'Сколько за три часа? ' + cn(P, A) + ' + ' + cn(P, B2) + ' + ' + cn(P, C2) + ' = ' + cn(P, sum),
          'Средняя скорость в час: ' + cn(P, sum) + ' = ' + q(T, 'м') + '; ' + fmt(T) + ' : 3 = ' + fmt(T / 3) + ' м = ' + cn(P, res)] };
    },
    function () {                                    /* арбузы */
      var P = PP('кг', 'г'), a, b, c, T, res, guard = 0;
      do { a = { b: rand(3, 9), s: r10(50, 950) }; b = { b: rand(3, 9), s: r10(50, 950) }; c = { b: rand(3, 9), s: r10(50, 950) }; T = tot(P, a) + tot(P, b) + tot(P, c); res = fromTot(P, T / 3); } while ((T % 3 !== 0 || res.s === 0) && guard++ < 800);
      var sum = fromTot(P, T);
      return { P: P, res: res, text: 'Три арбуза весят ' + cn(P, a) + ', ' + cn(P, b) + ' и ' + cn(P, c) + '. Найди среднюю массу одного арбуза.',
        list: ['Сколько весят три арбуза? ' + cn(P, a) + ' + ' + cn(P, b) + ' + ' + cn(P, c) + ' = ' + cn(P, sum), 'Средняя масса: ' + cn(P, sum) + ' = ' + q(T, 'г') + '; ' + fmt(T) + ' : 3 = ' + fmt(T / 3) + ' г = ' + cn(P, res)] };
    },
    function () {                                    /* прыжки */
      var P = PP('м', 'см'), a, b, c, T, res, guard = 0;
      do { a = { b: rand(1, 2), s: rand(5, 99) }; b = { b: rand(1, 2), s: rand(5, 99) }; c = { b: rand(1, 2), s: rand(5, 99) }; T = tot(P, a) + tot(P, b) + tot(P, c); res = fromTot(P, T / 3); } while ((T % 3 !== 0 || res.s === 0 || res.b < 1) && guard++ < 800);
      var sum = fromTot(P, T);
      return { P: P, res: res, text: 'Ученик три раза прыгнул в длину: на ' + cn(P, a) + ', на ' + cn(P, b) + ' и на ' + cn(P, c) + '. Найди среднюю длину его прыжка.',
        list: ['Сколько всего прыгнул за три раза? ' + cn(P, a) + ' + ' + cn(P, b) + ' + ' + cn(P, c) + ' = ' + cn(P, sum), 'Средняя длина: ' + cn(P, sum) + ' = ' + q(T, 'см') + '; ' + fmt(T) + ' : 3 = ' + fmt(T / 3) + ' см = ' + cn(P, res)] };
    }
  ];
  reg('n1PAvg', function (o) {
    o = o || {};
    var pl = pickPlot(o, AVGP)(), r = fin(pl.P, pl.res);
    r.html = pl.text; r.hint = 'Среднее арифметическое: сложи все величины и раздели сумму на их число. Удобно выразить сумму в мелкой мере.';
    r.explain = steps(pl.list, cn(pl.P, pl.res));
    return r;
  });

  /* --- «груз и продукт»: с делением на порцию (контрольная, уроки 69–70) --- */
  var TWO = [
    { what: 'На хлебозавод привезли на одном грузовике {X} ржаной муки, а на втором — на {Dd} меньше. Из всей муки испекли хлеб. Сколько центнеров хлеба получили, если из 5 ц муки получается 7 ц хлеба?',
      second: 'муки на втором грузовике', port: 500, give: 700, unitOut: 'ц', div: 100, hint: 'Чтобы делить на центнеры, раздроби тонны на центнеры: 1 т = 10 ц.', Tmin: 6000, Tmax: 16000 },
    { what: 'На консервном заводе засолили рыбу первого сорта — {X}, а рыбы второго сорта — на {Dd} меньше. Сколько килограммов соли израсходовали на всю рыбу, если на каждые 20 кг рыбы кладут 3 кг соли?',
      second: 'рыбы второго сорта', port: 20, give: 3, unitOut: 'кг', div: 1, hint: 'Чтобы делить на килограммы, раздроби тонны на килограммы: 1 т = 1 000 кг.', Tmin: 8000, Tmax: 20000 },
    { what: 'В одном амбаре хранилось {X} пшеницы, а в другом — на {Dd} меньше. Всё зерно смололи. Сколько центнеров муки получили, если из 20 ц зерна получается 15 ц муки?',
      second: 'пшеницы в другом амбаре', port: 2000, give: 1500, unitOut: 'ц', div: 100, hint: 'Чтобы делить на центнеры, раздроби тонны на центнеры: 1 т = 10 ц.', Tmin: 6000, Tmax: 16000 },
    { what: 'Ферма в первую неделю сдала на молокозавод {X} молока, а во вторую — на {Dd} меньше. Сколько килограммов сыра получилось из всего молока, если из 10 кг молока делают 1 кг сыра?',
      second: 'молока во вторую неделю', port: 10, give: 1, unitOut: 'кг', div: 1, hint: 'Чтобы делить на килограммы, раздроби тонны на килограммы: 1 т = 1 000 кг.', Tmin: 4000, Tmax: 12000 }
  ];
  reg('n1PTwoLoads', function (o) {
    o = o || {};
    var pl = pickPlot(o, TWO), P = PP('т', 'кг'), T, Dd, X, Y, m, guard = 0;
    do {
      m = rand(Math.ceil(pl.Tmin / pl.port), Math.floor(pl.Tmax / pl.port));
      T = m * pl.port;
      Dd = { b: rand(1, 3), s: r10(50, 950) };
      var dv = tot(P, Dd);
      if ((T + dv) % 2 !== 0) continue;
      X = fromTot(P, (T + dv) / 2); Y = D(P, X, Dd);
    } while ((!X || X.s === 0 || Y.s === 0 || Y.b < 1 || tot(P, Y) <= 0) && guard++ < 2000);
    var total = tot(P, X) + tot(P, Y), parts = total / pl.port, out = parts * pl.give, ansU = out / pl.div;
    var text = pl.what.replace('{X}', cn(P, X)).replace('{Dd}', cn(P, Dd));
    var list = ['Сколько ' + pl.second + '? ' + subLine(P, X, Dd), 'Сколько всего? ' + addLine(P, X, Y) + ' = ' + q(total, 'кг')];
    if (pl.div === 100) list.push('Сколько это в центнерах? ' + fmt(total) + ' : 100 = ' + fmt(total / 100) + ' ц; порций по ' + pl.port / 100 + ' ц: ' + fmt(total / 100) + ' : ' + pl.port / 100 + ' = ' + fmt(parts));
    else list.push('Сколько порций по ' + pl.port + ' кг? ' + fmt(total) + ' : ' + pl.port + ' = ' + fmt(parts));
    list.push('Сколько получили? ' + fmt(parts) + ' × ' + (pl.div === 100 ? pl.give / 100 : pl.give) + ' = ' + fmt(ansU) + ' (' + pl.unitOut + ')');
    return { kind: 'num', html: text, answer: ansU, hint: pl.hint, explain: steps(list, q(ansU, pl.unitOut)) };
  });

  /* ================= рисунки и виджеты для теории ================= */

  /* метровая линейка: закрашены первые cm сантиметров; подписи в дециметрах и сантиметрах */
  R.n1MeterSVG = function (cm) {
    var x0 = 20, u = 5, y = 58, h = 26, i, g = '';
    for (i = 0; i <= 100; i++) {
      var th = i % 10 === 0 ? h : (i % 5 === 0 ? 17 : 9);
      g += '<path class="n1tick" d="M' + (x0 + i * u) + ' ' + y + 'v' + th + '"/>';
    }
    var nums = '';
    for (i = 0; i <= 100; i += 10) nums += '<text class="n1t" x="' + (x0 + i * u) + '" y="' + (y + h + 15) + '" text-anchor="middle">' + i + '</text>';
    var dms = '';
    for (i = 1; i <= 10; i++) dms += '<text class="n1t n1dm" x="' + (x0 + (i - 0.5) * 10 * u) + '" y="' + (y - 7) + '" text-anchor="middle">' + i + ' дм</text>';
    var w = cm * u;
    var lab = cm % 10 === 0 ? (cm / 10) + ' дм = ' + cm + ' см' : cm + ' см';
    return '<svg class="fig" viewBox="0 0 560 132" width="560" role="img" aria-label="Метр разделён на 10 дециметров и 100 сантиметров; отмечено ' + cm + ' см">' +
      '<rect class="n1hl" x="' + x0 + '" y="' + y + '" width="' + w + '" height="' + h + '"/>' +
      '<rect class="r n1strip" x="' + x0 + '" y="' + y + '" width="' + (100 * u) + '" height="' + h + '"/>' + g + dms + nums +
      '<path class="ra" d="M' + x0 + ' ' + (y - 24) + 'v-7h' + w + 'v7"/>' +
      '<text x="' + (x0 + w / 2) + '" y="' + (y - 38) + '" text-anchor="middle">' + lab + '</text>' +
      '<text class="n1t" x="' + (x0 + 100 * u + 20) + '" y="' + (y + h + 15) + '" text-anchor="start">см</text></svg>';
  };

  /* лесенка мер: вниз — умножаем (раздробление), вверх — делим (превращение) */
  R.n1Ladder = function (sys) {
    var L = sys === 'wt' ? ['т', 'ц', 'кг', 'г'] : sys === 'money' ? ['руб.', 'коп.'] : ['км', 'м', 'дм', 'см', 'мм'], h = '<div class="n1lad">';
    L.forEach(function (u, i) {
      h += '<div class="n1lu">' + u + '</div>';
      if (i < L.length - 1) {
        var f = fmt(ratio(u, L[i + 1]));
        h += '<div class="n1ll"><span class="n1dn">↓ × ' + f + '</span><span class="n1up">↑ : ' + f + '</span></div>';
      }
    });
    return h + '</div>';
  };

  var WPAIRS = [['км', 'м'], ['т', 'кг'], ['ц', 'кг'], ['т', 'ц'], ['кг', 'г'], ['м', 'см'], ['м', 'дм'], ['дм', 'см'], ['см', 'мм'], ['руб.', 'коп.']];
  function wel(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function pairOptions(def) {
    return WPAIRS.map(function (p) {
      var k = p[0] + '|' + p[1];
      return '<option value="' + k + '"' + (k === def ? ' selected' : '') + '>' + p[0] + ' и ' + p[1] + '</option>';
    }).join('');
  }
  function digitsOf(inp, maxLen) { return Number(String(inp.value).replace(/\D/g, '').slice(0, maxLen || 5)) || 0; }
  function inputHTML(cls, val) { return '<input class="winput sm ' + (cls || '') + '" inputmode="numeric" autocomplete="off" value="' + val + '">'; }

  R.widgetMounts = R.widgetMounts || {};

  /* раздробление / превращение с объяснением: data-mode="split" | "merge", data-pair="км|м" */
  R.widgetMounts.n1conv = function (host) {
    var mode = host.getAttribute('data-mode') === 'merge' ? 'merge' : 'split', def = host.getAttribute('data-pair') || 'км|м';
    host.innerHTML = '<div class="n1w-row"><label class="fld"><span class="wlabel">Какие меры</span><select class="wsel">' + pairOptions(def) + '</select></label>' +
      (mode === 'split'
        ? '<label class="fld"><span class="wlabel n1la"></span>' + inputHTML('n1i0', 5) + '</label><label class="fld"><span class="wlabel n1lb"></span>' + inputHTML('n1i1', 250) + '</label>'
        : '<label class="fld"><span class="wlabel n1lb"></span>' + inputHTML('n1i0', 4205) + '</label>') +
      '</div><div class="w-out" aria-live="polite"></div>';
    var sel = host.querySelector('select'), i0 = host.querySelector('.n1i0'), i1 = host.querySelector('.n1i1'), out = host.querySelector('.w-out');
    var la = host.querySelector('.n1la'), lb = host.querySelector('.n1lb');
    function upd() {
      var pr = sel.value.split('|'), P = PP(pr[0], pr[1]), h = '';
      if (la) la.textContent = P.a;
      lb.textContent = P.b;
      if (mode === 'split') {
        var b = digitsOf(i0, 4), s = digitsOf(i1, 4), t = b * P.f + s;
        h += '<p class="facts">' + fact(P.a, P.b) + '.</p>';
        if (b) h += '<p class="facts">' + q(b, P.a) + ' = ' + fmt(b) + ' × ' + fmt(P.f) + ' = ' + q(b * P.f, P.b) + '.</p>';
        if (b && s) h += '<p class="facts">' + fmt(b * P.f) + ' + ' + fmt(s) + ' = ' + fmt(t) + '.</p>';
        h += '<p class="facts"><b>' + (cn(P, { b: b, s: s }) || '0') + ' = ' + q(t, P.b) + '</b></p>';
        if (s >= P.f) h += '<p class="facts n1warn">В составном числе ' + GENP[P.b] + ' должно быть меньше ' + fmt(P.f) + ': иначе их можно превратить в ' + ACC[P.a] + '.</p>';
      } else {
        var T = digitsOf(i0, 7), r = fromTot(P, T);
        h += '<p class="facts">' + fact(P.a, P.b) + '. Делим ' + fmt(T) + ' на ' + fmt(P.f) + ':</p>';
        h += '<p class="facts">' + fmt(T) + ' : ' + fmt(P.f) + ' = ' + fmt(r.b) + ' (остаток ' + fmt(r.s) + ').</p>';
        h += r.b ? '<p class="facts"><b>' + q(T, P.b) + ' = ' + cn(P, r) + '</b></p>'
          : '<p class="facts">Здесь меньше одной крупной меры (1' + NB + P.a + ' = ' + q(P.f, P.b) + '), превращать нечего.</p>';
      }
      out.innerHTML = h;
    }
    sel.addEventListener('change', upd);
    [i0, i1].forEach(function (i) { if (i) { R.groupInput(i, 7); i.addEventListener('input', upd); } });
    upd();
  };

  /* столбик сложения / вычитания: data-op="+" | "-", data-pair="км|м", data-vals="3,850,4,470" */
  R.widgetMounts.n1calc = function (host) {
    var op = host.getAttribute('data-op') === '-' ? '-' : '+', def = host.getAttribute('data-pair') || 'км|м';
    var vals = (host.getAttribute('data-vals') || (op === '+' ? '3,850,4,470' : '8,285,3,750')).split(',').map(Number);
    var names = op === '+' ? ['Первое слагаемое', 'Второе слагаемое'] : ['Уменьшаемое', 'Вычитаемое'];
    function row(k) {
      return '<div class="n1w-row"><span class="wlabel n1rn">' + names[k] + '</span>' + inputHTML('n1b' + k, vals[2 * k]) + '<span class="n1ua"></span>' + inputHTML('n1s' + k, vals[2 * k + 1]) + '<span class="n1ub"></span></div>';
    }
    host.innerHTML = '<div class="n1w-row"><label class="fld"><span class="wlabel">Какие меры</span><select class="wsel">' + pairOptions(def) + '</select></label></div>' +
      row(0) + row(1) + '<div class="w-out" aria-live="polite"></div>';
    var sel = host.querySelector('select'), out = host.querySelector('.w-out');
    var ins = [host.querySelector('.n1b0'), host.querySelector('.n1s0'), host.querySelector('.n1b1'), host.querySelector('.n1s1')];
    function upd() {
      var pr = sel.value.split('|'), P = PP(pr[0], pr[1]);
      Array.prototype.forEach.call(host.querySelectorAll('.n1ua'), function (e) { e.textContent = P.a; });
      Array.prototype.forEach.call(host.querySelectorAll('.n1ub'), function (e) { e.textContent = P.b; });
      var x = { b: digitsOf(ins[0], 4), s: digitsOf(ins[1], 4) }, y = { b: digitsOf(ins[2], 4), s: digitsOf(ins[3], 4) };
      if (x.s >= P.f || y.s >= P.f) { out.innerHTML = '<p class="facts n1warn">В мелкой мере должно быть меньше ' + fmt(P.f) + ' ' + GENP[P.b] + ' (1' + NB + P.a + ' = ' + q(P.f, P.b) + '). Сначала преврати лишнее в ' + ACC[P.a] + '.</p>'; return; }
      if (!isNZ(x) || !isNZ(y)) { out.innerHTML = '<p class="facts n1warn">Впиши оба числа.</p>'; return; }
      if (op === '-' && tot(P, x) < tot(P, y)) { out.innerHTML = '<p class="facts n1warn">Вычитаемое больше уменьшаемого: так вычесть нельзя.</p>'; return; }
      out.innerHTML = R.n1Worked(P, [x, y], op);
    }
    sel.addEventListener('change', upd);
    ins.forEach(function (i) { R.groupInput(i, 4); i.addEventListener('input', upd); });
    upd();
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
