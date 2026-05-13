/**
 * Health3 Biomarker Unit Converter
 * Faithful port from Flutter/Dart: lib/flutter_flow/biomarker_unit_converter.dart
 *
 * Supports: mass, molar, equivalent, enzymatic, biological, cell_count,
 * volume_size, rate, osmolality, unitless, time, turbidity, clearance,
 * hba1c, urea_special_scheme, percentage_concentration.
 */

// ── Prefix tables (exact match with Dart) ──────────────────────────

const MASS = { kg:1e3, g:1, mg:1e-3, ug:1e-6, ng:1e-9, pg:1e-12, fg:1e-15 };
const MOLAR = { mol:1, mmol:1e-3, umol:1e-6, nmol:1e-9, pmol:1e-12, fmol:1e-15, um:1e-6, nm:1e-9, pm:1e-12 };
const EQUIVALENT = { eq:1, meq:1e-3 };
const ENZYMATIC = { u:1, mu:1e-3, nu:1e-6, pu:1e-9, uu:1e-6, ku:1e3, iu:1, miu:1e-3, uiu:1e-6, kiu:1e3, ukat:60, mkat:60e3, nkat:0.06, pkat:0.00006, kat:60e6 };
const BIOLOGICAL = { iu:1, miu:1e-3, uiu:1e-6 };
const CELL_COUNT = { '×10^12':1e12,'×10^9':1e9,'×10^6':1e6,'×10^3':1e3, 'x10^12':1e12,'x10^9':1e9,'x10^6':1e6,'x10^3':1e3, k:1e3, cells:1, tpt:1e12, gpt:1e9, mpt:1e6, kpt:1e3 };
const VOLUME_SIZE = { fl:1, pl:1e3, nl:1e6, ul:1e9, um3:1, 'cu um':1, 'cu μm':1 };
const RATE = { mm:1, cm:10, m:1e3 };
const UNITLESS = { ratio:1, index:1, '%':0.01, percent:0.01, unitless:1, inr:1, fraction:1 };
const TURBIDITY = { mau:1, au:1e3, uau:1e-3, nau:1e-6 };
const OSMOLALITY = { mosm:1, osm:1e3 };
const PCT_CONC = { 'g%':1, 'mg%':1e-3, 'ug%':1e-6, 'ng%':1e-9, 'pg%':1e-12 };

const VOLUME = { l:1, dl:0.1, ml:1e-3, ul:1e-6, mm3:1e-6, '100ml':0.1, kg:1, g:1e-3, cell:1 };
const TIME = { min:1, s:1/60, h:60, hr:60 };

// ── Normalization ──────────────────────────────────────────────────

function normalize(unit) {
  if (!unit) return '';
  let s = unit.trim();
  // Normalize µ/μ → u
  s = s.replace(/[μµ]/g, 'u');
  // Normalize superscripts only in ×10/x10 context (match Dart behavior)
  const sups = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'};
  s = s.replace(/([×x])10([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, prefix, sup) => {
    const digits = [...sup].map(c => sups[c] || '').join('');
    return prefix + '10^' + digits;
  });
  // Normalize standalone ³→3 and ²→2 (NOT as ^)
  s = s.replace(/³/g, '3').replace(/²/g, '2');
  return s;
}

// ── Clearance converter (matches Dart _convertClearanceUnits) ─────

function parseClearance(unit) {
  let n = unit.toLowerCase().trim();
  // Normalize spacing: 1.73m2 → 1.73 m2
  n = n.replace(/(\d\.?\d*)(m)([\d2])/g, '$1 $2$3');
  const volF = { ml:1, l:1000, dl:100 };
  const timeF = { min:1, s:1/60 };
  const saF = { '1.73 m2':1, '1.73 m²':1, 'm2':1.73, 'm²':1.73 };
  const parts = n.split('/');
  if (parts.length < 3) return null;
  const vf = volF[parts[0].trim()];
  const tf = timeF[parts[1].trim()];
  const saPart = parts.slice(2).join('/').trim();
  const sf = saF[saPart];
  if (vf == null || tf == null || sf == null) return null;
  return { vf, tf, sf };
}

function isClearanceUnit(u) { return parseClearance(u) != null; }

function convertClearance(from, to, value) {
  const f = parseClearance(from), t = parseClearance(to);
  if (!f || !t) return null;
  let r = value * (f.vf / t.vf) * (t.tf / f.tf) * (f.sf / t.sf);
  return isFinite(r) ? r : null;
}

// ── Urea special scheme (matches Dart) ───────────────────────────

function isUreaSpecial(u) { const l = u.toLowerCase(); return l.includes('(urea)') || l.includes('(bun)'); }

function convertUreaSpecial(from, to, value) {
  const f = from.toLowerCase(), t = to.toLowerCase();
  if (f.includes('(urea)') && t.includes('(bun)') && f.includes('mmol/l') && t.includes('mg/dl'))
    return value * 2.8;
  if (f.includes('(bun)') && t.includes('(urea)') && f.includes('mg/dl') && t.includes('mmol/l'))
    return value * 0.357;
  return null;
}

// ── Insulin converter (matches Dart broad detection) ─────────────

function convertInsulin(from, to, value) {
  const f = from.toLowerCase(), t = to.toLowerCase();
  if ((f.includes('iu') || f.includes('u/')) && t === 'pmol/l') return value * 6.0;
  if (f === 'pmol/l' && (t.includes('iu') || t.includes('u/'))) return value / 6.0;
  return null;
}

// ── Medical rounding (exact match with Dart) ─────────────────────

function round(value, schema, unitTo) {
  if (!isFinite(value)) return value;
  if (value === 0) return 0;
  const abs = Math.abs(value);
  const fix = (v, d) => parseFloat(v.toFixed(d));
  const uTo = (unitTo || '').toLowerCase();

  switch (schema) {
    case 'cell_count':
      if (abs < 0.01) return fix(value, 4);
      if (abs < 0.1)  return fix(value, 3);
      if (abs < 1)    return fix(value, 2);
      if (abs < 10)   return fix(value, 1);
      return fix(value, 0);

    case 'unitless':
      if (uTo.includes('%') || uTo.includes('percent')) return fix(value, 1);
      if (uTo.includes('fraction')) return fix(value, 3);
      return fix(value, 2); // ratios, indices

    case 'rate':       return fix(value, 0);
    case 'volume_size': return fix(value, 1);

    case 'clearance':
      if (abs < 10 && uTo.includes('/s/')) return fix(value, 1);
      return fix(value, 0);

    case 'osmolality':  return fix(value, 0);
    case 'turbidity':   return fix(value, 2);
    case 'urea_special_scheme': return fix(value, 1);

    case 'hba1c':
      if (uTo === '%') return fix(value, 1);
      if (uTo === 'mmol/mol' || uTo === 'mmol/l') return fix(value, 0);
      if (uTo === 'fraction') return fix(value, 3);
      return fix(value, 1);
  }

  // General value-based rounding (mass, molar, equivalent, enzymatic, biological, percentage_concentration)
  if (abs < 0.001) return fix(value, 4);
  if (abs < 0.01)  return fix(value, 3);
  if (abs < 0.1)   return fix(value, 3);
  if (abs < 1)     return fix(value, 2);
  if (abs < 10)    return fix(value, 2);
  if (abs < 100)   return fix(value, 1);
  if (abs < 1000) {
    if (schema === 'enzymatic' || schema === 'biological') return fix(value, 0);
    return fix(value, 1);
  }
  return fix(value, 0);
}

// ── parseUnit (faithful port of Dart parseUnit) ──────────────────

function parseUnit(unitString, isHbA1c) {
  if (!unitString) return null;

  // Strip urea/BUN suffixes before parsing
  let hasUreaSuffix = isUreaSpecial(unitString);
  if (hasUreaSuffix) {
    unitString = unitString.replace(/\(urea\)|\(Urea\)|\(BUN\)|\(bun\)/g, '').trim();
    if (!unitString) return null;
  }

  // Normalize (µ→u, superscripts in ×10 context, ³→3, ²→2)
  let norm = normalize(unitString);

  // Check uppercase cell count prefixes BEFORE lowercasing
  const upperCC = norm.match(/^([TGMK])\/(L|dL|mL|uL|mm3)$/);
  if (upperCC) {
    const ccFactors = { T:1e12, G:1e9, M:1e6, K:1e3 };
    const volFactors = { L:1, dL:0.1, mL:0.001, uL:0.000001, mm3:0.000001 };
    return { schema:'cell_count', concentrationFactor: ccFactors[upperCC[1]], volumeFactor: volFactors[upperCC[2]] || 1, timeFactor:1 };
  }

  // Lowercase for general parsing
  let u = norm.toLowerCase();

  // Expand parenthesized multiplication: umol/(h*l) → umol/h/l
  u = u.replace(/\/\(([^)]+)\*([^)]+)\)/g, '/$1/$2');
  u = u.replace(/\/\(([^)]+)[·•]([^)]+)\)/g, '/$1/$2');

  // HbA1c shortcut
  if (isHbA1c && ['%','mmol/mol','mmol/l','fraction'].includes(u)) {
    return { schema:'hba1c', unit: u };
  }

  // L/L (hematocrit)
  if (u === 'l/l') return { schema:'unitless', concentrationFactor:1, volumeFactor:1, timeFactor:1 };

  // Split by /
  const parts = u.split('/');
  const conc = parts[0].trim();
  const vol = parts.length > 1 ? parts[1].trim() : '';
  const time = parts.length > 2 ? parts[2].trim() : '';

  // Check for clearance (3+ parts with surface area)
  if (parts.length > 2) {
    const saPart = parts.slice(2).join('/').trim();
    const saUnits = ['1.73 m2','1.73 m²','m2','m²'];
    // Normalize spacing in saPart for matching
    const saCheck = saPart.replace(/(\d\.?\d*)(m)([\d2])/g, '$1 $2$3');
    if (saUnits.some(su => saCheck === su || saPart === su)) {
      return { schema:'clearance', unit: u };
    }
  }

  // Osmolality: mmol/kg or mol/kg
  if ((conc === 'mmol' || conc === 'mol') && vol === 'kg') {
    return { schema:'osmolality', concentrationFactor: conc === 'mmol' ? 1 : 1000, volumeFactor:1, timeFactor:1 };
  }

  // Numeric cell count: 1000/mm3, 500/ul, etc.
  if (parts.length === 2 && vol) {
    const num = parseFloat(conc);
    if (!isNaN(num) && VOLUME[vol] != null) {
      return { schema:'cell_count', concentrationFactor: num / VOLUME[vol], volumeFactor:1, timeFactor:1 };
    }
  }

  // Three-part enzymatic: nmol/min/L, umol/s/mL, etc.
  if (parts.length === 3) {
    const denomA = parts[1].trim(), denomB = parts[2].trim();
    const aTime = TIME[denomA] != null, aVol = VOLUME[denomA] != null;
    const bTime = TIME[denomB] != null, bVol = VOLUME[denomB] != null;
    if ((conc === 'nmol' || conc === 'umol') && ((aTime && bVol) || (aVol && bTime))) {
      const cf = conc === 'umol' ? 1.0 : 0.001;
      const timeDenom = aTime ? denomA : denomB;
      const volDenom = aVol ? denomA : denomB;
      return { schema:'enzymatic', concentrationFactor: cf, volumeFactor: VOLUME[volDenom], timeFactor: TIME[timeDenom] };
    }
  }

  // Prefix matching (sorted longest-first, exact match with Dart priority order)
  const prefixMaps = [
    [CELL_COUNT, 'cell_count'], [VOLUME_SIZE, 'volume_size'], [RATE, 'rate'],
    [OSMOLALITY, 'osmolality'], [UNITLESS, 'unitless'], [TURBIDITY, 'turbidity'],
    [PCT_CONC, 'percentage_concentration'],
    [ENZYMATIC, 'enzymatic'], [BIOLOGICAL, 'biological'],
    [MASS, 'mass'], [MOLAR, 'molar'], [EQUIVALENT, 'equivalent'],
  ];
  const allPrefixes = [];
  for (const [map, schema] of prefixMaps)
    for (const key of Object.keys(map))
      allPrefixes.push({ key, schema, factor: map[key] });
  allPrefixes.sort((a, b) => b.key.length - a.key.length);

  let schema = null, concentrationFactor = null;
  for (const p of allPrefixes) {
    if (conc === p.key || conc.startsWith(p.key)) {
      schema = p.schema;
      concentrationFactor = p.factor;
      break;
    }
  }

  // Fallback: HbA1c check
  if (!schema && isHbA1c && ['%','mmol/mol','mmol/l','fraction'].includes(conc)) {
    return { schema:'hba1c', unit: u };
  }

  // Standalone time unit (s, min, h)
  if (!schema && !vol && !time && TIME[conc] != null) {
    return { schema:'time', concentrationFactor:1, volumeFactor:1, timeFactor: TIME[conc] };
  }

  if (!schema) return null;

  // Parse volume factor
  let volumeFactor = 1;
  if (vol) {
    if (VOLUME[vol] != null) {
      volumeFactor = VOLUME[vol];
    } else if (schema === 'rate' && TIME[vol] != null) {
      // Rate uses time in denominator (mm/h, mm/hr)
      return { schema, concentrationFactor: concentrationFactor || 1, volumeFactor: 1, timeFactor: TIME[vol] };
    } else {
      return null; // Unknown volume unit
    }
  }

  // Parse time factor
  let timeFactor = 1;
  if (time) {
    if (TIME[time] != null) timeFactor = TIME[time];
    else return null;
  }

  return { schema, concentrationFactor: concentrationFactor || 1, volumeFactor, timeFactor };
}

// ── Main conversion function ─────────────────────────────────────

/**
 * @param {Object} opts
 * @param {string} opts.unitFrom
 * @param {string} opts.unitTo
 * @param {number} opts.value
 * @param {boolean} [opts.isHbA1c]
 * @param {number} [opts.molarMass] - g/mol
 * @param {number} [opts.valence]
 * @param {number} [opts.specificActivity]
 * @param {string} [opts.specificActivityUnit]
 * @param {string} [opts.biomarkerKey]
 * @returns {{ value: number, rounded: number } | null}
 */
function convertConcentration(opts) {
  let { unitFrom, unitTo, value, isHbA1c, molarMass, valence, specificActivity, specificActivityUnit, biomarkerKey } = opts;
  if (value == null || unitFrom == null || unitTo == null) return null;
  if (!isFinite(value)) return null;

  // Identical units shortcut
  const nf = normalize(unitFrom).toLowerCase(), nt = normalize(unitTo).toLowerCase();
  if (nf === nt) return { value, rounded: value };

  // ── Clearance ──
  if (isClearanceUnit(unitFrom) && isClearanceUnit(unitTo)) {
    const r = convertClearance(unitFrom, unitTo, value);
    if (r == null) return { value, rounded: value };
    return { value: r, rounded: round(r, 'clearance', unitTo) };
  }

  // ── Urea special scheme ──
  if (isUreaSpecial(unitFrom) && isUreaSpecial(unitTo)) {
    const r = convertUreaSpecial(unitFrom, unitTo, value);
    if (r == null) return { value, rounded: value };
    const sch = unitTo.toLowerCase().includes('(urea)') ? 'molar' : 'mass';
    return { value: r, rounded: round(r, sch, unitTo) };
  }

  // ── Insulin IU ↔ pmol/L ──
  const ir = convertInsulin(unitFrom, unitTo, value);
  if (ir != null) {
    const sch = unitTo.toLowerCase() === 'pmol/l' ? 'molar' : 'biological';
    return { value: ir, rounded: round(ir, sch, unitTo) };
  }

  // ── Parse units ──
  const fromInfo = parseUnit(unitFrom, isHbA1c);
  const toInfo = parseUnit(unitTo, isHbA1c);
  if (!fromInfo || !toInfo) return { value, rounded: value }; // fallback: return original

  let schemaFrom = fromInfo.schema;
  let schemaTo = toInfo.schema;
  const factorFrom = fromInfo.concentrationFactor || 1;
  const factorTo = toInfo.concentrationFactor || 1;
  const volFrom = fromInfo.volumeFactor || 1;
  const volTo = toInfo.volumeFactor || 1;
  const timeFrom = fromInfo.timeFactor || 1;
  const timeTo = toInfo.timeFactor || 1;

  // Override enzymatic → biological when specificActivity is provided
  if (specificActivity != null && specificActivityUnit != null) {
    if (schemaFrom === 'enzymatic') schemaFrom = 'biological';
    if (schemaTo === 'enzymatic') schemaTo = 'biological';
  }

  // ── Hematocrit L/L ↔ % ──
  const ufl = unitFrom.toLowerCase(), utl = unitTo.toLowerCase();
  if ((ufl === 'l/l' && unitTo === '%') || (unitFrom === '%' && utl === 'l/l')) {
    const r = ufl === 'l/l' ? value * 100 : value / 100;
    return isFinite(r) ? { value: r, rounded: r } : { value, rounded: value };
  }

  // ── Fraction ↔ % ──
  if ((ufl === 'fraction' && unitTo === '%') || (unitFrom === '%' && utl === 'fraction')) {
    const r = ufl === 'fraction' ? value * 100 : value / 100;
    return isFinite(r) ? { value: r, rounded: round(r, 'unitless', unitTo) } : { value, rounded: value };
  }

  // ── Index/Ratio ↔ % ──
  if (((ufl === 'index' || ufl === 'ratio') && unitTo === '%') ||
      (unitFrom === '%' && (utl === 'index' || utl === 'ratio'))) {
    const r = unitFrom === '%' ? value / 100 : value * 100;
    return isFinite(r) ? { value: r, rounded: round(r, 'unitless', unitTo) } : { value, rounded: value };
  }

  // ── HbA1c ──
  if (schemaFrom === 'hba1c' && schemaTo === 'hba1c') {
    const fl = (fromInfo.unit || unitFrom).toLowerCase();
    const tl = (toInfo.unit || unitTo).toLowerCase();
    let r;
    if (fl === '%' && tl === 'mmol/mol') r = (value - 2.15) * 10.929;
    else if (fl === 'mmol/mol' && tl === '%') r = (value / 10.929) + 2.15;
    else if (fl === '%' && tl === 'fraction') r = value / 100;
    else if (fl === 'fraction' && tl === '%') r = value * 100;
    else if (fl === 'mmol/mol' && tl === 'fraction') { const p = (value / 10.929) + 2.15; r = p / 100; }
    else if (fl === 'fraction' && tl === 'mmol/mol') { const p = value * 100; r = (p - 2.15) * 10.929; }
    // mmol/l as alias for mmol/mol
    else if (fl === 'mmol/l' && tl === '%') r = (value / 10.929) + 2.15;
    else if (fl === '%' && tl === 'mmol/l') r = (value - 2.15) * 10.929;
    else if (fl === tl) return { value, rounded: value };
    else return { value, rounded: value };
    return (r != null && isFinite(r)) ? { value: r, rounded: round(r, 'hba1c', unitTo) } : { value, rounded: value };
  }

  // ── Same-schema conversion ──
  if (schemaFrom === schemaTo) {
    const denomFrom = volFrom * timeFrom;
    const denomTo = volTo * timeTo;
    if (denomFrom === 0 || denomTo === 0) return { value, rounded: value };
    const baseFrom = value * (factorFrom / denomFrom);
    const convTo = factorTo / denomTo;
    if (!isFinite(baseFrom) || convTo === 0 || !isFinite(convTo)) return { value, rounded: value };
    const r = baseFrom / convTo;
    if (!isFinite(r)) return { value, rounded: value };
    const rd = round(r, schemaTo, unitTo);
    return { value: r, rounded: rd === 0 ? 0 : rd };
  }

  // ── Cross-schema conversion ──
  const valueBase = value * (factorFrom / (volFrom * timeFrom));
  if (!isFinite(valueBase)) return { value, rounded: value };

  // Convert source to mass concentration (g/L base)
  let massConc = 0;
  if (schemaFrom === 'mass') {
    massConc = valueBase;
  } else if (schemaFrom === 'percentage_concentration') {
    massConc = valueBase * 10; // g/100mL * 10 = g/L
  } else if (schemaFrom === 'molar') {
    if (!molarMass) return { value, rounded: value };
    massConc = valueBase * molarMass;
  } else if (schemaFrom === 'equivalent') {
    if (!valence || !molarMass) return { value, rounded: value };
    massConc = (valueBase / valence) * molarMass;
  } else if (schemaFrom === 'enzymatic') {
    if (!molarMass) return { value, rounded: value };
    massConc = valueBase * 1e-6 * molarMass;
  } else if (schemaFrom === 'biological') {
    if (!specificActivity || !specificActivityUnit) return { value, rounded: value };
    let saG = specificActivity;
    const saLower = specificActivityUnit.toLowerCase().replace(/[μµ]/g, 'u');
    if (saLower.includes('mg')) saG = specificActivity / 1000;
    else if (saLower.includes('ug')) saG = specificActivity / 1000000;
    massConc = valueBase * saG;
  } else {
    // cell_count, volume_size, rate, osmolality, unitless, time, turbidity — cannot cross-schema
    return { value, rounded: value };
  }

  // Convert mass concentration to target schema
  let targetBase;
  if (schemaTo === 'mass') {
    targetBase = massConc;
  } else if (schemaTo === 'percentage_concentration') {
    targetBase = massConc / 10;
  } else if (schemaTo === 'molar') {
    if (!molarMass) return { value, rounded: value };
    targetBase = massConc / molarMass;
  } else if (schemaTo === 'equivalent') {
    if (!molarMass || !valence) return { value, rounded: value };
    targetBase = (massConc / molarMass) * valence;
  } else if (schemaTo === 'enzymatic') {
    if (!molarMass) return { value, rounded: value };
    targetBase = massConc / (1e-6 * molarMass);
  } else if (schemaTo === 'biological') {
    if (!specificActivity || !specificActivityUnit) return { value, rounded: value };
    let saG = specificActivity;
    const saLower = specificActivityUnit.toLowerCase().replace(/[μµ]/g, 'u');
    if (saLower.includes('mg')) saG = specificActivity / 1000;
    else if (saLower.includes('ug')) saG = specificActivity / 1000000;
    targetBase = massConc / saG;
  } else {
    return { value, rounded: value };
  }

  if (targetBase == null || !isFinite(targetBase)) return { value, rounded: value };

  const convTo = factorTo / (volTo * timeTo);
  if (convTo === 0 || !isFinite(convTo)) return { value, rounded: value };
  const result = targetBase / convTo;
  if (!isFinite(result)) return { value, rounded: value };
  const rd = round(result, schemaTo, unitTo);
  return { value: result, rounded: rd === 0 ? 0 : rd };
}

// ── Exports ──────────────────────────────────────────────────────

if (typeof module !== 'undefined') module.exports = { convertConcentration, parseUnit, normalize };
if (typeof window !== 'undefined') window.Health3Converter = { convertConcentration, parseUnit, normalize };
