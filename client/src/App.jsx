// App.jsx - Main application component with authentication and routing
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { Container, Spinner, Alert } from 'react-bootstrap';

// Context for user state management
import UserContext from './context/UserContext.jsx';

// API module for server communication
import API from './API/API.mjs';

// Data models
import { User } from './models/User.mjs';

// Components
import Navbar from './components/layout/Navbar.jsx';
import HomePage from './components/pages/HomePage.jsx';
import LoginPage from './components/pages/login/LoginPage.jsx';
import GamePage from './components/pages/GamePage.jsx';
import ProfilePage from './components/pages/ProfilePage/ProfilePage.jsx';
import InstructionsPage from './components/pages/InstructionsPage.jsx';
import NotFoundPage from './components/pages/NotFoundPage.jsx';

// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  // ============================================================================
  // APPLICATION STATE
  // ============================================================================
  
  // User authentication state
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Global message state for user feedback
  const [message, setMessage] = useState('');

  // ============================================================================
  // AUTHENTICATION CHECK ON APP STARTUP
  // ============================================================================
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userInfo = await API.getUserInfo();
        setUser(new User(userInfo.id, userInfo.username, userInfo.email));
        setLoggedIn(true);
        
      } catch (authError) {
        // User not authenticated - this is normal behavior
        setUser(null);
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // ============================================================================
  // AUTHENTICATION HANDLERS
  // ============================================================================
  
  const handleLogin = async (credentials) => {
    try {
      const userInfo = await API.logIn(credentials);
      const newUser = new User(userInfo.id, userInfo.username, userInfo.email);
      
      setUser(newUser);
      setLoggedIn(true);
      setMessage({ type: 'success', msg: `Benvenuto, ${newUser.username}!` });
      
    } catch (error) {
      throw error; // Re-throw to be handled by login form
    }
  };

  const handleLogout = async () => {
    try {
      await API.logOut();
      
      setUser(null);
      setLoggedIn(false);
      setMessage({ type: 'info', msg: 'Logout effettuato con successo' });
      
    } catch (error) {
      setMessage({ type: 'warning', msg: 'Errore durante il logout, ma sei stato disconnesso' });
      setUser(null);
      setLoggedIn(false);
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS FOR COMPATIBILITY
  // ============================================================================
  
  const updateCurrentGame = (gameData) => {
    // Game state is managed locally by game components
    // This function maintains API compatibility
  };

  const clearCurrentGame = () => {
    // Game state cleanup - handled by game components
  };

  // ============================================================================
  // CONTEXT VALUE PREPARATION
  // ============================================================================
  
  const contextValue = {
    // Authentication state
    user,
    loggedIn,
    
    // Game state (managed by game components)
    currentGame: null,        
    isInActiveGame: false,    
    
    // UI state
    message,
    
    // Authentication functions
    handleLogin,
    handleLogout,
    
    // Game functions
    updateCurrentGame,
    clearCurrentGame,
    
    // UI functions
    setMessage,
    setIsInActiveGame: () => {} // No-op for compatibility
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Caricamento...</span>
          </Spinner>
          <p className="text-muted">Caricamento applicazione...</p>
        </div>
      </Container>
    );
  }

  // ============================================================================
  // MAIN RENDER WITH CONTEXT PROVIDER AND PROTECTED ROUTES
  // ============================================================================
  
  return (
    <UserContext.Provider value={contextValue}>
      <div className="App">
        <Navbar />
        
        <Container fluid className="mt-3">
          {/* Global message display */}
          {message && (
            <Alert 
              variant={message.type} 
              onClose={() => setMessage('')} 
              dismissible
              className="mb-3"
            >
              {message.msg}
            </Alert>
          )}
          
          {/* Application routing with route protection */}
          <Routes>
            {/* Public routes - accessible to all users */}
            <Route path="/" element={<HomePage />} />
            <Route path="/instructions" element={<InstructionsPage />} />
            
            {/* Game route - accessible to all but with different behavior */}
            <Route path="/game" element={<GamePage />} />
            
            {/* Login route - only for non-authenticated users */}
            <Route 
              path="/login" 
              element={loggedIn ? <Navigate replace to='/' /> : <LoginPage />} 
            />
            
            {/* Protected routes - only for authenticated users */}
            <Route 
              path="/profile" 
              element={loggedIn ? <ProfilePage /> : <Navigate replace to='/login' />} 
            />
            
            {/* 404 fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </div>
    </UserContext.Provider>
  );
}

export default App;