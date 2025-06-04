import { Card, Row, Col, Button, Badge, Alert, ListGroup } from 'react-bootstrap';
import CardDisplay from './CardDisplay.jsx';

function GameSummary({ 
    gameWon, 
    finalCards, 
    totalRounds, 
    cardsCollected, 
    wrongGuesses,
    onNewGame, 
    onBackHome, 
    isDemo = false 
}) {
    
    return (
        <div className="game-summary">
            {/* Header principale con risultato */}
            <Row className="mb-5">
                <Col className="text-center">
                    <div className={`display-3 mb-3 ${gameWon ? 'text-success' : 'text-danger'}`}>
                        {gameWon ? (
                            <i className="bi bi-trophy-fill"></i>
                        ) : (
                            <i className="bi bi-emoji-frown"></i>
                        )}
                    </div>
                    <h1 className={`display-4 fw-bold ${gameWon ? 'text-success' : 'text-danger'}`}>
                        {gameWon ? 'Vittoria! 🏆' : 'Partita Persa 💀'}
                    </h1>
                    <p className="lead text-muted mb-4">
                        {gameWon ? 
                            'Congratulazioni! Hai dimostrato di essere un vero esperto del disastro!' : 
                            'Peccato! I disastri della vita ti hanno sopraffatto questa volta.'
                        }
                    </p>
                </Col>
            </Row>

            {/* Statistiche della partita */}
            <Row className="mb-5">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className={`${gameWon ? 'bg-success' : 'bg-danger'} text-white text-center`}>
                            <h4 className="mb-0">
                                <i className="bi bi-graph-up me-2"></i>
                                Statistiche Partita
                            </h4>
                        </Card.Header>
                        <Card.Body>
                            <Row className="text-center">
                                <Col md={3} className="mb-3">
                                    <div className="bg-light rounded p-3">
                                        <div className="display-6 text-primary mb-1">{totalRounds}</div>
                                        <small className="text-muted">Round Giocati</small>
                                    </div>
                                </Col>
                                <Col md={3} className="mb-3">
                                    <div className="bg-light rounded p-3">
                                        <div className="display-6 text-success mb-1">{cardsCollected}</div>
                                        <small className="text-muted">Carte Raccolte</small>
                                    </div>
                                </Col>
                                <Col md={3} className="mb-3">
                                    <div className="bg-light rounded p-3">
                                        <div className="display-6 text-danger mb-1">{wrongGuesses}</div>
                                        <small className="text-muted">Errori Commessi</small>
                                    </div>
                                </Col>
                                <Col md={3} className="mb-3">
                                    <div className="bg-light rounded p-3">
                                        <div className="display-6 text-warning mb-1">
                                            {totalRounds > 0 ? Math.round(((totalRounds - wrongGuesses) / totalRounds) * 100) : 0}%
                                        </div>
                                        <small className="text-muted">Precisione</small>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Carte raccolte */}
            {finalCards && finalCards.length > 0 && (
                <Row className="mb-5">
                    <Col>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-primary text-white">
                                <h4 className="mb-0">
                                    <i className="bi bi-collection me-2"></i>
                                    Le Tue Carte ({finalCards.length})
                                </h4>
                            </Card.Header>
                            <Card.Body>
                                <p className="text-muted mb-4">
                                    Ecco tutte le carte che sei riuscito a raccogliere, ordinate dal Bad Luck Index più basso al più alto:
                                </p>
                                <Row className="g-3">
                                    {finalCards.map((card, index) => (
                                        <Col key={card.id} md={4} lg={3}>
                                            <div className="text-center mb-2">
                                                <Badge bg="secondary">#{index + 1}</Badge>
                                            </div>
                                            <CardDisplay 
                                                card={card} 
                                                showBadLuckIndex={true}
                                                className="h-100"
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Analisi delle performance */}
            <Row className="mb-5">
                <Col>
                    <Alert variant={gameWon ? 'success' : 'warning'} className="mb-4">
                        <h5 className="alert-heading">
                            <i className="bi bi-lightbulb me-2"></i>
                            Analisi delle Performance
                        </h5>
                        
                        {gameWon ? (
                            <div>
                                <p className="mb-2">
                                    <strong>Eccellente!</strong> Hai dimostrato una perfetta comprensione 
                                    della scala dei disastri della vita.
                                </p>
                                <ListGroup variant="flush" className="bg-transparent">
                                    <ListGroup.Item className="bg-transparent px-0">
                                        <i className="bi bi-check-circle text-success me-2"></i>
                                        Hai raccolto tutte e 6 le carte necessarie
                                    </ListGroup.Item>
                                    <ListGroup.Item className="bg-transparent px-0">
                                        <i className="bi bi-check-circle text-success me-2"></i>
                                        Hai mantenuto gli errori sotto il limite di 3
                                    </ListGroup.Item>
                                    <ListGroup.Item className="bg-transparent px-0">
                                        <i className="bi bi-check-circle text-success me-2"></i>
                                        La tua precisione è stata del {Math.round(((totalRounds - wrongGuesses) / totalRounds) * 100)}%
                                    </ListGroup.Item>
                                </ListGroup>
                            </div>
                        ) : (
                            <div>
                                <p className="mb-2">
                                    <strong>Non scoraggiarti!</strong> Interpretare i disastri è più difficile di quanto sembri.
                                </p>
                                <ListGroup variant="flush" className="bg-transparent">
                                    <ListGroup.Item className="bg-transparent px-0">
                                        <i className="bi bi-info-circle text-primary me-2"></i>
                                        Hai raccolto {cardsCollected} carte su 6 necessarie
                                    </ListGroup.Item>
                                    <ListGroup.Item className="bg-transparent px-0">
                                        <i className="bi bi-info-circle text-primary me-2"></i>
                                        Hai commesso {wrongGuesses} errori (limite: 3)
                                    </ListGroup.Item>
                                    <ListGroup.Item className="bg-transparent px-0">
                                        <i className="bi bi-lightbulb text-warning me-2"></i>
                                        <strong>Consiglio:</strong> Presta più attenzione alle immagini e ai dettagli del nome delle situazioni
                                    </ListGroup.Item>
                                </ListGroup>
                            </div>
                        )}
                    </Alert>
                </Col>
            </Row>

            {/* Pulsanti di azione finale */}
            <Row>
                <Col>
                    <Card className="bg-light text-center">
                        <Card.Body className="p-4">
                            <h4 className="mb-3">Cosa vuoi fare ora?</h4>
                            <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                                <Button 
                                    variant="primary" 
                                    size="lg" 
                                    onClick={onNewGame}
                                    className="d-flex align-items-center"
                                >
                                    <i className="bi bi-arrow-repeat me-2"></i>
                                    {gameWon ? 'Nuova Sfida' : 'Riprova'}
                                </Button>
                                
                                {!isDemo && (
                                    <Button 
                                        variant="outline-primary" 
                                        size="lg"
                                        href="/profile"
                                        className="d-flex align-items-center"
                                    >
                                        <i className="bi bi-person-lines-fill me-2"></i>
                                        Vai al Profilo
                                    </Button>
                                )}
                                
                                <Button 
                                    variant="outline-secondary" 
                                    size="lg"
                                    onClick={onBackHome}
                                    className="d-flex align-items-center"
                                >
                                    <i className="bi bi-house me-2"></i>
                                    Torna alla Home
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Messaggio per utenti demo */}
            {isDemo && (
                <Row className="mt-4">
                    <Col>
                        <Alert variant="info" className="text-center">
                            <h5 className="alert-heading">
                                <i className="bi bi-star me-2"></i>
                                Ti è piaciuto il gioco?
                            </h5>
                            <p className="mb-3">
                                Questa era solo un'anteprima! Registrati per giocare partite complete 
                                e tenere traccia dei tuoi progressi.
                            </p>
                            <Button variant="success" href="/login" size="lg">
                                <i className="bi bi-person-plus me-2"></i>
                                Registrati Ora
                            </Button>
                        </Alert>
                    </Col>
                </Row>
            )}
        </div>
    );
}

export default GameSummary;