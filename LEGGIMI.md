# NAPOLI RUN — Motorini Madness

Un endless runner 3D tra Via Toledo, Quartieri Spagnoli, Lungomare Caracciolo, Spaccanapoli, Piazza del Plebiscito e Porta Nolana. Gli otto tipi di motorini, i personaggi e gli edifici sono realizzati con geometrie procedurali. Il murale di Diego è un ritratto dipinto originale generato per questo gioco.

## Giocare subito

Apri `NAPOLI-RUN.html` in Chrome, Edge, Firefox o Safari con WebGL attivo. La copia HTML contiene tutto il gioco, il murale, la musica e le voci e funziona senza connessione. Il record viene conservato nel browser, se l’archiviazione locale è disponibile. L’audio parte premendo GIOCA e si può disattivare con il pulsante ♫.

Per il sorgente separato, servi la cartella `dist` con un server HTTP statico. Non occorrono installazioni di pacchetti o un processo di compilazione.

## Comandi

- A / D oppure frecce sinistra / destra: cambia corsia.
- Spazio / W / freccia su: salta casse di frutta o di pesce, pizze, sacchi e buche.
- S / freccia giù: scivola sotto il bucato.
- P / Esc: pausa e riprendi.
- Su telefono: scorri nelle quattro direzioni o usa i pulsanti touch.

I motorini, le sedie e i carretti si evitano cambiando corsia. Raccogli le fette dorate e sfiora i motorini per aumentare il moltiplicatore. Scegli la partenza nel menu. Ogni 450 metri cambia il quartiere e ogni giro di 2.700 metri li attraversa tutti e sei. RIPROVA rimescola le cinque tappe successive. Le scie di pizza indicano una corsia libera. Alcune disegnano un arco da seguire saltando. La velocità aumenta gradualmente senza un tetto massimo; le ondate diventano più ravvicinate.

## Potenziamenti

- Super Pizza: 4 secondi di invincibilità.
- Maradona Mode: 3 secondi, il pallone libera tutte le corsie davanti al giocatore.
- Espresso Boost: 3,5 secondi, velocità aumentata e moltiplicatore raddoppiato.
- Cornicello Magnet: 5 secondi, attira le pizze dalle corsie vicine.

I bonus compaiono ogni 22–34 secondi, dopo la prima opportunità a 18 secondi. Maradona ha il 6% delle comparse, Super Pizza il 21%, Espresso il 35% e Cornicello il 38%. Negli ultimi 1,2 secondi l’indicatore e gli effetti del personaggio lampeggiano. Il tempo si ferma in pausa.

## Audio e grafica

Tarantella originale in 6/8, con mandolino, fisarmonica, basso e tamburello sintetizzati. **28 campioni umani reali** di Totò, Peppino De Filippo, Carlo Croccolo, Massimo Troisi, La Smorfia e uno scongiuro registrato per strada. Sono estratti delle battute originali, con turni di dialogo completi e margini alle estremità. Nessuna voce clonata. Restano i fumetti napoletani e la battuta originale del gioco «T’aggio ditto ’e sta’ accorto!».

Al game over si sente sempre lo scambio completo del frate e di Troisi da *Non ci resta che piangere*: da «Ricordati che devi morire» a «Va bene… mo’ me lo segno proprio», compreso il seguito finale. È un unico campione continuo di circa 17 secondi. Anche RIPROVA lo lascia finire.

Al primo GIOCA parte subito «Annunciazione! Annunciazione!». Nei tentativi successivi il saluto cambia. Collisioni, bonus e RIPROVA lasciano finire la voce in corso e accodano la successiva. Pausa e ♫ OFF sospendono le voci senza riavvolgerle; alla ripresa si sente il seguito. Le reazioni ordinarie hanno 9–13 secondi di respiro dalla fine della precedente. La memoria delle battute sentite continua anche dopo RIPROVA. Nelle istruzioni, «ASCOLTA LA PROSSIMA VOCE» passa in rassegna tutti i 28 campioni e resta disabilitato fino alla fine di ciascuno.

Nuovo motore reale di un **Gilera Runner SP50 a due tempi**, più presente e dinamico all’avvicinarsi degli scooter, ambiente del mercato di Porta Nolana e clacson registrati occasionali, distanziati di almeno 4,5 secondi. Musica e rumori si abbassano mentre parla qualcuno. Tre regolazioni separate per musica, voci e strada, salvate localmente. Three.js r169 incluso con licenza MIT; fonti, intervalli dei campioni e attribuzioni in `ASSETS.md`.

Il protagonista è visto da dietro. I motorini hanno una propria velocità verso il giocatore, aggiunta alla velocità della strada, e ruote animate. Le facciate variano per altezza, colori, balconi, archi, tende, piante e insegne. Il murale ha una piazzetta aperta per mantenerlo visibile. Ogni passaggio sul lungomare contiene un solo Castel dell’Ovo, con bastioni, terrazze, portale, scogli e un collegamento alla costa, oltre a barche, palme e Vesuvio.

I dettagli sull’immagine generata e il prompt sono in `ASSETS.md`.

## Verifica

42 controlli della logica di gioco, scenari e audio: comandi, collisioni, punteggi, potenziamenti, rarità, quartieri, 1.000 righe con corsia riservata e una corsa di 2.000 metri. I quattordici controlli audio verificano anche l’avvio immediato, l’assenza di interruzioni per collisione e bonus, il mantenimento della frase al riavvio, la ripresa dopo pausa e mute, la rotazione, gli intervalli tra voci e clacson, e il volume del motore in avvicinamento. Nel browser sono verificati caricamento e riproduzione dei campioni e l’anteprima autonoma. Tutte le risorse sono incluse anche nell’HTML autonomo, senza streaming o servizi vocali esterni durante il gioco.

## Quartieri aggiornati

Via Toledo: undici tipi di vetrine, con MINISO e i pupazzi, Intesa Sanpaolo con bancomat, Leopoldo Infante e i dolci, KIKO e i cosmetici, oltre a ZARA, H&M, Bershka, ottica, calzature e bar. Galleria Umberto I stilizzata. Quartieri Spagnoli: facciate ravvicinate, bucato, bandiere azzurre con N circolare, piazzetta di Diego e due murales reali di Totò su lati opposti: il ritratto e **A Matt’!!**, la carta del re di denari firmata MR PENCIL. Lungomare: pizzerie, dehors e tre grandi alberghi distinti ispirati a **Grand Hotel Vesuvio**, **Royal Continental** ed **Excelsior**, una volta ciascuno per passaggio, oltre al singolo Castel dell’Ovo sulla destra. Spaccanapoli: pietra, librerie, cornicelli, botteghe, bancarelle e guglia. Il percorso è una ricostruzione arcade ispirata ai luoghi, non una mappa fedele.

In Piazza del Plebiscito corri tra Palazzo Reale, le due statue equestri e il colonnato di San Francesco di Paola. A Porta Nolana passi sotto l’arco, fra le torri di piperno e i banchi con alici, cozze e polpi. Il selciato usa una texture di basoli da 2.048 × 2.048 pixel, con una mappa delle normali della stessa risoluzione per far risaltare le fughe alla luce del sole. Il fondale del golfo distingue il Monte Somma dal Gran Cono. Nel menu **Grafica**, Auto segue la densità dello schermo e applica almeno 1,25× di campionamento quando il budget 4K UHD lo consente. Ultra punta al 125% della densità nativa, con un minimo richiesto di 2×, e può arrivare a 5.120 × 2.880 pixel interni in formato 16:9. Leggera limita il campionamento a 1,25× e al numero di pixel del Full HD. La risoluzione effettiva dipende dalla finestra e dai limiti WebGL. Puoi cambiare profilo durante la corsa e il browser ricorda la scelta.
