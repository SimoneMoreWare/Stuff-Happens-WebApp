/**
 * Stili CSS condivisi per i componenti di gioco
 * Condiviso tra DemoGameBoard e FullGameBoard
 */
export const gameStyles = `
  .cards-container::-webkit-scrollbar {
    display: none;
  }
  
  /* Responsive cards: Si adattano al numero di carte */
  .responsive-card {
    min-width: 100px;
    max-width: 180px;
    flex: 1;
  }
  
  /* Layout compatto per 6+ carte */
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

  /* Animazioni per drag & drop */
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

  /* Stati del gioco */
  .game-loading {
    filter: blur(2px);
    pointer-events: none;
  }

  .game-active {
    filter: none;
    pointer-events: all;
  }

  /* Indicatori di stato */
  .timer-warning {
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  /* Layout responsivo */
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