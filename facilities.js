// Loads the dated, region-filtered facility count snapshot.

async function loadFacilityCounts() {
  try {
    const response = await fetch("facility_counts.json");
    if (!response.ok) {
      throw new Error(`Failed to load facility counts: ${response.status}`);
    }

    const snapshot = await response.json();
    const countKeys = [
      "schools",
      "otherEducation",
      "hospitals",
      "clinics",
      "pharmacies",
      "doctorsAndDentists",
      "otherHealth"
    ];

    if (!snapshot.counts || countKeys.some(key =>
      !Number.isSafeInteger(snapshot.counts[key]) || snapshot.counts[key] < 0
    )) {
      throw new Error("Facility count snapshot contains invalid counts.");
    }

    countKeys.forEach(key => {
      const element = document.getElementById(`facility-${key}`);
      if (element) {
        element.textContent = snapshot.counts[key].toLocaleString();
      }
    });

  } catch (error) {
    console.error("Facility data loading error:", error);
  }
}

loadFacilityCounts();
