const centerText = document.querySelector('.header-center');
const HIDE_THRESHOLD = 60;
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY >= HIDE_THRESHOLD) {
        centerText.classList.add('hidden');
    } else {
        centerText.classList.remove('hidden');
    }
})