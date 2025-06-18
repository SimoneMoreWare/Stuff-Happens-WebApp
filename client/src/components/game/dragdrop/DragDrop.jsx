// DragDrop.jsx - Shared drag and drop components for game interface
import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardDisplay from '../shared/CardDisplay.jsx';

/**
 * DraggableTargetCard - Draggable target card component
 * 
 * Represents the card that the player needs to position among their existing cards.
 * Shows card without bad luck index and provides visual feedback during drag operations.
 * 
 * @param {Object} card - Target card object
 * @param {number} position - Current position in the sequence
 * @param {boolean} isCompact - Whether to use compact layout
 */
export function DraggableTargetCard({ card, position, isCompact = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `target-${card.id}`,
    data: { card, isTarget: true, position }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`responsive-card ${isCompact ? 'compact-card' : ''}`}
    >
      <Card className="border-warning border-3 shadow-lg h-100">
        <Card.Header className="bg-warning text-dark text-center py-1">
          <Badge bg="dark" className={isCompact ? 'badge-sm' : ''}>
            <i className="bi bi-hand-index me-1"></i>
            Target
          </Badge>
        </Card.Header>
        <Card.Body className={`p-2 ${isCompact ? 'p-1' : ''}`}>
          <CardDisplay 
            card={card} 
            showBadLuckIndex={false}
            compact={isCompact}
          />
        </Card.Body>
        <Card.Footer className="text-center py-1">
          <small className="text-muted">
            <i className="bi bi-arrows-move"></i> Trascina
          </small>
        </Card.Footer>
      </Card>
    </div>
  );
}

/**
 * StaticHandCard - Non-draggable card component for player's hand
 * 
 * Represents cards already in the player's possession. Shows the bad luck index
 * and serves as a drop target for positioning the target card.
 * 
 * @param {Object} card - Player's card object
 * @param {number} position - Position in player's hand
 * @param {boolean} isDraggedOver - Whether a card is being dragged over this card
 * @param {boolean} isCompact - Whether to use compact layout
 */
export function StaticHandCard({ card, position, isDraggedOver = false, isCompact = false }) {
  const {
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: `static-${card.id}`,
    data: { card, isStatic: true, position }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`responsive-card ${isCompact ? 'compact-card' : ''}`}
    >
      <Card className="border-primary h-100 shadow">
        <Card.Header className="bg-primary text-white text-center py-1">
          <small>Pos. {position + 1}</small>
        </Card.Header>
        <Card.Body className={`p-2 ${isCompact ? 'p-1' : ''}`}>
          <CardDisplay 
            card={card} 
            showBadLuckIndex={true}
            compact={isCompact}
          />
        </Card.Body>
        <Card.Footer className="text-center py-1">
          <small className="text-muted">
            Bad Luck: <strong>{card.bad_luck_index}</strong>
          </small>
        </Card.Footer>
      </Card>
    </div>
  );
}

/**
 * InvisibleDropZone - Drop zone for positioning cards before or after the sequence
 * 
 * Provides invisible drop areas at the beginning and end of the card sequence
 * for positioning the target card at the extremes.
 * 
 * @param {number} position - Position identifier (-1 for before, 1000 for after)
 * @param {string} label - Display label for the drop zone
 * @param {boolean} isCompact - Whether to use compact layout
 */
export function InvisibleDropZone({ position, label, isCompact = false }) {
  const {
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: position === -1 ? 'invisible-before' : 'invisible-after',
    data: { isInvisible: true, position }
  });
  
  const style = {
    ...(transform ? { transform: CSS.Transform.toString(transform) } : {}),
    transition: transition || 'all 0.2s ease',
    minWidth: isCompact ? '90px' : '100px',
    maxWidth: isCompact ? '140px' : '180px',
    height: isCompact ? '200px' : '240px',
    border: '2px dashed #dee2e6',
    borderRadius: '8px',
    backgroundColor: 'rgba(108, 117, 125, 0.1)',
    flex: '1'
  };
  
  return (
    <div ref={setNodeRef} style={style}>
      <div className="h-100 d-flex align-items-center justify-content-center">
        <div className="text-center text-muted">
          <i className="bi bi-arrow-down-up"></i>
          <br />
          <small style={{ fontSize: isCompact ? '0.6rem' : '0.75rem' }}>
            {label}
          </small>
        </div>
      </div>
    </div>
  );
}