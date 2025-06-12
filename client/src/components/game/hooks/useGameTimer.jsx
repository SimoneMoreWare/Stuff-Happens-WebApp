import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook per gestire il timer di gioco - VERSIONE FINALE
 */
export const useGameTimer = (duration = 30, onTimeUp) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const timeoutHandledRef = useRef(false);

  // AVVIA IL TIMER
  const startTimer = () => {
    console.log('⏰ Starting timer...');
    setTimeRemaining(duration);  // Reset a durata piena
    setIsRunning(true);
    setGameStartTime(Date.now());
    timeoutHandledRef.current = false;
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
    timeoutHandledRef.current = false;
  };

  // Calcola tempo trascorso
  const getElapsedTime = () => {
    return gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
  };

  // USEEFFECT PRINCIPALE
  useEffect(() => {
    let intervalId;
    
    if (isRunning && timeRemaining > 0) {
      intervalId = setInterval(() => {
        setTimeRemaining(time => {
          const newTime = time - 1;
          
          // Gestione timeout
          if (newTime <= 0 && !timeoutHandledRef.current) {
            timeoutHandledRef.current = true;
            setIsRunning(false);
            
            // Chiama callback in modo sicuro
            setTimeout(() => {
              if (onTimeUp) onTimeUp();
            }, 0);
            
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
  }, [isRunning, onTimeUp]);

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