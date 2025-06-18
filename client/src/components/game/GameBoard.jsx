import { useContext } from 'react';
import UserContext from '../../context/UserContext.jsx';
import DemoGameBoard from './demo/DemoGameBoard.jsx';
import FullGameBoard from './complete/FullGameBoard.jsx';

/**
 * GameBoard - Main game dispatcher component
 * 
 * This component implements a Strategy Pattern to handle different game modes
 * based on user authentication status. It serves as a routing layer between
 * demo and full game functionality.
 * 
 * Architecture Benefits:
 * - Clear separation of concerns between demo and full game logic
 * - Eliminates complex conditional rendering within a single component
 * - Allows independent development and testing of game modes
 * - Prevents infinite loops by avoiding complex state dependencies
 * 
 * Design Pattern: Strategy Pattern
 * - Context: GameBoard (this component)
 * - Strategy Interface: Game rendering behavior
 * - Concrete Strategies: DemoGameBoard and FullGameBoard
 * 
 * This pattern allows the game behavior to vary based on user context
 * without coupling the selection logic to the game implementation.
 */
function GameBoard() {
    // Access user authentication state from React Context
    // Using Context here centralizes auth state management across the app
    const { loggedIn } = useContext(UserContext);
    
    // Strategy selection based on authentication status
    // Simple boolean check provides clear branching logic
    if (!loggedIn) {
        // Anonymous users get demo functionality only
        // Demo mode provides limited game experience without persistence
        return <DemoGameBoard />;
    } else {
        // Authenticated users get full game experience
        // Full mode includes game history, complete rounds, and persistence
        return <FullGameBoard />;
    }
}

export default GameBoard;