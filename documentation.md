# Auni Visual System Documentation (Sentient Design)

## 1. Overview

This document details the final visual system for the Auni interface. The design philosophy is to portray Auni as a **smart, able-to-think, sentient being**. The visual representation is **spherical, 3D, subtle, enigmatic, and abstractly complex**. It is not an animated 2D circle, but a window into a thinking, multi-dimensional space.

## 2. File Breakdown

-   `index.html`: The HTML structure was evolved to support a true 3D object. It now includes multiple `.aura-layer` divs for atmospheric effects and specialized `<i>` tags for `.tendril` elements within the core.
-   `css/style.css`: Rewritten to be fundamentally 3D. It establishes a `perspective` context and uses `transform-style: preserve-3d` throughout. Animations heavily leverage `translate3d` and `rotate3d` to create depth and unpredictable movement.
-   `js/main.js`: Handles state management (`IDLE`, `LISTENING`, `THINKING`) via keyboard input. Its function is unchanged.
-   `README.md`: General project information.
-   `documentation.md`: This file.

## 3. Orb Architecture: A Sentient, 3D Entity

The final orb design is a multi-layered 3D object designed to feel alive.

### 3D Implementation
-   A `perspective` is set on the `.orb-container` to create a 3D viewport.
-   The `.orb` and its internal `.particle-system` use `transform-style: preserve-3d` to ensure child elements are positioned in 3D space.
-   The entire orb slowly pans with `transform: rotateY/rotateX` to give a sense of volume and presence.
-   Particles are positioned and animated using `translate3d(x, y, z)`.
-   The core rotates on multiple axes using `rotate3d(x, y, z, angle)`.

### Visual Components
-   **The Aura**: Composed of multiple, overlapping `div`s. These layers have complex, asynchronous animations using `filter: blur()`, `opacity`, and `transform` to create a shimmering, unpredictable energy field that surrounds the core. This replaces the simple halo ripples from previous designs.
-   **The 3D Core**: A particle system where each particle has a unique 3D start and end position, creating a constant, gentle, chaotic drift within the spherical volume.
-   **"Thought" Tendrils**: Fine, line-like elements that are mostly dormant. In the `THINKING` state, they "spark" to life, tracing paths through the 3D core to visualize cognitive activity.

## 4. State-Specific Sentient Animations

Each state is designed to feel like a change in Auni's cognitive focus.

-   **IDLE**: The orb has a very slow, almost imperceptible pan. The aura shimmers gently, and the core particles drift calmly. The tendrils are dormant.
-   **LISTENING**: The orb stops panning to "focus." The aura contracts slightly and brightens. The core particles slow their rotation and drift more purposefully, as if observing.
-   **THINKING**: The orb's pan becomes more agitated. The core's rotation becomes fast and erratic. The "thought tendrils" spark violently, tracing chaotic paths through the core, creating a visual representation of intense processing. The aura shimmers rapidly in response.
