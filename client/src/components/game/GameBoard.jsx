import { useContext } from 'react';
import UserContext from '../../context/UserContext.jsx';
import DemoGameBoard from './DemoGameBoard.jsx';
import FullGameBoard from './FullGameBoard.jsx';

/**
 * GameBoard principale - Dispatcher che sceglie quale componente renderizzare
 * 
 * Questa architettura risolve i problemi del componente originale:
 * 
 * ✅ SEPARAZIONE DELLE RESPONSABILITÀ:
 * - DemoGameBoard: gestisce SOLO partite demo per utenti anonimi
 * - FullGameBoard: gestisce SOLO partite complete per utenti autenticati
 * - GameBoard: decide quale renderizzare in base al login status
 * 
 * ✅ ELIMINAZIONE INFINITE LOOPS:
 * - Dependency arrays semplici con valori primitivi
 * - Nessun oggetto nelle dependencies di useEffect
 * - Inizializzazione più controllata e prevedibile
 * 
 * ✅ MIGLIORE MANUTENIBILITÀ:
 * - Codice più facile da leggere e debuggare
 * - Ogni componente ha uno scopo ben definito
 * - Possibilità di testare i componenti separatamente
 * 
 * ✅ PERFORMANCE:
 * - Meno re-render inutili
 * - Componenti più piccoli e focalizzati
 * - Stato più prevedibile
 * 
 * PATTERN UTILIZZATO:
 * Questo è un classico "Strategy Pattern" dove il GameBoard è il Context
 * che sceglie quale strategia (Demo/Full) utilizzare in base allo stato utente.
 */
function GameBoard() {
    const { loggedIn } = useContext(UserContext);
    
    console.log('🎮 GameBoard render - loggedIn:', loggedIn);
    
    // Semplice decisione: utente loggato o no?
    if (!loggedIn) {
        // Utente anonimo → Modalità Demo
        return <DemoGameBoard />;
    } else {
        // Utente autenticato → Partita Completa
        return <FullGameBoard />;
    }
}

export default GameBoard;