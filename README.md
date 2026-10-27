# Yangon Region Population Dashboard

> An interactive, responsive data-visualization dashboard exploring township-level population distribution and gender demographics across Yangon Region, Myanmar.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white)](#)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](#)

---
Overview

This dashboard visualizes township-level population data from the **2014 Myanmar Population and Housing Census**. It combines an interactive Leaflet choropleth map with Chart.js statistical charts and a curated facility snapshot, giving users a single view of population and service distribution across Yangon Region.

The project is built with **vanilla HTML, CSS, and JavaScript** — no frameworks, no build step, no paid APIs.

---

Features

Interactive Choropleth Map
- Township boundaries rendered from GeoJSON (Yangon Region only)
- Sequential teal color scale driven by the selected metric
- **Switch map metric** between Total, Male, and Female population
- Hover tooltips with township name and population breakdown
- Click a township to highlight it and load its profile
- Zoom, scale bar, and automatic `fitBounds` for the region
- Remote islands (e.g. Cocokyun) excluded from the initial view without removing them from the layer

Township Statistics Panel
- Selected township name, total population, male, female
- Male / female percentage badges
- Dynamic **gender bar chart** (male vs female population)

Township Comparison Chart
- Horizontal bar chart of the top 10 townships by total population
- Selected township highlighted for context

Facility Counts Snapshot
- Mapped schools, hospitals, clinics, pharmacies, doctors & dentists, and other education/health services
- Loaded from a region-filtered facility-count JSON snapshot
- Gracefully shows "Unavailable" when the snapshot fails to load

Theme & UX
- Light / Dark mode toggle persisted in `localStorage`
- Dark basemap with a CSS-inverted tile trick for OSM in dark mode
- Fully **responsive** layout: two-column desktop → stacked tablet → single-column mobile
- Accessible: skip link, ARIA labels, keyboard-focus outlines, `prefers-reduced-motion` support

---

## 🧱 Project Structure
