# Hexenprozesse — Homepage

Statische Website über die steirischen Hexenprozesse. Inhalte ursprünglich
von Dr. phil. Siegfried Kramer, ehemals unter `hexenprozesse.at` veröffentlicht.

Dieses Repository ist die **moderne Neufassung** der Site. Die historischen
Originaldateien liegen *außerhalb* des Repos unter
`../01_Archiv/PHPsicherung/` bzw. `../01_Archiv/X-Juli-2012/` und werden hier
nur als Inhalts­quellen referenziert (siehe `docs/content-quellen.md`).

## Schnellstart

```bash
# Einmalig: Abhängigkeiten installieren (Vite v8)
npm install

# Lokalen Dev-Server starten (Hot-Reload, http://localhost:8080)
npm run dev

# Produktions-Build erzeugen -> dist/
npm run build

# Den Produktions-Build lokal vorschauen
npm run preview

# Quellcode formatieren
npm run format
```

Voraussetzung: Node.js ≥ 20.19.

## Verzeichnis­struktur

```
Hexenprozesse/
├── src/                    Quelldateien (das, was im Editor angefasst wird)
│   ├── index.html          Startseite
│   ├── pages/
│   │   ├── kontakt.html, impressum.html, ueberblick.html, ...
│   │   ├── prozesse/       Eine Datei je Hexenprozess (41 Stück)
│   │   └── themen/         Gerichtswesen, Bannrichter, Literatur
│   ├── partials/           Wiederverwendbare HTML-Schnipsel (Header, Footer)
│   ├── styles/main.css     Stylesheet
│   ├── scripts/main.js     JavaScript
│   └── assets/images/      Bilder (werden nach dist/ kopiert)
├── dist/                   Build-Output (committed als Fallback)
├── docs/                   Dokumentation
│   ├── architektur.md
│   └── content-quellen.md
├── vite.config.js          Build-Konfiguration mit HTML-Include-Plugin
├── package.json
├── package-lock.json
├── CLAUDE.md               Kontext für Claude Code
└── README.md
```

## Partials-System

Header und Footer werden zentral in `src/partials/` definiert und per
Vite-Plugin zur Build-Zeit in alle Seiten eingefügt.

**Verwendung in HTML:**
```html
@@include('header')
<!-- Seiteninhalt -->
@@include('footer')
```

**Vorteile:**
- Änderungen an der Navigation nur an einer Stelle (`partials/header.html`)
- Konsistente Links durch absolute Pfade (`/pages/...`)
- Kein JavaScript-Laden zur Laufzeit (SEO-freundlich)

## Designprinzipien

1. **Statisch & portabel** — reine HTML/CSS, keine Runtime-Abhängigkeit
2. **Quelle vs. Build** — `src/` ist die Wahrheit; editiert wird nur dort
3. **Wiederverwendung über Partials** — Header/Footer zentral definiert
4. **Mobile-first, responsive** — `main.css` mit Design-Tokens
5. **Keine Build-Pflicht für Inhalt** — Partials werden beim Build ersetzt

## dist/ ist committed (bewusste Entscheidung)

`dist/` wurde aus der `.gitignore` entfernt. Plesk pulled den fertigen Build
mit und führt zusätzlich `npm install && npm run build` aus. Das ist ein
Sicherheitsnetz: falls der Server Node-Probleme hat, läuft die Site trotzdem.

**Wichtig:** Vor jedem Commit `npm run build` laufen lassen!

## Deployment

### Plesk (mit Git-Integration + Auto-Build)

1. In Plesk → **Websites & Domains** → Domain → **Git**
2. Repository hinzufügen (SSH-URL)
3. **Bereitstellungsmodus:** Automatisch beim Push
4. **Bereitstellungspfad:** `httpdocs` (Repo wird hier geklont)
5. **Document Root:** `httpdocs/dist` (nur Build-Output ausliefern)
6. **Zusätzliche Bereitstellungsaktionen:**
   ```
   npm install && npm run build
   ```
7. Node.js ≥ 20.19 aktivieren (Plesk Node.js-Toolkit)

### Andere Hoster

| Hoster              | Build-Befehl    | Publish-Dir |
|---------------------|-----------------|-------------|
| Netlify             | `npm run build` | `dist`      |
| Cloudflare Pages    | `npm run build` | `dist`      |
| Vercel              | `npm run build` | `dist`      |
| GitHub Pages        | via Action      | `dist`      |

## Neue Seite hinzufügen

1. HTML-Datei in `src/pages/` anlegen (bestehende als Vorlage)
2. `@@include('header')` und `@@include('footer')` verwenden
3. `npm run build` ausführen
4. Commit und Push

Kein Eintrag in `vite.config.js` nötig — das Plugin entdeckt alle `.html`
automatisch.

## Lizenz / Urheberrecht

**Inhalte:** Dr. phil. Siegfried Kramer — CC BY 4.0 (siehe `LICENSE.md`)

**Code:** MIT
