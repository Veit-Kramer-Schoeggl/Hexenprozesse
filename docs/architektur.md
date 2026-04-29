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

## Erweiterung um einen Build-Schritt (optional)

Spätestens wenn 10+ Prozessseiten existieren, lohnt sich ein kleiner
Generator: jede Seite besteht dann aus ihrem Inhalt + dem zentralen
Header/Footer-Partial. Vorschlag:

- **Eleventy (11ty)** — Markdown + Nunjucks-Templates, Output ist Static
  HTML. `npm install --save-dev @11ty/eleventy`, dann
  `src/_includes/layout.njk` als Layout, jede Seite mit
  `---\nlayout: layout.njk\n---` im Frontmatter.
- **Astro** — moderner, mehr Boilerplate, kann mit JS-Frameworks erweitert
  werden. Overkill für eine Textseite.
- **Eigener Mini-Build** in `tools/build.mjs`: liest Partials und ersetzt
  `<!-- partial:header -->`-Marker in jeder HTML-Seite. Erspart das
  Vendoring eines Frameworks.

## Deploy-Targets

| Hoster              | Setup                                            |
|---------------------|--------------------------------------------------|
| GitHub Pages        | Branch `main`, Pfad `/src` als Pages-Root        |
| Netlify             | Build cmd: leer · Publish dir: `src`             |
| Cloudflare Pages    | Build cmd: leer · Output: `src`                  |
| Klassisches Webhosting | `src/` per FTP nach `htdocs/` kopieren        |

## Was bewusst NICHT da ist

- **Kein React/Vue/Next.js** — die Site hat keinen Anwendungs-Charakter.
- **Kein CMS** — Inhalte kommen aus den Forschungs­dokumenten in
  `01_Archiv/`, nicht aus einer Web-Oberfläche.
- **Keine Tracker** — Datenschutz-by-Default; Webserver-Logs reichen.
