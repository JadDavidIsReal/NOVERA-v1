/**
 * Auni - Phase 1B: Interactive State Logic
 * This script handles the mock state transitions for the Auni orb interface.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection ---
    const orb = document.querySelector('.orb');
    const subtitle = document.querySelector('.subtitle');

    if (!orb || !subtitle) {
        console.error('Essential elements .orb or .subtitle not found!');
        return;
    }

    // --- State Management ---
    const STATES = {
        IDLE: { name: 'idle', text: '' },
        LISTENING: { name: 'listening', text: 'Listening...' },
        THINKING: { name: 'thinking', text: 'Processing...' },
        SPEAKING: { name: 'speaking', text: 'Speaking...' },
        LOADING: { name: 'loading', text: 'Loading...' }
    };

    let currentState = STATES.IDLE;
    let isKeyHeld = false; // Flag to prevent keydown repeat triggers
    let idleTimeout;

    /**
     * Sets the orb's state, updating CSS classes and subtitle text.
     * @param {object} newState - The new state object from the STATES constant.
     */
    function setOrbState(newState) {
        // Clear any pending timeout to return to idle
        clearTimeout(idleTimeout);

        // Remove all possible state classes
        for (const key in STATES) {
            if (STATES[key].name !== 'idle') {
                orb.classList.remove(`orb--${STATES[key].name}`);
            }
        }
        subtitle.classList.remove('visible');

        // Apply new state class if not idle
        if (newState.name !== 'idle') {
            orb.classList.add(`orb--${newState.name}`);
            subtitle.textContent = newState.text;
            // Use a timeout to allow the subtitle text to be set before adding the visible class
            setTimeout(() => subtitle.classList.add('visible'), 10);
        }

        currentState = newState;
        console.log(`Auni state set to: ${currentState.name}`);

        // Set a timeout to return to idle for non-continuous states
        if (newState !== STATES.IDLE && newState !== STATES.LISTENING) {
            idleTimeout = setTimeout(() => setOrbState(STATES.IDLE), 3000);
        }
    }

    // --- Event Binding ---

    // 1. Spacebar (Press and Hold for Listening)
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isKeyHeld) {
            e.preventDefault();
            isKeyHeld = true;
            setOrbState(STATES.LISTENING);
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            isKeyHeld = false;
            setOrbState(STATES.IDLE);
        }
    });

    // 2. Single Key Presses (T, S, L)
    window.addEventListener('keydown', (e) => {
        if (isKeyHeld) return; // Ignore if space is already held

        switch (e.key.toLowerCase()) {
            case 't':
                setOrbState(STATES.THINKING);
                break;
            case 's':
                setOrbState(STATES.SPEAKING);
                break;
            case 'l':
                setOrbState(STATES.LOADING);
                break;
        }
    });

    // 3. Click on Orb (Toggle Listening)
    orb.addEventListener('click', () => {
        if (currentState === STATES.LISTENING) {
            setOrbState(STATES.IDLE);
        } else {
            setOrbState(STATES.LISTENING);
        }
    });

    // --- Initialization ---
    console.log("Auni Interactive State Logic Initialized.");
    console.log("Hold [Space] or Click Orb to Listen. Press T (Think), S (Speak), L (Load).");
});
