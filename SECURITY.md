# Security

FORGE is a **client-only, offline-first PWA**. This document is the threat
model and the controls that protect your data.

## Where your data lives

- **On your device only.** All user data (profile, workouts, food log,
  weights, lifts, settings) is stored in the browser's `localStorage`. There
  is **no backend, no account, and no server** that holds your data.
- **Nothing is transmitted to us.** There is no analytics, telemetry, ad SDK,
  or third-party tracker anywhere in the app. We never see your data.
- **You control your backup.** Export/import writes a JSON file you keep; it
  is never uploaded.

## What does leave the device (and why)

Only two outbound calls happen, both for search, and both send **only the
search term you type** — never your profile or logged data:

| Service                                            | What is sent         | Purpose                |
| -------------------------------------------------- | -------------------- | ---------------------- |
| [Open Food Facts](https://world.openfoodfacts.org) | food name or barcode | nutrition lookup       |
| [TheMealDB](https://www.themealdb.com)             | dish name            | "discover real dishes" |

Requests use `Referrer-Policy: strict-origin-when-cross-origin`, so only the
origin (not the full URL) is ever exposed in a referrer. All requests are
HTTPS; `upgrade-insecure-requests` blocks any accidental HTTP.

## Secrets / API keys

There are **none in the codebase**. Open Food Facts needs no key, and
TheMealDB uses its public free developer key (`1`) which is not a secret. CI
verifies no secret-like assignments exist (`src/test/security.test.ts`), and
there are no `.env` files or `process.env` reads in the client.

## Defences against data theft (XSS)

The realistic way client-side data leaks is a cross-site-scripting injection
reading `localStorage`. FORGE closes that off:

- **No dynamic HTML/JS execution.** No `dangerouslySetInnerHTML`, no `eval`,
  no `new Function`, no `innerHTML =`, no `document.write`. React escapes all
  rendered text, and every external API response is validated with Zod before
  it touches the UI. Enforced by a static test.
- **Content Security Policy.** The production build ships a strict CSP
  (injected as a `<meta>` and, where supported, as a real header via
  `public/_headers`):
  - `script-src 'self'` — no inline or remote scripts can run (the build has
    **zero inline scripts**), so injected `<script>` payloads are inert.
  - `connect-src` is limited to the two food APIs — exfiltration to an
    attacker's server is blocked.
  - `frame-src` allows only the YouTube tutorial frame; `object-src 'none'`,
    `base-uri 'self'`, `frame-ancestors 'none'` (anti-clickjacking).
    An e2e test fails the build if any of our own resources trip the CSP.
- **Safe external links.** Every `target="_blank"` link uses `rel="noreferrer"`
  (implies `noopener`) — no referrer leakage, no reverse tab-nabbing.
- **Hardening headers** (via `_headers`): `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`,
  `Permissions-Policy` denying camera/mic/geolocation/payment/usb, and HSTS.

## Honest limitations

- `localStorage` is **not encrypted at rest**. For a backend-less app with no
  login, encryption would only protect against other code on the same origin
  — which the CSP already governs — so it adds defence-in-depth, not real
  secrecy (the key would have to ship in the bundle). If you share a device,
  use a separate OS/browser profile. Account-based encrypted cloud sync is on
  the roadmap (Part H) behind a clean `syncAdapter` interface.
- Anyone with physical access to an unlocked device can read the data, as with
  any local app.

## Reporting

Found something? Open a private security advisory on the repository rather
than a public issue.
