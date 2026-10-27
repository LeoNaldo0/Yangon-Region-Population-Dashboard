// charts.js
// Creates and updates Chart.js instances and fills the statistics panel.

let genderBarChart = null;
let comparisonChart = null;

/**
 * Format a number with thousands separators.
 */
function fmt(n) {
  return Number(n).toLocaleString();
}

/**
 * Update the right-hand panel and all charts for the selected township.
 */
function updateTownshipDetails(record) {
  document.getElementById("township-details").classList.remove("hidden");

  document.getElementById("selected-township-name").textContent =
    record.township_name;

  document.getElementById("stat-total").textContent = fmt(record.total_population);
  document.getElementById("stat-male").textContent = fmt(record.male_population);
  document.getElementById("stat-female").textContent = fmt(record.female_population);

  document.getElementById("stat-male-pct").textContent =
    record.male_pct.toFixed(1) + "%";
  document.getElementById("stat-female-pct").textContent =
    record.female_pct.toFixed(1) + "%";

  updateGenderBarChart(record);
  updateComparisonChart(record);
}

/**
 * Chart 1: Male vs Female bar chart.
 */
function updateGenderBarChart(record) {
  const ctx = document.getElementById("genderBarChart").getContext("2d");
  const data = {
    labels: ["Male", "Female"],
    datasets: [{
      label: "Population",
      data: [record.male_population, record.female_population],
      backgroundColor: ["#e63946", "#a4161a"],
      borderColor: ["#ff6b6b", "#ff6b6b"],
      borderWidth: 1
    }]
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.label}: ${fmt(ctx.raw)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: getChartTextColor() },
        grid: { color: getChartGridColor() }
      },
      x: {
        ticks: { color: getChartTextColor() },
        grid: { display: false }
      }
    }
  };

  if (genderBarChart) {
    genderBarChart.data = data;
    genderBarChart.options = options;
    genderBarChart.update();
  } else {
    genderBarChart = new Chart(ctx, { type: "bar", data, options });
  }
}

/**
 * Comparison chart below the map.
 * Shows the top 10 townships by total population, highlighting the selected one.
 */
function updateComparisonChart(record) {
  const comparisonPanel = document.getElementById("township-comparison");
  if (comparisonPanel) comparisonPanel.classList.remove("hidden");
  const ctx = document.getElementById("comparisonChart").getContext("2d");

  // Sort by total population, take top 10
  const sorted = [...townshipsData]
    .filter(t => t.total_population > 0)
    .sort((a, b) => b.total_population - a.total_population)
    .slice(0, 10);

  // Ensure selected township is included
  if (!sorted.some(t => t.township_name === record.township_name)) {
    sorted.pop();
    sorted.push(record);
    sorted.sort((a, b) => b.total_population - a.total_population);
  }

  const labels = sorted.map(t => t.township_name);
  const values = sorted.map(t => t.total_population);
  const colors = sorted.map(t =>
    t.township_name === record.township_name ? "#e63946" : "#6c757d"
  );

  const data = {
    labels,
    datasets: [{
      label: "Total Population",
      data: values,
      backgroundColor: colors,
      borderWidth: 0
    }]
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => fmt(ctx.raw)
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: getChartTextColor() },
        grid: { color: getChartGridColor() }
      },
      y: {
        ticks: { color: getChartTextColor(), font: { size: 10 } },
        grid: { display: false }
      }
    }
  };

  if (comparisonChart) {
    comparisonChart.data = data;
    comparisonChart.options = options;
    comparisonChart.update();
  } else {
    comparisonChart = new Chart(ctx, { type: "bar", data, options });
  }
}

/**
 * Theme helpers for Chart.js.
 */
function getChartTextColor() {
  return document.body.getAttribute("data-theme") === "light"
    ? "#1a1a1a"
    : "#f0f0f0";
}
function getChartGridColor() {
  return document.body.getAttribute("data-theme") === "light"
    ? "#dddddd"
    : "#2a2a2a";
}
/**
 * Update all chart colors when theme changes.
 */
function updateChartTheme() {
  if (genderBarChart) {
    genderBarChart.options.scales.y.ticks.color = getChartTextColor();
    genderBarChart.options.scales.y.grid.color = getChartGridColor();
    genderBarChart.options.scales.x.ticks.color = getChartTextColor();
    genderBarChart.update();
  }
  if (comparisonChart) {
    comparisonChart.options.scales.x.ticks.color = getChartTextColor();
    comparisonChart.options.scales.x.grid.color = getChartGridColor();
    comparisonChart.options.scales.y.ticks.color = getChartTextColor();
    comparisonChart.update();
  }
}