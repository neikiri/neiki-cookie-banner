# Changelog

All notable changes to **neiki-cookie-banner** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-04-29

Initial public release. **neiki-cookie-banner** is a production-ready, GDPR-friendly
cookie consent banner written in vanilla JavaScript with zero dependencies.

### Added

#### Core engine
- Vanilla ES2017+ implementation, no runtime dependencies.
- Single-file distribution: `neiki-cookie-banner.js` + `neiki-cookie-banner.css`.
- IIFE wrapper exposing a single global: `window.NeikiCookieBanner`.
- Singleton instance management — repeated `init()` calls cleanly dispose of the
  previous banner (no stacking, no orphaned DOM, no leaked timers).

#### Layouts & positioning
- **Bar layout** — full-width banner anchored to the top or bottom of the viewport.
- **Box layout** — compact floating card in the `bottom-right` or `bottom-left` corner.
- **Modal layout** — centered dialog with a darkened backdrop and built-in
  preferences panel that opens by default.
- Configurable `position` per layout (`top`, `bottom`, `bottom-right`,
  `bottom-left`, `center`).
- Configurable `zIndex` for stacking against custom UI.

#### Theming
- **Light** theme (default).
- **Dark** theme.
- **Auto** theme — follows the user's `prefers-color-scheme` media query.
- Theme tokens exposed as CSS custom properties for easy overrides.

#### Consent categories
- Default categories with localized labels and emoji icons:
  `necessary` 🔒, `analytics` 📊, `marketing` 📢, `preferences` ⚙️.
- Fully customizable category set — add, remove, or rename categories at runtime.
- Per-category `locked` flag for non-disableable categories (e.g. necessary cookies).
- Per-category `enabled` default state.
- Per-category `label` and `description` strings.
- Fallback icon (📋) for user-defined categories.

#### User actions
- **Accept All** button — grants consent for every category.
- **Reject All** button — denies all non-locked categories (configurable text;
  pass an empty string to hide the button entirely).
- **Customize** button — opens the inline preferences panel (bar / box layouts).
- **Save Preferences** button — persists the user's per-category toggle choices.
- All button labels are configurable: `acceptAllText`, `rejectAllText`,
  `customizeText`, `savePreferencesText`.

#### Auto-accept countdown
- Optional `autoAcceptAfterMs` setting that auto-grants consent after a delay.
- Live countdown UI with a numeric timer and an animated progress bar.
- Timer is paused/cleared when the user takes any explicit action.

#### Behavior options
- `showAfterMs` — delay before the banner appears on first visit.
- `closeOnOverlayClick` — dismiss the modal by clicking the backdrop (treated
  as a reject).
- `lockScroll` — prevent body scrolling while the banner is visible
  (auto-enabled for modal layout).
- `animationIn` — `slide` (default) or `none` for instant appearance.

#### Persistence
- Consent stored in `localStorage` under the `neiki_cookie_consent` key.
- In-memory fallback when `localStorage` is unavailable (private mode,
  storage quota errors, or `SecurityError`).
- Stored payload includes:
  - `version` — the configured `consentVersion` string.
  - `timestamp` — ISO-8601 timestamp of the decision.
  - `categories` — map of category keys to boolean grants.
- **Consent versioning** — bumping `consentVersion` invalidates stored consent
  and re-prompts the user (e.g. when the cookie policy changes).

#### Lifecycle callbacks
- `onAccept(categories)` — fired when the user accepts (all or selected).
- `onReject()` — fired when the user rejects all non-locked categories.
- `onReady(consent)` — fired when valid stored consent is found on init
  (banner is not shown).
- `onChange(categories)` — fired on every consent change.
- `onScriptsUnlock(categories)` — convenience hook for conditionally loading
  third-party scripts (Google Analytics, Meta Pixel, etc.).

#### Public API
- `NeikiCookieBanner.init(config)` — initialize and (conditionally) show.
- `NeikiCookieBanner.show()` — re-open the banner programmatically.
- `NeikiCookieBanner.hide()` — close the banner programmatically.
- `NeikiCookieBanner.getConsent()` — read the stored consent record.
- `NeikiCookieBanner.reset()` — clear stored consent and re-prompt.
- `NeikiCookieBanner.hasConsented()` — boolean check for any stored decision.
- `NeikiCookieBanner.isAllowed(category)` — boolean check for a specific
  category grant.

#### Declarative integrations
- **`<neiki-cookie-banner>` Web Component** — drop-in custom element. All
  options configurable via `data-*` attributes (`data-layout`, `data-theme`,
  `data-position`, `data-consent-version`, `data-privacy-policy-url`,
  `data-show-after-ms`, `data-auto-accept-after-ms`, `data-lock-scroll`,
  `data-close-on-overlay-click`, etc.).
- **`data-neiki-show-prefs` attribute hook** — any element with this attribute
  reopens the banner on click, perfect for footer "Cookie Settings" links.

#### Accessibility
- `role="dialog"` with `aria-modal` set appropriately for the layout.
- `aria-labelledby` wired to the banner title for screen readers.
- Toggle switches use `role="switch"` with live `aria-checked` state.
- Locked categories expose `aria-disabled="true"`.
- **Focus trap** for modal layout — Tab and Shift+Tab cycle within the dialog.
- Initial focus moved into the banner; focus returned to the previously
  focused element on close.
- Keyboard-navigable buttons and toggles.
- Color contrast meets WCAG AA in both light and dark themes.

#### Security
- All user-supplied strings (title, description, category labels, etc.) are
  HTML-escaped before injection.
- Privacy policy link is rendered with `rel="noopener noreferrer"` and
  `target="_blank"`.
- No `eval`, no inline `<script>` injection, no remote network calls.

#### Styling
- ~700 lines of dependency-free CSS.
- CSS custom properties for the entire color palette, spacing, radius, and
  typography — easy whitelabeling.
- Smooth slide-in and fade animations with reduced-motion support.
- Responsive: bar and box layouts adapt down to mobile widths.
- Toggle switches with animated knob and active/locked states.

#### Demo
- `demo/index.html` — comprehensive interactive playground covering every
  layout, theme, position, custom categories, auto-accept, no-reject mode,
  reset, programmatic re-open, live consent state inspector, and event log.

### Documentation
- `README.md` with installation, configuration reference, API reference, and
  framework integration notes.
- `LICENSE` — MIT.
- `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.

[1.0.0]: https://github.com/neiki/neiki-cookie-banner/releases/tag/v1.0.0
