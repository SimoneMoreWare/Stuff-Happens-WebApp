import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

/**
 * GameInstructions - Dynamic instruction display component
 * 
 * Provides contextual game instructions with modern, compact design.
 * Features gradient backgrounds and better visual hierarchy.
 */
export function GameInstructions({ isCompact = false, isDemo = false }) {
  return (
    <>
      {/* Compact instruction card with gradient */}
      <Row className="mb-3 mt-3">
        <Col xs={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="py-3 px-4" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="bi bi-cursor-fill me-2 fs-5"></i>
                <strong className="fs-6">Trascina la carta nella posizione corretta</strong>
              </div>
              <div className="text-center">
                <small style={{ opacity: 0.9 }}>
                  Posizionala secondo il <strong>Bad Luck Index</strong> crescente
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Position reference guide - Modern chip style */}
      <Row className="mb-3">
        <Col xs={12}>
          <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
            <span className="badge rounded-pill bg-light text-dark px-3 py-2 border">
              <i className="bi bi-arrow-left me-1"></i>
              Prima (0)
            </span>
            <span className="badge rounded-pill bg-light text-dark px-3 py-2 border">
              <i className="bi bi-arrows-expand me-1"></i>
              Tra le carte (1, 2, 3...)
            </span>
            <span className="badge rounded-pill bg-light text-dark px-3 py-2 border">
              <i className="bi bi-arrow-right me-1"></i>
              Dopo tutte
            </span>
          </div>
        </Col>
      </Row>
      
      {/* Demo-specific instructions */}
      {isDemo && (
        <Row className="mb-2">
          <Col xs={12}>
            <Card className="border-0 bg-warning bg-opacity-10">
              <Card.Body className="py-2 px-3">
                <div className="d-flex align-items-center justify-content-center">
                  <i className="bi bi-star-fill text-warning me-2"></i>
                  <small className="text-dark">
                    <strong>Demo:</strong> Una sola carta per imparare il gioco
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
}