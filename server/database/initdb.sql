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
    ('user2', 'u2@p.it', 'd399e53b6515abf6e0d07cb2176c25b3aa05b3ea4561fe7fd9c4b1d0ed79537f69d5a436a9e038955c2087ea196237b2ce8aefe66cb69e0e03c9941f9d704dbb', '7796344101'),
    ('testuser', 'u3@p.it', '3fe983f6c4d87ad47e52d5c706c1b261002692570c5877861a0fc807e22e1609322894cb4b3e4f1b0a7047b899feed0541205ebbb0a497500cfac1acbf56c4ea', '1753382924');

-- Inserimento carte (tema: University Life) - almeno 50
INSERT INTO Cards (name, image_url, bad_luck_index, theme) VALUES 
    ('You oversleep and miss your final exam', 'https://robohash.org/oversleep-exam?set=set2', 95.0, 'university_life'),
    ('Your laptop crashes the night before assignment deadline', 'https://robohash.org/laptop-crash?set=set2', 87.5, 'university_life'),
    ('You accidentally submit the wrong file for your thesis', 'https://robohash.org/wrong-thesis?set=set2', 92.0, 'university_life'),
    ('You realize you''ve been attending the wrong class for a month', 'https://robohash.org/wrong-class?set=set2', 76.5, 'university_life'),
    ('Your professor announces a surprise test you didn''t study for', 'https://robohash.org/surprise-test?set=set2', 68.0, 'university_life'),
    ('You spill coffee all over your notes during an open-book exam', 'https://robohash.org/coffee-notes?set=set2', 45.5, 'university_life'),
    ('The campus WiFi goes down during online exam submission', 'https://robohash.org/wifi-down?set=set2', 83.0, 'university_life'),
    ('You forget your student ID card on exam day', 'https://robohash.org/forgot-id?set=set2', 52.0, 'university_life'),
    ('Your group project partners abandon you a week before deadline', 'https://robohash.org/abandoned-group?set=set2', 78.5, 'university_life'),
    ('You accidentally delete your entire semester project', 'https://robohash.org/deleted-project?set=set2', 89.0, 'university_life'),
    
    ('Your alarm doesn''t go off and you miss orientation', 'https://robohash.org/missed-orientation?set=set2', 23.5, 'university_life'),
    ('You get food poisoning from the cafeteria the day before finals', 'https://robohash.org/food-poisoning?set=set2', 71.0, 'university_life'),
    ('Your dorm roommate brings bedbugs', 'https://robohash.org/bedbugs?set=set2', 64.5, 'university_life'),
    ('The elevator breaks down when you live on the 15th floor', 'https://robohash.org/broken-elevator?set=set2', 31.0, 'university_life'),
    ('You lock yourself out of your dorm at 3 AM', 'https://robohash.org/locked-out?set=set2', 41.0, 'university_life'),
    ('Your scholarship gets revoked due to a paperwork error', 'https://robohash.org/scholarship-revoked?set=set2', 97.5, 'university_life'),
    ('You fall asleep in the library and wake up locked inside', 'https://robohash.org/locked-library?set=set2', 28.0, 'university_life'),
    ('Your bike gets stolen from campus', 'https://robohash.org/stolen-bike?set=set2', 38.5, 'university_life'),
    ('You accidentally send a personal text to your professor', 'https://robohash.org/wrong-text?set=set2', 55.5, 'university_life'),
    ('The printing system crashes when you need to print your thesis', 'https://robohash.org/printer-crash?set=set2', 72.5, 'university_life'),
    
    ('You get sick during the first week and fall behind immediately', 'https://robohash.org/first-week-sick?set=set2', 58.0, 'university_life'),
    ('Your computer gets a virus and corrupts all your files', 'https://robohash.org/computer-virus?set=set2', 85.5, 'university_life'),
    ('You accidentally register for graduate-level courses as a freshman', 'https://robohash.org/wrong-registration?set=set2', 48.0, 'university_life'),
    ('The fire alarm goes off during your presentation', 'https://robohash.org/fire-alarm?set=set2', 35.0, 'university_life'),
    ('You realize you''ve been using the wrong textbook all semester', 'https://robohash.org/wrong-textbook?set=set2', 61.5, 'university_life'),
    ('Your backpack strap breaks and everything spills in the hallway', 'https://robohash.org/broken-backpack?set=set2', 18.5, 'university_life'),
    ('You get stuck in the campus elevator for 3 hours', 'https://robohash.org/stuck-elevator?set=set2', 42.5, 'university_life'),
    ('Your professor assigns a group project with people you''ve never met', 'https://robohash.org/unknown-group?set=set2', 33.5, 'university_life'),
    ('The campus bookstore runs out of required textbooks', 'https://robohash.org/no-textbooks?set=set2', 26.0, 'university_life'),
    ('You accidentally sit in the wrong classroom and stay the whole lecture', 'https://robohash.org/wrong-room?set=set2', 21.5, 'university_life'),
    
    ('Your professor changes the exam date without telling anyone', 'https://robohash.org/changed-exam?set=set2', 74.0, 'university_life'),
    ('You lose your notes the night before the final', 'https://robohash.org/lost-notes?set=set2', 67.5, 'university_life'),
    ('The campus shuttle breaks down and you miss your presentation', 'https://robohash.org/broken-shuttle?set=set2', 59.5, 'university_life'),
    ('Your roommate practices drums at 2 AM during finals week', 'https://robohash.org/noisy-roommate?set=set2', 46.0, 'university_life'),
    ('You accidentally enroll in a class taught entirely in a foreign language', 'https://robohash.org/foreign-language?set=set2', 53.0, 'university_life'),
    ('The heating breaks in your dorm during winter', 'https://robohash.org/no-heating?set=set2', 39.0, 'university_life'),
    ('You forget to drop a class and get an automatic F', 'https://robohash.org/forgot-drop?set=set2', 81.0, 'university_life'),
    ('Your lab partner contaminates your experiment sample', 'https://robohash.org/contaminated-sample?set=set2', 56.5, 'university_life'),
    ('The campus internet goes down during online class', 'https://robohash.org/no-internet?set=set2', 36.5, 'university_life'),
    ('You accidentally submit your rough draft instead of final paper', 'https://robohash.org/rough-draft?set=set2', 79.0, 'university_life'),
    
    ('Your calculator dies during a math exam', 'https://robohash.org/dead-calculator?set=set2', 49.5, 'university_life'),
    ('You get assigned the worst possible dorm room', 'https://robohash.org/worst-dorm?set=set2', 29.5, 'university_life'),
    ('Your professor assigns reading in a book that doesn''t exist', 'https://robohash.org/nonexistent-book?set=set2', 43.5, 'university_life'),
    ('The campus cafeteria gives you food poisoning twice in one week', 'https://robohash.org/double-poisoning?set=set2', 75.5, 'university_life'),
    ('You realize your major requires a class that''s only offered once every 3 years', 'https://robohash.org/rare-class?set=set2', 84.0, 'university_life'),
    ('Your presentation slides won''t load during your defense', 'https://robohash.org/slides-wont-load?set=set2', 66.0, 'university_life'),
    ('You accidentally use Wikipedia as a source in your thesis', 'https://robohash.org/wikipedia-source?set=set2', 62.0, 'university_life'),
    ('The campus gym closes permanently the day you finally decide to get fit', 'https://robohash.org/gym-closes?set=set2', 32.0, 'university_life'),
    ('You get assigned a group project partner who doesn''t speak your language', 'https://robohash.org/language-barrier?set=set2', 51.0, 'university_life'),
    ('Your thesis advisor goes on sabbatical without telling you', 'https://robohash.org/advisor-leaves?set=set2', 88.5, 'university_life'),
    
    ('You accidentally CC your entire class on a personal email', 'https://robohash.org/cc-everyone?set=set2', 37.0, 'university_life'),
    ('The campus mail system loses your important documents', 'https://robohash.org/lost-mail?set=set2', 69.5, 'university_life'),
    ('Your computer auto-corrects your thesis title to something inappropriate', 'https://robohash.org/autocorrect-fail?set=set2', 54.5, 'university_life'),
    ('You sleep through your graduation ceremony', 'https://robohash.org/missed-graduation?set=set2', 91.5, 'university_life'),
    ('Your student loan gets rejected the day before tuition is due', 'https://robohash.org/loan-rejected?set=set2', 99.0, 'university_life');

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