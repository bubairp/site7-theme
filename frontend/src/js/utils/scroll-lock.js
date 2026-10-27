/**
 * One page-scroll lock for every overlay: modals (smooth-modal.js), the sidebar
 * menu, the mobile menu and the gallery lightbox. Each caller locks under its
 * own key, so overlays can stack and closing one never unlocks the page while
 * another is still open.
 *
 * How it locks:
 * - html.scroll-locked { overflow: hidden } (base/globals.css). Hiding overflow
 *   on the root reliably stops the viewport; on body it depends on propagation.
 *   The page is not pinned with position: fixed (the CropLife SA approach)
 *   because the sticky header would drop out of view under the overlay.
 * - Lenis is stopped. A stopped Lenis cancels every wheel event outside
 *   [data-lenis-prevent], so each overlay's own scroll area must carry that
 *   attribute (preventLenis() below), or it can't be scrolled at all.
 * - html has scrollbar-gutter: stable, so the page width doesn't change.
 */
const owners = new Set()

export const lockScroll = (key) => {
  owners.add(key)
  if (owners.size !== 1) return
  document.documentElement.classList.add('scroll-locked')
  window.lenis?.stop()
}

export const unlockScroll = (key) => {
  if (!owners.delete(key) || owners.size) return
  document.documentElement.classList.remove('scroll-locked')
  window.lenis?.start()
}

/** Let the wheel reach an overlay's own scroll area while Lenis is stopped */
export const preventLenis = (el) => el?.setAttribute('data-lenis-prevent', '')
