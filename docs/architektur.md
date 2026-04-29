# Architektur

## Ziel

Eine reine Static-HTML-Seite, die ohne Server, ohne Datenbank und ohne
Build-Tool funktioniert — und sich trotzdem strukturiert pflegen lässt.

## Schichten

```
┌──────────────────────────────────────────────────────────┐
│  src/index.html · src/pages/**.html                      │  Inhalt + Struktur
├──────────────────────────────────────────────────────────┤
│  src/styles/main.css                                      │  Visuelles Design
├──────────────────────────────────────────────────────────┤
│  src/scripts/main.js                                      │  optionales JS
├──────────────────────────────────────────────────────────┤
│  src/assets/                                              │  Bilder, Fonts
└──────────────────────────────────────────────────────────┘
```

## Konventionen

- **Eine Seite = eine Datei** unter `src/pages/…/<slug>.html`. Slugs in
  Kleinbuchstaben, Bindestriche statt Leerzeichen (`zechner.html`,
  nicht `Zechner Stefan.html`).
- **Eine Quelle der Wahrheit fürs Layout** — Header und Footer leben in
  `src/partials/`. Wenn manuell kopiert, beim Ändern überall nachziehen
  (oder einen kleinen Build-Schritt ergänzen, siehe unten).
- **CSS ist Schichten**: erst Tokens (`:root`), dann Reset, dann Komponenten.
  Komponenten sind klassenbasiert (`.card`, `.prozess-header`) — keine
  ID-Selektoren fürs Styling.
- **Klassen statt Inline-Styles**. Wenn ein Word-Import `style="…"` mitbringt,
  diese Werte beim Migrieren nach CSS überführen.
- **Bilder relativ** zur jeweiligen Seite oder über absolute Pfade ab `src/`.

## Build (Vite, MPA)

Die Site wird mit **Vite v8** im Multi-Page-Modus gebaut. Konfig in
`vite.config.js`:

- `root: "src"` — Vite betrachtet `src/` als Wurzel
- `publicDir: "assets"` — `src/assets/` wird 1:1 ohne Hashing nach `dist/`
  kopiert. Bilder: `<img src="/images/foo.jpg">` → physisch
  `src/assets/images/foo.jpg`
- `build.outDir: "../dist"` — Output landet im Repo-Root unter `dist/`
- `build.rollupOptions.input` — *jede* HTML-Seite muss hier eingetragen
  werden, sonst wird sie nicht gebaut

### Neue Seite hinzufügen

1. HTML-Datei unter `src/pages/...` anlegen (Vorlage: `zechner.html`).
2. In `vite.config.js` einen Eintrag in `rollupOptions.input` ergänzen:
   ```js
   poellinger: fromSrc("pages/prozesse/poellinger.html"),
   ```
3. In `src/pages/prozesse/index.html` Listen-Eintrag verlinken.
4. `npm run dev` zum Testen, dann committen.

### Bilder, CSS, JS

| Was                          | Wohin                       | URL im HTML                |
|------------------------------|-----------------------------|----------------------------|
| Statische Bilder/Fonts/PDFs  | `src/assets/...`            | `/images/foo.jpg` (root-relativ) |
| In CSS importierte Assets    | beliebig unter `src/`        | per `url(...)` in CSS      |
| ES-Module (JS)               | `src/scripts/...`            | `<script type="module" src="...">` |
| CSS                          | `src/styles/main.css`       | `<link href="styles/main.css">` |

Vite hasht und bundlet alles, was über `<link>`/`<script type="module">`
oder `import` referenziert wird. Inhalte aus `publicDir` werden nicht
verarbeitet.

### Wann lohnt sich ein Generator (Eleventy / Astro)?

Bei 10+ Prozessseiten mit identischem Header/Footer wird das manuelle
Pflegen lästig. Optionen:

- **Eleventy (11ty)** — Markdown + Nunjucks. Inhalte als `.md`,
  Layout in `_includes/`. Lässt sich leicht **neben** Vite betreiben:
  11ty erzeugt HTML, Vite optimiert CSS/JS.
- **Astro** — komponentenbasiert, kann mit Vite-Plugin als Drop-In
  laufen. Mehr Boilerplate, mächtiger.
- **Vite Plugin Handlebars / EJS** — Partials direkt in Vite.

Empfehlung: erst migrieren wenn 10+ Seiten redundantes Markup haben.

## Deploy-Targets

| Hoster              | Build cmd          | Publish dir | Hinweis                          |
|---------------------|--------------------|-------------|----------------------------------|
| **Plesk + Git**     | `npm install && npm run build` | `httpdocs/dist` | siehe README → Plesk |
| Netlify             | `npm run build`    | `dist`      | Auto-Detect-Vite               |
| Cloudflare Pages    | `npm run build`    | `dist`      | Node ≥ 20 in Build-Settings     |
| GitHub Pages        | via Action         | `dist`      | `actions/deploy-pages`          |
| Klassisches FTP     | lokal `npm run build` | Inhalt von `dist/` | manuell hochladen      |

## Was bewusst NICHT da ist

- **Kein React/Vue/Next.js** — die Site hat keinen Anwendungs-Charakter.
- **Kein CMS** — Inhalte kommen aus den Forschungs­dokumenten in
  `01_Archiv/`, nicht aus einer Web-Oberfläche.
- **Keine Tracker** — Datenschutz-by-Default; Webserver-Logs reichen.
