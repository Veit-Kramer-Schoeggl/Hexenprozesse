// Sprung zur ersten Erwähnung einer Person im Protokolltext.
//
// Das Personenregister verlinkt auf `seite.html?person=Name`. Dieses Modul
// sucht den Namen im laufenden Text, hebt die erste Fundstelle hervor und
// scrollt sie in den Blick. Ohne den Parameter passiert nichts.
//
// Gesucht wird auch nach den Namensvarianten, die im Register mitgegeben
// werden (`&auch=Variante|Variante`) — die Protokolle schreiben denselben
// Namen oft unterschiedlich.

const parameter = new URLSearchParams(window.location.search);
const gesucht = parameter.get("person");

if (gesucht) {
  const roh = [gesucht, ...(parameter.get("auch") || "").split("|")]
    .map((s) => s.trim())
    .filter(Boolean);

  // Gestufte Suche. Die Kartei fuehrt Namen oft in einer Langform
  // ("Agatha, Frau des Adam"), im Protokoll steht dann "Agatha, die Frau des
  // Adam". Deshalb wird nacheinander gesucht nach:
  //   1. der vollen Form,
  //   2. dem Stueck vor dem ersten Komma oder der ersten Klammer,
  //   3. einzelnen grossgeschriebenen Wortern, laengste zuerst.
  // Damit landet man notfalls beim blossen Vornamen — das ist ehrlicher als
  // gar kein Sprung, und der Treffer ist als Hervorhebung sichtbar.
  const stufen = [];
  const merken = (s) => {
    const w = s.trim().replace(/[.,;:]$/, "");
    if (w.length >= 4 && !stufen.includes(w)) stufen.push(w);
  };
  for (const s of roh) merken(s);
  for (const s of roh) merken(s.split(/[,(]/)[0]);
  for (const s of roh) {
    const woerter = s
      .split(/[\s,()]+/)
      .filter((w) => /^[A-ZÄÖÜ]/.test(w) && !/^(Dr|Frau|Herr|Die|Der|Das|Sohn|Tochter|Witwe|Schwester|Bruder)$/.test(w));
    woerter.sort((a, b) => b.length - a.length);
    for (const w of woerter) merken(w);
  }
  const varianten = stufen;

  // Nur im Protokolltext suchen, nicht in Navigation, Anmerkung oder Quelle
  const bereich = document.querySelector("article.prozess") || document.body;
  const ausgenommen = "nav, .fall-nav, .kommentar, .hint, .literatur-liste, figcaption, script, style, h1, .register-rolle";

  const findeTreffer = () => {
    const lauf = () => document.createTreeWalker(bereich, NodeFilter.SHOW_TEXT, {
      acceptNode(knoten) {
        if (!knoten.nodeValue || !knoten.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (knoten.parentElement?.closest(ausgenommen)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    // Stufe fuer Stufe durch das ganze Dokument, nicht Knoten fuer Knoten:
    // sonst gewinnt ein spaeter Vorname vor einem frueheren vollen Namen.
    for (const wort of varianten) {
      const gehe = lauf();
      let knoten;
      while ((knoten = gehe.nextNode())) {
        const stelle = knoten.nodeValue.indexOf(wort);
        if (stelle === -1) continue;
        // nicht mitten im Wort treffen ("Gera" nicht in "Gerade")
        const davor = knoten.nodeValue[stelle - 1];
        const danach = knoten.nodeValue[stelle + wort.length];
        const istBuchstabe = (z) => z !== undefined && /[\wäöüßÄÖÜ]/.test(z);
        if (istBuchstabe(davor) || istBuchstabe(danach)) continue;
        return { knoten, stelle, laenge: wort.length };
      }
    }
    return null;
  };

  const treffer = findeTreffer();
  if (treffer) {
    const bereichRange = document.createRange();
    bereichRange.setStart(treffer.knoten, treffer.stelle);
    bereichRange.setEnd(treffer.knoten, treffer.stelle + treffer.laenge);
    const marke = document.createElement("mark");
    marke.className = "erwaehnung";
    marke.id = "erwaehnung";
    bereichRange.surroundContents(marke);

    // In die Bildschirmmitte scrollen, aber nie unter den klebenden Seitenkopf:
    // bei einer frühen Erstnennung (wenig Platz oben) landet die Stelle sonst
    // trotz "center" verdeckt am oberen Rand.
    requestAnimationFrame(() => {
      const kopf =
        parseInt(getComputedStyle(document.documentElement).getPropertyValue("--kopf-hoehe"), 10) || 60;
      const r = marke.getBoundingClientRect();
      const abstandOben = Math.max(kopf + 16, (window.innerHeight - r.height) / 2);
      const ziel = window.scrollY + r.top - abstandOben;
      window.scrollTo({ top: Math.max(0, ziel), behavior: "smooth" });
    });
  } else {
    // Nichts gefunden — das ist möglich, wenn das Protokoll den Namen anders
    // schreibt als die Kartei. Dann bleibt wenigstens ein ehrlicher Hinweis.
    const hinweis = document.createElement("p");
    hinweis.className = "hint erwaehnung-fehlt";
    hinweis.innerHTML =
      `<em>Gesucht wurde die Stelle zu <strong>${gesucht.replace(/[<>&]/g, "")}</strong>. ` +
      `Im Text dieser Seite steht der Name in einer anderen Schreibweise — bitte selbst suchen.</em>`;
    const kopf = bereich.querySelector(".prozess-header");
    kopf?.insertAdjacentElement("afterend", hinweis);
  }
}
