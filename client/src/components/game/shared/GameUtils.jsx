/**
 * Utility functions condivise per i componenti di gioco
 * Funzioni helper e costanti riutilizzabili
 * Utilizza dayjs per gestione date/tempi
 */
import dayjs from 'dayjs';
import { Card as CardModel } from '../../../models/Card.mjs';

/**
 * Converte array di dati carta dal backend in array di CardModel
 * @param {Array} cardsData - Array di dati carta dal backend
 * @returns {Array} - Array di istanze CardModel
 */
export const mapCardsToModels = (cardsData) => {
  if (!cardsData || !Array.isArray(cardsData)) return [];
  
  return cardsData.map(c => 
    new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
  );
};

/**
 * Ordina le carte per bad_luck_index crescente
 * @param {Array} cards - Array di carte da ordinare
 * @returns {Array} - Array ordinato
 */
export const sortCardsByBadLuckIndex = (cards) => {
  if (!cards || !Array.isArray(cards)) return [];
  
  return [...cards].sort((a, b) => a.bad_luck_index - b.bad_luck_index);
};

/**
 * Crea un oggetto carta target senza bad_luck_index (per gameplay)
 * @param {Object} cardData - Dati della carta dal backend
 * @returns {CardModel} - Istanza CardModel senza bad_luck_index
 */
export const createTargetCard = (cardData) => {
  return new CardModel(
    cardData.id,
    cardData.name,
    cardData.image_url,
    null, // Nasconde bad_luck_index durante il gameplay
    cardData.theme
  );
};

/**
 * Rivela il bad_luck_index di una carta target dopo il guess
 * @param {CardModel} targetCard - Carta target corrente
 * @param {Object} revealedData - Dati rivelati dal backend
 * @returns {CardModel} - Carta target con bad_luck_index rivelato
 */
export const revealTargetCard = (targetCard, revealedData) => {
  return new CardModel(
    targetCard.id,
    targetCard.name,
    targetCard.image_url,
    revealedData.bad_luck_index,
    targetCard.theme
  );
};

/**
 * Determina se il layout dovrebbe essere compatto
 * @param {number} cardCount - Numero di carte correnti
 * @param {number} threshold - Soglia per layout compatto (default: 4)
 * @returns {boolean} - True se il layout dovrebbe essere compatto
 */
export const shouldUseCompactLayout = (cardCount, threshold = 4) => {
  return cardCount >= threshold;
};

/**
 * Calcola il tempo trascorso tra due timestamp dayjs
 * @param {dayjs} startTime - Timestamp di inizio (dayjs)
 * @param {dayjs} endTime - Timestamp di fine (dayjs) - opzionale, default ora
 * @returns {number} - Tempo trascorso in secondi
 */
export const calculateElapsedTime = (startTime, endTime = dayjs()) => {
  if (!startTime) return 0;
  return endTime.diff(startTime, 'second');
};

/**
 * Valida una posizione di guess
 * @param {number} position - Posizione proposta
 * @param {number} maxPosition - Posizione massima valida
 * @returns {boolean} - True se la posizione è valida
 */
export const isValidPosition = (position, maxPosition) => {
  return position >= 0 && position <= maxPosition;
};

/**
 * Crea messaggio di debug per drag & drop
 * @param {string} activeId - ID dell'elemento attivo
 * @param {string} overId - ID dell'elemento over
 * @param {number} cardsLength - Numero di carte correnti
 * @returns {Object} - Oggetto con informazioni di debug
 */
export const createDragDebugInfo = (activeId, overId, cardsLength) => {
  return {
    activeId,
    overId,
    cardsLength,
    timestamp: dayjs().toISOString(),
    isTargetDrag: String(activeId).startsWith('target-'),
    isStaticDrop: String(overId).startsWith('static-'),
    isInvisibleDrop: overId === 'invisible-before' || overId === 'invisible-after'
  };
};

/**
 * Costanti di gioco
 */
export const GAME_CONSTANTS = {
  TIMER_DURATION: 30, // secondi
  MAX_CARDS: 6,
  MAX_WRONG_GUESSES: 3,
  INITIAL_CARDS_COUNT: 3,
  COMPACT_LAYOUT_THRESHOLD: 4,
  
  // Temi disponibili
  THEMES: {
    UNIVERSITY_LIFE: 'university_life',
    TRAVEL: 'travel',
    SPORTS: 'sports',
    LOVE_LIFE: 'love_life',
    WORK_LIFE: 'work_life'
  },
  
  // Stati di gioco
  GAME_STATES: {
    LOADING: 'loading',
    PLAYING: 'playing',
    RESULT: 'result',
    GAME_OVER: 'game-over',
    ERROR: 'error',
    ABANDONED: 'abandoned',
    NO_GAME: 'no-game'
  },
  
  // Tipi di elementi drag & drop
  DND_TYPES: {
    TARGET: 'target',
    STATIC: 'static',
    INVISIBLE: 'invisible'
  }
};

/**
 * Messaggi di errore standardizzati
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Errore di connessione. Controlla la tua connessione internet.',
  GAME_NOT_FOUND: 'Partita non trovata.',
  INVALID_POSITION: 'Posizione non valida.',
  TIMEOUT_ERROR: 'Tempo scaduto.',
  GENERIC_ERROR: 'Si è verificato un errore. Riprova.',
  GAME_ALREADY_EXISTS: 'Hai già una partita in corso.',
  UNAUTHORIZED: 'Devi effettuare il login per giocare.',
  SERVER_ERROR: 'Errore del server. Riprova più tardi.'
};

/**
 * Messaggi di successo standardizzati
 */
export const SUCCESS_MESSAGES = {
  GAME_CREATED: 'Nuova partita creata!',
  CORRECT_GUESS: 'Risposta corretta!',
  GAME_WON: 'Hai vinto la partita!',
  GAME_ABANDONED: 'Partita abbandonata.',
  ROUND_COMPLETED: 'Round completato!'
};

/**
 * Funzione helper per log consistenti
 * @param {string} level - Livello del log (info, warn, error)
 * @param {string} component - Nome del componente
 * @param {string} message - Messaggio
 * @param {Object} data - Dati aggiuntivi (opzionale)
 */
export const gameLog = (level, component, message, data = null) => {
  const timestamp = dayjs().toISOString();
  const prefix = `[${timestamp}] [${component.toUpperCase()}]`;
  
  switch (level) {
    case 'info':
      console.log(`${prefix} ℹ️ ${message}`, data || '');
      break;
    case 'warn':
      console.warn(`${prefix} ⚠️ ${message}`, data || '');
      break;
    case 'error':
      console.error(`${prefix} ❌ ${message}`, data || '');
      break;
    case 'debug':
      console.log(`${prefix} 🔍 ${message}`, data || '');
      break;
    default:
      console.log(`${prefix} ${message}`, data || '');
  }
};