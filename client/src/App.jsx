import { useEffect, useState, useContext } from 'react'; // ✅ AGGIUNGI useContext
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
  const [currentGame, setCurrentGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // ✅ AGGIUNGI: Flag per protezione abbandono partita
  const [isInActiveGame, setIsInActiveGame] = useState(false);

  // ============================================================================
  // ✅ AGGIUNGI: PROTEZIONE BROWSER REFRESH/CLOSE
  // ============================================================================
  
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isInActiveGame) {
        e.preventDefault();
        e.returnValue = 'Hai una partita in corso. Sicuro di voler abbandonare?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isInActiveGame]);

  // ============================================================================
  // AUTENTICAZIONE - Controllo sessione esistente all'avvio
  // ============================================================================
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userInfo = await API.getUserInfo();
        setUser(new User(userInfo.id, userInfo.username, userInfo.email));
        setLoggedIn(true);
        
        // Se l'utente è loggato, controlla se ha una partita in corso
        try {
          const gameData = await API.getCurrentGame();
          setCurrentGame(gameData);
          
          // ✅ AGGIUNGI: Se ha una partita in corso, attiva la protezione
          if (gameData?.game?.status === 'playing') {
            setIsInActiveGame(true);
          }
          
        } catch (gameError) {
          // Nessuna partita in corso - normale per utenti senza giochi attivi
          setCurrentGame(null);
          setIsInActiveGame(false); // ✅ AGGIUNGI
        }
        
      } catch (error) {
        // Utente non autenticato - normale per accesso anonimo
        // NON fare nulla per evitare loop infiniti
        setUser(null);
        setLoggedIn(false);
        setCurrentGame(null);
        setIsInActiveGame(false); // ✅ AGGIUNGI
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
   * Chiamata dalle pagine di login con le credenziali inserite dall'utente
   * Nota: il redirect viene gestito nel componente che chiama questa funzione
   */
  const handleLogin = async (credentials) => {
    try {
      const userInfo = await API.logIn(credentials);
      
      const newUser = new User(userInfo.id, userInfo.username, userInfo.email);
      
      setUser(newUser);
      setLoggedIn(true);
      
      // Controlla se l'utente ha una partita in corso
      // IMPORTANTE: non far fallire il login se non ci sono partite!
      try {
        const gameData = await API.getCurrentGame();
        setCurrentGame(gameData);
        
        // ✅ AGGIUNGI: Se ha una partita in corso, attiva la protezione
        if (gameData?.game?.status === 'playing') {
          setIsInActiveGame(true);
        }
        
      } catch (gameError) {
        setCurrentGame(null);
        setIsInActiveGame(false); // ✅ AGGIUNGI
        // NON rilanciare l'errore - è normale non avere partite!
      }
      
      setMessage({ type: 'success', msg: `Benvenuto, ${newUser.username}!` });
      // Il redirect viene gestito dal componente LoginPage
      
    } catch (error) {
      throw error; // Rilancia l'errore per gestirlo nel form di login
    }
  };

  /**
   * Gestisce il processo di logout
   * Può essere chiamato da qualsiasi componente che ha accesso al context
   * Nota: il redirect viene gestito nel componente che chiama questa funzione
   */
  const handleLogout = async () => {
    try {
      await API.logOut();
      
      // Reset stato globale
      setUser(null);
      setLoggedIn(false);
      setCurrentGame(null);
      setIsInActiveGame(false); // ✅ AGGIUNGI
      
      setMessage({ type: 'info', msg: 'Logout effettuato con successo' });
      // Il redirect viene gestito dal componente che chiama logout
      
    } catch (error) {
      setMessage({ type: 'warning', msg: 'Errore durante il logout, ma sei stato disconnesso' });
      
      // Anche in caso di errore, disconnetti l'utente localmente
      setUser(null);
      setLoggedIn(false);
      setCurrentGame(null);
      setIsInActiveGame(false); // ✅ AGGIUNGI
      // Il redirect viene gestito dal componente che chiama logout
    }
  };

  // ============================================================================
  // GESTIONE STATO PARTITA CORRENTE
  // ============================================================================
  
  /**
   * Aggiorna lo stato della partita corrente
   * Utile quando si inizia una nuova partita o si completa quella esistente
   */
  const updateCurrentGame = (gameData) => {
    setCurrentGame(gameData);
    
    // ✅ AGGIUNGI: Aggiorna automaticamente la flag di protezione
    if (gameData && gameData.status === 'playing') {
      setIsInActiveGame(true);
    } else {
      setIsInActiveGame(false);
    }
  };

  /**
   * Rimuove la partita corrente (quando completata o abbandonata)
   */
  const clearCurrentGame = () => {
    setCurrentGame(null);
    setIsInActiveGame(false); // ✅ AGGIUNGI
  };

  // ============================================================================
  // VALORE DEL CONTEXT
  // ============================================================================
  
  const contextValue = {
    user,
    loggedIn,
    currentGame,
    isInActiveGame,        // ✅ AGGIUNGI
    setIsInActiveGame,     // ✅ AGGIUNGI
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