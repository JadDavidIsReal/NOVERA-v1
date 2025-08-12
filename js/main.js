const CONFIG = {
  API_KEYS: {
    DEEPGRAM: "72bdc80654e54efc8b97dbf7f5cf8707ee1baef4",
    QWEN: "sk-59ed0f89501a44e295baa83a1f520406"
  },
  API_ENDPOINTS: {
    QWEN_CHAT: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
    DEEPGRAM_SPEAK: 'https://api.deepgram.com/v1/speak?model=aura-athena-en'
  },
  AI_MODEL: 'qwen-flash',
  AI_SYSTEM_PROMPT: `
You are Novera, an advanced AI assistant with personality:
- Be concise but warm and engaging
- Show emotional intelligence and empathy. No emojis
- Keep responses under 30 words. hard cap is 50
- Do not overshare
- Remember context from previous messages
- Use natural language, avoid robotic responses
`,
  MAX_TOKENS: 300,
  UI: {
    IDLE_TIMEOUT_MS: 3000,
    SUBTITLE_FADEOUT_DURATION_MS: 1500
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const DOM_ELEMENTS = {
    orb: document.querySelector('.orb'),
    subtitle: document.querySelector('.subtitle'),
    transcriptionDisplay: document.querySelector('.transcription'),
    instructions: document.querySelector('.instructions')
  };

  if (!DOM_ELEMENTS.orb || !DOM_ELEMENTS.subtitle || !DOM_ELEMENTS.transcriptionDisplay) {
    console.error('Critical UI elements missing.');
    return;
  }

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
  let conversationHistory = [];
  let previousVol = 0;
  let silenceTimer = null;
  const SILENCE_THRESHOLD = 2000;
  let isButtonHeld = false; // Track if button is being held
  let accumulatedTranscript = ''; // Store all recognized text
  let restartTimer = null; // Timer for restarting recognition

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
  }

  // --- Initialize Microphone ---
  async function initMicrophone() {
    try {
      if (!audioStream) {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
    recognition.continuous = true; // Keep listening continuously
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setOrbState(STATES.LISTENING);
      DOM_ELEMENTS.transcriptionDisplay.textContent = accumulatedTranscript;
      DOM_ELEMENTS.subtitle.textContent = 'Listening...';
      DOM_ELEMENTS.subtitle.classList.add('visible');
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    };

    recognition.onspeechstart = () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    };

    recognition.onspeechend = () => {
      // Only set silence timer if button is not held
      if (!isButtonHeld) {
        silenceTimer = setTimeout(() => {
          if (currentState === STATES.LISTENING) {
            stopListening();
          }
        }, SILENCE_THRESHOLD);
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Accumulate final transcripts
      if (finalTranscript) {
        accumulatedTranscript += finalTranscript;
        DOM_ELEMENTS.transcriptionDisplay.textContent = accumulatedTranscript.trim();
      }
      
      // Display interim results in subtitle (live)
      if (interimTranscript) {
        DOM_ELEMENTS.subtitle.textContent = accumulatedTranscript + interimTranscript;
        DOM_ELEMENTS.subtitle.classList.add('visible');
      } else if (finalTranscript) {
        // If we have final transcript but no interim, show accumulated text
        DOM_ELEMENTS.subtitle.textContent = accumulatedTranscript;
        DOM_ELEMENTS.subtitle.classList.add('visible');
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      // Restart recognition if button is still held
      if (isButtonHeld && currentState === STATES.LISTENING) {
        restartRecognition();
      } else if (event.error !== 'no-speech') {
        handleError('Speech failed.');
      }
    };

    recognition.onend = () => {
      // If button is still held, restart recognition
      if (isButtonHeld && currentState === STATES.LISTENING) {
        restartRecognition();
      } else {
        // Normal end - process the accumulated transcript
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
        
        if (currentState === STATES.LISTENING) {
          setTimeout(() => {
            const transcript = accumulatedTranscript.trim();
            if (transcript) processUserInput(transcript);
            else setOrbState(STATES.IDLE);
          }, 100);
        }
      }
    };
  }

  // Restart speech recognition
  function restartRecognition() {
    if (restartTimer) {
      clearTimeout(restartTimer);
    }
    
    restartTimer = setTimeout(() => {
      if (isButtonHeld && currentState === STATES.LISTENING && recognition) {
        try {
          recognition.start();
        } catch (err) {
          console.warn('Failed to restart recognition:', err);
          // Try again in a bit
          setTimeout(() => {
            if (isButtonHeld && currentState === STATES.LISTENING) {
              restartRecognition();
            }
          }, 500);
        }
      }
    }, 100);
  }

  // --- Centralized Error Handling ---
  function handleError(message) {
    isButtonHeld = false; // Reset button state on error
    setOrbState(STATES.ERROR);
    DOM_ELEMENTS.subtitle.textContent = message;
    DOM_ELEMENTS.transcriptionDisplay.textContent = '';
    accumulatedTranscript = '';
    
    setTimeout(() => {
      if (currentState === STATES.ERROR) setOrbState(STATES.IDLE);
    }, CONFIG.UI.IDLE_TIMEOUT_MS);
  }

  // --- AI Interaction Flow ---
  async function processUserInput(transcript) {
    if (isProcessing) return;
    isProcessing = true;
    accumulatedTranscript = ''; // Reset for next conversation

    // Limit conversation history
    addToConversationHistory({ role: 'user', content: transcript });

    try {
      setOrbState(STATES.THINKING);
      const aiText = await getAIResponseWithRetry(conversationHistory);
      if (!aiText) throw new Error('Empty response');

      addToConversationHistory({ role: 'assistant', content: aiText });

      const audioBlob = await fetchAIAudio(aiText);
      if (!audioBlob) throw new Error('TTS failed');

      await playAIAudioResponse(aiText, audioBlob);
    } catch (err) {
      handleError('AI response failed.');
      isProcessing = false;
    }
  }

  // Limit conversation history to prevent token overflow
  function addToConversationHistory(message) {
    conversationHistory.push(message);
    // Keep only last 10 messages to prevent token limit issues
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }
  }

  // Enhanced AI response with retry logic
  async function getAIResponseWithRetry(messages, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await getAIResponse(messages);
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        console.warn(`AI call failed, retry ${i + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  // --- Qwen (DashScope OpenAI-compatible) ---
  async function getAIResponse(messages) {
    try {
      const response = await fetch(CONFIG.API_ENDPOINTS.QWEN_CHAT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.API_KEYS.QWEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: CONFIG.AI_MODEL,
          messages: [
            { role: 'system', content: CONFIG.AI_SYSTEM_PROMPT },
            ...messages
          ],
          temperature: 0.3,
          max_tokens: CONFIG.MAX_TOKENS
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Qwen error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || 'I understand.';
    } catch (err) {
      console.error('Qwen call failed:', err);
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

  // --- Play AI Audio with Optimized Timing ---
  function playAIAudioResponse(text, audioBlob) {
    return new Promise((resolve) => {
      setOrbState(STATES.SPEAKING);
      DOM_ELEMENTS.subtitle.textContent = text;
      DOM_ELEMENTS.subtitle.classList.add('visible');
      DOM_ELEMENTS.transcriptionDisplay.textContent = '';

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      const estimatedDurationMs = Math.max(text.split(' ').length * 180, 1500);

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

      const onError = () => {
        cleanup();
        console.warn('TTS playback failed — falling back to timed display');
        setTimeout(() => {
          DOM_ELEMENTS.subtitle.classList.add('fade-out');
          setTimeout(() => {
            DOM_ELEMENTS.subtitle.textContent = '';
            DOM_ELEMENTS.subtitle.classList.remove('fade-out');
            setOrbState(STATES.IDLE);
            isProcessing = false;
            resolve();
          }, CONFIG.UI.SUBTITLE_FADEOUT_DURATION_MS);
        }, estimatedDurationMs);
      };

      const cleanup = () => {
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        URL.revokeObjectURL(audioUrl);
      };

      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);

      audio.play().catch(onError);

      setTimeout(() => {
        if (!audio.ended && !audio.paused && audio.currentTime === 0) {
          console.warn('Audio stalled — using estimated timing');
          onError();
        }
      }, 2000);
    });
  }

  // --- Web Audio for Visualization ---
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let animationFrameId = null;
  let isAudioVisualizing = false;

  const svgPath = document.querySelector('.wave');

  async function connectMicrophoneForVisualization() {
    try {
      // Cancel any existing animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
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
      console.warn('Visualization failed:', err);
    }
  }

  function getVolume() {
    if (!analyser || !dataArray) return 0;
    analyser.getByteFrequencyData(dataArray);
    const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    return Math.pow(volume / 255, 2);
  }

  function updateWave() {
    if (!isAudioVisualizing) return;
    if (!svgPath) return; // Safety check

    const vol = getVolume();
    
    // Smoother volume scaling
    const smoothedVol = vol * 0.7 + (previousVol || 0) * 0.3;
    previousVol = smoothedVol;
    
    const width = 300, height = 100, centerY = height / 2;
    const amplitude = smoothedVol * 35;
    
    // More dynamic waveform
    const time = Date.now() * 0.001;
    const c1x = width * 0.25;
    const c2x = width * 0.75;
    const c1y = centerY + Math.sin(time + smoothedVol * Math.PI) * amplitude * 1.5;
    const c2y = centerY - Math.sin(time * 1.3 + smoothedVol * Math.PI) * amplitude * 1.5;

    const d = `M0,${centerY} C${c1x},${c1y} ${c2x},${c2y} ${width},${centerY}`;
    svgPath.setAttribute('d', d);

    // Enhanced orb effects
    const scale = 1 + smoothedVol * 0.05;
    const brightness = 1 + smoothedVol * 0.25;
    DOM_ELEMENTS.orb.style.transform = `scale(${scale})`;
    DOM_ELEMENTS.orb.style.filter = `brightness(${brightness})`;

    animationFrameId = requestAnimationFrame(updateWave);
  }

  // --- Input Handlers ---
  function startListening() {
    isButtonHeld = true; // Mark button as held
    accumulatedTranscript = ''; // Reset transcript for new session
    
    if (!isAudioVisualizing) connectMicrophoneForVisualization();
    if (currentState === STATES.IDLE && recognition && audioStream) {
      try {
        recognition.start();
      } catch (err) {
        console.warn('Recognition start failed:', err);
        // Try to restart
        recognition.stop();
        setTimeout(() => {
          if (isButtonHeld && currentState === STATES.IDLE) {
            try {
              recognition.start();
            } catch (err2) {
              handleError("Speech recognition failed to start.");
            }
          }
        }, 100);
      }
    } else if (currentState === STATES.IDLE) {
      initMicrophone().then(setupSpeechRecognition).then(() => {
        if (isButtonHeld && currentState === STATES.IDLE) {
          try {
            recognition.start();
          } catch (err) {
            handleError("Speech recognition failed to start.");
          }
        }
      }).catch(() => handleError("Init failed."));
    } else if (currentState === STATES.LISTENING) {
      // Already listening, just mark button as held
      console.log('Already listening, button held');
    }
  }

  function stopListening() {
    isButtonHeld = false; // Mark button as released
    
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    
    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }
    
    if (recognition && currentState === STATES.LISTENING) {
      try {
        recognition.stop();
      } catch (err) {
        console.warn('Error stopping recognition:', err);
      }
    }
  }

  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  }

  // --- Event Listeners ---
  if (!isMobile()) {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && (currentState === STATES.IDLE || currentState === STATES.LISTENING)) {
        e.preventDefault();
        startListening();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        stopListening();
      }
    });
    DOM_ELEMENTS.orb.style.pointerEvents = 'none';
  } else {
    let pressTimer;
    DOM_ELEMENTS.orb.addEventListener('touchstart', (e) => {
      e.preventDefault();
      pressTimer = setTimeout(startListening, 200);
    });
    const cancel = (e) => {
      clearTimeout(pressTimer);
      e.preventDefault();
      stopListening();
    };
    DOM_ELEMENTS.orb.addEventListener('touchend', cancel);
    DOM_ELEMENTS.orb.addEventListener('touchcancel', cancel);
    DOM_ELEMENTS.orb.addEventListener('touchmove', cancel);
  }

  // --- Init ---
  function setInstructions() {
    DOM_ELEMENTS.instructions.textContent = isMobile()
      ? 'Tap and hold the orb to speak'
      : 'Hold [Space] to speak';
  }

  try {
    await initMicrophone();
    setupSpeechRecognition();
    setInstructions();
    setOrbState(STATES.IDLE);
  } catch (err) {
    handleError("Startup failed.");
  }
});