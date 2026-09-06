# Computergrafik-Lernportal

Ein lokales Lernportal zur Vorbereitung auf die Computergrafik-Klausur. Die Übungen orientieren sich an fünf Altklausuren aus den Jahren 2019 bis 2021.

## Funktionen

- Erklärungen und interaktive Übungen für sechs Aufgabenbereiche
- Training mit direkter Auswertung, Wiederholung und Fortschrittszähler
- Klausurmodus mit 22 Teilaufgaben und 60 Minuten Bearbeitungszeit
- Statistiken zu Häufigkeit und Punktegewicht der Klausurthemen
- Persönlicher Lernstand und gespeicherte Klausurergebnisse
- Heller und dunkler Darstellungsmodus
- Automatischer Countdown bis zur Klausur am 8. Oktober 2026

## Aufgabenbereiche

1. Affine Abbildungen in 2D
2. Perspektivische Projektion und Texture Mapping
3. Rasterisierung mit Scanline und Bresenham
4. Phong-Beleuchtung und Shading
5. Farbmodelle
6. Raytracing und VR/HMD

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
scripts/                        Gemeinsame Portal-Logik
material/                       Klausurauswertung und Altklausuren
```

## Mit GitHub Pages veröffentlichen

Das Portal wird über GitHub Pages direkt aus dem Branch `main` und dem Repository-Stamm veröffentlicht.

Nach der Veröffentlichung ist das Portal normalerweise unter folgender Adresse erreichbar:

```text
https://whitecoale.github.io/computergrafik-lernportal/
```

Alle internen Dateien werden über relative Pfade geladen und funktionieren daher auch über GitHub Pages.
