// UserContext.jsx - VERSIONE SECONDO LE SLIDE DEL PROF
import { createContext } from 'react';

/**
 * Context Definition - Slide 6
 * 
 * "const ExContext = React.createContext(defaultValue)"
 * 
 * Il prof mostra che il Context è SOLO la definizione, 
 * NON include la logica del Provider
 */
const UserContext = createContext();

export default UserContext;