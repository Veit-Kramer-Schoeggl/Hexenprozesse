# Projekt-Kontext für Claude Code

Diese Datei wird beim Start einer Claude-Session automatisch geladen.
Sie soll einer neuen Instanz alles Wissen geben, das nicht aus dem Code
selbst hervorgeht.

## Was das ist

Statische Website **`hexenprozesse.at`** — Forschungsarbeit von Siegfried
Kramer (Vater des Repo-Eigentümers Veit) zu steirischen Hexenprozessen
des 17. Jahrhunderts. Eine moderne Neufassung der historischen Site:
über 40 Prozessdossiers (Originalprotokolle + Übersetzungen),
Themenseiten und Bildmaterial.

Veit pflegt das Repo nach dem Tod des Vaters; primäres Ziel ist
**Erhalt der Inhalte**, nicht aktive Weiterentwicklung. Trotzdem: jede
Änderung soll deploybar bleiben.

## Tech-Stack

- **Vite v8.0.10** als Build-Tool (Multi-Page-Setup)
- **Node.js ≥ 20.19** (in Plesk eingestellt)
- **Pures HTML/CSS** — kein Framework, kein React/Vue/Astro
- **Vanilla JS** in `src/scripts/main.js` (ein einziges Mini-Modul)
- **CSS** mit Design-Tokens (`:root`-Variablen), mobile-first responsive

## Verzeichnis-Struktur

```
Homepage_Repo/
├── src/                   ← Quelle, hier wird editiert
│   ├── index.html
│   ├── pages/
│   │   ├── prozesse/      ← 41 Prozessseiten + index.html
│   │   ├── themen/        ← gerichtswesen, bannrichter, literatur
│   │   ├── kontakt.html, ueberblick.html, impressum.html,
│   │   │   fragenkatalog.html, links.html
│   ├── styles/main.css
│   ├── scripts/main.js
│   ├── partials/          ← header.html, footer.html (Doku-Schnipsel)
│   └── assets/
│       └── images/
│           ├── hauptseite/  ← 69 Bilder
│           └── <slug>/      ← pro Prozess
├── dist/                  ← Build-Output (siehe Hinweis unten!)
├── docs/
│   ├── architektur.md
│   └── content-quellen.md
├── vite.config.js         ← Auto-Discovery aller src/pages/**.html
├── package.json
├── package-lock.json      ← committed für reproducible builds
├── .gitignore .gitattributes .editorconfig
├── LICENSE.md             ← CC BY 4.0
├── README.md
└── CLAUDE.md              ← diese Datei
```

## Wichtige Konventionen / Fallstricke

### `dist/` ist committed (bewusste Entscheidung)

Veit hat `dist/` aus der `.gitignore` entfernt. Plesk pulled also den
fertigen Build mit, und führt zusätzlich `npm install && npm run build`
aus — der zweite Lauf überschreibt den committeten `dist/` mit dem
serverseitigen Build. Das ist eine Sicherheitsnetz-Variante: falls Plesk
mal Node-Probleme hat, läuft die Site auch ohne erfolgreichen Server-Build.

**Konsequenz:** vor jedem Commit `npm run build` laufen lassen, sonst
wird ein veralteter `dist/` mitcommitted.

### Vite-Config nutzt Auto-Discovery

`vite.config.js` walked rekursiv durch `src/pages/` und nimmt jede
`.html` als Build-Entry. Eine neue Prozessseite hinzufügen heißt also:

1. Datei unter `src/pages/prozesse/<slug>.html` anlegen (Vorlage:
   irgendeine bestehende Prozessseite kopieren)
2. Eintrag in `src/pages/prozesse/index.html` als `<li>` ergänzen
3. `npm run build`, commit, push

**Kein** `vite.config.js`-Update nötig.

### CSS / Pfade

- `base: "/"` (Domain-Root). Funktioniert auf `hexenprozesse.at`.
- `publicDir: "assets"` — `src/assets/` wird 1:1 nach `dist/` kopiert.
  Bilder im HTML als `/images/<slug>/foo.jpg` referenzieren (root-relativ).
- CSS/JS werden von Vite gehasht (`main-bda6uE_q.css`) — Cache-Busting.

### Scripts brauchen `type="module"`

Sonst überspringt Vite sie beim Bundling. Beispiel:

```html
<script type="module" src="scripts/main.js"></script>
```

### Latin-1 vs. UTF-8

Einige der Original-Quelldateien (`HP 2017-09/*.htm`) sind Latin-1 — das
Migrations-Skript hat das schon dekodiert. Jede neue Seite in `src/`
**muss UTF-8** sein (siehe `.editorconfig`).

## Build / Dev / Deploy

```bash
npm install        # einmalig
npm run dev        # http://localhost:8080 mit Hot-Reload
npm run build      # → dist/
npm run preview    # Production-Build lokal testen
npm run format     # Prettier (falls verfügbar)
```

## Plesk-Deployment

**Domain:** `hexenprozesse.at` (nginx vor Apache).

In Plesk → Domain → Git:
- **Bereitstellungspfad:** `httpdocs` (Default — Repo wird hier geklont)
- **Bereitstellungsmodus:** Automatisch beim Push nach `main`
- **Zusätzliche Bereitstellungsaktionen:**
  ```
  npm install && npm run build
  ```

In Plesk → Domain → Hosting & DNS → Hosting-Einstellungen:
- **Document Root:** `httpdocs/dist`  ← *wichtig*, sonst liefert Plesk
  den gesamten Repo-Inhalt aus statt nur des Build-Outputs.

Node-Version ≥ 20.19 muss in Plesk aktiviert sein (Node.js-Toolkit).

### Caching-Falle

Plesk/nginx liefert HTMLs ohne `Cache-Control`-Header. Browser cachen
also aggressiv → nach Änderungen sieht man die alte Version, bis
`Ctrl + Shift + R` (Hard-Refresh).

**Optionaler Fix** in Plesk → Apache & nginx → Zusätzliche nginx-Direktiven:
```nginx
location ~* \.html$ {
    add_header Cache-Control "no-cache, must-revalidate";
    expires 0;
}
location ~* \.(css|js|jpg|jpeg|png|gif|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Inhaltliche Quellen (außerhalb des Repos)

Der Repo selbst ist self-contained, aber wenn Inhalte korrigiert oder
ergänzt werden sollen, sind die Original-Quellen unter:

```
~/Desktop/Papa/Hexenprozesse/
├── 01_Archiv/
│   ├── PLANUNG.md            ← konsolidierte Todos vom Vater
│   ├── PHPsicherung/         ← live-Site-Sicherung 2011-03-21
│   ├── W10T/                 ← Bilder-Snapshot (Fallback bei Migration)
│   ├── X-Juli-2012/          ← Arbeitsstand 07/2012
│   ├── Buchkopien/, Handschriftl. Originalprotokolle/, Magische Welt/
│   └── ...
├── 02_Fotos/                 ← 2 295 Bilder, 7,9 GB, 85 Orts-Ordner
│   └── 1Auswahl HP neu/HP Fotos Hauptseite 2017/  ← kuratierte Auswahl
├── 03_Bearbeitung_Aktuell/
│   └── HP 2017-09/           ← finaler Live-Stand 2017 (Migrations-Quelle!)
├── 04_Google_Drive/          ← Forschungsdokumente, Übersetzungen
└── Hompage/                  ← alte Organisations-Struktur
```

`docs/content-quellen.md` im Repo dokumentiert das Mapping detailliert.

Migrations-Skripte (für Audit-Spur, nicht im Repo):
- `~/Desktop/Papa/migrate_homepage.py` — HP 2017-09 → src/
- `~/Desktop/Papa/migrate_themen.py` — .doc-Themen → src/pages/themen/

## Git-Konventionen (für Claude)

- Veit muss explizit `commit` oder `push` sagen — nicht proaktiv pushen.
- Vor `commit`: `npm run build` laufen lassen (sonst veralteter `dist/`).
- Commit-Messages auf Deutsch, mehrzeilig, Was-und-Warum.
- `--amend` nur wenn explizit gewünscht (Veit hat den Push schon mehrfach
  gemacht, neue Commits sind sicherer).

## Repo-Remote

```
origin  git@github.com:Veit-Kramer-Schoeggl/hexenprozesse.git
```

## Stand der Inhalte (April 2026)

- **41 Prozessseiten** (Andreas Zechner I+II, Byloff I-IV, Pöllinger,
  Glaser, Mosegger, Wed I+II, Hörk, Glanitschnigg etc.)
- **3 Themenseiten** (Gerichtswesen, Bannrichter, Literatur-Empfehlungen)
- **5 Standalone-Seiten** (Start, Überblick, Kontakt, Impressum, Links,
  Fragenkatalog)
- **323 Bilder** verteilt auf `assets/images/<slug>/`-Ordner
- Build: ~445 Files / 45 MB / 240 ms

## Was bewusst fehlt

- Kein CMS, keine Admin-UI — Inhalte werden in `src/` editiert
- Kein Tracking / Analytics
- Keine Server-Komponente — nur statisches HTML
- Kein TypeScript / Linter / Tests — Site ist primär dokumentarisch
