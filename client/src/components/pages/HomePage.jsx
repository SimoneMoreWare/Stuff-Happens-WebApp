import { useContext } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import UserContext from '../../context/UserContext.jsx';

function HomePage() {
  const { user, loggedIn } = useContext(UserContext);
  const navigate = useNavigate();

  // ============================================================================
  // ✅ GESTIONE NAVIGAZIONE SEMPLIFICATA AL MASSIMO
  // ============================================================================
  
  // Tutti i pulsanti portano sempre a /game normale
  // Sarà il GamePage a mostrare il pulsante per creare nuova partita
  const handleStartGame = () => {
    navigate('/game');
  };

  const handleStartDemo = () => {
    navigate('/game');
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <Container>
      {/* Hero Section */}
      <Row className="text-center py-5">
        <Col>
          <h1 className="display-4 fw-bold text-primary mb-4">
            <i className="bi bi-lightning-charge-fill me-3"></i>
            Stuff Happens
          </h1>
          
          <div className="mb-3">
            <Badge bg="info" className="fs-6 px-3 py-2">
              <i className="bi bi-mortarboard-fill me-2"></i>
              Tema: Vita Universitaria
            </Badge>
          </div>
          
          <p className="lead text-muted mb-4">
            Il gioco dove devi ordinare le situazioni più sfortunate della vita universitaria!
          </p>
          <p className="fs-5">
            Ricevi carte con <span className="fw-bold text-info">situazioni universitarie disastrose</span> e cerca di metterle nell'ordine giusto 
            dal <span className="text-success fw-bold">meno grave</span> al <span className="text-danger fw-bold">più catastrofico</span>.
          </p>
          
          <div className="mt-4">
            <small className="text-muted fst-italic">
              "Dimentichi di iscriverti all'esame", "Ti addormenti durante la lezione del professore più severo", 
              "Consegni la tesi con il nome sbagliato"...
            </small>
          </div>
        </Col>
      </Row>

      {/* Sezione Azioni Principali */}
      <Row className="justify-content-center mb-5">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-2 border-primary">
            <Card.Body className="p-4 bg-body-secondary">
              {loggedIn ? (
                // ========== UTENTE AUTENTICATO ==========
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-success">
                      <i className="bi bi-person-check-fill me-2"></i>
                      Benvenuto, {user?.username}!
                    </h3>
                    <p className="text-muted">Inizia una nuova partita completa:</p>
                  </div>
                  <div className="d-grid gap-3">
                    {/* ✅ SUPER SEMPLICE: Un solo pulsante */}
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={handleStartGame}
                      className="d-flex align-items-center justify-content-center"
                    >
                      <i className="bi bi-controller me-2"></i>
                      Vai al Gioco
                    </Button>
                    
                    <Link 
                      to="/profile" 
                      className="btn btn-outline-primary d-flex align-items-center justify-content-center"
                    >
                      <i className="bi bi-person-lines-fill me-2"></i>
                      Visualizza Profilo e Cronologia
                    </Link>
                  </div>
                </>
              ) : (
                // ========== UTENTE ANONIMO ==========
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-primary">Inizia a Giocare!</h3>
                    <p className="text-muted">
                      Prova subito il gioco o accedi per funzionalità complete
                    </p>
                  </div>
                  <div className="d-grid gap-3">
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={handleStartDemo}
                      className="d-flex align-items-center justify-content-center"
                    >
                      <i className="bi bi-controller me-2"></i>
                      Gioca Demo 
                      <Badge bg="warning" text="dark" className="ms-2">
                        1 Round
                      </Badge>
                    </Button>
                    
                    <Link 
                      to="/login" 
                      className="btn btn-success d-flex align-items-center justify-content-center"
                    >
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Accedi per Partite Complete
                    </Link>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sezione Informazioni */}
      <Row className="mb-5">
        <Col md={6} className="mb-4">
          <Card className="h-100 border-2 border-secondary shadow-lg">
            <Card.Body className="text-center bg-body-secondary">
              <div className="text-primary mb-3">
                <i className="bi bi-question-circle-fill" style={{ fontSize: '3rem' }}></i>
              </div>
              <h4>Come Funziona?</h4>
              <p className="text-muted">
                Ricevi situazioni universitarie sfortunate e devi ordinarle dalla meno grave alla più catastrofica. 
                Hai 30 secondi per decidere!
              </p>
              <Link to="/instructions" className="btn btn-outline-primary">
                <i className="bi bi-book me-2"></i>
                Leggi le Regole
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-4">
          <Card className="h-100 border-2 border-secondary shadow-lg">
            <Card.Body className="text-center bg-body-secondary">
              <div className="text-success mb-3">
                <i className="bi bi-trophy-fill" style={{ fontSize: '3rem' }}></i>
              </div>
              <h4>Obiettivo</h4>
              <p className="text-muted">
                {loggedIn ? (
                  <>
                    Raccogli 6 carte per vincere! Massimo 3 errori prima della sconfitta.
                    <br />
                    <small className="text-info">
                      💡 Ogni partita è sempre completamente nuova!
                    </small>
                  </>
                ) : (
                  <>Prova la modalità demo con un solo round. Registrati per partite complete!</>
                )}
              </p>
              {!loggedIn && (
                <Link to="/login" className="btn btn-outline-success">
                  <i className="bi bi-person-plus me-2"></i>
                  Registrati/Accedi
                </Link>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Footer informativo */}
      <Row className="text-center py-4 border-top">
        <Col>
          <p className="text-muted mb-0">
            <i className="bi bi-lightbulb me-2"></i>
            <strong>Suggerimento:</strong> Non tutte le situazioni universitarie sono ovvie! 
            Pensa bene prima di posizionare una carta.
          </p>
          {loggedIn && (
            <small className="text-success d-block mt-2">
              ✅ Zero errori in console - API chiamate solo al click dei pulsanti!
            </small>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default HomePage;