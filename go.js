// Provider token from App Store Connect → Analytics → Acquisition → Campaigns (the `pt=` value
// in any generated campaign link). It is the same for every campaign; only `ct` changes.
var PT_TOKEN = '129462539';
var PT_PLACEHOLDER = 'PT_TOKEN';
var APP_ID = '6818478551';
var SCHEME = 'medslime://';
// slug -> { title, blurb, appPath }. appPath is appended to medslime:// (Expo Router path, no leading slash).
var TOPICS = {
  'default': { title: '弱點補起來，分數撿回來。', blurb: '刷國考歷屆題，從作答紀錄找出真正的弱點，知道接下來該讀什麼。', appPath: '' },
  'gpc': { title: 'GPC｜革蘭氏陽性球菌', blurb: 'Staphylococcus、Streptococcus、Enterococcus 怎麼分、考什麼。在 MedSlime 用歷屆題測實力。', appPath: 'node/gpc' },
  'enterobacterales': { title: 'Enterobacterales 腸桿菌目', blurb: '腸桿菌目的鑑別與常考重點，在 MedSlime 用歷屆題練習。', appPath: 'node/mb05' },
  'mycobacterium': { title: 'Mycobacterium 分枝桿菌', blurb: '結核與非結核分枝桿菌、抗酸染色與藥敏，在 MedSlime 用歷屆題練習。', appPath: 'node/mb12' }
};

(function () {
  'use strict';

  var HINT_DELAY_MS = 1500;
  var COPY_RESET_MS = 2000;

  function el(id) {
    return document.getElementById(id);
  }

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function prefersReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {
      return false;
    }
  }

  // ---- query params (no URLSearchParams -> treat as no params) ----
  var params = null;
  try {
    if (typeof URLSearchParams === 'function') {
      params = new URLSearchParams(window.location.search);
    }
  } catch (e) {
    params = null;
  }

  function param(name) {
    if (!params) return '';
    return params.get(name) || '';
  }

  var topicKey = String(param('t')).toLowerCase().trim();
  var topic = hasOwn(TOPICS, topicKey) ? TOPICS[topicKey] : TOPICS['default'];
  var ct = String(param('c')).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 30) || 'web';

  var storeUrl = 'https://apps.apple.com/app/id' + APP_ID + '?' +
    (PT_TOKEN && PT_TOKEN !== PT_PLACEHOLDER ? 'pt=' + encodeURIComponent(PT_TOKEN) + '&' : '') +
    'ct=' + encodeURIComponent(ct) + '&mt=8';
  var appUrl = SCHEME + topic.appPath;

  // ---- platform detection ----
  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var isInApp = /Instagram|Barcelona|FBAN|FBAV|FB_IAB|Line\/|Threads/i.test(ua);

  var bannerBtn = el('go-banner-btn');
  var bannerCaption = document.querySelector('.go-banner-text span');
  var storeBtn = el('go-store');
  var openBtn = el('go-open');
  var actions = el('go-actions');
  var androidNotice = el('go-android');
  var hint = el('go-hint');
  var hintStore = el('go-hint-store');
  var inAppTip = el('go-inapp-tip');
  var copyBtn = el('go-copy');
  var smallText = el('go-small');
  var copyLabel = copyBtn ? copyBtn.textContent : '';

  function setText(node, text) {
    if (node) node.textContent = text;
  }

  function setHref(node, href) {
    if (node) node.setAttribute('href', href);
  }

  // ---- content from topic (textContent only, never innerHTML) ----
  setText(el('go-title'), topic.title);
  setText(el('go-blurb'), topic.blurb);
  if (topic !== TOPICS['default']) {
    document.title = topic.title + '｜MedSlime';
  }

  setHref(storeBtn, storeUrl);
  setHref(hintStore, storeUrl);
  setHref(bannerBtn, storeUrl);
  setHref(openBtn, appUrl);

  if (inAppTip) inAppTip.hidden = !isInApp;

  // ---- open attempt (iOS only, user tap only) ----
  var opening = false;

  function showHint() {
    if (!hint) return;
    hint.hidden = false;
    if (hint.scrollIntoView) {
      try {
        hint.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
      } catch (e) {
        try {
          hint.scrollIntoView();
        } catch (e2) { /* ignore */ }
      }
    }
  }

  function tryOpen() {
    if (opening) return;
    opening = true;

    // "Left page" signals: only visibilitychange (document.hidden) and pagehide.
    // Window blur is deliberately not used: iOS Safari fires it on its own
    // "address is invalid" alert when the app is not installed, which would
    // wrongly suppress the hint.
    var leftPage = false;

    function onVisibility() {
      if (document.hidden) leftPage = true;
    }
    function onLeave() {
      leftPage = true;
    }

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onLeave);

    try {
      window.location.href = appUrl;
    } catch (e) {
      // blocked or unsupported scheme: the timer below shows the hint
    }

    window.setTimeout(function () {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onLeave);

      if (!leftPage && !document.hidden) {
        showHint();
      }
      opening = false;
    }, HINT_DELAY_MS);
  }

  function onOpenTap(e) {
    if (e && e.preventDefault) e.preventDefault();
    tryOpen();
  }

  // ---- copy link ----
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    ta.style.fontSize = '16px';
    document.body.appendChild(ta);

    var ok = false;
    try {
      ta.select();
      ta.setSelectionRange(0, text.length);
      ok = !!document.execCommand('copy');
    } catch (e) {
      ok = false;
    }

    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return fallbackCopy(text); }
      );
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function onCopy(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!copyBtn) return;

    function finish(ok) {
      copyBtn.textContent = ok ? '已複製' : '請長按網址列複製';
      window.setTimeout(function () {
        copyBtn.textContent = copyLabel;
      }, COPY_RESET_MS);
    }

    copyText(window.location.href).then(finish, function () { finish(false); });
  }

  if (copyBtn) copyBtn.addEventListener('click', onCopy);

  // ---- platform branches ----
  if (isIOS) {
    document.body.classList.add('go-ios');
    setText(bannerBtn, '打開');
    if (bannerBtn) bannerBtn.addEventListener('click', onOpenTap);
    if (openBtn) openBtn.addEventListener('click', onOpenTap);
  } else if (isAndroid) {
    document.body.classList.add('go-android');
    if (androidNotice) androidNotice.hidden = false;
    if (actions) actions.hidden = true;
    if (bannerBtn) bannerBtn.hidden = true;
    setText(bannerCaption, '目前只支援 iOS');
  } else {
    document.body.classList.add('go-desktop');
    if (storeBtn) storeBtn.hidden = false;
    if (openBtn) openBtn.hidden = true;
    setText(bannerBtn, '下載');
    setText(smallText, 'MedSlime 目前提供 iPhone 版。');
  }
})();
