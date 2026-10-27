/**
 * Content carousel with extensive options to control behaviour and appearance
 * @requires https://github.com/nolimits4web/swiper
 */
import Swiper from 'swiper/bundle';
import 'swiper/css/bundle';

export const initCarousel = () => {
  // forEach function
  const forEach = (array, callback, scope) => {
    for (let i = 0; i < array.length; i++) {
      callback.call(scope, i, array[i]) // passes back stuff we need
    }
  }

  // Loop mode needs more slides than are visible at once (Swiper warns and
  // drops it otherwise), so templates can always ask for a loop and short
  // carousels quietly fall back to a normal one.
  const fitLoop = (el, options) => {
    if (!options || !options.loop) return options
    const perView = [options, ...Object.values(options.breakpoints || {})]
      .map((o) => parseFloat(o.slidesPerView))
      .filter((n) => !isNaN(n))
    const maxPerView = Math.ceil(Math.max(1, ...perView))
    const slides = el.querySelectorAll(':scope > .swiper-wrapper > .swiper-slide').length
    if (slides < maxPerView + (options.slidesPerGroup || 1)) {
      return Object.assign({}, options, { loop: false })
    }
    return options
  }

  // Carousel initialisation
  const carousels = document.querySelectorAll('.swiper')
  forEach(carousels, (index, value) => {
    let options
    if (value.dataset.swiperOptions != undefined)
      options = fitLoop(value, JSON.parse(value.dataset.swiperOptions))

    // Thumbnails
    if (options && options.thumbnails) {
      const images = options.thumbnails.images
      options = Object.assign({}, options, {
        pagination: {
          el: options.thumbnails.el,
          clickable: true,
          bulletActiveClass: 'active',
          renderBullet: (index, className) => {
            return `<li class='swiper-thumbnail ${className}'>
              <img src='${images[index]}' alt='Thumbnail'>
            </li>`
          },
        },
      })
    }

    const swiper = new Swiper(value, options)  

    // Controlled slider
    if (options && options.controlledSlider) {
      const controlledSlider = document.querySelector(options.controlledSlider)
      let controlledSliderOptions

      if (controlledSlider.dataset.swiperOptions != undefined)
        controlledSliderOptions = fitLoop(
          controlledSlider,
          JSON.parse(controlledSlider.dataset.swiperOptions)
        )
       
      const swiperControlled = new Swiper(
        controlledSlider,
        controlledSliderOptions
      )
       
      swiper.controller.control = swiperControlled
    }

    // Binded content
    if (options && options.bindedContent) {
      swiper.on('activeIndexChange', (e) => {
        const targetItem = document.querySelector(
          e.slides[e.activeIndex].dataset.swiperBinded
        )
        const previousItem = document.querySelector(
          e.slides[e.previousIndex].dataset.swiperBinded
        )

        previousItem.classList.remove('active')
        targetItem.classList.add('active')
      })
    }
  })
};
