window.addEventListener('load', function() {
    const loadingEl = document.getElementById('loading');
    loadingEl.style.transition = 'opacity 0.4s ease';
    loadingEl.style.opacity = '0';
    document.body.style.opacity = '1';
    setTimeout(() => {
        loadingEl.remove();
    }, 400);
});
setTimeout(() => {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.opacity = '0';
        document.body.style.opacity = '1';
        setTimeout(() => loadingEl.remove(), 400);
    }
}, 8000);