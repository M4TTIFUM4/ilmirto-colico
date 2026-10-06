# Il Mirto · sito della casa vacanze a Colico

Sito statico (HTML, CSS, JavaScript) pubblicato gratis su **GitHub Pages**, con calendario
sincronizzato con Airbnb e Booking.com tramite **GitHub Actions** (anch'esso gratuito).

## Struttura dei file

| File / cartella | A cosa serve |
|---|---|
| `index.html` | Pagina principale (hero, casa, foto, recensioni, mappa, calendario, prenotazione, FAQ, contatti) |
| `guida-colico.html` | Guida "Cosa fare a Colico": utile per farsi trovare su Google |
| `privacy.html`, `404.html` | Informativa privacy e pagina di errore |
| `assets/js/config.js` | **Contatti, link e impostazioni: quasi tutte le modifiche si fanno qui** |
| `assets/css/style.css` | Grafica (colori modificabili in cima al file) |
| `assets/img/foto/` | Foto ottimizzate in WebP (800 px e 1600 px) |
| `data/blocchi-manuali.json` | Le prenotazioni dirette da bloccare sul calendario |
| `data/availability.json` | Date occupate (generato in automatico, non modificarlo) |
| `scripts/sync_calendar.py` | Script che scarica i calendari iCal |
| `.github/workflows/pubblica-sito.yml` | Pubblica il sito e sincronizza i calendari ogni ora |

---

## Pubblicazione passo passo

### 1. Crea il repository su GitHub
1. Crea un account gratuito su <https://github.com> (se non lo hai già).
2. In alto a destra clicca **+ → New repository**.
3. Nome: ad esempio `ilmirto` (l'indirizzo sarà `https://TUO-UTENTE.github.io/ilmirto/`).
   Se lo chiami `TUO-UTENTE.github.io` l'indirizzo sarà direttamente `https://TUO-UTENTE.github.io/`.
4. Visibilità: **Public** (necessaria per GitHub Pages gratuito). Non aggiungere README. Clicca **Create repository**.

### 2. Carica i file
**Metodo semplice (dal browser):** nella pagina del repository vuoto clicca *uploading an existing file*,
trascina **tutto il contenuto** della cartella `SITO_ILMIRTO` e clicca **Commit changes**.
⚠️ Il caricamento dal browser a volte salta le cartelle che iniziano con il punto: controlla che nel
repository compaia la cartella `.github/workflows`. Se manca, creala con **Add file → Create new file**,
scrivendo come nome `.github/workflows/pubblica-sito.yml` e incollando il contenuto del file.

**Metodo con Git (consigliato):** dal terminale, nella cartella del sito:
```bash
git init -b main
```
```bash
git add .
```
```bash
git commit -m "Primo caricamento del sito"
```
```bash
git remote add origin https://github.com/TUO-UTENTE/ilmirto.git
```
```bash
git push -u origin main
```

### 3. Attiva GitHub Pages
Nel repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Poi vai nella scheda **Actions**, apri *Pubblica sito e sincronizza calendario* e clicca **Run workflow**.
Dopo circa un minuto il sito è online all'indirizzo indicato in Settings → Pages.

> Non serve modificare a mano l'indirizzo del sito: canonical, sitemap e anteprime social vengono
> compilati automaticamente con l'indirizzo giusto (anche se in futuro userai un dominio personalizzato).

### 4. Collega i calendari Airbnb e Booking.com
1. **Airbnb:** *Calendario → (seleziona l'annuncio) → Disponibilità → Sincronizzazione calendari → Esporta calendario*. Copia il link `.ics`.
2. **Booking.com:** Extranet → *Tariffe e disponibilità → Sincronizza calendari → Esporta calendario*. Copia il link.
3. Su GitHub: **Settings → Secrets and variables → Actions → New repository secret**:
   - Nome `AIRBNB_ICAL_URL`, valore: il link di Airbnb
   - Nome `BOOKING_ICAL_URL`, valore: il link di Booking.com
4. Scheda **Actions → Run workflow**. Da quel momento il calendario si aggiorna da solo **ogni ora**.

I link restano segreti (non compaiono nel sito). Nel sito viene pubblicato solo l'elenco delle date
occupate, senza nomi né dati degli ospiti.

**Consiglio importante:** collega anche Airbnb e Booking.com *tra loro* (importa in ciascuna
piattaforma il link esportato dall'altra). Così, se arriva una prenotazione su una, l'altra si blocca.

### 5. Inserisci i tuoi contatti
Apri `assets/js/config.js` (anche direttamente su GitHub, con l'icona della matita) e compila:
`email`, `telefono`, `whatsapp`, `bookingUrl`, ed eventualmente `formEmail`. Salva con **Commit changes**:
il sito si aggiorna da solo in circa un minuto. I campi lasciati vuoti vengono nascosti.

### 6. Fatti trovare su Google
1. Vai su <https://search.google.com/search-console>, aggiungi la proprietà con l'indirizzo del sito
   (verifica con il metodo *Tag HTML*: incolla il meta tag nel `<head>` di `index.html`).
2. In *Sitemap* invia `sitemap.xml`.
3. Crea o aggiorna la **scheda Google Business Profile** della casa vacanze e inserisci il link al sito:
   è il fattore che più aiuta per le ricerche locali ("casa vacanze Colico").
4. Aggiungi il link al sito anche nei tuoi profili social e nella guida/manuale della casa.

---

## Prenotazioni dirette

GitHub Pages è un hosting **statico**: non può eseguire pagamenti né salvare prenotazioni in un
database. Per questo il sito usa una soluzione gratuita e affidabile:

1. L'ospite sceglie le date sul calendario (le date occupate su Airbnb/Booking sono bloccate).
2. Invia una **richiesta** (non una prenotazione vincolante) con il modulo:
   - se in `config.js` è compilato `formEmail`, la richiesta arriva nella tua email tramite
     **FormSubmit.co** (gratuito, nessuna registrazione: al primo invio ricevi un'email di attivazione da confermare);
   - altrimenti si apre **WhatsApp** o il programma di posta dell'ospite con il messaggio già compilato.
3. Tu rispondi con prezzo e modalità di pagamento (es. bonifico o link di pagamento).
4. Quando confermi, **aggiungi le date** in `data/blocchi-manuali.json`:
   ```json
   { "arrivo": "2027-07-10", "partenza": "2027-07-17", "nota": "Rossi, diretta" }
   ```
   Le date vengono bloccate sul sito e nel file `calendario-diretto.ics`.
5. **Una sola volta**, importa su Airbnb e Booking.com il calendario
   `https://TUO-INDIRIZZO/calendario-diretto.ics` (*Importa calendario*): da allora le prenotazioni
   dirette bloccheranno automaticamente anche le piattaforme.

### Limiti da conoscere
- **Ritardo di sincronizzazione:** il sito si aggiorna ogni ora, ma Airbnb e Booking leggono i
  calendari importati con i loro tempi (in genere ogni 2–3 ore). Per questo il modulo invia una
  *richiesta* da confermare: così non c'è mai rischio di doppia prenotazione.
- **Prezzi:** i feed iCal contengono solo le date, non i prezzi. Il prezzo lo comunichi tu in risposta
  (oppure l'ospite lo vede su Airbnb/Booking).
- **Attività del repository:** GitHub sospende le azioni programmate dopo 60 giorni senza modifiche
  al repository. Ti avvisa via email: basta riattivarle dalla scheda Actions (o fare una piccola
  modifica, ad esempio aggiungere una prenotazione diretta).

---

## Modifiche frequenti

- **Testi:** modifica direttamente `index.html` (i testi sono in chiaro, in italiano).
- **Colori:** variabili all'inizio di `assets/css/style.css` (`--ink`, `--myrtle`, `--brass`…).
- **Aggiungere foto:** salva le immagini in `assets/img/foto/` in due misure (larghe 800 e 1600 px,
  formato WebP, ad esempio con <https://squoosh.app>) e copia un blocco `gallery__item` in `index.html`,
  cambiando nome file e testo `alt`.
- **Posizione esatta sulla mappa:** la posizione attuale è quella approssimativa mostrata da Airbnb.
  Inserisci le coordinate esatte (da Google Maps: tasto destro sul punto) in `config.js` e nel blocco
  JSON-LD di `index.html` (`latitude` / `longitude`).
- **Anteprima in locale:** dalla cartella del sito esegui `python -m http.server 8080` e apri
  <http://localhost:8080>.

## Foto e dati

Foto e testi provengono dall'annuncio Airbnb della struttura. Le foto sono dell'host: se sono state
scattate da un fotografo o da terzi, verifica di avere il permesso di usarle anche sul tuo sito.
I punteggi delle recensioni (4,74 su 27) vanno aggiornati a mano ogni tanto in `index.html`.
