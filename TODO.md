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

## Fehlende Dateien — PDFs wiederherstellen

**Fünf tote PDF-Links.** Im Repo liegt unter `src/assets/` keine einzige
PDF-Datei, es wird aber an fünf Stellen auf welche verlinkt. Bei der
Migration von der alten Site nicht mitgekommen.

Zweck laut Link-Text: es sind **Druckfassungen der jeweiligen
Protokolle** („Als PDF-Datei ausdrucken“ bzw. slowenisch „Natisniti kot
PDF datoteko“) — also der Seiteninhalt als Download zum Ausdrucken.

| Erwarteter Pfad | Seite |
|---|---|
| `/images/fragenkatalog/fragenkatalog.pdf` | Fragenkatalog |
| `/images/lipp/lipp.pdf` | Michael Lipp |
| `/images/neubauer/neubauer.pdf` | Ursula Neubauer |
| `/images/rauch/rauch.pdf` | Veronika Rauch |
| `/images/wed-2/wed2.pdf` | Dorothea Wed (slovensko) |

Die Links bleiben bewusst im Code stehen — die Dateien sollen
wiederhergestellt werden. Sobald sie da sind, einfach unter den obigen
Pfaden in `src/assets/` ablegen, dann greifen alle fünf Links wieder.

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
