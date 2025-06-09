import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Button, Alert, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';

import UserContext from '../../../context/UserContext.jsx';
import API from '../../../API/API.mjs';

import UserStats from './UserStats.jsx';
import GameHistory from './GameHistory.jsx';

function ProfilePage() {
    const { loggedIn, user, currentGame, handleLogout } = useContext(UserContext);
    const navigate = useNavigate();

    // Stati per cronologia partite
    const [gameHistory, setGameHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ============================================================================
    // PROTEZIONE AUTENTICAZIONE
    // ============================================================================

    useEffect(() => {
        if (!loggedIn) {
            navigate('/login');
            return;
        }
        loadGameHistory();
    }, [loggedIn, navigate]);

    // ============================================================================
    // CARICAMENTO DATI
    // ============================================================================

    const loadGameHistory = async () => {
        try {
            setLoading(true);
            setError('');
            
            const history = await API.getGameHistory();
            setGameHistory(history);
            
        } catch (err) {
            console.error('Errore caricamento cronologia:', err);
            setError('Impossibile caricare la cronologia delle partite. Riprova più tardi.');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================================
    // GESTORI EVENTI
    // ============================================================================

    const handleLogoutWithRedirect = async () => {
        await handleLogout();
        navigate('/');
    };

    const handleNewGame = () => {
        navigate('/game');
    };

    const handleRefreshHistory = () => {
        loadGameHistory();
    };

    // ============================================================================
    // PROTEZIONE RENDER
    // ============================================================================

    if (!loggedIn) {
        return (
            <Container>
                <Row className="justify-content-center">
                    <Col md={8}>
                        <Alert variant="warning" className="text-center">
                            <h4>Accesso Richiesto</h4>
                            <p>Devi essere autenticato per visualizzare il profilo.</p>
                            <Link to="/login" className="btn btn-primary">
                                Vai al Login
                            </Link>
                        </Alert>
                    </Col>
                </Row>
            </Container>
        );
    }

    // ============================================================================
    // RENDER PRINCIPALE
    // ============================================================================

    return (
        <Container className="py-4">
            {/* Header profilo */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-1">
                                <i className="bi bi-person-lines-fill me-2"></i>
                                Il Mio Profilo
                            </h2>
                            <p className="text-muted mb-0">
                                Benvenuto, <strong>{user?.username}</strong>!
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="primary" onClick={handleNewGame}>
                                <i className="bi bi-plus-circle me-2"></i>
                                {currentGame ? 'Nuova Partita' : 'Inizia a Giocare'}
                            </Button>
                            <Button variant="outline-danger" onClick={handleLogoutWithRedirect}>
                                <i className="bi bi-box-arrow-right me-2"></i>
                                Logout
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Statistiche utente */}
            <Row className="mb-5">
                <Col>
                    <UserStats 
                        user={user} 
                        gameHistory={gameHistory} 
                        loading={loading}
                    />
                </Col>
            </Row>

            {/* Cronologia partite */}
            <Row>
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="bi bi-clock-history me-2"></i>
                                Cronologia Partite
                            </h5>
                            <Button 
                                variant="outline-light" 
                                size="sm"
                                onClick={handleRefreshHistory}
                                disabled={loading}
                            >
                                <i className="bi bi-arrow-clockwise me-1"></i>
                                Aggiorna
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <GameHistory 
                                gameHistory={gameHistory}
                                loading={loading}
                                error={error}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ProfilePage;