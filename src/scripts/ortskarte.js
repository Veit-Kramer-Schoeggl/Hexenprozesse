/* Ortskarte
 * -----------------------------------------------------------------
 * Zeigt beim Überfahren eines Ortsnamens eine kleine Karte mit dem
 * Prozessort, darüber — sofern vorhanden — ein Bild aus dem Fall.
 *
 * Auslöser ist jedes Element mit .ort und data-lat/data-lon:
 *   <span class="ort" data-lat="47.39" data-lon="15.03" data-zoom="11"
 *         data-bild="/images/.../foo.jpg" data-bildtext="Beschreibung">
 *     St. Peter am Freienstein
 *   </span>
 *
 * Aufbau: eine einzige Karte für die ganze Seite, die beim Wechsel nur
 * neu zentriert wird. Leaflet und seine Kacheln werden erst beim ersten
 * Aufruf geladen — vorher kostet die Karte keine einzige Anfrage. Das
 * schwebende Kärtchen selbst (Positionierung, Ein-/Ausblenden, Schließen)
 * kommt aus dem gemeinsamen popover.js.
 */

import { erstellePopover } from "./popover.js";

let karte = null; // Leaflet-Instanz, einmal erzeugt
let marker = null;
let ladeVorgang = null; // Promise, damit Leaflet nur einmal geladen wird

function leafletLaden() {
  if (!ladeVorgang) {
    ladeVorgang = Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([mod]) => mod.default || mod);
  }
  return ladeVorgang;
}

function start() {
  const orte = document.querySelectorAll(".ort[data-lat][data-lon]");
  if (!orte.length) return;

  const pop = erstellePopover({ klasse: "ortskarte", label: "Karte des Prozessortes" });
  pop.box.innerHTML =
    '<figure class="ortskarte-bild-rahmen"><img class="ortskarte-bild" alt="" /><figcaption class="ortskarte-bildtext"></figcaption></figure>' +
    '<div class="ortskarte-karte"></div>' +
    '<div class="ortskarte-name"></div>';

  const bildRahmen = pop.box.querySelector(".ortskarte-bild-rahmen");
  const bild = pop.box.querySelector(".ortskarte-bild");
  const bildText = pop.box.querySelector(".ortskarte-bildtext");
  const kartenFeld = pop.box.querySelector(".ortskarte-karte");
  const nameFeld = pop.box.querySelector(".ortskarte-name");

  const zeigen = async (ausloeser) => {
    const lat = parseFloat(ausloeser.dataset.lat);
    const lon = parseFloat(ausloeser.dataset.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;
    const zoom = parseInt(ausloeser.dataset.zoom || "11", 10);

    // Bild: entweder eines aus dem Fall oder ein Platzhalter
    const quelle = ausloeser.dataset.bild;
    if (quelle) {
      bild.src = quelle;
      bild.alt = ausloeser.dataset.bildtext || "";
      bildText.textContent = ausloeser.dataset.bildtext || "";
      bildRahmen.classList.remove("ortskarte-ohne-bild");
    } else {
      bild.removeAttribute("src");
      bild.alt = "";
      bildText.textContent = "Kein Bild vorhanden";
      bildRahmen.classList.add("ortskarte-ohne-bild");
    }

    nameFeld.textContent = ausloeser.dataset.ort || ausloeser.textContent.trim();

    pop.zeige(ausloeser);

    const L = await leafletLaden();
    if (pop.ausloeser !== ausloeser) return; // inzwischen weitergewandert

    if (!karte) {
      karte = L.map(kartenFeld, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap",
      }).addTo(karte);
    }

    karte.setView([lat, lon], zoom);
    if (marker) marker.remove();
    marker = L.circleMarker([lat, lon], {
      radius: 8,
      color: "#8a2f2f",
      weight: 2,
      fillColor: "#c04a4a",
      fillOpacity: 0.85,
    }).addTo(karte);

    karte.invalidateSize();
    pop.platziere(ausloeser);
  };

  orte.forEach((el) => {
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
    el.addEventListener("mouseenter", () => zeigen(el));
    el.addEventListener("focus", () => zeigen(el));
    el.addEventListener("mouseleave", () => pop.verbergen());
    el.addEventListener("blur", () => pop.verbergen());
    // Auf Geräten ohne Mauszeiger öffnet und schließt ein Tippen
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (pop.ausloeser === el && pop.offen()) pop.verbergen(true);
      else zeigen(el);
    });
  });

  // Zeiger darf aus der Karte wieder heraus — dann zuklappen
  pop.box.addEventListener("mouseleave", () => pop.verbergen());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
