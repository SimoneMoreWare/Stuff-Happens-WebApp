// UserStats.jsx - User statistics component for profile page
import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';

function UserStats({ user, gameHistory, loading = false }) {
    // Loading state with placeholder
    if (loading) {
        return (
            <Card>
                <Card.Body className="text-center">
                    <div className="placeholder-glow">
                        <span className="placeholder col-6"></span>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    // Filter only completed games for accurate statistics
    const completeGames = gameHistory.filter(game => {
        // A game is complete if:
        // 1. It was won (6 cards collected)
        // 2. It was lost (3 wrong guesses)
        return (game.cards_collected >= 6) || (game.wrong_guesses >= 3);
    });

    // Calculate statistics from completed games only
    const totalGames = completeGames.length;
    const wonGames = completeGames.filter(game => game.status === 'won').length;
    const lostGames = completeGames.filter(game => game.status === 'lost').length;
    const winPercentage = totalGames > 0 ? Math.round((wonGames / totalGames) * 100) : 0;
    
    // Calculate total cards collected from completed games only
    const totalCardsCollected = completeGames.reduce((sum, game) => sum + (game.cards_collected || 0), 0);
    const averageCards = totalGames > 0 ? Math.round((totalCardsCollected / totalGames) * 10) / 10 : 0;

    return (
        <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
                <h4 className="mb-0">
                    <i className="bi bi-person-circle me-2"></i>
                    Statistiche di {user?.username}
                </h4>
            </Card.Header>
            <Card.Body className="p-4">
                {/* Main statistics grid */}
                <Row className="text-center">
                    <Col md={3} className="mb-3">
                        <div className="bg-body-secondary rounded p-3">
                            <div className="display-6 text-primary mb-1">{totalGames}</div>
                            <small className="text-muted">Partite Complete</small>
                        </div>
                    </Col>
                    <Col md={3} className="mb-3">
                        <div className="bg-body-secondary rounded p-3">
                            <div className="display-6 text-success mb-1">{wonGames}</div>
                            <small className="text-muted">Vittorie</small>
                        </div>
                    </Col>
                    <Col md={3} className="mb-3">
                        <div className="bg-body-secondary rounded p-3">
                            <div className="display-6 text-danger mb-1">{lostGames}</div>
                            <small className="text-muted">Sconfitte</small>
                        </div>
                    </Col>
                    <Col md={3} className="mb-3">
                        <div className="bg-body-secondary rounded p-3">
                            <div className="display-6 text-warning mb-1">{averageCards}</div>
                            <small className="text-muted">Carte Medie</small>
                        </div>
                    </Col>
                </Row>
                
                {/* Win percentage with progress bar */}
                <Row className="mt-4">
                    <Col>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold">Percentuale Vittorie</span>
                            <Badge bg={winPercentage >= 70 ? 'success' : winPercentage >= 40 ? 'warning' : 'danger'}>
                                {winPercentage}%
                            </Badge>
                        </div>
                        <ProgressBar 
                            now={winPercentage} 
                            variant={winPercentage >= 70 ? 'success' : winPercentage >= 40 ? 'warning' : 'danger'}
                            style={{ height: '10px' }}
                        />
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}

export default UserStats;