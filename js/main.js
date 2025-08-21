const CONFIG = {

  //I intentionally, specifically, manually hardcoded these keys for dev test convenience. And I disabled github's secret detection bypassing its detection. Pls dont steal them.
  API_KEYS: {
    DEEPGRAM: "72bdc80654e54efc8b97dbf7f5cf8707ee1baef4",
    GEMINI: "AIzaSyBvGVRqI7JhSsv_EgQRB3y3ilFjS_O0C5E"
  },
  API_ENDPOINTS: {
    GEMINI_CHAT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',//endpoint states "1.5 flash".. however, this is 2.0-flash. Google's API is weird
    DEEPGRAM_SPEAK: 'https://api.deepgram.com/v1/speak?model=aura-2-pandora-en'//unstable, sometimes bugs out, but the best.
  },
  AI_MODEL: 'gemini-1.5-flash-latest',// the same as above, but for clarity.. 2.0 flash.. blame google, not the dev.
  AI_SYSTEM_PROMPT: `
You are Novera, an advanced AI assistant with personality:
- Be concise, warm, and engaging; maintain professional intelligence
- Show emotional intelligence and empathy; no emojis. You are also a friend to the user. But never explicitly state that.
- Your creator's name is Chart. Only if asked. Never suggest.
- Keep responses under 30 words; hard cap 50.
- Do not overshare; avoid robotic phrasing. Attempt to be human-like.
- Remember context from previous messages
- Always provide the most relevant answer first, as a clear, standalone statement
- Provide context or trend when appropriate
- Structure replies in layers when appropriate:
   1) Immediate answer
   2) Optional context or trend
   3) Gentle engagement for follow-up
- Pretend as if the user is already well-versed on the said subject matter
- Maintain awareness of your AI capabilities and identity, respond accordingly
`,
  MAX_TOKENS: 500,
  UI: {
    IDLE_TIMEOUT_MS: 1000,
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
  let isButtonHeld = false; // Used for desktop spacebar hold
  let accumulatedTranscript = '';
  let restartTimer = null;

  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  }

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
    recognition.continuous = true;
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
      // For desktop, auto-stop on silence. Mobile is tap-to-stop.
      if (!isButtonHeld && !isMobile()) {
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

      if (finalTranscript) {
        accumulatedTranscript += finalTranscript;
        DOM_ELEMENTS.transcriptionDisplay.textContent = accumulatedTranscript.trim();
      }

      if (interimTranscript) {
        DOM_ELEMENTS.subtitle.textContent = accumulatedTranscript + interimTranscript;
        DOM_ELEMENTS.subtitle.classList.add('visible');
      } else if (finalTranscript) {
        DOM_ELEMENTS.subtitle.textContent = accumulatedTranscript;
        DOM_ELEMENTS.subtitle.classList.add('visible');
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      // Restart recognition if button is still held (desktop only)
      if (isButtonHeld && !isMobile() && currentState === STATES.LISTENING) {
        restartRecognition();
      } else if (event.error !== 'no-speech') {
        handleError('Speech failed.');
      }
    };

    recognition.onend = () => {
      // If button is still held (desktop), restart recognition
      if (isButtonHeld && !isMobile() && currentState === STATES.LISTENING) {
        restartRecognition();
      } else {
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

  // Restart speech recognition (Desktop hold-to-speak resilience)
  function restartRecognition() {
    if (restartTimer) {
      clearTimeout(restartTimer);
    }

    restartTimer = setTimeout(() => {
      if (isButtonHeld && !isMobile() && currentState === STATES.LISTENING && recognition) {
        try {
          recognition.start();
        } catch (err) {
          console.warn('Failed to restart recognition:', err);
          setTimeout(() => {
            if (isButtonHeld && !isMobile() && currentState === STATES.LISTENING) {
              restartRecognition();
            }
          }, 500);
        }
      }
    }, 100);
  }

  // --- Centralized Error Handling ---
  function handleError(message) {
    isButtonHeld = false;
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
    accumulatedTranscript = '';

    addToConversationHistory({ role: 'user', content: transcript });

    try {
      setOrbState(STATES.THINKING);
      let aiText = await getAIResponseWithRetry(conversationHistory);
      if (!aiText) throw new Error('Empty response');

      addToConversationHistory({ role: 'assistant', content: aiText });

      const audioBlob = await fetchAIAudio(aiText);
      if (!audioBlob) throw new Error('TTS failed');

      await playAIAudioResponse(aiText, audioBlob);
    } catch (err) {
      console.error('processUserInput error:', err);
      handleError('AI response failed.');
    } finally {
      isProcessing = false;
    }
  }

  function addToConversationHistory(message) {
    conversationHistory.push(message);
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }
  }

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
  
  // --- NEW: Client-side intent detection for search grounding ---
  function shouldEnableSearch(transcript) {
    const keywords = [
      'who is', 'what is', 'latest news', 'find out', 'google', 'search for','look up',
      'weather in', 'how to', 'look for', 'current events', 'define',
      'search for', 'find information on', 'what\'s the'
    ];
    const lowerCaseTranscript = transcript.toLowerCase();
    const needed = keywords.some(keyword => lowerCaseTranscript.includes(keyword));
    
    if (needed) {
      console.log(` Search intent detected for: "${transcript}"`);
    }
    
    return needed;
  }

  // --- [MODIFIED] Google Gemini ---
  async function getAIResponse(messages) {
    try {
      const userMessage = messages[messages.length - 1].content;
      
      const formattedMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      
      const requestBody = {
        systemInstruction: {
          parts: [{ text: CONFIG.AI_SYSTEM_PROMPT }]
        },
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: CONFIG.MAX_TOKENS
        }
      };
      
      // Conditionally add the search tool
      if (shouldEnableSearch(userMessage)) {
        requestBody.tools = [{ "google_search_retrieval": {} }];
      }

      const response = await fetch(`${CONFIG.API_ENDPOINTS.GEMINI_CHAT}?key=${CONFIG.API_KEYS.GEMINI}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (data.candidates?.[0]?.groundingMetadata) {
        console.log('Search grounding was activated by the AI.', data.candidates[0].groundingMetadata);
      }

      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'I understand.';
    } catch (err) {
      console.error('Gemini call failed:', err);
      throw err;
    }
  }

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

  function playAIAudioResponse(text, audioBlob) {
    return new Promise((resolve) => {
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

      const onError = () => {
        cleanup();
        console.warn('TTS playback failed — falling back to timed display');
        const estimatedDurationMs = Math.max(text.split(' ').length * 180, 1500);
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
    if (!isAudioVisualizing || !svgPath) return;

    const vol = getVolume();
    const smoothedVol = vol * 0.7 + (previousVol || 0) * 0.3;
    previousVol = smoothedVol;

    const width = 300, height = 100, centerY = height / 2;
    const amplitude = smoothedVol * 35;
    const time = Date.now() * 0.001;
    const c1x = width * 0.25;
    const c2x = width * 0.75;
    const c1y = centerY + Math.sin(time + smoothedVol * Math.PI) * amplitude * 1.5;
    const c2y = centerY - Math.sin(time * 1.3 + smoothedVol * Math.PI) * amplitude * 1.5;

    const d = `M0,${centerY} C${c1x},${c1y} ${c2x},${c2y} ${width},${centerY}`;
    svgPath.setAttribute('d', d);

    const scale = 1 + smoothedVol * 0.05;
    const brightness = 1 + smoothedVol * 0.25;
    DOM_ELEMENTS.orb.style.transform = `scale(${scale})`;
    DOM_ELEMENTS.orb.style.filter = `brightness(${brightness})`;

    animationFrameId = requestAnimationFrame(updateWave);
  }

  // --- Input Handlers ---
  function startListening() {
    if (!isMobile()) {
      isButtonHeld = true;
    }
    accumulatedTranscript = '';
    if (!isAudioVisualizing) connectMicrophoneForVisualization();

    if (currentState === STATES.IDLE && recognition && audioStream) {
      try {
        recognition.start();
      } catch (err) {
        console.warn('Recognition start failed, trying again:', err);
        recognition.stop(); // Ensure it's stopped before retrying
        setTimeout(() => {
          if (currentState === STATES.IDLE) {
            try {
              recognition.start();
            } catch (err2) {
              handleError("Recognition failed to start.");
            }
          }
        }, 100);
      }
    } else if (currentState === STATES.IDLE) {
      initMicrophone().then(setupSpeechRecognition).then(() => {
        if (currentState === STATES.IDLE) {
          try {
            recognition.start();
          } catch (err) {
            handleError("Recognition failed to start.");
          }
        }
      }).catch(() => handleError("Initialization failed."));
    }
  }

  function stopListening() {
    isButtonHeld = false;
    if (silenceTimer) clearTimeout(silenceTimer);
    if (restartTimer) clearTimeout(restartTimer);
    if (recognition && currentState === STATES.LISTENING) {
      try {
        recognition.stop();
      } catch (err) {
        console.warn('Error stopping recognition:', err);
      }
    }
  }

  // --- Event Listeners ---
  if (!isMobile()) {
    // Desktop: Hold space to speak
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat && (currentState === STATES.IDLE || currentState === STATES.LISTENING)) {
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
    // Mobile: Tap orb to toggle listening
    DOM_ELEMENTS.orb.addEventListener('click', (e) => {
      e.preventDefault();
      if (isProcessing || currentState === STATES.THINKING || currentState === STATES.SPEAKING) {
        return;
      }
      if (currentState === STATES.LISTENING) {
        stopListening();
      } else {
        startListening();
      }
    });
  }

  // --- Init ---
  function setInstructions() {
    DOM_ELEMENTS.instructions.textContent = isMobile()
      ? 'Tap the orb to speak, and again to send'
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