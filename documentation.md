# Auni - Visual Architecture (Phase 1-A)

## Overview

This document outlines the visual architecture for Phase 1-A of the Auni project. This initial phase delivers the non-interactive visual shell of Auni, focusing entirely on layout, styling, and the animated orb that represents Auni’s core presence. The goal is to establish a premium, elegant, and dynamic foundation before any functional logic is implemented.

## File Purpose

The project is structured with vanilla, dependency-free web technologies.

-   `index.html`: Provides the core DOM structure (the "skeleton") of the interface. It contains semantic placeholders for the header, main content (orb), and footer.
-   `/css/style.css`: Contains all visual styling, layout rules, and animations. It is responsible for the entire look and feel of the application, from the layout to the complex orb animations.
-   `/js/main.js`: A placeholder for future development. In this phase, it is intentionally left empty. All interaction logic will be added here in Phase 1-B.
-   `README.md`: The general project summary, feature list for this phase, and instructions on how to run the application.
-   `documentation.md`: This file, providing a detailed breakdown of the visual architecture for the current phase.

## Orb Construction

The orb is the central visual element of Auni, designed to feel "alive." It is constructed using a single primary `div` (`.orb`) and styled with CSS, including heavy use of pseudo-elements and animations.

-   **Layers:**
    1.  **Main Orb (`.orb`):** The core visible circle. It has a shifting `radial-gradient` background and a subtle "breathing" scale animation. A `box-shadow` provides a hint of depth.
    2.  **Outer Glow (`.orb::before`):** A soft, blurred, pulsing glow that sits behind the main orb. It uses a `radial-gradient` fading to transparency and is animated to create a gentle, rhythmic pulse.
    3.  **Shimmering Halo (`.orb::after`):** A thin, rotating ring on top of the orb with its own `box-shadow`. This adds a layer of sophisticated, subtle motion.
    4.  **Inner Waveform (`.orb-core-wave`):** A child `div` that produces a "heartbeat" effect. It's a radial gradient that animates by scaling up from the center and fading out, creating a ripple effect.

-   **Animation States:**
    -   Currently, only one state exists: **Idle**. All animations (`breathing`, `pulse-glow`, `halo-shimmer`, `wave`) are looped infinitely to create a constant sense of life and low-level activity while Auni is "waiting."

## Typography

The typography is chosen to be clean, premium, and futuristic without being overly stylized.

-   **Font Stack:** `font-family: "Segoe UI", "Helvetica Neue", "Roboto", "Arial", sans-serif;`. This stack prioritizes clean, modern system fonts for broad compatibility and a professional feel.
-   **Auni Label (`.auni-title`):**
    -   **Positioning:** Top-left corner.
    -   **Color:** A soft, muted white (`#E0E0E0`) to be clear but not harsh against the black background.
    -   **Styling:** Styled with a thin font-weight (`300`) and slight letter-spacing (`0.1em`) to feel airy and deliberate.
