// Action-button factories for the Quick-Add (+ / ★) and Quick-Remove (x) buttons.
// Loaded as a content script (before thumbnail-buttons.js) where it defines its
// factories as globals on `window`. This module owns the button *styling* and the
// `⋯`/`✓`/`x` feedback state machine the three buttons used to re-declare inline;
// it does NOT own insertion — finding the container, setting position:relative and
// appendChild stay at the call site.
//
// Each factory returns a handle `{ el, pending, success, error }`:
//   pending() → `⋯` with a lightened background.
//   success() → `✓`, locked terminal state (the clone trick strips all listeners).
//               Add buttons only — Quick-Remove never calls it.
//   error()   → flash the baked error glyph red, then self-revert to idle after
//               1500ms (the timer lives here).

// Glassmorphism palette — translucent fills sitting behind a blurred, saturated
// backdrop (Apple "liquid glass"). The fill is the only thing the state machine
// swaps; the frosted border / shadow / blur live in GLASS_STYLE below and are
// baked into each button's cssText, so every state stays glassy.
const ADD_IDLE_BG = 'rgba(28, 28, 30, 0.45)';
const ADD_HOVER_BG = 'rgba(255, 255, 255, 0.28)';
const REMOVE_IDLE_BG = 'rgba(255, 59, 48, 0.42)';
const REMOVE_HOVER_BG = 'rgba(255, 99, 90, 0.55)';
const PENDING_BG = 'rgba(255, 255, 255, 0.32)';
const SUCCESS_BG = 'rgba(48, 209, 88, 0.55)';   // Apple green glass
const ERROR_BG = 'rgba(255, 69, 58, 0.55)';     // Apple red glass
const ERROR_REVERT_MS = 1500;

// Frosted-glass decoration shared by both buttons: a blurred + saturated backdrop,
// a bright hairline border, a soft drop shadow, and inset highlights that give the
// glass its specular top edge and shaded bottom. The glyph text-shadow keeps the
// symbol legible over bright thumbnails.
const GLASS_STYLE = `
    border: 0.5px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22),
                inset 0 1px 1px rgba(255, 255, 255, 0.55),
                inset 0 -1px 2px rgba(0, 0, 0, 0.22);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    backdrop-filter: blur(12px) saturate(180%);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  `;

// Build the `{ el, pending, success, error }` handle around a styled button. The
// idle glyph/background and the error glyph are baked per factory so error()
// knows what to revert to.
function makeFeedbackHandle(el, { idleGlyph, idleBg, errorGlyph }) {
  return {
    el,
    pending() {
      el.innerHTML = '⋯';
      el.style.background = PENDING_BG;
    },
    success() {
      el.innerHTML = '✓';
      el.style.background = SUCCESS_BG;
      el.style.cursor = 'default';
      el.disabled = true;
      // Strip hover/click listeners by replacing the node with a clone: this is
      // the terminal state, the button never reacts again.
      el.replaceWith(el.cloneNode(true));
    },
    error() {
      el.innerHTML = errorGlyph;
      el.style.background = ERROR_BG;
      setTimeout(() => {
        el.innerHTML = idleGlyph;
        el.style.background = idleBg;
      }, ERROR_REVERT_MS);
    },
  };
}

// The 32px dark round Quick-Add button (used for both `+` → Watch Later and
// `★` → Target Playlist). `position` is `{ top, right }`. With `disabled: true`
// it renders the greyed, non-clickable empty state (the `★` empty state): no
// hover, no click handler, just a hint tooltip.
function makeAddButton({ glyph, position, title, onClick, disabled }) {
  const el = document.createElement('button');
  el.innerHTML = glyph;
  el.style.cssText = `
    position: absolute;
    top: ${position.top};
    right: ${position.right};
    width: 32px;
    height: 32px;
    background: ${ADD_IDLE_BG};
    color: white;
    border-radius: 50%;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    transform: scale(1);
    ${GLASS_STYLE}
  `;
  if (title) el.title = title;

  if (disabled) {
    // Greyed, non-clickable empty state: no hover/click handlers are wired, so
    // the button does nothing when clicked.
    el.style.opacity = '0.4';
    el.style.cursor = 'default';
    el.style.pointerEvents = 'none';
    el.disabled = true;
    return makeFeedbackHandle(el, { idleGlyph: glyph, idleBg: ADD_IDLE_BG, errorGlyph: 'x' });
  }

  el.addEventListener('mouseenter', () => {
    el.style.background = ADD_HOVER_BG;
    el.style.transform = 'scale(1.05)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.background = ADD_IDLE_BG;
    el.style.transform = 'scale(1)';
  });
  if (onClick) el.addEventListener('click', onClick);

  return makeFeedbackHandle(el, { idleGlyph: glyph, idleBg: ADD_IDLE_BG, errorGlyph: 'x' });
}

// The 24px crimson round Quick-Remove button. `position` is `{ top, right }`.
// mousedown/dragstart prevention is baked because playlist items are draggable
// and the button must not start a drag. Idle glyph is `x`; error glyph is `!`.
// Quick-Remove never reaches success() — the caller animates the item out.
function makeRemoveButton({ position, onClick }) {
  const el = document.createElement('button');
  el.innerHTML = 'x';
  el.style.cssText = `
    position: absolute;
    top: ${position.top};
    right: ${position.right};
    width: 24px;
    height: 24px;
    background: ${REMOVE_IDLE_BG};
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    transform: scale(1);
    pointer-events: auto;
    ${GLASS_STYLE}
  `;

  el.addEventListener('mouseenter', () => {
    el.style.background = REMOVE_HOVER_BG;
    el.style.transform = 'scale(1.05)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.background = REMOVE_IDLE_BG;
    el.style.transform = 'scale(1)';
  });

  // Playlist items are draggable; keep the button from starting a drag.
  el.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
  el.addEventListener('dragstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  if (onClick) el.addEventListener('click', onClick);

  return makeFeedbackHandle(el, { idleGlyph: 'x', idleBg: REMOVE_IDLE_BG, errorGlyph: '!' });
}
