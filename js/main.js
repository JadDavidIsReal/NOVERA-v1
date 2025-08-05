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
    let audioChunks = [];
    let audioStream;
    let deepgramSocket;
    let finalTranscript = '';

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
     * Sets up the WebSocket connection to Deepgram for live transcription.
     */
    function setupDeepgramWebSocket() {
        deepgramSocket = new WebSocket(`wss://api.deepgram.com/v1/listen?encoding=webm&sample_rate=48000&token=${DEEPGRAM_KEY}&voice=aura-athena-en`);

        let keepAliveInterval;

        deepgramSocket.onopen = () => {
            console.log('Deepgram WebSocket opened.');
            keepAliveInterval = setInterval(() => {
                if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
                    deepgramSocket.send(JSON.stringify({ type: "KeepAlive" }));
                }
            }, 5000);
        };

        deepgramSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.channel.alternatives[0].transcript) {
              if (data.is_final) {
                finalTranscript += data.channel.alternatives[0].transcript + ' ';
              }
              transcriptionDisplay.textContent = finalTranscript + data.channel.alternatives[0].transcript;
            }
        };

        deepgramSocket.onerror = (error) => {
            console.error('Deepgram WebSocket error:', error);
        };

        deepgramSocket.onclose = () => {
            console.log('Deepgram WebSocket closed.');
            clearInterval(keepAliveInterval);
        };
    }

    /**
     * Starts audio recording and live transcription.
     */
    async function startRecording() {
        if (!audioStream) {
            console.error("Audio stream is not available.");
            setOrbState(STATES.ERROR);
            subtitle.textContent = "Microphone not ready.";
            return;
        }

        finalTranscript = ''; // Reset final transcript
        transcriptionDisplay.textContent = ''; // Clear display
        setupDeepgramWebSocket();

        mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm;codecs=opus' });

        mediaRecorder.addEventListener('dataavailable', event => {
            if (event.data.size > 0 && deepgramSocket.readyState === WebSocket.OPEN) {
                deepgramSocket.send(event.data);
            }
            audioChunks.push(event.data); // Still collect for fallback
        });

        mediaRecorder.start(250); // Start sending data in chunks
        setOrbState(STATES.LISTENING);
    }

    /**
     * Stops audio recording and closes the WebSocket.
     * @returns {Blob} The complete recorded audio data.
     */
    function stopRecording() {
        return new Promise(resolve => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.addEventListener('stop', () => {
                    if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
                        deepgramSocket.close();
                    }
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    audioChunks = []; // Clear chunks for next recording
                    resolve(audioBlob);
                });
                mediaRecorder.stop();
            } else {
                resolve(null);
            }
        });
    }

    /**
     * (Fallback) Sends a complete audio blob to Deepgram for transcription.
     * @param {Blob} audioBlob - The audio data to transcribe.
     * @returns {Promise<string|null>} The transcript or null on failure.
     */
    async function getFinalTranscription(audioBlob) {
        // Use the live transcript if available and not empty
        if (finalTranscript.trim()) {
            return finalTranscript.trim();
        }

        // Fallback to blob upload if streaming failed
        console.log("Streaming transcript not available, falling back to blob upload.");
        try {
            const response = await fetch('https://api.deepgram.com/v1/listen', {
                method: 'POST',
                headers: { 'Authorization': `Token ${DEEPGRAM_KEY}`, 'Content-Type': 'audio/webm' },
                body: audioBlob
            });
            if (!response.ok) throw new Error(`Deepgram API error: ${response.statusText}`);
            const data = await response.json();
            return data.results.channels[0].alternatives[0].transcript;
        } catch (error) {
            console.error('Error getting final transcription:', error);
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
                // If there was no audio but a websocket was opened, close it.
                if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
                    deepgramSocket.close();
                }
                return;
            }

            setOrbState(STATES.THINKING);
            // The final transcript is now primarily from the WebSocket, with blob as fallback.
            const transcript = await getFinalTranscription(audioBlob);

            if (transcript) {
                if (transcriptionDisplay) transcriptionDisplay.textContent = `"${transcript}"`;

                subtitle.textContent = "Auni is Thinking...";
                subtitle.classList.add("visible");

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
            instructions.textContent = "Tap and hold the orb to speak.";
        } else {
            instructions.textContent = "Hold [Spacebar] to talk to Auni.";
        }
    }

    // Initialize microphone on page load
    initializeMicrophone();
    // Set instructions and device-specific listeners
    setInitialInstructions();
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

    console.log("Auni AI Logic Initialized.");
});
