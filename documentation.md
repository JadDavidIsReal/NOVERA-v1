# Auni AI System Documentation (Phase 2: Core AI Integration)

## 1. Overview

This document details the AI-powered interactive system for the Auni interface. This phase moves beyond mock-ups to a fully functional voice-to-response pipeline. The system is designed to be modular, with clear separation between audio capture, state management, and API interactions.

## 2. File Breakdown

-   `index.html`: Contains the core structure, including the orb, a new `.transcription` element to show the user's recognized text, and the `.subtitle` element for the AI's response.
-   `css/style.css`: Styles all visual components and states, including the new `.transcription` display.
-   `js/main.js`: The brain of the application. It handles user input, audio recording, state changes, and all API calls to Deepgram and TogetherAI.
-   `README.md`: General project information and user-facing instructions.
-   `documentation.md`: This file.

## 3. Core AI Workflow

The application follows a precise, event-driven workflow:

1.  **Interaction Start**: The user presses and holds the `Spacebar` or clicks the orb.
2.  **Audio Capture**: The `startRecording()` function is called. It uses `navigator.mediaDevices.getUserMedia` to access the microphone and `MediaRecorder` to capture audio into a `.webm` blob. The orb state changes to `LISTENING`.
3.  **Interaction End**: The user releases the `Spacebar` or the orb.
4.  **Audio Processing**: The `stopRecording()` function finalizes the audio blob. The orb state changes to `THINKING` ("Processing...").
5.  **Speech-to-Text (Deepgram)**: The `getTranscription(audioBlob)` function sends the audio blob to Deepgram's `v1/listen` endpoint via a `fetch` POST request.
6.  **Display Transcription**: The returned transcript is displayed in the `.transcription` element.
7.  **Text Generation (TogetherAI)**: The `getAIResponse(transcript)` function sends the transcript to TogetherAI's `v1/chat/completions` endpoint, querying the `deepseek-chat` model.
8.  **Display Response**: The AI's response is displayed in the `.subtitle` element, and the orb state changes to `SPEAKING`.
9.  **Return to Idle**: After a brief timeout, the orb returns to the `IDLE` state, clearing the transcription and subtitle.

## 4. API Integration Details

### Deepgram (Speech-to-Text)
-   **Function**: `async function getTranscription(audioBlob)`
-   **Endpoint**: `https://api.deepgram.com/v1/listen`
-   **Method**: `POST`
-   **Headers**:
    -   `Authorization: Token <DEEPGRAM_KEY>`
    -   `Content-Type: audio/webm`
-   **Success Response**: Extracts `results.channels[0].alternatives[0].transcript`.
-   **Error Handling**: Catches fetch errors or non-ok responses and returns `null`, triggering the `ERROR` state.

### TogetherAI (Text Generation)
-   **Function**: `async function getAIResponse(transcript)`
-   **Endpoint**: `https://api.together.xyz/v1/chat/completions`
-   **Method**: `POST`
-   **Headers**:
    -   `Authorization: Bearer <TOGETHER_API_KEY>`
    -   `Content-Type: application/json`
-   **POST Body**:
    ```json
    {
      "model": "deepseek-chat",
      "messages": [
        { "role": "system", "content": "You are Auni, an elegant and efficient AI assistant. Speak clearly and concisely." },
        { "role": "user", "content": "<user transcription>" }
      ]
    }
    ```
-   **Success Response**: Extracts `choices[0].message.content`.
-   **Error Handling**: Catches fetch errors or non-ok responses and returns `null`, triggering the `ERROR` state.
