document.addEventListener('DOMContentLoaded', () => {
    const orb = document.querySelector('.orb');

    if (!orb) {
        console.error('Orb element not found!');
        return;
    }

    const AUNI_STATES = {
        IDLE: 'idle',
        LISTENING: 'is-listening',
        SPEAKING: 'is-speaking',
        LOADING: 'is-loading'
    };

    const stateClasses = Object.values(AUNI_STATES).filter(s => s !== 'idle');
    let currentState = AUNI_STATES.IDLE;
    let idleTimeout;

    function setState(newState) {
        clearTimeout(idleTimeout);
        orb.classList.remove(...stateClasses);

        if (newState !== AUNI_STATES.IDLE) {
            orb.classList.add(newState);
        }

        currentState = newState;
        console.log(`Auni state changed to: ${currentState}`);

        // Automatically return to idle after a period of activity
        if (newState !== AUNI_STATES.IDLE) {
            idleTimeout = setTimeout(() => setState(AUNI_STATES.IDLE), 4000);
        }
    }

    window.addEventListener('keydown', (e) => {
        // Use keydown for continuous actions like speaking/listening
        if (e.code === 'Space') {
            e.preventDefault();
            if (currentState !== AUNI_STATES.LISTENING) {
                setState(AUNI_STATES.LISTENING);
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            setState(AUNI_STATES.IDLE);
        }
    });

    // Use single key presses for toggle states
    window.addEventListener('keypress', (e) => {
        switch (e.key.toLowerCase()) {
            case 's':
                setState(AUNI_STATES.SPEAKING);
                break;
            case 'l':
                setState(AUNI_STATES.LOADING);
                break;
        }
    });

    console.log("Auni 'Executive Flame' Initialized. Hold [Space] to Listen. Press 'S' to Speak, 'L' to Load.");
});
