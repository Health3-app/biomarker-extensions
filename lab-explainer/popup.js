// Health3 Lab Explainer — Popup Logic

let biomarkers = [];
let units = [];
let ranges = [];

const els = {};

document.addEventListener('DOMContentLoaded', async () => {
  ['searchInput', 'searchResults', 'bioDetail', 'bioName', 'bioEnName', 'bioDesc',
   'rangesSection', 'rangesList', 'unitsSection', 'unitsList',
   'topicsSection', 'topicsList', 'backBtn', 'usageHint'
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

  els.searchInput.addEventListener('input', onSearch);
  els.backBtn.addEventListener('click', showSearch);

  // Show all biomarkers initially
  renderResults(biomarkers.slice(0, 15));
});

function onSearch() {
  const query = els.searchInput.value.trim().toLowerCase();
  if (query.length < 1) {
    renderResults(biomarkers.slice(0, 15));
    return;
  }

  const matches = biomarkers.filter(b => {
    const names = [b.name, b.en_name, ...(b.aliases || [])];
    return names.some(n => n && n.toLowerCase().includes(query));
  });

  renderResults(matches.slice(0, 15));
}

function renderResults(results) {
  if (results.length === 0) {
    els.searchResults.innerHTML = '<div class="h3-empty"><div class="h3-empty-icon">🔍</div>No biomarkers found</div>';
    return;
  }

  els.searchResults.innerHTML = results.map(b => `
    <div class="search-item" data-key="${b.key}">
      <div class="search-item-name">${b.name}</div>
      <div class="search-item-en">${b.en_name || ''}</div>
      <div class="search-item-desc">${b.description || ''}</div>
    </div>
  `).join('');

  els.searchResults.querySelectorAll('.search-item').forEach(item => {
    item.addEventListener('click', () => showDetail(item.dataset.key));
  });
}

function showDetail(key) {
  const bio = biomarkers.find(b => b.key === key);
  if (!bio) return;

  // Hide search, show detail
  els.searchInput.parentElement.classList.add('h3-hidden');
  els.searchResults.classList.add('h3-hidden');
  els.usageHint.classList.add('h3-hidden');
  els.bioDetail.classList.remove('h3-hidden');

  // Populate
  els.bioName.textContent = bio.name;
  els.bioEnName.textContent = bio.en_name !== bio.name ? (bio.en_name || '') : '';

  // Expandable description
  const desc = bio.description || '';
  const LIMIT = 200;
  if (desc.length > LIMIT) {
    const short = desc.slice(0, LIMIT).replace(/\s+\S*$/, '');
    els.bioDesc.innerHTML = `<span class="desc-text">${short}...</span> <button class="desc-toggle">Show more</button>`;
    let expanded = false;
    els.bioDesc.querySelector('.desc-toggle').addEventListener('click', function() {
      expanded = !expanded;
      els.bioDesc.querySelector('.desc-text').textContent = expanded ? desc : short + '...';
      this.textContent = expanded ? 'Show less' : 'Show more';
    });
  } else {
    els.bioDesc.textContent = desc;
  }

  // Ranges — show all with criteria, no user matching
  const bioRanges = ranges.filter(r => r.biomarker_key === key);
  if (bioRanges.length > 0) {
    els.rangesList.innerHTML = bioRanges.map(r => {
      const gc = (r.gender_code || '').toUpperCase();
      const gender = gc === 'M' ? 'Male' : gc === 'F' ? 'Female' : 'All';
      const age = (r.age_min || r.age_max)
        ? `${r.age_min || '—'}–${r.age_max || '—'} yrs`
        : 'All ages';
      const minStr = r.min_value != null ? r.min_value : '—';
      const maxStr = r.max_value != null ? r.max_value : '—';
      const isOptimal = r.classification_key === 'optimal';
      const type = isOptimal ? 'Optimal' : 'Normal';
      const tagClass = isOptimal ? 'range-type-tag-optimal' : 'range-type-tag-normal';
      const source = [r.source_label, r.article_year].filter(Boolean).join(', ');
      const criteria = [gender, age, r.country_code, r.ethnicity].filter(Boolean).join(' · ');
      return `
        <div class="range-item">
          <div>
            <span class="range-type-tag ${tagClass}">${type}</span>
            <span class="range-values">${minStr} – ${maxStr} ${r.unit_name || ''}</span>
          </div>
          <div class="range-meta">${criteria}${source ? ' · ' + source : ''}</div>
        </div>
      `;
    }).join('');
    els.rangesSection.classList.remove('h3-hidden');
  } else {
    els.rangesSection.classList.add('h3-hidden');
  }

  // Units
  const bioUnits = units.filter(u => u.biomarker_key === key);
  if (bioUnits.length > 0) {
    els.unitsList.innerHTML = bioUnits.map(u =>
      `<span class="unit-chip">${u.unit_name}</span>`
    ).join('');
    els.unitsSection.classList.remove('h3-hidden');
  } else {
    els.unitsSection.classList.add('h3-hidden');
  }

  // Topics — handle both string and object formats
  if (bio.topics?.length > 0) {
    els.topicsList.innerHTML = bio.topics.map(t => {
      const name = typeof t === 'object' ? t.name : t;
      return `<span class="topic-chip">${String(name).replace(/_/g, ' ')}</span>`;
    }).join('');
    els.topicsSection.classList.remove('h3-hidden');
  } else {
    els.topicsSection.classList.add('h3-hidden');
  }
}

function showSearch() {
  els.bioDetail.classList.add('h3-hidden');
  els.searchInput.parentElement.classList.remove('h3-hidden');
  els.searchResults.classList.remove('h3-hidden');
  els.usageHint.classList.remove('h3-hidden');
  els.searchInput.focus();
}
