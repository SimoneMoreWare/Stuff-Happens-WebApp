// App.jsx - VERSIONE SECONDO LE SLIDE DEL PROF
import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router';
import { Container, Spinner, Alert } from 'react-bootstrap';

// Context - SOLO la definizione come nelle slide
import UserContext from './context/UserContext.jsx';

// API
import API from './API/API.mjs';

// Models
import { User } from './models/User.mjs';

// Components
import Navbar from './components/layout/Navbar.jsx';
import HomePage from './components/pages/HomePage.jsx';
import LoginPage from './components/pages/LoginPage.jsx';
import GamePage from './components/pages/GamePage.jsx';
import ProfilePage from './components/pages/ProfilePage/ProfilePage.jsx';
import InstructionsPage from './components/pages/InstructionsPage.jsx';
import NotFoundPage from './components/pages/NotFoundPage.jsx';

// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  // ============================================================================
  // STATO LOCALE DEL COMPONENTE APP (seguendo slide 19)
  // ============================================================================
  
  /**
   * "Remember: the state is part of the component containing the Provider
   *  - Not in the provider itself
   *  - Not in the context object"
   * 
   * Seguendo le slide del prof, lo STATO va nel componente che contiene il Provider,
   * NON nel Context stesso
   */
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // ============================================================================
  // CONTROLLO AUTENTICAZIONE ALL'AVVIO
  // ============================================================================
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userInfo = await API.getUserInfo();
        setUser(new User(userInfo.id, userInfo.username, userInfo.email));
        setLoggedIn(true);
        console.log('✅ User authenticated');
        
      } catch (authError) {
        console.log('ℹ️ User not authenticated');
        setUser(null);
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []); // Array vuoto - esegue solo una volta

  // ============================================================================
  // GESTIONE AUTENTICAZIONE
  // ============================================================================
  
  const handleLogin = async (credentials) => {
    try {
      const userInfo = await API.logIn(credentials);
      const newUser = new User(userInfo.id, userInfo.username, userInfo.email);
      
      setUser(newUser);
      setLoggedIn(true);
      setMessage({ type: 'success', msg: `Benvenuto, ${newUser.username}!` });
      
    } catch (error) {
      throw error; // Rilancia per gestire nel form
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
  // FUNZIONI DI UTILITÀ PER COMPATIBILITÀ
  // ============================================================================
  
  const updateCurrentGame = (gameData) => {
    console.log('🎮 Game update (managed locally by game components):', gameData);
  };

  const clearCurrentGame = () => {
    console.log('🧹 Game state cleared');
  };

  // ============================================================================
  // CONTEXT VALUE - Slide 11 e 19
  // ============================================================================
  
  /**
   * Seguendo la slide 19: "Changing Context Values"
   * 
   * "As part of the context value"
   * "Example: { language: 'English', toggleLanguage : toggleLanguage }"
   * 
   * Il prof mostra che si passa sia i VALORI che le FUNZIONI nel context value
   */
  const contextValue = {
    // Stati
    user,
    loggedIn,
    currentGame: null,        
    isInActiveGame: false,    
    message,
    
    // Funzioni - come mostrato nell'esempio del prof
    handleLogin,
    handleLogout,
    updateCurrentGame,
    clearCurrentGame,
    setMessage,
    setIsInActiveGame: () => {} // No-op per compatibilità
  };

  // ============================================================================
  // LOADING SCREEN
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
  // RENDER CON PROVIDER - Slide 11
  // ============================================================================
  
  /**
   * Seguendo la slide 11: "Context Provider"
   * 
   * "<ExContext.Provider value=...> component
   *  Injects the context value into all nested components"
   * 
   * Il prof mostra che il Provider va wrappato attorno ai componenti
   * che devono accedere al context
   */
  return (
    <UserContext.Provider value={contextValue}>
      <div className="App">
        <Navbar />
        
        <Container fluid className="mt-3">
          {/* Messaggi globali */}
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
          
          {/* Routing principale */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/instructions" element={<InstructionsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </div>
    </UserContext.Provider>
  );
}

export default App;