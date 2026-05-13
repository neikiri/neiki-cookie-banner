/* ============================================================
   neiki-cookie-banner.js
   Production-ready GDPR / ePrivacy cookie consent banner
   Version: 2.0.0
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

  /* ----------------------------------------------------------
     i18n translation tables
     ---------------------------------------------------------- */
  const I18N = {
    en: {
      title: 'We use cookies',
      description: 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking \u201CAccept All\u201D, you consent to our use of cookies.',
      privacyPolicyText: 'Privacy Policy',
      acceptAllText: 'Accept All',
      rejectAllText: 'Reject All',
      customizeText: 'Customize',
      savePreferencesText: 'Save Preferences',
      managePreferencesTitle: 'Manage Preferences',
      categories: {
        necessary: {
          label: 'Necessary',
          description: 'Essential for the website to function. Cannot be disabled.'
        },
        analytics: {
          label: 'Analytics',
          description: 'Help us understand how visitors interact with our website.'
        },
        marketing: {
          label: 'Marketing',
          description: 'Used to track visitors and display relevant ads.'
        },
        preferences: {
          label: 'Preferences',
          description: 'Remember your settings and personalizations.'
        }
      }
    },
    cs: {
      title: 'Pou\u017E\u00EDv\u00E1me cookies',
      description: 'Pou\u017E\u00EDv\u00E1me cookies ke zlep\u0161en\u00ED va\u0161eho z\u00E1\u017Eitku z prohl\u00ED\u017Een\u00ED, zobrazov\u00E1n\u00ED personalizovan\u00FDch reklam \u010Di obsahu a anal\u00FDze na\u0161\u00ED n\u00E1v\u0161t\u011Bvnosti. Kliknut\u00EDm na \u201EP\u0159ijmout v\u0161e\u201C souhlas\u00EDte s pou\u017Eit\u00EDm cookies.',
      privacyPolicyText: 'Z\u00E1sady ochrany osobn\u00EDch \u00FAdaj\u016F',
      acceptAllText: 'P\u0159ijmout v\u0161e',
      rejectAllText: 'Odm\u00EDtnout v\u0161e',
      customizeText: 'Upravit',
      savePreferencesText: 'Ulo\u017Eit nastaven\u00ED',
      managePreferencesTitle: 'Spr\u00E1va preferenc\u00ED',
      categories: {
        necessary: {
          label: 'Nezbytn\u00E9',
          description: 'Nezbytn\u00E9 pro fungov\u00E1n\u00ED webu. Nelze deaktivovat.'
        },
        analytics: {
          label: 'Analytick\u00E9',
          description: 'Pom\u00E1haj\u00ED n\u00E1m porozum\u011Bt, jak n\u00E1v\u0161t\u011Bvn\u00EDci pou\u017E\u00EDvaj\u00ED na\u0161e str\u00E1nky.'
        },
        marketing: {
          label: 'Marketingov\u00E9',
          description: 'Slou\u017E\u00ED ke sledov\u00E1n\u00ED n\u00E1v\u0161t\u011Bvn\u00EDk\u016F a zobrazov\u00E1n\u00ED relevantn\u00EDch reklam.'
        },
        preferences: {
          label: 'Preferen\u010Dn\u00ED',
          description: 'Zapamatuj\u00ED si va\u0161e nastaven\u00ED a personalizace.'
        }
      }
    }
  };

  /* ----------------------------------------------------------
     i18n helper — resolve a translation key
     ---------------------------------------------------------- */
  function t(lang, key, fallback) {
    const table = I18N[lang] || I18N.en;
    if (table[key] !== undefined) return table[key];
    if (I18N.en[key] !== undefined) return I18N.en[key];
    return fallback !== undefined ? fallback : key;
  }

  function tCat(lang, catKey, prop) {
    var table = I18N[lang] || I18N.en;
    if (table.categories && table.categories[catKey] && table.categories[catKey][prop] !== undefined) {
      return table.categories[catKey][prop];
    }
    table = I18N.en;
    if (table.categories && table.categories[catKey] && table.categories[catKey][prop] !== undefined) {
      return table.categories[catKey][prop];
    }
    return undefined;
  }

  const DEFAULTS = Object.freeze({
    language: 'en',

    title: '',
    description: '',
    privacyPolicyUrl: '',
    privacyPolicyText: '',

    categories: {
      necessary: {
        locked: true
      },
      analytics: {
        enabled: false
      },
      marketing: {
        enabled: false
      },
      preferences: {
        enabled: false
      }
    },

    acceptAllText: '',
    rejectAllText: '',
    customizeText: '',
    savePreferencesText: '',
    managePreferencesTitle: '',

    position: 'bottom',
    layout: 'bar',
    showAfterMs: 300,
    closeOnOverlayClick: false,
    lockScroll: false,
    animationIn: 'slide',

    consentVersion: '1.0',

    googleConsentMode: false,

    onAccept: function () {},
    onReject: function () {},
    onReady: function () {},
    onChange: function () {},
    onScriptsUnlock: function () {},
    onRevoke: function () {},

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
     Google Consent Mode v2 helpers
     ---------------------------------------------------------- */
  function gtagAvailable() {
    return typeof window.gtag === 'function';
  }

  function pushGCMDefault() {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    if (!gtagAvailable()) {
      window.gtag = gtag;
    }
    window.gtag('consent', 'default', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'analytics_storage': 'denied',
      'functionality_storage': 'denied',
      'personalization_storage': 'denied',
      'security_storage': 'granted'
    });
  }

  function updateGCM(categories) {
    if (!gtagAvailable()) return;
    window.gtag('consent', 'update', {
      'ad_storage': categories.marketing ? 'granted' : 'denied',
      'ad_user_data': categories.marketing ? 'granted' : 'denied',
      'ad_personalization': categories.marketing ? 'granted' : 'denied',
      'analytics_storage': categories.analytics ? 'granted' : 'denied',
      'functionality_storage': categories.preferences ? 'granted' : 'denied',
      'personalization_storage': categories.preferences ? 'granted' : 'denied',
      'security_storage': 'granted'
    });
  }

  function revokeGCM() {
    if (!gtagAvailable()) return;
    window.gtag('consent', 'update', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'analytics_storage': 'denied',
      'functionality_storage': 'denied',
      'personalization_storage': 'denied',
      'security_storage': 'granted'
    });
  }

  /* ----------------------------------------------------------
     Script blocking / unlocking helpers
     ---------------------------------------------------------- */
  function unlockScripts(category) {
    var scripts = document.querySelectorAll('script[type="text/plain"][data-category="' + category + '"]');
    for (var i = 0; i < scripts.length; i++) {
      var old = scripts[i];
      if (old.getAttribute('data-ncb-unlocked') === 'true') continue;
      var ns = document.createElement('script');
      /* Copy attributes except type and data-category */
      for (var j = 0; j < old.attributes.length; j++) {
        var attr = old.attributes[j];
        if (attr.name === 'type' || attr.name === 'data-category') continue;
        ns.setAttribute(attr.name, attr.value);
      }
      ns.setAttribute('data-ncb-unlocked', 'true');
      ns.setAttribute('data-category', category);
      /* If there is inline content, copy it */
      if (!old.src && old.textContent.trim()) {
        ns.textContent = old.textContent;
      }
      old.parentNode.replaceChild(ns, old);
    }
  }

  function relockScripts(category) {
    var scripts = document.querySelectorAll('script[data-ncb-unlocked="true"][data-category="' + category + '"]');
    for (var i = 0; i < scripts.length; i++) {
      scripts[i].remove();
    }
  }

  function unlockAllAccepted(categories) {
    for (var cat in categories) {
      if (categories[cat] === true) {
        unlockScripts(cat);
      }
    }
  }

  /* ----------------------------------------------------------
     Main Banner Class
     ---------------------------------------------------------- */
  function Banner(config) {
    this.config = deepMerge(DEFAULTS, config || {});
    this.lang = this.config.language || 'en';
    this._resolveTexts();
    this.root = null;
    this.prefsPanel = null;
    this.prefsOpen = false;
    this.isVisible = false;
    this.focusTrap = null;
    this.previousFocus = null;
    this.toggleStates = {};

    this._initToggleStates();
  }

  Banner.prototype._resolveTexts = function () {
    var cfg = this.config;
    var lang = this.lang;
    if (!cfg.title) cfg.title = t(lang, 'title');
    if (!cfg.description) cfg.description = t(lang, 'description');
    if (!cfg.privacyPolicyText) cfg.privacyPolicyText = t(lang, 'privacyPolicyText');
    if (!cfg.acceptAllText) cfg.acceptAllText = t(lang, 'acceptAllText');
    if (!cfg.rejectAllText) cfg.rejectAllText = t(lang, 'rejectAllText');
    if (!cfg.customizeText) cfg.customizeText = t(lang, 'customizeText');
    if (!cfg.savePreferencesText) cfg.savePreferencesText = t(lang, 'savePreferencesText');
    if (!cfg.managePreferencesTitle) cfg.managePreferencesTitle = t(lang, 'managePreferencesTitle');

    /* Resolve per-category texts from i18n if not overridden */
    var cats = cfg.categories;
    for (var key in cats) {
      if (!cats[key].label) {
        var lbl = tCat(lang, key, 'label');
        if (lbl) cats[key].label = lbl;
      }
      if (!cats[key].description) {
        var desc = tCat(lang, key, 'description');
        if (desc) cats[key].description = desc;
      }
    }
  };

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

    const title = el('div', { className: 'neiki-cb__prefs-title', textContent: cfg.managePreferencesTitle });
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
  };

  Banner.prototype.hide = function () {
    const self = this;
    if (!this.root) return;

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
    this._saveConsent(categories);
    this.hide();
    if (this.config.googleConsentMode) updateGCM(categories);
    unlockAllAccepted(categories);
    this.config.onAccept(categories);
    this.config.onChange(categories);
    this.config.onScriptsUnlock(categories);
  };

  Banner.prototype._reject = function () {
    const categories = this._buildRejectedCategories();
    this._saveConsent(categories);
    this.hide();
    if (this.config.googleConsentMode) updateGCM(categories);
    this.config.onReject();
    this.config.onChange(categories);
  };

  Banner.prototype._savePrefs = function () {
    const categories = this._buildCategories(false);
    this._saveConsent(categories);
    this.hide();
    if (this.config.googleConsentMode) updateGCM(categories);
    unlockAllAccepted(categories);
    this.config.onAccept(categories);
    this.config.onChange(categories);
    this.config.onScriptsUnlock(categories);
  };

  /* ----------------------------------------------------------
     Public API singleton
     ---------------------------------------------------------- */
  let instance = null;

  const NeikiCookieBanner = {
    /**
     * Initialise the cookie banner.
     * autoAcceptAfterMs is intentionally NOT supported — GDPR requires
     * explicit, freely given consent for analytics/marketing cookies.
     */
    init: function (config) {
      storageAvailable = testStorage();
      if (!storageAvailable) {
        console.warn('[neiki-cookie-banner] localStorage unavailable, falling back to in-memory storage.');
      }

      /* Strip autoAcceptAfterMs — not GDPR compliant */
      if (config && config.autoAcceptAfterMs) {
        console.warn('[neiki-cookie-banner] autoAcceptAfterMs is disabled for GDPR compliance. Consent must be explicit.');
        delete config.autoAcceptAfterMs;
      }

      if (instance) {
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

      /* Google Consent Mode v2: push default denied before any scripts */
      if (instance.config.googleConsentMode) {
        pushGCMDefault();
      }

      const existing = instance._loadConsent();
      if (existing && existing.version === instance.config.consentVersion) {
        /* Re-apply GCM + unlock scripts for already-consented categories */
        if (instance.config.googleConsentMode) updateGCM(existing.categories);
        unlockAllAccepted(existing.categories);
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

    /**
     * Revoke / withdraw consent.
     * Removes stored consent, re-blocks GCM, removes unlocked scripts,
     * fires onRevoke callback, and optionally re-opens the banner.
     */
    revoke: function (reopenBanner) {
      var consent = NeikiCookieBanner.getConsent();
      storageRemove(STORAGE_KEY);

      /* Re-block tracking via GCM */
      if (instance && instance.config.googleConsentMode) {
        revokeGCM();
      }

      /* Remove previously unlocked scripts */
      if (consent && consent.categories) {
        for (var cat in consent.categories) {
          if (consent.categories[cat] === true && cat !== 'necessary') {
            relockScripts(cat);
          }
        }
      }

      if (instance) {
        instance.config.onRevoke(consent);
      }

      if (reopenBanner !== false) {
        NeikiCookieBanner.show();
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
    },

    /**
     * Manually unlock blocked scripts for a specific category.
     */
    unlockScripts: function (category) {
      unlockScripts(category);
    },

    /**
     * Register or replace an i18n translation table.
     */
    addTranslation: function (langCode, table) {
      I18N[langCode] = table;
    },

    /**
     * Get current translations for a language.
     */
    getTranslation: function (langCode) {
      return I18N[langCode] || null;
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
        if (ds.lockScroll !== undefined) cfg.lockScroll = ds.lockScroll === 'true';
        if (ds.closeOnOverlayClick !== undefined) cfg.closeOnOverlayClick = ds.closeOnOverlayClick === 'true';
        if (ds.language) cfg.language = ds.language;
        if (ds.googleConsentMode !== undefined) cfg.googleConsentMode = ds.googleConsentMode === 'true';

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
