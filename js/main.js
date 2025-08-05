/**
 * Auni - Phase 2: Core AI Integration
 * This script handles the full AI interaction flow, from voice input to AI response.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- API Keys (Development Only) ---
    const DEEPGRAM_KEY = "e019ba41b5ac347788faffaae7b97747d7cef74b";
    const TOGETHER_API_KEY = "tgp_v1_r2rYPrNc_5JHCSKwwWJdsCkJh2JoLfTpiiRBsIpDD2g";

    // --- DOM Element Selection ---
    const orb = document.querySelector('.orb');
    const subtitle = document.querySelector('.subtitle');
    const transcriptionDisplay = document.querySelector('.transcription');

    if (!orb || !subtitle || !transcriptionDisplay) {
        console.error('Essential elements .orb or .subtitle not found!');
        return;
    }

    // --- State Management ---
    const STATES = {
        IDLE: { name: 'idle', text: '' },
        LISTENING: { name: 'listening', text: 'Listening...' },
        THINKING: { name: 'thinking', text: 'Processing...' },
        SPEAKING: { name: 'speaking', text: 'Speaking...' },
        ERROR: { name: 'error', text: 'Something went wrong.' }
    };

    let currentState = STATES.IDLE;
    let isKeyHeld = false;
    let idleTimeout;

    // --- Audio & AI ---
    let mediaRecorder;
    let audioStream;
    let audioChunks = [];

    /**
     * Sets the orb's state, updating CSS classes and subtitle text.
     * @param {object} newState - The new state object from the STATES constant.
     */
    function setOrbState(newState) {
        // Clear any pending timeout to return to idle
        clearTimeout(idleTimeout);

        // Remove all possible state classes
        for (const key in STATES) {
            if (STATES[key].name !== 'idle') {
                orb.classList.remove(`orb--${STATES[key].name}`);
            }
        }
        subtitle.classList.remove('visible');

        // Apply new state class if not idle
        if (newState.name !== 'idle') {
            orb.classList.add(`orb--${newState.name}`);
            subtitle.textContent = newState.text;
            // Use a timeout to allow the subtitle text to be set before adding the visible class
            setTimeout(() => subtitle.classList.add('visible'), 10);
        }

        currentState = newState;
        console.log(`Auni state set to: ${currentState.name}`);

        // Set a timeout to return to idle for non-continuous states
        if (newState !== STATES.IDLE && newState !== STATES.LISTENING) {
            idleTimeout = setTimeout(() => {
                setOrbState(STATES.IDLE);
                if (transcriptionDisplay) transcriptionDisplay.textContent = '';
            }, 5000); // Increased timeout for reading the response
        }
    }

    /**
     * Sends a transcript to TogetherAI for a chat completion.
     * @param {string} transcript - The user's message.
     * @returns {Promise<string|null>} The AI's response or null on failure.
     */
    async function getAIResponse(transcript) {
        try {
            const response = await fetch('https://api.together.xyz/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOGETHER_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
                    messages: [
                        { role: 'system', content: 'You are Auni, an elegant and efficient AI assistant. Speak clearly and concisely.' },
                        { role: 'user', content: transcript }
                    ]
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`TogetherAI API Error: ${response.status}`, errorBody);
                throw new Error(`TogetherAI API request failed with status ${response.status}. See console for details.`);
            }

            const data = await response.json();
            if (data && data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                return data.choices[0].message.content;
            } else {
                console.error('TogetherAI response format is invalid:', data);
                throw new Error('Invalid response format from TogetherAI.');
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            setOrbState(STATES.ERROR);
            subtitle.textContent = "Error from AI response.";
            return null;
        }
    }

    // --- Audio Processing Logic ---

    /**
     * Gets transcription for a given audio blob using Deepgram's REST API.
     * @param {Blob} audioBlob - The audio data to transcribe.
     * @returns {Promise<string|null>} The transcript or null on failure.
     */
    async function getTranscription(audioBlob) {
        try {
            const response = await fetch('https://api.deepgram.com/v1/listen', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DEEPGRAM_KEY}`,
                    'Content-Type': audioBlob.type
                },
                body: audioBlob
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Deepgram API Error: ${response.status}`, errorBody);
                throw new Error(`Deepgram API request failed with status ${response.status}. See console for details.`);
            }

            const data = await response.json();
            // Check for a valid response structure
            if (data && data.results && data.results.channels && data.results.channels.length > 0 && data.results.channels[0].alternatives && data.results.channels[0].alternatives.length > 0) {
                return data.results.channels[0].alternatives[0].transcript;
            } else {
                console.error('Deepgram response format is invalid:', data);
                return ""; // Return empty string for no transcript
            }
        } catch (error) {
            console.error('Error getting transcription:', error);
            setOrbState(STATES.ERROR);
            subtitle.textContent = "Error in transcription.";
            return null;
        }
    }

    /**
     * Converts text to speech using Deepgram's TTS API and plays it.
     * @param {string} text - The text to be spoken.
     */
    async function speakAuniResponse(text) {
        if (!text) {
            setOrbState(STATES.IDLE);
            return;
        }

        subtitle.textContent = text; // Set the subtitle to the AI response
        setOrbState(STATES.SPEAKING);

        try {
            const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-athena-en', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DEEPGRAM_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Deepgram TTS API Error: ${response.status}`, errorBody);
                throw new Error(`Deepgram TTS API request failed with status ${response.status}. See console for details.`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.play();

            // When playback finishes, return to idle state
            audio.addEventListener('ended', () => {
                URL.revokeObjectURL(audioUrl);
                setOrbState(STATES.IDLE);
                transcriptionDisplay.textContent = ''; // Clear transcription
            });

        } catch (error) {
            console.error('Error getting TTS response:', error);
            setOrbState(STATES.ERROR);
        }
    }


    /**
     * Starts audio recording.
     */
    function startRecording() {
        if (!audioStream) {
            console.error("Audio stream is not available.");
            setOrbState(STATES.ERROR);
            subtitle.textContent = "Microphone not ready.";
            return;
        }

        audioChunks = []; // Clear previous recording
        transcriptionDisplay.textContent = ''; // Clear display
        mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm;codecs=opus' });

        mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', async () => {
            if (audioChunks.length === 0) {
                setOrbState(STATES.IDLE);
                return;
            }

            const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });

            setOrbState(STATES.THINKING); // Set state to thinking while we transcribe
            const transcript = await getTranscription(audioBlob);

            if (transcript) {
                transcriptionDisplay.textContent = `"${transcript}"`;
                const aiResponse = await getAIResponse(transcript);
                if (aiResponse) {
                    await speakAuniResponse(aiResponse);
                }
                // No else block needed; getAIResponse now handles setting the error state.
            } else if (transcript === '') {
                // If transcript is empty (e.g., silence), just go back to idle.
                setOrbState(STATES.IDLE);
            }
            // If transcript is null (error), getTranscription already set the error state.
        });

        mediaRecorder.start();
        setOrbState(STATES.LISTENING);
    }

    /**
     * Stops audio recording.
     */
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    }

    // --- Event Handling ---

    const handleInteractionStart = () => {
        if (currentState === STATES.IDLE) {
            startRecording();
        }
    };

    const handleInteractionEnd = () => {
        if (currentState === STATES.LISTENING) {
            stopRecording(); // This will trigger the 'stop' event listener on the mediaRecorder
        }
    };

    // --- Event Listeners ---

    // 1. Spacebar for Push-to-Talk (Desktop)
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isKeyHeld && currentState === STATES.IDLE) {
            e.preventDefault();
            isKeyHeld = true;
            handleInteractionStart();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && isKeyHeld) {
            e.preventDefault();
            isKeyHeld = false;
            handleInteractionEnd();
        }
    });

    // 2. Orb for Tap-and-Hold (Mobile)
    if (isMobileDevice()) {
        orb.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (currentState === STATES.IDLE) {
                handleInteractionStart();
            }
        });

        orb.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (currentState === STATES.LISTENING) {
                handleInteractionEnd();
            }
        });
    }


    // --- Initialization ---

    /**
     * Requests microphone access once and stores the stream for reuse.
     */
    async function initializeMicrophone() {
        try {
            // Store the stream to reuse it without re-asking for permission
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("Microphone access granted.");
        } catch (error) {
            console.error("Microphone access denied:", error);
            setOrbState(STATES.ERROR);
            subtitle.textContent = "Microphone access is required.";
        }
    }

    /**
     * Checks if the user is on a mobile device based on screen width.
     * @returns {boolean} True if the device is considered mobile.
     */
    function isMobileDevice() {
        return window.innerWidth <= 768;
    }

    /**
     * Sets the initial instructional text based on the device type.
     */
    function setInitialInstructions() {
        const instructions = document.querySelector('.instructions');
        if (!instructions) return;

        if (isMobileDevice()) {
            instructions.textContent = "Tap and hold the orb to speak";
        } else {
            instructions.textContent = "Hold [Spacebar] to talk to Auni";
        }
    }

    // Initialize microphone on page load
    initializeMicrophone();
    // Set instructions and device-specific listeners
    setInitialInstructions();

    console.log("Auni AI Logic Initialized.");
});
