# Das Geheimnis der Mumie – ägyptisches Exit-Game (Klasse 6)

**Die App-Dateien sind vollständig hochgeladen:** `index.html` (mit Bildern), `video.mp4` und `.nojekyll`.

## GitHub Pages mit einem Klick aktivieren

1. [Pages-Einstellungen öffnen](https://github.com/droeseschule/aegypten-exit-game/settings/pages)
2. **Build and deployment → Source → Deploy from a branch** wählen.
3. Unter **Branch** den Branch **main** und den Ordner **/(root)** wählen.
4. Auf **Save** klicken.

Es wird **kein GitHub-Actions-Workflow** benötigt. Ein älterer, wiederholt gescheiterter Actions-Workflow wurde entfernt.

Danach lautet die öffentliche Adresse:
https://droeseschule.github.io/aegypten-exit-game/

Auf den Schüler-iPads die Seite über **Safari** öffnen, nicht als HTML-Datei in der Dateien-App. Die Webseite benötigt keine Installation oder Schüler-Anmeldung.

## Fehlersuche
- Zeigt der Link 404 an? Prüfen, ob Pages auf `Deploy from a branch`, `main`, `/(root)` und **Save** gesetzt ist.
- Startet das Video nicht? Teste direkt `https://droeseschule.github.io/aegypten-exit-game/video.mp4` in Safari. Die hochgeladene Datei liegt im Stammverzeichnis neben `index.html`.
- Prüfe den Status unter [GitHub Actions](https://github.com/droeseschule/aegypten-exit-game/actions) auf den automatisch erstellten Pages-Build (nach Aktivierung).
