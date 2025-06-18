import React from 'react';
import { Row, Col, Alert, Card } from 'react-bootstrap';

/**
 * GameInstructions - Dynamic instruction display component
 * 
 * Provides contextual game instructions that adapt to different game modes
 * and layout constraints. Supports both demo and full game variants with
 * responsive text and layout adjustments.
 * 
 * Features:
 * - Adaptive content based on game mode (demo vs full)
 * - Compact layout support for space-constrained interfaces
 * - Clear visual hierarchy with icons and color coding
 * - Responsive instruction text for different screen sizes
 */
export function GameInstructions({ isCompact = false, isDemo = false }) {
  return (
    <>
      {/* Primary game instructions */}
      <Row className="mb-3 mt-3">
        <Col xs={12}>
          <Alert variant="info" className="mb-2 text-center">
            <i className="bi bi-info-circle-fill me-2"></i>
            Trascina la carta Target nella posizione corretta
          </Alert>
          <Alert variant="warning" className="mb-0 text-center">
            <i className="bi bi-clock me-2"></i>
            Posizionala in base al Bad Luck Index delle altre carte
          </Alert>
        </Col>
      </Row>
      
      {/* Position reference guide */}
      <Row className="mt-3">
        <Col xs={12}>
          <Card className="bg-body-secondary">
            <Card.Body className="py-2">
              <small className="text-muted d-flex align-items-center justify-content-center">
                <i className="bi bi-lightbulb me-2"></i>
                {isCompact ? 
                  "Posizioni: Prima (0) • Tra carte (1,2,3...) • Dopo tutte" :
                  "Posizioni valide: Prima di tutte (0) • Dopo ogni carta (1, 2, 3...) • Dopo tutte"
                }
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Demo-specific instructions */}
      {isDemo && (
        <Row className="mt-2">
          <Col xs={12}>
            <Alert variant="secondary" className="text-center mb-0">
              <small>
                <i className="bi bi-info-circle me-2"></i>
                <strong>Modalità Demo:</strong> Una sola carta da posizionare per imparare il gioco
              </small>
            </Alert>
          </Col>
        </Row>
      )}
    </>
  );
}