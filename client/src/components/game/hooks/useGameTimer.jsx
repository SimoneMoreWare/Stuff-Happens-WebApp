// useGameTimer.js - Custom hook for game timer management
import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';

/**
 * Custom hook for managing game timer state and operations
 * 
 * Provides timer functionality with start/stop/reset controls.
 * Follows React best practices: pure side effects in useEffect,
 * no API calls within effects, stable callbacks with useCallback.
 * 
 * @param {number} duration - Timer duration in seconds (default: 30)
 * @returns {Object} Timer state and control functions
 */
export const useGameTimer = (duration = 30) => {
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  // Stable callback functions using useCallback to prevent unnecessary re-renders
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
  
  // Timer interval effect - pure side effect only (no API calls)
  useEffect(() => {
    let intervalId;
    
    if (isRunning && timeRemaining > 0) {
      intervalId = setInterval(() => {
        setTimeRemaining(prevTime => {
          const newTime = prevTime - 1;
          
          // Only state updates - no API calls in useEffect
          if (newTime <= 0) {
            setIsRunning(false);
            setIsTimeUp(true); // Flag for parent component to handle
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    // Cleanup to prevent memory leaks
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]); // Only isRunning as dependency
  
  // Return timer state and control functions
  return {
    timeRemaining,
    timerActive: isRunning,
    gameStartTime,
    isTimeUp, // Flag for parent component to handle timeout
    startTimer,
    stopTimer,
    resetTimer,
    getElapsedTime
  };
};