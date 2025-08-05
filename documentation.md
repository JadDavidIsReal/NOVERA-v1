# Auni Visual System Documentation

## 1. Overview

This document details the visual system of Auni's interface. The project establishes the core visual identity of Auni through layered animations, a minimalist layout, and state-based interactivity. The focus is on creating a premium, "alive" aesthetic that responds to user input.

## 2. File Breakdown

-   `index.html`: Contains the structural markup for the interface. It defines the layout containers and the nested `div`s for the central orb.
-   `css/style.css`: The heart of the visual presentation. This file includes all styling, responsive design, CSS keyframe animations, and state-specific visual rules.
-   `js/main.js`: Handles interactivity and state management. It listens for keyboard input and modifies the CSS classes on the orb element to change its visual state.
-   `README.md`: General project information, features, and instructions.
-   `documentation.md`: This file.

## 3. Interactivity & State Management

Auni's visual state is controlled by a simple state machine in `js/main.js`.

### States
-   **IDLE**: The default, resting state. The orb has a slow, gentle "breathing" animation.
-   **LISTENING**: Activated by the user. The orb's animations become more active and attentive.
-   **THINKING**: Represents processing. The orb's core appears to be working, and colors shift more rapidly.

### Keyboard Controls
-   `L` key: Switches to the **LISTENING** state.
-   `T` key: Switches to the **THINKING** state.
-   `I` key or `Escape` key: Returns to the **IDLE** state.

### JS to CSS Bridge
The JavaScript `setState` function removes all state-specific classes from the `.orb` element and adds the one corresponding to the new state (e.g., `.orb--listening`). CSS then uses these classes to apply the correct animations.

## 4. Orb Architecture

The orb is a composite of HTML elements and CSS pseudo-elements, with animations that change based on its current state.

### Base Animations (Idle State)
-   **.orb**: `idleBreathing` (scale pulse) and `hueRotate` (slow color shift).
-   **.orb::before**: `innerGlowPulse` (deep, slow inner pulse).
-   **.halo-ripple**: `haloRipple` (a single, slow radiating ring).
-   **.core-waveform div**: `waveform` (gentle, staggered bar animation).

### State-Specific Animations
-   **.orb.orb--listening**: The waveform bars become more active (`waveform-listening`), and the halo ripple becomes faster and more frequent.
-   **.orb.orb--thinking**: The `hueRotate` animation accelerates. The `::before` pseudo-element gains a `thinking-rotation` animation to signify processing, and the waveform bars become calmer and less prominent.

## 5. Next Phase Placeholder

Future development can expand on this foundation:
-   **Voice Event Binding**: Integrating a voice recognition library to trigger state changes automatically.
-   **Complex State Transitions**: Creating more nuanced states (e.g., `SPEAKING`, `CONFUSED`, `SUCCESS`) with unique visual representations.
-   **API Integration**: Connecting Auni's state to external data or APIs, allowing the orb to react to real-world events.
