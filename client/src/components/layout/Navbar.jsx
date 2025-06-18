// Navbar.jsx - Application navigation bar with user authentication
import { useContext } from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
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
  
  // Check if current path is active for navigation highlighting
  const isActivePath = (path) => {
    return location.pathname === path;
  };
  
  // Handle navigation with automatic game abandonment for active games
  const handleNavigationWithAutoAbandon = async (path) => {
    if (isInActiveGame) {
      try {
        if (currentGame) {
          await API.abandonGame(currentGame.id);
        }
        
        setIsInActiveGame(false);
        clearCurrentGame();
        setMessage({ type: 'info', msg: 'Partita abbandonata automaticamente' });
        
        navigate(path);
        
      } catch (err) {
        setIsInActiveGame(false);
        clearCurrentGame();
        setMessage({ type: 'warning', msg: 'Partita abbandonata localmente (errore API)' });
        
        navigate(path);
      }
    } else {
      navigate(path);
    }
  };
  
  // Handle logout with game cleanup
  const handleLogoutClick = async () => {
    if (isInActiveGame) {
      try {
        if (currentGame) {
          await API.abandonGame(currentGame.id);
        }
        setIsInActiveGame(false);
        clearCurrentGame();
      } catch (err) {
        setIsInActiveGame(false);
        clearCurrentGame();
      }
    }
    
    await handleLogout();
    navigate('/');
  };
  
  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
      <Container fluid>
        {/* Brand logo and title */}
        <Navbar.Brand 
          onClick={() => handleNavigationWithAutoAbandon('/')}
          style={{ cursor: 'pointer' }}
          className="fw-bold"
        >
          <i className="bi bi-lightning-charge-fill me-2"></i>
          Stuff Happens
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Main navigation links */}
          <Nav className="me-auto">
            <Nav.Link 
              onClick={() => handleNavigationWithAutoAbandon('/')}
              active={isActivePath('/')}
              className="d-flex align-items-center"
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-house-fill me-1"></i>
              Home
            </Nav.Link>
            
            <Nav.Link 
              onClick={() => handleNavigationWithAutoAbandon('/instructions')}
              active={isActivePath('/instructions')}
              className="d-flex align-items-center"
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-book me-1"></i>
              Regole
            </Nav.Link>
            
            {/* Authenticated user navigation */}
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
          
          {/* User authentication section */}
          <Nav className="align-items-center">
            {loggedIn ? (
              // Authenticated user dropdown
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
                <NavDropdown.Item 
                  onClick={() => handleNavigationWithAutoAbandon('/profile')}
                  style={{ cursor: 'pointer' }}
                >
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
              // Anonymous user buttons
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