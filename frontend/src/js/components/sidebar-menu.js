import { lockScroll, unlockScroll } from '../utils/scroll-lock.js';

export const sidebarMenuComponent = () => ({
    sidebarOpen: false,

    init() {
        this.$watch('sidebarOpen', value => {
            if (value) {
                // No scrollbar-width padding needed: html has scrollbar-gutter: stable
                // (base/globals.css), so the layout doesn't shift when scroll locks.
                document.documentElement.classList.add('sidebar-open');
                document.body.classList.add('sidebar-open');
                lockScroll('sidebar');
            } else {
                // Wait for the slide-out transition (200ms) to complete before restoring scrollbars
                setTimeout(() => {
                    // Fail-safe: Make sure it wasn't re-opened while transitioning
                    if (this.sidebarOpen) return;

                    document.documentElement.classList.remove('sidebar-open');
                    document.body.classList.remove('sidebar-open');
                    unlockScroll('sidebar');
                }, 250);
            }
        });
    }
});

export const initSidebarMenu = () => {
    const sidebarNav = document.getElementById('sidebarNav');
    if (sidebarNav) {
        sidebarNav.addEventListener('click', (event) => {
            const toggleBtn = event.target.closest('.dropdown-toggle');
            const navLink = event.target.closest('.nav-link:not(.dropdown-toggle)');

            let targetLi = null;

            if (toggleBtn) {
                event.preventDefault();
                event.stopPropagation();
                targetLi = toggleBtn.closest('.dropdown') || toggleBtn.closest('li');
            } else if (navLink && (!navLink.getAttribute('href') || navLink.getAttribute('href') === '#')) {
                event.preventDefault();
                event.stopPropagation();
                targetLi = navLink.closest('.dropdown') || navLink.closest('li');
            }

            if (targetLi) {
                // Each dropdown opens/closes independently (no accordion: other
                // open dropdowns stay open).
                const isOpen = targetLi.classList.contains('is-open');

                if (isOpen) {
                    targetLi.classList.remove('is-open');
                    targetLi.querySelectorAll('.is-open').forEach(child => child.classList.remove('is-open'));
                } else {
                    targetLi.classList.add('is-open');
                }
                syncToggleState(sidebarNav);
            }
        });

        // Start with the dropdown containing the current page open, so its active
        // child is visible straight away.
        sidebarNav.querySelectorAll('li.dropdown.current-menu-ancestor').forEach(li => li.classList.add('is-open'));

        // Toggles are <a> without href: make them keyboard-reachable buttons.
        sidebarNav.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.setAttribute('role', 'button');
            toggle.setAttribute('tabindex', '0');
            const label = toggle.closest('li')?.querySelector('.menu-title')?.textContent.trim();
            if (label) toggle.setAttribute('aria-label', `${label} submenu`);
            toggle.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggle.click();
                }
            });
        });
        syncToggleState(sidebarNav);
    }
};

/** Mirror each dropdown's open state on its toggle for assistive tech. */
const syncToggleState = (root) => {
    root.querySelectorAll('li.dropdown').forEach(li => {
        const toggle = li.querySelector(':scope > .menu-group > .dropdown-toggle, :scope > .dropdown-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', li.classList.contains('is-open') ? 'true' : 'false');
    });
};
