/**
 * Novera - Refactored Core Logic
 * Pure static, no frameworks.
 * STT: Web Speech API (only)
 * TTS: Deepgram
 * LLM: TogetherAI
 * Runs directly from GitHub Pages.
 *
 * Refactored for:
 * - Better structure and readability
 * - Improved error handling
 * - Reduced redundancy
 * - Easier configuration
 * - Potential for future enhancements
 */

// --- Configuration ---
const CONFIG = {
  API_KEYS: {
    DEEPGRAM: "72bdc80654e54efc8b97dbf7f5cf8707ee1baef4",
    TOGETHER: "tgp_v1_r2rYPrNc_5JHCSKwwWJdsCkJh2JoLfTpiiRBsIpDD2g"
  },
  API_ENDPOINTS: {
    TOGETHER_CHAT: 'https://api.together.xyz/v1/chat/completions', // ✅ Fixed: Removed trailing spaces
    DEEPGRAM_SPEAK: 'https://api.deepgram.com/v1/speak?model=aura-athena-en'
  },
  AI_MODEL: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
  AI_SYSTEM_PROMPT: 'You are Novera, an AI assistant. Respond concisely and clearly.',
  MAX_TOKENS: 300,
  UI: {
    IDLE_TIMEOUT_MS: 3000,
    SUBTITLE_FADEOUT_DURATION_MS: 1500
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // --- DOM Elements Cache ---
  const DOM_ELEMENTS = {
    orb: document.querySelector('.orb'),
    subtitle: document.querySelector('.subtitle'),
    transcriptionDisplay: document.querySelector('.transcription'),
    instructions: document.querySelector('.instructions')
  };

  // Critical check
  if (!DOM_ELEMENTS.orb || !DOM_ELEMENTS.subtitle || !DOM_ELEMENTS.transcriptionDisplay) {
    console.error('Critical UI elements missing.');
    return;
  }

  // --- State Machine ---
  const STATES = {
    IDLE:     { name: 'idle',     text: '' },
    LISTENING: { name: 'listening', text: 'Listening...' },
    THINKING: { name: 'thinking', text: 'Thinking...' },
    SPEAKING: { name: 'speaking', text: 'Speaking...' },
    ERROR:    { name: 'error',    text: 'Something went wrong.' }
  };

  let currentState = STATES.IDLE;
  let recognition = null;
  let audioStream = null;
  let isProcessing = false;

  // --- State Management ---
  function setOrbState(newState) {
    if (currentState === newState) return;

    Object.values(STATES)
      .filter(s => s.name !== 'idle')
      .forEach(s => DOM_ELEMENTS.orb.classList.remove(`orb--${s.name}`));

    DOM_ELEMENTS.subtitle.classList.remove('visible');

    if (newState.name !== 'idle') {
      DOM_ELEMENTS.orb.classList.add(`orb--${newState.name}`);
      DOM_ELEMENTS.subtitle.textContent = newState.text;
      setTimeout(() => DOM_ELEMENTS.subtitle.classList.add('visible'), 50);
    } else {
      DOM_ELEMENTS.subtitle.textContent = '';
      DOM_ELEMENTS.transcriptionDisplay.textContent = '';
    }

    currentState = newState;
    console.log('Novera state:', newState.name);
  }

  // --- Initialize Microphone ---
  async function initMicrophone() {
    try {
      if (!audioStream) {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone access granted.');
      }
    } catch (err) {
      console.error('Microphone access denied:', err);
      handleError('Microphone required.');
    }
  }

  // --- Setup Web Speech API ---
  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported.');
      handleError('Speech not supported.');
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setOrbState(STATES.LISTENING);
      DOM_ELEMENTS.transcriptionDisplay.textContent = '';
    };

    recognition.onresult = (event) => {
      let final = '';
      let interim = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            final += transcript + ' ';
        } else {
            interim += transcript;
        }
      }
      DOM_ELEMENTS.transcriptionDisplay.textContent = final + interim;
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech' || currentState !== STATES.IDLE) {
         handleError('Speech recognition failed.');
      } else {
          setOrbState(STATES.IDLE);
      }
    };

    recognition.onend = () => {
      if (currentState === STATES.LISTENING) {
        // ✅ Added: Small delay to prevent flicker
        setTimeout(() => {
          if (currentState === STATES.LISTENING) {
            const transcript = DOM_ELEMENTS.transcriptionDisplay.textContent.trim();
            if (transcript) {
              processUserInput(transcript);
            } else {
              setOrbState(STATES.IDLE);
            }
          }
        }, 100);
      }
    };
  }

  // --- Centralized Error Handling ---
  function handleError(message) {
      setOrbState(STATES.ERROR);
      DOM_ELEMENTS.subtitle.textContent = message;
      DOM_ELEMENTS.transcriptionDisplay.textContent = '';
      setTimeout(() => {
          if (currentState === STATES.ERROR) {
              setOrbState(STATES.IDLE);
          }
      }, CONFIG.UI.IDLE_TIMEOUT_MS);
  }

  // --- AI Interaction Flow ---
  async function processUserInput(transcript) {
    if (isProcessing) {
        console.warn("Already processing input, ignoring new transcript:", transcript);
        return;
    }
    isProcessing = true;

    try {
      setOrbState(STATES.THINKING); // ✅ Only once
      const aiText = await getAIResponse(transcript);
      if (!aiText) throw new Error('Empty or invalid AI response');

      const audioBlob = await fetchAIAudio(aiText);
      if (!audioBlob) throw new Error('TTS failed');

      await playAIAudioResponse(aiText, audioBlob);
    } catch (err) {
      console.error('AI flow error:', err);
      handleError('AI response failed.');
      isProcessing = false;
    }
  }

  // --- TogetherAI: LLM Inference ---
  async function getAIResponse(userInput) {
    try {
      const response = await fetch(CONFIG.API_ENDPOINTS.TOGETHER_CHAT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.API_KEYS.TOGETHER}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: CONFIG.AI_MODEL,
          messages: [
            { role: 'system', content: CONFIG.AI_SYSTEM_PROMPT },
            { role: 'user', content: userInput }
          ],
          max_tokens: CONFIG.MAX_TOKENS
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message || typeof data.choices[0].message.content !== 'string') {
          throw new Error('Unexpected response structure from LLM API');
      }
      return data.choices[0].message.content.trim();
    } catch (err) {
      console.error('LLM call failed:', err);
      throw err;
    }
  }

  // --- Deepgram: TTS ---
  async function fetchAIAudio(text) {
    try {
      const response = await fetch(CONFIG.API_ENDPOINTS.DEEPGRAM_SPEAK, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${CONFIG.API_KEYS.DEEPGRAM}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS API error (${response.status}): ${errorText}`);
      }

      return await response.blob();
    } catch (err) {
      console.error('TTS fetch failed:', err);
      throw err;
    }
  }

  // --- Play AI Audio ---
  function playAIAudioResponse(text, audioBlob) {
    return new Promise((resolve, reject) => {
        setOrbState(STATES.SPEAKING);
        DOM_ELEMENTS.subtitle.textContent = text;
        DOM_ELEMENTS.subtitle.classList.add('visible');
        DOM_ELEMENTS.transcriptionDisplay.textContent = '';

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        const onEnded = () => {
            cleanup();
            DOM_ELEMENTS.subtitle.classList.add('fade-out');
            setTimeout(() => {
                DOM_ELEMENTS.subtitle.textContent = '';
                DOM_ELEMENTS.subtitle.classList.remove('fade-out');
                setOrbState(STATES.IDLE);
                isProcessing = false;
                resolve();
            }, CONFIG.UI.SUBTITLE_FADEOUT_DURATION_MS);
        };

        const onError = (event) => {
            cleanup();
            console.error('Audio playback error:', event);
            handleError('Audio playback error.');
            isProcessing = false;
            reject(new Error('Audio playback failed'));
        };

        const cleanup = () => {
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            URL.revokeObjectURL(audioUrl);
        };

        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        audio.play().catch(onError);
    });
  }

  // --- Input Handlers ---
  function startListening() {
    if (currentState === STATES.IDLE && recognition && audioStream) {
      recognition.start();
    } else if (currentState === STATES.IDLE) {
      console.log("Initializing mic/recognition...");
      initMicrophone().then(setupSpeechRecognition).then(() => {
           if (currentState === STATES.IDLE && recognition && audioStream) {
               recognition.start();
           }
      }).catch(err => {
           console.error("Failed to initialize:", err);
           handleError("Initialization failed.");
      });
    }
  }

  function stopListening() {
    if (recognition && currentState === STATES.LISTENING) {
      recognition.stop();
    }
  }

  // --- Device Detection ---
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  // --- Web Audio for Visualization ---
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let animationFrameId = null;
  let isAudioVisualizing = false;

  const waveformContainer = document.querySelector('.waveform');
  const svgPath = document.querySelector('.wave');

  if (waveformContainer && svgPath) {
    async function connectMicrophoneForVisualization() {
      try {
        if (!audioStream) await initMicrophone();
        if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (!analyser) {
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.8;
          dataArray = new Uint8Array(analyser.frequencyBinCount);
        }

        const source = audioContext.createMediaStreamSource(audioStream);
        source.connect(analyser);

        isAudioVisualizing = true;
        updateWave();
      } catch (err) {
        console.warn('Audio visualization failed:', err);
      }
    }

    function getVolume() {
      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      return Math.pow(volume / 255, 2);
    }

    function updateWave() {
      if (!isAudioVisualizing) return;

      const vol = getVolume();
      const width = 300;
      const height = 100;
      const centerY = height / 2;
      const amplitude = vol * 30;

      const c1x = width * 0.25;
      const c2x = width * 0.75;
      const c1y = centerY + Math.sin(vol * Math.PI) * amplitude * 1.5;
      const c2y = centerY - Math.sin(vol * Math.PI) * amplitude * 1.5;

      const d = `M0,${centerY} C${c1x},${c1y} ${c2x},${c2y} ${width},${centerY}`;
      svgPath.setAttribute('d', d);

      // ✅ Safe orb feedback: no clip-path, no cropping
      DOM_ELEMENTS.orb.style.transform = `scale(${1 + vol * 0.03})`;
      DOM_ELEMENTS.orb.style.filter = `brightness(${1 + vol * 0.15})`;

      animationFrameId = requestAnimationFrame(updateWave);
    }

    // Wrap startListening to auto-init visualization
    const originalStartListening = startListening;
    startListening = function () {
      if (!isAudioVisualizing) {
        connectMicrophoneForVisualization();
      }
      originalStartListening();
    };
  }

  // --- Event Listeners ---
  if (!isMobile()) {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && currentState === STATES.IDLE) {
        e.preventDefault();
        startListening();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && currentState === STATES.LISTENING) {
        e.preventDefault();
        stopListening();
      }
    });
  } else {
    let pressTimer;
    DOM_ELEMENTS.orb.addEventListener('touchstart', (e) => {
      e.preventDefault();
      pressTimer = setTimeout(() => {
         startListening();
      }, 200);
    });

    const cancelListen = (e) => {
        clearTimeout(pressTimer);
        if (currentState === STATES.LISTENING) {
            e.preventDefault();
            stopListening();
        }
    };

    DOM_ELEMENTS.orb.addEventListener('touchend', cancelListen);
    DOM_ELEMENTS.orb.addEventListener('touchcancel', cancelListen);
    DOM_ELEMENTS.orb.addEventListener('touchmove', cancelListen);
  }

  // --- Init on Load ---
  function setInstructions() {
    if (DOM_ELEMENTS.instructions) {
      DOM_ELEMENTS.instructions.textContent = isMobile()
        ? 'Tap and hold the orb to speak'
        : 'Hold [Space] to speak';
    }
  }

  try {
      await initMicrophone();
      setupSpeechRecognition();
      setInstructions();
      setOrbState(STATES.IDLE);
      console.log('Novera initialized.');
  } catch (initError) {
      console.error("Fatal initialization error:", initError);
      handleError("Failed to start. Please check console.");
  }

});