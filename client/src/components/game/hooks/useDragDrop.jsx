// useDragDrop.jsx - Custom hook for drag and drop functionality
import { useState, useMemo } from 'react';
import {
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

/**
 * Custom hook for managing Drag & Drop logic
 * 
 * Handles the drag and drop interactions for positioning the target card
 * among the player's existing cards. Supports mouse, touch, and keyboard interactions.
 * 
 * @param {Array} currentCards - Array of player's current cards
 * @param {Object} targetCard - Target card to be positioned
 * @param {Function} onPositionSelect - Callback function for position selection
 * @returns {Object} Drag and drop state and handlers
 */
export const useDragDrop = (currentCards, targetCard, onPositionSelect) => {
  const [isDragging, setIsDragging] = useState(false);

  // Configure sensors for different input methods
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance to start drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,    // Delay before drag starts on touch
        tolerance: 5,  // Movement tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create unified list of sortable items
  const allItems = useMemo(() => {
    if (!targetCard || !currentCards) return [];
    
    return [
      { id: 'invisible-before', type: 'invisible', position: -1 },
      { id: `target-${targetCard.id}`, type: 'target', card: targetCard, position: 999 },
      ...currentCards.map((card, index) => ({
        id: `static-${card.id}`, 
        type: 'static', 
        card, 
        position: index
      })),
      { id: 'invisible-after', type: 'invisible', position: 1000 }
    ];
  }, [currentCards, targetCard]);

  // Handle drag start event
  const handleDragStart = (event) => {
    const { active } = event;
    
    if (String(active.id).startsWith('target-')) {
      setIsDragging(true);
    }
  };

  // Handle drag end event and calculate final position
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    setIsDragging(false);
    
    if (!over) {
      return; // No valid drop target
    }
    
    // Only process if target card was dragged
    if (String(active.id).startsWith('target-')) {
      let newGamePosition;
      
      // Calculate position based on drop target
      if (over.id === 'invisible-before') {
        newGamePosition = 0; // Before all cards
      }
      else if (over.id === 'invisible-after') {
        newGamePosition = currentCards.length; // After all cards
      }
      else if (String(over.id).startsWith('static-')) {
        // Extract card ID and find its position
        const cardId = parseInt(String(over.id).replace('static-', ''));
        const cardIndex = currentCards.findIndex(card => card.id === cardId);
        
        if (cardIndex !== -1) {
          newGamePosition = cardIndex + 1; // After this card
        } else {
          return; // Card not found
        }
      }
      else {
        return; // Invalid drop target
      }
      
      // Validate position range
      if (newGamePosition < 0 || newGamePosition > currentCards.length) {
        return;
      }
      
      // Execute position selection callback
      onPositionSelect(newGamePosition);
    }
  };

  // Handle drag cancellation
  const handleDragCancel = () => {
    setIsDragging(false);
  };

  return {
    sensors,
    allItems,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  };
};