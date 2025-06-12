import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

/**
 * Custom hook per gestire il timer di gioco
 * ✅ CONFORME: UN SOLO useEffect necessario (per setInterval)
 */
export const useGameTimer = (duration = 30, onTimeUp) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [timeoutHandled, setTimeoutHandled] = useState(false);
  
  const startTimer = () => {
    setTimeRemaining(duration);
    setIsRunning(true);
    setGameStartTime(dayjs());
    setTimeoutHandled(false);
  };
  
  const stopTimer = () => {
    setIsRunning(false);
  };
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeRemaining(duration);
    setGameStartTime(null);
    setTimeoutHandled(false);
  };
  
  const getElapsedTime = () => {
    return gameStartTime ? dayjs().diff(gameStartTime, 'second') : 0;
  };
  
  // ✅ UNICO useEffect NECESSARIO - Per gestire setInterval (side effect reale)
  useEffect(() => {
    let intervalId;
    
    if (isRunning && timeRemaining > 0) {
      intervalId = setInterval(() => {
        setTimeRemaining(time => {
          const newTime = time - 1;
          
          // ✅ GESTITO QUI - Nessun useEffect aggiuntivo artificiale
          if (newTime <= 0 && !timeoutHandled) {
            setTimeoutHandled(true);
            setIsRunning(false);
            
            // ✅ CHIAMATA DIRETTA - Come suggerisci tu
            if (onTimeUp) {
              onTimeUp();
            }
            
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    // ✅ CLEANUP NECESSARIO - Per evitare memory leak
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, timeoutHandled, onTimeUp]);
  
  return {
    timeRemaining,
    timerActive: isRunning,
    gameStartTime,
    startTimer,
    stopTimer,
    resetTimer,
    getElapsedTime,
    isTimeUp: timeRemaining <= 0
  };
};