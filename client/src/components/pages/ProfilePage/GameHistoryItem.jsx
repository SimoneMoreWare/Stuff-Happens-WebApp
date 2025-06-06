import { useState } from 'react';
import { Card, Badge, Button, Collapse, Row, Col, ListGroup } from 'react-bootstrap';
import CardDisplay from '../../game/CardDisplay.jsx'; 
import dayjs from 'dayjs';
import 'dayjs/locale/it';

dayjs.locale('it');

function GameHistoryItem({ game, index }) {
    const [expanded, setExpanded] = useState(false);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'won':
                return <Badge bg="success"><i className="bi bi-trophy-fill me-1"></i>Vittoria</Badge>;
            case 'lost':
                return <Badge bg="danger"><i className="bi bi-x-circle-fill me-1"></i>Sconfitta</Badge>;
            case 'playing':
                return <Badge bg="primary"><i className="bi bi-play-circle-fill me-1"></i>In Corso</Badge>;
            default:
                return <Badge bg="secondary">Sconosciuto</Badge>;
        }
    };

    const formatDate = (dateString) => {
        return dayjs(dateString).format('DD MMM YYYY, HH:mm');
    };

    const getGameDuration = () => {
        if (!game.completed_at) return null;
        const start = dayjs(game.created_at);
        const end = dayjs(game.completed_at);
        const minutes = end.diff(start, 'minute');
        if (minutes < 1) return 'meno di 1 minuto';
        return `${minutes} minuti`;
    };

    return (
        <Card className="mb-3 border-start border-4" 
              style={{ borderLeftColor: game.status === 'won' ? '#198754' : game.status === 'lost' ? '#dc3545' : '#0d6efd' }}>
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                            <h6 className="mb-0 me-3">
                                <i className="bi bi-controller me-2"></i>
                                Partita #{game.id}
                            </h6>
                            {getStatusBadge(game.status)}
                        </div>
                        
                        <div className="text-muted small mb-2">
                            <i className="bi bi-calendar me-1"></i>
                            Iniziata: {formatDate(game.created_at)}
                            {game.completed_at && (
                                <>
                                    <br />
                                    <i className="bi bi-flag-fill me-1"></i>
                                    Completata: {formatDate(game.completed_at)}
                                    {getGameDuration() && (
                                        <span className="ms-2">({getGameDuration()})</span>
                                    )}
                                </>
                            )}
                        </div>

                        <Row className="text-center">
                            <Col xs={4}>
                                <div className="small text-muted">Carte Raccolte</div>
                                <div className="fw-bold text-primary">{game.cards_collected || 0}/6</div>
                            </Col>
                            <Col xs={4}>
                                <div className="small text-muted">Round</div>
                                <div className="fw-bold">{game.current_round || 1}</div>
                            </Col>
                            <Col xs={4}>
                                <div className="small text-muted">Errori</div>
                                <div className="fw-bold text-danger">{game.wrong_guesses || 0}/3</div>
                            </Col>
                        </Row>
                    </div>

                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                        className="ms-3"
                    >
                        <i className={`bi bi-chevron-${expanded ? 'up' : 'down'}`}></i>
                    </Button>
                </div>

                {/* Dettagli espandibili */}
                <Collapse in={expanded}>
                    <div className="mt-3 pt-3 border-top">
                        {game.cards && game.cards.length > 0 ? (
                            <>
                                <h6 className="mb-3">
                                    <i className="bi bi-card-list me-2"></i>
                                    Carte della Partita ({game.cards.length})
                                </h6>
                                <Row className="g-2">
                                    {game.cards
                                        .sort((a, b) => a.bad_luck_index - b.bad_luck_index) // Ordina per bad luck index
                                        .map((card, cardIndex) => (
                                        <Col key={cardIndex} md={4} lg={3}>
                                            <div className="text-center mb-2">
                                                <Badge bg={card.is_initial ? "secondary" : (card.guessed_correctly ? "success" : "danger")}>
                                                    {card.is_initial ? "Iniziale" : `Round ${card.round_number}`}
                                                </Badge>
                                            </div>
                                            <CardDisplay 
                                                card={{
                                                    id: card.id,
                                                    name: card.name,
                                                    image_url: card.image_url,
                                                    bad_luck_index: card.bad_luck_index,
                                                    theme: card.theme
                                                }}
                                                showBadLuckIndex={true}
                                                className="h-100"
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            </>
                        ) : (
                            <div className="text-muted text-center py-3">
                                <i className="bi bi-info-circle me-2"></i>
                                Nessun dettaglio disponibile per questa partita
                                        </div>
                                    )}
                                </div>
                </Collapse>
            </Card.Body>
        </Card>
    );
}

export default GameHistoryItem;