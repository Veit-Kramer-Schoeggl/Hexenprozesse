import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync } from "node:fs";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fromSrc = (...parts) => resolve(__dirname, "src", ...parts);

// Plugin: Ersetzt @@include('name') durch den Inhalt von src/partials/name.html
function htmlIncludePlugin() {
  const partialsDir = fromSrc("partials");
  return {
    name: "html-include",
    transformIndexHtml(html) {
      return html.replace(/@@include\(['"](\w+)['"]\)/g, (match, name) => {
        const partialPath = resolve(partialsDir, `${name}.html`);
        try {
          const content = readFileSync(partialPath, "utf-8");
          // Entferne HTML-Kommentare am Anfang des Partials
          return content.replace(/<!--[\s\S]*?-->\s*/g, "").trim();
        } catch (e) {
          console.warn(`Partial nicht gefunden: ${partialPath}`);
          return match;
        }
      });
    },
  };
}

// Plugin: Ersetzt @@prozessAnzahl / @@prozessErster / @@prozessLetzter durch
// die tatsächlichen Werte aus der Prozessliste. So bleiben Angaben wie
// "35 dokumentierte Prozesse" automatisch richtig, sobald eine Seite dazu
// kommt oder wegfällt — es genügt der normale Build.
//
// Bewusst zur Bauzeit und nicht per fetch() im Browser: die Seite ist
// statisch und wird bei jedem Deployment ohnehin neu gebaut. Damit gibt es
// keine zusätzliche Anfrage, kein Nachladen sichtbarer Zahlen und die
// Angaben stehen auch ohne JavaScript im Quelltext.
function prozessZahlenPlugin() {
  const listePfad = fromSrc("pages", "prozesse", "index.html");

  const lesen = () => {
    const html = readFileSync(listePfad, "utf-8");
    // Die Prozessliste ist chronologisch als Kacheln gesetzt. Jede Kachel
    // traegt Datei, Jahr und Name als data-Attribute — daraus wird gelesen,
    // nicht aus dem sichtbaren Text, der auch Ort und Ausgang enthaelt.
    const eintraege = [];
    const re = /<li class="fall-kachel"([^>]*)>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const attr = m[1];
      // Sprachvarianten sind derselbe Fall in einer anderen Sprache
      if (/data-sprachvariante/.test(attr)) continue;
      const name = (attr.match(/data-name="([^"]*)"/) || [])[1];
      const jahr = Number((attr.match(/data-jahr="(\d+)"/) || [])[1]);
      if (name) eintraege.push({ name, jahr });
    }
    eintraege.sort((a, b) => a.jahr - b.jahr);
    return {
      "@@prozessAnzahl": String(eintraege.length),
      "@@prozessErster": eintraege[0]?.name || "",
      "@@prozessLetzter": eintraege[eintraege.length - 1]?.name || "",
    };
  };

  return {
    name: "prozess-zahlen",
    transformIndexHtml(html) {
      const werte = lesen();
      return html.replace(
        /@@(prozessAnzahl|prozessErster|prozessLetzter)/g,
        (treffer) => werte[treffer] ?? treffer,
      );
    },
  };
}


// Plugin: Baut das Personenregister aus src/daten/denunziationen.json.
//
// Bewusst zur Bauzeit: Die Namen stehen damit im Quelltext der Seite und
// bleiben lesbar, auch wenn JavaScript aus ist oder die JSON-Datei einmal
// nicht mehr geladen wird. Das Skript auf der Seite sortiert und filtert
// nur, was ohnehin schon da ist.
//
// Die Kartei ist von Hand gepflegt; deshalb kommt auch der Sortiername aus
// der Datei ("sortname") und wird hier nicht geraten.
function personenregisterPlugin() {
  const karteiPfad = fromSrc("daten", "denunziationen.json");

  const bauen = () => {
    const d = JSON.parse(readFileSync(karteiPfad, "utf-8"));
    const esc = (s) =>
      String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    // In welchen Verfahren kommt eine Person vor?
    const vorkommen = new Map();
    const merken = (schluessel, datei) => {
      if (!vorkommen.has(schluessel)) vorkommen.set(schluessel, new Set());
      vorkommen.get(schluessel).add(datei);
    };
    for (const [datei, pr] of Object.entries(d.prozesse)) {
      for (const feld of ["beschuldigte", "bannrichter", "beisitzer", "zeugen", "nennt",
                          "urteilssprecher", "hofrichter", "gerichtsschreiber", "kommissar",
                          "scharfrichter", "landgerichtsverwalter"]) {
        for (const s of pr[feld] ?? []) merken(s, datei);
      }
    }

    // Sterbedatum: nur, wenn die Person im betreffenden Verfahren beschuldigt war
    // und das Verfahren mit Tod endete. Sonst bleibt die Spalte leer.
    const sterbedatum = (schluessel) => {
      for (const [datei, pr] of Object.entries(d.prozesse)) {
        if (!(pr.beschuldigte ?? []).includes(schluessel)) continue;
        const a = pr.ausgang ?? {};
        if (a.art === "hingerichtet" || a.art === "in-haft-gestorben") {
          return { datum: a.datum ?? String(pr.jahr), art: a.art };
        }
      }
      return null;
    };
    const jahrAus = (s) => {
      const m = String(s ?? "").match(/1[5-7]\d\d/);
      return m ? m[0] : "";
    };

    const zeilen = [];
    const bereitsErfasst = new Set();

    for (const [schluessel, v] of Object.entries(d.personen)) {
      const tod = sterbedatum(schluessel);
      const seiten = [...(vorkommen.get(schluessel) ?? [])].sort();
      // Wer eine eigene Prozessseite hat, wird dorthin verlinkt — der Name
      // steht dort in der Überschrift. Alle anderen werden nur im Text eines
      // Verfahrens genannt; dorthin wird mit ?person= gesprungen, damit die
      // erste Fundstelle angesteuert und hervorgehoben wird.
      let linkZiel = null;
      if (v.seite) {
        linkZiel = `/pages/prozesse/${v.seite}`;
      } else if (seiten[0]) {
        const q = new URLSearchParams({ person: v.name });
        const auch = (v.varianten ?? []).filter((s) => s && s.length >= 3);
        if (auch.length) q.set("auch", auch.join("|"));
        linkZiel = `/pages/prozesse/${seiten[0]}?${q.toString()}`;
      }
      const nameZelle = linkZiel
        ? `<a href="${esc(linkZiel)}">${esc(v.sortname || v.name)}</a>`
        : esc(v.sortname || v.name);
      const unsicher = v.status === "unsicher" || v.vermutlich
        ? ` <span class="register-unsicher" title="Zuordnung nicht gesichert">(unsicher)</span>` : "";
      const rollen = (v.rollen ?? []).join(", ");
      const sortTod = tod ? jahrAus(tod.datum) : "";
      zeilen.push(
        `                <tr data-sort-name="${esc((v.sortname || v.name).toLowerCase())}"` +
        ` data-sort-vorname="${esc((v.vorname || v.sortname || v.name).toLowerCase())}"` +
        ` data-sort-tod="${esc(sortTod)}"` +
        ` data-suche="${esc(`${v.name} ${v.sortname ?? ""} ${(v.varianten ?? []).join(" ")} ${rollen}`.toLowerCase())}">` +
        `<td>${nameZelle}${unsicher}</td>` +
        `<td class="spalte-rolle register-rolle">${esc(rollen)}</td>` +
        `<td>${tod ? esc(tod.datum) : "&mdash;"}</td>` +
        `</tr>`
      );
      bereitsErfasst.add(v.name.toLowerCase());
    }

    // Die Opferliste von Gleichenberg: 37 Namen, die sonst nirgends stehen
    const opfer = d.gruppen?.["gleichenberg-1689"]?.opferliste?.namen ?? [];
    for (const o of opfer) {
      // Wer eine eigene Prozessseite hat, steht schon oben in der Kartei
      if (o.seite) continue;
      if (bereitsErfasst.has(o.name.toLowerCase())) continue;
      const teile = o.name.trim().split(" ");
      const nach = teile.length > 1 ? teile[teile.length - 1] : o.name;
      const vor = teile.slice(0, -1).join(" ");
      const sort = teile.length > 1 ? `${nach}, ${vor}` : o.name;
      const zusatz = [o.vulgo ? `vulgo ${o.vulgo}` : null, o.ort].filter(Boolean).join(", ");
      zeilen.push(
        `                <tr data-sort-name="${esc(sort.toLowerCase())}"` +
        ` data-sort-vorname="${esc((vor || o.name).toLowerCase())}"` +
        ` data-sort-tod="1689"` +
        ` data-suche="${esc(`${o.name} ${o.vulgo ?? ""} ${o.ort ?? ""} opferliste gleichenberg`.toLowerCase())}">` +
        `<td><a href="/pages/prozesse/pindter.html?person=${encodeURIComponent(o.name)}">${esc(sort)}</a>` +
        `${zusatz ? ` <span class="register-rolle">(${esc(zusatz)})</span>` : ""}</td>` +
        `<td class="spalte-rolle register-rolle"><a href="/pages/prozesse/pindter.html?person=${encodeURIComponent(o.name)}">Opferliste von Gleichenberg</a></td>` +
        `<td>1689</td>`
        + `</tr>`
      );
    }

    zeilen.sort();
    return {
      "@@personenregister": zeilen.join("\n"),
      "@@personenAnzahl": String(zeilen.length),
    };
  };

  return {
    name: "personenregister",
    transformIndexHtml(html) {
      if (!html.includes("@@personenregister") && !html.includes("@@personenAnzahl")) return html;
      const werte = bauen();
      return html
        .replace("@@personenregister", werte["@@personenregister"])
        .replace(/@@personenAnzahl/g, werte["@@personenAnzahl"]);
    },
  };
}

// Auto-discover all HTML pages under src/ so new prozess-/themen-Seiten
// automatisch ins Build wandern. Es muss nur die Datei in src/pages/...
// existieren — kein Eintrag hier nötig.
function collectHtmlEntries() {
  const entries = { main: fromSrc("index.html") };

  const walk = (relDir, prefix) => {
    const abs = fromSrc(relDir);
    for (const f of readdirSync(abs, { withFileTypes: true })) {
      if (f.isDirectory()) {
        walk(`${relDir}/${f.name}`, `${prefix}${f.name}/`);
      } else if (f.name.endsWith(".html")) {
        const slug = (prefix + f.name.replace(/\.html$/, "")).replace(/\//g, "-");
        entries[slug] = fromSrc(relDir, f.name);
      }
    }
  };
  walk("pages", "");
  return entries;
}

export default defineConfig({
  root: "src",
  base: "/",
  publicDir: "assets",
  plugins: [htmlIncludePlugin(), prozessZahlenPlugin(), personenregisterPlugin()],

  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: collectHtmlEntries(),
    },
  },

  server: {
    port: 8080,
    open: false,
  },
});
