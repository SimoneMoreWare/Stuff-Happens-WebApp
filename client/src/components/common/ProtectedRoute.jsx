import { useContext } from 'react';
import { Navigate } from 'react-router';
import { Container, Alert, Spinner } from 'react-bootstrap';
import UserContext from '../../context/UserContext.jsx';

/**
 * ProtectedRoute - Higher Order Component per proteggere rotte autenticate
 * 
 * Seguendo la filosofia del corso:
 * - Controllo semplice e diretto dello stato di autenticazione
 * - Redirect automatico alla pagina di login se non autenticato
 * - Messaggio di caricamento durante verifica autenticazione
 * - Fallback graceful con messaggi chiari per l'utente
 * 
 * Utilizzo:
 * <ProtectedRoute>
 *   <ComponenteProtetto />
 * </ProtectedRoute>
 */
function ProtectedRoute({ children, fallbackPath = '/login' }) {
    const { loggedIn, user } = useContext(UserContext);
    
    // Se non è loggato, redirect al login
    if (!loggedIn) {
        return <Navigate to={fallbackPath} replace />;
    }
    
    // Se è loggato ma non abbiamo ancora i dati utente, mostra loading
    if (loggedIn && !user) {
        return (
            <Container className="d-flex justify-content-center align-items-center min-vh-50">
                <div className="text-center">
                    <Spinner animation="border" className="mb-3" />
                    <p className="text-muted">Caricamento dati utente...</p>
                </div>
            </Container>
        );
    }
    
    // Tutto ok, renderizza il componente protetto
    return children;
}

/**
 * AnonymousRoute - Componente per rotte accessibili solo agli utenti NON autenticati
 * 
 * Utile per pagine come login che non devono essere accessibili se già loggati
 */
function AnonymousRoute({ children, fallbackPath = '/' }) {
    const { loggedIn } = useContext(UserContext);
    
    // Se è loggato, redirect alla home (o altra pagina specificata)
    if (loggedIn) {
        return <Navigate to={fallbackPath} replace />;
    }
    
    // Se non è loggato, renderizza il componente
    return children;
}

/**
 * ConditionalRoute - Componente che renderizza diversi componenti basandosi sull'autenticazione
 * 
 * Utile per componenti che hanno comportamenti diversi per utenti loggati vs anonimi
 */
function ConditionalRoute({ 
    authenticatedComponent, 
    anonymousComponent, 
    loadingComponent = null 
}) {
    const { loggedIn, user } = useContext(UserContext);
    
    // Loading state se l'autenticazione è in corso
    if (loggedIn && !user) {
        if (loadingComponent) {
            return loadingComponent;
        }
        return (
            <Container className="d-flex justify-content-center align-items-center min-vh-50">
                <div className="text-center">
                    <Spinner animation="border" className="mb-3" />
                    <p className="text-muted">Verifica autenticazione...</p>
                </div>
            </Container>
        );
    }
    
    // Renderizza il componente appropriato basandosi sullo stato di autenticazione
    return loggedIn ? authenticatedComponent : anonymousComponent;
}

/**
 * RequireRole - Componente per proteggere rotte basandosi sui ruoli utente
 * 
 * Nota: Nel progetto "Stuff Happens" non ci sono ruoli diversi,
 * ma questo componente può essere utile per estensioni future
 */
function RequireRole({ 
    children, 
    requiredRole, 
    fallbackPath = '/', 
    unauthorizedMessage = "Non hai i permessi necessari per accedere a questa pagina." 
}) {
    const { loggedIn, user } = useContext(UserContext);
    
    // Se non è loggato, redirect al login
    if (!loggedIn) {
        return <Navigate to="/login" replace />;
    }
    
    // Se non ha il ruolo richiesto, mostra messaggio di errore
    if (user && user.role !== requiredRole) {
        return (
            <Container>
                <Alert variant="warning" className="text-center mt-5">
                    <h4>Accesso Negato</h4>
                    <p>{unauthorizedMessage}</p>
                    <a href={fallbackPath} className="btn btn-primary">
                        Torna alla Home
                    </a>
                </Alert>
            </Container>
        );
    }
    
    // Tutto ok, renderizza il componente
    return children;
}

// Esporta tutti i componenti
export default ProtectedRoute;
export { AnonymousRoute, ConditionalRoute, RequireRole };