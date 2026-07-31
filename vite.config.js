import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fromSrc = (...parts) => resolve(__dirname, "src", ...parts);

// Felder eines Prozesses, die auf Personen zeigen, und die Normalisierung
// ihrer Werte (String ODER {person,...}-Objekt) auf den Kartei-Schluessel.
// Gemeinsame Quelle fuer personenregisterPlugin (durchsucht alle Felder,
// inklusive beschuldigte, fuer die Fundstellen-Erfassung) und
// strukturDatenPlugin (ohne beschuldigte, das dort gesondert nach "about"
// wandert) - verhindert, dass die beiden Feldlisten auseinanderlaufen.
const FELDER_MIT_PERSONEN = ["beschuldigte", "bannrichter", "beisitzer", "zeugen", "nennt",
  "urteilssprecher", "hofrichter", "gerichtsschreiber", "kommissar",
  "scharfrichter", "landgerichtsverwalter", "denunziertVon"];

const personenSchluessel = (wert) =>
  (Array.isArray(wert) ? wert : [])
    .map((x) => (typeof x === "string" ? x : x && x.person))
    .filter(Boolean);

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
      for (const feld of FELDER_MIT_PERSONEN) {
        for (const s of personenSchluessel(pr[feld])) merken(s, datei);
      }
    }

    // --- Rolle, Fallname und Auftritte je Person (fuer die Info-Box im Register) ---
    const ROLLE_LABEL = {
      beschuldigte: { w: "Angeklagte", m: "Angeklagter", d: "angeklagt" },
      zeugen: { w: "Zeugin", m: "Zeuge", d: "Zeugin/Zeuge" },
      bannrichter: { d: "Bannrichter" }, beisitzer: { d: "Beisitzer" },
      hofrichter: { d: "Hofrichter" }, gerichtsschreiber: { d: "Gerichtsschreiber" },
      kommissar: { d: "Kommissar" }, scharfrichter: { d: "Scharfrichter" },
      urteilssprecher: { d: "Urteilssprecher" }, landgerichtsverwalter: { d: "Landgerichtsverwalter" },
      denunziertVon: { w: "Denunziantin", m: "Denunziant", d: "Denunziant/in" },
      nennt: { d: "genannt" },
    };
    const rolleIn = (feld, g) => {
      const l = ROLLE_LABEL[feld] || { d: feld };
      return l[g] || l.d;
    };
    const fallname = (pr) => {
      const namen = personenSchluessel(pr.beschuldigte).map((k) => d.personen[k]?.name).filter(Boolean);
      if (!namen.length) return "";
      return namen.length <= 2 ? namen.join(" und ") : `${namen.slice(0, 2).join(", ")} u. a.`;
    };
    const auftritteVon = (schluessel) =>
      [...(vorkommen.get(schluessel) ?? [])]
        .sort((a, b) => (d.prozesse[a].jahr || 0) - (d.prozesse[b].jahr || 0))
        .map((datei) => {
          const pr = d.prozesse[datei];
          const feld = FELDER_MIT_PERSONEN.find((f) => personenSchluessel(pr[f]).includes(schluessel));
          return { datei, feld, jahr: pr.jahr, fall: fallname(pr) };
        });
    // Handgeschriebener Kurztext aus der Kartei -> HTML. Erlaubt genau eine
    // Auszeichnung: [Anzeigetext](ziel.html?person=Name) wird zu einem Link auf
    // eine Prozessseite. Ein Klick darauf springt zur Erwähnung im Text
    // (erwaehnung.js liest ?person=). Zeilenumbrüche trennen Absätze. Alles
    // andere wird escaped, damit der Text nichts kaputtmachen kann.
    const kurztextHtml = (roh) =>
      String(roh)
        .split(/\n+/)
        .map((zeile) => {
          const re = /\[([^\]]+)\]\(([^)]+)\)/g;
          let out = "";
          let last = 0;
          let m;
          while ((m = re.exec(zeile))) {
            out += esc(zeile.slice(last, m.index));
            // Ziel absolut (/pages/themen/…#anker) oder kurz (kollar.html?person=…,
            // dann relativ zu den Prozessseiten).
            const ziel = m[2].startsWith("/") ? m[2] : `/pages/prozesse/${m[2]}`;
            out += `<a href="${esc(ziel)}">${esc(m[1])}</a>`;
            last = m.index + m[0].length;
          }
          out += esc(zeile.slice(last));
          return `<p>${out}</p>`;
        })
        .join("");

    const infoBox = (auftritte, v) => {
      // Box gibt es, sobald es einen Auftritt oder einen Kurztext gibt. Personen
      // ohne Prozess-Eintrag (nur auf einer Themenseite belegt, z. B. die
      // Schöckl-Beschuldigten) kommen so über kurztext + fussnote trotzdem zu
      // ihrer Box samt Link.
      if (!auftritte.length && !v.kurztext) return "";
      // Sprung zur ersten Erwähnung im Protokoll (erwaehnung.js liest ?person=).
      const q = new URLSearchParams({ person: v.name });
      const auch = (v.varianten ?? []).filter((s) => s && s.length >= 3);
      if (auch.length) q.set("auch", auch.join("|"));
      const query = `?${q.toString()}`;

      // Kopf: die Selbstauskunft — wer ist das. Handgeschriebener Kurztext,
      // sonst wenigstens das Amt/die Lebensrolle aus der Kartei.
      const kopf = v.kurztext
        ? kurztextHtml(v.kurztext)
        : v.amt
          ? `<p class="register-info-amt">${esc(v.amt)}</p>`
          : "";

      // Fuß-Zeile: die Rolle im Verfahren. Bei Auftritten je Fall automatisch,
      // sonst — falls hinterlegt — die manuelle fussnote (Themenseiten-Personen).
      let fuss = "";
      if (auftritte.length) {
        const li = auftritte
          .map((a) => {
            const fall = a.fall ? `„${esc(a.fall)}“` : esc(a.datei.replace(/\.html$/, ""));
            // Mit Kurztext liegen die Sprünge zur Erwähnung schon in den Namen
            // der Beschreibung; die Fuß-Zeile führt dann an den Prozessanfang.
            // Ohne Kurztext bleibt der Fall-Link selbst der Sprung zur Erwähnung.
            const ziel = v.kurztext
              ? `/pages/prozesse/${esc(a.datei)}`
              : `/pages/prozesse/${esc(a.datei)}${query}`;
            return `<li>${esc(rolleIn(a.feld, v.geschlecht))} im Prozess <a href="${ziel}">${fall}</a> (${a.jahr})</li>`;
          })
          .join("");
        fuss = `<ul>${li}</ul>`;
      } else if (v.fussnote) {
        fuss = `<ul><li><a href="${esc(v.fussnote.ziel)}">${esc(v.fussnote.text)}</a></li></ul>`;
      }
      return `<div class="register-info" hidden>${kopf}${fuss}</div>`;
    };

    // Sterbedatum: nur, wenn die Person im betreffenden Verfahren beschuldigt war
    // und das Verfahren mit Tod endete. Sonst bleibt die Spalte leer.
    const sterbedatum = (schluessel) => {
      for (const [datei, pr] of Object.entries(d.prozesse)) {
        if (!personenSchluessel(pr.beschuldigte).includes(schluessel)) continue;
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
      // Klick auf den Namen klappt eine kleine Info-Box auf (Rolle, Fall, Jahr,
      // Link) — statt "blind" in einen Protokolltext zu springen.
      const auftritte = auftritteVon(schluessel);
      const anzeige = esc(v.sortname || v.name);
      const unsicher = v.status === "unsicher" || v.vermutlich
        ? ` <span class="register-unsicher" title="Zuordnung nicht gesichert">(unsicher)</span>` : "";
      const namenszelle = auftritte.length || v.kurztext
        ? `<button type="button" class="register-name" aria-expanded="false">${anzeige}</button>${unsicher}${infoBox(auftritte, v)}`
        : `${anzeige}${unsicher}`;
      const rollen = (v.rollen ?? []).join(", ");
      const sortTod = tod ? jahrAus(tod.datum) : "";
      zeilen.push(
        `                <tr data-sort-name="${esc((v.sortname || v.name).toLowerCase())}"` +
        ` data-sort-vorname="${esc((v.vorname || v.sortname || v.name).toLowerCase())}"` +
        ` data-sort-tod="${esc(sortTod)}"` +
        ` data-suche="${esc(`${v.name} ${v.sortname ?? ""} ${(v.varianten ?? []).join(" ")} ${rollen}`.toLowerCase())}">` +
        `<td class="register-namenszelle">${namenszelle}</td>` +
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
      const opferInfo =
        `<div class="register-info" hidden><ul><li>Auf der Opferliste von Gleichenberg — überliefert im Prozess <a href="/pages/prozesse/pindter.html?person=${encodeURIComponent(o.name)}">„Susanne Pindter“</a> (1689)</li></ul></div>`;
      zeilen.push(
        `                <tr data-sort-name="${esc(sort.toLowerCase())}"` +
        ` data-sort-vorname="${esc((vor || o.name).toLowerCase())}"` +
        ` data-sort-tod="1689"` +
        ` data-suche="${esc(`${o.name} ${o.vulgo ?? ""} ${o.ort ?? ""} opferliste gleichenberg`.toLowerCase())}">` +
        `<td class="register-namenszelle"><button type="button" class="register-name" aria-expanded="false">${esc(sort)}</button>` +
        `${zusatz ? ` <span class="register-rolle">(${esc(zusatz)})</span>` : ""}${opferInfo}</td>` +
        `<td class="spalte-rolle register-rolle">Opferliste von Gleichenberg</td>` +
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

// Plugin: Erzeugt die SEO-Grunddateien beim Build.
//
// Drei Dinge, die eine statische Seite fuer Suchmaschinen und KI-Crawler
// braucht, und die sonst von Hand gepflegt werden muessten:
//
//  1. rel="canonical" in jedem <head> — self-referenzierend, absolute URL.
//     Buendelt "/" und "/index.html" auf eine Adresse.
//  2. hreflang zwischen der deutschen und der slowenischen Wed-Seite, damit
//     Google sie als Sprachvarianten und nicht als Duplikat wertet.
//  3. sitemap.xml aus allen gebauten Seiten, lastmod je Seite aus dem
//     Git-Datum der Quelldatei. Kein Handpflegen, nichts veraltet.
//
// Bewusst als eigenes Mini-Plugin statt als Abhaengigkeit: die Logik ist
// klein, und so bleibt die Site ohne fremden Code auskommentierbar.
function seoDateienPlugin() {
  const DOMAIN = "https://hexenprozesse.at";

  // Die einzige zweisprachige Seite: deutsche Fassung und slowenische
  // Uebertragung verweisen wechselseitig aufeinander. Kommt eine englische
  // Fassung dazu, wird hier je Seite eine Zeile ergaenzt.
  const sprachAlternativen = {
    "pages/prozesse/wed.html": [
      ["de", "pages/prozesse/wed.html"],
      ["sl", "pages/prozesse/wed-2.html"],
      ["x-default", "pages/prozesse/wed.html"],
    ],
  };
  sprachAlternativen["pages/prozesse/wed-2.html"] =
    sprachAlternativen["pages/prozesse/wed.html"];

  // Verzeichnis-Index wird zur "sauberen" Root-Adresse; alle uebrigen Seiten
  // behalten ihren .html-Pfad, so wie sie auch intern verlinkt sind. Sitemap
  // und Canonical benutzen dieselbe Funktion, damit sie nie auseinanderlaufen.
  const seiteZuUrl = (rel) =>
    rel === "index.html" ? `${DOMAIN}/` : `${DOMAIN}/${rel}`;

  // Alle Seiten der Site: index.html plus jede .html unter pages/. Bewusst
  // aus dem Quellbaum gelesen und nicht aus dem Rollup-Bundle — Vite fuegt die
  // HTML-Dateien dem Bundle erst nach diesem Plugin hinzu, es waere zur
  // generateBundle-Zeit noch leer. Die Partials in src/partials/ sind keine
  // eigenen Seiten und bleiben aussen vor.
  const seitenSammeln = () => {
    const out = ["index.html"];
    const walk = (relDir) => {
      for (const f of readdirSync(fromSrc(relDir), { withFileTypes: true })) {
        const rel = relDir ? `${relDir}/${f.name}` : f.name;
        if (f.isDirectory()) walk(rel);
        else if (f.name.endsWith(".html")) out.push(rel);
      }
    };
    walk("pages");
    return out;
  };

  // Letzte inhaltliche Aenderung = Git-Commit-Datum der Quelldatei. Faellt
  // Git aus (z. B. noch nicht committete Datei), heutiges Datum als Rueckfall.
  const letzteAenderung = (absPfad) => {
    try {
      const iso = execFileSync("git", ["log", "-1", "--format=%cI", "--", absPfad], {
        cwd: __dirname,
        encoding: "utf-8",
      }).trim();
      if (iso) return iso.slice(0, 10);
    } catch {
      /* kein Git / nicht getrackt — Rueckfall unten */
    }
    return new Date().toISOString().slice(0, 10);
  };

  return {
    name: "seo-dateien",

    // Canonical und (fuer die Wed-Seiten) hreflang in den <head> haengen.
    transformIndexHtml(html, ctx) {
      let rel = (ctx?.path || "").replace(/^\//, "");
      if (!rel && ctx?.filename) rel = relative(fromSrc(), ctx.filename).replace(/\\/g, "/");
      if (!rel) rel = "index.html";

      const tags = [
        { tag: "link", attrs: { rel: "canonical", href: seiteZuUrl(rel) }, injectTo: "head" },
      ];
      for (const [lang, ziel] of sprachAlternativen[rel] ?? []) {
        tags.push({
          tag: "link",
          attrs: { rel: "alternate", hreflang: lang, href: seiteZuUrl(ziel) },
          injectTo: "head",
        });
      }
      return { html, tags };
    },

    // sitemap.xml aus der Seitenliste schreiben. hreflang-Bezug fuer das
    // Sprachpaar als xhtml:link je Eintrag.
    generateBundle() {
      const seiten = seitenSammeln().sort();

      const eintraege = seiten.map((rel) => {
        const alternates = (sprachAlternativen[rel] ?? [])
          .map(
            ([lang, ziel]) =>
              `    <xhtml:link rel="alternate" hreflang="${lang}" href="${seiteZuUrl(ziel)}" />`,
          )
          .join("\n");
        return [
          "  <url>",
          `    <loc>${seiteZuUrl(rel)}</loc>`,
          `    <lastmod>${letzteAenderung(fromSrc(rel))}</lastmod>`,
          alternates,
          "  </url>",
        ]
          .filter(Boolean)
          .join("\n");
      });

      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
        `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
        eintraege.join("\n") +
        "\n</urlset>\n";

      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: xml });
    },
  };
}

// Plugin: Erzeugt JSON-LD (schema.org) fuer jede Seite und haengt es in den
// <head>. Das ist der eigentliche GEO-Baustein: Personen, Orte, Daten und
// Rollen werden maschinenlesbar, statt nur im Fliesstext zu stehen.
//
// Alles kommt aus src/daten/denunziationen.json, wird also nie von Hand
// gepflegt und kann nicht veralten:
//  - Prozessseiten -> Article mit about (Beschuldigte) / mentions (uebrige
//    genannte Personen), isBasedOn (Fundstelle), spatialCoverage (die
//    geprueften Koordinaten), temporalCoverage (Jahr), keywords (Anklage).
//  - Prozessliste  -> CollectionPage mit ItemList der Faelle.
//  - Startseite    -> WebSite mit Siegfried Kramer als Urheber.
//  - Themen/Sonst  -> WebPage.
//  - Jede Unterseite zusaetzlich eine BreadcrumbList.
//
// Ausserdem Open-Graph- und Twitter-Card-Meta je Seite (Titel, Beschreibung,
// Bild, URL), damit Link-Vorschauen in Chats und sozialen Medien stimmen.
function strukturDatenPlugin() {
  const DOMAIN = "https://hexenprozesse.at";
  const d = JSON.parse(readFileSync(fromSrc("daten", "denunziationen.json"), "utf-8"));

  // Felder eines Prozesses, die auf Personen zeigen, ohne beschuldigte, die
  // gesondert nach about wandern (siehe FELDER_MIT_PERSONEN weiter oben).
  const ROLLEN_FELDER = FELDER_MIT_PERSONEN.filter((f) => f !== "beschuldigte");

  const ANKLAGE_LABEL = {
    "zauberei": "Zauberei", "teufelsbund": "Teufelsbund", "hostienfrevel": "Hostienfrevel",
    "wetterzauber": "Wetterzauber", "wahrsagerei": "Wahrsagerei", "diebstahl-und-raub": "Diebstahl und Raub",
    "wolfsbannerei": "Wolfsbannerei", "milchzauber": "Milchzauber", "hagelmachen": "Hagelmachen",
    "segensprechen": "Segensprechen", "schadenzauber": "Schadenzauber", "totschlag": "Totschlag",
    "diebstahl": "Diebstahl", "giftmord": "Giftmord", "kindstoetung": "Kindstötung",
    "kirchenraub": "Kirchenraub", "mord": "Mord", "unzucht": "Unzucht", "opferstockraub": "Opferstockraub",
  };
  const anklageLabel = (a) =>
    ANKLAGE_LABEL[a] || (a.charAt(0).toUpperCase() + a.slice(1)).replace(/-/g, " ");

  const seiteZuUrl = (rel) => (rel === "index.html" ? `${DOMAIN}/` : `${DOMAIN}/${rel}`);

  // Ein Person-Knoten fuer den Graphen. reich=true fuegt Namensvarianten hinzu
  // (nur fuer die wenigen Beschuldigten, sonst blaeht es das JSON auf).
  const personKnoten = (key, reich) => {
    const p = d.personen[key];
    if (!p) return null;
    const k = { "@type": "Person", name: p.name };
    if (reich && (p.varianten || []).length) {
      k.alternateName = p.varianten.length === 1 ? p.varianten[0] : p.varianten;
    }
    if (p.amt) k.disambiguatingDescription = p.amt;
    if (p.seite) {
      const ziel = p.seite.startsWith("/") ? p.seite : `/pages/prozesse/${p.seite}`;
      k.url = `${DOMAIN}${ziel}`;
    }
    return k;
  };

  // Titel/Description/Sprache aus dem fertigen Seiten-HTML lesen — so steht der
  // Text nur einmal in der Seite und nicht zusaetzlich in der Kartei.
  const titelAus = (html) => {
    const m = html.match(/<title>([\s\S]*?)<\/title>/i);
    return (m ? m[1].trim() : "").replace(/\s*[—–-]\s*Hexenprozesse\s*$/, "").trim();
  };
  const descAus = (html) => {
    const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    return m ? m[1].trim() : "";
  };
  const langAus = (html) => {
    const m = html.match(/<html[^>]*\blang="([^"]+)"/i);
    return m ? m[1] : "de";
  };

  // Erstes Inhaltsbild der Seite als og:image (absolute URL); sonst ein
  // Standardbild aus der Hauptseite.
  const STANDARD_BILD = "/images/hauptseite/Folterung-der-Schulmeisterin-Ursel---1570-k.JPG";
  const bildAus = (html) => {
    const m = html.match(/<img[^>]+src="(\/images\/[^"]+)"/i);
    return `${DOMAIN}${m ? m[1] : STANDARD_BILD}`;
  };

  const AUTOR = {
    "@type": "Person",
    name: "Siegfried Kramer",
    description: "Übersetzung und Bearbeitung der Originalprotokolle",
  };
  const HERAUSGEBER = { "@type": "Organization", name: "hexenprozesse.at", url: `${DOMAIN}/` };
  const WEBSITE = { "@type": "WebSite", name: "Hexenprozesse", url: `${DOMAIN}/` };

  const artikelKnoten = (datei, rel, html) => {
    const pr = d.prozesse[datei];
    if (!pr) return null;
    const url = seiteZuUrl(rel);

    const beschuldigt = personenSchluessel(pr.beschuldigte);
    const gesehen = new Set(beschuldigt);
    const erwaehnt = [];
    for (const f of ROLLEN_FELDER)
      for (const key of personenSchluessel(pr[f]))
        if (!gesehen.has(key)) { gesehen.add(key); erwaehnt.push(key); }

    const k = {
      "@type": "Article",
      headline: titelAus(html),
      inLanguage: langAus(html),
      url,
      mainEntityOfPage: url,
      isPartOf: { "@type": "CollectionPage", name: "Prozesse", url: `${DOMAIN}/pages/prozesse/index.html` },
      author: AUTOR,
      publisher: HERAUSGEBER,
    };
    const desc = descAus(html);
    if (desc) k.description = desc;
    if (pr.fundstelle)
      k.isBasedOn = { "@type": "CreativeWork", name: "Originalprotokoll / Archivquelle", description: pr.fundstelle };
    if (pr.jahr) k.temporalCoverage = String(pr.jahr);
    k.keywords = ["Hexenprozess", ...(pr.anklage || []).map(anklageLabel)];
    if (pr.koordinaten) {
      k.spatialCoverage = {
        "@type": "Place",
        name: pr.ort,
        geo: { "@type": "GeoCoordinates", latitude: pr.koordinaten.lat, longitude: pr.koordinaten.lon },
      };
    } else if (pr.ort) {
      k.spatialCoverage = { "@type": "Place", name: pr.ort };
    }
    const about = beschuldigt.map((key) => personKnoten(key, true)).filter(Boolean);
    const mentions = erwaehnt.map((key) => personKnoten(key, false)).filter(Boolean);
    if (about.length) k.about = about;
    if (mentions.length) k.mentions = mentions;
    return k;
  };

  const sammlungKnoten = (rel, html) => {
    const faelle = [];
    const re = /<li class="fall-kachel"([^>]*)>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const attr = m[1];
      if (/data-sprachvariante/.test(attr)) continue; // Sprachvariante ist derselbe Fall
      const datei = (attr.match(/data-datei="([^"]*)"/) || [])[1];
      const name = (attr.match(/data-name="([^"]*)"/) || [])[1];
      const jahr = Number((attr.match(/data-jahr="(\d+)"/) || [])[1]);
      if (datei && name) faelle.push({ datei, name, jahr });
    }
    faelle.sort((a, b) => a.jahr - b.jahr);
    return {
      "@type": "CollectionPage",
      name: titelAus(html) || "Prozesse",
      url: seiteZuUrl(rel),
      inLanguage: langAus(html),
      isPartOf: WEBSITE,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: faelle.length,
        itemListElement: faelle.map((f, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: seiteZuUrl(`pages/prozesse/${f.datei}`),
          name: f.name,
        })),
      },
    };
  };

  const webpageKnoten = (rel, html) => {
    const k = {
      "@type": "WebPage",
      name: titelAus(html),
      url: seiteZuUrl(rel),
      inLanguage: langAus(html),
      isPartOf: WEBSITE,
    };
    const desc = descAus(html);
    if (desc) k.description = desc;
    return k;
  };

  const webseiteKnoten = (html) => {
    const k = {
      "@type": "WebSite",
      name: "Hexenprozesse in der Steiermark",
      url: `${DOMAIN}/`,
      inLanguage: "de",
      about: { "@type": "Thing", name: "Steirische Hexenprozesse des 17. Jahrhunderts" },
      creator: AUTOR,
    };
    const desc = descAus(html);
    if (desc) k.description = desc;
    return k;
  };

  // Start › Prozesse › Fall usw., abgeleitet aus dem Pfad. Startseite ohne.
  const breadcrumb = (rel, html) => {
    const url = seiteZuUrl(rel);
    const titel = titelAus(html);
    const items = [{ name: "Start", url: `${DOMAIN}/` }];
    if (rel === "pages/prozesse/index.html") {
      items.push({ name: "Prozesse", url });
    } else if (rel.startsWith("pages/prozesse/")) {
      items.push({ name: "Prozesse", url: `${DOMAIN}/pages/prozesse/index.html` });
      items.push({ name: titel, url });
    } else if (rel.startsWith("pages/themen/byloff/")) {
      if (rel.endsWith("byloff/index.html")) {
        items.push({ name: "Volkskundliches (Byloff)", url });
      } else {
        items.push({ name: "Volkskundliches (Byloff)", url: `${DOMAIN}/pages/themen/byloff/index.html` });
        items.push({ name: titel, url });
      }
    } else if (rel.startsWith("pages/")) {
      items.push({ name: titel, url });
    } else {
      return null;
    }
    return {
      "@type": "BreadcrumbList",
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        item: it.url,
      })),
    };
  };

  return {
    name: "struktur-daten",
    transformIndexHtml(html, ctx) {
      let rel = (ctx?.path || "").replace(/^\//, "");
      if (!rel && ctx?.filename) rel = relative(fromSrc(), ctx.filename).replace(/\\/g, "/");
      if (!rel) rel = "index.html";

      // Open Graph / Twitter Card fuer Link-Vorschauen (auf jeder Seite)
      const titel = titelAus(html);
      const og = [
        ["og:type", rel === "index.html" ? "website" : "article"],
        ["og:site_name", "Hexenprozesse"],
        ["og:locale", langAus(html) === "sl" ? "sl_SI" : "de_AT"],
        ["og:title", titel],
        ["og:url", seiteZuUrl(rel)],
        ["og:image", bildAus(html)],
        ["og:image:alt", titel],
      ];
      const beschreibung = descAus(html);
      if (beschreibung) og.push(["og:description", beschreibung]);
      const tags = og.map(([property, content]) => ({
        tag: "meta",
        attrs: { property, content },
        injectTo: "head",
      }));
      // twitter:title/description/image separat setzen statt sich auf den
      // OG-Fallback zu verlassen, den nicht jede Plattform garantiert liest.
      tags.push(
        { tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" }, injectTo: "head" },
        { tag: "meta", attrs: { name: "twitter:title", content: titel }, injectTo: "head" },
        { tag: "meta", attrs: { name: "twitter:image", content: bildAus(html) }, injectTo: "head" },
      );
      if (beschreibung) {
        tags.push({ tag: "meta", attrs: { name: "twitter:description", content: beschreibung }, injectTo: "head" });
      }

      // JSON-LD-Graph je nach Seitentyp
      const graph = [];
      if (rel === "index.html") {
        graph.push(webseiteKnoten(html));
      } else if (rel === "pages/prozesse/index.html") {
        graph.push(sammlungKnoten(rel, html));
      } else if (rel.startsWith("pages/prozesse/") && d.prozesse[rel.slice("pages/prozesse/".length)]) {
        graph.push(artikelKnoten(rel.slice("pages/prozesse/".length), rel, html));
      } else {
        graph.push(webpageKnoten(rel, html));
      }
      const bc = breadcrumb(rel, html);
      if (bc) graph.push(bc);
      const nutzbar = graph.filter(Boolean);

      if (nutzbar.length) {
        // < zu <, damit kein "</script>" aus einem Datenfeld die Einbettung aufbricht
        const jsonld = JSON.stringify({ "@context": "https://schema.org", "@graph": nutzbar })
          .replace(/</g, "\\u003c");
        tags.push({
          tag: "script",
          attrs: { type: "application/ld+json" },
          children: jsonld,
          injectTo: "head",
        });
      }
      return { html, tags };
    },
  };
}

// Plugin: Erzeugt llms.txt und llms-full.txt beim Build.
//
// llms.txt      = kurzes Inhaltsverzeichnis (Projektbeschreibung + Linkliste
//                 aller Prozesse, Themen und weiteren Seiten).
// llms-full.txt = alle Protokolle in einem sauberen Markdown-Dokument, aus dem
//                 sich eine KI speisen kann, ohne Einzelseiten zu crawlen.
//
// Beide werden aus denselben Quellen wie die uebrige Site erzeugt (die
// Prozessseiten und die Kartei denunziationen.json). Kommt ein Fall dazu,
// erscheint er automatisch in beiden Dateien -- nichts von Hand nachzutragen.
function llmsDateienPlugin() {
  const DOMAIN = "https://hexenprozesse.at";
  const d = JSON.parse(readFileSync(fromSrc("daten", "denunziationen.json"), "utf-8"));
  const seiteZuUrl = (rel) => (rel === "index.html" ? `${DOMAIN}/` : `${DOMAIN}/${rel}`);

  // --- HTML-Fragment -> Klartext-Markdown ---------------------------------
  const ENT = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'",
    "&nbsp;": " ", "&middot;": "·", "&rarr;": "→", "&larr;": "←",
    "&ndash;": "–", "&mdash;": "—", "&hellip;": "…",
    "&bdquo;": "„", "&ldquo;": "“", "&rdquo;": "”", "&sbquo;": "‚",
    "&lsquo;": "‘", "&rsquo;": "’", "&laquo;": "«", "&raquo;": "»",
    "&lsaquo;": "‹", "&rsaquo;": "›", "&szlig;": "ß", "&auml;": "ä",
    "&ouml;": "ö", "&uuml;": "ü", "&Auml;": "Ä", "&Ouml;": "Ö", "&Uuml;": "Ü",
  };
  const dekodieren = (s) =>
    s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&[a-zA-Z]+;/g, (m) => ENT[m] ?? m);

  // Inline-Fragment -> Text. Tags werden zu Leerzeichen, damit an Tag-Grenzen
  // keine Woerter verkleben; Leerzeichen vor Satzzeichen fallen weg.
  const nurText = (frag) =>
    dekodieren(frag.replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .replace(/ ([.,;:!?])/g, "$1")
      .trim();

  const inhaltAlsMarkdown = (html) => {
    let m = html.match(/<article class="prozess">([\s\S]*?)<\/article>/);
    let b = m ? m[1] : html;

    // Bloecke entfernen, die nicht in den Korpus gehoeren
    b = b
      .replace(/<figure[\s\S]*?<\/figure>/g, "")
      .replace(/<nav[\s\S]*?<\/nav>/g, "")
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .replace(/<p class="hint">[\s\S]*?<\/p>/g, "")
      .replace(/<header class="prozess-header">[\s\S]*?<\/header>/g, "") // h1 kommt aus den Metadaten
      // Quelle-Block: die konzise Fundstelle steht schon im Metadatenkopf; die
      // Literatur-Karte hier waere Wiederholung und schwer sauber zu extrahieren.
      .replace(/<h3>\s*Quelle\s*<\/h3>/g, "")
      .replace(/<ul class="literatur-liste">[\s\S]*?<\/ul>/g, "")
      .replace(/<p>\s*<a href="\/pages\/prozesse\/index\.html">[\s\S]*?<\/p>/g, "");

    // Prozess-Tag-Ueberschrift: Ort·Datum + Phasenname -> ### Zeile
    b = b.replace(/<h3 class="prozess-tag-datum">([\s\S]*?)<\/h3>/g, (_, inner) => {
      const kopf = (inner.match(/<span class="kap-kopf">([\s\S]*?)<\/span>/) || [])[1] || "";
      const pname = (inner.match(/<span class="kap-name">([\s\S]*?)<\/span>/) || [])[1] || "";
      return `\n\n### ${[nurText(kopf), nurText(pname)].filter(Boolean).join(" — ")}\n\n`;
    });

    // Untertitel (h2) -> kursive Zeile; uebrige Ueberschriften -> ###/####
    b = b.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, (_, t) => `\n\n*${nurText(t)}*\n\n`);
    b = b.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, (_, t) => `\n\n### ${nurText(t)}\n\n`);
    b = b.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/g, (_, t) => `\n\n#### ${nurText(t)}\n\n`);

    // Listen und Tabellen (Todes-/Opferlisten): jede Zeile ein Listeneintrag
    b = b.replace(/<li[^>]*>/g, "\n- ").replace(/<\/li>/g, "");
    b = b.replace(/<tr[^>]*>/g, "\n- ").replace(/<\/td>\s*/g, " — ").replace(/<t[dhr][^>]*>/g, "");

    // Absatz-/Zeilengrenzen, dann restliche Tags zu Leerzeichen
    b = b.replace(/<br\s*\/?>/g, "\n").replace(/<\/(p|div|ul|table|section)>/g, "\n\n");
    b = dekodieren(b.replace(/<[^>]+>/g, " "));

    // Zeilen normalisieren; bei Listenzeilen die "—"-getrennten Zellen aufraeumen
    b = b
      .split("\n")
      .map((z) => {
        z = z.replace(/[ \t]+/g, " ").trim();
        if (z.startsWith("- ") && z.includes("—")) {
          const zellen = z.slice(2).split(/\s*—\s*/).map((s) => s.trim()).filter(Boolean);
          z = "- " + zellen.join(" — ");
        }
        return z;
      })
      .join("\n");
    return b.replace(/ ([.,;:!?])/g, "$1").replace(/\n{3,}/g, "\n\n").trim();
  };

  // --- Metadaten / Listen -------------------------------------------------
  const name = (key) => d.personen[key]?.name || key;
  const anklageLabel = (a) => (a.charAt(0).toUpperCase() + a.slice(1)).replace(/-/g, " ");
  const AUSGANG_LABEL = {
    "hingerichtet": "hingerichtet", "in-haft-gestorben": "in Haft gestorben",
    "verbannt": "verbannt", "freigelassen": "freigelassen", "nicht-ueberliefert": "nicht überliefert",
  };
  const ausgangText = (a) =>
    a && a.art ? (AUSGANG_LABEL[a.art] || a.art) + (a.datum ? `, ${a.datum}` : "") : "";

  // Faelle chronologisch aus den Kacheln der Prozessliste (Sprachvariante raus)
  const faelleLesen = () => {
    const html = readFileSync(fromSrc("pages", "prozesse", "index.html"), "utf-8");
    const faelle = [];
    const re = /<li class="fall-kachel"([^>]*)>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const a = m[1];
      if (/data-sprachvariante/.test(a)) continue;
      const datei = (a.match(/data-datei="([^"]*)"/) || [])[1];
      const kname = (a.match(/data-name="([^"]*)"/) || [])[1];
      const jahr = Number((a.match(/data-jahr="(\d+)"/) || [])[1]);
      if (datei && kname) faelle.push({ datei, name: dekodieren(kname), jahr });
    }
    faelle.sort((a, b) => a.jahr - b.jahr);
    return faelle;
  };

  const titelVon = (rel) => {
    try {
      const h = readFileSync(fromSrc(rel), "utf-8");
      const m = h.match(/<title>([\s\S]*?)<\/title>/i);
      const roh = (m ? m[1].trim() : "").replace(/\s*[—–-]\s*Hexenprozesse\s*$/, "").trim();
      return roh ? dekodieren(roh) : rel;
    } catch {
      return rel;
    }
  };
  // Themenseiten (Unterordner nur mit ihrer index.html) und weitere Einzelseiten
  const themenSeiten = () => {
    const out = [];
    for (const f of readdirSync(fromSrc("pages", "themen"), { withFileTypes: true })) {
      if (f.isFile() && f.name.endsWith(".html")) out.push(`pages/themen/${f.name}`);
      else if (f.isDirectory()) out.push(`pages/themen/${f.name}/index.html`);
    }
    return out.sort();
  };
  const weitereSeiten = () =>
    readdirSync(fromSrc("pages"), { withFileTypes: true })
      .filter((f) => f.isFile() && f.name.endsWith(".html"))
      .map((f) => `pages/${f.name}`)
      .sort();

  const metaBlock = (fall) => {
    const pr = d.prozesse[fall.datei] || {};
    const z = [`## ${fall.name} (${fall.jahr})`, ""];
    if (pr.ort) {
      const ko = pr.koordinaten ? ` (${pr.koordinaten.lat.toFixed(4)}, ${pr.koordinaten.lon.toFixed(4)})` : "";
      z.push(`- **Ort:** ${pr.ort}${ko}`);
    }
    const besch = (pr.beschuldigte || []).map(name);
    if (besch.length) z.push(`- **Beschuldigte:** ${besch.join("; ")}`);
    if ((pr.anklage || []).length) z.push(`- **Anklage:** ${pr.anklage.map(anklageLabel).join(", ")}`);
    const aus = ausgangText(pr.ausgang);
    if (aus) z.push(`- **Ausgang:** ${aus}`);
    const bann = (pr.bannrichter || []).map(name);
    if (bann.length) z.push(`- **Bannrichter:** ${bann.join(", ")}`);
    if (pr.fundstelle) z.push(`- **Quelle:** ${pr.fundstelle}`);
    z.push(`- **Seite:** ${seiteZuUrl(`pages/prozesse/${fall.datei}`)}`);
    return z.join("\n") + "\n";
  };

  const KOPF =
    "> Originalprotokolle von Prozessen gegen Hexen und Zauberer aus der\n" +
    "> Steiermark (Österreich) und aus Slowenien im 17. Jahrhundert, transkribiert\n" +
    "> und in heutiges Deutsch übertragen. Über zwei Jahrzehnte Forschungsarbeit\n" +
    "> von Dr. phil. Siegfried Kramer (†2020); nach seinem Tod fortgeführt von\n" +
    "> Veit Kramer-Schöggl. Privates, nicht-kommerzielles Forschungsprojekt,\n" +
    "> Lizenz CC BY 4.0. Website: https://hexenprozesse.at";

  const llmsIndex = (faelle) => {
    const z = [
      "# hexenprozesse.at — Steirische Hexenprozesse des 17. Jahrhunderts",
      "",
      KOPF,
      ">",
      "> Alle Protokolltexte in einem Dokument: https://hexenprozesse.at/llms-full.txt",
      "",
      "## Prozesse",
    ];
    for (const f of faelle) {
      const pr = d.prozesse[f.datei] || {};
      const zusatz = [pr.ort, ausgangText(pr.ausgang)].filter(Boolean).join(", ");
      z.push(`- [${f.name} (${f.jahr})](${seiteZuUrl(`pages/prozesse/${f.datei}`)})${zusatz ? `: ${zusatz}` : ""}`);
    }
    z.push("", "## Themen");
    for (const rel of themenSeiten()) z.push(`- [${titelVon(rel)}](${seiteZuUrl(rel)})`);
    z.push("", "## Weitere Seiten");
    for (const rel of weitereSeiten()) z.push(`- [${titelVon(rel)}](${seiteZuUrl(rel)})`);
    return z.join("\n") + "\n";
  };

  const llmsVoll = (faelle) => {
    const teile = [
      "# Steirische Hexenprozesse — Volltext-Korpus",
      "",
      KOPF,
      ">",
      `> Automatisch beim Build erzeugt aus allen Prozessseiten: ${faelle.length} Verfahren`,
      "> in chronologischer Folge. Je Eintrag die Eckdaten (Ort, Beschuldigte,",
      "> Anklage, Ausgang, Quelle) und der vollständige übertragene Protokolltext.",
      "",
    ];
    for (const fall of faelle) {
      const html = readFileSync(fromSrc("pages", "prozesse", fall.datei), "utf-8");
      teile.push("---", "", metaBlock(fall), inhaltAlsMarkdown(html), "");
    }
    return teile.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
  };

  return {
    name: "llms-dateien",
    generateBundle() {
      const faelle = faelleLesen();
      this.emitFile({ type: "asset", fileName: "llms.txt", source: llmsIndex(faelle) });
      this.emitFile({ type: "asset", fileName: "llms-full.txt", source: llmsVoll(faelle) });
    },
  };
}

// Plugin: Traegt width/height sowie loading="lazy" an die Inhaltsbilder
// einer Seite ein.
//
// width/height kommen aus den echten Pixelmassen der Datei. Ohne diese
// Angaben kann der Browser vor dem Laden keinen Platz reservieren ->
// Layout-Shift (CLS), ein Core-Web-Vitals-Wert.
//
// loading="lazy" bekommt jedes Bild AUSSER dem ersten der Seite: Das erste
// Bild ist typischerweise der LCP-Kandidat (Largest Contentful Paint,
// ebenfalls ein Core-Web-Vitals-Wert) -- wuerde ausgerechnet dieses Bild
// lazy geladen, verzoegert der Browser bewusst die Ressource, die fuer den
// groessten Lade-Meilenstein der Seite zaehlt. Alle folgenden Bilder sind
// typischerweise nicht sofort sichtbar und profitieren vom Aufschub.
//
// Beides zur Bauzeit statt einmalig ins Markup geschrieben, damit ein neu
// hinzugefuegtes Bild automatisch seine Masse und sein Lazy-Verhalten
// bekommt und der Quelltext der Seiten schlank bleibt. Das CSS setzt img
// global auf height:auto, deshalb skaliert das Bild weiter responsiv -- die
// width/height-Attribute liefern nur das Seitenverhaeltnis fuer die
// Platzreservierung.
function bildMassePlugin() {
  const cache = new Map();

  // JPEG/PNG-Pixelmasse aus den Dateibytes. Gegen Pillow auf allen Bildern
  // dieses Repos geprueft (identisch) -- so bleibt der Reader ohne Abhaengigkeit.
  const bildMasse = (buf) => {
    if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }; // PNG: IHDR
    }
    if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let o = 2;
      while (o + 9 < buf.length) {
        if (buf[o] !== 0xff) { o++; continue; }
        const marker = buf[o + 1];
        if (marker === 0xff) { o++; continue; }
        if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
          o += 2; continue;
        }
        const len = buf.readUInt16BE(o + 2);
        if (len < 2) break;
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { h: buf.readUInt16BE(o + 5), w: buf.readUInt16BE(o + 7) }; // SOF
        }
        o += 2 + len;
      }
    }
    return null;
  };

  const masse = (src) => {
    if (cache.has(src)) return cache.get(src);
    let res = null;
    try {
      res = bildMasse(readFileSync(fromSrc("assets", src.replace(/^\//, ""))));
    } catch {
      res = null; // Datei fehlt -> Bild bleibt ohne Masse
    }
    cache.set(src, res);
    return res;
  };

  return {
    name: "bild-masse",
    transformIndexHtml(html) {
      let ersteSeitenBildGesehen = false;
      return html.replace(/<img\b[^>]*>/gi, (tag) => {
        const istInhaltsbild = /\ssrc="\/images\/[^"]+"/i.test(tag);

        // Schritt 1: width/height ergaenzen (unabhaengig vom Lazy-Schritt).
        if (istInhaltsbild && !/\b(width|height)=/i.test(tag)) {
          const m = tag.match(/\ssrc="(\/images\/[^"]+)"/i);
          const d = m && masse(m[1]);
          if (d && d.w && d.h) {
            tag = tag.replace(/<img\b/i, `<img width="${d.w}" height="${d.h}"`);
          }
        }

        // Schritt 2: loading="lazy" ergaenzen, ausser beim ersten Inhaltsbild
        // der Seite (LCP-Kandidat, siehe Kommentar oben).
        if (istInhaltsbild && !/\bloading=/i.test(tag)) {
          if (ersteSeitenBildGesehen) {
            tag = tag.replace(/<img\b/i, `<img loading="lazy"`);
          } else {
            ersteSeitenBildGesehen = true;
          }
        }

        return tag;
      });
    },
  };
}

// Auto-discover all HTML pages under src/ so new prozess-/themen-Seiten
// automatisch ins Build wandern. Es muss nur die Datei in src/pages/...
// existieren — kein Eintrag hier nötig.
function collectHtmlEntries() {
  const entries = { main: fromSrc("index.html") };
  // 404-Seite liegt bewusst im Wurzelverzeichnis (nicht unter pages/), damit
  // sie als dist/404.html gebaut wird und Plesk sie als error_page nutzen kann.
  const fehlerseite = fromSrc("404.html");
  if (existsSync(fehlerseite)) entries["404"] = fehlerseite;

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
  plugins: [
    htmlIncludePlugin(),
    prozessZahlenPlugin(),
    personenregisterPlugin(),
    seoDateienPlugin(),
    strukturDatenPlugin(),
    llmsDateienPlugin(),
    bildMassePlugin(),
  ],

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
