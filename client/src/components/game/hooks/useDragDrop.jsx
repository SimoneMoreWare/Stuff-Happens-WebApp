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
 * Custom hook per gestire la logica Drag & Drop
 * Condiviso tra DemoGameBoard e FullGameBoard
 * 
 * @param {Array} currentCards - Array delle carte correnti del giocatore
 * @param {Object} targetCard - Carta target da posizionare
 * @param {function} onPositionSelect - Callback per gestire la selezione della posizione
 * @returns {object} - Oggetti e funzioni per gestire il drag & drop
 */
export const useDragDrop = (currentCards, targetCard, onPositionSelect) => {
  const [isDragging, setIsDragging] = useState(false);

  // Sensori per dnd-kit
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Crea la lista unificata di elementi per sortable
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

  // Gestisce l'inizio del drag
  const handleDragStart = (event) => {
    const { active } = event;
    
    if (String(active.id).startsWith('target-')) {
      setIsDragging(true);
      console.log('🎯 Drag started per target card');
    }
  };

  // Gestisce la fine del drag
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    setIsDragging(false);
    
    if (!over) {
      console.log('❌ Drop su area non valida');
      return;
    }
    
    // Solo se è la target card che viene droppata
    if (String(active.id).startsWith('target-')) {
      let newGamePosition;
      
      console.log('🔍 DRAG END DEBUG:');
      console.log('- Active ID:', active.id);
      console.log('- Over ID:', over.id);
      console.log('- CurrentCards length:', currentCards.length);
      
      // Calcola la posizione basata su dove è stata droppata
      if (over.id === 'invisible-before') {
        newGamePosition = 0;
        console.log('🎯 BEFORE ZONE → Posizione gioco: 0 (prima di tutte)');
      }
      else if (over.id === 'invisible-after') {
        newGamePosition = currentCards.length;
        console.log('🎯 AFTER ZONE → Posizione gioco:', newGamePosition, '(dopo tutte)');
      }
      else if (String(over.id).startsWith('static-')) {
        const cardId = parseInt(String(over.id).replace('static-', ''));
        const cardIndex = currentCards.findIndex(card => card.id === cardId);
        
        if (cardIndex !== -1) {
          newGamePosition = cardIndex + 1;
          console.log('🎯 STATIC CARD', cardId, 'at index', cardIndex, '→ Posizione gioco:', newGamePosition, '(dopo questa carta)');
        } else {
          console.log('❌ Carta static non trovata in currentCards');
          return;
        }
      }
      else {
        console.log('❌ Drop sulla target card stessa o altro, ignorando');
        return;
      }
      
      // Valida la posizione
      if (newGamePosition < 0 || newGamePosition > currentCards.length) {
        console.log('❌ Posizione non valida:', newGamePosition, '(range: 0 -', currentCards.length, ')');
        return;
      }
      
      console.log('📍 FINALE: Calling onPositionSelect con posizione:', newGamePosition);
      onPositionSelect(newGamePosition);
    }
  };

  // Gestisce l'annullamento del drag
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