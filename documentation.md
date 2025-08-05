# Auni Visual System Documentation (Living Aurora Design)

## 1. Overview

This document details the final visual system for the Auni interface. The design philosophy is to portray Auni as an **organic, living entity** encased in a futuristic shell. The visual representation is a **strictly centered, glossy, glass-like orb** that communicates its state through an internal "aurora" and external, Siri-like particles.

## 2. File Breakdown

-   `index.html`: The HTML has been simplified to support the new design. It contains the orb, an inner `aurora-core` container, and a separate `.particle-field` container for external effects.
-   `css/style.css`: This file builds the visual experience. It uses a palette of dark, subtle blues and other soft colors. It renders the glossy orb, the internal aurora, the heartbeat pulse, and the external particle system.
-   `js/main.js`: This script handles two functions:
    1.  It dynamically generates the 30 external particles on page load.
    2.  It manages the state (`IDLE`, `LISTENING`, `THINKING`) via keyboard input and applies state classes to the main container to trigger the appropriate animations in CSS.
-   `README.md`: General project information.
-   `documentation.md`: This file.

## 3. Orb Architecture: The Living Aurora

The orb is designed to feel like a living heart protected by a polished, technological shell.

### Core Design
-   **Glossy Glass Sphere**: The orb's surface is created with layered `radial-gradient`s to simulate a dark, reflective glass sphere with a sharp highlight, giving it a tangible, high-end feel.
-   **Northern Lights Core**: The inside of the orb contains several `div`s styled with soft, transparent, multi-colored radial gradients. These layers are animated asynchronously with long durations, creating a constantly shifting, subtle "aurora borealis" effect.
-   **Heartbeat Pulse**: The orb's primary animation is a slow, deep "heartbeat" using `transform: scale`. This gives the entire object a baseline sense of being alive.
-   **Pulsating Radar**: Behind the orb, a series of thin, concentric circles pulse outwards, creating a sonar-like effect that provides a sense of environmental awareness.
-   **Siri-like Particles**: The area around the orb is populated by small, soft particles. Their behavior changes drastically based on Auni's state.

## 4. State-Specific Animations

-   **IDLE**: The orb has its gentle heartbeat and the radar pulses slowly. External particles materialize at the edge of the radar field, glow brightly, and drift inwards towards the orb before fading away, as if being calmly consumed for ambient data.
-   **LISTENING**: The heartbeat is faster and more regular. The radar pulses more quickly. The external particles stop drifting and instead snap into a fixed, glowing geometric constellation around the orb, as if "locked on" to an incoming signal.
-   **THINKING**: The heartbeat becomes very rapid. The internal aurora churns more quickly and the radar pulses erratically. The external particles break formation and enter a fast, tight, chaotic orbit around the orb, representing active processing.
