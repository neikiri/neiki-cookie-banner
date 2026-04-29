# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Yes    |

## Reporting a vulnerability

If you discover a security vulnerability in **neiki-cookie-banner**, please
**do not** open a public GitHub issue. Instead, report it privately so it can
be investigated and patched before disclosure.

**Contact:** [dev@neiki.eu](mailto:dev@neiki.eu)

Please include as much detail as possible:

- A clear description of the vulnerability and its potential impact.
- Steps to reproduce or a proof-of-concept (if applicable).
- The version(s) of neiki-cookie-banner affected.
- Any relevant environment details (browser, OS, etc.).

## Response timeline

- **Acknowledgement** — within 48 hours of receiving your report.
- **Initial assessment** — within 5 business days.
- **Patch & release** — timeline depends on severity; critical issues are
  prioritized.

You will be credited in the release notes unless you prefer to remain
anonymous.

## Scope

This project is a client-side JavaScript library. The following are considered
in scope:

- Cross-site scripting (XSS) via unsanitized user input or configuration.
- Data leakage via `localStorage` or injected styles.
- Malicious behavior introduced through the Web Component interface.
- Dependency vulnerabilities (if dependencies are added in the future).

The following are **out of scope**:

- Vulnerabilities in the user's own website or server infrastructure.
- Social engineering or phishing attacks.
- Issues already publicly disclosed before being reported to us.

## Security design notes

- All user-supplied strings (title, description, category labels, URLs) are
  HTML-escaped before being rendered into the DOM.
- The privacy policy link is rendered with `rel="noopener noreferrer"`.
- No `eval()`, `Function()`, or dynamic script injection is used anywhere.
- No network requests are made by the library itself — consent is stored
  locally in `localStorage`.
- The library ships with zero third-party dependencies.
