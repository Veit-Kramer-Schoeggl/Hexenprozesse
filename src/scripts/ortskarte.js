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
 * Aufruf geladen — vorher kostet die Karte keine einzige Anfrage.
 */

let karte = null; // Leaflet-Instanz, einmal erzeugt
let marker = null;
let ladeVorgang = null; // Promise, damit Leaflet nur einmal geladen wird
let aktiverOrt = null;
let schliessZeit = null;

const box = document.createElement("div");
box.className = "ortskarte";
box.setAttribute("role", "dialog");
box.setAttribute("aria-label", "Karte des Prozessortes");
box.innerHTML =
  '<figure class="ortskarte-bild-rahmen"><img class="ortskarte-bild" alt="" /><figcaption class="ortskarte-bildtext"></figcaption></figure>' +
  '<div class="ortskarte-karte"></div>' +
  '<div class="ortskarte-name"></div>';

const bildRahmen = box.querySelector(".ortskarte-bild-rahmen");
const bild = box.querySelector(".ortskarte-bild");
const bildText = box.querySelector(".ortskarte-bildtext");
const kartenFeld = box.querySelector(".ortskarte-karte");
const nameFeld = box.querySelector(".ortskarte-name");

function leafletLaden() {
  if (!ladeVorgang) {
    ladeVorgang = Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([mod]) => mod.default || mod);
  }
  return ladeVorgang;
}

function platzieren(ausloeser) {
  const r = ausloeser.getBoundingClientRect();
  const breite = box.offsetWidth;
  const hoehe = box.offsetHeight;
  const rand = 12;

  // bevorzugt unterhalb; wenn dort kein Platz ist, oberhalb
  let oben = r.bottom + 8;
  if (oben + hoehe > window.innerHeight - rand) {
    oben = Math.max(rand, r.top - hoehe - 8);
  }
  let links = r.left + r.width / 2 - breite / 2;
  links = Math.max(rand, Math.min(links, window.innerWidth - breite - rand));

  box.style.top = oben + "px";
  box.style.left = links + "px";
}

async function zeigen(ausloeser) {
  clearTimeout(schliessZeit);
  aktiverOrt = ausloeser;

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

  box.classList.add("sichtbar");
  platzieren(ausloeser);

  const L = await leafletLaden();
  if (aktiverOrt !== ausloeser) return; // inzwischen weitergewandert

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
  platzieren(ausloeser);
}

function verbergen(sofort) {
  clearTimeout(schliessZeit);
  schliessZeit = setTimeout(
    () => {
      box.classList.remove("sichtbar");
      aktiverOrt = null;
    },
    sofort ? 0 : 220,
  );
}

function start() {
  const orte = document.querySelectorAll(".ort[data-lat][data-lon]");
  if (!orte.length) return;
  document.body.appendChild(box);

  orte.forEach((el) => {
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
    el.addEventListener("mouseenter", () => zeigen(el));
    el.addEventListener("focus", () => zeigen(el));
    el.addEventListener("mouseleave", () => verbergen());
    el.addEventListener("blur", () => verbergen());
    // Auf Geräten ohne Mauszeiger öffnet und schließt ein Tippen
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (aktiverOrt === el && box.classList.contains("sichtbar")) verbergen(true);
      else zeigen(el);
    });
  });

  // Zeiger darf in die Karte wandern, ohne dass sie zuklappt
  box.addEventListener("mouseenter", () => clearTimeout(schliessZeit));
  box.addEventListener("mouseleave", () => verbergen());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") verbergen(true);
  });
  window.addEventListener("resize", () => {
    if (aktiverOrt) platzieren(aktiverOrt);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
