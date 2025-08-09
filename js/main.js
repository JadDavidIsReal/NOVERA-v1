/**
 * Novera - Refactored Core Logic
 * Pure static, no frameworks.
 * STT: Web Speech API (only)
 * TTS: Deepgram
 * LLM: TogetherAI
 * Runs directly from GitHub Pages.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- API Keys (Hardcoded, as requested) ---
  const DEEPGRAM_KEY = "72bdc80654e54efc8b97dbf7f5cf8707ee1baef4";
  const TOGETHER_API_KEY = "tgp_v1_r2rYPrNc_5JHCSKwwWJdsCkJh2JoLfTpiiRBsIpDD2g";

  // --- DOM Elements ---
  const orb = document.querySelector('.orb');
  const subtitle = document.querySelector('.subtitle');
  const transcriptionDisplay = document.querySelector('.transcription');
  const instructions = document.querySelector('.instructions');

  if (!orb || !subtitle || !transcriptionDisplay) {
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

  // --- Initialize Microphone Once ---
  async function initMicrophone() {
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted.');
    } catch (err) {
      console.error('Mic access denied:', err);
      setOrbState(STATES.ERROR);
      subtitle.textContent = 'Microphone required.';
    }
  }

  // --- Setup Web Speech API ---
  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported.');
      subtitle.textContent = 'Speech not supported.';
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setOrbState(STATES.LISTENING);
      transcriptionDisplay.textContent = '';
    };

    recognition.onresult = (e) => {
      let final = '';
      let interim = '';

      for (let i = 0; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += transcript + ' ';
        else interim += transcript;
      }

      transcriptionDisplay.textContent = final + interim;
    };

    recognition.onerror = (e) => {
      console.error('Speech error:', e.error);
      setOrbState(STATES.ERROR);
      subtitle.textContent = 'Speech recognition failed.';
    };

    recognition.onend = () => {
      if (currentState === STATES.LISTENING) {
        const transcript = transcriptionDisplay.textContent.trim();
        if (transcript) {
          processUserInput(transcript);
        } else {
          setOrbState(STATES.IDLE);
        }
      }
    };
  }

  // --- State Management ---
  function setOrbState(newState) {
    // Clear previous state
    Object.values(STATES).forEach(s => {
      if (s.name !== 'idle') orb.classList.remove(`orb--${s.name}`);
    });
    subtitle.classList.remove('visible');

    // Set new state
    if (newState.name !== 'idle') {
      orb.classList.add(`orb--${newState.name}`);
      subtitle.textContent = newState.text;
      setTimeout(() => subtitle.classList.add('visible'), 50);
    }

    currentState = newState;
    console.log('Novera state:', newState.name);
  }

  // --- AI Interaction Flow ---
  async function processUserInput(transcript) {
    setOrbState(STATES.THINKING);

    try {
      const aiText = await getAIResponse(transcript);
      if (!aiText) throw new Error('Empty AI response');

      const audioBlob = await fetchAIAudio(aiText);
      if (!audioBlob) throw new Error('TTS failed');

      playAIAudioResponse(aiText, audioBlob);
    } catch (err) {
      console.error('AI flow error:', err);
      setOrbState(STATES.ERROR);
      subtitle.textContent = 'AI response failed.';
      setTimeout(() => setOrbState(STATES.IDLE), 3000);
    }
  }

  // --- TogetherAI: LLM Inference ---
  async function getAIResponse(userInput) {
    try {
      const res = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
          messages: [
            { role: 'system', content: 'You are Novera, an elegant, concise, and efficient AI assistant. Respond clearly and briefly.' },
            { role: 'user', content: userInput }
          ],
          max_tokens: 300
        })
      });

      if (!res.ok) throw new Error(`LLM error: ${await res.text()}`);
      const data = await res.json();
      return data.choices[0].message.content.trim();
    } catch (err) {
      console.error('LLM call failed:', err);
      return null;
    }
  }

  // --- Deepgram: TTS (Text-to-Speech) ---
  async function fetchAIAudio(text) {
    try {
      const res = await fetch('https://api.deepgram.com/v1/speak?model=aura-athena-en', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!res.ok) throw new Error(`TTS error: ${await res.text()}`);
      return await res.blob();
    } catch (err) {
      console.error('TTS fetch failed:', err);
      return null;
    }
  }

  // --- Play AI Audio ---
  function playAIAudioResponse(text, audioBlob) {
    setOrbState(STATES.SPEAKING);
    subtitle.textContent = text;
    subtitle.classList.add('visible');

    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.play();

    audio.addEventListener('ended', () => {
      subtitle.classList.add('fade-out');
      setTimeout(() => {
        subtitle.textContent = '';
        subtitle.classList.remove('fade-out');
        setOrbState(STATES.IDLE);
        transcriptionDisplay.textContent = '';
      }, 1500);
    });

    audio.addEventListener('error', () => {
      setOrbState(STATES.ERROR);
      subtitle.textContent = 'Audio playback error.';
    });
  }

  // --- Input Handlers ---
  function startListening() {
    if (currentState === STATES.IDLE && recognition && audioStream) {
      recognition.start();
    }
  }

  function stopListening() {
    if (recognition && currentState === STATES.LISTENING) {
      recognition.stop();
    }
  }

  // --- Device Detection ---
  function isMobile() {
    return window.innerWidth <= 768;
  }

  // --- Event Listeners ---
  if (!isMobile()) {
    // Desktop: Spacebar push-to-talk
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
    // Mobile: Tap-and-hold orb
    orb.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startListening();
    });
    orb.addEventListener('touchend', (e) => {
      e.preventDefault();
      stopListening();
    });
  }

  // --- Init on Load ---
  function setInstructions() {
    if (instructions) {
      instructions.textContent = isMobile()
        ? 'Tap and hold the orb to speak'
        : 'Hold [Space] to speak';
    }
  }

  initMicrophone();
  setupSpeechRecognition();
  setInstructions();
  setOrbState(STATES.IDLE);

  console.log('Novera initialized.');
});