import { useState, useEffect } from 'react';
import { ProgressBar, Alert } from 'react-bootstrap';

function Timer({ duration = 30, onTimeUp, isActive = false, onReset }) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (isActive && !isRunning) {
            setTimeLeft(duration);
            setIsRunning(true);
        } else if (!isActive) {
            setIsRunning(false);
            setTimeLeft(duration);
        }
    }, [isActive, duration]);

    useEffect(() => {
        let intervalId;
        
        if (isRunning && timeLeft > 0) {
            intervalId = setInterval(() => {
                setTimeLeft(time => {
                    if (time <= 1) {
                        setIsRunning(false);
                        // NON chiamare onTimeUp qui direttamente!
                        // Usa setTimeout per chiamarla nel prossimo tick
                        setTimeout(() => onTimeUp(), 0);
                        return 0;
                    }
                    return time - 1;
                });
            }, 1000);
        }

        return () => clearInterval(intervalId);
    }, [isRunning, timeLeft, onTimeUp]);

    const percentage = ((duration - timeLeft) / duration) * 100;
    const variant = timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : 'success';

    return (
        <div className="timer-container">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">
                    <i className="bi bi-clock me-2"></i>
                    Tempo Rimanente
                </h6>
                <span className={`fs-4 fw-bold text-${variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'success'}`}>
                    {timeLeft}s
                </span>
            </div>
            
            <ProgressBar 
                now={percentage} 
                variant={variant}
                className="mb-2"
                style={{ height: '8px' }}
            />

            {timeLeft <= 5 && timeLeft > 0 && (
                <Alert variant="danger" className="mb-0 py-2">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Tempo quasi scaduto!</strong>
                </Alert>
            )}
        </div>
    );
}

export default Timer;