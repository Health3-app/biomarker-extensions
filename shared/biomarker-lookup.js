/**
 * Health3 Biomarker Lookup Engine
 * Matches biomarker names from text and provides reference data.
 */

let _biomarkers = null;
let _units = null;
let _ranges = null;
let _searchIndex = null;

async function loadData() {
  if (_biomarkers) return;
  const base = chrome.runtime.getURL('shared/data/');
  const [biomarkers, units, ranges] = await Promise.all([
    fetch(base + 'biomarkers.json').then(r => r.json()),
    fetch(base + 'units.json').then(r => r.json()),
    fetch(base + 'ranges.json').then(r => r.json()),
  ]);
  _biomarkers = biomarkers;
  _units = units;
  _ranges = ranges;
  _buildSearchIndex();
}

function _buildSearchIndex() {
  _searchIndex = [];
  for (const b of _biomarkers) {
    const names = [b.name, b.en_name, ...(b.aliases || [])].filter(Boolean);
    for (const name of names) {
      _searchIndex.push({ name: name.toLowerCase(), key: b.key });
    }
  }
  // Sort by name length descending so longer matches are checked first
  _searchIndex.sort((a, b) => b.name.length - a.name.length);
}

/**
 * Search biomarkers by partial name match.
 * @param {string} query
 * @param {number} [limit=10]
 * @returns {Array} matching biomarker objects
 */
function search(query, limit = 10) {
  if (!_biomarkers || !query) return [];
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const seen = new Set();
  const results = [];

  for (const entry of _searchIndex) {
    if (entry.name.includes(q) && !seen.has(entry.key)) {
      seen.add(entry.key);
      const bio = getBiomarker(entry.key);
      if (bio) results.push(bio);
      if (results.length >= limit) break;
    }
  }
  return results;
}

/**
 * Get a biomarker by its key.
 * @param {string} key
 * @returns {Object|null}
 */
function getBiomarker(key) {
  if (!_biomarkers) return null;
  return _biomarkers.find(b => b.key === key) || null;
}

/**
 * Get supported units for a biomarker.
 * @param {string} biomarkerKey
 * @returns {Array}
 */
function getUnits(biomarkerKey) {
  if (!_units) return [];
  return _units.filter(u => u.biomarker_key === biomarkerKey);
}

/**
 * Get reference ranges for a biomarker, optionally filtered by age/gender.
 * @param {string} biomarkerKey
 * @param {Object} [filters] - { age, gender ('m'|'f') }
 * @returns {Array}
 */
function getRanges(biomarkerKey, filters = {}) {
  if (!_ranges) return [];
  let ranges = _ranges.filter(r => r.biomarker_key === biomarkerKey);

  if (filters.age != null) {
    ranges = ranges.filter(r =>
      (r.age_min == null || r.age_min <= filters.age) &&
      (r.age_max == null || r.age_max >= filters.age)
    );
  }
  if (filters.gender) {
    ranges = ranges.filter(r => r.gender_code == null || r.gender_code === filters.gender);
  }

  // Sort: primary first, then by priority descending
  ranges.sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (b.priority || 0) - (a.priority || 0);
  });

  return ranges;
}

/**
 * Classify a value against a reference range.
 * @param {number} value
 * @param {Object} range - { min_value, max_value, classification_key }
 * @returns {string} 'optimal' | 'in_range' | 'low' | 'high' | 'unknown'
 */
function classify(value, range) {
  if (!range || value == null) return 'unknown';
  if (range.min_value != null && value < range.min_value) return 'low';
  if (range.max_value != null && value > range.max_value) return 'high';
  if (range.classification_key) return range.classification_key;
  return 'in_range';
}

/**
 * Try to extract a biomarker name and value from highlighted text.
 * e.g. "Vitamin D 18 ng/mL" → { name: "Vitamin D", value: 18, unit: "ng/mL", biomarker: {...} }
 * @param {string} text
 * @returns {Object|null}
 */
function parseSelection(text) {
  if (!text || !_searchIndex) return null;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Try to match a biomarker name
  let matchedEntry = null;
  for (const entry of _searchIndex) {
    if (lower.includes(entry.name)) {
      matchedEntry = entry;
      break; // Longest match first (sorted by length desc)
    }
  }

  if (!matchedEntry) return null;

  const bio = getBiomarker(matchedEntry.key);
  if (!bio) return null;

  // Try to extract a numeric value and unit from the remaining text
  const valueMatch = trimmed.match(/([\d,.]+)\s*([a-zA-Zμµ/%°³²][a-zA-Zμµ/%°³²\d/.\s]*)?$/);
  let value = null;
  let unit = null;
  if (valueMatch) {
    value = parseFloat(valueMatch[1].replace(',', '.'));
    unit = valueMatch[2] ? valueMatch[2].trim() : null;
    if (isNaN(value)) value = null;
  }

  return { biomarker: bio, value, unit };
}

/**
 * Find all biomarker name occurrences in a text string.
 * @param {string} text
 * @returns {Array<{ name: string, key: string, start: number, end: number }>}
 */
function findInText(text) {
  if (!text || !_searchIndex) return [];
  const lower = text.toLowerCase();
  const matches = [];
  const used = new Set(); // Track positions already matched

  for (const entry of _searchIndex) {
    let pos = 0;
    while ((pos = lower.indexOf(entry.name, pos)) !== -1) {
      // Check no overlap with existing matches
      const end = pos + entry.name.length;
      let overlaps = false;
      for (const m of matches) {
        if (pos < m.end && end > m.start) { overlaps = true; break; }
      }
      if (!overlaps) {
        matches.push({
          name: text.substring(pos, end),
          key: entry.key,
          start: pos,
          end,
        });
      }
      pos = end;
    }
  }

  return matches.sort((a, b) => a.start - b.start);
}

if (typeof module !== 'undefined') module.exports = { loadData, search, getBiomarker, getUnits, getRanges, classify, parseSelection, findInText };
if (typeof window !== 'undefined') window.Health3Lookup = { loadData, search, getBiomarker, getUnits, getRanges, classify, parseSelection, findInText };
