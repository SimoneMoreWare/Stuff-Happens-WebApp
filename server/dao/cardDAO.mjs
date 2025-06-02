import { Card } from "../models/Card.mjs";
import db from "../database/db.mjs";

/**
 * CardDAO - Data Access Object per la gestione delle carte
 */
export default function CardDAO() {
    
    /**
     * Ottiene tutte le carte disponibili
     * @returns {Promise<Card[]>}
     */
    this.getAllCards = () => {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM Cards ORDER BY bad_luck_index ASC";
            db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const cards = rows.map((row) => 
                        new Card(row.id, row.name, row.image_url, row.bad_luck_index, row.theme, row.created_at)
                    );
                    resolve(cards);
                }
            });
        });
    };

    /**
     * Ottiene carte per tema
     * @param {string} theme 
     * @returns {Promise<Card[]>}
     */
    this.getCardsByTheme = (theme) => {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM Cards WHERE theme = ? ORDER BY bad_luck_index ASC";
            db.all(query, [theme], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const cards = rows.map((row) => 
                        new Card(row.id, row.name, row.image_url, row.bad_luck_index, row.theme, row.created_at)
                    );
                    resolve(cards);
                }
            });
        });
    };

    /**
     * Ottiene una carta per ID
     * @param {number} id 
     * @returns {Promise<Card|null>}
     */
    this.getCardById = (id) => {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM Cards WHERE id = ?";
            db.get(query, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row === undefined) {
                    resolve(null);
                } else {
                    const card = new Card(row.id, row.name, row.image_url, row.bad_luck_index, row.theme, row.created_at);
                    resolve(card);
                }
            });
        });
    };

    /**
     * Ottiene carte casuali per tema (escludendo quelle specificate)
     * @param {string} theme 
     * @param {number} count 
     * @param {number[]} excludeIds - IDs delle carte da escludere
     * @returns {Promise<Card[]>}
     */
    this.getRandomCards = (theme, count, excludeIds = []) => {
        return new Promise((resolve, reject) => {
            let query = "SELECT * FROM Cards WHERE theme = ?";
            let params = [theme];

            // Aggiungi condizione per escludere carte specifiche
            if (excludeIds.length > 0) {
                const placeholders = excludeIds.map(() => '?').join(',');
                query += ` AND id NOT IN (${placeholders})`;
                params = params.concat(excludeIds);
            }

            query += " ORDER BY RANDOM() LIMIT ?";
            params.push(count);

            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const cards = rows.map((row) => 
                        new Card(row.id, row.name, row.image_url, row.bad_luck_index, row.theme, row.created_at)
                    );
                    resolve(cards);
                }
            });
        });
    };

    /**
     * Ottiene carte multiple per IDs
     * @param {number[]} ids 
     * @returns {Promise<Card[]>}
     */
    this.getCardsByIds = (ids) => {
        return new Promise((resolve, reject) => {
            if (ids.length === 0) {
                resolve([]);
                return;
            }

            const placeholders = ids.map(() => '?').join(',');
            const query = `SELECT * FROM Cards WHERE id IN (${placeholders}) ORDER BY bad_luck_index ASC`;
            
            db.all(query, ids, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const cards = rows.map((row) => 
                        new Card(row.id, row.name, row.image_url, row.bad_luck_index, row.theme, row.created_at)
                    );
                    resolve(cards);
                }
            });
        });
    };

    /**
     * Determina la posizione corretta di una carta in una lista ordinata
     * @param {number} cardId 
     * @param {number[]} existingCardIds 
     * @returns {Promise<number>} - Posizione corretta (0-based)
     */
    this.getCorrectPosition = (cardId, existingCardIds) => {
        return new Promise((resolve, reject) => {
            // Prima ottieni l'indice della carta da posizionare
            this.getCardById(cardId)
                .then(targetCard => {
                    if (!targetCard) {
                        reject(new Error('Card not found'));
                        return;
                    }

                    if (existingCardIds.length === 0) {
                        resolve(0);
                        return;
                    }

                    // Ottieni le carte esistenti
                    this.getCardsByIds(existingCardIds)
                        .then(existingCards => {
                            // Ordina per bad_luck_index
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
                            
                            resolve(position);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    };
}