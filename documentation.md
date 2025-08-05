# Auni Visual System Documentation (Phase 1B: Executive Flame)

## 1. Overview

This document details the final, interactive visual system for the Auni interface. The design philosophy is to portray Auni as a **sophisticated, professional, and executive tool**. The visual representation is a **strictly centered, 2D, faux-3D orb** that radiates a sense of controlled power. This version (Phase 1B) adds a full suite of interactive, mock-functional states on top of the visual foundation.

## 2. File Breakdown

-   `index.html`: A minimal structure containing the orb, placeholders for its effects (core, loading ring, heat haze), and a new container for the subtitle text.
-   `css/style.css`: This file builds the complete visual experience. It uses a dark, desaturated navy/charcoal and crisp white/silver color palette. It renders the glossy orb, the sonar-like ripples, the subtle "heat haze," and all state-specific animations.
-   `js/main.js`: Handles all interactivity and state management. It listens for keyboard and mouse input to apply state classes (e.g., `.orb--listening`) to the orb and update the subtitle, triggering the corresponding CSS animations.
-   `README.md`: General project information and instructions.
-   `documentation.md`: This file.

## 3. Orb Architecture & Interactivity

The orb is designed to feel like a powerful, high-end piece of hardware that responds to user commands.

### `setOrbState(state)` function
The core of the interactivity is a single function in `js/main.js` that takes a state object as input. It is responsible for:
1.  Removing all previous state classes from the orb element.
2.  Adding the new state class (e.g., `.orb--listening`).
3.  Updating the subtitle text based on the new state.
4.  Making the subtitle visible.
5.  Setting a timeout to return to the `idle` state automatically for non-continuous actions.

### State-Specific Behaviors & Controls

-   **IDLE** (Default State)
    -   **Visuals**: The orb "breathes" with a slow, gentle pulse. Sharp sonar ripples pulse outwards calmly, and a subtle "heat haze" shimmers around the orb. The subtitle is hidden.

-   **LISTENING**
    -   **Trigger**: Hold `Spacebar` or Click the orb.
    -   **Visuals**: The orb's breathing and sonar ripples become faster and more intense.
    -   **Subtitle**: "Listening..."

-   **THINKING**
    -   **Trigger**: Press `T` key.
    -   **Visuals**: The orb stops breathing and contracts slightly while beginning to swirl, as if processing.
    -   **Subtitle**: "Processing..."

-   **SPEAKING**
    -   **Trigger**: Press `S` key.
    -   **Visuals**: The orb's inner core pulses with a sharp, rhythmic white light, simulating speech.
    -   **Subtitle**: "Speaking..."

-   **LOADING**
    -   **Trigger**: Press `L` key.
    -   **Visuals**: A thin, circular loading ring appears around the orb's edge and begins to spin.
    -   **Subtitle**: "Loading..."
