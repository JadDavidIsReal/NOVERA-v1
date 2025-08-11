/**
 * Novera - Final Core
 * Pure static. No frameworks.
 * Voice-first. Executive polish.
 * Runs on GitHub Pages.
 */

const CONFIG = {
  API_KEYS: {
    DEEPGRAM: "72bdc80654e54efc8b97dbf7f5cf8707ee1baef4",
    TOGETHER: "tgp_v1_r2rYPrNc_5JHCSKwwWJdsCkJh2JoLfTpiiRBsIpDD2g"
  },
  API_ENDPOINTS: {
    TOGETHER_CHAT: 'https://api.together.xyz/v1/chat/completions',
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

  async function initMicrophone() {
    try {
      if (!audioStream) {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err) {
      console.error('Mic access denied:', err);
      handleError('Microphone required.');
    }
  }

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
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + ' ';
        }
      }
      DOM_ELEMENTS.transcriptionDisplay.textContent = transcript.trim();
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        handleError('Speech failed.');
      }
    };

    recognition.onend = () => {
      if (currentState === STATES.LISTENING) {
        setTimeout(() => {
          const transcript = DOM_ELEMENTS.transcriptionDisplay.textContent.trim();
          if (transcript) processUserInput(transcript);
          else setOrbState(STATES.IDLE);
        }, 100);
      }
    };
  }

  function handleError(message) {
    setOrbState(STATES.ERROR);
    DOM_ELEMENTS.subtitle.textContent = message;
    DOM_ELEMENTS.transcriptionDisplay.textContent = '';
    setTimeout(() => {
      if (currentState === STATES.ERROR) setOrbState(STATES.IDLE);
    }, CONFIG.UI.IDLE_TIMEOUT_MS);
  }

  async function processUserInput(transcript) {
    if (isProcessing) return;
    isProcessing = true;

    try {
      setOrbState(STATES.THINKING);
      const aiText = await getAIResponse(transcript);
      if (!aiText) throw new Error('Empty response');

      const audioBlob = await fetchAIAudio(aiText);
      if (!audioBlob) throw new Error('TTS failed');

      await playAIAudioResponse(aiText, audioBlob);
    } catch (err) {
      handleError('AI response failed.');
      isProcessing = false;
    }
  }

  async function getAIResponse(userInput) {
    const res = await fetch(CONFIG.API_ENDPOINTS.TOGETHER_CHAT, {
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

    if (!res.ok) throw new Error(`LLM error: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  async function fetchAIAudio(text) {
    const res = await fetch(CONFIG.API_ENDPOINTS.DEEPGRAM_SPEAK, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${CONFIG.API_KEYS.DEEPGRAM}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!res.ok) throw new Error(`TTS error: ${await res.text()}`);
    return await res.blob();
  }

  function playAIAudioResponse(text, audioBlob) {
    return new Promise((resolve) => {
      setOrbState(STATES.SPEAKING);
      DOM_ELEMENTS.subtitle.textContent = text;
      DOM_ELEMENTS.subtitle.classList.add('visible');
      DOM_ELEMENTS.transcriptionDisplay.textContent = '';

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      const cleanup = () => {
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        URL.revokeObjectURL(audioUrl);
      };

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
        handleError('Playback error.');
        isProcessing = false;
        resolve();
      };

      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      audio.play().catch(onError);
    });
  }

  // Web Audio for Visualization
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let animationFrameId = null;
  let isAudioVisualizing = false;

  const svgPath = document.querySelector('.wave');

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
      console.warn('Visualization failed:', err);
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
    const width = 300, height = 100, centerY = height / 2;
    const amplitude = vol * 30;
    const c1x = width * 0.25, c2x = width * 0.75;
    const c1y = centerY + Math.sin(vol * Math.PI) * amplitude * 1.5;
    const c2y = centerY - Math.sin(vol * Math.PI) * amplitude * 1.5;

    const d = `M0,${centerY} C${c1x},${c1y} ${c2x},${c2y} ${width},${centerY}`;
    svgPath.setAttribute('d', d);

    DOM_ELEMENTS.orb.style.transform = `scale(${1 + vol * 0.03})`;
    DOM_ELEMENTS.orb.style.filter = `brightness(${1 + vol * 0.15})`;

    animationFrameId = requestAnimationFrame(updateWave);
  }

  const originalStartListening = () => {
    if (!isAudioVisualizing) connectMicrophoneForVisualization();
    if (currentState === STATES.IDLE && recognition && audioStream) {
      recognition.start();
    } else if (currentState === STATES.IDLE) {
      initMicrophone().then(setupSpeechRecognition).then(() => {
        if (currentState === STATES.IDLE) recognition.start();
      }).catch(() => handleError("Init failed."));
    }
  };

  function stopListening() {
    if (recognition && currentState === STATES.LISTENING) {
      recognition.stop();
    }
  }

  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  }

  // Input Handlers
  if (!isMobile()) {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && currentState === STATES.IDLE) {
        e.preventDefault();
        originalStartListening();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && currentState === STATES.LISTENING) {
        e.preventDefault();
        stopListening();
      }
    });
    DOM_ELEMENTS.orb.style.pointerEvents = 'none';
  } else {
    let pressTimer;
    DOM_ELEMENTS.orb.addEventListener('touchstart', (e) => {
      e.preventDefault();
      pressTimer = setTimeout(originalStartListening, 200);
    });
    const cancel = (e) => {
      clearTimeout(pressTimer);
      if (currentState === STATES.LISTENING) {
        e.preventDefault();
        stopListening();
      }
    };
    DOM_ELEMENTS.orb.addEventListener('touchend', cancel);
    DOM_ELEMENTS.orb.addEventListener('touchcancel', cancel);
    DOM_ELEMENTS.orb.addEventListener('touchmove', cancel);
  }

  // Init
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