# Health3 Biomarker Browser Extensions

Two free, open-source browser extensions that decode biomarker lab values right in your browser. Built and maintained by [Health3](https://health3.app).

| Extension | What it does |
|---|---|
| **Biomarker Unit Converter** | Convert lab values between measurement units instantly (mg/dL ↔ mmol/L, ng/mL ↔ nmol/L, and 933 more) |
| **Biomarker Explainer** | Right-click any biomarker name on any webpage to see what it means, reference ranges from clinical sources, and related health topics |

Both extensions cover **182 biomarkers**, work completely offline, and collect zero user data.

---

## Install

| Browser | Unit Converter | Biomarker Explainer |
|---|---|---|
| Chrome | [Install from Chrome Web Store](https://chromewebstore.google.com/detail/health3-biomarker-unit-co/cdffkfhlbdnnlkfindcalmfcdlnkhjbn) | _Coming soon_ |
| Edge | _Coming soon_ | _Coming soon_ |
| Firefox | [Install from Firefox Add-ons](https://addons.mozilla.org/en-GB/firefox/addon/health3-unit-converter/) | _Coming soon_ |
| Opera | _Coming soon_ | _Coming soon_ |

> Listings are being rolled out across browser stores. In the meantime, you can [load any extension as unpacked](#development--testing) from this repository.

---

## What's inside

### 1. Biomarker Unit Converter

A popup-based converter for biomarker lab values across all common medical measurement units.

**Features:**
- 182 biomarkers (Vitamin D, HbA1c, Iron, Cholesterol, Hormones, Vitamins, Cell counts, and many more)
- 935 supported unit conversions
- Mass ↔ molar (mg/dL ↔ mmol/L) using molecular mass
- Equivalent ↔ molar (mEq/L ↔ mmol/L) using valence
- Enzymatic activity (U/L ↔ µkat/L ↔ nkat/L)
- HbA1c (% ↔ mmol/mol ↔ fraction) with the IFCC formula
- Insulin (µIU/mL ↔ pmol/L) using the WHO standard
- Cell counts (×10⁹/L ↔ cells/µL ↔ G/L ↔ k/µL)
- Clearance rate (mL/min/1.73m² ↔ mL/s/1.73m²)
- Special cases for Urea/BUN, Hematocrit, and percentage concentrations
- Reference ranges from clinical sources (Tietz Textbook of Laboratory Medicine, StatPearls, Mosby's Diagnostic Reference, WHO, ADA, AHA, and peer-reviewed studies)

### 2. Biomarker Explainer

Right-click any biomarker name on any webpage to instantly see what it means, reference ranges, and related health topics. Works on patient portals, health articles, Reddit threads, research papers — anywhere biomarker names appear.

**Features:**
- One-click context menu lookup ("Explain with Health3")
- Plain-language descriptions for all 182 biomarkers
- All available reference ranges, transparently labeled by sex, age, source publication
- Related health topics
- Searchable popup library to browse all biomarkers
- No personalized matching — we show the data, you and your doctor make the interpretation

---

## Privacy

- **Zero data collection** — both extensions run entirely offline
- **No tracking, no analytics, no telemetry**
- **No accounts required**
- All biomarker data is bundled as static JSON — no API calls, no remote scripts
- Permissions are minimal:
  - **Unit Converter:** none
  - **Biomarker Explainer:** `contextMenus`, `activeTab`, `scripting` (only to inject the explanation tooltip when you trigger the right-click menu)

See [PRIVACY.md](PRIVACY.md) for the full extensions-specific privacy policy. (The [Health3 mobile app](https://www.health3.app/privacy) has its own separate policy.)

---

## Repository structure

```
biomarker-extensions/
├── shared/                    # Shared between both extensions
│   ├── data/
│   │   ├── biomarkers.json    # 182 biomarker definitions (name, description, molar mass, topics)
│   │   ├── units.json         # 935 unit definitions per biomarker
│   │   └── ranges.json        # 264 clinical reference ranges
│   ├── converter.js           # Unit conversion engine (faithful port of the Health3 mobile app's Dart logic)
│   ├── biomarker-lookup.js    # Name matching + lookup helpers
│   └── styles/
│       └── health3.css        # Brand styles (Manrope font, Health3 color palette)
├── unit-converter/            # Extension 1
│   ├── manifest.json
│   ├── popup.html / popup.js / popup.css
│   ├── _locales/en/messages.json
│   └── icons/                 # 16, 48, 128 px
├── lab-explainer/             # Extension 2 (a.k.a. Biomarker Explainer)
│   ├── manifest.json
│   ├── background.js          # Context menu registration
│   ├── content.js / content.css   # Inline tooltip injection
│   ├── popup.html / popup.js / popup.css   # Browse & search library
│   ├── _locales/en/messages.json
│   └── icons/
├── scripts/
│   └── build.sh               # Multi-browser packaging (Chrome / Edge / Opera / Firefox)
└── store-assets/              # Screenshots, promo tiles, store listings
```

---

## Development & testing

### Load unpacked

1. Open `chrome://extensions/` (or `edge://extensions/`, `about:addons` for Firefox, `opera://extensions/`)
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `unit-converter/` or `lab-explainer/` folder

> The extensions reference shared files via `shared/` paths. For loading unpacked, create a symlink from each extension folder to the shared folder, or run `./scripts/build.sh` and load the packaged version from `dist/`.

```bash
# Quick symlink setup for development
ln -sfn "$(pwd)/shared" unit-converter/shared
ln -sfn "$(pwd)/shared" lab-explainer/shared
```

### Build packages for distribution

```bash
chmod +x scripts/build.sh
./scripts/build.sh
```

Outputs `.zip` files in `dist/` for Chrome, Edge, Opera, and Firefox. Each is store-ready.

---

## About Health3

[Health3](https://health3.app) is a mobile app that decodes blood work into actionable insights. Upload your lab results, get a personalized health score, track biomarkers over time, see how lifestyle changes correlate with your numbers, and receive evidence-based weekly insights.

These extensions are free standalone tools — they don't require a Health3 account. If you want personalized reference ranges, trend tracking, and lifestyle correlation across multiple lab tests, check out the [Health3 mobile app](https://health3.app).

- 🌐 Website: [health3.app](https://health3.app)
- 📱 iOS: [App Store](https://apps.apple.com/app/health3-app/id6670444240)
- 🤖 Android: [Google Play](https://play.google.com/store/apps/details?id=app.health3.hlt3)
- ✉️ Support: [support@health3.app](mailto:support@health3.app)

Health3 is built by Health3 AG, headquartered in Schlieren, Switzerland.

---

## Contributing

Issues and pull requests are welcome.

### Reporting issues

If a biomarker is missing, a unit conversion is wrong, or a reference range is outdated, [open an issue](../../issues) with:
- Biomarker name
- The specific data that's wrong (current value, expected value)
- Source for the correction (clinical reference, publication)

### Adding biomarkers or fixing data

The biomarker data lives in `shared/data/`. Contributions to this data should cite a clinical source (Tietz, Mosby's, peer-reviewed studies, etc.).

### Code contributions

Pull requests for bug fixes, new features, or browser-compatibility improvements are welcome. The code is intentionally simple — vanilla JavaScript, no build step required for the extensions themselves.

---

## License

MIT — see [LICENSE](LICENSE).

Trademark notice and data source attribution are in [NOTICE](NOTICE).

You're free to fork, modify, and redistribute these extensions. We just ask that you don't impersonate Health3 or use our trademarks (logo, "Health3" name) on derivative works.

---

## Disclaimer

These extensions provide educational information about biomarkers based on published clinical references. They are **not a substitute for professional medical advice**. Always consult a qualified healthcare provider for medical decisions. Reference ranges shown are not personalized to your age, sex, or medical history.
