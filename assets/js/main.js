/* =========================================================
   STAA — site scripts (no dependencies)
   1. Mobile navigation      5. Tax health check
   2. Header on scroll       6. Contact form
   3. Scroll reveal          7. Services side-nav
   4. Animated counters      8. Insights filter / footer year
                             9. Cookie consent
   ========================================================= */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  /* ---------- 0. Preloader (first visit, or a slow page) ---------- */
  var root = document.documentElement;
  if (root.classList.contains('pl-on')) {
    var firstVisit = root.classList.contains('pl-first');
    var finished = false;
    var clearLoader = function () { root.classList.remove('pl-on', 'pl-first', 'pl-slow', 'pl-hold', 'pl-leave'); };
    var finishLoader = function () {
      if (finished) return;
      finished = true;
      try { localStorage.setItem('staa-visited', '1'); } catch (e) {}
      var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var minShow = firstVisit ? (still ? 600 : 1700) : 0; // let the mark finish filling on a first visit
      setTimeout(function () {
        // A slow-page loader only appears after 0.6s; if we're done before then, skip it entirely
        if (!firstVisit && performance.now() < 650) { clearLoader(); return; }
        root.classList.add('pl-leave');
        root.classList.remove('pl-hold');
        setTimeout(clearLoader, still ? 0 : 950);
      }, Math.max(0, minShow - performance.now()));
    };
    if (document.readyState === 'complete') finishLoader();
    else window.addEventListener('load', finishLoader);
    setTimeout(finishLoader, 8000); // never keep anyone waiting on a stuck asset
  }

  /* ---------- 1. Mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
  }

  /* ---------- 2. Header shadow on scroll ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 3. Scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 4. Animated counters: <span data-count="5"> ---------- */
  var counters = document.querySelectorAll('[data-count]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target, end = parseInt(el.getAttribute('data-count'), 10), start = null;
        var step = function (t) {
          if (!start) start = t;
          var p = Math.min((t - start) / 1200, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = '0'; co.observe(el); });
  }

  /* ---------- 5. Tax health check (home page) ----------
     Edit the questions below. Each "No" answer recommends a service. */
  var checker = document.getElementById('health-check');
  if (checker) {
    var questions = [
      { q: 'Are your VAT and PAYE returns filed on or before every TRA deadline?', fix: 'Tax filing & compliance', href: 'services.html#tax' },
      { q: 'Are your books up to date and your financial statements prepared in line with IFRS?', fix: 'Accounting & IFRS reporting', href: 'services.html#accounting' },
      { q: 'Would you be confident if TRA announced a tax audit next week?', fix: 'Tax audit support & representation', href: 'services.html#tax' },
      { q: 'Do you have documented internal controls to prevent fraud and errors?', fix: 'Risk advisory & internal controls', href: 'services.html#audit' },
      { q: 'If you trade across East Africa, are your cross-border tax obligations clear?', fix: 'East Africa market support', href: 'services.html#eac' }
    ];
    var idx = 0, fixes = [];
    var qEl = checker.querySelector('.checker-q');
    var labelEl = checker.querySelector('.checker-step-label');
    var bar = checker.querySelector('.checker-progress span');
    var stepEl = checker.querySelector('.checker-step');
    var resultEl = checker.querySelector('.checker-result');
    var render = function () {
      labelEl.textContent = 'Question ' + (idx + 1) + ' of ' + questions.length;
      qEl.textContent = questions[idx].q;
      bar.style.width = (idx / questions.length * 100) + '%';
    };
    var finish = function () {
      bar.style.width = '100%';
      stepEl.hidden = true;
      var score = questions.length - fixes.length;
      resultEl.querySelector('.checker-score').textContent = score + '/' + questions.length;
      resultEl.querySelector('.checker-verdict').textContent =
        score === questions.length ? 'Strong position. A periodic STAA review keeps it that way.'
        : score >= 3 ? 'Mostly on track, with a few gaps worth closing before they become penalties.'
        : 'Several compliance risks. Let’s talk soon. Most of these are quick to fix with the right support.';
      var list = resultEl.querySelector('.checker-recs');
      list.innerHTML = '';
      var seen = {};
      fixes.forEach(function (f) {
        if (seen[f.fix]) return; seen[f.fix] = 1;
        var a = document.createElement('a');
        a.href = f.href;
        a.innerHTML = '<span></span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 18L18 6M9 6h9v9"/></svg>';
        a.querySelector('span').textContent = f.fix;
        list.appendChild(a);
      });
      resultEl.classList.add('is-visible');
      resultEl.querySelector('.checker-score').focus();
    };
    checker.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-answer]');
      if (btn) {
        if (btn.getAttribute('data-answer') === 'no') fixes.push(questions[idx]);
        idx++;
        idx < questions.length ? render() : finish();
      }
      if (e.target.closest('[data-restart]')) {
        idx = 0; fixes = []; stepEl.hidden = false; resultEl.classList.remove('is-visible'); render();
      }
    });
    render();
  }

  /* ---------- 6. Contact form ----------
     Works without a server: validates, then opens the visitor's email app
     addressed to info@staa.co.tz. To use a form service (e.g. Formspree),
     set data-endpoint="https://formspree.io/f/xxxx" on the <form>. */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = form.querySelector('.form-status');
    var showError = function (field, msg) {
      var wrap = field.closest('.field');
      wrap.classList.toggle('has-error', !!msg);
      wrap.querySelector('.error').textContent = msg || '';
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var msg = '';
        if (!f.value.trim()) msg = 'This field is required.';
        else if (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value)) msg = 'Enter a valid email address.';
        showError(f, msg);
        if (msg) ok = false;
      });
      if (!ok) { form.querySelector('.has-error input, .has-error select, .has-error textarea').focus(); return; }

      var data = new FormData(form);
      var endpoint = form.getAttribute('data-endpoint');
      if (endpoint) {
        fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (r) { if (!r.ok) throw new Error(); status.textContent = 'Thank you. Your message has been sent. We’ll be in touch soon.'; form.reset(); })
          .catch(function () { status.textContent = 'Sorry, something went wrong. Please email info@staa.co.tz directly.'; })
          .finally(function () { status.classList.add('is-visible'); });
        return;
      }
      var body = 'Name: ' + data.get('name') + '\nEmail: ' + data.get('email') + '\nPhone: ' + (data.get('phone') || '-') +
        '\nOrganisation: ' + (data.get('organisation') || '-') + '\nService: ' + data.get('service') + '\n\n' + data.get('message');
      window.location.href = 'mailto:info@staa.co.tz?subject=' + encodeURIComponent('Website enquiry: ' + data.get('service')) + '&body=' + encodeURIComponent(body);
      status.textContent = 'Your email app should open with your message ready to send. If not, email info@staa.co.tz.';
      status.classList.add('is-visible');
    });
    // Pre-select a service from the URL: contact.html?service=tax
    var pre = new URLSearchParams(location.search).get('service');
    if (pre && form.service) {
      Array.prototype.forEach.call(form.service.options, function (o) { if (o.getAttribute('data-key') === pre) o.selected = true; });
    }
  }

  /* ---------- 7. Services page side-nav highlight ---------- */
  var sideLinks = document.querySelectorAll('.services-nav a');
  if (sideLinks.length && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sideLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.service-block').forEach(function (b) { so.observe(b); });
  }

  /* ---------- 8a. Insights filter ---------- */
  var chips = document.querySelectorAll('.chip[data-filter]');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
      document.querySelectorAll('.post-card').forEach(function (p) {
        p.hidden = f !== 'all' && p.getAttribute('data-topic') !== f;
      });
    });
  });

  /* ---------- 8b. Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- 9. Cookie consent ----------
     Optional content stays blocked until the visitor allows its category:
       <iframe data-consent="maps" data-src="https://..." hidden>
       <script type="text/plain" data-consent="analytics" src="https://..."></script>
     To add a category (e.g. analytics), add it to CATEGORIES and list its
     cookies in privacy.html, section 9. The choice is kept for 12 months. */
  var CATEGORIES = [
    { key: 'maps', name: 'Maps & embedded content', desc: 'Shows our Google map on the contact page. Google may set cookies when it loads.' }
  ];
  var STORE_KEY = 'staa-consent', MAX_AGE = 365 * 24 * 60 * 60 * 1000;

  var readConsent = function () {
    try {
      var c = JSON.parse(localStorage.getItem(STORE_KEY));
      if (c && c.ts && Date.now() - c.ts < MAX_AGE) return c;
    } catch (e) {}
    return null;
  };
  var consent = readConsent() || {};

  var applyConsent = function () {
    document.querySelectorAll('iframe[data-consent]').forEach(function (f) {
      var ok = !!consent[f.getAttribute('data-consent')];
      if (ok && !f.getAttribute('src')) f.src = f.getAttribute('data-src');
      if (!ok && f.getAttribute('src')) f.removeAttribute('src');
      f.hidden = !ok;
    });
    document.querySelectorAll('[data-consent-placeholder]').forEach(function (p) {
      p.hidden = !!consent[p.getAttribute('data-consent-placeholder')];
    });
    document.querySelectorAll('script[type="text/plain"][data-consent]').forEach(function (s) {
      if (!consent[s.getAttribute('data-consent')]) return;
      var live = document.createElement('script');
      if (s.src) live.src = s.src; else live.text = s.text;
      s.parentNode.replaceChild(live, s);
    });
  };

  var saveConsent = function (choices) {
    consent = { v: 1, ts: Date.now() };
    CATEGORIES.forEach(function (c) { consent[c.key] = !!choices[c.key]; });
    try { localStorage.setItem(STORE_KEY, JSON.stringify(consent)); } catch (e) {}
    applyConsent();
  };

  var banner = document.createElement('section');
  banner.className = 'cookie-banner';
  banner.setAttribute('aria-labelledby', 'cookie-title');
  banner.hidden = true;
  banner.innerHTML =
    '<div class="cookie-inner">' +
      '<div class="cookie-copy">' +
        '<h2 id="cookie-title" tabindex="-1">Your privacy choices</h2>' +
        '<p>We use only the storage this site needs to work. With your permission we also load content from other providers, such as Google Maps, which may set cookies. Read our <a href="privacy.html#cookies">privacy &amp; cookie policy</a>.</p>' +
      '</div>' +
      '<div class="cookie-prefs" hidden>' +
        '<label class="cookie-pref"><input type="checkbox" checked disabled>' +
          '<span><strong>Strictly necessary</strong><small>Remembers your cookie choice. Always on.</small></span></label>' +
        CATEGORIES.map(function (c) {
          return '<label class="cookie-pref"><input type="checkbox" data-cat="' + c.key + '">' +
            '<span><strong>' + c.name + '</strong><small>' + c.desc + '</small></span></label>';
        }).join('') +
      '</div>' +
      '<div class="cookie-actions">' +
        '<button type="button" class="btn btn--primary" data-cookie="accept">Accept all</button>' +
        '<button type="button" class="btn btn--ghost" data-cookie="reject">Reject optional</button>' +
        '<button type="button" class="btn btn--ghost" data-cookie="customise" aria-expanded="false">Customise</button>' +
        '<button type="button" class="btn btn--primary" data-cookie="save" hidden>Save choices</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(banner);

  var prefs = banner.querySelector('.cookie-prefs');
  var customiseBtn = banner.querySelector('[data-cookie="customise"]');
  var saveBtn = banner.querySelector('[data-cookie="save"]');
  var returnFocus = null;

  var showPrefs = function (open) {
    prefs.hidden = !open;
    saveBtn.hidden = !open;
    customiseBtn.hidden = open;
    customiseBtn.setAttribute('aria-expanded', String(open));
  };
  var openBanner = function (withPrefs) {
    banner.querySelectorAll('[data-cat]').forEach(function (box) { box.checked = !!consent[box.getAttribute('data-cat')]; });
    showPrefs(withPrefs);
    banner.hidden = false;
  };
  var closeBanner = function () {
    banner.hidden = true;
    if (returnFocus) { returnFocus.focus(); returnFocus = null; }
  };

  banner.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cookie]');
    if (!btn) return;
    var action = btn.getAttribute('data-cookie'), choices = {};
    if (action === 'customise') { showPrefs(true); prefs.querySelector('[data-cat]').focus(); return; }
    CATEGORIES.forEach(function (c) {
      choices[c.key] = action === 'accept' ||
        (action === 'save' && banner.querySelector('[data-cat="' + c.key + '"]').checked);
    });
    saveConsent(choices);
    closeBanner();
  });

  // "Cookie settings" links (footer, privacy page) reopen the banner
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-cookie-settings]');
    if (opener) {
      returnFocus = opener;
      openBanner(true);
      banner.querySelector('#cookie-title').focus();
    }
    // "Show map" style buttons allow a single category in place
    var allow = e.target.closest('[data-consent-allow]');
    if (allow) {
      var choices = {};
      CATEGORIES.forEach(function (c) { choices[c.key] = !!consent[c.key]; });
      choices[allow.getAttribute('data-consent-allow')] = true;
      saveConsent(choices);
      if (!banner.hidden) closeBanner();
    }
  });

  applyConsent();
  if (!consent.ts) openBanner(false);
})();
