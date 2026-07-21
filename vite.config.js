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
    const eintraege = [];
    const re = /<li([^>]*)><a href="\.\/[^"]+">([\s\S]*?)<\/a><\/li>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      // Sprachvarianten sind derselbe Fall in einer anderen Sprache
      if (/data-sprachvariante/.test(m[1])) continue;
      const name = m[2]
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (name) eintraege.push(name);
    }
    return {
      "@@prozessAnzahl": String(eintraege.length),
      "@@prozessErster": eintraege[0] || "",
      "@@prozessLetzter": eintraege[eintraege.length - 1] || "",
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
  plugins: [htmlIncludePlugin(), prozessZahlenPlugin()],

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
