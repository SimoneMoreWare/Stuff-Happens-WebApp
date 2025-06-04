// ============================================================================
// LoginPage.jsx - Pagina di login
// ============================================================================

import { useContext } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import UserContext from '../../context/UserContext.jsx';

function LoginPage() {
  const { loggedIn } = useContext(UserContext);

  // Se già loggato, redirect alla home (implementare con navigate)
  if (loggedIn) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={6}>
            <Card>
              <Card.Body className="text-center">
                <h3>Sei già autenticato!</h3>
                <p>Torna alla home page per continuare.</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h3 className="text-center">Accedi a Stuff Happens</h3>
            </Card.Header>
            <Card.Body>
              <p className="text-center text-muted">
                🚧 Form di login in sviluppo...
              </p>
              <p className="text-center">
                Qui ci sarà il LoginForm con useActionState per gestire username/password
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginPage;