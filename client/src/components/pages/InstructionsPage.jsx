// InstructionsPage.jsx - Game rules and instructions page
import { useContext } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router';
import UserContext from '../../context/UserContext.jsx';

function InstructionsPage() {
    const { loggedIn } = useContext(UserContext);

    return (
        <Container className="py-4">
            {/* Main Header */}
            <Row className="mb-5">
                <Col className="text-center">
                    <h1 className="display-4 fw-bold text-primary mb-3">
                        <i className="bi bi-book me-3"></i>
                        Come Giocare a Stuff Happens
                    </h1>
                    <p className="lead text-muted">
                        Tutto quello che devi sapere per diventare un esperto del disastro!
                    </p>
                </Col>
            </Row>

            {/* Game Objective */}
            <Row className="mb-5">
                <Col>
                    <Card className="border-primary shadow-sm">
                        <Card.Header className="bg-primary text-white">
                            <h3 className="mb-0">
                                <i className="bi bi-target me-2"></i>
                                Obiettivo del Gioco
                            </h3>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <Row>
                                <Col md={8}>
                                    <h5 className="text-success mb-3">Come Vincere</h5>
                                    <p className="fs-5">
                                        Raccogli <strong className="text-success">6 carte</strong> ordinandole 
                                        correttamente dal <span className="text-success">meno grave</span> al <span className="text-danger">più catastrofico</span>!
                                    </p>
                                    
                                    <h5 className="text-danger mb-3">Come Perdere</h5>
                                    <p className="fs-5">
                                        Commetti <strong className="text-danger">3 errori</strong> e la partita finisce.
                                    </p>
                                </Col>
                                <Col md={4} className="text-center">
                                    <div className="bg-body-secondary rounded p-3">
                                        <div className="display-6 text-success mb-2">6</div>
                                        <small className="text-muted">Carte per Vincere</small>
                                        
                                        <div className="display-6 text-danger mt-3 mb-2">3</div>
                                        <small className="text-muted">Errori Massimi</small>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* How it Works */}
            <Row className="mb-5">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-secondary text-white">
                            <h3 className="mb-0">
                                <i className="bi bi-gear me-2"></i>
                                Come Funziona una Partita
                            </h3>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <Row>
                                <Col md={6}>
                                    <h5 className="text-primary mb-3">Setup Iniziale</h5>
                                    <ListGroup variant="flush" className="mb-4">
                                        <ListGroup.Item className="d-flex align-items-center">
                                            <Badge bg="primary" className="me-3">1</Badge>
                                            Ricevi <b>3 carte iniziali</b> ordinate automaticamente
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex align-items-center">
                                            <Badge bg="primary" className="me-3">2</Badge>
                                            Vedi <strong>nome e immagine</strong> di ogni carta
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex align-items-center">
                                            <Badge bg="primary" className="me-3">3</Badge>
                                            Conosci il <strong>Bad Luck Index</strong> delle tue carte
                                        </ListGroup.Item>
                                    </ListGroup>

                                    <h5 className="text-success mb-3">Ogni Round</h5>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item className="d-flex align-items-center">
                                            <Badge bg="success" className="me-3">1</Badge>
                                            Ti viene mostrata una <strong>nuova situazione</strong>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex align-items-center">
                                            <Badge bg="success" className="me-3">2</Badge>
                                            Vedi <strong>solo nome e immagine</strong> (non l'indice!)
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex align-items-center">
                                            <Badge bg="success" className="me-3">3</Badge>
                                            Hai <strong>30 secondi</strong> per decidere la posizione
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex align-items-center">
                                            <Badge bg="success" className="me-3">4</Badge>
                                            Clicca dove pensi che vada nella sequenza
                                        </ListGroup.Item>
                                    </ListGroup>
                                </Col>
                                <Col md={6}>
                                    <Alert variant="info" className="mb-4">
                                        <h6 className="alert-heading">
                                            <i className="bi bi-lightbulb me-2"></i>
                                            Il Bad Luck Index
                                        </h6>
                                        <p className="mb-2">
                                            Ogni situazione ha un punteggio da <strong>1 a 100</strong>:
                                        </p>
                                        <ul className="mb-0">
                                            <li><strong>1-20:</strong> <span className="text-success">Fastidioso ma sopportabile</span></li>
                                            <li><strong>21-40:</strong> <span className="text-warning">Seccante</span></li>
                                            <li><strong>41-60:</strong> <span className="text-primary">Problematico</span></li>
                                            <li><strong>61-80:</strong> <span className="text-danger">Serio problema</span></li>
                                            <li><strong>81-100:</strong> <span className="text-dark">Catastrofico!</span></li>
                                        </ul>
                                    </Alert>

                                    <Alert variant="warning">
                                        <h6 className="alert-heading">
                                            <i className="bi bi-clock me-2"></i>
                                            Tempo Limite
                                        </h6>
                                        <p className="mb-0">
                                            Se non scegli entro <strong>30 secondi</strong> o 
                                            se indovini la posizione sbagliata, è un <strong>errore</strong>!
                                        </p>
                                    </Alert>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Game Modes */}
            <Row className="mb-5">
                <Col md={6}>
                    <Card className="h-100 border-warning">
                        <Card.Header className="bg-warning text-dark">
                            <h4 className="mb-0">
                                <i className="bi bi-controller me-2"></i>
                                Modalità Demo
                                <Badge bg="warning" text="dark" className="ms-2">Gratuita</Badge>
                            </h4>
                        </Card.Header>
                        <Card.Body>
                            <h6 className="text-primary mb-3">Per Utenti Anonimi</h6>
                            <ul className="list-unstyled">
                                <li className="mb-2">
                                    <i className="bi bi-check-circle text-success me-2"></i>
                                    <strong>1 round</strong> di prova
                                </li>
                                <li className="mb-2">
                                    <i className="bi bi-check-circle text-success me-2"></i>
                                    <strong>3 carte iniziali</strong> + 1 da posizionare
                                </li>
                                <li className="mb-2">
                                    <i className="bi bi-x-circle text-danger me-2"></i>
                                    Nessun salvataggio progressi
                                </li>
                                <li className="mb-2">
                                    <i className="bi bi-x-circle text-danger me-2"></i>
                                    Nessuna cronologia
                                </li>
                            </ul>
                            
                            <div className="mt-3">
                                <Link to="/game" className="btn btn-warning w-100">
                                    <i className="bi bi-play-circle me-2"></i>
                                    Prova la Demo
                                </Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="h-100 border-success">
                        <Card.Header className="bg-success text-white">
                            <h4 className="mb-0">
                                <i className="bi bi-trophy me-2"></i>
                                Partita Completa
                                <Badge bg="light" text="dark" className="ms-2">Registrazione</Badge>
                            </h4>
                        </Card.Header>
                        <Card.Body>
                            <h6 className="text-primary mb-3">Per Utenti Registrati</h6>
                            <ul className="list-unstyled">
                                <li className="mb-2">
                                    <i className="bi bi-check-circle text-success me-2"></i>
                                    <strong>Partita completa</strong> fino a 6 carte
                                </li>
                                <li className="mb-2">
                                    <i className="bi bi-check-circle text-success me-2"></i>
                                    <strong>Salvataggio automatico</strong> dei progressi
                                </li>
                                <li className="mb-2">
                                    <i className="bi bi-check-circle text-success me-2"></i>
                                    <strong>Cronologia</strong> di tutte le partite
                                </li>
                                <li className="mb-2">
                                    <i className="bi bi-check-circle text-success me-2"></i>
                                    <strong>Statistiche</strong> dettagliate
                                </li>
                            </ul>
                            
                            <div className="mt-3">
                                {loggedIn ? (
                                    <Link to="/game" className="btn btn-success w-100">
                                        <i className="bi bi-play-circle-fill me-2"></i>
                                        Inizia Partita
                                    </Link>
                                ) : (
                                    <Link to="/login" className="btn btn-success w-100">
                                        <i className="bi bi-person-plus me-2"></i>
                                        Accedi per Giocare
                                    </Link>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Practical Examples */}
            <Row className="mb-5">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-info text-white">
                            <h3 className="mb-0">
                                <i className="bi bi-lightbulb me-2"></i>
                                Esempi Pratici
                            </h3>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <h5 className="text-primary mb-3">Scenario di Esempio</h5>
                            <Row>
                                <Col md={8}>
                                    <Alert variant="light" className="border-start border-primary border-5">
                                        <h6 className="fw-bold">Le tue 3 carte iniziali (Bad Luck Index visibile):</h6>
                                        <ol className="mb-3">
                                            <li><strong>"Perdi le chiavi di casa"</strong> - Indice: <Badge bg="success">15</Badge></li>
                                            <li><strong>"Ti si rompe il telefono"</strong> - Indice: <Badge bg="warning">45</Badge></li>
                                            <li><strong>"Incidente d'auto minore"</strong> - Indice: <Badge bg="danger">75</Badge></li>
                                        </ol>
                                        
                                        <h6 className="fw-bold text-info">Nuova carta da posizionare:</h6>
                                        <p className="mb-2">
                                            <strong>"Ti cade il gelato per terra"</strong> 
                                            <Badge bg="secondary" className="ms-2">Indice nascosto</Badge>
                                        </p>
                                        
                                        <h6 className="fw-bold text-success">Dove la metteresti?</h6>
                                        <p className="mb-0">
                                            Probabilmente tra "Perdi le chiavi" e "Si rompe il telefono" 
                                            perché cadere il gelato è fastidioso ma non grave come un telefono rotto!
                                        </p>
                                    </Alert>
                                </Col>
                                <Col md={4}>
                                    <div className="bg-body-secondary rounded p-3 text-center">
                                        <h6 className="text-primary mb-3">Posizioni Possibili</h6>
                                        <div className="d-grid gap-2">
                                            <Button variant="outline-secondary" size="sm">Prima delle chiavi</Button>
                                            <Button variant="success" size="sm">Tra chiavi e telefono</Button>
                                            <Button variant="outline-secondary" size="sm">Tra telefono e incidente</Button>
                                            <Button variant="outline-secondary" size="sm">Dopo l'incidente</Button>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* FAQ and Tips */}
            <Row className="mb-5">
                <Col md={6}>
                    <Card className="h-100">
                        <Card.Header className="bg-dark text-white">
                            <h4 className="mb-0">
                                <i className="bi bi-question-circle me-2"></i>
                                FAQ - Domande Frequenti
                            </h4>
                        </Card.Header>
                        <Card.Body>
                            <h6 className="text-primary">Cosa succede se finisce il tempo?</h6>
                            <p className="mb-3">È considerato un errore. Hai solo 30 secondi per decidere!</p>
                            
                            <h6 className="text-primary">Posso cambiare idea dopo aver cliccato?</h6>
                            <p className="mb-3">No, la scelta è definitiva. Pensa bene prima di cliccare!</p>
                            
                            <h6 className="text-primary">Come faccio a sapere il Bad Luck Index esatto?</h6>
                            <p className="mb-3">Delle nuove carte non lo sai! Devi intuirlo da nome e immagine.</p>
                            
                            <h6 className="text-primary">Posso mettere in pausa la partita?</h6>
                            <p className="mb-0">
                                {loggedIn ? (
                                    "Sì! Le partite registrate vengono salvate automaticamente."
                                ) : (
                                    "No nella modalità demo. Registrati per salvare i progressi!"
                                )}
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="h-100">
                        <Card.Header className="bg-success text-white">
                            <h4 className="mb-0">
                                <i className="bi bi-trophy me-2"></i>
                                Consigli per Vincere
                            </h4>
                        </Card.Header>
                        <Card.Body>
                            <Alert variant="success" className="mb-3">
                                <strong>Strategia:</strong> Leggi attentamente il nome della situazione 
                                e osserva l'immagine prima di decidere!
                            </Alert>
                            
                            <h6 className="text-success">Pensa in termini di impatto:</h6>
                            <ul className="mb-3">
                                <li><strong>Fisico:</strong> Quanto male fisico causa?</li>
                                <li><strong>Emotivo:</strong> Quanto stress genera?</li>
                                <li><strong>Finanziario:</strong> Quanto costa risolvere?</li>
                                <li><strong>Tempo:</strong> Quanto tempo perdi?</li>
                            </ul>
                            
                            <h6 className="text-warning">Attenzione a:</h6>
                            <ul className="mb-0">
                                <li>Situazioni che sembrano gravi ma sono risolvibili</li>
                                <li>Piccoli problemi che possono avere conseguenze enormi</li>
                                <li>Il tuo bias personale - quello che è grave per te potrebbe non esserlo per altri!</li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Final Call to Action */}
            <Row>
                <Col>
                    <Card className="bg-primary text-white text-center">
                        <Card.Body className="p-4">
                            <h3 className="mb-3">
                                <i className="bi bi-rocket me-2"></i>
                                Pronto a Testare la Tua Resistenza ai Disastri?
                            </h3>
                            <p className="lead mb-4">
                                Ora che conosci le regole, è ora di mettere alla prova le tue capacità!
                            </p>
                            <div className="d-flex gap-3 justify-content-center">
                                {loggedIn ? (
                                    <>
                                        <Link to="/game" className="btn btn-light btn-lg">
                                            <i className="bi bi-play-circle-fill me-2"></i>
                                            Inizia Partita Completa
                                        </Link>
                                        <Link to="/profile" className="btn btn-outline-light btn-lg">
                                            <i className="bi bi-person-lines-fill me-2"></i>
                                            Vai al Profilo
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/game" className="btn btn-warning btn-lg">
                                            <i className="bi bi-controller me-2"></i>
                                            Prova Demo Gratuita
                                        </Link>
                                        <Link to="/login" className="btn btn-light btn-lg">
                                            <i className="bi bi-person-plus me-2"></i>
                                            Accedi per Partite Complete
                                        </Link>
                                    </>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default InstructionsPage;