// data.js
// Loads the population CSV and the township GeoJSON, matches records,
// and exposes global variables: townshipsData, geojsonData, dataLoadError.

let townshipsData = [];   // array of merged records
let geojsonData = null;   // raw GeoJSON object
let dataLoadError = null; // string if something failed

const DATA_PATHS = {
  csv: "yangon_population.csv",
  geojson: "yangon_townships.geojson"
};

/**
 * Normalize a township name for matching:
 * lowercase, remove spaces, hyphens, underscores and punctuation.
 */
function normalizeName(name) {
  return (name || "")
    .toString()
    .toLowerCase()
    .replace(/[\s\-_.,]/g, "")
    .trim();
}

/**
 * Convert a value to a number, returning 0 for invalid input.
 */
function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Parse CSV text into an array of objects.
 * Handles simple comma separation (no quoted commas in this dataset).
 */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] || "").trim();
    });
    return obj;
  });
}

/**
 * Load both files in parallel, then match CSV rows to GeoJSON features.
 */
async function loadData() {
  try {
    const [csvRes, geoRes] = await Promise.all([
      fetch(DATA_PATHS.csv),
      fetch(DATA_PATHS.geojson)
    ]);

    if (!csvRes.ok) throw new Error("Failed to load CSV: " + csvRes.status);
    if (!geoRes.ok) throw new Error("Failed to load GeoJSON: " + geoRes.status);

    const csvText = await csvRes.text();
    geojsonData = await geoRes.json();

    // Filter GeoJSON to Yangon townships only
    const features = (geojsonData.features || []).filter(f => {
      const p = f.properties || {};
      const region = normalizeName(p.NAME_1 || "");
      const type = (p.TYPE_3 || p.ENGTYPE_3 || "").toLowerCase();
      return region === "yangon" && (type.includes("township") || type.includes("town"));
    });
    geojsonData = { ...geojsonData, features };

    // Build a lookup from normalized township name → feature
    const featureLookup = Object.create(null);
    features.forEach(f => {
      const p = f.properties || {};
      const key = normalizeName(p.NAME_3 || p.township_name || p.name || "");
      if (key) featureLookup[key] = f;
    });

    // Parse CSV rows
    const rows = parseCSV(csvText);

    // Merge
    const mergedRecords = rows.map(row => {
      const name = row.township_name || row.NAME_3 || row.name || "";
      const key = normalizeName(name);
      const feature = featureLookup[key] || null;

      const total = toNumber(row.total_population);
      const male = toNumber(row.male_population);
      const female = toNumber(row.female_population);
      const malePct = total > 0 ? (male / total) * 100 : 0;
      const femalePct = total > 0 ? (female / total) * 100 : 0;

      return {
        township_name: name,
        township_code: row.township_code || (feature?.properties?.ID_3) || "",
        total_population: total,
        male_population: male,
        female_population: female,
        male_pct: malePct,
        female_pct: femalePct,
        census_year: row.census_year || "2014",
        source: row.source || "",
        feature: feature
      };
    });

    const unmatchedRows = mergedRecords.filter(record => !record.feature);
    townshipsData = mergedRecords.filter(record => record.feature);
    if (unmatchedRows.length) {
      console.warn(
        "Excluded township records without a Yangon Region boundary:",
        unmatchedRows.map(record => record.township_name)
      );
    }

    console.log("Loaded Yangon Region townships:", townshipsData.length);
    if (townshipsData.length === 0) {
      dataLoadError = "No township records were loaded. Check CSV and GeoJSON.";
    }
  } catch (err) {
    console.error("Data loading error:", err);
    dataLoadError = err.message || "Unknown data loading error";
    townshipsData = [];
    geojsonData = null;
  }

  // Notify other modules
  document.dispatchEvent(new CustomEvent("dataLoaded"));
}

// Start loading as soon as the script runs
loadData();