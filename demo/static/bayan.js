(function () {
  'use strict';

  var T = {
    en: {
      skip: 'Skip to the request box',
      statusChecking: 'Checking models…',
      statusReady: 'Models ready',
      statusLoading: 'Search model loading…',
      statusDown: 'Search unavailable',
      statusOffline: 'Server not reachable',
      eyebrow: 'Arabic & English NLP · SDAIA Academy project',
      title: 'How does Bayan understand a service request?',
      lede: 'Type a request in Arabic or English, or pick an example. Bayan predicts its topic and looks for the closest past case, even when that case is written in the other language.',
      requestLabel: 'Service request',
      placeholder: 'e.g. The bus was over thirty minutes late',
      examples: 'Try an example',
      analyze: 'Analyse',
      analyzing: 'Analysing…',
      howTitle: 'What runs behind this page',
      step1Title: 'Mask', step1Body: 'Emails and Saudi mobile numbers are replaced before any model sees the text.',
      step2Title: 'Topic', step2Body: 'TF-IDF on character 3–5-grams + LinearSVC, the Notebook 03 baseline, retrained at startup on 24 synthetic rows.',
      step3Title: 'Embed', step3Body: 'Multilingual MiniLM puts Arabic and English text in one vector space: 24 past cases, 12 in each language.',
      step4Title: 'Retrieve', step4Body: 'Exact inner-product search (the FAISS IndexFlatIP ranking of Notebook 06) and a no-answer threshold tuned on validation only.',
      howNotBody: 'The fine-tuned multilingual DistilBERT and its ONNX export are stored privately, so this page uses the baseline. NER, extractive QA and cross-encoder re-ranking stay in the notebooks.',
      evalReport: 'Evaluation report',
      foot: 'Built by Ghala Alshreef in the SDA-AIE-211 NLP with Transformers programme, SDAIA Academy. All data is synthetic course data. Educational project; not an official service.',
      code: 'Code on GitHub',
      portfolio: 'Portfolio',
      emptyText: 'Write a request first, or pick an example.',
      tooLong: 'Keep the request under 1,000 characters.',
      serverError: 'Bayan could not analyse this request. The server did not answer; try again in a moment.',
      yourRequest: 'Your request, as the models receive it',
      sameLang: 'Same language', bridgeCross: 'Found across languages',
      langAr: 'Arabic', langEn: 'English',
      requestIn: function (l) { return 'Written in ' + l; },
      latency: function (ms) { return ms + ' ms on CPU'; },
      masked: 'Contact details were masked before analysis.',
      topicTitle: 'Topic',
      topicNote: 'Numbers are LinearSVC margins (higher = closer to that topic), not probabilities. The model always picks one of the four topics, even for off-topic text.',
      caseTitle: 'Closest past case',
      resolution: 'How it was resolved:',
      similarity: 'Cosine similarity',
      threshold: function (t) { return 'threshold ' + t; },
      othersTitle: 'Next closest',
      noMatchTitle: 'No past case is close enough',
      noMatchBody: function (b, t) { return 'The best similarity is ' + b + ', below the ' + t + ' threshold tuned on validation queries. This is the nearest case anyway:'; },
      loadingTitle: 'The search model is still loading',
      loadingBody: 'On a fresh start the server downloads the multilingual MiniLM model (about 470 MB). This result will refresh by itself when it is ready.',
      downTitle: 'Search is not available on this server',
      downBody: 'The topic result above still comes from the model. Reason: ',
      topicMetric: function (m) { return 'Validation macro-F1 ' + m.validation_macro_f1.toFixed(2) + ' on ' + m.validation_rows + ' rows, measured at startup.'; },
      searchMetric: function (m) { return 'Test Recall@3 ' + m.test_recall_at_3.toFixed(2) + ' · MRR@3 ' + m.test_mrr_at_3.toFixed(2) + ' on ' + m.test_answerable_queries + ' answerable queries; no-answer accuracy ' + m.test_no_answer_accuracy.toFixed(2) + ' on ' + m.test_queries + '. Threshold ' + m.threshold.toFixed(3) + '.'; },
      searchMetricWait: 'Measured when the search model finishes loading.',
      topics: { digital_service: 'Digital services', health: 'Health', permit: 'Permits', transport: 'Transport' }
    },
    ar: {
      skip: 'انتقل إلى مربع الطلب',
      statusChecking: 'جارٍ فحص النماذج…',
      statusReady: 'النماذج جاهزة',
      statusLoading: 'نموذج البحث يُحمَّل…',
      statusDown: 'البحث غير متاح',
      statusOffline: 'تعذر الوصول للخادم',
      eyebrow: 'معالجة اللغة بالعربية والإنجليزية · مشروع أكاديمية سدايا',
      title: 'كيف يفهم بيان طلب الخدمة؟',
      lede: 'اكتب طلبًا بالعربية أو الإنجليزية، أو اختر مثالًا. يتوقع بيان موضوع الطلب ويبحث عن أقرب حالة سابقة، حتى لو كانت مكتوبة باللغة الأخرى.',
      requestLabel: 'طلب الخدمة',
      placeholder: 'مثال: ما وصلني رمز التحقق على الجوال',
      examples: 'جرّب مثالًا',
      analyze: 'حلّل',
      analyzing: 'جارٍ التحليل…',
      howTitle: 'ما الذي يعمل خلف هذه الصفحة',
      step1Title: 'الإخفاء', step1Body: 'يُستبدل البريد الإلكتروني وأرقام الجوال السعودية قبل أن يرى أي نموذج النص.',
      step2Title: 'الموضوع', step2Body: 'TF-IDF على مقاطع أحرف من 3 إلى 5 مع LinearSVC، خط الأساس من الدفتر 03، يُعاد تدريبه عند التشغيل على 24 صفًا اصطناعيًا.',
      step3Title: 'التمثيل', step3Body: 'يضع MiniLM متعدد اللغات النص العربي والإنجليزي في فضاء متجهات واحد: 24 حالة سابقة، 12 لكل لغة.',
      step4Title: 'الاسترجاع', step4Body: 'بحث دقيق بالضرب الداخلي (نفس ترتيب FAISS IndexFlatIP في الدفتر 06) وعتبة «لا توجد إجابة» مضبوطة على بيانات التحقق فقط.',
      howNotBody: 'نموذج DistilBERT متعدد اللغات المدرَّب ونسخة ONNX محفوظان بشكل خاص، لذلك تستخدم الصفحة خط الأساس. التعرف على الكيانات والأسئلة الاستخراجية وإعادة الترتيب موجودة في الدفاتر.',
      evalReport: 'تقرير التقييم',
      foot: 'بنته غلا الشريف ضمن برنامج SDA-AIE-211 لمعالجة اللغة الطبيعية بالمحوّلات في أكاديمية سدايا. جميع البيانات تعليمية اصطناعية. مشروع تعليمي وليس خدمة رسمية.',
      code: 'الكود على GitHub',
      portfolio: 'البورتفوليو',
      emptyText: 'اكتب طلبًا أولًا، أو اختر مثالًا.',
      tooLong: 'اجعل الطلب أقل من 1000 حرف.',
      serverError: 'تعذر تحليل الطلب لأن الخادم لم يستجب. حاول مرة أخرى بعد قليل.',
      yourRequest: 'طلبك كما يصل إلى النماذج',
      sameLang: 'نفس اللغة', bridgeCross: 'وُجدت بلغة أخرى',
      langAr: 'العربية', langEn: 'الإنجليزية',
      requestIn: function (l) { return 'مكتوب بـ' + l; },
      latency: function (ms) { return '\u2066' + ms + ' ms\u2069 على المعالج'; },
      masked: 'أُخفيت بيانات التواصل قبل التحليل.',
      topicTitle: 'الموضوع',
      topicNote: 'الأرقام هوامش LinearSVC (الأعلى أقرب لذلك الموضوع) وليست احتمالات. يختار النموذج دائمًا أحد المواضيع الأربعة، حتى لو كان النص خارج النطاق.',
      caseTitle: 'أقرب حالة سابقة',
      resolution: 'كيف حُلّت:',
      similarity: 'تشابه جيب التمام',
      threshold: function (t) { return 'العتبة ' + t; },
      othersTitle: 'الحالات التالية',
      noMatchTitle: 'لا توجد حالة سابقة قريبة بما يكفي',
      noMatchBody: function (b, t) { return 'أعلى تشابه ' + b + '، وهو أقل من العتبة ' + t + ' المضبوطة على استعلامات التحقق. هذه أقرب حالة على أي حال:'; },
      loadingTitle: 'نموذج البحث ما زال يُحمَّل',
      loadingBody: 'عند التشغيل الأول ينزّل الخادم نموذج MiniLM متعدد اللغات (نحو 470 MB). ستتحدث هذه النتيجة تلقائيًا عند جاهزيته.',
      downTitle: 'البحث غير متاح على هذا الخادم',
      downBody: 'نتيجة الموضوع أعلاه ما زالت من النموذج. السبب: ',
      topicMetric: function (m) { return '\u2066Macro-F1 ' + m.validation_macro_f1.toFixed(2) + '\u2069 على بيانات التحقق (' + m.validation_rows + ' صفوف)، مقاسة عند تشغيل الخادم.'; },
      searchMetric: function (m) { var I = function (x) { return '\u2066' + x + '\u2069'; }; return 'على الاختبار: ' + I('Recall@3 ' + m.test_recall_at_3.toFixed(2)) + ' و' + I('MRR@3 ' + m.test_mrr_at_3.toFixed(2)) + ' على ' + m.test_answerable_queries + ' استعلامات لها إجابة، ودقة «لا إجابة» ' + m.test_no_answer_accuracy.toFixed(2) + ' على ' + m.test_queries + ' استعلامات. العتبة ' + m.threshold.toFixed(3) + '.'; },
      searchMetricWait: 'تُقاس عند اكتمال تحميل نموذج البحث.',
      topics: { digital_service: 'الخدمات الرقمية', health: 'الصحة', permit: 'التصاريح', transport: 'النقل' }
    }
  };

  var EXAMPLES = [
    { tag: { en: 'Arabic', ar: 'عربي' }, text: 'أحتاج موعد عيادة ولا يوجد وقت متاح' },
    { tag: { en: 'English', ar: 'إنجليزي' }, text: 'The bus was over thirty minutes late' },
    { tag: { en: 'Arabic query · cross-language search', ar: 'استعلام عربي · بحث بين اللغتين' }, text: 'وين موقع موقف الباص في الحي؟' },
    { tag: { en: 'Privacy masking', ar: 'إخفاء البيانات' }, text: 'ما وصلني رمز التحقق، رقمي 0500000000' },
    { tag: { en: 'Out of scope', ar: 'خارج النطاق' }, text: "What is tomorrow's weather?" }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var state = { lang: 'en', status: null, last: null, lastText: '', pending: false, pollTimer: null };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function t(key) { return T[state.lang][key]; }
  function langName(code) { return code === 'ar' ? t('langAr') : t('langEn'); }
  function topicName(code) { return T[state.lang].topics[code] || code; }

  function initialLang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'ar' || q === 'en') return q;
    try { var s = localStorage.getItem('bayan-lang'); if (s === 'ar' || s === 'en') return s; } catch (e) { /* ignore */ }
    return (navigator.language || '').toLowerCase().indexOf('ar') === 0 ? 'ar' : 'en';
  }

  function applyLang() {
    var root = document.documentElement;
    root.lang = state.lang;
    root.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (typeof v === 'string') el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    var toggle = $('lang-toggle');
    toggle.textContent = state.lang === 'ar' ? 'English' : 'العربية';
    toggle.setAttribute('lang', state.lang === 'ar' ? 'en' : 'ar');
    toggle.setAttribute('aria-label', state.lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    renderChips();
    renderStatus();
    if (state.last) renderResult(state.last);
  }

  function renderChips() {
    $('chips').innerHTML = EXAMPLES.map(function (ex, i) {
      var lang = /[؀-ۿ]/.test(ex.text) ? 'ar' : 'en';
      return '<button type="button" class="chip" data-ex="' + i + '" aria-pressed="' + (state.lastText === ex.text) + '">' +
        '<span class="chip-tag">' + esc(ex.tag[state.lang]) + '</span>' +
        '<span class="chip-text" lang="' + lang + '" dir="' + (lang === 'ar' ? 'rtl' : 'ltr') + '">' + esc(ex.text) + '</span></button>';
    }).join('');
  }

  function renderStatus() {
    var pill = $('search-pill'), text = $('search-pill-text');
    var s = state.status;
    pill.className = 'pill';
    if (!s) { text.textContent = state.offline ? t('statusOffline') : t('statusChecking'); if (state.offline) pill.classList.add('down'); return; }
    var st = s.search.status;
    if (st === 'ready') { pill.classList.add('ready'); text.textContent = t('statusReady'); }
    else if (st === 'loading') { pill.classList.add('loading'); text.textContent = t('statusLoading'); }
    else { pill.classList.add('down'); text.textContent = t('statusDown'); }
    $('topic-metric').textContent = T[state.lang].topicMetric(s.topic);
    $('search-metric').textContent = st === 'ready' ? T[state.lang].searchMetric(s.search) : t('searchMetricWait');
  }

  function fetchStatus() {
    return fetch('/api/status').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (s) {
        var wasLoading = state.status && state.status.search.status === 'loading';
        state.status = s; state.offline = false; renderStatus();
        if (s.search.status === 'loading') {
          clearTimeout(state.pollTimer);
          state.pollTimer = setTimeout(fetchStatus, 3000);
        } else if (wasLoading && state.last && state.last.search.status === 'loading') {
          analyze(state.lastText, true);
        }
      })
      .catch(function () { state.offline = true; state.status = null; renderStatus(); clearTimeout(state.pollTimer); state.pollTimer = setTimeout(fetchStatus, 5000); });
  }

  function showError(msg) {
    var el = $('form-error');
    el.textContent = msg; el.hidden = !msg;
  }

  function setBusy(busy) {
    state.pending = busy;
    var btn = $('analyze');
    btn.disabled = busy;
    btn.querySelector('span').textContent = busy ? t('analyzing') : t('analyze');
    $('result').setAttribute('aria-busy', String(busy));
  }

  function analyze(text, silent) {
    text = (text || '').trim();
    if (!text) { showError(t('emptyText')); $('request').focus(); return; }
    if (text.length > 1000) { showError(t('tooLong')); return; }
    showError('');
    state.lastText = text;
    renderChips();
    setBusy(true);
    var res = $('result');
    if (!silent) {
      res.hidden = false;
      res.innerHTML = '<div class="panel"><div class="skeleton" style="width:60%"></div><div class="skeleton" style="width:35%;margin-top:12px"></div></div>';
    }
    fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        state.last = data; renderResult(data);
        if (data.search.status === 'loading') fetchStatus();
      })
      .catch(function () {
        state.last = null;
        res.hidden = false;
        res.innerHTML = '<div class="state" role="alert"><strong>' + esc(t('serverError')) + '</strong></div>';
      })
      .then(function () { setBusy(false); });
  }

  function dirOf(lang) { return lang === 'ar' ? 'rtl' : 'ltr'; }

  function meter(score, threshold) {
    var w = Math.max(0, Math.min(1, score)) * 100;
    return '<div class="meter" role="img" aria-label="' + esc(t('similarity') + ' ' + score.toFixed(2) + ', ' + T[state.lang].threshold(threshold.toFixed(2))) + '">' +
      '<span style="width:' + w.toFixed(1) + '%"></span><i style="left:' + (threshold * 100).toFixed(1) + '%"></i></div>';
  }

  function caseBlock(c, queryLang, threshold, dim) {
    var L = T[state.lang];
    var cross = c.language !== queryLang;
    var bridge = '<div class="bridge"><span class="lang">' + esc(langName(queryLang)) + '</span><span class="line" aria-hidden="true"></span>' +
      '<span class="lang to">' + esc(langName(c.language)) + '</span><span class="cross">' + esc(cross ? t('bridgeCross') : t('sameLang')) + '</span></div>';
    return '<div class="case' + (dim ? ' dim' : '') + '">' + bridge +
      '<p class="case-text" lang="' + c.language + '" dir="' + dirOf(c.language) + '">' + esc(c.summary) + '</p>' +
      '<p class="case-res"><span>' + esc(t('resolution')) + '</span> <bdi lang="' + c.language + '" dir="' + dirOf(c.language) + '">' + esc(c.resolution) + '</bdi></p>' +
      '<div class="case-meta"><span>' + esc(topicName(c.topic)) + '</span><span class="case-id">' + esc(c.case_id) + '</span></div>' +
      '<div class="score"><div class="score-line"><span>' + esc(t('similarity')) + ' <b>' + c.score.toFixed(3) + '</b></span><span>' + esc(L.threshold(threshold.toFixed(3))) + '</span></div>' + meter(c.score, threshold) + '</div></div>';
  }

  function renderSearch(d) {
    var s = d.search, L = T[state.lang];
    var h = '<div class="panel"><p class="note-title">' + esc(t('caseTitle')) + '</p>';
    if (s.status === 'loading') {
      h += '<div class="state"><strong>' + esc(t('loadingTitle')) + '</strong>' + esc(t('loadingBody')) + '</div>';
    } else if (s.status !== 'ready') {
      h += '<div class="state"><strong>' + esc(t('downTitle')) + '</strong>' + esc(t('downBody')) + '<code dir="ltr">' + esc(s.error || s.status) + '</code></div>';
    } else if (!s.has_match) {
      h += '<div class="state"><strong>' + esc(t('noMatchTitle')) + '</strong>' + esc(L.noMatchBody(s.best_score.toFixed(3), s.threshold.toFixed(3))) + '</div>';
      h += '<div style="margin-top:14px">' + caseBlock(s.results[0], d.language, s.threshold, true) + '</div>';
    } else {
      h += caseBlock(s.results[0], d.language, s.threshold, false);
      var rest = s.results.slice(1);
      if (rest.length) {
        h += '<p class="subhead">' + esc(t('othersTitle')) + '</p><ul class="others">' + rest.map(function (c) {
          return '<li><span class="l' + (c.language !== d.language ? ' x' : '') + '">' + esc(langName(c.language)) + '</span>' +
            '<span class="t" lang="' + c.language + '" dir="' + dirOf(c.language) + '">' + esc(c.summary) + '</span>' +
            '<span class="s">' + c.score.toFixed(3) + '</span></li>';
        }).join('') + '</ul>';
      }
    }
    return h + '</div>';
  }

  function renderResult(d) {
    var L = T[state.lang];
    var max = Math.max.apply(null, d.topic.margins.map(function (m) { return m.margin; }));
    var min = Math.min.apply(null, d.topic.margins.map(function (m) { return m.margin; }));
    var span = (max - min) || 1;
    var words = d.model_text.split(/\s+/).filter(Boolean);
    var html = '<div class="reading"><div class="reading-head"><p class="note-title">' + esc(t('yourRequest')) + '</p>' +
      '<div class="meta"><span>' + esc(L.requestIn(langName(d.language))) + '</span><span>' + esc(L.latency(d.latency_ms)) + '</span></div></div>' +
      '<ul class="tokens" lang="' + d.language + '" dir="' + dirOf(d.language) + '">' + words.map(function (w) {
        return '<li' + (/^\[(PHONE|EMAIL)\]/.test(w) ? ' class="pii"' : '') + '>' + esc(w) + '</li>';
      }).join('') + '</ul>' +
      (d.masked ? '<p class="privacy"><b>●</b> ' + esc(t('masked')) + '</p>' : '') + '</div>';

    html += '<div class="notes"><div class="panel"><p class="note-title">' + esc(t('topicTitle')) + '</p>' +
      '<div class="topic-tag"><b>' + esc(topicName(d.topic.label)) + '</b><small dir="ltr">' + esc(d.topic.model) + '</small></div><ul class="margins">' +
      d.topic.margins.map(function (m, i) {
        var w = 8 + 92 * (m.margin - min) / span;
        return '<li' + (i === 0 ? ' class="lead"' : '') + '><span>' + esc(topicName(m.label)) + '</span><span class="bar"><span style="width:' + w.toFixed(1) + '%"></span></span><span class="num">' + m.margin.toFixed(2) + '</span></li>';
      }).join('') + '</ul><p class="note">' + esc(t('topicNote')) + '</p></div>' + renderSearch(d) + '</div>';

    var res = $('result');
    res.innerHTML = html;
    res.hidden = false;
  }

  document.addEventListener('DOMContentLoaded', function () {
    state.lang = initialLang();
    applyLang();
    fetchStatus();
    var q = new URLSearchParams(location.search).get('q');
    if (q) { $('request').value = q.slice(0, 1000); analyze(q); }
    $('lang-toggle').addEventListener('click', function () {
      state.lang = state.lang === 'ar' ? 'en' : 'ar';
      try { localStorage.setItem('bayan-lang', state.lang); } catch (e) { /* ignore */ }
      applyLang();
    });
    $('chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-ex]');
      if (!b || state.pending) return;
      var ex = EXAMPLES[+b.getAttribute('data-ex')];
      $('request').value = ex.text;
      analyze(ex.text);
    });
    $('analyze').addEventListener('click', function () { analyze($('request').value); });
    $('request').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); analyze($('request').value); }
    });
  });
})();
