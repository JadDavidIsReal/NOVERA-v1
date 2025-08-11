/**
 * Novera - Refactored Core Logic
 * Pure static, no frameworks.
 * STT: Web Speech API (only)
 * TTS: Deepgram
 * LLM: TogetherAI
 * Runs directly from GitHub Pages.
 *
 * Now: Real-time waveform driven by mic input.
 */

// --- Configuration ---
const CONFIG = {
  API_KEYS: {
    DEEPGRAM: "72bdc80654e54efc8b97dbf7f5cf8707ee1baef4",
    TOGETHER: "tgp_v1_r2rYPrNc_5JHCSKwwWJdsCkJh2JoLfTpiiRBsIpDD2g"
  },
  API_ENDPOINTS: {
    TOGETHER_CHAT: 'https://api.together.xyz/v1/chat/completions', // ✅ Fixed: removed trailing spaces
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
    instructions: document.querySelector('.instructions'),
    wave: document.querySelector('.wave') // ✅ New: SVG path
  };

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

  // --- Web Audio for Visualization ---
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let animationFrameId = null;

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
      // Stop waveform animation
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }

    currentState = newState;
    console.log('Novera state:', newState.name);
  }

  // --- Initialize Microphone (for both STT and Visualization) ---
  async function initMicrophone() {
    try {
      if (!audioStream) {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone access granted.');

        // ✅ Initialize Web Audio for visualization
        if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(audioStream);
          source.connect(analyser);
          analyser.fftSize = 64;
          dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
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
      startWaveAnimation(); // ✅ Start waveform
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
      // ✅ Add slight delay to prevent flicker
      setTimeout(() => {
        if (currentState === STATES.LISTENING) {
          const transcript = DOM_ELEMENTS.transcriptionDisplay.textContent.trim();
          if (transcript) {
            processUserInput(transcript);
          } else {
            setOrbState(STATES.IDLE);
          }
        }
      }, 100); // Prevents false stop
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
    if (isProcessing) return;
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

  // --- Waveform Animation Engine ---
  function startWaveAnimation() {
    if (!DOM_ELEMENTS.wave || !analyser) return;

    const svgPath = DOM_ELEMENTS.wave;
    const width = 300;
    const height = 100;
    const segments = 10;
    const points = Array(segments + 1).fill(0).map((_, i) => {
      const x = (i / segments) * width;
      const y = height / 2;
      return { x, y };
    });

    function updateWave() {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const volume = average / 255; // 0 to 1

      // Update Y values with wave effect
      points.forEach((p, i) => {
        const angle = (i / segments) * Math.PI * 2;
        const ripple = Math.sin(angle * 2 + performance.now() / 500) * 15 * volume;
        p.y = height / 2 + ripple * (0.5 + 0.5 * Math.sin(i));
      });

      // Generate smooth path
      let d = `M ${points[0].x},${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const cx = (points[i - 1].x + points[i].x) / 2;
        const cy = (points[i - 1].y + points[i].y) / 2;
        d += ` C ${cx},${points[i - 1].y} ${cx},${points[i].y} ${points[i].x},${points[i].y}`;
      }
      svgPath.setAttribute('d', d);

      // Optional: Scale orb deformation
      DOM_ELEMENTS.orb.style.clipPath = volume > 0.3
        ? 'path("M50,0 C77.6,0 100,22.4 100,50 C100,77.6 77.6,100 50,100 C22.4,100 0,77.6 0,50 C0,22.4 22.4,0 50,0")'
        : 'path("M50,0 C70,0 100,30 100,50 C100,70 70,100 50,100 C30,100 0,70 0,50 C0,30 30,0 50,0")';

      animationFrameId = requestAnimationFrame(updateWave);
    }

    updateWave();
  }

  // --- Input Handlers ---
  function startListening() {
    if (currentState === STATES.IDLE && recognition && audioStream) {
      recognition.start();
    } else if (currentState === STATES.IDLE) {
      initMicrophone().then(setupSpeechRecognition).then(() => {
        if (currentState === STATES.IDLE && recognition && audioStream) {
          recognition.start();
        }
      }).catch(err => {
        console.error("Failed to initialize for listening:", err);
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