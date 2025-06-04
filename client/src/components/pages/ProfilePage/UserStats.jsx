import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';

function UserStats({ user, gameHistory, loading = false }) {
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

    // Calcola statistiche dalle partite
    const totalGames = gameHistory.length;
    const wonGames = gameHistory.filter(game => game.status === 'won').length;
    const lostGames = gameHistory.filter(game => game.status === 'lost').length;
    const winPercentage = totalGames > 0 ? Math.round((wonGames / totalGames) * 100) : 0;
    
    // Calcola carte totali raccolte
    const totalCardsCollected = gameHistory.reduce((sum, game) => sum + (game.cards_collected || 0), 0);
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
                <Row className="text-center">
                    <Col md={3} className="mb-3">
                        <div className="bg-light rounded p-3">
                            <div className="display-6 text-primary mb-1">{totalGames}</div>
                            <small className="text-muted">Partite Giocate</small>
                        </div>
                    </Col>
                    <Col md={3} className="mb-3">
                        <div className="bg-light rounded p-3">
                            <div className="display-6 text-success mb-1">{wonGames}</div>
                            <small className="text-muted">Vittorie</small>
                        </div>
                    </Col>
                    <Col md={3} className="mb-3">
                        <div className="bg-light rounded p-3">
                            <div className="display-6 text-danger mb-1">{lostGames}</div>
                            <small className="text-muted">Sconfitte</small>
                        </div>
                    </Col>
                    <Col md={3} className="mb-3">
                        <div className="bg-light rounded p-3">
                            <div className="display-6 text-warning mb-1">{averageCards}</div>
                            <small className="text-muted">Carte Medie</small>
                        </div>
                    </Col>
                </Row>

                {/* Percentuale vittorie */}
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

                {/* Info account */}
                <Row className="mt-4 pt-3 border-top">
                    <Col>
                        <h6 className="text-muted mb-3">Informazioni Account</h6>
                        <div className="d-flex justify-content-between mb-2">
                            <span>Email:</span>
                            <span className="text-muted">{user?.email}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                            <span>ID Utente:</span>
                            <span className="text-muted">#{user?.id}</span>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}

export default UserStats;