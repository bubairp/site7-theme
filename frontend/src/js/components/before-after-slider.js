/**
 * Before/After Slider (templates/_blocks/beforeAfterSlider.twig)
 *
 * Each comparison is a native range input laid over two stacked images, so the
 * browser already handles mouse, touch and keyboard (arrows, Page Up/Down, Home,
 * End) and announces the value. This only mirrors the value into --ba-position,
 * which clips the before image and places the divider, and keeps aria-valuetext
 * readable ("Before 40%, After 60%"). One delegated listener serves every slider
 * on the page, including ones added later, with no ids.
 */

/** A position 0-100 from any value; anything unreadable is the middle. */
export const clampPosition = (value) => {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
};

/** What a screen reader hears for a position. */
export const valueText = (beforeLabel, afterLabel, position) => {
  const p = clampPosition(position);
  return `${beforeLabel || 'Before'} ${p}%, ${afterLabel || 'After'} ${100 - p}%`;
};

const update = (range) => {
  const slider = range.closest('[data-ba-slider]');
  if (!slider) return;
  const position = clampPosition(range.value);
  slider.style.setProperty('--ba-position', `${position}%`);
  range.setAttribute('aria-valuetext', valueText(range.dataset.beforeLabel, range.dataset.afterLabel, position));
};

let bound = false;

export const initBeforeAfterSlider = (root = document) => {
  // A value the browser restored (back/forward) wins over the server's start position
  root.querySelectorAll('[data-ba-slider] .ba-slider__range').forEach(update);
  if (bound) return;
  bound = true;
  document.addEventListener('input', (event) => {
    if (event.target instanceof HTMLInputElement && event.target.matches('.ba-slider__range')) {
      update(event.target);
    }
  });
};
