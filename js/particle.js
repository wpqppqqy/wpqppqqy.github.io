const urlParams = new URLSearchParams(window.location.search);
const currentScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
})();
const scriptParams = currentScript ? new URLSearchParams(new URL(currentScript.src, location.href).search) : new URLSearchParams();

function getParamNumber(key, fallback) {
    const v = urlParams.get(key) ?? scriptParams.get(key);
    return v == null ? fallback : Number(v);
}

function getParamString(key, fallback) {
    return urlParams.get(key) ?? scriptParams.get(key) ?? fallback;
}
const canvasId = getParamString('id', particleCanvas);
const canvas = document.getElementById(canvasId);
if (!canvas) throw new Error(`Canvas element not found: ${canvasId}`);
canvas.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
`;
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('2D context not available');
let DPR = window.devicePixelRatio || 1;

function resizeCanvas() {
    DPR = window.devicePixelRatio || 1;
    const wCss = window.innerWidth;
    const hCss = window.innerHeight;
    canvas.style.width = wCss + 'px';
    canvas.style.height = hCss + 'px';
    canvas.width = Math.round(wCss * DPR);
    canvas.height = Math.round(hCss * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
const particleCount = Math.max(0, Math.floor(getParamNumber('count', 120)));
const connectDistance = getParamNumber('distance', 80);
const speed = getParamNumber('speed', 0.4);
const min = getParamNumber('min', 1);
const max = getParamNumber('max', 3);
const lineWidth = getParamNumber('width', 1);
const colorParticle = getParamString('particle', '255,255,255,1');
const colorLine = getParamString('line', '255,255,255,1')

function parseColor(c) {
    const parts = c.split(',').map(s => s.trim());
    return {
        r: parts[0] ?? '255',
        g: parts[1] ?? '255',
        b: parts[2] ?? '255',
        a: parts[3] ?? '1'
    };
}
const particleColor = parseColor(colorParticle);
const lineColor = parseColor(colorLine)
let w = canvas.width / DPR;
let h = canvas.height / DPR;
const particles = [];
class Particle {
    constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * speed * 2;
        this.vy = (Math.random() - 0.5) * speed * 2;
        this.radius = Math.random() * (max - min) + min;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        // 边界反弹并修正坐标到可见范围
        if (this.x < 0) {
            this.x = 0;
            this.vx *= -1;
        }
        if (this.x > w) {
            this.x = w;
            this.vx *= -1;
        }
        if (this.y < 0) {
            this.y = 0;
            this.vy *= -1;
        }
        if (this.y > h) {
            this.y = h;
            this.vy *= -1;
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor.r}, ${particleColor.g}, ${particleColor.b}, ${particleColor.a})`;
        ctx.fill();
    }
}
for (let i = 0; i < particleCount; i++) particles.push(new Particle());

function drawLines() {
    ctx.lineWidth = lineWidth;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectDistance) {
                ctx.strokeStyle = `rgba(${lineColor.r}, ${lineColor.g}, ${lineColor.b}, ${lineColor.a * (1 - dist / connectDistance)})`;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

function loop() {
    w = canvas.width / DPR;
    h = canvas.height / DPR;
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
        p.update();
        p.draw();
    }
    drawLines();
    requestAnimationFrame(loop);
}
loop();