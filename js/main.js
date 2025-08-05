document.addEventListener('DOMContentLoaded', () => {
    const orbContainer = document.querySelector('.orb-container');
    const particleField = document.querySelector('.particle-field');

    if (!orbContainer || !particleField) {
        console.error('Core elements not found!');
        return;
    }

    // --- Create Particles ---
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.setProperty('--i', i); // for staggered animations
        particleField.appendChild(particle);
    }

    // --- State Management ---
    const AUNI_STATES = {
        IDLE: 'idle',
        LISTENING: 'listening',
        THINKING: 'thinking'
    };

    let currentState = AUNI_STATES.IDLE;
    const stateClasses = Object.values(AUNI_STATES).map(s => `state--${s}`);

    function setState(newState) {
        if (!Object.values(AUNI_STATES).includes(newState)) return;

        currentState = newState;
        orbContainer.classList.remove(...stateClasses);
        orbContainer.classList.add(`state--${newState}`);
        console.log(`Auni state changed to: ${currentState}`);
    }

    orbContainer.classList.add(`state--${AUNI_STATES.IDLE}`);

    window.addEventListener('keydown', (e) => {
        switch (e.key.toLowerCase()) {
            case 'l':
                setState(AUNI_STATES.LISTENING);
                break;
            case 't':
                setState(AUNI_STATES.THINKING);
                break;
            case 'i':
            case 'escape':
                setState(AUNI_STATES.IDLE);
                break;
        }
    });

    console.log("Auni 'Living Aurora' Initialized. Press 'L' (Listen), 'T' (Think), 'I' (Idle).");
});
