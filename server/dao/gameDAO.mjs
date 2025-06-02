import { Game } from "../models/Game.mjs";
import db from "../database/db.mjs";
import dayjs from 'dayjs';

/**
 * GameDAO - Data Access Object per la gestione delle partite
 */
export default function GameDAO() {
    
    /**
     * Crea una nuova partita
     * @param {number|null} user_id - ID utente (null per anonimi)
     * @returns {Promise<number>} - ID della partita creata
     */
    this.createGame = (user_id = null) => {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO Games (user_id, status, cards_collected, wrong_guesses, current_round, created_at) 
                VALUES (?, 'playing', 3, 0, 1, ?)
            `;
            const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
            
            db.run(query, [user_id, now], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    };

    /**
     * Ottiene una partita per ID
     * @param {number} id 
     * @returns {Promise<Game|null>}
     */
    this.getGameById = (id) => {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM Games WHERE id = ?";
            db.get(query, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row === undefined) {
                    resolve(null);
                } else {
                    const game = new Game(
                        row.id, row.user_id, row.status, row.cards_collected, 
                        row.wrong_guesses, row.current_round, row.created_at, row.completed_at
                    );
                    resolve(game);
                }
            });
        });
    };

    /**
     * Ottiene la partita attiva di un utente
     * @param {number} user_id 
     * @returns {Promise<Game|null>}
     */
    this.getActiveGameByUser = (user_id) => {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM Games WHERE user_id = ? AND status = 'playing' ORDER BY created_at DESC LIMIT 1";
            db.get(query, [user_id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row === undefined) {
                    resolve(null);
                } else {
                    const game = new Game(
                        row.id, row.user_id, row.status, row.cards_collected, 
                        row.wrong_guesses, row.current_round, row.created_at, row.completed_at
                    );
                    resolve(game);
                }
            });
        });
    };

    /**
     * Aggiorna lo stato di una partita
     * @param {number} gameId 
     * @param {Object} updates - Oggetto con i campi da aggiornare
     * @returns {Promise<void>}
     */
    this.updateGame = (gameId, updates) => {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];

            // Costruisci dinamicamente la query di update
            Object.keys(updates).forEach(key => {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            });

            if (fields.length === 0) {
                resolve();
                return;
            }

            values.push(gameId); // Aggiungi l'ID alla fine per la clausola WHERE

            const query = `UPDATE Games SET ${fields.join(', ')} WHERE id = ?`;
            
            db.run(query, values, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    /**
     * Incrementa i guess sbagliati di una partita
     * @param {number} gameId 
     * @returns {Promise<void>}
     */
    this.incrementWrongGuesses = (gameId) => {
        return new Promise((resolve, reject) => {
            const query = "UPDATE Games SET wrong_guesses = wrong_guesses + 1 WHERE id = ?";
            db.run(query, [gameId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    /**
     * Incrementa le carte raccolte di una partita
     * @param {number} gameId 
     * @returns {Promise<void>}
     */
    this.incrementCardsCollected = (gameId) => {
        return new Promise((resolve, reject) => {
            const query = "UPDATE Games SET cards_collected = cards_collected + 1 WHERE id = ?";
            db.run(query, [gameId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    /**
     * Avanza al round successivo
     * @param {number} gameId 
     * @returns {Promise<void>}
     */
    this.advanceRound = (gameId) => {
        return new Promise((resolve, reject) => {
            const query = "UPDATE Games SET current_round = current_round + 1 WHERE id = ?";
            db.run(query, [gameId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    /**
     * Completa una partita con un determinato stato
     * @param {number} gameId 
     * @param {string} status - 'won' o 'lost'
     * @returns {Promise<void>}
     */
    this.completeGame = (gameId, status) => {
        return new Promise((resolve, reject) => {
            const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
            const query = "UPDATE Games SET status = ?, completed_at = ? WHERE id = ?";
            
            db.run(query, [status, now, gameId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    /**
     * Ottiene la storia delle partite di un utente
     * @param {number} user_id 
     * @returns {Promise<Game[]>}
     */
    this.getUserGameHistory = (user_id) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM Games 
                WHERE user_id = ? AND status IN ('won', 'lost') 
                ORDER BY completed_at DESC
            `;
            
            db.all(query, [user_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const games = rows.map((row) => 
                        new Game(
                            row.id, row.user_id, row.status, row.cards_collected, 
                            row.wrong_guesses, row.current_round, row.created_at, row.completed_at
                        )
                    );
                    resolve(games);
                }
            });
        });
    };

    /**
     * Elimina partite incomplete più vecchie di X giorni
     * @param {number} days 
     * @returns {Promise<void>}
     */
    this.cleanupOldGames = (days = 7) => {
        return new Promise((resolve, reject) => {
            const cutoffDate = dayjs().subtract(days, 'day').format('YYYY-MM-DD HH:mm:ss');
            const query = "DELETE FROM Games WHERE status = 'playing' AND created_at < ?";
            
            db.run(query, [cutoffDate], function (err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(`Cleaned up ${this.changes} old incomplete games`);
                    resolve();
                }
            });
        });
    };
}