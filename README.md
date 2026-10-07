# Computergrafik-Lernportal

Ein lokales Lernportal zur Vorbereitung auf die Computergrafik-Klausur. Die Übungen orientieren sich an elf Altklausuren aus den Jahren 2019 bis April 2026.

## Funktionen

- Erklärungen und interaktive Übungen für sieben Aufgabenbereiche, inklusive aller neuen Formate aus den Klausuren 2023–2026
- Training mit direkter Auswertung, Wiederholung und Fortschrittszähler
- Klausurmodus mit 24 Teilaufgaben und 60 Minuten Bearbeitungszeit
- Statistiken zu Häufigkeit und Punktegewicht der Klausurthemen
- Persönlicher Lernstand und gespeicherte Klausurergebnisse
- Heller und dunkler Darstellungsmodus
- Automatischer Countdown bis zur Klausur am 8. Oktober 2026

## Aufgabenbereiche

1. Affine Abbildungen in 2D (inkl. Produktklassen, Eigenschaften, projektive Abbildungen)
2. Perspektivische Projektion, Kamera und Texture Mapping (inkl. MIP-Distanzen, perspektivisch korrekte Interpolation)
3. Rasterisierung mit Scanline, Bresenham, direktem Linienalgorithmus, Kantentest und Kreisen
4. Phong- und Blinn-Phong-Beleuchtung, Abschwächung und Shading
5. Farbmodelle, Spektren und Alpha-Blending
6. Raytracing, Laufzeitkomplexität und VR/HMD
7. Szenengraphen, Matrixstapel und Rotationen

## Lokal verwenden

Das gesamte Repository herunterladen oder klonen:

```bash
git clone https://github.com/WhiteCoale/computergrafik-lernportal.git
```

Danach `index.html` per Doppelklick im Browser öffnen. Es ist kein Build-Schritt und kein lokaler Server erforderlich. Fortschritte werden im lokalen Speicher des Browsers abgelegt.

## Ordnerstruktur

```text
index.html                       Hauptseite
assets/                         Hintergrundbilder
seiten/                         Erklärungs- und Trainingsseiten
scripts/                        Gemeinsame Portal-Logik und Zusatzaufgaben (exam-extras.js)
material/                       Klausurauswertung und Altklausuren
```

## Mit GitHub Pages veröffentlichen

Das Portal wird über GitHub Pages direkt aus dem Branch `main` und dem Repository-Stamm veröffentlicht.

Nach der Veröffentlichung ist das Portal normalerweise unter folgender Adresse erreichbar:

```text
https://whitecoale.github.io/computergrafik-lernportal/
```

Alle internen Dateien werden über relative Pfade geladen und funktionieren daher auch über GitHub Pages.
