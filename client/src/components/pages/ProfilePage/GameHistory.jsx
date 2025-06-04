import { Spinner, Alert, Card } from 'react-bootstrap';
import GameHistoryItem from './GameHistoryItem.jsx';

function GameHistory({ gameHistory, loading = false, error = null }) {
    if (loading) {
        return (
            <Card>
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" className="mb-3" />
                    <p className="text-muted">Caricamento cronologia partite...</p>
                </Card.Body>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="danger">
                <h6 className="alert-heading">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Errore nel caricamento
                </h6>
                <p className="mb-0">{error}</p>
            </Alert>
        );
    }

    if (!gameHistory || gameHistory.length === 0) {
        return (
            <Card>
                <Card.Body className="text-center py-5">
                    <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>
                        <i className="bi bi-controller"></i>
                    </div>
                    <h5>Nessuna partita giocata</h5>
                    <p className="text-muted mb-4">
                        Non hai ancora completato nessuna partita. Inizia subito a giocare!
                    </p>
                    <a href="/game" className="btn btn-primary">
                        <i className="bi bi-play-circle me-2"></i>
                        Inizia Nuova Partita
                    </a>
                </Card.Body>
            </Card>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">
                    <i className="bi bi-clock-history me-2"></i>
                    Cronologia Partite ({gameHistory.length})
                </h5>
                <small className="text-muted">Ordinate dalla più recente</small>
            </div>

            {gameHistory.map((game, index) => (
                <GameHistoryItem 
                    key={game.id} 
                    game={game} 
                    index={index}
                />
            ))}
        </div>
    );
}

export default GameHistory;
