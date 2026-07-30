// Lupe: Auf einer Bildseite lässt sich das Bild per Klick auf maximale
// Größe (Vollbild-Overlay) vergrößern. Progressive Enhancement — ohne
// JavaScript bleibt das Bild in normaler Größe sichtbar.

const knopf = document.querySelector(".bildseite-zoom");

if (knopf) {
  const bild = knopf.querySelector("img");

  const overlay = document.createElement("div");
  overlay.className = "lupe-overlay";
  overlay.hidden = true;
  overlay.innerHTML =
    '<button type="button" class="lupe-schliessen" aria-label="Schließen">×</button><img alt="" />';
  document.body.appendChild(overlay);

  const gross = overlay.querySelector("img");
  const schliessenKnopf = overlay.querySelector(".lupe-schliessen");

  const auf = () => {
    gross.src = bild.getAttribute("src");
    gross.alt = bild.alt;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    schliessenKnopf.focus();
  };
  const zu = () => {
    overlay.hidden = true;
    document.body.style.overflow = "";
  };

  knopf.addEventListener("click", auf);
  schliessenKnopf.addEventListener("click", zu);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target === gross) zu();
  });
  document.addEventListener("keydown", (e) => {
    if (!overlay.hidden && e.key === "Escape") zu();
  });
}
