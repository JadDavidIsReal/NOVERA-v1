# Auni Visual System Documentation (Executive Flame Design)

## 1. Overview

This document details the final visual system for the Auni interface. The design philosophy is to portray Auni as a **sophisticated, professional, and executive tool**. The visual representation is a **strictly centered, 2D, faux-3D orb** that radiates a sense of controlled power. The aesthetic is inspired by luxury car dashboards and high-end hardware, using a muted, high-contrast color palette.

## 2. File Breakdown

-   `index.html`: A minimal structure containing the orb and placeholders for its core, loading ring, and "heat haze" effect. The visual complexity is achieved through CSS.
-   `css/style.css`: This file builds the complete visual experience. It uses a dark, desaturated navy/charcoal and crisp white/silver color palette. It renders the glossy orb, the sonar-like ripples, the subtle "heat haze," and all state-specific animations.
-   `js/main.js`: Handles state management. It listens for keyboard input to apply state classes (`.is-listening`, `.is-speaking`, `.is-loading`) to the orb, triggering the corresponding CSS animations.
-   `README.md`: General project information.
-   `documentation.md`: This file.

## 3. Orb Architecture: The Executive Flame

The orb is designed to feel like a powerful, high-end piece of controlled technology.

### Core Design
-   **Glossy Orb**: The orb has a dark, desaturated navy background with a sharp highlight, giving it a polished, faux-3D spherical appearance.
-   **Sonar Ripples**: A `::after` pseudo-element creates sharp, sonar-like rings that pulse outwards, suggesting constant environmental awareness.
-   **"Heat Haze" Flame Effect**: A dedicated `div` with heavily blurred and slowly transforming `box-shadow`s creates a subtle, shimmering "heat haze" around the orb, suggesting contained energy or processing power.
-   **Loading Ring**: A thin ring that is hidden by default and appears only in the loading state.

## 4. State-Specific Animations & Controls

-   **IDLE**: The default state. The orb "breathes" with a slow, gentle pulse. The sonar ripples and heat haze are calm and subtle.
-   **LISTENING**:
    -   **Control**: Hold the `Spacebar`.
    -   **Behavior**: The sonar ripples become faster and sharper. The heat haze effect intensifies, indicating focused energy.
-   **SPEAKING**:
    -   **Control**: Press the `S` key.
    -   **Behavior**: The orb's inner core pulses with a sharp, rhythmic white light, simulating speech.
-   **LOADING**:
    -   **Control**: Press the `L` key.
    -   **Behavior**: The loading ring appears and spins around the orb's circumference.
