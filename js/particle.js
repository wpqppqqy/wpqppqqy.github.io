const currentScript = document.currentScript;
const params = new URLSearchParams(new URL(currentScript.src).search);
const canvas = document.getElementById(params.get('id'));
canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -1;
`;
const ctx = canvas.getContext('2d');
let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;
const particles = [];
const particleCount = params.get('count') ?? 120;
const connectDistance = params.get('distance') ?? 80;
// 初始化粒子
class Particle {
    constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * (params.get('speed') ?? 0.4) * 2;
        this.vy = (Math.random() - 0.5) * (params.get('speed') ?? 0.4) * 2;
        this.radius = Math.random() * (+(params.get('max') ?? 3) - +(params.get('min') ?? 1)) + +(params.get('min') ?? 1);
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        // 边界反弹
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${params.get('rgba') ?? '100, 200, 255, 0.7'})`;
        ctx.fill();
    }
}
// 生成粒子实例
for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}
// 绘制粒子连线
function drawLines() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectDistance) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${params.get('rgb') ?? '100, 200, 255'}, ${(params.get('a') ?? 0.2) * (1 - dist / connectDistance)})`;
                ctx.lineWidth = params.get('width') ?? 0.5;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}
// 动画循环
function loop() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    drawLines();
    requestAnimationFrame(loop);
}
// 响应式适配
window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
});
loop();