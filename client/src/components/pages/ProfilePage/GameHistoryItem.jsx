import { useState } from 'react';
import { Card, Badge, Button, Collapse, Row, Col, ListGroup } from 'react-bootstrap';
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

    // Separa le carte iniziali da quelle dei round
    const initialCards = game.cards ? game.cards.filter(card => card.is_initial) : [];
    const roundCards = game.cards ? game.cards.filter(card => !card.is_initial) : [];

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

                {/* Dettagli espandibili - CRONOLOGIA SECONDO SPECIFICHE */}
                <Collapse in={expanded}>
                    <div className="mt-3 pt-3 border-top">
                        {game.cards && game.cards.length > 0 ? (
                            <>
                                {/* CARTE INIZIALI - Non associate a nessun round */}
                                {initialCards.length > 0 && (
                                    <div className="mb-4">
                                        <h6 className="mb-3">
                                            <i className="bi bi-card-heading me-2"></i>
                                            Carte Iniziali ({initialCards.length})
                                        </h6>
                                        <ListGroup variant="flush">
                                            {initialCards
                                                .sort((a, b) => a.bad_luck_index - b.bad_luck_index)
                                                .map((card, cardIndex) => (
                                                <ListGroup.Item key={cardIndex} className="d-flex align-items-center py-2">
                                                    <Badge bg="secondary" className="me-3">
                                                        Iniziale
                                                    </Badge>
                                                    <span className="flex-grow-1">
                                                        {card.name}
                                                    </span>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </div>
                                )}

                                {/* ROUND GIOCATI - Con indicazione vinti/persi */}
                                {roundCards.length > 0 && (
                                    <div className="mb-3">
                                        <h6 className="mb-3">
                                            <i className="bi bi-play-circle me-2"></i>
                                            Cronologia Round ({roundCards.length})
                                        </h6>
                                        <ListGroup variant="flush">
                                            {roundCards
                                                .sort((a, b) => a.round_number - b.round_number)
                                                .map((card, cardIndex) => (
                                                <ListGroup.Item key={cardIndex} className="d-flex align-items-center py-2">
                                                    <Badge 
                                                        bg={card.guessed_correctly ? "success" : "danger"} 
                                                        className="me-3"
                                                    >
                                                        Round {card.round_number}
                                                    </Badge>
                                                    <span className="flex-grow-1">
                                                        {card.name}
                                                    </span>
                                                    <Badge 
                                                        bg={card.guessed_correctly ? "outline-success" : "outline-danger"}
                                                        text={card.guessed_correctly ? "success" : "danger"}
                                                    >
                                                        {card.guessed_correctly ? (
                                                            <>
                                                                <i className="bi bi-check-circle me-1"></i>
                                                                Vinta
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-x-circle me-1"></i>
                                                                Persa
                                                            </>
                                                        )}
                                                    </Badge>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </div>
                                )}

                                {/* RIEPILOGO SECONDO SPECIFICHE */}
                                <div className="mt-4 pt-3 border-top">
                                    <h6 className="mb-3">
                                        <i className="bi bi-trophy me-2"></i>
                                        Riepilogo Finale
                                    </h6>
                                    
                                    {/* Solo il numero totale come richiesto dalle specifiche */}
                                    <div className="alert alert-light mb-0 text-center">
                                        <strong>
                                            {game.status === 'won' ? 'Vittoria' : 'Sconfitta'}: {game.cards_collected || 0} carte raccolte
                                        </strong>
                                    </div>
                                    
                                    {/* Opzionale: struttura come specificato dal prof */}
                                    <div className="text-muted small mt-2 text-center">
                                        Partita con {initialCards.length} carte iniziali + {roundCards.filter(c => c.guessed_correctly).length} carte vinte nei round
                                    </div>
                                </div>
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