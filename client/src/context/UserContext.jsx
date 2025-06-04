import { createContext } from 'react';

/**
 * UserContext per gestire lo stato globale dell'utente
 * 
 * Seguendo la filosofia del corso:
 * - Il Context viene creato una sola volta e importato ovunque
 * - Contiene le informazioni dell'utente corrente e funzioni di autenticazione
 * - Lo stato effettivo viene gestito in App.jsx e passato via Provider
 * 
 * Struttura del context value:
 * {
 *   user: User | null,           // Oggetto utente se autenticato, null se anonimo
 *   loggedIn: boolean,           // Flag per controllo rapido autenticazione
 *   handleLogin: function,       // Funzione per gestire il login
 *   handleLogout: function,      // Funzione per gestire il logout
 *   currentGame: Game | null,    // Partita attiva se presente
 *   setCurrentGame: function     // Funzione per aggiornare partita corrente
 * }
 */

const UserContext = createContext();

export default UserContext;