import { useContext, useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router';
import UserContext from '../../context/UserContext.jsx';
import API from '../../API/API.mjs';

function AppNavbar() {
  const { 
    user, 
    loggedIn, 
    currentGame, 
    isInActiveGame,
    setIsInActiveGame,
    handleLogout,
    clearCurrentGame,
    setMessage 
  } = useContext(UserContext);
  
  const location = useLocation();
  const navigate = useNavigate();

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  const isActivePath = (path) => {
    return location.pathname === path;
  };

  // ✅ FUNZIONE CORRETTA: Abbandona automaticamente come il tasto "Abbandona"
  const handleNavigationWithAutoAbandon = async (path) => {
    if (isInActiveGame) {
      try {
        console.log('🗑️ Auto-abandoning game for navigation to:', path);
        
        // ✅ ABBANDONA AUTOMATICAMENTE SENZA CONFERMA (come il tasto Abbandona)
        if (currentGame) {
          await API.abandonGame(currentGame.id);
          console.log('✅ Game auto-abandoned successfully');
          
          // ✅ ATTESA PER DARE TEMPO AL SERVER
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // ✅ PULIZIA COMPLETA DELLO STATO
        setIsInActiveGame(false);
        clearCurrentGame();
        
        setMessage({ type: 'info', msg: 'Partita abbandonata automaticamente' });
        
        // ✅ NAVIGA VERSO LA DESTINAZIONE
        navigate(path);
        
      } catch (err) {
        console.error('❌ Error auto-abandoning game:', err);
        
        // ✅ PULIZIA FORZATA ANCHE IN CASO DI ERRORE API
        setIsInActiveGame(false);
        clearCurrentGame();
        
        setMessage({ 
          type: 'warning', 
          msg: 'Partita abbandonata localmente (errore API)' 
        });
        
        // ✅ NAVIGA COMUNQUE
        navigate(path);
      }
    } else {
      // ✅ NESSUNA PARTITA ATTIVA - NAVIGAZIONE NORMALE
      navigate(path);
    }
  };

  const handleLogoutClick = async () => {
    // ✅ LOGOUT: Abbandona automaticamente come gli altri link
    if (isInActiveGame) {
      try {
        if (currentGame) {
          await API.abandonGame(currentGame.id);
          console.log('✅ Game auto-abandoned before logout');
        }
        setIsInActiveGame(false);
        clearCurrentGame();
      } catch (err) {
        console.error('❌ Error abandoning game before logout:', err);
        // Continua comunque con il logout
        setIsInActiveGame(false);
        clearCurrentGame();
      }
    }
    
    await handleLogout();
    navigate('/');
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
      <Container fluid>
        {/* Brand Logo */}
        <Navbar.Brand 
          onClick={() => handleNavigationWithAutoAbandon('/')}
          style={{ cursor: 'pointer' }}
          className="fw-bold"
        >
          <i className="bi bi-lightning-charge-fill me-2"></i>
          Stuff Happens
        </Navbar.Brand>

        {/* Mobile Toggle */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Navigation Links */}
          <Nav className="me-auto">
            {/* ✅ HOME: Abbandona automaticamente */}
            <Nav.Link 
              onClick={() => handleNavigationWithAutoAbandon('/')}
              active={isActivePath('/')}
              className="d-flex align-items-center"
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-house-fill me-1"></i>
              Home
            </Nav.Link>
            
            {/* ✅ REGOLE: Abbandona automaticamente */}
            <Nav.Link 
              onClick={() => handleNavigationWithAutoAbandon('/instructions')}
              active={isActivePath('/instructions')}
              className="d-flex align-items-center"
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-book me-1"></i>
              Regole
            </Nav.Link>

            {/* Link condizionali per utenti autenticati */}
            {loggedIn && (
              <>
                {/* ✅ GIOCA: Nessuna protezione (può sempre andare al gioco) */}
                <Nav.Link 
                  as={Link} 
                  to="/game" 
                  active={isActivePath('/game')}
                  className="d-flex align-items-center position-relative"
                >
                  <i className="bi bi-controller me-1"></i>
                  Gioca
                  {currentGame && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success">
                      <i className="bi bi-play-fill"></i>
                      <span className="visually-hidden">Partita in corso</span>
                    </span>
                  )}
                </Nav.Link>
                
                {/* ✅ PROFILO: Abbandona automaticamente */}
                <Nav.Link 
                  onClick={() => handleNavigationWithAutoAbandon('/profile')}
                  active={isActivePath('/profile')}
                  className="d-flex align-items-center"
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-person-lines-fill me-1"></i>
                  Profilo
                </Nav.Link>
              </>
            )}
          </Nav>

          {/* Right Side Controls */}
          <Nav className="align-items-center">
            
            {/* Authentication Section */}
            {loggedIn ? (
              // ========== UTENTE AUTENTICATO ==========
              <NavDropdown 
                title={
                  <span>
                    <i className="bi bi-person-circle me-1"></i>
                    {user?.username}
                  </span>
                } 
                id="user-dropdown"
                align="end"
              >
                {/* ✅ PROFILO NEL DROPDOWN: Abbandona automaticamente */}
                <NavDropdown.Item 
                  onClick={() => handleNavigationWithAutoAbandon('/profile')}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-person-lines-fill me-2"></i>
                  Il Mio Profilo
                </NavDropdown.Item>
                
                {/* ✅ CONTINUA PARTITA: Nessuna protezione */}
                {currentGame && (
                  <NavDropdown.Item as={Link} to="/game">
                    <i className="bi bi-play-circle-fill me-2 text-success"></i>
                    Continua Partita
                  </NavDropdown.Item>
                )}
                
                <NavDropdown.Divider />
                
                {/* ✅ LOGOUT: Abbandona automaticamente */}
                <NavDropdown.Item onClick={handleLogoutClick}>
                  <i className="bi bi-box-arrow-right me-2 text-danger"></i>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              // ========== UTENTE ANONIMO ==========
              <div className="d-flex align-items-center gap-2">
                {/* ✅ DEMO: Nessuna protezione (demo non ha partite persistenti) */}
                <Link 
                  to="/game" 
                  className="btn btn-outline-light btn-sm"
                  title="Prova il gioco senza registrarti"
                >
                  <i className="bi bi-controller me-1"></i>
                  Demo
                </Link>
                
                {/* ✅ ACCEDI: Nessuna protezione */}
                <Link 
                  to="/login" 
                  className="btn btn-light btn-sm"
                >
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Accedi
                </Link>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;