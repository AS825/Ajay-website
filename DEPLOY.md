# Website live stellen (Firebase)

Diese Anleitung bringt die Website auf `https://<projekt-id>.web.app`, sodass Ajay sie unter
`/admin` selbst bearbeiten kann. Die eigene Domain (ajay.at) kann später dazukommen (Schritt 9).

Dauer: ca. 30–45 Minuten beim ersten Mal. Alle Befehle im Projektordner in PowerShell ausführen.

---

## 0. Voraussetzungen

- Ein Google-Konto (wird Eigentümer des Firebase-Projekts – am besten eines, auf das Ajay und du
  langfristig Zugriff habt).
- Eine Kreditkarte für den **Blaze-Tarif** (Pay-as-you-go). Cloud Functions und Storage brauchen
  ihn. Für eine Seite dieser Größe bleibt man praktisch immer in den kostenlosen Kontingenten
  (meist 0 €, selten ein paar Cent bis wenige Euro im Monat). In Schritt 2 setzt du ein Budget-Limit
  mit Warnung.
- Der aktuelle Stand des Repos: `git pull` und `npm install`.

## 1. Firebase-Projekt anlegen

1. <https://console.firebase.google.com> → **Projekt hinzufügen**.
2. Name z. B. `ajay-website` (die Projekt-ID darunter merken, z. B. `ajay-website-1a2b3`).
3. Google Analytics: **aus** (nicht nötig, spart einen Cookie-Banner).

## 2. Blaze-Tarif + Budget

1. Unten links auf **Spark** → **Upgrade** → **Blaze** → Rechnungskonto anlegen/wählen.
2. Beim Upgrade ein **Budget** setzen, z. B. 10 € mit E-Mail-Warnung.

## 3. Dienste einschalten (in der Firebase-Konsole, Menü „Build“ bzw. „Entwickeln“)

1. **Firestore Database** → _Datenbank erstellen_ → Standort **europe-west3 (Frankfurt)** →
   _Produktionsmodus_. (Der Standort lässt sich später nicht ändern.)
2. **Storage** → _Jetzt starten_ → gleicher Standort → _Produktionsmodus_.
3. **Authentication** → _Jetzt starten_ → Anbieter **Google** aktivieren (Support-E-Mail wählen) →
   Speichern. Optional zusätzlich _E-Mail/Passwort_.
4. **Web-App registrieren:** Projektübersicht (Zahnrad → _Projekteinstellungen_) → _Meine Apps_ →
   Symbol `</>` → Name „AJAY Website“, Häkchen bei **„Firebase Hosting einrichten“** → _App
   registrieren_. Die angezeigte Konfiguration musst du **nicht** kopieren – die Seite holt sie sich
   beim Hosting automatisch.

## 4. Projekt mit dem Code verbinden

```powershell
npx firebase login
npx firebase use --add
```

Bei `use --add` dein neues Projekt auswählen und als Alias **`prod`** eingeben.

> Falls PowerShell „Ausführen von Skripts ist deaktiviert“ meldet: stattdessen `npx.cmd firebase …`
> verwenden oder die Befehle in der normalen Eingabeaufforderung (cmd) ausführen.

## 5. Admin-E-Mails eintragen

Datei `functions/.env` öffnen und die Google-Adressen eintragen, die Admin werden dürfen:

```
ADMIN_EMAILS=ajay@gmail.com,deine@gmail.com
```

Die anderen Werte (`SITE_ORIGIN`, `ENFORCE_APP_CHECK`) vorerst so lassen.

## 6. Deployen

```powershell
npm run deploy
```

Beim ersten Mal fragt die Firebase-CLI, ob sie Google-Cloud-Dienste aktivieren darf (Cloud
Functions, Cloud Build, Artifact Registry, Cloud Scheduler …) → jeweils **Ja**. Bei der Frage nach
einer _Cleanup-Policy_ für Container-Images ebenfalls **Ja** (z. B. 1 Tag).

Der erste Deploy dauert 5–10 Minuten. Kommt beim ersten Mal ein Fehler zu Berechtigungen
(„permission denied“ / „Eventarc“ / „service account“), ein paar Minuten warten und
`npm run deploy` noch einmal ausführen – Google braucht beim allerersten Mal manchmal etwas, bis
alle Dienste bereit sind.

Am Ende steht: `Hosting URL: https://<projekt-id>.web.app`.

## 7. Als Admin anmelden und Inhalte importieren

1. `https://<projekt-id>.web.app/admin` öffnen → **Mit Google fortfahren**.
2. Es erscheint „Kein Zugriff“ → **Admin-Zugang aktivieren** (funktioniert für die E-Mails aus
   Schritt 5).
3. Im Dashboard erscheint **„Website einrichten“** → **Startinhalte importieren**. Damit sind alle
   Links aus dem Linktree, Texte und Design auf der Live-Seite.
4. Jetzt das erste echte Event anlegen (Admin → Events → Neues Event → Veröffentlichen).

## 8. Ajay einladen

Ajay öffnet `https://<projekt-id>.web.app/admin`, meldet sich mit seinem Google-Konto an und tippt
auf **Admin-Zugang aktivieren**. Seine Adresse muss in `ADMIN_EMAILS` stehen. Kommt später jemand
dazu: E-Mail ergänzen und nur die Functions neu deployen:

```powershell
npx firebase deploy --project prod --only functions
```

---

## 9. Später / optional

**Eigene Domain ajay.at**

1. Konsole → _Hosting_ → _Benutzerdefinierte Domain hinzufügen_ → `ajay.at` (und `www.ajay.at`).
2. Die angezeigten DNS-Einträge beim Domain-Anbieter eintragen. Das Zertifikat kommt automatisch
   (kann bis zu 24 h dauern).
3. _Authentication_ → _Einstellungen_ → _Autorisierte Domains_ → `ajay.at` hinzufügen.
4. In `functions/.env`: `SITE_ORIGIN=https://ajay.at`, dann `npx firebase deploy --project prod --only functions`.

**E-Mails (Bestätigungen für Gästeliste und Booking)**
Ohne diesen Schritt funktionieren Formulare, nur werden keine Mails verschickt (sie liegen in der
Sammlung `mail`). Einrichtung:

```powershell
npx firebase ext:install firebase/firestore-send-email --project prod
```

Sammlung: `mail`, SMTP-Zugang des Absenders (z. B. `no-reply@ajay.at` beim Mail-Anbieter der Domain),
Absender: `AJAY ADAM <no-reply@ajay.at>`.

**Spam-Schutz App Check** (empfohlen, sobald die Seite bekannt ist)

1. Konsole → _App Check_ → Web-App → **reCAPTCHA Enterprise** → Site-Key anlegen.
2. Datei `web/.env.production` anlegen mit `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=<key>`.
3. In `functions/.env`: `ENFORCE_APP_CHECK=true`, dann `npm run deploy`.

**Aufräumen alter Spam-Zähler:** Google Cloud Console → Firestore → _Time-to-live_ → Richtlinie
für Sammlung `rateLimits`, Feld `expiresAt`.

**Instagram:** siehe README, Abschnitt „Automatic content“ – Zugangsschlüssel im Admin unter
Links → Automatische Inhalte eintragen.

## Updates einspielen

Wenn es neue Änderungen im Code gibt:

```powershell
git pull
npm install
npm run deploy
```

Inhalte, die Ajay im Admin gepflegt hat, bleiben dabei unverändert.
