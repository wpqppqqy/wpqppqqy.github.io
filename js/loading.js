const MIN_SHOW_TIME = 500;
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
document.querySelector('.header-center').classList.add('move');
    setTimeout(() => preloader.remove(), 600);
}