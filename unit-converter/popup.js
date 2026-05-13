// Health3 Unit Converter — Popup Logic

let biomarkers = [];
let units = [];
let ranges = [];
let selectedBiomarker = null;

const els = {};

document.addEventListener('DOMContentLoaded', async () => {
  ['biomarkerSearch', 'searchResults', 'selectedBiomarker', 'valueInput',
   'unitFrom', 'unitTo', 'swapBtn', 'resultArea', 'resultValue', 'resultUnit',
   'rangesSection', 'rangesList'
  ].forEach(id => els[id] = document.getElementById(id));

  try {
    const base = chrome.runtime.getURL('shared/data/');
    [biomarkers, units, ranges] = await Promise.all([
      fetch(base + 'biomarkers.json').then(r => r.json()),
      fetch(base + 'units.json').then(r => r.json()),
      fetch(base + 'ranges.json').then(r => r.json()),
    ]);
  } catch (e) {
    console.error('Failed to load data:', e);
    return;
  }

  els.biomarkerSearch.addEventListener('input', onSearch);
  els.biomarkerSearch.addEventListener('focus', onSearch);
  els.valueInput.addEventListener('input', convert);
  els.unitFrom.addEventListener('change', convert);
  els.unitTo.addEventListener('change', convert);
  els.swapBtn.addEventListener('click', swapUnits);

  document.addEventListener('click', (e) => {
    if (!els.biomarkerSearch.contains(e.target) && !els.searchResults.contains(e.target)) {
      els.searchResults.classList.add('h3-hidden');
    }
  });
});

function onSearch() {
  const query = els.biomarkerSearch.value.trim().toLowerCase();
  if (query.length < 1) {
    els.searchResults.classList.add('h3-hidden');
    return;
  }

  const matches = biomarkers.filter(b => {
    const names = [b.name, b.en_name, ...(b.aliases || [])];
    return names.some(n => n && n.toLowerCase().includes(query));
  }).slice(0, 8);

  if (matches.length === 0) {
    els.searchResults.classList.add('h3-hidden');
    return;
  }

  els.searchResults.innerHTML = matches.map(b => `
    <div class="search-result-item" data-key="${b.key}">
      <div class="bio-name">${b.name}</div>
      <div class="bio-aliases">${b.en_name}${b.aliases?.length ? ' · ' + b.aliases.slice(0, 2).join(', ') : ''}</div>
    </div>
  `).join('');

  els.searchResults.classList.remove('h3-hidden');

  els.searchResults.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => selectBiomarker(item.dataset.key));
  });
}

function selectBiomarker(key) {
  selectedBiomarker = biomarkers.find(b => b.key === key);
  if (!selectedBiomarker) return;

  els.biomarkerSearch.classList.add('h3-hidden');
  els.searchResults.classList.add('h3-hidden');

  els.selectedBiomarker.innerHTML = `
    <span class="bio-name">${selectedBiomarker.name}</span>
    <button class="clear-btn" title="Clear selection">&times;</button>
  `;
  els.selectedBiomarker.classList.remove('h3-hidden');
  els.selectedBiomarker.querySelector('.clear-btn').addEventListener('click', clearSelection);

  const bioUnits = units.filter(u => u.biomarker_key === key);
  populateUnitSelect(els.unitFrom, bioUnits, 0);
  populateUnitSelect(els.unitTo, bioUnits, bioUnits.length > 1 ? 1 : 0);
  els.unitFrom.disabled = false;
  els.unitTo.disabled = false;

  els.valueInput.focus();
  convert();
}

function clearSelection() {
  selectedBiomarker = null;
  els.biomarkerSearch.value = '';
  els.biomarkerSearch.classList.remove('h3-hidden');
  els.selectedBiomarker.classList.add('h3-hidden');
  els.unitFrom.innerHTML = '<option value="">Select biomarker first</option>';
  els.unitTo.innerHTML = '<option value="">Select biomarker first</option>';
  els.unitFrom.disabled = true;
  els.unitTo.disabled = true;
  els.resultArea.classList.add('h3-hidden');
  els.biomarkerSearch.focus();
}

function populateUnitSelect(select, unitList, defaultIdx) {
  select.innerHTML = unitList.map((u, i) =>
    `<option value="${u.unit_name}" ${i === defaultIdx ? 'selected' : ''}>${u.unit_name}</option>`
  ).join('');
}

function swapUnits() {
  const fromVal = els.unitFrom.value;
  const toVal = els.unitTo.value;
  els.unitFrom.value = toVal;
  els.unitTo.value = fromVal;
  convert();
}

function convert() {
  if (!selectedBiomarker) return;

  const value = parseFloat(els.valueInput.value);
  const unitFrom = els.unitFrom.value;
  const unitTo = els.unitTo.value;

  if (isNaN(value) || !unitFrom || !unitTo) {
    els.resultArea.classList.add('h3-hidden');
    return;
  }

  if (unitFrom === unitTo) {
    showResult(value, unitTo);
    return;
  }

  const result = Health3Converter.convertConcentration({
    unitFrom,
    unitTo,
    value,
    isHbA1c: selectedBiomarker.key === 'hba1c',
    molarMass: selectedBiomarker.molar_mass,
    valence: selectedBiomarker.valence,
    specificActivity: selectedBiomarker.specific_activity,
    biomarkerKey: selectedBiomarker.key,
  });

  if (result) {
    showResult(result.rounded, unitTo);
  } else {
    els.resultValue.textContent = 'Cannot convert';
    els.resultUnit.textContent = `${unitFrom} → ${unitTo} not supported`;
    els.resultArea.classList.remove('h3-hidden');
    els.rangesSection.classList.add('h3-hidden');
  }
}

function showResult(convertedValue, unit) {
  els.resultValue.textContent = formatValue(convertedValue);
  els.resultUnit.textContent = unit;
  els.resultArea.classList.remove('h3-hidden');

  // Show ALL reference ranges for this biomarker + unit, with their criteria
  const matchingRanges = ranges.filter(r =>
    r.biomarker_key === selectedBiomarker.key &&
    r.unit_name === unit
  );

  if (matchingRanges.length > 0) {
    showRanges(matchingRanges);
  } else {
    els.rangesSection.classList.add('h3-hidden');
  }
}

function showRanges(rangeList) {
  els.rangesList.innerHTML = rangeList.map(r => {
    const minStr = r.min_value != null ? formatValue(r.min_value) : '—';
    const maxStr = r.max_value != null ? formatValue(r.max_value) : '—';
    const isOptimal = r.classification_key === 'optimal';
    const type = isOptimal ? 'Optimal' : 'Normal';
    const typeClass = isOptimal ? 'range-type-optimal' : 'range-type-normal';

    // Build criteria tags
    const tags = [];
    const gc = (r.gender_code || '').toUpperCase();
    if (gc === 'M') tags.push('Male');
    else if (gc === 'F') tags.push('Female');
    if (r.age_min != null || r.age_max != null) {
      const ageMin = r.age_min ?? '—';
      const ageMax = r.age_max ?? '+';
      tags.push(`Age ${ageMin}–${ageMax}`);
    }
    if (r.country_code) tags.push(r.country_code);
    if (r.ethnicity) tags.push(r.ethnicity);

    const criteria = tags.length > 0 ? tags.join(' · ') : 'All populations';
    const source = [r.source_label, r.article_year].filter(Boolean).join(', ');

    return `
      <div class="range-row">
        <div class="range-values-row">
          <span class="range-type ${typeClass}">${type}</span>
          <span class="range-bounds">${minStr} – ${maxStr}</span>
        </div>
        <div class="range-criteria">${criteria}${source ? ' · ' + source : ''}</div>
      </div>
    `;
  }).join('');

  els.rangesSection.classList.remove('h3-hidden');
}

function formatValue(v) {
  if (v == null || isNaN(v)) return '—';
  if (Math.abs(v) >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (Math.abs(v) >= 100) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  if (Math.abs(v) >= 1) return v.toFixed(2);
  if (Math.abs(v) >= 0.01) return v.toFixed(3);
  return v.toFixed(4);
}
