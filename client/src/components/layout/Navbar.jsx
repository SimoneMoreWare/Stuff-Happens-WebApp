import { useContext, useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router';

import UserContext from '../../context/UserContext.jsx';

function AppNavbar() {
  const { user, loggedIn, currentGame, handleLogout } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  // ============================================================================
  // DARK MODE STATE
  // ============================================================================
  
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Gestione dark mode tramite Bootstrap data-bs-theme
    if (darkMode) {
      document.documentElement.setAttribute("data-bs-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-bs-theme");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(oldMode => !oldMode);
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const handleLogoutClick = async () => {
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
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <i className="bi bi-lightning-charge-fill me-2"></i>
          Stuff Happens
        </Navbar.Brand>

        {/* Mobile Toggle */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Navigation Links */}
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              active={isActivePath('/')}
              className="d-flex align-items-center"
            >
              <i className="bi bi-house-fill me-1"></i>
              Home
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/instructions" 
              active={isActivePath('/instructions')}
              className="d-flex align-items-center"
            >
              <i className="bi bi-book me-1"></i>
              Regole
            </Nav.Link>

            {/* Link condizionali per utenti autenticati */}
            {loggedIn && (
              <>
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
                
                <Nav.Link 
                  as={Link} 
                  to="/profile" 
                  active={isActivePath('/profile')}
                  className="d-flex align-items-center"
                >
                  <i className="bi bi-person-lines-fill me-1"></i>
                  Profilo
                </Nav.Link>
              </>
            )}
          </Nav>

          {/* Right Side Controls */}
          <Nav className="align-items-center">
            {/* Dark Mode Toggle */}
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={toggleDarkMode}
              className="me-3"
              title={darkMode ? "Modalità chiara" : "Modalità scura"}
            >
              {darkMode ? (
                <i className="bi bi-sun-fill"></i>
              ) : (
                <i className="bi bi-moon-fill"></i>
              )}
            </Button>

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
                <NavDropdown.Item as={Link} to="/profile">
                  <i className="bi bi-person-lines-fill me-2"></i>
                  Il Mio Profilo
                </NavDropdown.Item>
                
                {currentGame && (
                  <NavDropdown.Item as={Link} to="/game">
                    <i className="bi bi-play-circle-fill me-2 text-success"></i>
                    Continua Partita
                  </NavDropdown.Item>
                )}
                
                <NavDropdown.Divider />
                
                <NavDropdown.Item onClick={handleLogoutClick}>
                  <i className="bi bi-box-arrow-right me-2 text-danger"></i>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              // ========== UTENTE ANONIMO ==========
              <div className="d-flex align-items-center gap-2">
                <Link 
                  to="/game" 
                  className="btn btn-outline-light btn-sm"
                  title="Prova il gioco senza registrarti"
                >
                  <i className="bi bi-controller me-1"></i>
                  Demo
                </Link>
                
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