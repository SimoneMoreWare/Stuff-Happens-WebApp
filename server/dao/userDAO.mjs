import { User } from "../models/User.mjs";
import db from "../database/db.mjs";
import crypto from 'crypto';

/**
 * UserDAO - Data Access Object per la gestione degli utenti
 */
export default function UserDAO() {
    
    /**
     * Ottiene tutti gli utenti registrati
     * @returns {Promise<User[]>}
     */
    this.getAllUsers = () => {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM Users";
            db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const users = rows.map((row) => 
                        new User(row.id, row.username, row.email, row.password, row.salt, row.created_at)
                    );
                    resolve(users);
                }
            });
        });
    };

    /**
     * Ottiene un utente per username
     * @param {string} username 
     * @returns {Promise<User|null>}
     */
    this.getUserByUsername = (username) => {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM Users WHERE username = ?";
            db.get(query, [username], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row === undefined) {
                    resolve(null);
                } else {
                    const user = new User(row.id, row.username, row.email, row.password, row.salt, row.created_at);
                    resolve(user);
                }
            });
        });
    };

    /**
     * Ottiene un utente per ID
     * @param {number} id 
     * @returns {Promise<User|null>}
     */
    this.getUserById = (id) => {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM Users WHERE id = ?";
            db.get(query, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row === undefined) {
                    resolve(null);
                } else {
                    const user = new User(row.id, row.username, row.email, row.password, row.salt, row.created_at);
                    resolve(user);
                }
            });
        });
    };

    /**
     * Verifica le credenziali di accesso dell'utente
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<User|false|null>}
     */
    this.checkUserCredentials = (username, password) => {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM Users WHERE username = ?";
            db.get(query, [username], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row === undefined) {
                    resolve(null); // Utente non trovato
                } else {
                    // Verifica password con salt
                    crypto.scrypt(password, row.salt, 32, (err, hashedPassword) => {
                        if (err) {
                            reject(err);
                        } else {
                            // Confronto sicuro delle password
                            if (!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword)) {
                                resolve(false); // Password sbagliata
                            } else {
                                // Ritorna solo i dati necessari (senza password e salt)
                                const user = {
                                    id: row.id,
                                    username: row.username,
                                    email: row.email
                                };
                                resolve(user);
                            }
                        }
                    });
                }
            });
        });
    };

    /**
     * Aggiorna i dati di un utente
     * @param {User} user 
     * @returns {Promise<void>}
     */
    this.updateUser = (user) => {
        return new Promise((resolve, reject) => {
            const query = "UPDATE Users SET username = ?, email = ?, password = ?, salt = ? WHERE id = ?";
            db.run(query, [user.username, user.email, user.password, user.salt, user.id], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };
}