# Auni - Core AI Integration (Phase 2 Enhancements)

## Description

This project is an interactive interface for Auni, a luxury-grade AI assistant. This phase enhances the core AI integration with live transcription and improved interaction logic.

The interface is built with pure HTML, CSS, and JavaScript, with no external dependencies.

## Features

-   **Sophisticated Orb Design**: A 2D, faux-3D orb with a dark, glossy finish and fluid animations.
-   **Live Streaming Transcription**: Uses Deepgram's WebSocket API to display the user's speech as real-time captions.
-   **AI-Powered Responses**: Sends the final transcription to the TogetherAI API (using the `deepseek-chat` model) to generate intelligent responses.
-   **Optimized Microphone Handling**: Requests microphone permission only once on page load for a smoother user experience.
-   **Dual Interaction Modes**:
    -   **Desktop**: Push-to-talk via the `Spacebar`.
    -   **Mobile**: Tap-to-toggle by clicking the orb.

## Integrated Services
-   **Speech-to-Text**: [Deepgram](https://deepgram.com/) (WebSocket Streaming and REST API)
-   **Text Generation**: [TogetherAI (DeepSeek-R1-Distill-Qwen-1.5B)](https://www.together.ai/)

## How to Interact

1.  Open `index.html` in a modern web browser.
2.  Allow the one-time request for microphone permissions.
3.  **On Desktop**: Press and hold the `Spacebar` to speak. The transcription will appear live. Release the key to get an AI response.
4.  **On Mobile**: Tap the orb once to start speaking. Tap it again to stop and get a response.
5.  The orb will transition through `listening`, `processing`, and `speaking` states. The final AI response appears as the main subtitle.
