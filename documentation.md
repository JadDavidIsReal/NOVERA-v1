# Novera AI System Documentation (Phase 2 Enhancements)

## 1. Overview

This document details the enhanced AI-powered interactive system for the Novera interface. This version introduces significant improvements to user experience and performance, including live transcription via WebSockets and optimized microphone handling.

## 2. File Breakdown

-   `index.html`: No changes in this phase.
-   `css/style.css`: No changes in this phase.
-   `js/main.js`: Heavily updated to support new features. Contains all logic for one-time microphone initialization, WebSocket communication, push-to-talk, and tap-to-toggle behaviors.
-   `README.md`: Updated with the new features and interaction instructions.
-   `documentation.md`: This file.

## 3. Core Architectural Changes

### One-Time Microphone Initialization
-   **Function**: `async function initializeMicrophone()`
-   **Behavior**: Called once on `DOMContentLoaded`. It requests microphone access via `navigator.mediaDevices.getUserMedia` and stores the resulting `MediaStream` in a global `audioStream` variable.
-   **Benefit**: This prevents the browser from asking for permission on every interaction, providing a much smoother user experience. If permission is denied, the application enters an error state.

### Live Transcription with WebSockets
-   **Function**: `function setupDeepgramWebSocket()`
-   **Behavior**: Establishes a WebSocket connection to Deepgram's streaming API. It handles `onopen`, `onmessage`, `onerror`, and `onclose` events.
-   **Data Flow**: As `MediaRecorder` captures audio, it sends chunks directly to Deepgram through the socket. The `onmessage` handler receives transcript fragments in real-time and updates the `.transcription` element's text content, creating a live captioning effect. The final, consolidated transcript is stored in the `finalTranscript` variable.

## 4. Interaction Logic

The event listeners have been refactored to support two distinct interaction modes:

1.  **Push-to-Talk (Desktop)**:
    -   `window.addEventListener('keydown', ...)`: On `Space` key down, if not already recording, `handleInteractionStart()` is called. A flag `isKeyHeld` prevents repeats.
    -   `window.addEventListener('keyup', ...)`: On `Space` key up, `handleInteractionEnd()` is called.

2.  **Tap-to-Toggle (Mobile)**:
    -   `orb.addEventListener('click', ...)`: A single click handler checks the `currentState`. If `IDLE`, it calls `handleInteractionStart()`. If `LISTENING`, it calls `handleInteractionEnd()`.
    -   A `touchstart` event is also used to ensure responsiveness on mobile devices, preventing ghost clicks.

## 5. API Integration Details

### Deepgram (Speech-to-Text)
-   **Primary Method**: WebSocket Streaming
    -   **Endpoint**: `wss://api.deepgram.com/v1/listen?encoding=webm&sample_rate=48000`
    -   **Authentication**: The API key is passed in the WebSocket constructor's protocol array: `['token', DEEPGRAM_KEY]`.
    -   **Real-time Response**: The `onmessage` event receives JSON objects containing transcript fragments, which are used to update the UI live.
-   **Fallback Method**: REST API
    -   **Function**: `async function getFinalTranscription(audioBlob)`
    -   **Behavior**: This function first checks if a `finalTranscript` was successfully captured from the WebSocket. If so, it returns that. If not (e.g., due to a WebSocket error), it falls back to sending the complete recorded audio `Blob` to the `v1/listen` REST endpoint.

### TogetherAI (Text Generation)
-   No changes in this phase. The `getAIResponse(transcript)` function still takes the final, complete transcript (whether from WebSocket or the fallback) and sends it to the `v1/chat/completions` endpoint.
