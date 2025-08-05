/**
 * Auni - Phase 2: Core AI Integration
 * This script handles the full AI interaction flow, from voice input to AI response.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- API Keys (Development Only) ---
    const DEEPGRAM_KEY = "cc186bd29115880294e05418214099ffff5497b8";
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

    // --- Audio Recording ---
    let mediaRecorder;
    let audioChunks = [];
    let audioStream;

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
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: 'You are Auni, an elegant and efficient AI assistant. Speak clearly and concisely.' },
                        { role: 'user', content: transcript }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`TogetherAI API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error getting AI response:', error);
            return null;
        }
    }

    // --- Audio Processing Logic ---

    /**
     * Starts audio recording.
     */
    async function startRecording() {
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
            audioChunks = [];

            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.start();
            setOrbState(STATES.LISTENING);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setOrbState(STATES.ERROR);
        }
    }

    /**
     * Stops audio recording and returns the audio as a Blob.
     * @returns {Blob} The recorded audio data.
     */
    function stopRecording() {
        return new Promise(resolve => {
            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                resolve(null);
                return;
            }

            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                audioStream.getTracks().forEach(track => track.stop()); // Release microphone
                resolve(audioBlob);
            });

            mediaRecorder.stop();
        });
    }

    /**
     * Sends audio to Deepgram for transcription.
     * @param {Blob} audioBlob - The audio data to transcribe.
     * @returns {Promise<string|null>} The transcript or null on failure.
     */
    async function getTranscription(audioBlob) {
        try {
            const response = await fetch('https://api.deepgram.com/v1/listen', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${DEEPGRAM_KEY}`,
                    'Content-Type': 'audio/webm'
                },
                body: audioBlob
            });

            if (!response.ok) {
                throw new Error(`Deepgram API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.results.channels[0].alternatives[0].transcript;
        } catch (error) {
            console.error('Error getting transcription:', error);
            return null;
        }
    }

    // --- Event Handling ---

    const handleInteractionStart = () => {
        if (currentState === STATES.IDLE) {
            startRecording();
        }
    };

    const handleInteractionEnd = async () => {
        if (currentState === STATES.LISTENING) {
            const audioBlob = await stopRecording();
            if (!audioBlob || audioBlob.size === 0) {
                setOrbState(STATES.IDLE);
                return;
            }

            setOrbState(STATES.THINKING);
            const transcript = await getTranscription(audioBlob);

            if (transcript) {
                if (transcriptionDisplay) transcriptionDisplay.textContent = `"${transcript}"`;

                const aiResponse = await getAIResponse(transcript);
                if (aiResponse) {
                    setOrbState(STATES.SPEAKING);
                    subtitle.textContent = aiResponse;
                } else {
                    setOrbState(STATES.ERROR);
                }
            } else {
                setOrbState(STATES.ERROR);
            }
        }
    };

    // 1. Spacebar listeners
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isKeyHeld) {
            e.preventDefault();
            isKeyHeld = true;
            handleInteractionStart();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            isKeyHeld = false;
            handleInteractionEnd();
        }
    });

    // 2. Orb click listeners (for mobile)
    orb.addEventListener('mousedown', () => {
        if (currentState === STATES.IDLE) {
            handleInteractionStart();
        } else if (currentState === STATES.LISTENING) {
            handleInteractionEnd();
        }
    });
    // Prevent default touch behavior
    orb.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (currentState === STATES.IDLE) {
            handleInteractionStart();
        } else if (currentState === STATES.LISTENING) {
            handleInteractionEnd();
        }
    });


    // --- Initialization ---
    console.log("Auni AI Logic Initialized.");
    console.log("Hold [Space] or Click Orb to Speak.");
});
