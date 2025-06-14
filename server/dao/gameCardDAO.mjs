import { GameCard } from "../models/GameCard.mjs";
import db from "../database/db.mjs";
import dayjs from 'dayjs';

/**
 * Aggiunge una carta iniziale a una partita  
 * 🔒 SECURITY: Imposta card_dealt_at anche per le carte iniziali
 * @param {number} game_id 
 * @param {number} card_id 
 * @returns {Promise<number>} - ID del GameCard creato
 */
export const addInitialCard = (game_id, card_id) => {
    return new Promise((resolve, reject) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const query = `
            INSERT INTO GameCards (game_id, card_id, round_number, is_initial, played_at, card_dealt_at) 
            VALUES (?, ?, 0, TRUE, ?, ?)
        `;
        
        // 🔒 SECURITY: Per le carte iniziali, card_dealt_at = played_at
        db.run(query, [game_id, card_id, now, now], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
};

/**
 * Aggiunge una carta di round a una partita
 * 🔒 SECURITY: Imposta card_dealt_at per validazione timer server-side
 * @param {number} game_id 
 * @param {number} card_id 
 * @param {number} round_number 
 * @returns {Promise<number>} - ID del GameCard creato
 */
export const addRoundCard = (game_id, card_id, round_number) => {
    return new Promise((resolve, reject) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const query = `
            INSERT INTO GameCards (game_id, card_id, round_number, is_initial, card_dealt_at) 
            VALUES (?, ?, ?, FALSE, ?)
        `;
        
        // 🔒 SECURITY: Salviamo l'ora esatta in cui la carta viene distribuita
        db.run(query, [game_id, card_id, round_number, now], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
};

/**
 * Aggiorna il risultato di un guess
 * @param {number} gameCardId 
 * @param {boolean} guessed_correctly 
 * @param {number} position_guessed 
 * @returns {Promise<void>}
 */
export const updateGuess = (gameCardId, guessed_correctly, position_guessed) => {
    return new Promise((resolve, reject) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const query = `
            UPDATE GameCards 
            SET guessed_correctly = ?, position_guessed = ?, played_at = ?
            WHERE id = ?
        `;
        
        // position_guessed può essere null per timeout
        db.run(query, [guessed_correctly, position_guessed, now, gameCardId], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

/**
 * Ottiene tutte le carte di una partita
 * @param {number} game_id 
 * @returns {Promise<GameCard[]>}
 */
export const getGameCards = (game_id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT * FROM GameCards WHERE game_id = ? ORDER BY round_number ASC, id ASC";
        db.all(query, [game_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const gameCards = rows.map((row) => 
                    new GameCard(
                        row.id, row.game_id, row.card_id, row.round_number,
                        row.guessed_correctly, row.position_guessed, row.is_initial, row.played_at
                    )
                );
                resolve(gameCards);
            }
        });
    });
};

/**
 * Ottiene le carte iniziali di una partita
 * @param {number} game_id 
 * @returns {Promise<GameCard[]>}
 */
export const getInitialCards = (game_id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT * FROM GameCards WHERE game_id = ? AND is_initial = TRUE ORDER BY id ASC";
        db.all(query, [game_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const gameCards = rows.map((row) => 
                    new GameCard(
                        row.id, row.game_id, row.card_id, row.round_number,
                        row.guessed_correctly, row.position_guessed, row.is_initial, row.played_at
                    )
                );
                resolve(gameCards);
            }
        });
    });
};

/**
 * Ottiene le carte vinte di una partita (con guess corretto o iniziali)
 * @param {number} game_id 
 * @returns {Promise<GameCard[]>}
 */
export const getWonCards = (game_id) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * FROM GameCards 
            WHERE game_id = ? AND (guessed_correctly = TRUE OR is_initial = TRUE)
            ORDER BY round_number ASC, id ASC
        `;
        db.all(query, [game_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const gameCards = rows.map((row) => 
                    new GameCard(
                        row.id, row.game_id, row.card_id, row.round_number,
                        row.guessed_correctly, row.position_guessed, row.is_initial, row.played_at
                    )
                );
                resolve(gameCards);
            }
        });
    });
};

/**
 * Ottiene la carta del round corrente (non ancora giocata)
 * @param {number} game_id 
 * @param {number} round_number 
 * @returns {Promise<GameCard|null>}
 */
export const getCurrentRoundCard = (game_id, round_number) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * FROM GameCards 
            WHERE game_id = ? AND round_number = ? AND guessed_correctly IS NULL
            LIMIT 1
        `;
        db.get(query, [game_id, round_number], (err, row) => {
            if (err) {
                reject(err);
            } else if (row === undefined) {
                resolve(null);
            } else {
                const gameCard = new GameCard(
                    row.id, row.game_id, row.card_id, row.round_number,
                    row.guessed_correctly, row.position_guessed, row.is_initial, row.played_at, row.card_dealt_at
                );
                resolve(gameCard);
            }
        });
    });
};

/**
 * Ottiene gli IDs delle carte già utilizzate in una partita
 * @param {number} game_id 
 * @returns {Promise<number[]>}
 */
export const getUsedCardIds = (game_id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT DISTINCT card_id FROM GameCards WHERE game_id = ?";
        db.all(query, [game_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const cardIds = rows.map(row => row.card_id);
                resolve(cardIds);
            }
        });
    });
};

/**
 * Ottiene gli IDs delle carte vinte in una partita
 * @param {number} game_id 
 * @returns {Promise<number[]>}
 */
export const getWonCardIds = (game_id) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT card_id FROM GameCards 
            WHERE game_id = ? AND (guessed_correctly = TRUE OR is_initial = TRUE)
        `;
        db.all(query, [game_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const cardIds = rows.map(row => row.card_id);
                resolve(cardIds);
            }
        });
    });
};

/**
 * Conta le carte indovinate correttamente in una partita
 * @param {number} game_id 
 * @returns {Promise<number>}
 */
export const countCorrectGuesses = (game_id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT COUNT(*) as count FROM GameCards WHERE game_id = ? AND guessed_correctly = TRUE";
        db.get(query, [game_id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.count);
            }
        });
    });
};

/**
 * Conta le carte sbagliate in una partita
 * @param {number} game_id 
 * @returns {Promise<number>}
 */
export const countWrongGuesses = (game_id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT COUNT(*) as count FROM GameCards WHERE game_id = ? AND guessed_correctly = FALSE";
        db.get(query, [game_id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.count);
            }
        });
    });
};

/**
 * Ottiene una GameCard per ID - NECESSARIA PER I CONTROLLI DI SICUREZZA
 * @param {number} id 
 * @returns {Promise<GameCard|null>}
 */
export const getGameCardById = (id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT * FROM GameCards WHERE id = ?";
        db.get(query, [id], (err, row) => {
            if (err) {
                reject(err);
            } else if (row === undefined) {
                resolve(null);
            } else {
                const gameCard = new GameCard(
                    row.id, row.game_id, row.card_id, row.round_number,
                    row.guessed_correctly, row.position_guessed, row.is_initial, 
                    row.played_at, row.card_dealt_at  // 🔒 AGGIUNTO: card_dealt_at
                );
                resolve(gameCard);
            }
        });
    });
};

/**
 * Elimina tutte le GameCard di una partita (cleanup)
 * @param {number} game_id 
 * @returns {Promise<void>}
 */
export const deleteGameCards = (game_id) => {
    return new Promise((resolve, reject) => {
        const query = "DELETE FROM GameCards WHERE game_id = ?";
        db.run(query, [game_id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

/**
 * Determina la posizione corretta di una carta in una lista ordinata
 * @param {number} cardId - ID della carta da posizionare
 * @param {number[]} existingCardIds - IDs delle carte già possedute
 * @returns {Promise<number>} - Posizione corretta (0-based)
 */
export const getCorrectPosition = async (cardId, existingCardIds) => {
    try {
        // Ottieni la carta target
        const targetCard = await getCardById(cardId);
        if (!targetCard) {
            throw new Error('Card not found');
        }
        
        // Se non ci sono carte esistenti, la posizione è 0
        if (existingCardIds.length === 0) {
            return 0;
        }
        
        // Ottieni le carte esistenti
        const existingCards = await getCardsByIds(existingCardIds);
        
        // Ordina le carte esistenti per bad_luck_index
        existingCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
        
        // Trova la posizione corretta
        let position = 0;
        for (let i = 0; i < existingCards.length; i++) {
            if (targetCard.bad_luck_index > existingCards[i].bad_luck_index) {
                position = i + 1;
            } else {
                break;
            }
        }
        
        return position;
    } catch (error) {
        throw error;
    }
};