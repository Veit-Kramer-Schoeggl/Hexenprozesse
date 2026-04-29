// Trägt das aktuelle Jahr in den Footer ein.
(() => {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
})();
