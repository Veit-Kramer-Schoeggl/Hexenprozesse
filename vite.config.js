import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fromSrc = (...parts) => resolve(__dirname, "src", ...parts);

// Multi-page Build:
// jede HTML-Datei wird zu einem Entry. Beim Hinzufügen neuer Seiten den
// `input`-Eintrag ergänzen — sonst werden sie nicht gebaut.
export default defineConfig({
  root: "src",
  // base "/" für Deployment auf Domain-Root (z. B. https://hexenprozesse.at/).
  // Falls die Site in einem Unterordner läuft, hier "./" oder den Pfad setzen.
  base: "/",
  // publicDir: src/assets/ wird beim Build 1:1 (ohne Hashing) nach dist/
  // kopiert. Bilder daher als <img src="/images/foo.jpg"> referenzieren —
  // physisch unter src/assets/images/foo.jpg.
  publicDir: "assets",

  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: fromSrc("index.html"),
        kontakt: fromSrc("pages/kontakt.html"),
        prozesseIndex: fromSrc("pages/prozesse/index.html"),
        zechner: fromSrc("pages/prozesse/zechner.html"),
      },
    },
  },

  server: {
    port: 8080,
    open: false,
  },
});
