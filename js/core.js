/* Ядро: случайные числа, форматирование, разряды и классы, числа прописью, хранилище */
(function (G) {
  'use strict';
  var R = G.RKS = G.RKS || {};

  /* ---------- случайность ---------- */
  R.rand = function (a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; };
  R.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  R.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  R.pow10 = function (k) { return Math.pow(10, k); };

  /* ---------- форматирование ---------- */
  var NB = '\u00A0';
  R.NB = NB;
  R.fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB); };
  R.parseNum = function (s) {
    s = String(s == null ? '' : s).replace(/[\s\u00A0\u202F]/g, '');
    if (!/^\d+$/.test(s)) return NaN;
    return Number(s);
  };
  /* число с выделенной цифрой разряда rank (счёт справа, с 1) */
  R.fmtHL = function (n, rank) {
    var s = String(n), len = s.length, out = '';
    for (var i = 0; i < len; i++) {
      var r = len - i, ch = s.charAt(i);
      out += (r === rank) ? '<mark>' + ch + '</mark>' : ch;
      if (r > 1 && (r - 1) % 3 === 0) out += NB;
    }
    return out;
  };
  /* число с чертой: последние cut цифр приглушены */
  R.fmtCut = function (n, cut) {
    var s = String(n), len = s.length, out = '';
    for (var i = 0; i < len; i++) {
      var r = len - i, ch = s.charAt(i);
      if (r === cut && cut > 0) out += '<span class="cut">';
      out += ch;
      if (r === 1 && cut > 0) out += '</span>';
      if (r > 1 && (r - 1) % 3 === 0) out += NB;
    }
    return out;
  };

  /* неразрывный пробел внутри «1 000», «12 840» — только в тексте, не внутри тегов и атрибутов */
  R.nbNums = function (html) {
    if (typeof html !== 'string') return html;
    return html.split(/(<[^>]*>)/).map(function (part, i) {
      return i % 2 ? part : part.replace(/(\d) (?=\d{3}(?!\d))/g, '$1' + NB);
    }).join('');
  };
  /* окончательная обработка вопроса перед показом */
  R.normQ = function (q) {
    q.html = R.nbNums(q.html); q.hint = R.nbNums(q.hint); q.explain = R.nbNums(q.explain);
    if (q.options) q.options = q.options.map(R.nbNums);
    return q;
  };

  R.tidy = function (t) { return typeof t === 'string' ? t.replace(/\.\.(?!\.)/g, '.') : t; };
  /* при вводе разбивает цифры на группы по три (если курсор в конце) */
  R.groupInput = function (inp, maxDigits) {
    inp.addEventListener('input', function () {
      var atEnd = inp.selectionStart === inp.value.length;
      var d = inp.value.replace(/\D/g, '').slice(0, maxDigits || 14);
      if (atEnd) inp.value = d.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
    });
  };

  /* ---------- разряды и классы ---------- */
  R.RANKS = [null,
    { abbr: 'ед.',       pl: 'единиц',              name: 'единицы',             gen: 'первого',        loc: 'первом' },
    { abbr: 'дес.',      pl: 'десятков',            name: 'десятки',             gen: 'второго',        loc: 'втором' },
    { abbr: 'сот.',      pl: 'сотен',               name: 'сотни',               gen: 'третьего',       loc: 'третьем' },
    { abbr: 'тыс.',      pl: 'тысяч',               name: 'единицы тысяч',       gen: 'четвёртого',     loc: 'четвёртом' },
    { abbr: 'дес. тыс.', pl: 'десятков тысяч',      name: 'десятки тысяч',       gen: 'пятого',         loc: 'пятом' },
    { abbr: 'сот. тыс.', pl: 'сотен тысяч',         name: 'сотни тысяч',         gen: 'шестого',        loc: 'шестом' },
    { abbr: 'млн',       pl: 'миллионов',           name: 'единицы миллионов',   gen: 'седьмого',       loc: 'седьмом' },
    { abbr: 'дес. млн',  pl: 'десятков миллионов',  name: 'десятки миллионов',   gen: 'восьмого',       loc: 'восьмом' },
    { abbr: 'сот. млн',  pl: 'сотен миллионов',     name: 'сотни миллионов',     gen: 'девятого',       loc: 'девятом' },
    { abbr: 'млрд',      pl: 'миллиардов',          name: 'единицы миллиардов',  gen: 'десятого',       loc: 'десятом' },
    { abbr: 'дес. млрд', pl: 'десятков миллиардов', name: 'десятки миллиардов',  gen: 'одиннадцатого',  loc: 'одиннадцатом' },
    { abbr: 'сот. млрд', pl: 'сотен миллиардов',    name: 'сотни миллиардов',    gen: 'двенадцатого',   loc: 'двенадцатом' }
  ];
  R.CLASSES = [null,
    { name: 'класс единиц',     gen: 'первого',    loc: 'первом',    abbr: 'ед.' },
    { name: 'класс тысяч',      gen: 'второго',    loc: 'втором',    abbr: 'тыс.' },
    { name: 'класс миллионов',  gen: 'третьего',   loc: 'третьем',   abbr: 'млн' },
    { name: 'класс миллиардов', gen: 'четвёртого', loc: 'четвёртом', abbr: 'млрд' }
  ];
  /* группы по три цифры, от младшего класса к старшему: [{cls, txt, val}] */
  R.classGroups = function (n) {
    var s = String(n), out = [];
    for (var i = s.length, c = 1; i > 0; i -= 3, c++) {
      var t = s.slice(Math.max(0, i - 3), i);
      out.push({ cls: c, txt: t, val: Number(t) });
    }
    return out;
  };

  /* ---------- числа прописью ---------- */
  var ONES_M = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  var ONES_F = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  var TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
    'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  var TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  var HUND = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  var SCALES = [null,
    ['тысяча', 'тысячи', 'тысяч'],
    ['миллион', 'миллиона', 'миллионов'],
    ['миллиард', 'миллиарда', 'миллиардов']];

  R.plural = function (n, forms) {
    var m100 = n % 100, m10 = n % 10;
    if (m100 >= 11 && m100 <= 14) return forms[2];
    if (m10 === 1) return forms[0];
    if (m10 >= 2 && m10 <= 4) return forms[1];
    return forms[2];
  };
  function triad(n, fem) {
    var h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10, p = [];
    if (h) p.push(HUND[h]);
    if (t === 1) p.push(TEENS[o]);
    else {
      if (t) p.push(TENS[t]);
      if (o) p.push((fem ? ONES_F : ONES_M)[o]);
    }
    return p.join(' ');
  }
  R.words = function (n) {
    if (n === 0) return 'ноль';
    var groups = [], x = n, parts = [];
    while (x > 0) { groups.push(x % 1000); x = Math.floor(x / 1000); }
    for (var i = groups.length - 1; i >= 0; i--) {
      var g = groups[i];
      if (!g) continue;
      var w = triad(g, i === 1);
      if (i > 0) w += ' ' + R.plural(g, SCALES[i]);
      parts.push(w);
    }
    return parts.join(' ');
  };

  /* ---------- случайное число с «правильными» нулями ---------- */
  R.randNum = function (d, o) {
    o = o || {};
    var zp = (o.zp == null) ? 0.2 : o.zp;
    var a = [R.rand(1, 9)], i;
    for (i = 1; i < d; i++) a.push(Math.random() < zp ? 0 : R.rand(0, 9));
    if (o.ensureZero && d >= 3) {
      a[R.rand(1, d - 1)] = 0;
      if (d >= 5 && Math.random() < 0.5) a[R.rand(1, d - 1)] = 0;
    }
    if (o.zeroClass && d >= 7) {                 /* обнулим целый класс, кроме старшего */
      var classes = Math.ceil(d / 3);
      var c = R.rand(0, classes - 2);
      for (var k = 1; k <= 3; k++) {
        var idx = d - (c * 3 + k);
        if (idx >= 1) a[idx] = 0;
      }
    }
    if (o.noZero) for (i = 0; i < d; i++) if (a[i] === 0) a[i] = R.rand(1, 9);
    return Number(a.join(''));
  };

  /* ---------- хранилище прогресса ---------- */
  var mem = {};
  R.store = {
    get: function (k, d) {
      try { var v = G.localStorage.getItem(k); return v ? JSON.parse(v) : d; }
      catch (e) { return (k in mem) ? mem[k] : d; }
    },
    set: function (k, v) {
      mem[k] = v;
      try { G.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* без хранилища — только в памяти */ }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
