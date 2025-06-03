import { User } from "../models/User.mjs";
import db from "../database/db.mjs";
// Importing the crypto module for secure password hashing
import crypto from 'crypto';

/**
 * Ottiene tutti gli utenti registrati
 * @returns {Promise<User[]>}
 */
export const getAllUsers = () => {
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
export const getUserByUsername = (username) => {
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
export const getUserById = (id) => {
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
 * Verifies user login credentials
 * @param {string} username - Username from the login request
 * @param {string} password - Plain text password from the login request
 * @returns {Promise<User|false|null>} - User object if valid, false if wrong password, null if user not found
 */
export const checkUserCredentials = (username, password) => {
    return new Promise((resolve, reject) => {
        // First step: check if a user with this username exists in the database
        // We don't check the password immediately for security reasons
        const query = "SELECT * FROM Users WHERE username = ?";
        
        db.get(query, [username], (err, row) => {
            // Case 1: Database error occurred
            if (err) {
                reject(err);
            } 
            // Case 2: No user found with this username
            // Someone tried to login with a non-existent username
            // This is NOT an error, so we resolve (not reject) with null
            else if (row === undefined) {
                resolve(null); // User not found - will trigger "incorrect username or password"
            } 
            // Case 3: User exists, now we need to verify the password
            else {
                // We need to hash the incoming password with the stored salt
                // and compare it with the stored hashed password
                crypto.scrypt(password, row.salt, 64, (err, hashedPassword) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Use crypto.timingSafeEqual for secure password comparison
                        // This function prevents timing attacks that could reveal information
                        // about the stored password through response time analysis
                        
                        // Convert the stored password from hex string to Buffer for comparison
                        // hashedPassword is already a Buffer from scrypt
                        if (!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword)) {
                            // Passwords don't match - user is not who they claim to be
                            resolve(false); // Wrong password - will trigger "incorrect username or password"
                        } else {
                            // Passwords match - user is authenticated
                            // Return only necessary user information (exclude sensitive data like password and salt)
                            const user = {
                                id: row.id,
                                username: row.username,
                                email: row.email
                                // Note: Never return password or salt to the client
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
export const updateUser = (user) => {
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