// Bildergalerie: Ein Klick auf ein Vorschaubild öffnet das Großbild in einer
// Überblendung (Lightbox) mit Bildunterschrift und Pfeilen zum Blättern.
// Progressive Enhancement: Ohne JavaScript bleibt der Link zum Großbild
// (das href des <a>) voll funktionsfähig.

// Alle Bild-Kacheln kommen in die Lightbox — auch die mit eigener Bildseite,
// damit man sie in der Galerie weiter vergrößern und mit den Pfeilen
// durchblättern kann. Erfasst wird nur das <a> DIREKT um das Bild
// (.galerie-bild > a); der Link im Untertitel liegt im <figcaption>, ist also
// kein direktes Kind, wird nicht abgefangen und führt normal zur Bildseite.
const bilder = Array.from(document.querySelectorAll(".galerie-bild > a"));

if (bilder.length) {
  let aktuell = 0;

  const overlay = document.createElement("div");
  overlay.className = "galerie-lightbox";
  overlay.hidden = true;
  overlay.innerHTML = `
    <button class="galerie-lb-schliessen" type="button" aria-label="Schließen">×</button>
    <button class="galerie-lb-pfeil galerie-lb-prev" type="button" aria-label="Vorheriges Bild">‹</button>
    <figure class="galerie-lb-inhalt">
      <img alt="" />
      <figcaption></figcaption>
    </figure>
    <button class="galerie-lb-pfeil galerie-lb-next" type="button" aria-label="Nächstes Bild">›</button>`;
  document.body.appendChild(overlay);

  const grossbild = overlay.querySelector("img");
  const unterschrift = overlay.querySelector("figcaption");
  const schliessenKnopf = overlay.querySelector(".galerie-lb-schliessen");

  const zeige = (i) => {
    aktuell = (i + bilder.length) % bilder.length;
    const a = bilder[aktuell];
    const text = a.querySelector("img")?.getAttribute("alt") || "";
    grossbild.src = a.getAttribute("href");
    grossbild.alt = text;
    unterschrift.textContent = text;
  };

  const oeffne = (i) => {
    zeige(i);
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    schliessenKnopf.focus();
  };

  const schliesse = () => {
    overlay.hidden = true;
    document.body.style.overflow = "";
  };

  bilder.forEach((a, i) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      oeffne(i);
    }),
  );
  schliessenKnopf.addEventListener("click", schliesse);
  overlay.querySelector(".galerie-lb-prev").addEventListener("click", () => zeige(aktuell - 1));
  overlay.querySelector(".galerie-lb-next").addEventListener("click", () => zeige(aktuell + 1));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) schliesse();
  });
  document.addEventListener("keydown", (e) => {
    if (overlay.hidden) return;
    if (e.key === "Escape") schliesse();
    else if (e.key === "ArrowLeft") zeige(aktuell - 1);
    else if (e.key === "ArrowRight") zeige(aktuell + 1);
  });
}
