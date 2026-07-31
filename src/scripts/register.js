// Personenregister: sortieren, filtern und die Info-Box je Name.
//
// Die Zeilen stehen bereits im HTML — dieses Modul ordnet sie nur um und
// blendet aus. Ohne JavaScript bleibt das Register vollständig lesbar,
// alphabetisch nach Nachnamen.

import { erstellePopover } from "./popover.js";

const tabelle = document.getElementById("register");
if (tabelle) {
  const koerper = tabelle.tBodies[0];
  const zeilen = Array.from(koerper.rows);
  const suche = document.getElementById("register-suche");
  const zahl = document.getElementById("register-zahl");
  const koepfe = Array.from(tabelle.tHead.rows[0].cells);

  const gesamt = zeilen.length;
  let feld = "name";
  let absteigend = false;

  const schluessel = (zeile) => zeile.dataset["sort" + feld.charAt(0).toUpperCase() + feld.slice(1)] || "";

  const sortieren = () => {
    const leerNachHinten = feld === "tod";
    const sortiert = zeilen.slice().sort((a, b) => {
      const x = schluessel(a);
      const y = schluessel(b);
      // Ohne Sterbedatum immer ans Ende, egal in welche Richtung sortiert wird
      if (leerNachHinten && !x !== !y) return x ? -1 : 1;
      const v = x.localeCompare(y, "de", { numeric: true });
      return absteigend ? -v : v;
    });
    for (const z of sortiert) koerper.appendChild(z);
    for (const kopf of koepfe) {
      if (kopf.dataset.sortiere === feld) {
        kopf.setAttribute("aria-sort", absteigend ? "descending" : "ascending");
      } else {
        kopf.removeAttribute("aria-sort");
      }
    }
  };

  const filtern = () => {
    const wort = (suche?.value || "").trim().toLowerCase();
    let sichtbar = 0;
    for (const z of zeilen) {
      const treffer = !wort || (z.dataset.suche || "").includes(wort);
      z.hidden = !treffer;
      if (treffer) sichtbar++;
    }
    if (zahl) {
      zahl.textContent = wort
        ? `${sichtbar} von ${gesamt} Personen`
        : `${gesamt} Personen`;
    }
  };

  for (const kopf of koepfe) {
    const knopf = kopf.querySelector("button");
    if (!knopf || !kopf.dataset.sortiere) continue;
    knopf.addEventListener("click", () => {
      const neu = kopf.dataset.sortiere;
      absteigend = neu === feld ? !absteigend : false;
      feld = neu;
      sortieren();
    });
  }

  // Klick auf einen Namen zeigt die Info (Rolle, Prozess, Jahr + Link) als
  // schwebende Karte — dasselbe Widget wie die Ortskarten auf den
  // Prozessseiten. Delegiert am Tabellenkörper, damit es auch nach dem
  // Umsortieren der Zeilen weiter greift.
  const infoPop = erstellePopover({
    klasse: "info-popup",
    label: "Zur Person",
    beimSchliessen: (el) => el.setAttribute && el.setAttribute("aria-expanded", "false"),
  });
  koerper.addEventListener("click", (e) => {
    const knopf = e.target.closest(".register-name");
    if (!knopf) return;
    // gleicher Name nochmal -> schließen
    if (infoPop.offen() && infoPop.ausloeser === knopf) {
      infoPop.verbergen(true);
      return;
    }
    const quelle = knopf.parentElement.querySelector(".register-info");
    if (!quelle) return;
    document
      .querySelectorAll('.register-name[aria-expanded="true"]')
      .forEach((b) => b.setAttribute("aria-expanded", "false"));
    infoPop.box.innerHTML = quelle.innerHTML;
    infoPop.zeige(knopf);
    knopf.setAttribute("aria-expanded", "true");
  });

  suche?.addEventListener("input", filtern);
  filtern();
}
