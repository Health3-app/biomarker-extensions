# Privacy Policy — Health3 Biomarker Browser Extensions

**Effective date:** 15 May 2026  
**Last updated:** 15 May 2026

These extensions ("Health3 Biomarker Unit Converter" and "Health3 Biomarker Explainer") are operated by **Health3 AG**, a company registered in Switzerland.

> This privacy policy is **specific to the browser extensions**. It does NOT cover the Health3 mobile application — that has its own separate privacy policy at [health3.app/privacy](https://www.health3.app/privacy).

---

## 1. What we collect

**Nothing.**

These extensions do not collect, store, transmit, or process any personal information whatsoever. There are no accounts, no logins, no user profiles, no tracking pixels, no analytics, no telemetry, and no usage metrics of any kind.

Specifically, we do **not** collect:

- Personally identifiable information (name, email, address, etc.)
- Health information or biomarker values you enter into the converter
- Authentication information or credentials
- Financial or payment information
- Personal communications
- Location data
- Web browsing history
- Information about web pages you visit
- The text you select or right-click
- Cookies, device identifiers, or IP addresses
- Crash reports or diagnostic data

---

## 2. How the extensions work

Both extensions are fully self-contained:

- All biomarker reference data is bundled inside the extension as **static JSON files** installed on your device. No data is downloaded or fetched at runtime.
- All unit conversion calculations happen **locally in your browser**.
- **No network requests** are made by either extension.
- No external scripts, libraries, fonts, or images are loaded from third-party servers at runtime, with one exception: the Manrope font is loaded from Google Fonts inside the popup UI. This is governed by [Google's privacy policy](https://policies.google.com/privacy) and we have no control over or visibility into any data Google may receive from those font requests. If you prefer not to load Google Fonts, you may use a content blocker.

---

## 3. Permissions we request

### Health3 Biomarker Unit Converter
**No special permissions requested.**

### Health3 Biomarker Explainer
Three permissions, each with the minimum scope needed:

| Permission | Why |
|---|---|
| `contextMenus` | To add the "Explain with Health3" entry to the right-click menu. |
| `activeTab` | To read the text you have selected on the current tab — **only** at the moment you click the right-click menu item, and **only** on that one tab. We do not read pages you have not interacted with, and we do not retain the selection text after the lookup completes. |
| `scripting` | To inject the inline tooltip showing the biomarker explanation onto the page when you trigger the right-click menu. |

The selected text never leaves your device. The lookup runs entirely against the bundled JSON dictionary inside the extension.

---

## 4. What the extensions do NOT do

- ❌ No data is sent to Health3 servers
- ❌ No data is sent to any third-party server
- ❌ No use of analytics, advertising networks, or marketing pixels
- ❌ No remote configuration, A/B testing, or feature flags
- ❌ No code is downloaded or executed at runtime — all code ships in the extension package and is reviewed by browser store moderators
- ❌ No background/service-worker activity except to register the right-click menu (Biomarker Explainer only)

---

## 5. Open source verification

Both extensions are **open source** and you can verify these claims yourself:

- **Source code:** [github.com/Health3-app/biomarker-extensions](https://github.com/Health3-app/biomarker-extensions)
- **License:** [MIT](LICENSE)

You can review every file the extension installs. There is no minified or obfuscated code.

---

## 6. Children's privacy

These extensions do not knowingly collect any data, including data from children under 13 (or the equivalent minimum age in your jurisdiction). Because we collect nothing from anyone, we have no special children's data handling — there is no data to handle.

---

## 7. Changes to this policy

If we ever change how the extensions work in a way that affects this policy (for example, if we ever add an opt-in feature that involves data collection), we will:

1. Publish a new version of the extension with an updated `PRIVACY.md`
2. Update the "Last updated" date at the top
3. Browser stores will prompt you to review the updated permissions before installing the new version

The history of this file is publicly viewable in the [GitHub commit log](../../commits/main/PRIVACY.md).

---

## 8. Contact

Questions, concerns, or vulnerability reports about this policy or the extensions:

- **Email:** [support@health3.app](mailto:support@health3.app)
- **Issues:** [github.com/Health3-app/biomarker-extensions/issues](https://github.com/Health3-app/biomarker-extensions/issues)
- **Security disclosures:** see [SECURITY.md](SECURITY.md)

---

**Health3 AG**  
Wiesenstrasse 10A  
8952 Schlieren  
Switzerland
