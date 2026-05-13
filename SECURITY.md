# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in these extensions, please report it privately. **Do not open a public issue** for security vulnerabilities.

### How to report

- **Email:** [support@health3.app](mailto:support@health3.app) (subject: "Security: biomarker-extensions")
- **GitHub:** Use the **"Report a vulnerability"** button under the [Security tab](../../security/advisories/new) of this repository

We commit to acknowledging your report within 48 hours and will keep you informed throughout the resolution process. With your permission, we'll credit you in the release notes for the fix.

## Scope

These extensions are intentionally minimal in attack surface:

- ✅ **Do not collect user data** — no telemetry, analytics, or tracking
- ✅ **Do not make network requests at runtime** — all data is bundled as static JSON
- ✅ **Do not handle authentication or sensitive credentials** — no accounts, no API keys
- ✅ **Run entirely offline**

The realistic security concerns we care about most:

- Cross-site scripting (XSS) via the inline tooltip rendering biomarker descriptions
- Manifest permission scope creep (we keep permissions to the absolute minimum)
- Build script credentials accidentally leaking into packaged extensions
- Supply-chain risks if dependencies are added

## Out of scope

- Issues in the [Health3 mobile app](https://health3.app) — please report those to support@health3.app directly
- Issues in the Chrome Web Store / Microsoft Edge Add-ons / Firefox Add-ons / Opera Add-ons stores themselves

## Disclosure timeline

- **Day 0:** Report received
- **Within 48 hours:** Acknowledgment
- **Within 7 days:** Initial assessment and severity rating
- **Coordinated:** Fix development, testing, release, and credit

We aim to publish patched versions to all four browser stores within 14 days of confirming a vulnerability.

Thank you for helping keep Health3 users safe.
