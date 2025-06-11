import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router';
import { Container, Spinner, Alert } from 'react-bootstrap';
// Context
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
  // STATO GLOBALE APPLICAZIONE
  // ============================================================================
  
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // ============================================================================
  // ✅ RIMOSSO: currentGame, isInActiveGame, protezione beforeunload
  // ============================================================================
  
  // Non serve più gestire partite in corso perché vengono sempre abbandonate

  // ============================================================================
  // AUTENTICAZIONE - Controllo sessione esistente all'avvio
  // ============================================================================
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // PRIMO: Controlla se l'utente è autenticato
        const userInfo = await API.getUserInfo();
        setUser(new User(userInfo.id, userInfo.username, userInfo.email));
        setLoggedIn(true);
        
        // ✅ COMPLETAMENTE RIMOSSO: Non controllo più partite esistenti all'avvio
        // Le partite verranno gestite solo quando l'utente clicca "Nuova Partita"
        console.log('✅ User authenticated, but skipping game check at startup');
        
      } catch (authError) {
        // Utente NON autenticato - comportamento normale
        console.log('ℹ️ User not authenticated');
        setUser(null);
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []); // IMPORTANTE: array vuoto per eseguire solo una volta

  // ============================================================================
  // GESTIONE AUTENTICAZIONE
  // ============================================================================
  
  /**
   * Gestisce il processo di login
   * ✅ NUOVO: Abbandona automaticamente partite esistenti dopo login
   */
  const handleLogin = async (credentials) => {
    try {
      const userInfo = await API.logIn(credentials);
      
      const newUser = new User(userInfo.id, userInfo.username, userInfo.email);
      
      setUser(newUser);
      setLoggedIn(true);
      
      // ✅ COMPLETAMENTE RIMOSSO: Non controllo partite dopo login
      // Le partite verranno gestite solo nel GamePage quando necessario
      console.log('✅ Login successful, skipping game check');
      
      setMessage({ type: 'success', msg: `Benvenuto, ${newUser.username}!` });
      
    } catch (error) {
      throw error; // Rilancia l'errore per gestirlo nel form di login
    }
  };

  /**
   * Gestisce il processo di logout
   */
  const handleLogout = async () => {
    try {
      await API.logOut();
      
      // Reset stato globale
      setUser(null);
      setLoggedIn(false);
      
      setMessage({ type: 'info', msg: 'Logout effettuato con successo' });
      
    } catch (error) {
      setMessage({ type: 'warning', msg: 'Errore durante il logout, ma sei stato disconnesso' });
      
      // Anche in caso di errore, disconnetti l'utente localmente
      setUser(null);
      setLoggedIn(false);
    }
  };

  // ============================================================================
  // ✅ GESTIONE STATO PARTITA SEMPLIFICATA
  // ============================================================================
  
  // Manteniamo queste funzioni per compatibilità con i componenti esistenti,
  // ma ora gestiscono solo messaggi e non stato di partite in corso
  
  const updateCurrentGame = (gameData) => {
    // Non salviamo più lo stato della partita corrente
    // I componenti di gioco gestiranno il loro stato localmente
    console.log('🎮 Game update (no longer stored globally):', gameData);
  };

  const clearCurrentGame = () => {
    // Non c'è più stato da pulire
    console.log('🧹 Game state cleared (was already empty)');
  };

  // ============================================================================
  // VALORE DEL CONTEXT SEMPLIFICATO
  // ============================================================================
  
  const contextValue = {
    user,
    loggedIn,
    currentGame: null,        // ✅ SEMPRE null - no partite in corso memorizzate
    isInActiveGame: false,    // ✅ SEMPRE false - no protezione browser
    setIsInActiveGame: () => {}, // ✅ No-op function per compatibilità
    handleLogin,
    handleLogout,
    updateCurrentGame,
    clearCurrentGame,
    setMessage
  };

  // ============================================================================
  // LOADING INIZIALE
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
  // RENDER PRINCIPALE
  // ============================================================================
  
  return (
    <UserContext.Provider value={contextValue}>
      <div className="App">
        <Navbar />
        
        <Container fluid className="mt-3">
          {/* Messaggi globali dell'applicazione */}
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