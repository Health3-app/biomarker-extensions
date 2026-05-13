# Contributing

Thanks for your interest in improving these extensions! Issues and pull requests are welcome.

## Quick start

1. **Fork** this repo
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/biomarker-extensions.git`
3. **Branch:** `git checkout -b fix/your-fix` (or `feature/your-feature`)
4. **Set up dev symlinks** (one-time, so the extensions can find shared code):
   ```bash
   ln -sfn "$(pwd)/shared" unit-converter/shared
   ln -sfn "$(pwd)/shared" lab-explainer/shared
   ```
5. **Load the extension** unpacked in your browser (`chrome://extensions/` → Developer mode → Load unpacked → select `unit-converter/` or `lab-explainer/`)
6. **Make changes**, test in the browser
7. **Commit** with a clear message
8. **Push** to your fork
9. **Open a pull request** against `main`

## What we accept

- 🐛 **Bug fixes** with steps to reproduce
- 🌐 **Browser-compatibility improvements** (Firefox quirks, Edge-specific issues, etc.)
- 📊 **Biomarker data corrections** — must cite a clinical source (Tietz, Mosby's, StatPearls, peer-reviewed journal article)
- 🆕 **New biomarkers** — same citation requirement; please open an issue first to discuss
- 🌍 **New translations** for the popup UI strings (currently English only)
- ♿ **Accessibility improvements** (keyboard navigation, ARIA labels, contrast)
- 🧪 **Test additions** for the converter logic

## What we don't accept (without prior discussion)

- 💄 **UI redesigns** without an issue discussing the proposed direction first
- 📡 **Network requests, telemetry, or analytics** — these extensions are intentionally offline
- 🏷️ **Changes to the Health3 brand, logo, or trademarks**
- 🔌 **New runtime dependencies** — vanilla JS only, no build step
- 🔒 **Reduction of privacy guarantees** (adding data collection of any kind)

If you're unsure whether a change fits, **open an issue first** to discuss.

## Code style

- **Vanilla JavaScript** — no build tooling, no transpilation
- **2-space indentation**
- **Single quotes** for strings (matches existing code)
- **Match the surrounding style** — readability over personal preference
- **No comments unless they explain WHY** something non-obvious is done; code should be self-documenting
- **No emoji in code or commit messages** unless requested

## Testing your changes

There are no automated tests yet. To test manually:

1. Load the extension unpacked
2. **Unit Converter:** select various biomarkers, enter values, verify conversions
3. **Biomarker Explainer:** highlight biomarker names on different webpages, right-click → "Explain with Health3", verify tooltip
4. Check the browser's extension dev console for errors

For converter changes specifically, the existing 91-test verification suite is in the project history (commits to `shared/converter.js`). If you add or change conversion logic, please document the math/formula in your PR description.

## Commit messages

- Use the imperative mood: "Fix HbA1c rounding" not "Fixed HbA1c rounding"
- Reference the issue number if applicable: "Fix HbA1c rounding (#42)"
- Keep the first line under 72 characters; add detail in the body if needed

## Pull requests

- Fill out the PR template (it appears automatically when you open a PR)
- Test in at least Chrome before submitting; mention which browsers you tested
- One logical change per PR — don't bundle unrelated fixes
- Keep PRs small when possible (easier to review = faster to merge)

## Getting help

- 💬 General questions: [open a discussion](../../discussions) or ask in your PR
- 🐛 Bug reports: [open an issue](../../issues/new/choose)
- 🔒 Security issues: see [SECURITY.md](SECURITY.md) — please don't open public issues for these

## License

By contributing, you agree that your contributions will be licensed under the MIT License (see [LICENSE](LICENSE)).
