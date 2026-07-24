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

## Umgesetzt (Stand Juli 2026)

**Priorität 1 und der Code-Teil von Priorität 2 sind erledigt, deployt und
live geprüft** — alles als Build-Plugins in `vite.config.js`, erzeugt aus
den schon vorhandenen Daten, nichts von Hand zu pflegen:

- ✅ **robots.txt** (Aufgabe 1) — `src/assets/robots.txt`, KI-Crawler
  ausdrücklich erlaubt, Verweis auf die Sitemap.
- ✅ **sitemap.xml** (Aufgabe 2) — `seoDateienPlugin`, 53 URLs, `lastmod`
  je Seite aus dem Git-Datum, Sprachpaar mit `hreflang`.
- ✅ **rel="canonical"** (Aufgabe 5) — auf jeder Seite, self-referenzierend
  (Start → `/`).
- ✅ **hreflang** wed/wed-2 (Aufgabe 9) — in den Seiten und in der Sitemap.
- ✅ **JSON-LD** (Aufgabe 4) — `strukturDatenPlugin`, je Seite ein `@graph`
  (Article mit `about`/`mentions`-Personen, `spatialCoverage` aus den
  geprüften Koordinaten; CollectionPage; WebSite; WebPage) plus
  BreadcrumbList. 53/53 Seiten mit gültigem JSON-LD.
- ✅ **llms.txt / llms-full.txt** (Aufgabe 3) — `llmsDateienPlugin`;
  Inhaltsverzeichnis und alle 35 Protokolle im Volltext-Korpus.
- ✅ **Open Graph / Twitter Cards** (Aufgabe 10) — je Seite im
  `strukturDatenPlugin`, `og:image` aus dem ersten Inhaltsbild der Seite
  (sonst ein Standardbild), `og:type` article/website, `og:locale`
  de_AT/sl_SI. 53/53 Seiten.
- ✅ **Descriptions Zechner I/II** (Aufgabe 6) — fallbeschreibende Sätze
  statt der bloßen Namen.
- ✅ **M1 / M2** (Veit) — Search-Console-Property bestätigt, Sitemap
  eingereicht, Neuindexierung angestoßen.

**Noch offen** (Kleinkram, einzeln nach Zeit — Aufgaben 7, 8, 13):
alt-Texte, `width`/`height` an Bildern, echte 404-Seite. Dazu die
Betriebs-Schritte **M3** (nginx-Cache) und **M5** (404 scharf schalten).
Details unten in den jeweiligen Abschnitten.

---

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

## Priorität 3 — Betrieb, nicht Code

Diese drei Aufgaben (11 Cache, 12 Google-Index, 13 404-Seite) haben eine
Code- und eine Hand-Komponente. Der Code-Teil steht hier kurz; die
Schritte, die **nur Veit** durchführen kann (Plesk-Zugang, Google
Search Console), stehen ausführlich im nächsten Abschnitt
„Nur von Veit durchführbar“.

### 11. Plesk-/nginx-Cache prüfen

Der von der Review beobachtete Unterschied zwischen `/` und
`/index.html` deutet auf einen Cache, der nicht sauber invalidiert. In
`CLAUDE.md` ist die Caching-Falle schon dokumentiert (HTML ohne
`Cache-Control`). Der dort notierte optionale nginx-Block (HTML
`no-cache`, Assets `immutable`) behebt das. → Schritt M3 unten.

### 12. Alte WordPress-Version aus dem Google-Index entfernen

Google hat noch eine gecachte Seite mit Login-Maske (Stand Nov. 2021)
und die „Über 40“-Startseite. Ersetzt sich mit Sitemap +
Neuindexierung. → Schritte M1, M2, M4 unten.

### 13. Echte 404-Seite

Es gibt keine `404.html`. Für ein statisches Setup auf Plesk sollte eine
schlichte 404-Seite im Stil der Site existieren, die den HTTP-Status
**404** zurückgibt (nicht 200 und keinen Redirect auf die Startseite) —
sonst entstehen Soft-404s, die Google verwirren. Der HTML-Teil (eine
`src/404.html` im Site-Stil) ist Code; dass Plesk sie mit Status 404
ausliefert, ist Konfiguration → Schritt M5 unten.

---

## Nur von Veit durchführbar — Schritt für Schritt

Alles Folgende braucht Zugänge, die außerhalb des Repos liegen: Google
Search Console und das Plesk-Panel. Diese Schritte kann Claude nicht
ausführen, nur vorbereiten. Reihenfolge: erst M1–M2 (nach dem ersten
Deploy mit Sitemap), dann M3, dann M4–M5.

### M1 — Website in der Google Search Console anmelden

Nur nötig, falls noch nicht geschehen (prüfen unter
`search.google.com/search-console` — steht `hexenprozesse.at` schon in
der Property-Liste oben links, weiter mit M2).

Von den zwei Anmeldearten ist die **HTML-Datei-Methode** für dieses
Setup die einfachste, weil wir Dateien in den Site-Root legen können:

1. `search.google.com/search-console` öffnen, mit dem Google-Konto
   anmelden.
2. Oben links „Property hinzufügen“ → die Variante **„URL-Präfix“**
   wählen (nicht „Domain“, das bräuchte einen DNS-Eintrag).
3. `https://hexenprozesse.at` eingeben.
4. Google bietet als Bestätigungsmethode eine **HTML-Datei** an
   (z. B. `google1a2b3c4d.html`). Diese Datei herunterladen.
5. Die Datei ins Repo legen: nach `src/assets/` (von dort kopiert Vite
   sie unverändert nach `dist/`, sie ist dann unter
   `https://hexenprozesse.at/google1a2b3c4d.html` erreichbar).
   → *Diesen Schritt kann Claude übernehmen, sobald die Datei da ist.*
6. `npm run build`, committen, pushen — Plesk deployt automatisch.
7. Nach ein, zwei Minuten (bis der Deploy durch ist) in der Search
   Console auf „Bestätigen“ klicken.

Alternative (dauerhafter, aber DNS nötig): „Domain“-Property mit einem
TXT-Eintrag beim Domain-Anbieter. Nur wählen, wenn der DNS-Zugang
ohnehin offen ist.

### M2 — Sitemap einreichen und Neuindexierung anstoßen

Voraussetzung: Aufgabe 2 ist umgesetzt und deployt, also
`https://hexenprozesse.at/sitemap.xml` liefert im Browser XML (vorher
kurz aufrufen und prüfen).

1. In der Search Console links im Menü **„Sitemaps“**.
2. Unter „Neue Sitemap hinzufügen“ `sitemap.xml` eintippen → „Senden“.
   (Nur der Dateiname, die Domain steht schon davor.)
3. Status sollte nach kurzer Zeit „Erfolgreich“ zeigen und die Anzahl
   der gefundenen URLs nennen — die muss zur Seitenzahl passen (rund 53).
4. Die alte Startseite aktiv zur Neuindexierung anstoßen: oben die
   **URL-Prüfung** (Suchleiste „Beliebige URL in … prüfen“),
   `https://hexenprozesse.at/` eingeben, Enter, dann
   **„Indexierung beantragen“**. Dasselbe für die zwei, drei
   wichtigsten Seiten (Prozessliste, Register).

Das Ersetzen der alten WordPress-Version im Index passiert danach von
selbst über die nächsten Tage bis Wochen. Beschleunigen lässt es sich
nicht weiter; die beantragte Neuindexierung ist das Maximum.

### M3 — nginx-Cache-Regeln in Plesk setzen

Behebt das Cache-Problem hinter der „/ vs /index.html“-Beobachtung.

1. Plesk öffnen → Domain `hexenprozesse.at`.
2. **„Apache & nginx Settings“** (bzw. „Apache- und nginx-Einstellungen“).
3. Ganz unten das Feld **„Additional nginx directives“**
   („Zusätzliche nginx-Direktiven“).
4. Den Block aus `CLAUDE.md` (Abschnitt „Caching-Falle“) einfügen:
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
5. „OK“/„Übernehmen“. Wirkt sofort. Danach `/` und `/index.html` im
   Browser mit Strg+Shift+R gegenprüfen — beide müssen jetzt denselben,
   aktuellen Stand zeigen.

### M4 — (optional) veraltete URLs sofort ausblenden

Falls die alte Login-Masken-Seite oder „Über 40“ noch prominent in der
Google-Suche auftaucht und schneller weg soll, als M2 wirkt:

1. Search Console → links **„Entfernen“** (unter „Indexierung“).
2. „Neue Anfrage“ → die betreffende alte URL eintragen → bestätigen.

Das ist eine **temporäre** Ausblendung (rund 6 Monate) und ersetzt M2
nicht — es überbrückt nur die Zeit, bis der neue Stand indexiert ist.

### M5 — 404-Seite scharf schalten

Voraussetzung: Aufgabe 13 ist umgesetzt, es gibt eine gebaute
`404.html`.

1. Plesk → Domain → **„Apache & nginx Settings“**.
2. Prüfen, ob unter „Zusätzliche nginx-Direktiven“ eine `error_page`
   nötig ist, oder ob Plesk die `404.html` im Document Root automatisch
   nutzt. Falls nötig:
   ```nginx
   error_page 404 /404.html;
   ```
3. Gegenprobe: eine erfundene URL aufrufen
   (`https://hexenprozesse.at/gibtsnicht`) und mit den Entwickler-Tools
   (Netzwerk-Tab) prüfen, dass der **Statuscode 404** ist — nicht 200,
   nicht eine Weiterleitung auf die Startseite.

### M6 — (Kür) Bing Webmaster Tools

Kostet zehn Minuten und deckt Bing + damit indirekt einen Teil von
ChatGPTs Websuche ab:

1. `bing.com/webmasters` öffnen, mit Microsoft- oder Google-Konto
   anmelden.
2. „Importieren“ aus der Google Search Console anbieten lassen — das
   übernimmt Property und Sitemap in einem Schritt.

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

Verschränkt, weil Code und Handgriffe aufeinander aufbauen:

1. **Code:** robots.txt + sitemap.xml + Canonical (Aufgaben 1, 2, 5) —
   ein Build-Plugin, ein Nachmittag. Deployen.
2. **Veit:** Search Console anmelden, Sitemap einreichen,
   Neuindexierung (Schritte M1, M2). Parallel den nginx-Cache setzen
   (M3). Das verdrängt die alte WP-Version.
3. **Code:** JSON-LD + BreadcrumbList (Aufgabe 4) — der eigentliche
   GEO-Gewinn, aus der Kartei erzeugt.
4. **Code:** llms.txt / llms-full.txt (Aufgabe 3) — dito aus der Kartei;
   kann im selben Plugin entstehen.
5. **Code + Veit:** 404-Seite bauen (13) und scharf schalten (M5).
6. **Kleinkram:** Descriptions, alt-Texte, width/height, hreflang,
   Open Graph (6, 7, 8, 9, 10) — nach Zeit, einzeln.
7. **Kür:** Bing (M6).

Der rote Faden für den Code-Teil: Fast alles lässt sich **beim Build aus
Daten erzeugen, die schon da sind** (`denunziationen.json`, die
Prozessliste, die Meta-Felder). Das passt zur bestehenden
Plugin-Architektur in `vite.config.js` — nichts muss von Hand gepflegt
werden, nichts kann veralten.

---

## Für die nächste Arbeits-Session

Eine eigene Plan-Session (Plan-Modus) ist dafür **nicht** nötig — dieses
Dokument ist bereits der Plan, und die Aufgaben sind mechanisch und gut
abgegrenzt. Sinnvoll ist nur, in einem **frischen, aufgeräumten Kontext**
zu arbeiten. Der Übergabe-Prompt dafür steht nicht hier im Repo, sondern
wurde Veit direkt gegeben; er nennt dieses Dokument als Spezifikation und
startet mit Priorität 1.
