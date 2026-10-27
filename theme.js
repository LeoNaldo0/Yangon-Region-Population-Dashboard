// theme.js
// Handles light/dark mode toggle, persists preference, and notifies other modules.

(function () {
  const THEME_KEY = "yangon-dashboard-theme";
  const body = document.body;
  const toggleBtn = document.getElementById("theme-toggle");
  const menuBtn = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  /**
   * Apply a theme and update the toggle button icon.
   */
  function applyTheme(theme) {
    body.setAttribute("data-theme", theme);
    if (toggleBtn) {
      // Show the icon of the *next* theme the user can switch to
      toggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
      toggleBtn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
    // Notify map and charts
    if (typeof updateMapTheme === "function") updateMapTheme();
    if (typeof updateChartTheme === "function") updateChartTheme();
  }

  /**
   * Load saved theme or default to dark.
   */
  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    applyTheme(saved === "light" ? "light" : "dark");
  }

  /**
   * Toggle between light and dark.
   */
  function toggleTheme() {
    const current = body.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  // Wire up buttons
  if (toggleBtn) toggleBtn.addEventListener("click", toggleTheme);

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      if (!mobileMenu) return;
      const isOpening = mobileMenu.classList.contains("hidden");
      mobileMenu.classList.toggle("hidden", !isOpening);
      menuBtn.setAttribute("aria-expanded", String(isOpening));
      menuBtn.setAttribute("aria-label", isOpening ? "Close menu" : "Open menu");
    });
  }

  if (mobileMenu && menuBtn) {
    mobileMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Open menu");
      });
    });
  }

  // Initialize
  loadTheme();

  // Re-apply chart colors after data loads (charts may not exist yet)
  document.addEventListener("dataLoaded", () => {
    setTimeout(() => {
      if (typeof updateChartTheme === "function") updateChartTheme();
    }, 300);
  });
})();