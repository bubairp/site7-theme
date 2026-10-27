/**
 * The theme's JavaScript, imported by the site's src/index.js.
 */
import initApp from './app';
import Payments from './payments';

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    window.Payments = new Payments();
});
