# Auni Visual System Documentation (Phase 1-A.2)

## 1. Overview

The purpose of this initial development phase (1-A.2) is to establish the core visual identity of the Auni interface. This is a visual-only foundation, focusing exclusively on UI polish, animation, and creating a sophisticated, "alive" presence for the digital assistant. All elements are purely cosmetic; no JavaScript logic, interactivity, or state management is included in this phase.

## 2. File Breakdown

- **`index.html`**: Contains the complete HTML structure for the interface. This includes the header, the main content area holding the orb, and the footer with the settings icon placeholder. The orb itself is built with a nested `div` structure to allow for layered animations.
- **`/css/style.css`**: The single stylesheet that defines the entire visual presentation. It handles the layout, typography, colors, and all multi-layered animations for the orb. It is written to be modular and responsive.
- **`/js/main.js`**: Included in `index.html` but is intentionally empty. It serves as a placeholder for the next development phase, where interactivity and logic will be implemented.
- **`README.md`**: The main project readme file with a high-level overview.
- **`documentation.md`**: This file, providing a detailed breakdown of the visual system.

## 3. Orb Architecture

The central orb is designed to feel like a living, digital presence. Its effect is achieved through a combination of layered elements and CSS animations.

### 3.1. HTML Structure

The orb is constructed with several nested `div` elements within a main `.orb` container:

```html
<div class="orb">
    <div class="core-waveform">
        <!-- 5 span elements for the bars -->
    </div>
    <div class="inner-glow"></div>
    <div class="outer-glow"></div>
    <div class="ripple"></div>
</div>
```

- **`.orb`**: The main circular element with the base radial gradient.
- **`.inner-glow`**: A `div` used to create a sharp, inset blue glow using `box-shadow: inset`.
- **`.outer-glow`**: A `div` responsible for the soft, ambient glow surrounding the orb, created with multiple `box-shadow` values.
- **`.core-waveform`**: A container for the internal "EQ" animation. It contains five `<span>` elements that are animated.
- **`.ripple`**: A `div` used to render the expanding halo effect.

### 3.2. CSS Animations

Three distinct, looping animations are layered to create the final effect:

1.  **Idle Breathing (`idleBreathing`, `glowPulse`)**:
    - **Technique**: A `transform: scale()` animation on the `.orb` element and a synchronized `box-shadow` animation on the `.outer-glow`.
    - **Effect**: Creates a slow, rhythmic pulse, making the orb feel like it's breathing. The glow gently expands and contracts with the size change.
    - **Loop**: 4-second `ease-in-out` loop.

2.  **Halo Ripple (`haloRipple`)**:
    - **Technique**: Applied to the `.ripple` element. It animates `transform: scale()` and `opacity`.
    - **Effect**: A thin, circular ring radiates outwards from the orb and fades away. A delay is added to create a steady rhythm between ripples.
    - **Loop**: 3-second `ease-out` loop with a 1-second delay.

3.  **Core Waveform (`waveform`)**:
    - **Technique**: Applied to the `<span>` elements within `.core-waveform`. It animates their `height` and `opacity`.
    - **Effect**: Simulates a subtle, internal energy source, like a voice or data stream. Each bar animates with a different delay (`animation-delay`) for a staggered, organic look.
    - **Loop**: 1.5-second `ease-in-out` alternating loop.

## 4. Fonts and Style Choices

- **Font**: The primary font stack is `'Segoe UI', 'Helvetica Neue', 'Roboto', 'Arial', sans-serif`. This was chosen for its clean, modern, and highly legible appearance on a wide range of devices. The font weight is kept light (`300`) to maintain a refined, minimalist aesthetic.
- **Color Palette**: The palette is intentionally simple and futuristic.
    - **Background**: Pure black (`#000000`) to create a high-contrast, "digital dashboard" feel.
    - **Text/Icons**: A soft gray-white (`#f0f0f0`) for readability without being harsh.
    - **Orb Gradient**: A vibrant `radial-gradient` from cyan (`#2bd0ff`) to purple (`#7f00ff`) forms the core of Auni's visual identity.
- **Glows**: Glows are created using `box-shadow` with soft, transparent colors derived from the core gradient to ensure a cohesive look.

## 5. Responsiveness Design Notes

The layout is fully responsive and designed to work on all screen sizes.
- **Layout Method**: The main layout uses absolute positioning for the header and footer, while the central orb is centered using Flexbox.
- **Sizing**: The orb's size is set using viewport width (`vw`) units (`15vw` on desktop, `30vw` on mobile) to ensure it scales proportionally with the screen. `min-width` and `max-width` are used to prevent the orb from becoming too small or absurdly large on extreme screen sizes.
- **Media Queries**: A single breakpoint at `768px` is used to adjust the orb size and UI padding for mobile devices.

## 6. Next Phase Placeholder

The next phase of development will focus on:
- **State Management**: Introducing different visual states for the orb (e.g., listening, thinking, speaking).
- **Interactivity**: Binding keyboard and mouse events to trigger state changes.
- **JavaScript Logic**: Implementing the core logic for the Auni assistant.
