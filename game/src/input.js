// ============================================================================
// Grand Theft Auto 6 - Arcade Edition: Comprehensive Input Controller
// ============================================================================
// Captures and processes keyboard, mouse, and touch interactions for both on-foot
// open-world movement and high-speed vehicular physics.
// Controls:
// - Movement & Steering: WASD / Arrow Keys
// - Sprint: Left/Right Shift
// - Handbrake / Melee Attack: Spacebar
// - Enter / Exit Vehicle (Carjacking): E and F
// - Weapon Selection: Digits 1 to 5 (1: Fist, 2: Pistol, 3: Uzi, 4: Shotgun, 5: M16)
// - Horn: H
// - Radio Station Toggle: R
// - Pause Game: P and Escape
// - Aim & Fire: Mouse coordinates & Left Click / Pointer down

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER_EXIT = 4;
export const ACTION_HORN = 8;
export const ACTION_RADIO = 16;
export const ACTION_FIRE = 32;

// Key Sets for robust multi-layout support
const KEYS_UP = new Set(['KeyW', 'ArrowUp']);
const KEYS_DOWN = new Set(['KeyS', 'ArrowDown']);
const KEYS_LEFT = new Set(['KeyA', 'ArrowLeft']);
const KEYS_RIGHT = new Set(['KeyD', 'ArrowRight']);
const KEYS_SPRINT = new Set(['ShiftLeft', 'ShiftRight']);
const KEYS_SPACE = new Set(['Space']);
const KEYS_ENTER_EXIT = new Set(['KeyE', 'KeyF']);
const KEYS_HORN = new Set(['KeyH']);
const KEYS_RADIO = new Set(['KeyR']);
const KEYS_PAUSE = new Set(['KeyP', 'Escape']);
const KEYS_CONFIRM = new Set(['Enter', 'Space']);

const WEAPON_KEYS = {
  Digit1: 0, // Fist
  Numpad1: 0,
  Digit2: 1, // Pistol
  Numpad2: 1,
  Digit3: 2, // Uzi
  Numpad3: 2,
  Digit4: 3, // Shotgun
  Numpad4: 3,
  Digit5: 4, // M16
  Numpad5: 4,
};

/**
 * Creates the global game input manager attached to the viewport canvas.
 * Maps screen pointer coordinates accurately into the 1280x720 virtual canvas.
 *
 * @param {HTMLCanvasElement} canvas - Target rendering canvas
 */
export function createInput(canvas) {
  // Continuous state tracking
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let sprint = false;
  let handbrake = false;
  let horn = false;
  let radio = false;
  let mouseDown = false;

  // One-shot actions queued between simulation frames
  let queuedActions = 0;
  let requestedWeaponIndex = null;
  let enterExitTriggered = false;
  let radioTriggered = false;
  let hornTriggered = false;

  // Mouse virtual screen position (1280x720 coordinate space)
  let mouseX = 640;
  let mouseY = 360;

  /**
   * Transforms raw DOM client pointer coordinates into the 1280x720 virtual display coordinates.
   */
  function updatePointerPosition(clientX, clientY) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const scale = Math.min(rect.width / 1280, rect.height / 720);
    const offsetX = (rect.width - 1280 * scale) / 2;
    const offsetY = (rect.height - 720 * scale) / 2;

    const canvasX = (clientX - rect.left - offsetX) / scale;
    const canvasY = (clientY - rect.top - offsetY) / scale;

    mouseX = Math.max(0, Math.min(1280, canvasX));
    mouseY = Math.max(0, Math.min(720, canvasY));
  }

  // Window-level key listeners
  function handleKeyDown(event) {
    const code = event.code;

    if (KEYS_UP.has(code)) up = true;
    else if (KEYS_DOWN.has(code)) down = true;
    else if (KEYS_LEFT.has(code)) left = true;
    else if (KEYS_RIGHT.has(code)) right = true;
    else if (KEYS_SPRINT.has(code)) sprint = true;
    else if (KEYS_SPACE.has(code)) {
      handbrake = true;
      if (!event.repeat) queuedActions |= ACTION_CONFIRM;
    } else if (KEYS_ENTER_EXIT.has(code)) {
      if (!event.repeat) {
        enterExitTriggered = true;
        queuedActions |= ACTION_ENTER_EXIT;
      }
    } else if (KEYS_HORN.has(code)) {
      horn = true;
      if (!event.repeat) {
        hornTriggered = true;
        queuedActions |= ACTION_HORN;
      }
    } else if (KEYS_RADIO.has(code)) {
      if (!event.repeat) {
        radio = true;
        radioTriggered = true;
        queuedActions |= ACTION_RADIO;
      }
    } else if (KEYS_PAUSE.has(code)) {
      if (!event.repeat) queuedActions |= ACTION_PAUSE;
    } else if (KEYS_CONFIRM.has(code)) {
      if (!event.repeat) queuedActions |= ACTION_CONFIRM;
    }

    if (code in WEAPON_KEYS) {
      requestedWeaponIndex = WEAPON_KEYS[code];
    }

    // Prevent scrolling with arrows or spacebar
    if (
      KEYS_UP.has(code) ||
      KEYS_DOWN.has(code) ||
      KEYS_LEFT.has(code) ||
      KEYS_RIGHT.has(code) ||
      KEYS_SPACE.has(code)
    ) {
      event.preventDefault();
    }
  }

  function handleKeyUp(event) {
    const code = event.code;
    if (KEYS_UP.has(code)) up = false;
    else if (KEYS_DOWN.has(code)) down = false;
    else if (KEYS_LEFT.has(code)) left = false;
    else if (KEYS_RIGHT.has(code)) right = false;
    else if (KEYS_SPRINT.has(code)) sprint = false;
    else if (KEYS_SPACE.has(code)) handbrake = false;
    else if (KEYS_HORN.has(code)) horn = false;
    else if (KEYS_RADIO.has(code)) radio = false;
  }

  function handleBlur() {
    up = false;
    down = false;
    left = false;
    right = false;
    sprint = false;
    handbrake = false;
    horn = false;
    radio = false;
    mouseDown = false;
  }

  function handlePointerDown(event) {
    mouseDown = true;
    updatePointerPosition(event.clientX, event.clientY);
    queuedActions |= ACTION_CONFIRM | ACTION_FIRE;
  }

  function handlePointerUp(event) {
    mouseDown = false;
    updatePointerPosition(event.clientX, event.clientY);
  }

  function handlePointerMove(event) {
    updatePointerPosition(event.clientX, event.clientY);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
  }

  if (canvas) {
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  return {
    /**
     * Backward-compatible horizontal direction (-1, 0, 1),
     * enhanced with full input property accessors for modern modules.
     */
    direction() {
      const h = (right ? 1 : 0) - (left ? 1 : 0);
      const state = this.getState();
      state.valueOf = () => h;
      return state;
    },

    /**
     * Returns a snapshot of the current input state.
     */
    getState() {
      const moveX = (right ? 1 : 0) - (left ? 1 : 0);
      const moveY = (down ? 1 : 0) - (up ? 1 : 0);
      const enterExit = enterExitTriggered;
      const radioToggle = radioTriggered;
      const hornActive = horn;
      const weaponIdx = requestedWeaponIndex;

      // Reset one-shot triggers
      enterExitTriggered = false;
      radioTriggered = false;
      requestedWeaponIndex = null;

      return {
        moveX,
        moveY,
        up,
        down,
        left,
        right,
        sprint,
        handbrake,
        space: handbrake,
        enterExit,
        horn: hornActive,
        radio: radioToggle,
        weaponIndex: weaponIdx,
        mouseX,
        mouseY,
        mouseDown,
        shooting: mouseDown,
      };
    },

    /**
     * Retrieves and clears one-shot action bitflags.
     */
    takeActions() {
      const taken = queuedActions;
      queuedActions = 0;
      return taken;
    },

    /**
     * Direct mouse coordinates accessor.
     */
    getMouse() {
      return { x: mouseX, y: mouseY, down: mouseDown };
    },

    /**
     * Destructor to cleanly detach DOM listeners if re-instantiated.
     */
    destroy() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleBlur);
      }
      if (canvas) {
        canvas.removeEventListener('pointerdown', handlePointerDown);
        canvas.removeEventListener('pointerup', handlePointerUp);
        canvas.removeEventListener('pointermove', handlePointerMove);
      }
    },
  };
}
