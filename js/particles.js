// 修正示例
const urlParams = new URLSearchParams(window.location.search);
const currentScript = document.currentScript || (function(){
  // 尝试从最后一个 script 标签获取 src 作为回退（仅在需要时）
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

const canvasId = getParamString('id', null);
if (!canvasId) throw new Error('canvas id parameter is required (e.g. ?id=canvasId or script? id=...)');

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
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); // scale drawing to CSS pixels
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 参数并强制转成数值
const particleCount = Math.max(0, Math.floor(getParamNumber('count', 120)));
const connectDistance = getParamNumber('distance', 80);
const speed = getParamNumber('speed', 0.4);
const minR = getParamNumber('min', 1);
const maxR = getParamNumber('max', 3);
const lineWidth = getParamNumber('width', 0.5);
const baseAlpha = getParamNumber('a', 0.2);

// 颜色：支持传入 rgb (e.g. "100,200,255") 或 rgba (e.g. "100,200,255,0.7")
const colorParam = getParamString('rgb', getParamString('rgba', '100,200,255'));
function parseColor(c) {
  // 如果已经包含 alpha (4 parts)，返回 object，否则返回 rgb + default alpha 1
  const parts = c.split(',').map(s => s.trim());
  return {
    r: parts[0] ?? '100',
    g: parts[1] ?? '200',
    b: parts[2] ?? '255',
    a: parts[3] != null ? Number(parts[3]) : 1
  };
}
const baseColor = parseColor(colorParam);

let w = canvas.width / DPR;
let h = canvas.height / DPR;

const particles = [];

class Particle {
  constructor() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * speed * 2;
    this.vy = (Math.random() - 0.5) * speed * 2;
    this.radius = Math.random() * (maxR - minR) + minR;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    // 边界反弹并修正坐标到可见范围
    if (this.x < 0) { this.x = 0; this.vx *= -1; }
    if (this.x > w) { this.x = w; this.vx *= -1; }
    if (this.y < 0) { this.y = 0; this.vy *= -1; }
    if (this.y > h) { this.y = h; this.vy *= -1; }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${baseColor.a})`;
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
        const alpha = baseAlpha * (1 - dist / connectDistance);
        ctx.strokeStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

function loop() {
  // 更新 w/h（如果 resizeCanvas 改变了canvas大小）
  w = canvas.width / DPR;
  h = canvas.height / DPR;

  ctx.clearRect(0, 0, w, h);
  for (const p of particles) { p.update(); p.draw(); }
  drawLines();
  requestAnimationFrame(loop);
}
loop();