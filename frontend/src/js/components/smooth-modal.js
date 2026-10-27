/**
 * Shared open state + page-scroll lock for every full-viewport modal: the video
 * popup (_components/video-modal), the pricing payment modal and the team profile
 * panel. Open/close through the global store: $store.modal.open(id) / close().
 *
 * Follows the CropLife SA modal fix: the modal's own scroll container is the only
 * thing that scrolls (natively, overscroll contained), the dialog is centred with
 * my-auto so a tall one scrolls from its top (components/modal.css), and the page
 * lock lives in one shared place (utils/scroll-lock.js). The scroll container is
 * marked data-lenis-prevent: Lenis is stopped while a modal is open and would
 * otherwise cancel the wheel over it, which is why modals could not be scrolled.
 */
import { lockScroll, unlockScroll, preventLenis } from '../utils/scroll-lock.js'

export default function smoothModal(modalId) {
  return {
    modalId: modalId,
    isOpen: false,
    locked: false,

    scroller() {
      return this.$refs.scrollWrapper || this.$el.querySelector('.tw-modal__scroll-container')
    },

    init() {
      preventLenis(this.scroller())

      // Watch the global store for this specific modal's state
      this.$watch('$store.modal.active', (value) => {
        const isActive = value === this.modalId
        if (isActive !== this.isOpen) {
          this.isOpen = isActive
          this.toggle(isActive)
        }
      })

      if (this.$store.modal.active === this.modalId) {
        this.isOpen = true
        this.toggle(true)
      }
    },

    toggle(state) {
      const key = 'modal:' + this.modalId
      if (state) {
        this.locked = true
        lockScroll(key)
        // Hides the floating chat button while a modal is open (sidebar-menu.css)
        document.body.classList.add('overflow-hidden')
        this.$nextTick(() => {
          const el = this.scroller()
          if (el) el.scrollTop = 0
        })
      } else {
        // Wait for the leave transition (200ms) before releasing the page, so it
        // doesn't reflow underneath the modal while it is still fading out.
        setTimeout(() => {
          if (this.isOpen || !this.locked) return
          this.locked = false
          document.body.classList.remove('overflow-hidden')
          unlockScroll(key)
        }, 200)
      }
    },
  }
}
