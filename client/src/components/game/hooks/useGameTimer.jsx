import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook per gestire il timer di gioco
 * Condiviso tra DemoGameBoard e FullGameBoard
 * 
 * @param {number} duration - Durata del timer in secondi (default: 30)
 * @param {function} onTimeUp - Callback chiamata quando il timer scade
 * @returns {object} - Oggetti e funzioni per gestire il timer
 */
export const useGameTimer = (duration = 30, onTimeUp) => {
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [gameStartTime, setGameStartTime] = useState(null);
  const timeoutHandledRef = useRef(false);
  const intervalRef = useRef(null);

  // Avvia il timer
  const startTimer = () => {
    setTimerActive(true);
    setTimeRemaining(duration);
    setGameStartTime(Date.now());
    timeoutHandledRef.current = false;
    
    console.log('⏰ Timer started for', duration, 'seconds');
  };

  // Ferma il timer
  const stopTimer = () => {
    setTimerActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    console.log('⏰ Timer stopped');
  };

  // Reset del timer
  const resetTimer = () => {
    stopTimer();
    setTimeRemaining(duration);
    setGameStartTime(null);
    timeoutHandledRef.current = false;
    console.log('⏰ Timer reset');
  };

  // Calcola il tempo trascorso
  const getElapsedTime = () => {
    return gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
  };

  // Effect per gestire il countdown
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          
          // Quando il tempo scade
          if (newTime <= 0 && !timeoutHandledRef.current && onTimeUp) {
            timeoutHandledRef.current = true;
            console.log('⏰ Timer expired, calling onTimeUp');
            
            // Chiama onTimeUp in modo asincrono per evitare problemi di stato
            setTimeout(() => {
              onTimeUp();
            }, 100);
          }
          
          return Math.max(0, newTime);
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [timerActive, timeRemaining, onTimeUp]);

  // Cleanup al dismount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timerActive,
    timeRemaining,
    gameStartTime,
    startTimer,
    stopTimer,
    resetTimer,
    getElapsedTime,
    isTimeUp: timeRemaining <= 0,
    timeoutHandled: timeoutHandledRef.current
  };
};