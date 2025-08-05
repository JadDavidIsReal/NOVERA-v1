/**
 * Auni - AI Assistant UI
 * js/orb.js
 * --------------------------------
 * This module manages the orb's state machine. It defines the possible states,
 * handles transitions, and orchestrates updates to animations and subtitles.
 */

import { setOrbAnimation } from './animation.js';

// Define the possible states for the orb. Using an object for an enum-like structure.
export const ORB_STATES = {
    IDLE: 'idle',
    LISTENING: 'listening',
    THINKING: 'thinking',
    SPEAKING: 'speaking',
    LOADING: 'loading',
};

// Map states to the text that should be displayed in the subtitle container.
const SUBTITLE_TEXT = {
    [ORB_STATES.IDLE]: '',
    [ORB_STATES.LISTENING]: 'Listening...',
    [ORB_STATES.THINKING]: 'Processing...',
    [ORB_STATES.SPEAKING]: 'Speaking...',
    [ORB_STATES.LOADING]: '', // Loading is a visual state on the orb itself
};

let currentState = ORB_STATES.IDLE;

/**
 * Transitions the orb to a new state.
 * @param {string} newState - The target state from ORB_STATES.
 * @param {HTMLElement} orbElement - The orb's DOM element.
 * @param {HTMLElement} subtitleElement - The subtitle container's DOM element.
 */
export function transitionToState(newState, orbElement, subtitleElement) {
    if (!Object.values(ORB_STATES).includes(newState)) {
        console.warn(`Attempted to transition to an invalid state: ${newState}`);
        return;
    }

    if (currentState === newState) {
        return; // No change needed
    }

    console.log(`Transitioning from ${currentState} to ${newState}`);
    currentState = newState;

    // Update the animation via the animation module
    setOrbAnimation(orbElement, currentState);

    // Update the subtitle text
    if (subtitleElement) {
        subtitleElement.textContent = SUBTITLE_TEXT[currentState] || '';
    }
}

/**
 * Returns the current state of the orb.
 * @returns {string} The current state.
 */
export function getCurrentState() {
    return currentState;
}
