import { ProgressBar, Alert } from 'react-bootstrap';

/**
 * Timer Component - VERSIONE FINALE
 * Componente puro che riceve solo props dal hook useGameTimer
 */
function Timer({ timeRemaining, duration = 30, isActive = false }) {
    const percentage = ((duration - timeRemaining) / duration) * 100;
    const variant = timeRemaining <= 5 ? 'danger' : timeRemaining <= 10 ? 'warning' : 'success';
    
    return (
        <div className="timer-container">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">
                    <i className="bi bi-clock me-2 pr-2 mr-2"></i>
                    Tempo Rimanente&nbsp;
                </h6>
                <span className={`pl-2 ml-2 fs-4 fw-bold text-${variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'success'}`}>
                    {timeRemaining}s
                </span>
            </div>
            
            <ProgressBar 
                now={percentage} 
                variant={variant}
                className="mb-2"
                style={{ height: '8px' }}
            />
            
            {timeRemaining <= 5 && timeRemaining > 0 && (
                <Alert variant="danger" className="mb-0 py-2">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Tempo quasi scaduto!</strong>
                </Alert>
            )}
        </div>
    );
}

export default Timer;