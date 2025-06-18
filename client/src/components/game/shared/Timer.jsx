// Timer.jsx - Pure timer component for game rounds
import { ProgressBar, Alert } from 'react-bootstrap';

/**
 * Timer Component - Pure component that receives props from useGameTimer hook
 * 
 * Displays remaining time with visual progress bar and warning alerts.
 * Changes color based on remaining time (green -> yellow -> red).
 */
function Timer({ timeRemaining, duration = 30, isActive = false }) {
    // Calculate progress percentage for progress bar
    const percentage = ((duration - timeRemaining) / duration) * 100;
    
    // Determine color variant based on remaining time
    const variant = timeRemaining <= 5 ? 'danger' : timeRemaining <= 10 ? 'warning' : 'success';
    
    return (
        <div className="timer-container">
            {/* Timer header with remaining time display */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">
                    <i className="bi bi-clock me-2"></i>
                    Tempo Rimanente
                </h6>
                <span className={`fs-4 fw-bold text-${variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'success'}`}>
                    {timeRemaining}s
                </span>
            </div>
            
            {/* Progress bar showing elapsed time */}
            <ProgressBar 
                now={percentage} 
                variant={variant}
                className="mb-2"
                style={{ height: '8px' }}
            />
            
            {/* Warning alert when time is running out */}
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