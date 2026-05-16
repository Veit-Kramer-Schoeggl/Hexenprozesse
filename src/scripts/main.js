// Trägt das aktuelle Jahr in den Footer ein.
(() => {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
})();

// Dropdown-Navigation Toggle
(() => {
  document.querySelectorAll(".nav-dropdown-toggle").forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const dropdown = toggle.closest(".nav-dropdown");
      const isOpen = dropdown.classList.contains("open");
      // Schließe alle anderen Dropdowns
      document.querySelectorAll(".nav-dropdown.open").forEach((d) => d.classList.remove("open"));
      // Toggle aktuelles Dropdown
      if (!isOpen) dropdown.classList.add("open");
    });
  });
  // Klick außerhalb schließt Dropdowns
  document.addEventListener("click", () => {
    document.querySelectorAll(".nav-dropdown.open").forEach((d) => d.classList.remove("open"));
  });
})();
