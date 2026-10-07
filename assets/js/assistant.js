/* =========================================================
   STAA Assistant — FAQ chat with WhatsApp handoff (no dependencies)
   ---------------------------------------------------------
   Answers come from assets/data/faq.json. Questions it can't
   answer are handed to an advisor on WhatsApp, with the
   visitor's question pre-filled.

   AI upgrade (optional): deploy the worker in ai-assistant/
   and paste its URL into AI_ENDPOINT below. The assistant then
   answers in natural language, and falls back to the FAQ
   matcher if the worker can't be reached.
   ========================================================= */
(function () {
  'use strict';

  var AI_ENDPOINT = ''; // e.g. 'https://staa-assistant.<your-subdomain>.workers.dev'
  var FAQ_URL = 'assets/data/faq.json';
  var WHATSAPP = '255717402578';
  var STORE_KEY = 'staa-assistant';
  var MIN_SCORE = 2;

  var STOPWORDS = ('a an and are as at be but by can could do does for from have how i if in into is it its me my ' +
    'no not of on or our please so that the their them there this to us we what when where which who why will with ' +
    'would you your yours hi hello hey tell about any some need want get help').split(' ');
  var GREETING = /^(hi|hello|hey|good (morning|afternoon|evening)|habari|mambo|jambo|shikamoo|salaam|hujambo)\b/;
  var THANKS = /\b(thanks|thank you|asante|cheers|great|perfect|ok thanks)\b/;

  /* ---------- Text matching ---------- */
  var stem = function (w) {
    if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  };
  // All words, lowercased and stemmed: "Tax Returns?" -> ["tax", "return"]
  var words = function (s) {
    return s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean).map(stem);
  };
  var seq = function (s) { return ' ' + words(s).join(' ') + ' '; };
  var content = function (s) { return words(s).filter(function (w) { return STOPWORDS.indexOf(w) < 0; }); };

  var prepare = function (faqs) {
    return faqs.map(function (f) {
      return {
        faq: f,
        phrases: f.keywords.filter(function (k) { return k.indexOf(' ') > 0; }).map(seq),
        words: f.keywords.filter(function (k) { return k.indexOf(' ') < 0; }).map(function (k) { return stem(k.toLowerCase()); }),
        qWords: content(f.q)
      };
    });
  };

  var bestMatch = function (index, text) {
    var s = seq(text), all = words(text), best = null, bestScore = 0;
    index.forEach(function (e) {
      var score = 0;
      e.phrases.forEach(function (p) { if (s.indexOf(p) >= 0) score += 3; });
      all.forEach(function (t) {
        if (e.words.indexOf(t) >= 0) score += 2;
        else if (STOPWORDS.indexOf(t) < 0 && e.qWords.indexOf(t) >= 0) score += 0.5;
      });
      if (score > bestScore) { bestScore = score; best = e.faq; }
    });
    return bestScore >= MIN_SCORE ? best : null;
  };

  /* ---------- Knowledge base ---------- */
  var kb = null, index = [];
  var kbReady = fetch(FAQ_URL)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) { kb = data; index = prepare(data.faqs); if (data.whatsapp) WHATSAPP = data.whatsapp; })
    .catch(function () { kb = null; });

  var waLink = function (question) {
    var msg = question ? 'Hello STAA, I have a question: ' + question : 'Hello STAA, I would like to speak to an advisor.';
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
  };

  var localAnswer = function (text) {
    var t = text.trim().toLowerCase();
    if (GREETING.test(t) && t.split(/\s+/).length <= 4) {
      return { text: 'Hello! I can answer common questions about STAA’s tax, accounting and advisory services. What would you like to know?' };
    }
    if (THANKS.test(t) && t.split(/\s+/).length <= 5) {
      return { text: 'You’re welcome. Is there anything else I can help with?' };
    }
    var f = kb ? bestMatch(index, text) : null;
    if (f) return { text: f.a, link: f.link, handoff: !!f.handoff, question: text };
    return {
      text: kb ? 'I don’t have an answer to that here. An STAA advisor can help you directly on WhatsApp. Tap below and your question will be ready to send.'
               : 'I can’t load my answers right now. An STAA advisor can help you directly on WhatsApp.',
      handoff: true, question: text, outOfScope: true
    };
  };

  /* ---------- Conversation state (kept for this browser tab) ---------- */
  var history = [];
  try { history = JSON.parse(sessionStorage.getItem(STORE_KEY)) || []; } catch (e) {}
  var save = function () {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-30))); } catch (e) {}
  };

  var aiAnswer = function (text) {
    var turns = history.slice(-8).map(function (m) { return { role: m.role === 'user' ? 'user' : 'assistant', content: m.text }; });
    return fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: turns.concat([{ role: 'user', content: text }]) })
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (d) {
      if (!d || typeof d.answer !== 'string') throw new Error('bad response');
      return { text: d.answer, handoff: !!d.handoff, question: text, outOfScope: !!d.handoff };
    });
  };

  /* ---------- UI ---------- */
  var icon = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" aria-hidden="true"><path d="M6 18L18 6M9 6h9v9"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.7-.4z"/></svg>'
  };

  var launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'assist-launch';
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'assist-panel');
  launcher.innerHTML = icon.chat + '<span>Ask STAA</span>';

  var panel = document.createElement('section');
  panel.id = 'assist-panel';
  panel.className = 'assist-panel';
  panel.setAttribute('aria-labelledby', 'assist-title');
  panel.hidden = true;
  panel.innerHTML =
    '<header class="assist-head">' +
      '<img src="assets/img/mark.png" alt="" width="40" height="40">' +
      '<div><h2 id="assist-title">STAA Assistant</h2><p>Instant answers, or chat with an advisor</p></div>' +
      '<button type="button" class="assist-close" aria-label="Close assistant">' + icon.close + '</button>' +
    '</header>' +
    '<div class="assist-log" role="log" aria-live="polite"></div>' +
    '<div class="assist-suggest" aria-label="Suggested questions"></div>' +
    '<form class="assist-form">' +
      '<label class="sr-only" for="assist-input">Type your question</label>' +
      '<input id="assist-input" type="text" autocomplete="off" maxlength="500" placeholder="Type your question…">' +
      '<button type="submit" aria-label="Send">' + icon.send + '</button>' +
    '</form>' +
    '<p class="assist-foot">Automated answers, not professional advice. <a href="' + waLink() + '" target="_blank" rel="noopener">Talk to an advisor</a></p>';

  document.body.appendChild(panel);
  document.body.appendChild(launcher);

  var log = panel.querySelector('.assist-log');
  var suggest = panel.querySelector('.assist-suggest');
  var form = panel.querySelector('.assist-form');
  var input = panel.querySelector('#assist-input');
  var busy = false;

  var addBubble = function (m) {
    var b = document.createElement('div');
    b.className = 'assist-msg assist-msg--' + (m.role === 'user' ? 'user' : 'bot');
    m.text.split(/\n+/).forEach(function (line) {
      var p = document.createElement('p');
      p.textContent = line;
      b.appendChild(p);
    });
    if (m.link || m.handoff) {
      var actions = document.createElement('div');
      actions.className = 'assist-actions';
      if (m.link) {
        var a = document.createElement('a');
        a.href = m.link.href;
        a.className = 'assist-link';
        a.textContent = m.link.label;
        actions.appendChild(a);
      }
      if (m.handoff) {
        var w = document.createElement('a');
        w.href = waLink(m.question);
        w.target = '_blank';
        w.rel = 'noopener';
        w.className = 'assist-wa';
        w.innerHTML = icon.wa + '<span></span>';
        w.querySelector('span').textContent = m.outOfScope ? 'Continue on WhatsApp' : 'Ask an advisor on WhatsApp';
        actions.appendChild(w);
      }
      b.appendChild(actions);
    }
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
  };

  var renderSuggestions = function () {
    suggest.innerHTML = '';
    var list = (kb && kb.suggestions) || [];
    suggest.hidden = !list.length || history.some(function (m) { return m.role === 'user'; });
    list.forEach(function (q) {
      var c = document.createElement('button');
      c.type = 'button';
      c.textContent = q;
      c.addEventListener('click', function () { ask(q); });
      suggest.appendChild(c);
    });
  };

  var typing = function (on) {
    var t = log.querySelector('.assist-typing');
    if (on && !t) {
      t = document.createElement('div');
      t.className = 'assist-msg assist-msg--bot assist-typing';
      t.setAttribute('aria-label', 'Assistant is typing');
      t.innerHTML = '<span></span><span></span><span></span>';
      log.appendChild(t);
      log.scrollTop = log.scrollHeight;
    } else if (!on && t) {
      t.remove();
    }
  };

  var reply = function (m) {
    m.role = 'bot';
    typing(false);
    history.push(m); save();
    addBubble(m);
    busy = false;
  };

  var ask = function (text) {
    text = (text || '').trim().slice(0, 500);
    if (!text || busy) return;
    busy = true;
    var u = { role: 'user', text: text };
    history.push(u); save();
    addBubble(u);
    suggest.hidden = true;
    typing(true);
    kbReady.then(function () {
      if (AI_ENDPOINT) {
        return aiAnswer(text).catch(function () { return localAnswer(text); });
      }
      return new Promise(function (res) { setTimeout(function () { res(localAnswer(text)); }, 450); });
    }).then(reply);
  };

  var greet = function () {
    if (history.length) { history.forEach(addBubble); return; }
    var hello = { role: 'bot', text: 'Hello! I’m the STAA Assistant. Ask me about our tax, accounting and advisory services, or pick a question below. For anything I can’t answer, I’ll connect you with an advisor on WhatsApp.' };
    history.push(hello); save();
    addBubble(hello);
  };

  var setOpen = function (open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.classList.toggle('is-open', open);
    if (open) {
      if (!log.children.length) greet();
      kbReady.then(renderSuggestions);
      input.focus();
    }
  };

  launcher.addEventListener('click', function () { setOpen(panel.hidden); });
  panel.querySelector('.assist-close').addEventListener('click', function () { setOpen(false); launcher.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) { setOpen(false); launcher.focus(); }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value;
    input.value = '';
    ask(q);
  });

  // Links elsewhere on the page can open the assistant: <a href="#" data-open-assistant>
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-open-assistant]')) { e.preventDefault(); setOpen(true); }
  });
})();
