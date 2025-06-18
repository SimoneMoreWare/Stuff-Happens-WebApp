import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';

/**
 * Header condiviso per i giochi
 * Versione semplificata e riutilizzabile
 */
export function GameHeader({ 
  title, 
  subtitle, 
  username, 
  onBackHome, 
  showBackButton = true,
  variant = "dark" 
}) {
  return (
    <Row className="mb-4">
      <Col xs={12}>
        <Card className={`bg-${variant} text-white`}>
          <Card.Body className="py-3">
            <div className="d-flex justify-content-between align-items-center">
              {showBackButton ? (
                <Button 
                  variant="outline-light" 
                  size="sm"
                  onClick={onBackHome}
                  className="d-flex align-items-center"
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Home
                </Button>
              ) : (
                <div></div>
              )}
              
              <div className="text-center">
                <h2 className="mb-1">
                  <i className="bi bi-controller me-2"></i>
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-light mb-0 opacity-75">
                    {subtitle}
                  </p>
                )}
              </div>
              
              <div className="text-end">
                {username ? (
                  <small className="text-light opacity-75">
                    {username}
                  </small>
                ) : (
                  <div style={{ width: '80px' }}></div>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}