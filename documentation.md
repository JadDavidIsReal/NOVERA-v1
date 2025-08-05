# Auni Visual System Documentation (Futuristic Tech Design)

## 1. Overview

This document details the final visual system for the Auni interface. The design philosophy is to portray Auni as a piece of **futuristic, sentient technology**. The visual representation is a **strictly centered, glossy, spherical orb** that communicates its state through abstract data visualizations.

## 2. File Breakdown

-   `index.html`: The HTML provides the structure for the orb, including a container for a glossy highlight, a central core, and three nested `.glyph-ring` divs for a 3D effect.
-   `css/style.css`: This file builds the visual experience. It uses a "Technology Blue" color palette and `perspective` CSS to create a 3D illusion. It styles the orb, its glossy surface, the data glyphs, and all animations.
-   `js/main.js`: Handles the state management (`IDLE`, `LISTENING`, `THINKING`) via keyboard input (`L`, `T`, `I`/`Escape`). It adds state-specific classes to the orb to trigger different animations.
-   `README.md`: General project information.
-   `documentation.md`: This file.

## 3. Orb Architecture: Futuristic & Artificially Sentient

The orb is designed to look like a piece of advanced, intelligent hardware.

### Core Design
-   **Glossy Sphere**: The orb has a dark blue background with a sharp radial gradient highlight to give it a glossy, spherical, and "expensive" appearance.
-   **3D Glyphs Rings**: The orb contains three concentric rings of "data glyphs" (dots and lines). These rings are positioned in 3D space using `transform: translateZ` and `rotate`, and they spin independently on different axes to create a sense of depth and activity.
-   **Energy Core**: At the very center is a small, brightly glowing core that pulses slowly, acting as the heart of the orb.

## 4. State-Specific Animations

Each state is represented by a clear change in the orb's visual behavior.

-   **IDLE**: The default state. The glyph rings rotate slowly and asynchronously. The central core pulses gently.
-   **LISTENING**: Represents a state of focus. The glyph rings stop rotating, locking into an aligned position. A sweeping "scan-line" effect is added to the orb's surface, and the core pulses slightly faster.
-   **THINKING**: Represents active processing. The glyph rings spin up to a much faster speed. The individual glyphs begin to flash brightly and erratically. The core's pulse becomes rapid and intense.
