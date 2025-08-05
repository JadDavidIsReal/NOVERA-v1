document.addEventListener('DOMContentLoaded', () => {
    const orb = document.querySelector('.orb');

    if (!orb) {
        console.error('Orb element not found!');
        return;
    }

    const AUNI_STATES = {
        IDLE: 'idle',
        LISTENING: 'listening',
        THINKING: 'thinking'
    };

    let currentState = AUNI_STATES.IDLE;
    const stateClasses = Object.values(AUNI_STATES).map(s => `orb--${s}`);

    function setState(newState) {
        if (!Object.values(AUNI_STATES).includes(newState)) {
            return;
        }

        currentState = newState;
        orb.classList.remove(...stateClasses);
        orb.classList.add(`orb--${newState}`);
        console.log(`Auni state changed to: ${currentState}`);
    }

    // Set a default class for idle animations to hook into
    orb.classList.add(`orb--${AUNI_STATES.IDLE}`);

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

    console.log("Auni Interface Initialized. Press 'L' (Listen), 'T' (Think), 'I' (Idle).");
});
