# Istabul_Git-Diff_test

## 📊 Coverage-Diff Integration

Ein System zur automatischen Überwachung von Code-Coverage-Änderungen mit Git-Diffs und HTML-Reports.

### Features

- ✅ **Automatische Coverage-Überwachung**: Vergleicht Coverage-Änderungen zwischen Git-Commits
- ✅ **HTML-Reports**: Schöne, interaktive HTML-Reports mit Statistiken und Visualisierungen
- ✅ **Regressions-Tracking**: Warnt vor sinkender Coverage in geänderten Dateien
- ✅ **Nightly Runs**: Automatische GitHub Actions Workflows für tägliche Coverage-Checks
- ✅ **GitHub Pages**: Reports werden automatisch online deployed 🚀
- ✅ **Coverage-History**: Speichert Coverage-Snapshots für Zeitreihen-Vergleiche

---

## ⚙️ GitHub Pages aktivieren (Einmalig)

1. **Gehe zu deinem Repository auf GitHub**
2. **Settings → Pages**
3. **Source**: Wähle `Deploy from a branch` oder `GitHub Actions` (empfohlen)
4. Falls `Deploy from a branch`: Wähle Branch `gh-pages` und Folder `/ (root)`
5. **Save** – Fertig!

Nach dem ersten erfolgreichen Workflow-Run wird deine Coverage-Seite live sein unter:
```
https://<dein-username>.github.io/<dein-repo>/nightly/
```

---

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Coverage generieren

```bash
npm run coverage:run
```

Dies führt alle Tests aus und generiert einen JSON-Coverage-Report in `coverage/coverage-final.json`.

### 3. Coverage-Diff anzeigen

**Terminal-Output:**
```bash
npm run coverage:diff
```

**HTML-Report generieren:**
```bash
npm run coverage:diff:html
```

Der Report wird in `coverage-report/index.html` gespeichert und kann im Browser geöffnet werden.

---

## 📋 Verfügbare npm Scripts

| Script | Beschreibung |
|--------|-------------|
| `npm run test` | Führt alle Playwright-Tests aus |
| `npm run coverage:run` | Führt Tests mit Coverage aus und generiert JSON/LCOV Reports |
| `npm run coverage:diff` | Zeigt Terminal-Output der geänderten Coverage |
| `npm run coverage:diff:html` | Generiert einen schönen HTML-Report |
| `npm run coverage:diff:compare` | Vergleicht aktuelle Coverage mit gespeicherten Snapshot |

---

## 🔍 Nightly Coverage Reports (GitHub Actions)

### Setup

Der Workflow `.github/workflows/nightly-coverage.yml` ist bereits konfiguriert:

- **Trigger**: Jeden Tag um 02:00 UTC (anpassbar im Workflow)
- **Alternativ**: Manueller Trigger über GitHub Actions Tab
- **Ausgabe**: GitHub Pages (automatisch deployt)

### Workflow-Funktion

1. ✅ Checked out den aktuellen Code
2. ✅ Führt alle Coverage-Tests aus
3. ✅ Generiert HTML-Report mit Vergleich
4. ✅ **Deployt zu GitHub Pages automatisch** 🚀
5. ✅ Speichert den Report auch als GitHub Artifact (30 Tage)

### 📱 Report ansehen auf GitHub Pages

Nach einer erfolgreichen Nightly Run:

1. **Öffne dein Repository auf GitHub**
2. **Gehe zu**: Settings → Pages
3. **Schaue unter "Your site is live at"** – dort siehst du die GitHub Pages URL

Dann kannst du den aktuellen Report hier öffnen:
```
https://<dein-username>.github.io/<dein-repo>/nightly/<run-number>/index.html
```

**Beispiel:**
```
https://mytimmartinez3befan-spec.github.io/Istabul_Git-Diff_test/nightly/42/index.html
```

### 🗂️ Report-Struktur auf GitHub Pages

```
https://dein-username.github.io/dein-repo/
├── nightly/
│   ├── 1/
│   │   └── index.html     (Run 1)
│   ├── 2/
│   │   └── index.html     (Run 2)
│   └── ...
```

Jeder Run bekommt seine eigene Nummer und einen separaten Ordner.

### 📊 Im GitHub Actions Tab ansehen

Nach einer erfolgreichen Nightly Run:
1. Gehe zu deinem GitHub Repo → **Actions** Tab
2. Klicke auf die neueste "Nightly Coverage Report" Run
3. Lade die `coverage-report-<run-id>` Artifact herunter (optional)
4. Oder öffne die GitHub Pages URL direkt

---

## 💾 Coverage-History verwalten

Speichere Snapshots der Coverage für Zeitreihen-Vergleiche:

```bash
# Speichert aktuellen Coverage
node scripts/coverage-history.js save

# Listet alle gespeicherten Snapshots
node scripts/coverage-history.js list

# Vergleicht aktuellen mit Snapshot [0]
node scripts/coverage-history.js compare 0

# Löscht alte Snapshots (behält letzte 30)
node scripts/coverage-history.js clean
```

Die Snapshots werden in `coverage-history/` gespeichert.

---

## 🎯 Report-Kategorien

Der HTML-Report zeigt automatisch:

### ⚠️ Coverage Regressions
Dateien, deren Coverage seit dem letzten Vergleich gesunken ist.
- Sortiert nach Regression-Schweregrad
- Zeigt uncovered Lines
- Hilft bei schneller Identifikation von Problemen

### 🆕 New/Untested Files
Neue Dateien oder Dateien mit < 100% Coverage.
- Zeigt, wo noch Tests fehlen
- Priorisiert nach Coverage-Percentage

### 🎉 Coverage Improved
Dateien, deren Coverage verbessert wurde.
- Zeigt die positiven Fortschritte
- Motiviert das Team!

---

## 📝 Technische Details

### Coverage-Diff Logik

Das Skript `scripts/coverage-diff.js`:

1. Liest `coverage/coverage-final.json` (von nyc)
2. Parst `git diff -U0 HEAD` um geänderte Zeilen zu finden
3. Mappt geänderte Zeilen zu Coverage-Statements
4. Berechnet Coverage-Prozente pro Datei
5. Vergleicht mit optionalem `--base` Coverage JSON

### Unterstützte Parameter

```bash
# Generiere HTML-Report
npm run coverage:diff -- --html=coverage-report/index.html

# Vergleiche mit vorherigem Coverage
npm run coverage:diff -- --base=path/to/old/coverage-final.json

# Beides kombinieren
node scripts/coverage-diff.js --base=previous.json --html=report.html
```

### Git Line-Ending Warnungen

Meldungen wie `LF will be replaced by CRLF` sind normale Git-Zeilenende-Warnungen:
- Keine Fehler des Skripts
- Git normalisiert Zeilenenden auf Windows automatisch
- Bei Bedarf: `.gitattributes` hinzufügen oder `core.autocrlf=false` setzen

---

## 🔧 Konfiguration anpassen

### nyc (Istanbul) Config in `package.json`

```json
{
  "nyc": {
    "extension": [".ts", ".js"],
    "exclude": ["**/tests/**", "**/playwright-report/**"],
    "reporter": ["lcov", "json"],
    "all": true
  }
}
```

### GitHub Actions Workflow

Öffne `.github/workflows/nightly-coverage.yml` und passe an:
- **Schedule**: Ändere `0 2 * * *` (Zeit in UTC)
- **Retention**: Ändere `retention-days` für Artifact-Speicher
- **Branches**: Filtern mit `if: github.ref == 'refs/heads/main'`

---

## 📊 Integration in CI/CD

### Vor einem Merge

```bash
# Lokal testen
npm run coverage:run
npm run coverage:diff:html

# HTML öffnen und überprüfen
open coverage-report/index.html
```

### In Pull Requests

Der Workflow postet automatisch einen Comment mit Links zur Coverage-Report Artifact.

---

## 🆘 Troubleshooting

**Problem**: `coverage/coverage-final.json not found`
- Lösung: `npm run coverage:run` zuerst ausführen

**Problem**: Keine geänderten Dateien im Report
- Check: `git diff --no-color -U0 HEAD` manuell ausführen
- Oder: Commits nicht gepusht? GitHub Actions arbeitet mit lokalem HEAD

**Problem**: Sehr große HTML-Reports
- Hint: Alte Coverage-Snapshots mit `node scripts/coverage-history.js clean` löschen

---

## 📚 weitere Ressourcen

- [nyc (Istanbul) Docs](https://github.com/istanbuljs/nyc)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Playwright Test Docs](https://playwright.dev/docs/intro)

---

## 💡 Tipps für Team-Workflows

1. **Daily Standups**: Schaue die Nightly Reports an, um Coverage-Trends zu sehen
2. **Pull Request Reviews**: Nutze `npm run coverage:diff:html` vor dem Review
3. **Coverage Ziele**: Setze ein Minimum (z.B. 80%) als Team-Ziel
4. **Git Hooks**: Ergänze Pre-Commit Hooks, um Coverage-Broken zu verhindern (optional)

---

**Viel Erfolg mit deinem Coverage-Tracking! 🚀**

