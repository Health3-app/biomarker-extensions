// Health3 Lab Explainer — Content Script
// Handles context menu "Explain with Health3" and shows inline tooltip

// Guard against double-injection
if (window.__h3LabExplainerLoaded) {
  // Already loaded — just re-register isn't needed, skip
} else {
window.__h3LabExplainerLoaded = true;

let biomarkers = null;
let units = null;
let ranges = null;
let tooltip = null;

async function loadData() {
  if (biomarkers) return;
  try {
    const base = chrome.runtime.getURL('shared/data/');
    [biomarkers, units, ranges] = await Promise.all([
      fetch(base + 'biomarkers.json').then(r => r.json()),
      fetch(base + 'units.json').then(r => r.json()),
      fetch(base + 'ranges.json').then(r => r.json()),
    ]);
  } catch (e) {
    console.error('[Health3] Failed to load data:', e);
  }
}

// Build search index sorted by name length (longest first)
function buildIndex() {
  const index = [];
  for (const b of biomarkers) {
    const names = [b.name, b.en_name, ...(b.aliases || [])].filter(Boolean);
    for (const name of names) {
      index.push({ name: name.toLowerCase(), key: b.key });
    }
  }
  index.sort((a, b) => b.name.length - a.name.length);
  return index;
}

function findBiomarker(text) {
  if (!biomarkers) return null;
  const lower = text.toLowerCase().trim();
  const index = buildIndex();

  for (const entry of index) {
    if (lower.includes(entry.name)) {
      return biomarkers.find(b => b.key === entry.key);
    }
  }
  return null;
}

function extractValue(text) {
  const match = text.match(/([\d,.]+)\s*([a-zA-Z\u00b5\u03bc/%\u00b3\u00b2][a-zA-Z\u00b5\u03bc/%\u00b3\u00b2\d/.\s]*)?$/);
  if (!match) return { value: null, unit: null };
  const value = parseFloat(match[1].replace(',', '.'));
  const unit = match[2] ? match[2].trim() : null;
  return { value: isNaN(value) ? null : value, unit };
}

function getRangesForBiomarker(key) {
  if (!ranges) return [];
  return ranges.filter(r => r.biomarker_key === key)
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
}

function formatRangeCriteria(r) {
  const tags = [];
  const gc = (r.gender_code || '').toUpperCase();
  if (gc === 'M') tags.push('Male');
  else if (gc === 'F') tags.push('Female');
  if (r.age_min != null || r.age_max != null) {
    tags.push(`Age ${r.age_min ?? '—'}–${r.age_max ?? '+'}`);
  }
  if (r.country_code) tags.push(r.country_code);
  if (r.ethnicity) tags.push(r.ethnicity);
  return tags.length > 0 ? tags.join(' · ') : 'All populations';
}

function createTooltip(bio, extractedValue, extractedUnit) {
  removeTooltip();

  tooltip = document.createElement('div');
  tooltip.className = 'h3-tooltip';

  const bioUnits = units ? units.filter(u => u.biomarker_key === bio.key) : [];
  const allRanges = getRangesForBiomarker(bio.key);

  const valueSection = extractedValue != null
    ? `<div class="h3t-value-row">
         <span class="h3t-value">${extractedValue}${extractedUnit ? ' ' + extractedUnit : ''}</span>
       </div>`
    : '';

  // Show all ranges with their criteria — no user matching
  let rangesSection = '';
  if (allRanges.length > 0) {
    const rangeRows = allRanges.map(r => {
      const minStr = r.min_value != null ? r.min_value : '—';
      const maxStr = r.max_value != null ? r.max_value : '—';
      const isOptimal = r.classification_key === 'optimal';
      const type = isOptimal ? 'Optimal' : 'Normal';
      const typeClass = isOptimal ? 'h3t-range-type-optimal' : 'h3t-range-type-normal';
      const source = [r.source_label, r.article_year].filter(Boolean).join(', ');
      return `<div class="h3t-range-row">
        <div class="h3t-range-values"><span class="h3t-range-type ${typeClass}">${type}</span> ${minStr} – ${maxStr} ${r.unit_name || ''}</div>
        <div class="h3t-range-criteria">${formatRangeCriteria(r)}${source ? ' · ' + source : ''}</div>
      </div>`;
    }).join('');
    rangesSection = `<div class="h3t-ranges">
      <div class="h3t-ranges-header">Reference ranges (varies by age, sex, source):</div>
      ${rangeRows}
    </div>`;
  }

  const unitsSection = bioUnits.length > 0
    ? `<div class="h3t-units">Units: ${bioUnits.map(u => u.unit_name).join(', ')}</div>`
    : '';

  const topicsSection = bio.topics?.length
    ? `<div class="h3t-topics">${bio.topics.map(t => {
        const name = typeof t === 'object' ? t.name : t;
        return `<span class="h3t-topic">${String(name).replace(/_/g, ' ')}</span>`;
      }).join('')}</div>`
    : '';

  // Truncate description for tooltip
  const fullDesc = bio.description || '';
  const TLIMIT = 180;
  const shortDesc = fullDesc.length > TLIMIT
    ? fullDesc.slice(0, TLIMIT).replace(/\s+\S*$/, '') + '...'
    : fullDesc;
  const descHtml = fullDesc.length > TLIMIT
    ? `<span class="h3t-desc-text">${shortDesc}</span> <button class="h3t-desc-toggle">Show more</button>`
    : fullDesc;

  tooltip.innerHTML = `
    <div class="h3t-header">
      <div class="h3t-name">${bio.name}</div>
      <button class="h3t-close" title="Close">&times;</button>
    </div>
    ${valueSection}
    <div class="h3t-desc">${descHtml}</div>
    ${rangesSection}
    ${unitsSection}
    ${topicsSection}
    <div class="h3t-footer">
      <a href="https://health3.app?utm_source=chrome_extension&utm_medium=lab_explainer&utm_campaign=tooltip" target="_blank">
        See your personalized ranges in Health3 →
      </a>
    </div>
  `;

  document.body.appendChild(tooltip);

  // Position near selection
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX;

    // Keep on screen
    if (left + tooltipRect.width > window.innerWidth - 16) {
      left = window.innerWidth - tooltipRect.width - 16;
    }
    if (left < 8) left = 8;

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
  }

  // Close button
  tooltip.querySelector('.h3t-close').addEventListener('click', removeTooltip);

  // Expandable description toggle
  const descToggle = tooltip.querySelector('.h3t-desc-toggle');
  if (descToggle) {
    let expanded = false;
    descToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      expanded = !expanded;
      tooltip.querySelector('.h3t-desc-text').textContent = expanded ? fullDesc : shortDesc;
      this.textContent = expanded ? 'Show less' : 'Show more';
    });
  }

  // Close on outside click (delayed to avoid immediate close)
  setTimeout(() => {
    document.addEventListener('click', onOutsideClick);
  }, 100);
}

function onOutsideClick(e) {
  if (tooltip && !tooltip.contains(e.target)) {
    removeTooltip();
  }
}

function removeTooltip() {
  if (tooltip) {
    tooltip.remove();
    tooltip = null;
    document.removeEventListener('click', onOutsideClick);
  }
}

// Listen for context menu message from background script
chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === 'EXPLAIN_SELECTION') {
    await loadData();
    const bio = findBiomarker(msg.text);
    if (bio) {
      const { value, unit } = extractValue(msg.text);
      createTooltip(bio, value, unit);
    } else {
      // No match — show brief "not found" tooltip
      removeTooltip();
      tooltip = document.createElement('div');
      tooltip.className = 'h3-tooltip h3t-not-found';
      tooltip.innerHTML = `
        <div class="h3t-header">
          <div class="h3t-name">Biomarker not found</div>
          <button class="h3t-close">&times;</button>
        </div>
        <div class="h3t-desc">
          "${msg.text.slice(0, 60)}${msg.text.length > 60 ? '...' : ''}" didn't match any biomarker in our database.
        </div>
        <div class="h3t-footer">
          <a href="https://health3.app?utm_source=chrome_extension&utm_medium=lab_explainer" target="_blank">
            Browse all biomarkers → health3.app
          </a>
        </div>
      `;
      document.body.appendChild(tooltip);

      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        tooltip.style.top = (rect.bottom + window.scrollY + 8) + 'px';
        tooltip.style.left = (rect.left + window.scrollX) + 'px';
      }

      tooltip.querySelector('.h3t-close').addEventListener('click', removeTooltip);
      setTimeout(() => document.addEventListener('click', onOutsideClick), 100);
    }
  }
});

} // end of double-injection guard
