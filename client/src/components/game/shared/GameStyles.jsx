/**
 * GameStyles - Shared CSS styles for game components
 * 
 * Centralized styling solution with minimal, functional design.
 * Features compact info bar, clean card layouts, and smooth animations.
 */
export const gameStyles = `
  /* ============================================
     MINIMAL INFO BAR - Sopra le carte
     ============================================ */
  .info-bar-minimal {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .info-bar-minimal .badge {
    font-size: 0.85rem;
    padding: 0.35rem 0.6rem;
    font-weight: 500;
  }
  
  /* ============================================
     CARD CONTAINERS - Pulito e funzionale
     ============================================ */
  .cards-container {
    overflow-x: hidden;
    overflow-y: hidden;
    transition: all 0.3s ease;
  }
  
  .cards-container::-webkit-scrollbar {
    display: none;
  }
  
  /* ============================================
     RESPONSIVE CARD SIZING
     ============================================ */
  .responsive-card {
    min-width: 100px;
    max-width: 180px;
    flex: 1;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .responsive-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  /* ============================================
     COMPACT LAYOUT - Per 6+ carte
     ============================================ */
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
  
  /* ============================================
     GAME STATE INDICATORS
     ============================================ */
  .game-loading {
    filter: blur(2px);
    pointer-events: none;
  }
  
  .game-active {
    filter: none;
    pointer-events: all;
  }
  
  /* ============================================
     TIMER WARNING - Animazione urgenza
     ============================================ */
  .timer-warning {
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  
  /* ============================================
     MOBILE RESPONSIVE
     ============================================ */
  @media (max-width: 768px) {
    .info-bar-minimal {
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
    }
    
    .info-bar-minimal > div {
      width: 100%;
      justify-content: center;
    }
    
    .responsive-card {
      min-width: 80px;
      max-width: 120px;
    }
    
    .compact-layout .responsive-card {
      min-width: 70px;
      max-width: 100px;
    }
  }
  
  /* ============================================
     UTILITY CLASSES
     ============================================ */
  .text-minimal {
    font-size: 0.875rem;
    color: #6c757d;
  }
  
  .btn-minimal {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-minimal:hover {
    transform: scale(1.1);
  }
  
  /* ============================================
     SMOOTH TRANSITIONS
     ============================================ */
  * {
    transition: background-color 0.2s ease,
                color 0.2s ease,
                border-color 0.2s ease;
  }
`;