import { useState, useEffect } from 'react';

/**
 * Custom hook per gestire il timer di gioco - SENZA useRef
 * Conforme alle richieste del professore
 */
export const useGameTimer = (duration = 30, onTimeUp) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [timeoutHandled, setTimeoutHandled] = useState(false);

  // AVVIA IL TIMER
  const startTimer = () => {
    console.log('⏰ Starting timer...');
    setTimeRemaining(duration);
    setIsRunning(true);
    setGameStartTime(Date.now());
    setTimeoutHandled(false);
  };

  // FERMA IL TIMER
  const stopTimer = () => {
    console.log('⏰ Stopping timer...');
    setIsRunning(false);
  };

  // RESET DEL TIMER
  const resetTimer = () => {
    console.log('⏰ Resetting timer...');
    setIsRunning(false);
    setTimeRemaining(duration);
    setGameStartTime(null);
    setTimeoutHandled(false);
  };

  // Calcola tempo trascorso
  const getElapsedTime = () => {
    return gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
  };

  // USEEFFECT PRINCIPALE - senza useRef
  useEffect(() => {
    let intervalId;
    
    if (isRunning && timeRemaining > 0) {
      intervalId = setInterval(() => {
        setTimeRemaining(time => {
          const newTime = time - 1;
          
          // Gestione timeout con useState invece di useRef
          if (newTime <= 0 && !timeoutHandled) {
            setTimeoutHandled(true);
            setIsRunning(false);
            
            // Chiama callback in modo sicuro
            if (onTimeUp) {
              setTimeout(() => onTimeUp(), 0);
            }
            
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    // Cleanup
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