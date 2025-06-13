import { useState, useEffect, useContext } from 'react';
import UserContext from '../../../context/UserContext.jsx';

/**
* Hook per gestire lo stato locale del gioco
* Separato dalla logica API per mantenere file piccoli
*/
export const useGameState = () => {
 const { user, setMessage, updateCurrentGame, clearCurrentGame, isInActiveGame, setIsInActiveGame } = useContext(UserContext);
 
 // ============================================================================
 // STATO LOCALE
 // ============================================================================
 const [gameState, setGameState] = useState('loading');
 const [currentGame, setCurrentGame] = useState(null);
 const [currentCards, setCurrentCards] = useState([]);
 const [targetCard, setTargetCard] = useState(null);
 const [currentRoundCard, setCurrentRoundCard] = useState(null);
 const [roundResult, setRoundResult] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [allGameCards, setAllGameCards] = useState([]);
 const [isCompactLayout, setIsCompactLayout] = useState(false);
 
 // ✅ NUOVO FLAG per ricordare abbandoni recenti
 const [wasAbandoned, setWasAbandoned] = useState(false);
 
 // ============================================================================
 // EFFECTS
 // ============================================================================
 
 // Aggiorna layout compatto
 useEffect(() => {
   setIsCompactLayout(currentCards.length >= 4);
 }, [currentCards.length]);
 
 // Gestione protezione navigazione
 useEffect(() => {
   if (currentGame?.status === 'playing') {
     setIsInActiveGame(true);
     console.log('🔒 Game protection activated');
   } else {
     setIsInActiveGame(false);
     console.log('🔓 Game protection deactivated');
   }
 }, [currentGame, setIsInActiveGame]);
 
 // ============================================================================
 // UTILITY FUNCTIONS
 // ============================================================================
 
 const cleanupGameState = () => {
   setIsInActiveGame(false);
   clearCurrentGame();
   setCurrentGame(null);
   setCurrentCards([]);
   setTargetCard(null);
   setCurrentRoundCard(null);
   setRoundResult(null);
   setAllGameCards([]);
   setError('');
   setWasAbandoned(true); // ← AGGIUNGI QUESTO FLAG
 };
 
 // ============================================================================
 // RETURN API
 // ============================================================================
 
 return {
   // Context
   user,
   setMessage,
   updateCurrentGame,
   clearCurrentGame,
   isInActiveGame,
   setIsInActiveGame,
   
   // State
   gameState,
   setGameState,
   currentGame,
   setCurrentGame,
   currentCards,
   setCurrentCards,
   targetCard,
   setTargetCard,
   currentRoundCard,
   setCurrentRoundCard,
   roundResult,
   setRoundResult,
   loading,
   setLoading,
   error,
   setError,
   allGameCards,
   setAllGameCards,
   isCompactLayout,
   
   // ✅ NUOVO FLAG
   wasAbandoned,
   setWasAbandoned,
   
   // Utils
   cleanupGameState
 };
};