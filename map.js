// map.js
// Initializes Leaflet, draws the choropleth, handles hover/click,
// builds the legend, and switches metrics.

let map;
let geojsonLayer;
let baseTileLayer;
let selectedFeature = null;
let currentMetric = "total"; // "total", "male", "female"

// Color scale: light red → dark red
const COLOR_SCALE = ["#ffd6d6", "#ff9b9b", "#ff5c5c", "#e63946", "#a4161a"];

function normalizeMapName(name) {
  return (name || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s\-_.,]/g, "");
}

function findTownshipRecordFromFeature(feature) {
  const props = feature && feature.properties ? feature.properties : {};
  const candidates = [
    props.NAME_3,
    props.name,
    props.township_name,
    props.Township
  ];

  const normalized = candidates
    .map(value => normalizeMapName(value))
    .filter(Boolean);

  if (!normalized.length) return null;

  return townshipsData.find(record => {
    if (!record) return false;
    const recordNames = [
      record.township_name,
      record.name,
      record.feature && record.feature.properties && record.feature.properties.NAME_3,
      record.feature && record.feature.properties && record.feature.properties.name,
      record.feature && record.feature.properties && record.feature.properties.township_name
    ];
    return recordNames.some(name => normalized.includes(normalizeMapName(name)));
  }) || null;
}

/**
 * Return a color for a population value based on the current metric.
 */
function getColor(value, max) {
  if (!Number.isFinite(value) || value <= 0 || max <= 0) return COLOR_SCALE[0];
  const idx = Math.min(
    Math.floor((value / max) * COLOR_SCALE.length),
    COLOR_SCALE.length - 1
  );
  return COLOR_SCALE[idx];
}

/**
 * Compute the maximum value for the current metric across all townships.
 */
function getMaxForMetric(metric) {
  return townshipsData.reduce((max, t) => {
    const v = metric === "male" ? t.male_population
            : metric === "female" ? t.female_population
            : t.total_population;
    return Math.max(max, Number(v) || 0);
  }, 0);
}

/**
 * Style function for each GeoJSON feature.
 */
function styleFeature(feature) {
  const record = findTownshipRecordFromFeature(feature);
  const value = record
    ? (currentMetric === "male" ? record.male_population
      : currentMetric === "female" ? record.female_population
      : record.total_population)
    : 0;
  const max = getMaxForMetric(currentMetric);

  return {
    fillColor: getColor(value, max),
    weight: 1,
    opacity: 1,
    color: "#333",
    fillOpacity: 0.85
  };
}

/**
 * Highlight on hover.
 */
function highlightFeature(e) {
  const layer = e.target;
  layer.setStyle({
    weight: 2.5,
    color: "#ffffff",
    fillOpacity: 0.95
  });
  layer.bringToFront();

  const record = findTownshipRecordFromFeature(layer.feature);
  if (record) {
    const tooltipHtml = `
      <strong>${record.township_name}</strong><br>
      Total: ${record.total_population.toLocaleString()}<br>
      Male: ${record.male_population.toLocaleString()} (${record.male_pct.toFixed(1)}%)<br>
      Female: ${record.female_population.toLocaleString()} (${record.female_pct.toFixed(1)}%)
    `;
    layer.bindTooltip(tooltipHtml, { sticky: true }).openTooltip();
  }
}

/**
 * Restore style on mouseout (unless selected).
 */
function resetHighlight(e) {
  const layer = e.target;
  if (selectedFeature === layer.feature) {
    layer.setStyle({
      weight: 3,
      color: "#ff0000",
      fillOpacity: 0.9
    });
  } else {
    geojsonLayer.resetStyle(layer);
  }
  layer.closeTooltip();
}

/**
 * Handle click: select township, update charts.
 */
function onFeatureClick(e) {
  const layer = e.target;
  const record = findTownshipRecordFromFeature(layer.feature);
  if (!record) return;

  // Reset previous selection
  if (selectedFeature) {
    const previousLayer = geojsonLayer.getLayers().find(l => l.feature === selectedFeature);
    if (previousLayer) {
      geojsonLayer.resetStyle(previousLayer);
    }
  }

  selectedFeature = layer.feature;
  layer.setStyle({
    weight: 3,
    color: "#ff0000",
    fillOpacity: 0.9
  });

  if (typeof updateTownshipDetails === "function") {
    updateTownshipDetails(record);
  }
}

/**
 * Build the map legend for the current metric.
 */
function updateLegend() {
  const legendEl = document.getElementById("map-legend");
  if (!legendEl) return;

  const max = getMaxForMetric(currentMetric);
  const steps = COLOR_SCALE.length;
  const metricLabel = currentMetric === "male" ? "Male population"
    : currentMetric === "female" ? "Female population"
    : "Total population";
  let html = `<strong>${metricLabel}</strong>`;

  for (let i = 0; i < steps; i++) {
    const lower = Math.round((max / steps) * i);
    const upper = Math.round((max / steps) * (i + 1));
    html += `
      <span class="legend-item">
        <span class="legend-swatch" style="background:${COLOR_SCALE[i]}"></span>
        ${lower.toLocaleString()} – ${upper.toLocaleString()}
      </span>
    `;
  }
  legendEl.innerHTML = html;
}

/**
 * Initialize the Leaflet map.
 */
function initMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  if (map) {
    map.remove();
    map = null;
    geojsonLayer = null;
    baseTileLayer = null;
  }

  map = L.map("map", { zoomControl: true }).setView([16.8, 96.2], 10);

   addBasemap();

  L.control.scale({ imperial: false }).addTo(map);

  if (!geojsonData || !Array.isArray(geojsonData.features) || geojsonData.features.length === 0) {
    console.error("GeoJSON not loaded");
    mapEl.innerHTML = '<p style="padding:1rem;color:#e63946;">Map data unavailable.</p>';
    return;
  }

  const features = (geojsonData.features || []).filter(feature => {
    const props = feature && feature.properties ? feature.properties : {};
    if (normalizeMapName(props.NAME_1) !== "yangon") return false;
    const featureName = normalizeMapName(props.NAME_3 || props.name || props.township_name || props.Township);
    return featureName && townshipsData.some(record => {
      if (!record || !record.township_name) return false;
      return normalizeMapName(record.township_name) === featureName;
    });
  });

  if (!features.length) {
    console.warn("No GeoJSON features matched township records.");
    mapEl.innerHTML = '<p style="padding:1rem;color:#e63946;">No matching township boundaries found.</p>';
    return;
  }
  document.getElementById("township-count").textContent =
    `${features.length} Yangon Region townships`;

  const filteredGeoJSON = {
    type: "FeatureCollection",
    features
  };

  geojsonLayer = L.geoJSON(filteredGeoJSON, {
    style: styleFeature,
    onEachFeature: (feature, layer) => {
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: onFeatureClick
      });
    }
  }).addTo(map);

  // Keep the remote Cocokyun township in the layer without shrinking the mainland overview.
  const overviewFeatures = features.filter(feature =>
    normalizeMapName(feature.properties && feature.properties.NAME_3) !== "cocokyun"
  );
  const overviewBounds = L.geoJSON({
    type: "FeatureCollection",
    features: overviewFeatures
  }).getBounds();
  if (overviewBounds.isValid()) {
    map.fitBounds(overviewBounds, { padding: [24, 24], maxZoom: 10 });
  }

  updateLegend();

  const metricSelect = document.getElementById("metric-select");
  if (metricSelect) {
    metricSelect.addEventListener("change", e => {
      if (!["total", "male", "female"].includes(e.target.value)) return;
      currentMetric = e.target.value;
      geojsonLayer.setStyle(styleFeature);
      if (selectedFeature) {
        const selectedLayer = geojsonLayer.getLayers().find(layer => layer.feature === selectedFeature);
        if (selectedLayer) {
          selectedLayer.setStyle({
            weight: 3,
            color: "#ff0000",
            fillOpacity: 0.9
          });
        }
      }
      updateLegend();

      const header = document.querySelector(".panel-header h2");
      if (header) {
        const label = currentMetric === "male" ? "Male Population by Township"
                    : currentMetric === "female" ? "Female Population by Township"
                    : "Total Population by Township";
        header.textContent = label;
      }
    });
  }

  setTimeout(() => map.invalidateSize(), 100);
}

function addBasemap() {
  const url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  if (baseTileLayer) {
    baseTileLayer.setUrl(url);
    return;
  }

  baseTileLayer = L.tileLayer(url, {
    attribution,
    subdomains: "abc",
    maxZoom: 19
  }).addTo(map);
}

/**
 * Update map styles when theme changes.
 */
function updateMapTheme() {
  if (!map) return;
  addBasemap();
  if (geojsonLayer) {
    geojsonLayer.setStyle(styleFeature);
  }
  map.invalidateSize();
}

// Wait for data to load before initializing map
document.addEventListener("dataLoaded", () => {
  if (dataLoadError) {
    console.error("Data load error:", dataLoadError);
    const mapEl = document.getElementById("map");
    if (mapEl) {
      mapEl.innerHTML =
        '<p style="padding:1rem;color:#e63946;">Error loading map data. See console.</p>';
    }
    return;
  }
  initMap();
});