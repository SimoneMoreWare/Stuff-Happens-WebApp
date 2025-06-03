import { Card } from "../models/Card.mjs";
import db from "../database/db.mjs";

/**
 * Ottiene tutte le carte disponibili
 * @returns {Promise<Card[]>}
 */
export const getAllCards = () => {
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
export const getCardsByTheme = (theme) => {
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
export const getCardById = (id) => {
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
export const getRandomCards = (theme, count, excludeIds = []) => {
    return new Promise((resolve, reject) => {
        let query = "SELECT * FROM Cards WHERE theme = ?";
        let params = [theme];
        
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
export const getCardsByIds = (ids) => {
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
export const getCorrectPosition = async (cardId, existingCardIds) => {
    try {
        const targetCard = await getCardById(cardId);
        if (!targetCard) {
            throw new Error('Card not found');
        }
        
        if (existingCardIds.length === 0) {
            return 0;
        }
        
        const existingCards = await getCardsByIds(existingCardIds);
        existingCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
        
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