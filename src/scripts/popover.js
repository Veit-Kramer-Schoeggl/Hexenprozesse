// Gemeinsames Overlay-Widget: eine schwebende Karte, die neben ihrem Auslöser
// aufgeht (position: fixed). Positionierung, Ein-/Ausblenden und Schließen
// (Esc, Außenklick, Scrollen/Resize) liegen hier zentral. Der Inhalt ist
// beliebiges HTML — genutzt von der Ortskarte (Bild + Leaflet-Karte) und vom
// Personenregister (Rolle, Fall, Jahr). So sehen und verhalten sich beide
// gleich, und es gibt nur eine Implementierung.

export function erstellePopover({ klasse = "", label = "", beimSchliessen } = {}) {
  const box = document.createElement("div");
  box.className = ("popover " + klasse).trim();
  box.setAttribute("role", "dialog");
  if (label) box.setAttribute("aria-label", label);
  document.body.appendChild(box);

  let ausloeser = null;
  let schliessZeit = null;

  // bevorzugt unterhalb des Auslösers; wenn dort kein Platz ist, oberhalb —
  // und immer innerhalb des Sichtfensters.
  const platziere = (el) => {
    const r = el.getBoundingClientRect();
    const breite = box.offsetWidth;
    const hoehe = box.offsetHeight;
    const rand = 12;
    let oben = r.bottom + 8;
    if (oben + hoehe > window.innerHeight - rand) {
      oben = Math.max(rand, r.top - hoehe - 8);
    }
    let links = r.left + r.width / 2 - breite / 2;
    links = Math.max(rand, Math.min(links, window.innerWidth - breite - rand));
    box.style.top = oben + "px";
    box.style.left = links + "px";
  };

  const zeige = (el) => {
    clearTimeout(schliessZeit);
    ausloeser = el;
    box.classList.add("sichtbar");
    platziere(el);
  };

  const verbergen = (sofort) => {
    clearTimeout(schliessZeit);
    schliessZeit = setTimeout(
      () => {
        box.classList.remove("sichtbar");
        if (beimSchliessen && ausloeser) beimSchliessen(ausloeser);
        ausloeser = null;
      },
      sofort ? 0 : 200,
    );
  };

  const offen = () => box.classList.contains("sichtbar");

  // Zeiger darf ins Popup wandern, ohne dass es zuklappt.
  box.addEventListener("mouseenter", () => clearTimeout(schliessZeit));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") verbergen(true);
  });
  document.addEventListener("click", (e) => {
    if (!offen()) return;
    if (box.contains(e.target) || (ausloeser && ausloeser.contains(e.target))) return;
    verbergen(true);
  });
  window.addEventListener("resize", () => ausloeser && platziere(ausloeser));
  window.addEventListener("scroll", () => ausloeser && platziere(ausloeser), { passive: true });

  return {
    box,
    zeige,
    verbergen,
    platziere,
    offen,
    get ausloeser() {
      return ausloeser;
    },
  };
}
