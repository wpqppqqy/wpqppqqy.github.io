// 获取页面URL中的搜索参数
const urlParams = new URLSearchParams(window.location.search);
// 获取当前执行的脚本标签，获取不到时兜底取最后一个script标签
const currentScript = document.currentScript || (function() {
    // 尝试从最后一个 script 标签获取 src 作为回退（仅在需要时）
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
})();
// 从当前脚本的src中提取搜索参数，支持给脚本单独传配置
const scriptParams = currentScript ? new URLSearchParams(new URL(currentScript.src, location.href).search) : new URLSearchParams();

/**
 * 获取数值类型的配置参数，获取不到则返回兜底值
 * @param {string} key  参数名
 * @param {number} fallback 兜底值
 */
function getParamNumber(key, fallback) {
    // 优先读取页面URL参数，不存在则读取脚本自身URL参数
    const v = urlParams.get(key) ?? scriptParams.get(key);
    return v == null ? fallback : Number(v);
}
/**
 * 获取字符串类型的配置参数，获取不到则返回兜底值
 * @param {string} key  参数名
 * @param {string} fallback 兜底值
 */
function getParamString(key, fallback) {
    // 优先读取页面URL参数，不存在则读取脚本自身URL参数
    return urlParams.get(key) ?? scriptParams.get(key) ?? fallback;
}

// 读取目标Canvas的ID，必须传入否则抛出错误终止
const canvasId = getParamString('id', null);
if (!canvasId) throw new Error('canvas id parameter is required (e.g. ?id=canvasId or script? id=...)');

// 获取目标Canvas DOM，找不到则抛出错误终止
const canvas = document.getElementById(canvasId);
if (!canvas) throw new Error(`Canvas element not found: ${canvasId}`);

// 给Canvas设置全屏固定背景样式，置于最底层不遮挡页面内容
canvas.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
`;

// 获取Canvas 2D绘制上下文，获取失败则抛出错误终止
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('2D context not available');

// 存储当前设备像素比DPR
let DPR = window.devicePixelRatio || 1;
/** 适配画布尺寸，处理DPR解决高清屏模糊问题 */
function resizeCanvas() {
    DPR = window.devicePixelRatio || 1;
    // 获取CSS布局尺寸
    const wCss = window.innerWidth;
    const hCss = window.innerHeight;
    // 设置DOM元素布局尺寸
    canvas.style.width = wCss + 'px';
    canvas.style.height = hCss + 'px';
    // 设置Canvas实际像素尺寸（乘以DPR保证高清屏清晰度）
    canvas.width = Math.round(wCss * DPR);
    canvas.height = Math.round(hCss * DPR);
    // 缩放坐标系，让绘制时直接使用CSS坐标即可
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); // scale drawing to CSS pixels
}
// 初始化执行一次尺寸适配
resizeCanvas();
// 监听窗口大小变化，重新适配画布
window.addEventListener('resize', resizeCanvas);

// 读取动画配置，全部转换为对应数值
const particleCount = Math.max(0, Math.floor(getParamNumber('count', 120))); // 粒子总数，默认120个
const connectDistance = getParamNumber('distance', 80); // 粒子连线判定距离，默认80px
const speed = getParamNumber('speed', 0.4); // 粒子基础运动速度，默认0.4
const minR = getParamNumber('min', 1); // 粒子最小半径，默认1px
const maxR = getParamNumber('max', 3); // 粒子最大半径，默认3px
const lineWidth = getParamNumber('width', 0.5); // 连线宽度，默认0.5px
const baseAlpha = getParamNumber('a', 0.2); // 连线基础透明度，默认0.2

// -------------------------- 粒子与颜色定义 --------------------------
// 读取颜色参数，支持rgb/rgba两种命名参数，默认浅蓝色
const colorParam = getParamString('rgb', getParamString('rgba', '100,200,255'));
/**
 * 解析传入的颜色字符串
 * @param {string} c 逗号分隔的rgb/rgba字符串
 * @returns 拆分后的rgba对象
 */
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
// 解析得到基础颜色
const baseColor = parseColor(colorParam);

// 存储当前画布CSS尺寸，用于粒子边界判定
let w = canvas.width / DPR;
let h = canvas.height / DPR;

// 存储所有粒子实例的数组
const particles = [];

/** 单个粒子类，封装粒子的位置、运动和绘制逻辑 */
class Particle {
    constructor() {
        // 随机生成初始位置，铺满整个画布
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        // 随机生成运动方向，乘以速度得到最终速度
        this.vx = (Math.random() - 0.5) * speed * 2;
        this.vy = (Math.random() - 0.5) * speed * 2;
        // 随机生成粒子半径，在最小和最大值之间
        this.radius = Math.random() * (maxR - minR) + minR;
    }
    /** 更新粒子位置，处理边界反弹 */
    update() {
        this.x += this.vx;
        this.y += this.vy;
        // 碰到边界后反转速度，同时修正位置到可见范围，避免粒子卡在画布外
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
    /** 绘制单个粒子 */
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${baseColor.a})`;
        ctx.fill();
    }
}

// 生成指定数量的粒子，存入粒子数组
for (let i = 0; i < particleCount; i++) particles.push(new Particle());

/** 绘制所有满足距离条件的粒子之间的连线 */
function drawLines() {
    ctx.lineWidth = lineWidth;
    // 双重循环遍历所有粒子对，仅遍历i<j的组合避免重复计算
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            // 计算两个粒子的直线距离
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // 距离小于设定阈值，绘制连线
            if (dist < connectDistance) {
                // 距离越远透明度越低，距离等于阈值时透明度为0
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

// -------------------------- 动画循环启动 --------------------------
/** 主循环：逐帧更新并绘制整个粒子背景 */
function loop() {
    // 更新画布尺寸，适配窗口大小变化后的新尺寸
    w = canvas.width / DPR;
    h = canvas.height / DPR;

    // 清空整帧画布
    ctx.clearRect(0, 0, w, h);
    // 更新并绘制所有粒子
    for (const p of particles) {
        p.update();
        p.draw();
    }
    // 绘制粒子连线
    drawLines();
    // 请求下一帧继续执行循环
    requestAnimationFrame(loop);
}
// 启动动画
loop();