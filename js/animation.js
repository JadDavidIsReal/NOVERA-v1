/**
 * Auni - AI Assistant UI
 * js/animation.js
 * --------------------------------
 * This module is responsible for managing the CSS classes that drive the orb's animations.
 * It abstracts the direct DOM manipulation of classes away from the state logic.
 */

// A list of all possible animation state classes.
const ANIMATION_CLASSES = ['listening', 'thinking', 'speaking', 'loading', 'idle'];

/**
 * Sets the animation state of the orb by managing its CSS classes.
 * It ensures only one state class is active at a time.
 * @param {HTMLElement} orbElement - The orb's DOM element.
 * @param {string} state - The new state to apply (e.g., 'listening').
 */
export function setOrbAnimation(orbElement, state) {
    if (!orbElement) {
        console.error("Animation Engine: Orb element not provided.");
        return;
    }

    // Remove all other animation classes to ensure a clean slate.
    ANIMATION_CLASSES.forEach(className => {
        if (orbElement.classList.contains(className)) {
            orbElement.classList.remove(className);
        }
    });

    // Add the new state class, but 'idle' is the default and has no specific class.
    if (state !== 'idle') {
        orbElement.classList.add(state);
    }
}
