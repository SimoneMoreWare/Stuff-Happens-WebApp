
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router';

function NotFoundPage() {
  return (
    <Container>
      <Row className="justify-content-center min-vh-100 align-items-center">
        <Col md={6}>
          <Card className="text-center">
            <Card.Body>
              <div className="display-1 text-muted mb-3">
                <i className="bi bi-exclamation-triangle"></i>
              </div>
              <h1 className="display-4">404</h1>
              <h4 className="text-muted mb-4">Pagina Non Trovata</h4>
              <p className="lead">
                Sembra che tu abbia trovato una situazione davvero sfortunata: 
                una pagina che non esiste!
              </p>
              <Link to="/" className="btn btn-primary btn-lg">
                <i className="bi bi-house-fill me-2"></i>
                Torna alla Home
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default NotFoundPage;    