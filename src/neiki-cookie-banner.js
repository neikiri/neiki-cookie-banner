/* ============================================================
   neiki-cookie-banner.js
   Production-ready GDPR cookie consent banner
   Version: 1.0.0
   No dependencies — vanilla ES2017+
   ============================================================ */
(function () {
  'use strict';

  // ============================================
  // CSS INJECT MARKER
  // ============================================

  const STORAGE_KEY = 'neiki_cookie_consent';

  const CATEGORY_ICONS = Object.freeze({
    necessary: '\u{1F512}',
    analytics: '\u{1F4CA}',
    marketing: '\u{1F4E2}',
    preferences: '\u{2699}\uFE0F',
    _default: '\u{1F4CB}'
  });

  const DEFAULTS = Object.freeze({
    title: 'We use cookies',
    description: 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking \u201CAccept All\u201D, you consent to our use of cookies.',
    privacyPolicyUrl: '',
    privacyPolicyText: 'Privacy Policy',

    categories: {
      necessary: {
        label: 'Necessary',
        description: 'Essential for the website to function. Cannot be disabled.',
        locked: true
      },
      analytics: {
        label: 'Analytics',
        description: 'Help us understand how visitors interact with our website.',
        enabled: false
      },
      marketing: {
        label: 'Marketing',
        description: 'Used to track visitors and display relevant ads.',
        enabled: false
      },
      preferences: {
        label: 'Preferences',
        description: 'Remember your settings and personalizations.',
        enabled: false
      }
    },

    acceptAllText: 'Accept All',
    rejectAllText: 'Reject All',
    customizeText: 'Customize',
    savePreferencesText: 'Save Preferences',

    position: 'bottom',
    layout: 'bar',
    showAfterMs: 300,
    autoAcceptAfterMs: 0,
    closeOnOverlayClick: false,
    lockScroll: false,
    animationIn: 'slide',

    consentVersion: '1.0',

    onAccept: function () {},
    onReject: function () {},
    onReady: function () {},
    onChange: function () {},
    onScriptsUnlock: function () {},

    theme: 'light',
    zIndex: 9999
  });

  /* ----------------------------------------------------------
     Storage helpers
     ---------------------------------------------------------- */
  let storageAvailable = true;

  function testStorage() {
    try {
      const t = '__ncb_test__';
      localStorage.setItem(t, '1');
      localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }

  let memoryStore = {};

  function storageGet(key) {
    if (storageAvailable) {
      return localStorage.getItem(key);
    }
    return memoryStore[key] || null;
  }

  function storageSet(key, val) {
    if (storageAvailable) {
      localStorage.setItem(key, val);
    } else {
      memoryStore[key] = val;
    }
  }

  function storageRemove(key) {
    if (storageAvailable) {
      localStorage.removeItem(key);
    } else {
      delete memoryStore[key];
    }
  }

  /* ----------------------------------------------------------
     Utility helpers
     ---------------------------------------------------------- */
  function deepMerge(target, source) {
    const out = Object.assign({}, target);
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        out[key] = deepMerge(target[key], source[key]);
      } else if (source[key] !== undefined) {
        out[key] = source[key];
      }
    }
    return out;
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'className') {
          node.className = attrs[k];
        } else if (k === 'textContent') {
          node.textContent = attrs[k];
        } else if (k === 'innerHTML') {
          node.innerHTML = attrs[k];
        } else if (k.startsWith('on') && typeof attrs[k] === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    if (children) {
      if (typeof children === 'string') {
        node.textContent = children;
      } else if (Array.isArray(children)) {
        children.forEach(function (c) {
          if (c) node.appendChild(c);
        });
      } else {
        node.appendChild(children);
      }
    }
    return node;
  }

  /* ----------------------------------------------------------
     Focus trap utility
     ---------------------------------------------------------- */
  function createFocusTrap(container) {
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let active = false;

    function handler(e) {
      if (!active || e.key !== 'Tab') return;
      const focusable = Array.from(container.querySelectorAll(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    return {
      activate: function () {
        active = true;
        document.addEventListener('keydown', handler);
        const focusable = Array.from(container.querySelectorAll(FOCUSABLE));
        if (focusable.length > 0) focusable[0].focus();
      },
      deactivate: function () {
        active = false;
        document.removeEventListener('keydown', handler);
      }
    };
  }

  /* ----------------------------------------------------------
     Main Banner Class
     ---------------------------------------------------------- */
  function Banner(config) {
    this.config = deepMerge(DEFAULTS, config || {});
    this.root = null;
    this.prefsPanel = null;
    this.prefsOpen = false;
    this.isVisible = false;
    this.focusTrap = null;
    this.previousFocus = null;
    this.autoAcceptTimer = null;
    this.autoAcceptCountdownEl = null;
    this.autoAcceptRemaining = 0;
    this.autoAcceptInterval = null;
    this.toggleStates = {};

    this._initToggleStates();
  }

  Banner.prototype._initToggleStates = function () {
    const cats = this.config.categories;
    for (const key in cats) {
      if (cats[key].locked) {
        this.toggleStates[key] = true;
      } else {
        this.toggleStates[key] = cats[key].enabled === true;
      }
    }
  };

  Banner.prototype._loadConsent = function () {
    const raw = storageGet(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  Banner.prototype._saveConsent = function (categories) {
    const data = {
      version: this.config.consentVersion,
      timestamp: new Date().toISOString(),
      categories: Object.assign({}, categories)
    };
    storageSet(STORAGE_KEY, JSON.stringify(data));
    return data;
  };

  Banner.prototype._buildCategories = function (allAccepted) {
    const cats = this.config.categories;
    const result = {};
    for (const key in cats) {
      if (cats[key].locked) {
        result[key] = true;
      } else if (allAccepted) {
        result[key] = true;
      } else {
        result[key] = this.toggleStates[key] === true;
      }
    }
    return result;
  };

  Banner.prototype._buildRejectedCategories = function () {
    const cats = this.config.categories;
    const result = {};
    for (const key in cats) {
      result[key] = cats[key].locked === true;
    }
    return result;
  };

  /* ----------------------------------------------------------
     DOM building
     ---------------------------------------------------------- */
  Banner.prototype._render = function () {
    const cfg = this.config;
    const self = this;

    if (this.root) {
      this.root.remove();
    }

    const themeClass = cfg.theme === 'dark' ? 'neiki-cb--dark' : cfg.theme === 'auto' ? 'neiki-cb--auto' : '';
    const layoutClass = 'neiki-cb--' + cfg.layout;
    const posClass = 'neiki-cb--' + cfg.position;
    const animClass = 'neiki-cb--anim-' + cfg.animationIn;

    this.root = el('div', {
      className: ['neiki-cb', themeClass, layoutClass, posClass, animClass, 'neiki-cb--hidden'].filter(Boolean).join(' '),
      role: 'dialog',
      'aria-modal': cfg.layout === 'modal' ? 'true' : 'false',
      'aria-label': cfg.title,
      style: 'z-index:' + cfg.zIndex
    });

    const bannerId = 'neiki-cb-title-' + Date.now();

    this.root.setAttribute('aria-labelledby', bannerId);

    /* Backdrop for modal */
    if (cfg.layout === 'modal') {
      const backdrop = el('div', { className: 'neiki-cb__backdrop' });
      if (cfg.closeOnOverlayClick) {
        backdrop.addEventListener('click', function () {
          self._reject();
        });
      }
      this.root.appendChild(backdrop);
    }

    /* Container */
    const container = el('div', { className: 'neiki-cb__container' });

    /* Main area */
    const main = el('div', { className: 'neiki-cb__main' });

    /* Content */
    const content = el('div', { className: 'neiki-cb__content' });
    content.appendChild(el('div', { className: 'neiki-cb__title', id: bannerId, textContent: cfg.title }));

    let descHtml = this._escapeHtml(cfg.description);
    if (cfg.privacyPolicyUrl) {
      descHtml += ' <a href="' + this._escapeAttr(cfg.privacyPolicyUrl) + '" target="_blank" rel="noopener noreferrer">' + this._escapeHtml(cfg.privacyPolicyText) + '</a>';
    }
    content.appendChild(el('div', { className: 'neiki-cb__description', innerHTML: descHtml }));

    main.appendChild(content);

    /* Action buttons */
    const actions = el('div', { className: 'neiki-cb__actions' });

    const acceptBtn = el('button', {
      className: 'neiki-cb__btn neiki-cb__btn--primary',
      textContent: cfg.acceptAllText,
      'aria-label': cfg.acceptAllText,
      onClick: function () { self._acceptAll(); }
    });
    actions.appendChild(acceptBtn);

    if (cfg.rejectAllText) {
      const rejectBtn = el('button', {
        className: 'neiki-cb__btn neiki-cb__btn--secondary',
        textContent: cfg.rejectAllText,
        'aria-label': cfg.rejectAllText,
        onClick: function () { self._reject(); }
      });
      actions.appendChild(rejectBtn);
    }

    if (cfg.layout !== 'modal') {
      const customizeBtn = el('button', {
        className: 'neiki-cb__btn neiki-cb__btn--secondary',
        textContent: cfg.customizeText,
        'aria-label': cfg.customizeText,
        onClick: function () { self._togglePrefs(); }
      });
      actions.appendChild(customizeBtn);
    }

    main.appendChild(actions);
    container.appendChild(main);

    /* Preferences panel */
    this.prefsPanel = this._renderPrefsPanel();
    container.appendChild(this.prefsPanel);

    /* Countdown (auto-accept) */
    if (cfg.autoAcceptAfterMs > 0) {
      this.autoAcceptCountdownEl = this._renderCountdown();
      container.appendChild(this.autoAcceptCountdownEl);
    }

    this.root.appendChild(container);
    document.body.appendChild(this.root);

    /* Focus trap */
    this.focusTrap = createFocusTrap(this.root);

    /* Modal starts with prefs open */
    if (cfg.layout === 'modal') {
      this.prefsPanel.classList.add('neiki-cb__prefs--open');
      this.prefsOpen = true;
    }
  };

  Banner.prototype._renderPrefsPanel = function () {
    const cfg = this.config;
    const self = this;
    const panel = el('div', {
      className: 'neiki-cb__prefs',
      'aria-hidden': cfg.layout === 'modal' ? 'false' : 'true'
    });

    const title = el('div', { className: 'neiki-cb__prefs-title', textContent: 'Manage Preferences' });
    panel.appendChild(title);

    const cats = cfg.categories;
    for (const key in cats) {
      const cat = cats[key];
      const row = this._renderCategoryRow(key, cat);
      panel.appendChild(row);
    }

    /* Prefs actions */
    const prefsActions = el('div', { className: 'neiki-cb__prefs-actions' });

    prefsActions.appendChild(el('button', {
      className: 'neiki-cb__btn neiki-cb__btn--primary',
      textContent: cfg.savePreferencesText,
      'aria-label': cfg.savePreferencesText,
      onClick: function () { self._savePrefs(); }
    }));

    prefsActions.appendChild(el('button', {
      className: 'neiki-cb__btn neiki-cb__btn--primary',
      textContent: cfg.acceptAllText,
      'aria-label': cfg.acceptAllText + ' from preferences',
      onClick: function () { self._acceptAll(); }
    }));

    panel.appendChild(prefsActions);
    return panel;
  };

  Banner.prototype._renderCategoryRow = function (key, cat) {
    const self = this;
    const icon = CATEGORY_ICONS[key] || CATEGORY_ICONS._default;
    const isLocked = cat.locked === true;
    const isActive = this.toggleStates[key] === true;

    const row = el('div', { className: 'neiki-cb__category' });

    row.appendChild(el('div', {
      className: 'neiki-cb__category-icon',
      textContent: icon,
      'aria-hidden': 'true'
    }));

    const info = el('div', { className: 'neiki-cb__category-info' });
    info.appendChild(el('div', { className: 'neiki-cb__category-label', textContent: cat.label || key }));
    if (cat.description) {
      info.appendChild(el('div', { className: 'neiki-cb__category-desc', textContent: cat.description }));
    }
    row.appendChild(info);

    /* Toggle */
    const toggleClasses = ['neiki-cb__toggle'];
    if (isActive) toggleClasses.push('neiki-cb__toggle--active');
    if (isLocked) toggleClasses.push('neiki-cb__toggle--locked');

    const toggle = el('button', {
      className: toggleClasses.join(' '),
      role: 'switch',
      'aria-checked': isActive ? 'true' : 'false',
      'aria-label': (cat.label || key) + ' cookies',
      'data-category': key
    });

    if (isLocked) {
      toggle.setAttribute('disabled', 'true');
      toggle.setAttribute('aria-disabled', 'true');
    }

    toggle.appendChild(el('span', { className: 'neiki-cb__toggle-track' }));
    toggle.appendChild(el('span', { className: 'neiki-cb__toggle-knob' }));

    if (!isLocked) {
      toggle.addEventListener('click', function () {
        const newState = !self.toggleStates[key];
        self.toggleStates[key] = newState;
        toggle.classList.toggle('neiki-cb__toggle--active', newState);
        toggle.setAttribute('aria-checked', newState ? 'true' : 'false');
      });
    }

    row.appendChild(toggle);
    return row;
  };

  Banner.prototype._renderCountdown = function () {
    const wrapper = el('div', { className: 'neiki-cb__countdown' });
    const label = el('span', { textContent: 'Auto-accepting in ' });
    const time = el('span', { className: 'neiki-cb__countdown-time' });
    const bar = el('div', { className: 'neiki-cb__countdown-bar' });
    const fill = el('div', { className: 'neiki-cb__countdown-fill', style: 'width:100%' });
    bar.appendChild(fill);
    wrapper.appendChild(label);
    wrapper.appendChild(time);
    wrapper.appendChild(bar);
    wrapper._time = time;
    wrapper._fill = fill;
    return wrapper;
  };

  Banner.prototype._escapeHtml = function (str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  Banner.prototype._escapeAttr = function (str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  /* ----------------------------------------------------------
     Show / Hide
     ---------------------------------------------------------- */
  Banner.prototype.show = function () {
    const self = this;
    this.previousFocus = document.activeElement;

    if (!this.root) {
      this._render();
    }

    this.root.classList.remove('neiki-cb--hidden');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        self.root.classList.add('neiki-cb--visible');
      });
    });

    this.isVisible = true;

    if (this.config.lockScroll || this.config.layout === 'modal') {
      document.body.classList.add('neiki-cb-lock-scroll');
    }

    if (this.config.layout === 'modal') {
      this.focusTrap.activate();
    }

    this._startAutoAccept();
  };

  Banner.prototype.hide = function () {
    const self = this;
    if (!this.root) return;

    this._stopAutoAccept();

    this.root.classList.remove('neiki-cb--visible');
    this.isVisible = false;

    document.body.classList.remove('neiki-cb-lock-scroll');

    if (this.focusTrap) {
      this.focusTrap.deactivate();
    }

    if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
      this.previousFocus.focus();
    }

    const duration = this.config.animationIn === 'none' ? 10 : 450;
    setTimeout(function () {
      if (self.root) {
        self.root.classList.add('neiki-cb--hidden');
      }
    }, duration);
  };

  /* ----------------------------------------------------------
     Preferences toggle
     ---------------------------------------------------------- */
  Banner.prototype._togglePrefs = function () {
    this.prefsOpen = !this.prefsOpen;
    if (this.prefsOpen) {
      this.prefsPanel.classList.add('neiki-cb__prefs--open');
      this.prefsPanel.setAttribute('aria-hidden', 'false');
    } else {
      this.prefsPanel.classList.remove('neiki-cb__prefs--open');
      this.prefsPanel.setAttribute('aria-hidden', 'true');
    }
  };

  /* ----------------------------------------------------------
     Consent actions
     ---------------------------------------------------------- */
  Banner.prototype._acceptAll = function () {
    const categories = this._buildCategories(true);
    const consent = this._saveConsent(categories);
    this.hide();
    this.config.onAccept(categories);
    this.config.onChange(categories);
    this.config.onScriptsUnlock(categories);
  };

  Banner.prototype._reject = function () {
    const categories = this._buildRejectedCategories();
    const consent = this._saveConsent(categories);
    this.hide();
    this.config.onReject();
    this.config.onChange(categories);
  };

  Banner.prototype._savePrefs = function () {
    const categories = this._buildCategories(false);
    const consent = this._saveConsent(categories);
    this.hide();
    this.config.onAccept(categories);
    this.config.onChange(categories);
    this.config.onScriptsUnlock(categories);
  };

  /* ----------------------------------------------------------
     Auto-accept countdown
     ---------------------------------------------------------- */
  Banner.prototype._startAutoAccept = function () {
    const self = this;
    const ms = this.config.autoAcceptAfterMs;
    if (!ms || ms <= 0) return;

    this.autoAcceptRemaining = ms;
    const total = ms;
    const el = this.autoAcceptCountdownEl;
    if (!el) return;

    function update() {
      const secs = Math.ceil(self.autoAcceptRemaining / 1000);
      if (el._time) el._time.textContent = secs + 's';
      if (el._fill) el._fill.style.width = (self.autoAcceptRemaining / total * 100) + '%';
    }

    update();

    this.autoAcceptInterval = setInterval(function () {
      self.autoAcceptRemaining -= 100;
      update();
      if (self.autoAcceptRemaining <= 0) {
        self._stopAutoAccept();
        self._acceptAll();
      }
    }, 100);
  };

  Banner.prototype._stopAutoAccept = function () {
    if (this.autoAcceptInterval) {
      clearInterval(this.autoAcceptInterval);
      this.autoAcceptInterval = null;
    }
  };

  /* ----------------------------------------------------------
     Public API singleton
     ---------------------------------------------------------- */
  let instance = null;

  const NeikiCookieBanner = {
    init: function (config) {
      storageAvailable = testStorage();
      if (!storageAvailable) {
        console.warn('[neiki-cookie-banner] localStorage unavailable, falling back to in-memory storage.');
      }

      if (instance) {
        instance._stopAutoAccept();
        if (instance.root) {
          instance.root.remove();
          instance.root = null;
        }
        if (instance.focusTrap) {
          instance.focusTrap.deactivate();
        }
        document.body.classList.remove('neiki-cb-lock-scroll');
      }

      instance = new Banner(config);

      const existing = instance._loadConsent();
      if (existing && existing.version === instance.config.consentVersion) {
        instance.config.onReady(existing);
        return;
      }

      const delay = instance.config.showAfterMs;
      if (delay > 0) {
        setTimeout(function () { instance.show(); }, delay);
      } else {
        instance.show();
      }
    },

    show: function () {
      if (!instance) {
        console.warn('[neiki-cookie-banner] Not initialized. Call NeikiCookieBanner.init() first.');
        return;
      }
      /* Re-render to reset toggle states if needed */
      instance._initToggleStates();
      instance._render();
      instance.show();
    },

    hide: function () {
      if (instance) instance.hide();
    },

    getConsent: function () {
      const raw = storageGet(STORAGE_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    },

    reset: function () {
      storageRemove(STORAGE_KEY);
      if (instance) {
        instance._initToggleStates();
        instance._render();
        instance.show();
      }
    },

    hasConsented: function () {
      const consent = NeikiCookieBanner.getConsent();
      return consent !== null;
    },

    isAllowed: function (category) {
      const consent = NeikiCookieBanner.getConsent();
      if (!consent || !consent.categories) return false;
      return consent.categories[category] === true;
    }
  };

  /* ----------------------------------------------------------
     data-neiki-show-prefs attribute hook
     ---------------------------------------------------------- */
  function bindShowPrefsHook() {
    document.addEventListener('click', function (e) {
      const trigger = e.target.closest('[data-neiki-show-prefs]');
      if (trigger) {
        e.preventDefault();
        NeikiCookieBanner.show();
      }
    });
  }

  /* ----------------------------------------------------------
     Web Component: <neiki-cookie-banner>
     ---------------------------------------------------------- */
  function registerWebComponent() {
    if (typeof customElements === 'undefined') return;
    if (customElements.get('neiki-cookie-banner')) return;

    class NeikiCookieBannerElement extends HTMLElement {
      connectedCallback() {
        const cfg = {};
        const ds = this.dataset;

        if (ds.position) cfg.position = ds.position;
        if (ds.layout) cfg.layout = ds.layout;
        if (ds.theme) cfg.theme = ds.theme;
        if (ds.consentVersion) cfg.consentVersion = ds.consentVersion;
        if (ds.privacyPolicyUrl) cfg.privacyPolicyUrl = ds.privacyPolicyUrl;
        if (ds.privacyPolicyText) cfg.privacyPolicyText = ds.privacyPolicyText;
        if (ds.title) cfg.title = ds.title;
        if (ds.description) cfg.description = ds.description;
        if (ds.acceptAllText) cfg.acceptAllText = ds.acceptAllText;
        if (ds.rejectAllText) cfg.rejectAllText = ds.rejectAllText;
        if (ds.customizeText) cfg.customizeText = ds.customizeText;
        if (ds.savePreferencesText) cfg.savePreferencesText = ds.savePreferencesText;
        if (ds.animationIn) cfg.animationIn = ds.animationIn;
        if (ds.zIndex) cfg.zIndex = parseInt(ds.zIndex, 10);
        if (ds.showAfterMs) cfg.showAfterMs = parseInt(ds.showAfterMs, 10);
        if (ds.autoAcceptAfterMs) cfg.autoAcceptAfterMs = parseInt(ds.autoAcceptAfterMs, 10);
        if (ds.lockScroll !== undefined) cfg.lockScroll = ds.lockScroll === 'true';
        if (ds.closeOnOverlayClick !== undefined) cfg.closeOnOverlayClick = ds.closeOnOverlayClick === 'true';

        NeikiCookieBanner.init(cfg);
      }
    }

    customElements.define('neiki-cookie-banner', NeikiCookieBannerElement);
  }

  /* ----------------------------------------------------------
     Bootstrap
     ---------------------------------------------------------- */
  window.NeikiCookieBanner = NeikiCookieBanner;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindShowPrefsHook();
      registerWebComponent();
    });
  } else {
    bindShowPrefsHook();
    registerWebComponent();
  }

})();
