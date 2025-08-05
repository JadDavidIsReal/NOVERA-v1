# Auni - Core AI Integration (Phase 2)

## Description

This project is an interactive interface for Auni, a luxury-grade AI assistant. This phase integrates real AI services to provide a complete voice-to-text and text-generation pipeline.

The interface is built with pure HTML, CSS, and JavaScript, with no external dependencies.

## Features

-   **Sophisticated Orb Design**: A 2D, faux-3D orb with a dark, glossy finish and fluid animations.
-   **Live Speech-to-Text**: Uses the Deepgram API to transcribe user audio in real-time.
-   **AI-Powered Responses**: Sends the transcription to the TogetherAI API (using the DeepSeek-R1 model) to generate intelligent responses.
-   **Dynamic State Handling**: The orb visually transitions through `listening`, `processing`, and `speaking` states.
-   **Cross-Platform Input**: Works with both spacebar press-and-hold on desktop and orb clicks on mobile.

## Integrated Services
-   **Speech-to-Text**: [Deepgram](https://deepgram.com/)
-   **Text Generation**: [TogetherAI (DeepSeek-R1-Distill-Qwen-1.5B)](https://www.together.ai/)

## How to Interact

1.  Open `index.html` in a modern web browser.
2.  The browser will request microphone permissions. Please allow access.
3.  Press and hold the `Spacebar`, or click and hold the orb. The orb will enter the `listening` state.
4.  Speak a command or question.
5.  Release the `Spacebar` or the orb.
6.  The orb will enter the `processing` state while it sends your audio for transcription and gets an AI response.
7.  Your transcribed text will appear below the orb.
8.  The AI's response will then be displayed as the main subtitle.
