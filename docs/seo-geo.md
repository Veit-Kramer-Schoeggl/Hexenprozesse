# SEO und GEO — Aufgabenliste

Stand der Bestandsaufnahme: Juli 2026. Grundlage sind zwei externe
Reviews (eine Gemini-Analyse, eine zweite kritische Durchsicht) plus eine
eigene Prüfung direkt an der Codebasis. Dieses Dokument hält fest, was
**wirklich fehlt**, was schon **erledigt** ist, und was in den Reviews
**überbewertet** wurde — damit keine Arbeit in Dinge fließt, die bei
einem statischen Vite-Setup wenig bringen.

GEO = Generative Engine Optimization: Auffindbarkeit und korrekte
Zitierbarkeit durch KI-Systeme (ChatGPT, Perplexity, Claude, Googles
AI-Overviews). SEO = klassische Suchmaschinenoptimierung, hier vor allem
für Google.

## Ausgangslage — was schon gut ist

Aus der eigenen Prüfung, nicht aus den Reviews übernommen, sondern
nachgezählt:

- **Reines statisches HTML.** Der gesamte Protokolltext steht im
  Quelltext, nicht hinter JavaScript. Das ist die beste Basis, die es für
  Crawler und KI gibt — nichts muss gerendert werden.
- **Spezifische `<title>` und `meta description` auf fast allen Seiten.**
  Von 36 Prozessseiten haben nur zwei eine zu dünne Description
  (Zechner I und II) — siehe Aufgabe 6.
- **`<html lang>` auf allen 53 Seiten gesetzt** (de bzw. sl).
- **Genau ein `<h1>` pro Seite**, saubere Überschrift-Hierarchie.
- **`<figure>` + `<figcaption>` durchgehend** — Bild und Beschreibung
  sind bereits maschinell verknüpft. (Die Review fragte, ob das so ist;
  es ist so.)
- **Dichte, selbststehende Absätze** in den Anmerkung-Kästen, starke
  Quellenangaben, internes Cross-Linking, chronologische Nachbarschaft.
  Das ist genau das, was GEO fordert, und muss nicht mehr gebaut werden.

Die technische Grundlage ist also überdurchschnittlich. Was folgt, ist
Feinschliff, kein Umbau.

---

## Priorität 1 — fehlt ganz, hoher Nutzen, geringes Risiko

### 1. `robots.txt` anlegen

Existiert nicht. Ohne Datei ist implizit alles erlaubt, aber eine
explizite Datei ist das Standardsignal und trägt den Verweis auf die
Sitemap.

- Ablage: `src/assets/robots.txt` (wird von Vite 1:1 nach `dist/` kopiert,
  `publicDir: "assets"`).
- KI-Crawler **nicht** aussperren — das ist hier erwünscht: GPTBot,
  ClaudeBot, PerplexityBot, Google-Extended, CCBot dürfen lesen.
- Zeile `Sitemap: https://hexenprozesse.at/sitemap.xml` aufnehmen.

### 2. `sitemap.xml` generieren

Existiert nicht. Wichtigster einzelner Hebel, um Google die 53 Seiten
vollständig und schnell bekannt zu machen — und um die alte, noch
indexierte WordPress-Version (siehe Aufgabe 12) zu verdrängen.

- **Nicht** von Hand pflegen, sondern beim Build erzeugen — nach dem
  Muster von `prozessZahlenPlugin` / `personenregisterPlugin` in
  `vite.config.js`. Ein kleines eigenes Plugin, das die gebauten
  HTML-Dateien einsammelt und die XML schreibt, ist besser als eine
  Abhängigkeit (`vite-plugin-sitemap`), die gepflegt werden muss.
- `lastmod` je Seite aus dem Git-Datum der Quelldatei ziehen.
- Die slowenische Fassung (`wed-2.html`) gehört mit hinein, aber mit
  `hreflang`-Bezug zur deutschen (siehe Aufgabe 9).

### 3. `llms.txt` und `llms-full.txt` anlegen

Existiert nicht. Für dieses Projekt tatsächlich lohnend — anders als bei
vielen Websites, wo es Deko ist. Wir haben eine klar abgegrenzte,
strukturierte Sammlung, und die Kartei `denunziationen.json` liefert die
Daten schon fertig.

- `src/assets/llms.txt`: kurzes Markdown-Dokument — was das Projekt ist
  (Forschungsarbeit Siegfried Kramers zu steirischen Hexenprozessen des
  17. Jahrhunderts, Originalprotokolle mit Übertragung), wer es
  weiterführt, plus eine Linkliste der Prozesse, Themenseiten und des
  Registers.
- `src/assets/llms-full.txt`: alle Protokolle in einem einzigen sauberen
  Markdown-Dokument. Wenn jemand eine KI bittet, „die steirischen
  Hexenprozesse zusammenzufassen und sich auf hexenprozesse.at zu
  beziehen“, füttert sie sich hieraus — halluzinationsärmer als aus
  gecrawlten Einzelseiten.
- **Beides beim Build erzeugen**, damit es nie veraltet. Die Prozessliste
  und die Kartei sind die Quelle; das gleiche Plugin, das die Sitemap
  baut, kann die llms-Dateien mitschreiben.

### 4. JSON-LD (strukturierte Daten) einbauen

Fehlt komplett (0 Vorkommen von `application/ld+json`). Der wertvollste
GEO-Baustein, den wir noch nicht haben: Er macht die Entitäten — Person,
Ort, Datum, Rolle — maschinenlesbar, statt sie nur im Fließtext zu
lassen.

Pro Prozessseite ein `<script type="application/ld+json">` im `<head>`,
**beim Build aus `denunziationen.json` erzeugt** (alle Daten liegen dort
schon: Beschuldigte, Bannrichter, Jahr, Ort, Koordinaten, Ausgang):

- Typ `Article` (oder spezifischer, siehe unten) mit `headline`,
  `datePublished` des Verfahrens, `author` (Siegfried Kramer als
  Übersetzer/Bearbeiter), `isBasedOn` (das Archiv-Original),
  `inLanguage`.
- `about` / `mentions`: die im Verfahren genannten Personen als
  `Person`-Entitäten mit Rolle. Das speist Googles Knowledge Graph und
  die Entity-Erkennung der LLMs direkt.
- `spatialCoverage` mit den geprüften Koordinaten, die wir ohnehin haben.
- Auf der Startseite / Prozessliste: `CollectionPage` mit einer
  `ItemList` der 36 Verfahren.
- **`BreadcrumbList`** je Unterseite (Start › Prozesse › Dionys). Billig
  und hilft Google, die Hierarchie zu verstehen.

Hinweis zum Typ: `Article` ist sicher und wird breit verstanden. Die von
der Review genannten `ScholarlyArticle` / `HistoricalArticle` sind
zulässige Subtypen, bringen aber keinen zusätzlichen Rich-Result-Vorteil.
Im Zweifel `Article` mit gutem `about`/`mentions` — die Entitäten zählen
mehr als der Subtyp.

---

## Priorität 2 — vorhanden, aber verbesserungswürdig

### 5. `rel="canonical"` in jeden `<head>`

Fehlt. Verhindert, dass `hexenprozesse.at/` und
`hexenprozesse.at/index.html` als zwei Seiten gewertet werden, und
bündelt alle Signale auf eine URL.

- Am einfachsten pro Seite als self-referenzierender Canonical mit der
  absoluten URL. Lässt sich beim Build aus dem Dateipfad ableiten.
- **Kritische Korrektur zur Review:** Der beobachtete Unterschied
  zwischen `/` und `/index.html` („35 dokumentierte“ vs. „Über 40“,
  andere Nav) war **kein zweiter Build-Stand**, sondern eine
  **veraltete, gecachte Version** (die „Über 40“-Zahl und die
  Login-Maske stammen beide aus dem alten WordPress-Stand). Vite baut nur
  eine `index.html`. Canonical ist trotzdem richtig — aber die eigentliche
  Ursache ist Cache/Alt-Index, nicht ein Live-Duplikat. Siehe Aufgaben 11
  und 12.

### 6. Zwei dünne Descriptions nachziehen

- `zechner-andreas-1.html`: description ist nur „Andreas Zechner I“.
- `zechner-andreas-2.html`: nur „Prozess gegen Andreas Zechner“.

Beide auf einen fallbeschreibenden Satz bringen, wie ihn die übrigen 34
Seiten haben. Fünf Minuten.

### 7. Bild-`alt`-Texte: 65 leere prüfen

218 Bilder haben einen gefüllten `alt`, **65 sind leer** — durchgehend
solche, die eine `figcaption` daneben haben (Glaser 14, Zechner I 4,
Dionys 5 …).

**Nuanciert, nicht einfach „falsch“:** Ein leeres `alt` bei einem Bild
mit sichtbarer Bildunterschrift ist für Screenreader vertretbar (vermeidet
Doppelung). Für SEO/GEO ist ein beschreibender `alt` aber besser, weil
Google-Bildersuche und LLMs ihn getrennt auswerten. Da die `figcaption`
schon einen guten Text trägt, ist die naheliegende Lösung, den
`figcaption`-Text als Ausgangspunkt für den `alt` zu nehmen (nicht
wörtlich kopieren, sondern als knappe Bildbeschreibung). Lässt sich
halbautomatisch mit einem Skript vorbereiten und dann durchsehen.

### 8. `width`/`height` an Content-Bildern (Core Web Vitals)

**0 von 283** Bildern haben `width`/`height`. Ohne diese Angaben kann der
Browser vor dem Laden keinen Platz reservieren → Layout-Shift (CLS), einer
der drei Core-Web-Vitals-Werte, die Google direkt als Rankingfaktor
nutzt.

- Die echten Pixelmaße lassen sich per Skript aus den Dateien lesen und
  als Attribute einsetzen (einmalig, dann im Markup fest).
- Zusammen mit `loading="lazy"` (steht auf den Kacheln schon) deckt das
  den Bildteil von Core Web Vitals weitgehend ab.

### 9. `hreflang` zwischen deutscher und slowenischer Wed-Seite

In beiden Reviews nicht erwähnt, aber der korrekte Umgang mit der einen
zweisprachigen Seite: `wed.html` und `wed-2.html` sollten sich per
`<link rel="alternate" hreflang="…">` gegenseitig als
Sprachvarianten ausweisen. Sonst wertet Google sie als Duplikat oder
konkurrierende Seiten. Klein, aber sauber — und relevant, sobald die
englische Fassung kommt (dann pro Seite ein hreflang-Satz).

### 10. Open Graph / Twitter-Card-Meta

Fehlt komplett. Betrifft nicht Google-Ranking, aber jede Link-Vorschau
(wenn eine Seite in Slack, WhatsApp, auf Social Media oder in einem
Chat-Fenster geteilt wird) — und solche Shares sind ein wachsender
GEO-Signalweg. `og:title`, `og:description`, `og:image` (das
Fall-Bild, das wir ohnehin haben), `og:type=article`. Beim Build aus den
schon vorhandenen Meta-Feldern ableitbar.

---

## Priorität 3 — Betrieb, nicht Code (von Veit anzustoßen)

### 11. Plesk-/nginx-Cache prüfen

Der von der Review beobachtete Unterschied zwischen `/` und
`/index.html` deutet auf einen Cache, der nicht sauber invalidiert. In
`CLAUDE.md` ist die Caching-Falle schon dokumentiert (HTML ohne
`Cache-Control`). Der dort notierte optionale nginx-Block (HTML
`no-cache`, Assets `immutable`) würde genau das beheben und sollte
gesetzt werden.

### 12. Alte WordPress-Version aus dem Google-Index entfernen

Google hat noch eine gecachte Seite mit Login-Maske (Stand Nov. 2021,
Rest des alten Setups) und die „Über 40“-Startseite.

- Google Search Console → URL-Prüfung → Indexierung für die Startseite
  und die wichtigsten Seiten neu beantragen.
- Sitemap (Aufgabe 2) dort einreichen — beschleunigt das Ersetzen.
- Sicherstellen, dass alte Pfade (`/wp-login.php`, alte Kategorie-URLs)
  einen echten **404** liefern und nicht per Soft-404 auf die Startseite
  umgeleitet werden. Dazu gehört eine echte 404-Seite (siehe Aufgabe 13).

### 13. Echte 404-Seite

Es gibt keine `404.html`. Für ein statisches Setup auf Plesk sollte eine
schlichte 404-Seite im Stil der Site existieren, die auch den
HTTP-Status 404 zurückgibt (nicht 200) — sonst entstehen Soft-404s, die
Google verwirren.

---

## Bewusst NICHT empfohlen (Reviews überbewerten das)

- **FAQPage-Schema für die Themenseiten.** Die Review verspricht davon
  „People Also Ask“-Platzierungen. Das stimmt seit August 2023 nicht mehr:
  Google zeigt FAQ-Rich-Results nur noch für autoritative Behörden- und
  Gesundheitsseiten an. Für uns bringt das Schema **keinen**
  Rich-Result-Vorteil. Falls die Themenseiten ohnehin in Frage-Antwort-
  Form geschrieben werden (wie die Gerichtswesen-Gliederung), ist das als
  lesbarer Inhalt gut — aber das FAQ-**Schema** dafür einzubauen lohnt den
  Aufwand nicht.
- **`<aside>` für die Anmerkung-Kästen.** Semantisch minimal sauberer,
  praktisch ohne messbaren Effekt. `<article>` ist schon gesetzt, die
  Kästen sind über ihre Klasse klar abgegrenzt. Niedrigste Priorität.
- **Flächige WebP/AVIF-Umstellung aller 527 Bilder.** 58 MB gesamt, aber
  das Gewicht liegt bei wenigen Ausreißern (ein Glaser-Bild 4,3 MB, zwei
  Hauptseiten-Kupferstiche über 2 MB). Sinnvoller ist, **nur diese
  Ausreißer** zu komprimieren, statt historische Fotos pauschal
  umzukodieren (Qualitätsrisiko, Aufwand, Diff-Lärm). Modernes Format als
  späteres Progressive Enhancement, nicht jetzt.

---

## Sinnvolle Reihenfolge

1. **robots.txt + sitemap.xml + Canonical** (Aufgaben 1, 2, 5) — ein
   Build-Plugin, ein Nachmittag. Löst das Duplikat-/Index-Problem an der
   Wurzel und macht alle Seiten auffindbar.
2. **Search Console: Sitemap einreichen, Neuindexierung** (Aufgaben 11,
   12) — sobald die Sitemap live ist. Verdrängt die alte WP-Version.
3. **JSON-LD + BreadcrumbList** (Aufgabe 4) — der eigentliche GEO-Gewinn,
   aus der Kartei erzeugt.
4. **llms.txt / llms-full.txt** (Aufgabe 3) — dito aus der Kartei; kann
   im selben Plugin entstehen.
5. **Kleinkram** (6, 7, 8, 9, 10, 13) — nach Zeit, einzeln.

Der rote Faden: Fast alles lässt sich **beim Build aus Daten erzeugen,
die schon da sind** (`denunziationen.json`, die Prozessliste, die
Meta-Felder). Das passt zur bestehenden Architektur — nichts muss von
Hand gepflegt werden, nichts kann veralten.
