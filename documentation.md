# Auni - Developer Documentation

## Overview

This document provides a technical overview of the Auni web interface project. Auni is a frontend-only application designed to serve as a minimalist, visually-driven UI for an AI assistant.

The project is developed in phases, with each phase being a self-contained, functional product. This initial phase focuses on establishing the core UI, modular file structure, and all visual state animations, with user interactions simulated via keyboard and mouse inputs.

---

## Files & Responsibilities

The project is structured into modular files, each with a distinct purpose:

-   `index.html`: Provides the main HTML structure for the application, including all necessary containers for UI elements and the script tags for loading the JavaScript modules.

-   `/css/style.css`: Contains all visual styles and animations. It styles the layout, UI components, and defines all keyframe animations for the orb's various behavioral states.

-   `/js/main.js`: The primary entry point for the application. It handles DOM element selection, initializes the application, and attaches all global event listeners (e.g., keydown, click) to trigger state changes.

-   `/js/orb.js`: Acts as the central state machine for the orb. It defines the possible states, manages the current state, and orchestrates the transitions between them, calling on the animation and UI modules as needed.

-   `/js/animation.js`: Manages the direct manipulation of the orb's CSS classes to apply different animations. This decouples the "how" of animation (CSS classes) from the "what" (state logic).

-   `/js/utils.js`: A utility file for housing common, reusable functions. In this phase, it is primarily a placeholder for future needs like debounce or formatting functions.

---

## Orb State Chart

The orb's behavior is defined by a set of distinct states, each with a specific trigger and visual representation.

| State       | Trigger(s)                          | Animation / Visuals                                           | Subtitle Text     |
| :---------- | :---------------------------------- | :------------------------------------------------------------ | :---------------- |
| **Idle**    | App load, Spacebar `keyup`          | Subtle pulsing blue/cyan glow.                                | *(None)*          |
| **Hover**   | Mouse cursor over orb               | Brightness increases, outer glow intensifies.                 | *(No change)*     |
| **Listening**| Orb `click`, Spacebar `keydown`   | Orb expands, emits ripple rings, color shifts to green/teal.  | "Listening..."    |
| **Thinking**| `T` key press                       | Orb swirls and pulses, color shifts to violet/blue.           | "Processing..."   |
| **Speaking**| `S` key press                       | Glow pulses in sync with notional speech, color shifts.       | "Speaking..."     |
| **Loading** | `L` key press                       | A small spinner appears and rotates inside the orb.           | *(None)*          |

---

## Developer Notes

-   **Testability**: All states are manually triggerable via the keyboard, allowing for easy testing of each animation and transition without needing to simulate complex user interaction.
-   **Seamless Transitions**: The CSS and JavaScript are designed to handle rapid, interruptible state changes. The animation module first clears all state classes before applying a new one, ensuring smooth transitions.
-   **No Dependencies**: The project is built with vanilla HTML, CSS, and modern ES6+ JavaScript. It requires no build tools, package managers, or external libraries.
-   **Simulated Behavior**: The current triggers (key presses) are hardcoded to simulate events that would typically come from a Speech-to-Text (STT) or Language Model (LLM) API in a full implementation.

---

## Security Note

API keys will be hardcoded in development. This repo is intended for personal use only. Do not expose this code publicly with active keys.
