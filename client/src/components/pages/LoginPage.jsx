import { useContext, useEffect } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import UserContext from '../../context/UserContext.jsx';
import { LoginForm } from '../common/LoginForm.jsx';

function LoginPage() {
    const { loggedIn, handleLogin } = useContext(UserContext);
    const navigate = useNavigate();

    // Se già loggato, redirect alla home (come fa il prof con Navigate)
    useEffect(() => {
        if (loggedIn) {
            navigate('/');
        }
    }, [loggedIn, navigate]);

    // Wrapper per handleLogin che gestisce il redirect dopo successo
    const handleLoginWithRedirect = async (credentials) => {
        await handleLogin(credentials);
        // Se arriviamo qui senza errori, il login è riuscito
        // Il redirect viene gestito dall'useEffect sopra quando loggedIn cambia
    };

    if (loggedIn) {
        return (
            <Container>
                <Row className="justify-content-center">
                    <Col md={6}>
                        <Alert variant="info" className="text-center">
                            <h4>Sei già autenticato!</h4>
                            <p>Reindirizzamento alla home in corso...</p>
                        </Alert>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            {/* Header della pagina */}
            <Row className="mb-4">
                <Col className="text-center">
                    <h1 className="display-5 fw-bold text-primary mb-3">
                        <i className="bi bi-lightning-charge-fill me-2"></i>
                        Benvenuto in Stuff Happens!
                    </h1>
                    <p className="lead text-muted">
                        Accedi per giocare partite complete e salvare i tuoi progressi
                    </p>
                </Col>
            </Row>

            {/* Form di login */}
            <LoginForm handleLogin={handleLoginWithRedirect} />

            {/* Sezione informativa per utenti non registrati */}
            <Row className="mt-5">
                <Col>
                    <Card className="border-0 bg-body-secondary">
                        <Card.Body className="text-center p-4">
                            <h5 className="text-primary mb-3">
                                <i className="bi bi-question-circle me-2"></i>
                                Non hai un account?
                            </h5>
                            <p className="text-muted mb-3">
                                Puoi comunque provare il gioco in modalità demo oppure 
                                contattare l'amministratore per ottenere le credenziali.
                            </p>
                            <div className="d-flex gap-3 justify-content-center">
                                <Link to="/game" className="btn btn-outline-primary">
                                    <i className="bi bi-controller me-2"></i>
                                    Prova la Demo
                                </Link>
                                <Link to="/instructions" className="btn btn-outline-secondary">
                                    <i className="bi bi-book me-2"></i>
                                    Leggi le Regole
                                </Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Credenziali di test per lo sviluppo */}
            <Row className="mt-4">
                <Col>
                    <Card className="border-warning bg-warning bg-opacity-10">
                        <Card.Body className="text-center p-3">
                            <h6 className="text-warning mb-2">
                                <i className="bi bi-tools me-2"></i>
                                Credenziali di Test
                            </h6>
                            <small className="text-muted">
                                <strong>Account disponibili:</strong><br />
                                <strong>user1</strong> / password (utente con cronologia)<br />
                                <strong>user2</strong> / password (per testare nuove partite)<br />
                                <strong>testuser</strong> / password (account di test)
                            </small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default LoginPage;