# Auni Visual System Documentation (Redesign)

## 1. Overview

This document details the visual system of Auni's interface, following a major redesign. The new design philosophy shifts away from a clean, colorful aesthetic to one that is more **abstract, subtle, and enigmatic**. The goal is to portray Auni not as a simple digital assistant, but as a mysterious and complex foreign intelligence.

## 2. File Breakdown

-   `index.html`: Contains the structural markup. The orb's structure was updated to use a `.particle-system` containing 15 `<span>` elements and two `.halo-ripple` elements to facilitate a more complex visual.
-   `css/style.css`: Completely overhauled to implement the new design. It features a desaturated color palette and new animations focused on chaotic, asymmetrical, and organic movement.
-   `js/main.js`: Handles interactivity and state management (functionally unchanged from the previous version).
-   `README.md`: General project information.
-   `documentation.md`: This file.

## 3. Interactivity & State Management

The state machine and keyboard controls remain the same:
-   **States**: `IDLE`, `LISTENING`, `THINKING`.
-   **Keyboard Controls**: `L` (Listen), `T` (Think), `I`/`Escape` (Idle).

## 4. Orb Architecture (Redesign)

The orb's appearance is now fundamentally more complex and abstract.

### Core Design Philosophy
-   **Color Palette**: The vibrant gradient has been replaced with a desaturated, monochromatic palette using faint, electric blues and shades of white (`--primary-glow: rgba(190, 225, 255, 0.7)`). This creates a more subtle and mysterious feel.
-   **Abstract Core**: The orderly waveform is gone. In its place, a `.particle-system` of 15 `<span>` elements is used. These are styled and animated with staggered delays to create a chaotic, swirling nebula of particles within the orb.
-   **Asymmetrical Ripples**: Two `.halo-ripple` elements with offset and differing animations create unpredictable, overlapping waves, breaking the perfect symmetry of the previous design.
-   **Organic Animation**: The base `organic-breathing` keyframe uses a combination of `scale` and `rotate` to make the orb feel like it's subtly warping and less like a perfect, machine-like sphere.

### State-Specific Visuals
-   **IDLE**: The orb engages in the slow `organic-breathing` and the core particles drift gently and fade in and out.
-   **LISTENING**: The orb's glow pulses more intently (`pulse-glow` animation). The core particle system rotates more slowly and deliberately, and the particles themselves drift faster as if focusing.
-   **THINKING**: The orb's breathing and glowing become much faster. The core particle system rotates rapidly, and the particles engage in a `swarm-thinking` animation, where they chaotically converge on the center before dispersing, creating a powerful "processing" effect.

## 5. Next Phase Placeholder

Future development can expand on this foundation:
-   **Voice Event Binding**: Integrating a voice recognition library to trigger state changes automatically.
-   **Complex State Transitions**: Creating more nuanced states (e.g., `SPEAKING`, `CONFUSED`, `SUCCESS`) with unique visual representations.
-   **API Integration**: Connecting Auni's state to external data or APIs, allowing the orb to react to real-world events.
