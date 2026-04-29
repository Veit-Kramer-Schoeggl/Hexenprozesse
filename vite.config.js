import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fromSrc = (...parts) => resolve(__dirname, "src", ...parts);

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
