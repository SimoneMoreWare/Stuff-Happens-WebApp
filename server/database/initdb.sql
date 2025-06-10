-- Database Schema per "Stuff Happens"
-- Tema: University Life

-- Tabella Users
CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,  -- Hash della password
    salt TEXT NOT NULL,      -- Salt per l'hashing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Cards (situazioni orribili per tema)
CREATE TABLE Cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                    -- Nome della situazione
    image_url TEXT NOT NULL,               -- URL robohash
    bad_luck_index REAL NOT NULL UNIQUE,   -- Da 1 a 100, unico
    theme TEXT NOT NULL DEFAULT 'university_life', -- Tema delle carte
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (bad_luck_index >= 1 AND bad_luck_index <= 100),
    CHECK (theme IN ('university_life', 'travel', 'sports', 'love_life', 'work_life'))
);

-- Tabella Games (partite)
CREATE TABLE Games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,                       -- NULL per utenti anonimi
    status TEXT NOT NULL DEFAULT 'playing', -- 'playing', 'won', 'lost'
    cards_collected INTEGER DEFAULT 3,     -- Inizia con 3 carte
    wrong_guesses INTEGER DEFAULT 0,       -- Errori commessi
    current_round INTEGER DEFAULT 1,       -- Round corrente
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,                -- NULL se in corso
    FOREIGN KEY (user_id) REFERENCES Users(id),
    CHECK (status IN ('playing', 'won', 'lost')),
    CHECK (cards_collected >= 0 AND cards_collected <= 6),
    CHECK (wrong_guesses >= 0 AND wrong_guesses <= 3)
);

-- Tabella GameCards (carte coinvolte nelle partite)
CREATE TABLE GameCards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    round_number INTEGER NOT NULL,         -- In che round è stata presentata
    guessed_correctly BOOLEAN,             -- NULL se non ancora giocata
    position_guessed INTEGER,              -- Dove l'utente ha piazzato la carta
    is_initial BOOLEAN DEFAULT FALSE,      -- Se è una delle 3 carte iniziali
    played_at TIMESTAMP,                   -- Quando è stata giocata
    FOREIGN KEY (game_id) REFERENCES Games(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES Cards(id),
    CHECK (round_number >= 0),  -- 0 per carte iniziali, 1+ per round
    CHECK (position_guessed >= 0 OR position_guessed IS NULL)
);

-- Inserimento utenti di test
INSERT INTO Users (username, email, password, salt) VALUES 
    ('user1', 'u1@p.it', '3fe983f6c4d87ad47e52d5c706c1b261002692570c5877861a0fc807e22e1609322894cb4b3e4f1b0a7047b899feed0541205ebbb0a497500cfac1acbf56c4ea', '1753382924'),
    ('user2', 'u2@p.it', 'd399e53b6515abf6e0d07cb2176c25b3aa05b3ea4561fe7fd9c4b1d0ed79537f69d5a436a9e038955c2087ea196237b2ce8aefe66cb69e0e03c9941f9d704dbb', '7796344101');
    -- ('testuser', 'u3@p.it', '2ea46ac49fe8cb4ec4f30aa42e59c7d113ec531d52c5dce0d2a0f960efe86cfc3ac692ac33e1bb7c6637e3002559ec4f0f3d127ac86d7f22ebff285b03a4e413', '6432105316');

-- Inserimento carte (tema: University Life) - almeno 50
INSERT INTO Cards (name, image_url, bad_luck_index, theme) VALUES 
    ('Dormi troppo e perdi l''esame finale', 'images/card1.png', 95.0, 'university_life'),
    ('Il tuo laptop si rompe la notte prima della consegna', 'images/card2.png', 87.5, 'university_life'),
    ('Invii per sbaglio il file sbagliato per la tesi', 'images/card3.png', 92.0, 'university_life'),
    ('Ti accorgi di aver frequentato il corso sbagliato per un mese', 'images/card4.png', 76.5, 'university_life'),
    ('Il professore annuncia un test a sorpresa per cui non hai studiato', 'images/card5.png', 68.0, 'university_life'),
    ('Versi il caffè sui tuoi appunti durante un esame a libro aperto', 'images/card6.png', 45.5, 'university_life'),
    ('Il WiFi del campus va giù durante la consegna dell''esame online', 'images/card7.png', 83.0, 'university_life'),
    ('Dimentichi il badge universitario il giorno dell''esame', 'images/card8.png', 52.0, 'university_life'),
    ('I tuoi compagni di gruppo ti abbandonano una settimana prima della consegna', 'images/card9.png', 78.5, 'university_life'),
    ('Cancelli per sbaglio l''intero progetto del semestre', 'images/card10.png', 89.0, 'university_life'),
    
    ('La sveglia non suona e perdi l''orientamento', 'images/card11.png', 23.5, 'university_life'),
    ('Ti intossichi alla mensa il giorno prima degli esami', 'images/card12.png', 71.0, 'university_life'),
    ('Il tuo coinquilino porta le cimici da letto', 'images/card13.png', 64.5, 'university_life'),
    ('L''ascensore si rompe e vivi al 15° piano', 'images/card14.png', 31.0, 'university_life'),
    ('Ti chiudi fuori dalla camera alle 3 del mattino', 'images/card15.png', 41.0, 'university_life'),
    ('La tua borsa di studio viene revocata per un errore burocratico', 'images/card16.png', 97.5, 'university_life'),
    ('Ti addormenti in biblioteca e ti svegli chiuso dentro', 'images/card17.png', 28.0, 'university_life'),
    ('Ti rubano la bici dal campus', 'images/card18.png', 38.5, 'university_life'),
    ('Invii per sbaglio un messaggio personale al professore', 'images/card19.png', 55.5, 'university_life'),
    ('Il sistema di stampa va in crash quando devi stampare la tesi', 'images/card20.png', 72.5, 'university_life'),
    
    ('Ti ammali la prima settimana e rimani subito indietro', 'images/card21.png', 58.0, 'university_life'),
    ('Il tuo computer prende un virus e corrompe tutti i file', 'images/card22.png', 85.5, 'university_life'),
    ('Ti iscrivi per sbaglio a corsi magistrali da matricola', 'images/card23.png', 48.0, 'university_life'),
    ('Scatta l''allarme antincendio durante la tua presentazione', 'images/card24.png', 35.0, 'university_life'),
    ('Ti accorgi di aver usato il libro sbagliato tutto il semestre', 'images/card25.png', 61.5, 'university_life'),
    ('Si rompe la cinghia dello zaino e tutto si rovescia nel corridoio', 'images/card26.png', 18.5, 'university_life'),
    ('Rimani bloccato nell''ascensore del campus per 3 ore', 'images/card27.png', 42.5, 'university_life'),
    ('Il professore ti assegna un progetto di gruppo con persone che non hai mai visto', 'images/card28.png', 33.5, 'university_life'),
    ('La libreria del campus finisce i libri di testo obbligatori', 'images/card29.png', 26.0, 'university_life'),
    ('Ti siedi per sbaglio nell''aula sbagliata e rimani per tutta la lezione', 'images/card30.png', 21.5, 'university_life'),
    
    ('Il professore cambia la data dell''esame senza dire niente a nessuno', 'images/card31.png', 74.0, 'university_life'),
    ('Perdi gli appunti la notte prima dell''esame finale', 'images/card32.png', 67.5, 'university_life'),
    ('La navetta del campus si rompe e perdi la presentazione', 'images/card33.png', 59.5, 'university_life'),
    ('Il tuo coinquilino suona la batteria alle 2 di notte durante la sessione', 'images/card34.png', 46.0, 'university_life'),
    ('Ti iscrivi per sbaglio a un corso tenuto completamente in lingua straniera', 'images/card35.png', 53.0, 'university_life'),
    ('Il riscaldamento si rompe nel tuo dormitorio durante l''inverno', 'images/card36.png', 39.0, 'university_life'),
    ('Dimentichi di abbandonare un corso e prendi automaticamente F', 'images/card37.png', 81.0, 'university_life'),
    ('Il tuo partner di laboratorio contamina il vostro campione', 'images/card38.png', 56.5, 'university_life'),
    ('Internet del campus va giù durante la lezione online', 'images/card39.png', 36.5, 'university_life'),
    ('Invii per sbaglio la bozza invece dell''elaborato finale', 'images/card40.png', 79.0, 'university_life'),
    
    ('La calcolatrice si scarica durante l''esame di matematica', 'images/card41.png', 49.5, 'university_life'),
    ('Ti assegnano la camera del dormitorio peggiore possibile', 'images/card42.png', 29.5, 'university_life'),
    ('Il professore assegna la lettura di un libro che non esiste', 'images/card43.png', 43.5, 'university_life'),
    ('La mensa del campus ti intossica due volte in una settimana', 'images/card44.png', 75.5, 'university_life'),
    ('Scopri che la tua facoltà richiede un corso offerto solo ogni 3 anni', 'images/card45.png', 84.0, 'university_life'),
    ('Le slide della presentazione non si caricano durante la discussione', 'images/card46.png', 66.0, 'university_life'),
    ('Usi per sbaglio Wikipedia come fonte nella tesi', 'images/card47.png', 62.0, 'university_life'),
    ('La palestra del campus chiude per sempre il giorno che decidi di metterti in forma', 'images/card48.png', 32.0, 'university_life'),
    ('Ti assegnano un partner di gruppo che non parla la tua lingua', 'images/card49.png', 51.0, 'university_life'),
    ('Il tuo relatore di tesi va in sabbatico senza dirtelo', 'images/card50.png', 88.5, 'university_life'),
    
    ('Metti per sbaglio tutta la classe in copia su un''email personale', 'images/card51.png', 37.0, 'university_life'),
    ('Il sistema postale del campus perde i tuoi documenti importanti', 'images/card52.png', 69.5, 'university_life'),
    ('Il computer corregge automaticamente il titolo della tesi in qualcosa di inappropriato', 'images/card53.png', 54.5, 'university_life'),
    ('Dormi durante la cerimonia di laurea', 'images/card54.png', 91.5, 'university_life'),
    ('Il prestito studentesco viene rifiutato il giorno prima del pagamento delle tasse', 'images/card55.png', 99.0, 'university_life');

-- Inserimento di alcune partite completate per user1 (per la history)
INSERT INTO Games (user_id, status, cards_collected, wrong_guesses, current_round, completed_at) VALUES 
    (1, 'won', 6, 2, 6, '2024-05-15 14:30:00'),
    (1, 'lost', 4, 3, 4, '2024-05-14 16:45:00'),
    (1, 'won', 6, 1, 5, '2024-05-13 19:20:00');

-- Inserimento GameCards per le partite completate (esempio per la prima partita)
INSERT INTO GameCards (game_id, card_id, round_number, guessed_correctly, position_guessed, is_initial, played_at) VALUES 
    -- Carte iniziali della prima partita
    (1, 15, 0, NULL, NULL, TRUE, '2024-05-15 14:00:00'),
    (1, 25, 0, NULL, NULL, TRUE, '2024-05-15 14:00:00'),
    (1, 35, 0, NULL, NULL, TRUE, '2024-05-15 14:00:00'),
    -- Round successivi
    (1, 8, 1, TRUE, 2, FALSE, '2024-05-15 14:05:00'),
    (1, 18, 2, FALSE, 1, FALSE, '2024-05-15 14:10:00'),
    (1, 28, 3, TRUE, 3, FALSE, '2024-05-15 14:15:00'),
    (1, 38, 4, TRUE, 1, FALSE, '2024-05-15 14:20:00'),
    (1, 48, 5, FALSE, 4, FALSE, '2024-05-15 14:25:00'),
    (1, 5, 6, TRUE, 5, FALSE, '2024-05-15 14:30:00');