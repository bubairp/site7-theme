/**
 * Gallery like styled lightbox component for presenting various types of media
 * @requires https://github.com/sachinchoolur/lightGallery
 */
import lightGallery from 'lightgallery';
import lgZoom from 'lightgallery/plugins/zoom';
import lgFullscreen from 'lightgallery/plugins/fullscreen';
import lgVideo from 'lightgallery/plugins/video';
import lgThumbnail from 'lightgallery/plugins/thumbnail';

import { lockScroll, unlockScroll } from '../utils/scroll-lock.js';

import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-fullscreen.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-video.css';

export const initGallery = () => {
  // A page's wrapper also gets its slug/section as classes, so an entry or page called
  // "gallery" is itself a .gallery around the real ones. Only bind the innermost
  // galleries; binding the wrapper too opened two lightboxes on one click (and the
  // zoom buttons then drove the hidden one).
  const gallery = [...document.querySelectorAll('.gallery')].filter(
    (el) => el !== document.body && !el.querySelector('.gallery') && !el.getAttribute('lg-uid')
  )

  for (let i = 0; i < gallery.length; i++) {
    const thumbnails = gallery[i].dataset.thumbnails ? true : false,
      video = gallery[i].dataset.video ? true : false,
      defaultPlugins = [lgZoom, lgFullscreen],
      videoPlugin = video ? [lgVideo] : [],
      thumbnailPlugin = thumbnails ? [lgThumbnail] : [],
      plugins = [...defaultPlugins, ...videoPlugin, ...thumbnailPlugin]

    lightGallery(gallery[i], {
      selector: '.gallery-item',
      plugins: plugins,
      licenseKey: 'D4194FDD-48924833-A54AECA3-D6F8E646',
      download: false,
      autoplayVideoOnSlide: true,
      zoomFromOrigin: false,
      // Zoom with the toolbar, a double-click/tap or a pinch; the scale steps stay small
      // enough that one click lands on a readable size.
      scale: 1,
      actualSize: true,
      showZoomInOutIcons: true,
      youtubePlayerParams: {
        modestbranding: 1,
        showinfo: 0,
        rel: 0,
      },
      vimeoPlayerParams: {
        byline: 0,
        portrait: 0,
        color: '6366f1',
      },
    })

    // Lenis drives page scrolling with the wheel, so pause it while the lightbox is
    // open; otherwise the page scrolls behind the image.
    gallery[i].addEventListener('lgBeforeOpen', () => lockScroll('lightbox'))
    gallery[i].addEventListener('lgAfterClose', () => unlockScroll('lightbox'))
  }
};
