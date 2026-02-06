/**
 * GameStats - Game progress statistics display
 * 
 * Modern, compact display with color-coded statistics.
 */
export function GameStats({ currentGame, targetCard, timerActive, onTimeUp }) {
  return (
    <Col xs={12} className="mt-3 mb-2">
      <Card className="border-0 shadow-sm">
        <Card.Body className="py-2 px-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            {/* Section title */}
            <div className="d-flex align-items-center">
              <i className="bi bi-bar-chart-fill text-primary me-2"></i>
              <strong className="text-muted">Progresso</strong>
            </div>
            
            {/* Stats badges - Modern chip style */}
            <div className="d-flex gap-2 flex-wrap">
              <span className="badge rounded-pill" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '0.9rem',
                padding: '0.4rem 0.8rem'
              }}>
                <i className="bi bi-play-circle me-1"></i>
                Round {currentGame.current_round}
              </span>
              
              <span className="badge rounded-pill bg-success" style={{
                fontSize: '0.9rem',
                padding: '0.4rem 0.8rem'
              }}>
                <i className="bi bi-collection me-1"></i>
                {currentGame.cards_collected}/6 Carte
              </span>
              
              <span className={`badge rounded-pill ${
                currentGame.wrong_guesses === 0 ? 'bg-success' :
                currentGame.wrong_guesses === 1 ? 'bg-warning' :
                currentGame.wrong_guesses === 2 ? 'bg-danger bg-opacity-75' :
                'bg-danger'
              }`} style={{
                fontSize: '0.9rem',
                padding: '0.4rem 0.8rem'
              }}>
                <i className="bi bi-x-circle me-1"></i>
                {currentGame.wrong_guesses}/3 Errori
              </span>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}