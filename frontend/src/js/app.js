import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import Lenis from 'lenis';

import { initContactForm } from './components/contact-form.js';
import { initFormValidation } from './components/form-validation.js';
import { initPriceSwitch } from './components/price-switch.js';
import { initScrollTopButton } from './components/scroll-top-button.js';
import { initSmoothScroll } from './components/smooth-scroll.js';
import smoothModal from './components/smooth-modal.js';
import { initHeaderMenu } from './components/header-menu.js';
import { initSidebarMenu, sidebarMenuComponent } from './components/sidebar-menu.js';

const initTabs = () => {
    const tabGroup = document.getElementById('tabGroup');
    if (!tabGroup) return;

    const tabLinks = tabGroup.querySelectorAll('.tab-link');
    tabLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (tabGroup.querySelector('.collapse')) {
                const activeLink = tabGroup.querySelector('.tab-link.active');
                if (activeLink && activeLink !== this) {
                    activeLink.classList.remove('active');
                }
                this.classList.toggle('active');
                const activeCollapse = tabGroup.querySelector('.collapse.show');
                if (activeCollapse) {
                    activeCollapse.classList.remove('show');
                }
            }
        });
    });
};

const initHeaderHeight = () => {
    const setHeaderHeight = () => {
        const header = document.querySelector('.sticky');
        if (!header) return;

        // The collapsible search box lives inside the header, so header.offsetHeight
        // grows when it's open. On mobile, focusing the search input opens the
        // keyboard which fires a `resize`, capturing that inflated height; closing
        // the search fires no resize, so --header-height stayed stuck taller.
        // Since header.offsetHeight === baseHeight + searchField.offsetHeight at all
        // times, subtract the search field to always get the stable base height.
        let height = header.offsetHeight;
        const searchField = header.querySelector('.search-field');
        if (searchField) {
            height -= searchField.offsetHeight;
        }
        document.documentElement.style.setProperty('--header-height', `${height}px`);
    };

    window.addEventListener('load', setHeaderHeight);
    window.addEventListener('resize', setHeaderHeight);
    // Recompute after the search box opens/closes (its x-collapse animation runs
    // ~300ms) so the value stays correct even when no resize event fires.
    document.addEventListener('click', (e) => {
        if (e.target.closest('[aria-label="Search"], [aria-label="Close Search"]')) {
            setTimeout(setHeaderHeight, 350);
        }
    });
    // Run immediately
    setHeaderHeight();
};

const initLenisScroll = () => {
    if (window.innerWidth <= 1024) return; // Disable smooth scroll on mobile devices for performance

    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
    });

    const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    window.lenis = lenis;

    // Sticky Menu Logic
    const header = document.querySelector('.headerMain');
    const stickyEls = document.querySelectorAll('.sticky');
    if (!header) return;

    const hideThreshold = 250;

    const updateStickyState = (scrollTop, direction) => {
        // The Floating glass header over a banner has its own behaviour (initGlassHeader)
        if (isGlassHeader()) return;
        const menuNav = document.getElementById('menuNav');
        const offcanvasRight = document.getElementById('offcanvasRight');
        const isMenuOpen = header.classList.contains('menu-dropdown-open') ||
            header.classList.contains('menu-open') ||
            (menuNav && menuNav.classList.contains('is-nav-open')) ||
            (offcanvasRight && (offcanvasRight.classList.contains('is-open') || offcanvasRight.classList.contains('show')));

        if (scrollTop <= 0) {
            header.classList.remove('fixed', 'scrolled', 'hidden-nav');
            stickyEls.forEach(el => el.classList.remove('fixed'));
            return;
        }

        header.classList.add('scrolled');

        if (!isMenuOpen) {
            // Hide the header when scrolling down past 100px
            if (direction === 1 && scrollTop > 100) {
                header.classList.add('hidden-nav');
            } else if (direction === -1) {
                header.classList.remove('hidden-nav');
            }

            // Lock it to fixed position if we scroll past 250px, OR if we scroll up and want to reveal it
            if (scrollTop > 250 || (direction === -1 && scrollTop > 100) || header.classList.contains('fixed') && scrollTop > 100) {
                header.classList.add('fixed');
                stickyEls.forEach(el => el.classList.add('fixed'));
            } else if (scrollTop <= 0) {
                header.classList.remove('fixed');
                stickyEls.forEach(el => el.classList.remove('fixed'));
            }
        } else {
            header.classList.remove('hidden-nav');
            header.classList.add('fixed');
            stickyEls.forEach(el => el.classList.add('fixed'));
        }
    };

    updateStickyState(lenis.scroll, 0);

    lenis.on('scroll', (e) => {
        updateStickyState(e.scroll, e.direction);
    });
};

const initSliderNavItems = () => {
    const swiperEl = document.querySelector(".swiper");
    if (!swiperEl) return;
    const swiperSlides = swiperEl.querySelectorAll(".swiper-slide").length;
    let currentSlidesPerView = 1;
    const width = window.innerWidth;

    if (width >= 1200) {
        currentSlidesPerView = 4;
    } else if (width >= 860) {
        currentSlidesPerView = 3;
    } else if (width >= 500) {
        currentSlidesPerView = 2;
    }

    if (swiperSlides <= currentSlidesPerView) {
        const prevBtn = document.getElementById("popular-prev");
        const nextBtn = document.getElementById("popular-next");

        if (prevBtn) prevBtn.style.display = "none";
        if (nextBtn) nextBtn.style.display = "none";
    }
};

/**
 * Floating glass header (Header > Style > "Header over banner" = Floating glass).
 * Behaves like functionhealth.com on every page, so the whole site scrolls the same:
 * - always pinned, never hides on scroll;
 * - .thinbar-away once the page scrolls: the announcement bar slides away;
 * - .scrolled = the solid bar with its shadow. On a page that opens with a banner the
 *   bar is glass until the banner has scrolled past it (and glass again over it); on
 *   other pages it is the plain solid bar at the top and .scrolled once it scrolls.
 * With "Solid bar" the Lenis sticky logic above runs instead (hides on scroll down).
 * Uses plain scroll events, so it also runs where Lenis is off (<= 1024px).
 * Styles: components/header.css.
 */
const isGlassHeader = () => !!document.querySelector('.headerMain.header-floating-glass');

const initGlassHeader = () => {
    if (!isGlassHeader()) return;
    const header = document.querySelector('.headerMain');
    const banner = document.querySelector('#header.has-header-banner > .header-banner');
    const thinbar = header.querySelector('.header-top');

    const setThinbarHeight = () => {
        document.documentElement.style.setProperty('--header-top-height', `${thinbar ? thinbar.offsetHeight : 0}px`);
    };

    // Height of the glass bar (pill + its 16px clearance), measured once before any state
    // class is set. Using the live height would flip-flop at the boundary: the solid bar
    // is shorter, so switching to it would move its bottom back above the banner's end.
    const bar = header.querySelector('.header-main');
    const glassBarHeight = bar ? bar.offsetHeight : 0;

    let ticking = false;
    const update = () => {
        ticking = false;
        const y = window.scrollY;
        // Solid once the glass bar would sit past the bottom of the banner
        const barBottom = glassBarHeight + y;
        const bannerBottom = banner ? banner.getBoundingClientRect().bottom + y : 0;
        header.classList.remove('hidden-nav');
        header.classList.toggle('thinbar-away', y > 0);
        header.classList.toggle('scrolled', banner ? barBottom >= bannerBottom : y > 0);
    };
    const onScroll = () => {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };

    setThinbarHeight();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { setThinbarHeight(); onScroll(); });
};

const initApp = () => {
    // Initialize Alpine
    window.Alpine = Alpine;
    Alpine.plugin(collapse);
    Alpine.data('smoothModal', smoothModal);
    Alpine.data('sidebarMenu', sidebarMenuComponent);

    Alpine.store('modal', {
        active: null,
        data: {},
        open(id, data = {}) {
            this.data = data;
            this.active = id;
        },
        close() {
            this.active = null;
            this.data = {};
        }
    });

    Alpine.start();

    initLenisScroll();
    initTabs();
    initHeaderHeight();
    initGlassHeader();
    initSliderNavItems();
    initHeaderMenu();
    initSidebarMenu();
    initContactForm();
    initFormValidation();
    initPriceSwitch();
    initScrollTopButton();
    initSmoothScroll();

    // Heavy components are code-split and only loaded when the page uses them.
    // The page is visible immediately; pre-init layout for sliders is handled in
    // css/vendors/swiper.css (.swiper:not(.swiper-initialized)).
    if (document.querySelector('.swiper')) import('./components/carousel.js').then(m => m.initCarousel());
    if (document.querySelector('.gallery:not(body)')) import('./components/gallery.js').then(m => m.initGallery());
    if (document.querySelector('.masonry-grid')) import('./components/masonry-grid.js').then(m => m.initMasonryGrid());
    if (document.querySelector('[data-ba-slider]')) import('./components/before-after-slider.js').then(m => m.initBeforeAfterSlider());
};

export default initApp;