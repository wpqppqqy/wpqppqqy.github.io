const MIN_SHOW_TIME = 0;
const pageStartTime = Date.now();
let isPageLoaded = false;
window.addEventListener('load', () => {
    isPageLoaded = true;
    const timePassed = Date.now() - pageStartTime;
    if (timePassed < MIN_SHOW_TIME) {
        setTimeout(hidePreloader, MIN_SHOW_TIME - timePassed);
    } else {
        hidePreloader();
    }
});

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    preloader.classList.add('hidden');
    setTimeout(() => document.querySelector('.header-main').classList.add('move'), 500);
    setTimeout(() => preloader.remove(), 500);
}