# PROJEKT: AJAY ADAM – Offizielle DJ-Website

## 0. Arbeitsweise (WICHTIG)
- Lies diese Spezifikation vollständig. Erstelle zuerst einen Umsetzungsplan in Phasen und warte auf meine Freigabe, bevor du Code schreibst.
- Speichere diese Spezifikation als `SPEC.md` im Repo und halte dich durchgehend daran.
- Arbeite Phase für Phase. Am Ende jeder Phase: lauffähiger Stand, kurze Zusammenfassung, was ich testen soll.
- Erfinde keine Inhalte (Bio, Events, Preise). Nutze Platzhalter, die klar als `TODO` markiert sind, und die Inhalte aus Abschnitt 5.
- Entwickle lokal gegen die Firebase Emulator Suite und PayPal Sandbox. Kein Deployment ohne meine Freigabe.
- Code und Bezeichner auf Englisch, UI-Texte über i18n-Dateien (DE + EN).

## 1. Überblick
Persönliche Website für AJAY ADAM (aka AJAY), DJ & Producer aus Wien. Claim: „NO GENRE, JUST VIBES“.
Ziele:
1. Alles aus seinem Linktree an einem Ort, schöner und markenstärker.
2. Upcoming Events ansehen, Event öffnen, auf die Gästeliste eintragen ODER Tickets via PayPal kaufen.
3. Booking-Anfragen strukturiert empfangen.
4. Ajay kann sich einloggen und Inhalte und Design-Basics selbst ändern, ohne Code.
Zielgruppe kommt zu ~90 % über den Instagram-/TikTok-Link in Bio auf dem Handy → **Mobile first, kompromisslos**.

## 2. Tech-Stack
- Vite + React 18 + TypeScript
- Tailwind CSS
- Motion (Framer Motion) für UI-Animationen und Seitenübergänge, Lenis für Smooth Scroll
- React Router (Routen siehe Abschnitt 4)
- Firebase: Hosting, Firestore, Authentication, Storage, Cloud Functions (Node 20, TypeScript, 2nd gen, Region europe-west1), App Check (reCAPTCHA Enterprise)
- E-Mails: Firebase Extension „Trigger Email from Firestore“ (SMTP, Absender z. B. no-reply@ajay.at)
- Zahlungen: PayPal JavaScript SDK (Smart Buttons) im Frontend + PayPal Orders API v2 serverseitig in Cloud Functions
- QR-Codes: `qrcode` (Generierung serverseitig), `html5-qrcode` (Scanner im Admin)
- Formulare: react-hook-form + zod (gleiche zod-Schemas im Frontend und in Functions wiederverwenden)

## 3. Design-System
**Referenz-Mix:** Struktur und Härte von carlcox.com + Feinschliff und Interaktionen von Apple.

Carl-Cox-Elemente:
- Schwarzer Grundton, Vollbild-Hero mit großem Foto/Video und einem Zitat/Claim in großer Typo
- Navigation über große Bild-Kacheln mit Titel + Untertitel (z. B. „EVENTS / & TICKETS“, „DROPS / EDIT PACKS & TOOLS“)
- Minimaler Header: Logo links, Burger rechts → Vollbild-Overlay-Menü mit großen Links und Social-Icons

Apple-Elemente:
- Typografie: Inter (Variable) als Fallback für SF Pro; riesige Headlines (clamp, bis 12vw auf Mobile), eng gesetzt (tracking-tight), viel Weißraum
- Glas-Optik: `backdrop-blur` + halbtransparente Flächen für Header, Bottom Sheets, Sticky-Elemente
- Großzügige Radien (20–28px), weiche Schatten, 1px-Hairline-Borders in white/10
- Mobile Interaktionen: Bottom Sheets statt Modals (mit Drag-to-dismiss), Segmented Controls, große Touch-Targets (min. 48px), Press-Feedback (scale 0.97 auf Tap)
- Federnde Spring-Animationen statt linearer Übergänge

„Aufbrausend“ / Energie:
- Hero: Video-Loop oder Ken-Burns-Foto + animierter Grain/Noise-Layer + langsam wandernder Farbverlauf in der Akzentfarbe
- Endlos-Laufband (Marquee) mit „NO GENRE, JUST VIBES • AFRO • BAILE FUNK • LATIN • BOUYON • EDITS •“
- Scroll-getriggerte Reveals (Text zeilenweise von unten einblenden, Bilder mit Clip-Path-Reveal), dezente Parallax
- Sticky „Next Event“-Pill unten am Bildschirm (Glas), zeigt das nächste Event mit Countdown, Tap → Event-Seite
- Akzentfarbe ist im Admin einstellbar (Default: elektrisches Rot #FF2D2D oder TODO nach Ajays Branding)
- `prefers-reduced-motion` respektieren: alle großen Animationen abschalten
- Performance-Budget: LCP < 2,5 s auf 4G, Hero-Video max. ~3 MB, Poster-Bild zuerst, Bilder als AVIF/WebP mit `srcset`, Lazy Loading

Dark Mode only. Safe Areas beachten (`viewport-fit=cover`, `env(safe-area-inset-*)`).

## 4. Seitenstruktur & Routen
`/` – Startseite (One-Pager mit Sektionen):
1. **Hero:** Name „AJAY ADAM“, Untertitel „DJ & PRODUCER — VIENNA“, Claim, 2 CTAs: „Upcoming Events“ und „Book Ajay“
2. **Marquee-Laufband**
3. **Upcoming Events:** horizontales Swipe-Karussell (Snap-Scroll) mit großen Event-Karten (Flyer, Datum groß, Location, Status-Badge: „Guestlist open“ / „Tickets“ / „Sold out“)
4. **Kachel-Navigation (Carl-Cox-Stil):** Music, Sets, Drops, LECTION, Press Kit, Booking
5. **Music:** Spotify-Artist-Embed, Links zu Apple Music, Amazon Music, Deezer, SoundCloud (2 Accounts), Mixcloud, Spotify-Playlists
6. **Sets / Video:** YouTube-Embeds (lazy, erst Thumbnail, Embed erst bei Tap – Datenschutz + Performance), Links zu Playlists und Twitch
7. **Drops:** Karten für Edit Packs und Tools mit Cover, Titel und Button „Get it“ (externe Links)
8. **About:** kurze Bio (TODO), Genres, Fotos
9. **Booking:** Formular (siehe 8.)
10. **Support:** dezenter PayPal.me-Button „Support me“
11. **Footer:** Social-Icons, Impressum, Datenschutz, AGB, ©

`/events` – alle Upcoming Events + Bereich „Past Events“ (eingeklappt)
`/events/:slug` – Event-Detailseite (siehe 6.)
`/tickets/:ticketId` – Ticket-Ansicht mit QR-Code (Link aus der Bestätigungs-Mail)
`/booking` – Booking-Formular als eigene Seite (teilbar)
`/press` – Press Kit (Bio kurz und lang, Download-Button PDF, Pressefotos)
`/impressum`, `/datenschutz`, `/agb`
`/admin/*` – geschützter Admin-Bereich (siehe 9.)

## 5. Inhalte (aus Linktree übernehmen, im Admin editierbar)
Identität: AJAY ADAM aka AJAY · DJ & PRODUCER · VIENNA (AUSTRIA) · „NO GENRE, JUST VIBES“
Booking-Mail: booking@ajay.at

Social:
- Instagram: https://www.instagram.com/ajay.adam
- TikTok: https://www.tiktok.com/@ajay_adam
- YouTube (AJAY): https://www.youtube.com/channel/UCbarwFBxhndGVWTjlznesKg
- YouTube (Edits, Remixes & Live Sets): https://www.youtube.com/channel/UCga2Gfg9z_rMUor-uY7Vsog
- Twitch: https://www.twitch.tv/ajayadam
- SoundCloud: https://soundcloud.com/ajay-adam und https://soundcloud.com/ajayadam2
- Mixcloud (Mixtapes): https://www.mixcloud.com/ajayadam/
- Bandcamp: https://ajaydeejay.bandcamp.com

Streaming:
- Spotify Artist: TODO volle URL
- Apple Music: https://music.apple.com/at/artist/ajay-adam/1545704921
- Amazon Music: https://music.amazon.de/artists/B08R1MJHWZ/ajay-adam
- Deezer: https://www.deezer.com/de/artist/117403062
- Alle Spotify-Playlists: https://linktr.ee/playlistbyajay

Sets & Video:
- LECTION DJ Sets (Playlist): https://www.youtube.com/watch?v=C_EhCu7DxhM&list=PLHcdhMen3mzZInnkiHkOnvG5T9k1yIrTh
- LECTION #15 – Cabrio Session Set 2026: https://www.youtube.com/watch?v=cmGj8P4FfV0
- Full DJ Sets (Video): https://youtube.com/playlist?list=PLJD69D0gv_ZwxS6aPekwRjRlgYcP4Ra1s

Drops:
- Loop Tools 01 (1500+ Sounds): https://ajayvienna.gumroad.com/l/ajaylooptools01
- DJ Cheat Codes Vol. 1: https://ajaydeejay.bandcamp.com/album/cheat-codes-vol-1
- DJ Cheat Codes Vol. 2: https://ajaydeejay.bandcamp.com/album/cheat-codes-vol-2
- All Edits Pack 2025: https://hypeddit.com/ajayadam/xmas2025pack
- WANTED.7 (Club Edit Pack): TODO URL

Eventreihe: LECTION – hosted by AJAY: https://linktr.ee/lection.vie
Support: https://www.paypal.com/paypalme/ajayadam
Press Kit 2026: PDF-Upload im Admin; Inhalte: Bio kurz/lang, Logo & Branding, Presse-Highlights, Booking-Infos. Hochauflösende Fotos/Videos „auf Anfrage“.

Alle Links werden als Seed-Daten in Firestore angelegt (nicht hart codiert), damit Ajay sie im Admin ändern, umsortieren und ausblenden kann.

## 6. Events
Event-Detailseite `/events/:slug`:
- Großer Flyer (Hero), Titel, Datum + Uhrzeit (Europe/Vienna), Location mit Link zu Google/Apple Maps, Line-up, Beschreibung, Altersgrenze, Dresscode (optional)
- Buttons je nach Event-Konfiguration: „Join Guestlist“ und/oder „Buy Tickets“ und/oder „External Tickets“ (Link, falls der Veranstalter selbst verkauft)
- „Add to Calendar“ (.ics-Download) und „Share“ (Web Share API, Fallback: Link kopieren)
- Countdown bis Eventbeginn
- Statuslogik: Guestlist offen/geschlossen (Kapazität erreicht oder Deadline überschritten), Tickets verfügbar/ausverkauft, Event vergangen → nur noch Archivansicht
- Aktionen öffnen ein Bottom Sheet (Mobile) bzw. ein Modal (Desktop)

## 7. Gästeliste
- Felder: Vorname, Nachname, E-Mail, optional Telefon, Anzahl Begleitpersonen (0 bis maxPlusOnes je Event), Pflicht-Checkbox Datenschutz, optional Newsletter-Opt-in (getrennt!)
- Schreiben über eine Callable Cloud Function `joinGuestlist` (nicht direkt aus dem Client): prüft Kapazität in einer Transaktion, Deadline, Duplikate (gleiche E-Mail pro Event), App Check
- Bestätigungs-Mail mit Eventdaten; Status „confirmed“ oder „waitlist“, wenn die Kapazität voll ist
- Erfolgsanimation (Häkchen mit Spring-Animation)

## 8. Tickets via PayPal
- Pro Event mehrere Ticketarten möglich (z. B. Early Bird, Regular) mit Preis (EUR), Kontingent, Verkaufszeitraum, max. Anzahl pro Bestellung
- Ablauf:
  1. Nutzer wählt Ticketart + Anzahl und gibt Name + E-Mail ein, akzeptiert AGB
  2. Function `createPayPalOrder`: berechnet den Preis serverseitig aus Firestore (dem Client niemals vertrauen), reserviert das Kontingent für 10 Minuten, erstellt eine PayPal-Order
  3. PayPal Smart Buttons (PayPal, Karte; Apple Pay/Google Pay nur wenn verfügbar)
  4. Function `capturePayPalOrder`: Capture, Status prüfen, Kontingent final abbuchen (Transaktion), pro Person ein Ticket-Dokument mit eindeutiger ID + signiertem QR-Token
  5. Bestätigungs-Mail mit Link zu `/tickets/:ticketId` und QR-Code
- PayPal-Webhook-Function als Absicherung (z. B. Capture erfolgreich, aber Client abgebrochen), idempotent
- Abgelaufene Reservierungen per Scheduled Function freigeben
- Refunds manuell im PayPal-Dashboard; im Admin Ticket als „refunded“ markierbar
- Secrets (PayPal Client Secret) nur über Firebase Secret Manager, Sandbox/Live per Umgebungsvariable

## 9. Booking
- Felder: Name, Firma/Veranstalter (optional), E-Mail, Telefon, Art des Events (Club, Festival, Private, Corporate, Hochzeit, Sonstiges), Datum, Stadt/Location, Set-Länge, erwartete Gäste, Budget-Rahmen (Auswahl), Nachricht, Datenschutz-Checkbox
- Speichern über Function `submitBooking` + Benachrichtigungs-Mail an booking@ajay.at + Eingangsbestätigung an den Anfragenden
- Honeypot-Feld + App Check gegen Spam

## 10. Admin-Bereich `/admin`
Login: Firebase Auth (E-Mail/Passwort + Google). Zugriff nur mit Custom Claim `admin: true` (Setup-Skript `scripts/setAdmin.ts` zum Vergeben). Admin-UI ebenfalls mobile-first, damit Ajay alles vom Handy aus erledigen kann.

Module:
1. **Dashboard:** nächste Events, Gästelisten-Zahlen, verkaufte Tickets + Umsatz, neue Booking-Anfragen
2. **Design / Theme:**
   - Hintergrund: Farbe, Verlauf (2–3 Farben + Winkel), Bild-Upload oder Video-Upload (mit Overlay-Deckkraft-Regler)
   - Hero: Bild/Video, Headline, Subline, Claim-Zitat
   - Akzentfarbe (Color Picker), Logo-Upload
   - Marquee-Text
   - Sektionen ein-/ausblenden und umsortieren
   - Live-Vorschau (Handy-Rahmen) vor dem Speichern, dann „Publish“
3. **Links & Drops:** CRUD, Drag & Drop zum Sortieren, Sichtbarkeit togglen, Cover-Upload
4. **Events:** CRUD, Flyer-Upload (automatisch komprimiert/zugeschnitten), Gästeliste ein/aus mit Kapazität, Deadline und maxPlusOnes, Ticketarten, externer Ticketlink, Entwurf/Veröffentlicht
5. **Gästeliste:** Liste pro Event, Suche, CSV-Export, Check-in per Tap, Einträge löschen
6. **Tickets & Bestellungen:** Liste, Status, CSV-Export, „refunded“ markieren
7. **Check-in-Scanner:** Kamera-QR-Scanner für Tickets am Einlass, großes grünes/rotes Feedback, Schutz gegen doppelten Einlass
8. **Booking-Inbox:** Status (neu, in Bearbeitung, bestätigt, abgelehnt), Notizfeld, Antworten per mailto
9. **Texte & Rechtliches:** Bio, Press-Kit-PDF, Impressum, Datenschutz, AGB (Rich-Text-Editor)

## 11. Datenmodell (Firestore)
- `settings/theme`, `settings/site` (Texte, Socials, Sektionen-Reihenfolge)
- `links/{id}` (title, subtitle, url, category: social|streaming|sets|drops, coverUrl, order, visible)
- `events/{id}` (slug, title, startsAt, endsAt, venue{name,address,mapsUrl}, flyerUrl, description, lineup[], minAge, status: draft|published, guestlist{enabled,capacity,deadline,maxPlusOnes,count}, ticketing{enabled, externalUrl}, createdAt)
- `events/{id}/ticketTypes/{id}` (name, priceCents, currency, quota, sold, reserved, salesStart, salesEnd, maxPerOrder)
- `events/{id}/guestlist/{id}` (firstName, lastName, email, phone, plusOnes, status, checkedIn, createdAt)
- `orders/{id}` (eventId, items[], totalCents, paypalOrderId, status: pending|paid|expired|refunded, buyer{name,email}, createdAt)
- `tickets/{id}` (orderId, eventId, ticketTypeId, holderName, qrToken, checkedInAt)
- `bookings/{id}` (alle Formularfelder, status, notes, createdAt)
- `mail/{id}` (für die Trigger-Email-Extension)

## 12. Sicherheit
- Firestore Rules: öffentlich lesbar nur `settings`, sichtbare `links`, veröffentlichte `events` und `ticketTypes` (ohne interne Felder). Gästeliste, Orders, Tickets, Bookings: Lesen nur für Admin. Alle Schreibvorgänge von Nutzern nur über Functions. Ausnahme: Ticket-Ansicht über eine Function mit ticketId + Token.
- Storage Rules: Upload nur für Admin, Typ- und Größenlimits
- App Check auf allen Functions
- Rate Limiting für Formulare (pro IP/E-Mail)
- Rules-Tests mit dem Emulator schreiben

## 13. SEO & Teilen
- Pro Event: Open-Graph- und Twitter-Card-Tags (Flyer als Bild). Da SPA: Firebase-Hosting-Rewrite `/events/**` auf eine Function, die das index.html mit den richtigen Meta-Tags ausliefert
- schema.org JSON-LD: `MusicEvent` pro Event, `Person`/`MusicGroup` für Ajay
- sitemap.xml (dynamisch), robots.txt, Favicon, Apple Touch Icon, Web App Manifest (installierbar als PWA)

## 14. Recht & Datenschutz (Österreich/EU)
- Seiten für Impressum, Datenschutzerklärung und AGB (Inhalte im Admin pflegbar, Platzhalter mit TODO-Hinweis)
- Cookie-/Consent-Banner nur, falls Tracking oder Embeds Cookies setzen. YouTube/Spotify/SoundCloud erst nach Klick laden (Zwei-Klick-Lösung), YouTube über youtube-nocookie.com
- Pflicht-Checkboxen mit Link zur Datenschutzerklärung; Newsletter-Opt-in separat und nicht vorausgewählt
- Ticketkauf: AGB-Checkbox, klare Preisangabe inkl. Gebühren

## 15. Qualität
- Lighthouse Mobile: Performance ≥ 90, Accessibility ≥ 95
- Semantisches HTML, Fokus-Styles, Alt-Texte, ausreichende Kontraste auch bei Admin-Hintergründen (Overlay erzwingen)
- Getestet auf iPhone Safari und Android Chrome (kleinste Breite 360px)
- ESLint + Prettier, saubere Ordnerstruktur, README mit Setup-, Emulator- und Deploy-Anleitung

## 16. Phasen
1. Setup (Vite, Tailwind, Firebase-Projekt, Emulatoren, Ordnerstruktur, Design-Tokens) + statische Startseite mit allen Sektionen und Seed-Daten
2. Animationen & Feinschliff (Hero, Marquee, Reveals, Bottom Sheets, Menü, Next-Event-Pill)
3. Events (Liste, Detail, .ics, Share, OG-Function)
4. Gästeliste + Booking + E-Mails
5. Admin: Login, Theme-Editor, Links, Events, Inbox
6. PayPal-Tickets (Sandbox), Ticket-Seite, Scanner
7. Rechtliches, SEO, PWA, Performance, Tests, Deploy-Anleitung + Custom Domain

## 17. Offene Annahmen (vor dem Start bestätigen)
- Domain: ajay.at (über Firebase Hosting Custom Domain)
- Sprachen: Englisch als Default, Deutsch umschaltbar
- Booking-Empfänger: booking@ajay.at
- Akzentfarbe/Logo: TODO von Ajay
- Ticket-Bezahlung: PayPal (inkl. Kartenzahlung über PayPal)
