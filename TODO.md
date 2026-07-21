# Offene Punkte

Gesammelte Todos aus der laufenden Überarbeitung. Kurz halten, erledigte
Punkte löschen (die Historie steht in Git).

## Inhaltlich zu klären

- **Dionys: Untertitel stimmt nicht mit dem Inhalt überein.**
  Der Untertitel lautet „Prozess gegen Dionys und seine Helferin“, aber
  ein Verfahren gegen die Helferin **Bärbl** ist auf der Seite gar nicht
  enthalten. Verhandelt werden Dionys und, zwei Tage später, Bärbls
  zehnjährige Tochter Greschl. Über Bärbl selbst schweigen die Akten.
  Zu prüfen: Gab es dazu Material im Archiv von Siegfried Kramer? Falls
  nicht, den Untertitel ehrlicher fassen.
  (Stand Juli 2026: Veit vermutet, dass kein weiteres Material existiert.)

## Mehrsprachigkeit — eigenes Projekt

**Ziel:** Die Seite durchgängig auf Deutsch, Slowenisch und Englisch,
mit Umschalter. Heute gibt es genau eine slowenische Seite (Dorothea
Wed), die als Einzelstück daneben steht.

Das ist bewusst als **eigenes Vorhaben** notiert, nicht als Nebenarbeit
— zur Einordnung des Umfangs:

- **Struktur:** Sprachverzeichnisse (`/de/`, `/sl/`, `/en/`) statt der
  heutigen flachen Ablage. Betrifft jeden Pfad, jeden internen Link, die
  Vite-Konfiguration und das Plesk-Deployment.
- **Gemeinsames Gerüst:** Navigation, Fußzeile und wiederkehrende
  Bausteine müssen aus Sprachdateien gespeist werden, statt wie jetzt
  fest im Partial zu stehen.
- **Umschalter:** muss auf die *entsprechende* Seite der anderen Sprache
  zeigen, nicht auf deren Startseite — braucht also eine Zuordnung je
  Seite.
- **Technisch machbar** mit dem bestehenden Vite-Setup; es bleibt eine
  statische Seite, kein Server nötig.

**Der eigentliche Aufwand ist nicht technisch, sondern inhaltlich:** Es
sind rund 36 Prozessseiten plus Themenseiten. Die Protokolle sind
Übertragungen historischer Quellen in heutiges Deutsch — sie zu
übersetzen ist Fachübersetzung, keine Fleißarbeit, und maschinell nicht
seriös zu leisten. Für die slowenische Fassung von Dorothea Wed hat
**Carmen Weissenstein** übersetzt; ein Anhaltspunkt, wen man ansprechen
könnte.

**Sinnvolle Reihenfolge:** zuerst das Gerüst mehrsprachfähig machen und
mit den wenigen vorhandenen Übersetzungen bestücken, danach Seite für
Seite ergänzen. Dann bleibt die Seite in jedem Zwischenstand benutzbar.

## Slowenische Übersetzungen ergänzen

Mehrere Prozesse wurden auf heute slowenischem Gebiet verhandelt, liegen
aber nur auf Deutsch vor. Für diese wäre eine slowenische Fassung
wünschenswert — so wie sie für Dorothea Wed bereits existiert
(übersetzt von **Carmen Weissenstein**).

| Prozess | Ort | Jahr |
|---|---|---|
| [Helena Glanitschnigg](src/pages/prozesse/glanitschnigg.html) | Dreifaltigkeit bei Lichtenegg (Gorca) | 1701 |
| [Gera Kopschitsch](src/pages/prozesse/kopschitsch.html) | Gutenhag, Rohitschberg (Donačka gora) | 1661 |

Weitere Kandidaten mit slowenischem Bezug, noch zu sichten: Gera Scherb
und Marina Hörk (Luttenberg / Ljutomer), Gera Gregoritsch (Freyenthurn,
Krain), Türk (Luttenberg), Wukinetz.

Recherche bisher ergebnislos: Weder im Repo noch im Netz findet sich ein
Hinweis, dass Carmen Weissenstein außer Dorothea Wed noch weitere dieser
Prozesse übersetzt hat (Stand Juli 2026). Falls Kontakt zu ihr besteht,
wäre das der kürzeste Weg.

## Denunziations-Netz: Querverweise zwischen den Prozessen

**Idee:** Wenn in einem Verhör eine Person genannt wird, zu der es eine
eigene Prozessseite gibt, sollte der Name direkt dorthin verlinken. Dazu
eine kleine Datenbasis, die je Prozess festhält, **wer wen beschuldigt
hat** — damit sich beide Richtungen zeigen lassen: „X hat Y denunziert“
und auf Y's Seite „Y wurde von X denunziert“.

**Das Material trägt die Idee.** Belegte Verbindungen, die beim
Bearbeiten schon aufgefallen sind:

| Verbindung | Beleg |
|---|---|
| Stefan Zechner („Steffl am Hoff“) | genannt in Glaser, Rueprecht, St. Lambrecht, Heiser |
| Marx Rueprecht → Stefan Zechner | sagt unter Folter gegen ihn aus |
| Hans Glaser („grindiger Hansl“) → Stefan Zechner | Denunziation 1657, später zurückgenommen |
| Marina Hörk ↔ Gera Scherb | Schwestern, gemeinsam angeklagt 1672 |
| Thomas Heiser → Gregor Heiser | Aussage des Vaters wird zum Todesurteil des Sohnes |
| Sebastian Kügl ↔ Marx Rueprecht | gemeinsam beim Opferstockraub ertappt |
| Helena Glanitschnigg | denunziert namentlich acht weitere Personen |

**Automatisch geht das nicht zuverlässig.** Ein Testlauf über alle Seiten,
der schlicht nach Nachnamen sucht, meldet 71 Verbindungen — darunter
grobe Fehltreffer, weil einige Seitentitel auf ein gewöhnliches Wort
oder einen Ort enden („Katharina Türk **und weitere**“, „Hans aus der
**Metnitz**“). Auch Namensvarianten stehen dagegen: Rueprecht/Rüprecht,
Steffl am Hoff/Stefan Zechner, Klanetschneck/Klanetschnek/Klanouschack.

**Vorschlag:** eine gepflegte Datei `src/daten/denunziationen.json`, in
der jede Verbindung von Hand eingetragen und mit Fundstelle belegt ist —
statt sie zu raten. Aus ihr lassen sich dann sowohl die Inline-Links als
auch ein Abschnitt „Verbindungen zu anderen Prozessen“ je Seite
erzeugen. Beim Bearbeiten der restlichen Seiten fallen die Verbindungen
ohnehin auf und können gleich miterfasst werden.

## Ortskoordinaten, die noch fehlen

Die Ortskarten der Prozessseiten arbeiten mit geprüften Koordinaten aus
dem OSM-Geocoder. Für einzelne historische Gebäude liefert er nichts:

- **Schloss Luttenberg** (Ljutomer, Slowenien) — Prozessort der Verfahren
  von 1672. OpenStreetMap kennt dort keine Burg und kein Schloss, nur den
  Ort selbst. Der Kartenpunkt zeigt deshalb vorerst auf Ljutomer und ist
  als ungesichert gekennzeichnet. Die Befestigung ist 1249 als
  „Luetenberch“ erwähnt — ob und wo Reste stehen, wäre zu klären.

- **Herrschaft Admontbichl** — Prozessort des Verfahrens gegen Matthias
  und Eva Hacker 1695. OpenStreetMap kennt den Namen nicht. Der
  Kartenpunkt zeigt auf Obdach, wo alle Bilder der Seite aufgenommen
  sind, und ist als ungesichert gekennzeichnet.

## Fehlende Seite: steger1.html

Auf der Einführungsseite [St. Lambrecht 1653](src/pages/themen/lambrecht-1653.html)
verwies der Text auf ein **eigenes Prozessprotokoll zu Lorenz Steger**
unter `steger1.html` — diese Datei hat es im Repo nie gegeben. Der Satz
lautete: „Da machte man kurzen Prozess. Zum Beispiel dem Lorenz Steger
(Prozessprotokoll)“, wobei „Lorenz Steger“ auf `steger.html` zeigte und
„Prozessprotokoll“ auf das fehlende `steger1.html`.

Es gab also offenbar **zwei** Steger-Seiten: eine Beschreibung und das
Protokoll selbst. Vorhanden ist nur `steger.html`. Der tote Link ist
vorerst entfernt.

Zu prüfen: Liegt in der alten Live-Sicherung (`01_Archiv/PHPsicherung`)
oder im Stand von 2017 (`03_Bearbeitung_Aktuell/HP 2017-09`) eine Datei
`steger1.htm`? Falls ja, als eigene Prozessseite ergänzen und den Link
wiederherstellen.

## Offene Recherchefragen

**Wurde Ursula Neubauer erhört?** Die Bittschrift von 1644 bricht mit der
Bitte ab; ob der Kaiser die Verbannung aufgehoben hat und sie zu Mann und
Kindern zurückkehren durfte, steht weder im Text noch in der Fassung der
Steiermärkischen Geschichtsblätter 1882 (S. 155ff), die Siegfried Kramer
benutzt hat. Eine kurze Websuche bringt nur die eigene Seite zurück.
Nächster Schritt wäre das Original: Hofkanzlei- bzw. Regierungsakten zur
Herrschaft Neudau / Landgericht Burgau im Steiermärkischen Landesarchiv.

**Aufnahmeort eines Bildes unbekannt.** Auf der Seite
[Veronika Rauch](src/pages/prozesse/rauch.html) steht ein Foto eines
Wappens an einem Grabdenkmal (`IMG_0658k.JPG`). Wo es aufgenommen wurde,
ist nirgends vermerkt; die Bildnummern liegen nahe bei den Aufnahmen der
Pfarrkirche Trautmannsdorf, das ist aber nur eine Vermutung. Die
Bildunterschrift nennt deshalb keinen Ort. Veit weiß es nicht (Stand
Juli 2026). Falls sich der Ort klären lässt, Bildunterschrift ergänzen.

**Jakob Sommer / Jakob Summer — Namensgleichheit oder mehr?** Auf der
Opferliste von Gleichenberg steht ein „Jakob Sommer aus Waldsberg“. Der
Landgerichtsverwalter, der beide erhaltenen Verhöre führt, heißt „Jakob
Summer“. Die Schreibweisen unterscheiden sich, und der Name war häufig —
es ist also vermutlich Zufall. Weil es aber, falls doch nicht, ein sehr
auffälliger Befund wäre, hier notiert. Auf der Seite steht dazu bewusst
nichts.

## Fehlende Dateien — PDFs wiederherstellen

**Fünf tote PDF-Links.** Im Repo liegt unter `src/assets/` keine einzige
PDF-Datei, es wird aber an fünf Stellen auf welche verlinkt. Bei der
Migration von der alten Site nicht mitgekommen.

Zweck laut Link-Text: es sind **Druckfassungen der jeweiligen
Protokolle** („Als PDF-Datei ausdrucken“ bzw. slowenisch „Natisniti kot
PDF datoteko“) — also der Seiteninhalt als Download zum Ausdrucken.

| Erwarteter Pfad | Seite | auf der Seite kenntlich gemacht |
|---|---|---|
| `/images/fragenkatalog/fragenkatalog.pdf` | Fragenkatalog | nein |
| `/images/lipp/lipp.pdf` | Michael Lipp | ja |
| `/images/neubauer/neubauer.pdf` | Ursula Neubauer | nein |
| `/images/rauch/rauch.pdf` | Veronika Rauch | ja |
| `/images/wed-2/wed2.pdf` | Dorothea Wed (slovensko) | nein |

Die Links bleiben bewusst im Code stehen — die Dateien sollen
wiederhergestellt werden. Sobald sie da sind, einfach unter den obigen
Pfaden in `src/assets/` ablegen, dann greifen alle fünf Links wieder.

**Konvention beim Überführen in die Maske:** der Link bleibt stehen,
bekommt aber einen sichtbaren Zusatz, damit niemand ins Leere klickt —
so wie auf der Lipp-Seite:

```html
<p class="hint"><a href="/images/lipp/lipp.pdf">Druckfassung als PDF</a> —
<em>die Datei ist bei der Übersiedlung der Website verloren gegangen und
soll wiederhergestellt werden.</em></p>
```

Die Spalte oben mitführen. Sobald eine PDF-Datei wieder da ist: den
Zusatz auf der betreffenden Seite entfernen und die Zeile aus der
Tabelle streichen.

Suche bisher erfolglos: das Archiv unter `~/Desktop/Papa/` existiert auf
dem aktuellen Rechner nicht (Stand Juli 2026). Dort zuerst nachsehen,
sonst in der alten Live-Sicherung (`01_Archiv/PHPsicherung`).

## Maske ausrollen

Die einheitliche Prozess-Maske (Buchseiten-Boxen, Serif für den
Quellentext, serifenlos für Kommentare) ist bisher angewandt auf:

- Andreas Zechner I und II
- Dionys und die Greschl
- Byloff, Volkskundliches (alle vier Teile)

Offen: die übrigen Prozessseiten, darunter Dorothea Wed (deutsch und
slowenisch), bei denen bisher nur die Sprachauszeichnung korrigiert ist.
