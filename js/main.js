/**
 * Auni - AI Assistant UI
 * js/main.js
 * --------------------------------
 * This is the main entry point for the application's JavaScript.
 * It handles DOM initialization, selects key elements, and wires up
 * all the event listeners for user interaction.
 */

import { transitionToState, ORB_STATES, getCurrentState } from './orb.js';

// Wait for the DOM to be fully loaded before running the script.
document.addEventListener('DOMContentLoaded', () => {
    const orbElement = document.getElementById('auni-orb');
    const subtitleElement = document.getElementById('subtitle-container');

    if (!orbElement || !subtitleElement) {
        console.error("Fatal: Could not find essential UI elements (orb or subtitle container).");
        return;
    }

    // Set the initial state when the application loads.
    transitionToState(ORB_STATES.IDLE, orbElement, subtitleElement);

    // --- Event Listeners ---

    // 1. Orb Click -> Listening
    orbElement.addEventListener('click', () => {
        transitionToState(ORB_STATES.LISTENING, orbElement, subtitleElement);
    });

    // 2. Spacebar Press -> Listening
    // 3. Key Press -> Other states (T, S, L)
    window.addEventListener('keydown', (e) => {
        // Prevent repeated 'listening' state transitions if space is held down.
        if (e.code === 'Space' && getCurrentState() !== ORB_STATES.LISTENING) {
            e.preventDefault(); // Prevents scrolling
            transitionToState(ORB_STATES.LISTENING, orbElement, subtitleElement);
        } else if (e.key.toLowerCase() === 't') {
            transitionToState(ORB_STATES.THINKING, orbElement, subtitleElement);
        } else if (e.key.toLowerCase() === 's') {
            transitionToState(ORB_STATES.SPEAKING, orbElement, subtitleElement);
        } else if (e.key.toLowerCase() === 'l') {
            transitionToState(ORB_STATES.LOADING, orbElement, subtitleElement);
        }
    });

    // 4. Spacebar Release -> Idle
    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            transitionToState(ORB_STATES.IDLE, orbElement, subtitleElement);
        }
    });

    console.log("Auni UI Initialized.");
});
