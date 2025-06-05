// UserContext.jsx - ESEMPIO di come gestire currentGame senza infinite loops

import { createContext, useState, useCallback, useMemo } from 'react';

/**
 * ✨ IMPORTANTE: Come evitare infinite loops nel Context
 * 
 * Il problema originale era che currentGame veniva passato come oggetto intero
 * nelle dependency di useEffect, causando loop infiniti perché ogni volta
 * l'oggetto aveva un riferimento diverso anche se il contenuto era uguale.
 * 
 * SOLUZIONI APPLICATE:
 * 
 * 1. ✅ Usa useMemo per memoizzare il context value
 * 2. ✅ Usa useCallback per le funzioni
 * 3. ✅ Estrai valori primitivi per le dependencies (es. currentGame?.id)
 * 4. ✅ Non passare oggetti interi nelle dependency arrays
 */

const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [currentGame, setCurrentGame] = useState(null);
    const [message, setMessage] = useState(null);
    
    // ✅ CORRETTO: usa useCallback per funzioni che vengono passate ai children
    const updateCurrentGame = useCallback((gameData) => {
        console.log('🔄 Updating currentGame:', gameData);
        setCurrentGame(gameData);
    }, []);
    
    const clearCurrentGame = useCallback(() => {
        console.log('🗑️ Clearing currentGame');
        setCurrentGame(null);
    }, []);
    
    const handleLogin = useCallback((userData) => {
        setUser(userData);
        setMessage({ type: 'success', msg: 'Login effettuato con successo!' });
    }, []);
    
    const handleLogout = useCallback(() => {
        setUser(null);
        setCurrentGame(null);
        setMessage({ type: 'info', msg: 'Logout effettuato con successo!' });
    }, []);
    
    // ✅ CORRETTO: usa useMemo per memoizzare il context value
    // Questo previene re-render inutili dei consumer
    const contextValue = useMemo(() => ({
        // Stati
        user,
        loggedIn: Boolean(user),
        currentGame,
        message,
        
        // Funzioni
        updateCurrentGame,
        clearCurrentGame,
        handleLogin,
        handleLogout,
        setMessage
    }), [
        user, 
        currentGame, 
        message, 
        updateCurrentGame, 
        clearCurrentGame, 
        handleLogin, 
        handleLogout
    ]);
    
    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;

/**
 * 🎯 COME USARE NEI COMPONENTS PER EVITARE INFINITE LOOPS:
 * 
 * ❌ SBAGLIATO - causa infinite loop:
 * const { currentGame } = useContext(UserContext);
 * useEffect(() => {
 *     // logica
 * }, [currentGame]); // 👈 oggetto intero nella dependency!
 * 
 * ✅ CORRETTO - usa valori primitivi:
 * const { currentGame } = useContext(UserContext);
 * const currentGameId = currentGame?.game?.id || currentGame?.id || null;
 * useEffect(() => {
 *     // logica
 * }, [currentGameId]); // 👈 valore primitivo!
 * 
 * ✅ ALTERNATIVA - usa array vuoto se necessario:
 * useEffect(() => {
 *     // logica che deve eseguire solo una volta
 * }, []); // 👈 si esegue solo al mount
 * 
 * ✅ PATTERN PER OGGETTI COMPLESSI:
 * const { currentGame } = useContext(UserContext);
 * const gameStatus = currentGame?.status;
 * const cardsCount = currentGame?.cards_collected;
 * useEffect(() => {
 *     // logica
 * }, [gameStatus, cardsCount]); // 👈 valori primitivi estratti!
 */