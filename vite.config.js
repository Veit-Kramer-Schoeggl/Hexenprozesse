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
  plugins: [htmlIncludePlugin()],

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
