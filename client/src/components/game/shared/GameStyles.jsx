/**
 * GameStyles - Shared CSS styles for game components
 * 
 * Centralized styling solution for consistent appearance across
 * DemoGameBoard and FullGameBoard components. Includes responsive
 * design patterns and interactive animations.
 * 
 * Style Categories:
 * - Responsive card layouts that adapt to screen size and card count
 * - Compact layout variants for high card density scenarios
 * - Smooth animations for drag & drop interactions
 * - Game state visual indicators (loading, active, warning)
 * - Mobile-responsive breakpoints and adjustments
 */
export const gameStyles = `
  /* Hide scrollbars in card containers for cleaner appearance */
  .cards-container::-webkit-scrollbar {
    display: none;
  }
  
  /* Responsive card sizing - adapts to available space and card count */
  .responsive-card {
    min-width: 100px;
    max-width: 180px;
    flex: 1;
  }
  
  /* Compact layout for 6+ cards - reduces spacing and sizing */
  .compact-layout .responsive-card {
    min-width: 90px;
    max-width: 140px;
  }
  
  .compact-layout .card-body {
    padding: 0.5rem !important;
  }
  
  .compact-layout .card-header {
    padding: 0.25rem !important;
    font-size: 0.75rem !important;
  }
  
  .compact-layout .badge-sm {
    font-size: 0.6rem !important;
  }
  
  .compact-card {
    font-size: 0.85rem;
  }
  
  /* Drag & drop interaction animations */
  .cards-container {
    transition: all 0.3s ease;
  }
  
  .responsive-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .responsive-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  /* Game state visual indicators */
  .game-loading {
    filter: blur(2px);
    pointer-events: none;
  }
  
  .game-active {
    filter: none;
    pointer-events: all;
  }
  
  /* Timer warning animation for urgency indication */
  .timer-warning {
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  
  /* Mobile responsive adjustments */
  @media (max-width: 768px) {
    .responsive-card {
      min-width: 80px;
      max-width: 120px;
    }
    
    .compact-layout .responsive-card {
      min-width: 70px;
      max-width: 100px;
    }
  }
`;