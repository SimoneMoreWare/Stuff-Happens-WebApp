import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';

/**
 * ✅ CONFORME PROF FULVIO CORNO: Timer puro senza API calls
 * 
 * Regole rispettate:
 * - useEffect SOLO per side effects puri (setInterval)
 * - NESSUNA API call in useEffect
 * - Callback onTimeUp RIMOSSA per evitare side effects
 * - Solo aggiornamento di stato locale
 */
export const useGameTimer = (duration = 30) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  // ✅ CALLBACK STABILI con useCallback
  const startTimer = useCallback(() => {
    setTimeRemaining(duration);
    setIsRunning(true);
    setGameStartTime(dayjs());
    setIsTimeUp(false);
  }, [duration]);
  
  const stopTimer = useCallback(() => {
    setIsRunning(false);
  }, []);
  
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(duration);
    setGameStartTime(null);
    setIsTimeUp(false);
  }, [duration]);
  
  const getElapsedTime = useCallback(() => {
    return gameStartTime ? dayjs().diff(gameStartTime, 'second') : 0;
  }, [gameStartTime]);
  
  // ✅ UNICO useEffect - SOLO per setInterval (side effect puro)
  // NESSUNA API call qui dentro!
  useEffect(() => {
    let intervalId;
    
    if (isRunning && timeRemaining > 0) {
      intervalId = setInterval(() => {
        setTimeRemaining(prevTime => {
          const newTime = prevTime - 1;
          
          // ✅ SOLO AGGIORNAMENTO STATO - Nessuna API call!
          if (newTime <= 0) {
            setIsRunning(false);
            setIsTimeUp(true); // ← Solo flag, nessuna callback
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    // ✅ CLEANUP necessario per evitare memory leak
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]); // Solo isRunning come dipendenza
  
  return {
    timeRemaining,
    timerActive: isRunning,
    gameStartTime,
    isTimeUp, // ✅ Flag per il componente genitore
    startTimer,
    stopTimer,
    resetTimer,
    getElapsedTime
  };
};