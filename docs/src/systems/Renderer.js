export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.systems = [];
    this.lastTime = performance.now();
    this.time = 0;
    
    this.activeHand = null;

    // ── Mouse position for cursor aura ──
    this.cursorX = -100;
    this.cursorY = -100;
    this.smoothCursorX = -100;
    this.smoothCursorY = -100;
    this.cursorActive = false;

    // ── Background Image ──
    this.bgImage = null;
    this.bgReady = false;
    this.loadBackgroundImage();

    // ── Star Dust (background micro-particles) ──
    this.starDust = [];
    this.initStarDust();

    // ── Bokeh Light Orbs ──
    this.bokeh = [];
    this.initBokeh();

    // ── Shooting Stars ──
    this.shootingStars = [];

    // ── Fire Trail ──
    this.trail = [];

    // ── Screen Shake ──
    this.shake = { active: false, intensity: 0, decay: 0.88, offsetX: 0, offsetY: 0 };

    // ── Film Grain ──
    this.grainCanvas = null;
    this.grainPattern = null;
    this.initGrainCanvas();

    this.buildClipPath();

    // Track mouse for cursor aura
    window.addEventListener('mousemove', (e) => {
      this.cursorX = e.clientX;
      this.cursorY = e.clientY;
      this.cursorActive = true;
    });
    window.addEventListener('mouseleave', () => { this.cursorActive = false; });

    // Hide system cursor
    this.canvas.style.cursor = 'none';
    document.body.style.cursor = 'none';

    window.addEventListener('resize', () => this.resize());
  }

  // ── Initialization ──

  loadBackgroundImage() {
    const img = new Image();
    img.onload = () => {
      this.bgImage = img;
      this.bgReady = true;
    };
    img.src = './meadow_bg.png';
  }

  initStarDust() {
    for (let i = 0; i < 120; i++) {
      this.starDust.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 0.3 + Math.random() * 1.2,
        alpha: 0.15 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        speed: 0.05 + Math.random() * 0.2
      });
    }
  }

  initBokeh() {
    // Create layered bokeh orbs at different depths
    const count = 25;
    for (let i = 0; i < count; i++) {
      const depth = Math.random(); // 0 = far, 1 = near
      this.bokeh.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        baseX: Math.random() * this.width,
        baseY: Math.random() * this.height,
        // Far orbs: small, dim. Near orbs: large, brighter
        size: 8 + depth * 50 + Math.random() * 20,
        alpha: 0.02 + depth * 0.06,
        depth: depth,
        phase: Math.random() * Math.PI * 2,
        driftSpeed: 0.003 + Math.random() * 0.008,
        // Warm color palette
        color: [
          { r: 230, g: 57, b: 70 },   // crimson
          { r: 244, g: 162, b: 97 },   // amber
          { r: 255, g: 200, b: 180 },  // peach
          { r: 200, g: 50, b: 80 },    // rose
          { r: 255, g: 140, b: 100 },  // coral
        ][Math.floor(Math.random() * 5)],
        breathePhase: Math.random() * Math.PI * 2,
        breatheSpeed: 0.001 + Math.random() * 0.002,
      });
    }
  }

  initGrainCanvas() {
    this.grainCanvas = document.createElement('canvas');
    this.grainCanvas.width = 256;
    this.grainCanvas.height = 256;
    const gCtx = this.grainCanvas.getContext('2d');
    const imageData = gCtx.createImageData(256, 256);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random() * 255;
      imageData.data[i] = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = 20;
    }
    gCtx.putImageData(imageData, 0, 0);
    this.grainPattern = this.ctx.createPattern(this.grainCanvas, 'repeat');
  }

  buildClipPath() {
    this.clipPath = new Path2D();
    const margin = 10;
    const step = 8;
    
    this.clipPath.moveTo(margin, margin);
    // Top edge (spikes pointing up)
    for(let x = margin; x <= this.width - margin; x += step) {
       this.clipPath.lineTo(x, margin - Math.random() * 20);
    }
    // Right edge (spikes pointing right)
    for(let y = margin; y <= this.height - margin; y += step) {
       this.clipPath.lineTo(this.width - margin + Math.random() * 20, y);
    }
    // Bottom edge (spikes pointing down)
    for(let x = this.width - margin; x >= margin; x -= step) {
       this.clipPath.lineTo(x, this.height - margin + Math.random() * 20);
    }
    // Left edge (spikes pointing left)
    for(let y = this.height - margin; y >= margin; y -= step) {
       this.clipPath.lineTo(margin - Math.random() * 20, y);
    }
    this.clipPath.closePath();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    this.buildClipPath();
    
    for (const sys of this.systems) {
      if (sys.resize) sys.resize(this.width, this.height);
    }
  }

  addSystem(system) {
    this.systems.push(system);
  }

  setHandData(hand) {
    this.activeHand = hand;
    // Feed hand position to GrassSystem for parallax + cursor aura
    if (hand && hand.x !== undefined) {
      this.cursorX = hand.x;
      this.cursorY = hand.y;
      this.cursorActive = true;
      for (const sys of this.systems) {
        if (sys.mouseX !== undefined) {
          sys.mouseX = hand.x / this.width;
          sys.mouseY = hand.y / this.height;
        }
      }
    }
  }

  // ── Public API ──

  addTrailPoint(x, y) {
    this.trail.push({
      x, y,
      life: 1,
      size: 3 + Math.random() * 4,
      color: Math.random() > 0.5 ? '#e63946' : '#f4a261'
    });
    // Limit trail length
    if (this.trail.length > 60) this.trail.shift();
  }

  triggerShake(intensity = 10) {
    this.shake.active = true;
    this.shake.intensity = intensity;
  }

  // ── Draw Layers ──

  drawBackground() {
    // Deep romantic gradient
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#080206');
    grad.addColorStop(0.4, '#10060c');
    grad.addColorStop(0.7, '#140810');
    grad.addColorStop(1, '#1a0c14');
    
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawStarDust(deltaTime) {
    const dt = deltaTime / 16;
    for (const s of this.starDust) {
      // Gentle upward drift
      s.y -= s.speed * dt;
      s.x += Math.sin(this.time * 0.0008 + s.phase) * 0.12;

      // Wrap around
      if (s.y < -5) {
        s.y = this.height + 5;
        s.x = Math.random() * this.width;
      }

      // Twinkle
      const twinkle = 0.3 + 0.7 * Math.sin(this.time * 0.002 + s.phase);
      const alpha = s.alpha * twinkle;

      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 210, 190, ${alpha})`;
      this.ctx.fill();
    }
  }

  // ── Bokeh Light Orbs ──
  drawBokeh(deltaTime) {
    const dt = deltaTime / 16;

    for (const b of this.bokeh) {
      // Organic floating motion
      b.x = b.baseX + Math.sin(this.time * b.driftSpeed + b.phase) * 40 * b.depth;
      b.y = b.baseY + Math.cos(this.time * b.driftSpeed * 0.7 + b.phase) * 25 * b.depth;

      // Slow vertical drift
      b.baseY -= 0.008 * dt * (1 + b.depth);
      if (b.baseY < -b.size * 2) {
        b.baseY = this.height + b.size * 2;
        b.baseX = Math.random() * this.width;
      }

      // Breathing alpha
      const breathe = 0.5 + 0.5 * Math.sin(this.time * b.breatheSpeed + b.breathePhase);
      const alpha = b.alpha * breathe;

      // Draw soft circle with radial gradient (bokeh effect)
      const grad = this.ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size);
      grad.addColorStop(0, `rgba(${b.color.r}, ${b.color.g}, ${b.color.b}, ${alpha * 0.8})`);
      grad.addColorStop(0.3, `rgba(${b.color.r}, ${b.color.g}, ${b.color.b}, ${alpha * 0.3})`);
      grad.addColorStop(0.7, `rgba(${b.color.r}, ${b.color.g}, ${b.color.b}, ${alpha * 0.08})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.fill();

      // Thin ring on the edge for that lens-bokeh look
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.size * 0.85, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(${b.color.r}, ${b.color.g}, ${b.color.b}, ${alpha * 0.3})`;
      this.ctx.lineWidth = 0.5 + b.depth;
      this.ctx.stroke();
    }
  }

  // ── Shooting Stars ──
  updateAndDrawShootingStars(deltaTime) {
    const dt = deltaTime / 16;

    // Occasionally spawn a shooting star
    if (Math.random() < 0.002) {
      const angle = -0.3 - Math.random() * 0.4; // mostly horizontal, slightly downward
      const speed = 6 + Math.random() * 10;
      this.shootingStars.push({
        x: Math.random() * this.width * 0.6,
        y: Math.random() * this.height * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.015 + Math.random() * 0.01,
        length: 60 + Math.random() * 80,
        width: 1 + Math.random() * 1.5
      });
    }

    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const s = this.shootingStars[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= s.decay;

      if (s.life <= 0) {
        this.shootingStars.splice(i, 1);
        continue;
      }

      // Draw the streak
      const tailX = s.x - (s.vx / Math.sqrt(s.vx*s.vx + s.vy*s.vy)) * s.length * s.life;
      const tailY = s.y - (s.vy / Math.sqrt(s.vx*s.vx + s.vy*s.vy)) * s.length * s.life;

      const grad = this.ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, 'rgba(255, 200, 180, 0)');
      grad.addColorStop(0.6, `rgba(255, 220, 200, ${s.life * 0.3})`);
      grad.addColorStop(1, `rgba(255, 255, 240, ${s.life * 0.8})`);

      this.ctx.beginPath();
      this.ctx.moveTo(tailX, tailY);
      this.ctx.lineTo(s.x, s.y);
      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = s.width;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();

      // Bright head glow
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 250, ${s.life * 0.9})`;
      this.ctx.shadowColor = '#ffd6ba';
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  // ── Matchstick Cursor ──
  drawCursorAura() {
    if (!this.cursorActive) return;

    this.smoothCursorX += (this.cursorX - this.smoothCursorX) * 0.18;
    this.smoothCursorY += (this.cursorY - this.smoothCursorY) * 0.18;

    const x = this.smoothCursorX;
    const y = this.smoothCursorY;
    const ctx = this.ctx;
    const t = this.time * 0.005;

    ctx.save();

    // ── Match angle: tilted ~30° like held in hand ──
    const angle = Math.PI * 0.18;
    ctx.translate(x, y);
    ctx.rotate(angle);

    // ── Wooden stick ──
    const stickLen = 65;
    const stickW = 2.2;

    // Stick body: light wood gradient
    const stickGrad = ctx.createLinearGradient(0, 4, 0, stickLen);
    stickGrad.addColorStop(0, '#5C3A1E');
    stickGrad.addColorStop(0.1, '#8B6F47');
    stickGrad.addColorStop(0.5, '#C4A574');
    stickGrad.addColorStop(1, '#DEC9A3');

    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, stickLen);
    ctx.strokeStyle = stickGrad;
    ctx.lineWidth = stickW;
    ctx.lineCap = 'round';
    ctx.stroke();

    // ── Match head (rounded bulb) ──
    const headGrad = ctx.createRadialGradient(0, 3, 0, 0, 3, 5);
    headGrad.addColorStop(0, '#2A0A00');
    headGrad.addColorStop(0.5, '#6B1A00');
    headGrad.addColorStop(1, '#4A1500');
    ctx.beginPath();
    ctx.ellipse(0, 3.5, 3, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = headGrad;
    ctx.fill();

    // ── Flame (multi-layer) ──
    const sway = Math.sin(t * 5.3) * 1.5 + Math.sin(t * 13) * 0.5;
    const flicker = 0.85 + 0.15 * Math.sin(t * 9) * Math.cos(t * 14);
    const fH = 22 * flicker;
    const fW = 7 * flicker;

    // Layer 1: ambient glow
    const glowGrad = ctx.createRadialGradient(sway, -8, 2, sway, -fH * 0.3, fH * 1.2);
    glowGrad.addColorStop(0, 'rgba(255, 180, 40, 0.25)');
    glowGrad.addColorStop(0.5, 'rgba(255, 100, 20, 0.08)');
    glowGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(sway, -fH * 0.3, fW * 2, fH * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Layer 2: outer flame (orange)
    ctx.beginPath();
    ctx.moveTo(sway, -fH);
    ctx.bezierCurveTo(
      sway - fW * 0.8, -fH * 0.55,
      sway - fW * 0.5, 1,
      sway * 0.3, 4
    );
    ctx.bezierCurveTo(
      sway + fW * 0.5, 1,
      sway + fW * 0.8, -fH * 0.55,
      sway, -fH
    );
    const outerGrad = ctx.createLinearGradient(0, 4, 0, -fH);
    outerGrad.addColorStop(0, '#E84400');
    outerGrad.addColorStop(0.4, '#FF8C00');
    outerGrad.addColorStop(0.75, '#FFB732');
    outerGrad.addColorStop(1, 'rgba(255, 230, 150, 0.6)');
    ctx.fillStyle = outerGrad;
    ctx.fill();

    // Layer 3: inner core (bright white-yellow)
    const coreH = fH * 0.55;
    const coreW = fW * 0.4;
    ctx.beginPath();
    ctx.moveTo(sway * 0.5, -coreH);
    ctx.bezierCurveTo(
      sway * 0.5 - coreW, -coreH * 0.4,
      sway * 0.3 - coreW * 0.6, 1,
      sway * 0.2, 2.5
    );
    ctx.bezierCurveTo(
      sway * 0.3 + coreW * 0.6, 1,
      sway * 0.5 + coreW, -coreH * 0.4,
      sway * 0.5, -coreH
    );
    const coreGrad = ctx.createLinearGradient(0, 2, 0, -coreH);
    coreGrad.addColorStop(0, '#FFD080');
    coreGrad.addColorStop(0.4, '#FFEFA0');
    coreGrad.addColorStop(1, '#FFFFF0');
    ctx.fillStyle = coreGrad;
    ctx.fill();

    ctx.restore();
  }

  drawFireTrail() {
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const t = this.trail[i];
      t.life -= 0.025;

      if (t.life <= 0) {
        this.trail.splice(i, 1);
        continue;
      }

      const radius = t.size * t.life;
      const alpha = t.life * 0.55;

      // Outer glow
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, radius * 2.5, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(230, 57, 70, ${alpha * 0.15})`;
      this.ctx.fill();

      // Core
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 180, 140, ${alpha})`;
      this.ctx.shadowColor = t.color;
      this.ctx.shadowBlur = 12 * t.life;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  drawVignette() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const maxDim = Math.max(this.width, this.height);

    const grad = this.ctx.createRadialGradient(
      cx, cy, maxDim * 0.25,
      cx, cy, maxDim * 0.75
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.6, 'rgba(5, 1, 3, 0.25)');
    grad.addColorStop(1, 'rgba(5, 1, 3, 0.65)');

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawFilmGrain() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'overlay';
    this.ctx.globalAlpha = 0.055;
    // Random offset each frame for animation
    const ox = Math.floor(Math.random() * 256);
    const oy = Math.floor(Math.random() * 256);
    this.ctx.translate(ox, oy);
    this.ctx.fillStyle = this.grainPattern;
    this.ctx.fillRect(-ox, -oy, this.width + 256, this.height + 256);
    this.ctx.restore();
  }

  drawHandFeedback() {
    if (!this.activeHand) return;

    const { x, y, isPinching, pinchDistance } = this.activeHand;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, 10 + (1 - pinchDistance) * 10, 0, Math.PI * 2);
    
    if (isPinching) {
      this.ctx.fillStyle = '#e63946';
      this.ctx.shadowBlur = 25;
      this.ctx.shadowColor = '#ff6b6b';
    } else {
      this.ctx.fillStyle = 'rgba(255, 160, 122, 0.5)';
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = '#f4a261';
    }
    
    this.ctx.fill();
    this.ctx.shadowBlur = 0; // Reset
  }

  // ── Main Loop ──

  start() {
    const loop = (currentTime) => {
      const deltaTime = currentTime - this.lastTime;
      this.lastTime = currentTime;
      this.time = currentTime;

      // ── Update Shake ──
      if (this.shake.active) {
        this.shake.offsetX = (Math.random() - 0.5) * this.shake.intensity;
        this.shake.offsetY = (Math.random() - 0.5) * this.shake.intensity;
        this.shake.intensity *= this.shake.decay;
        if (this.shake.intensity < 0.3) {
          this.shake.active = false;
          this.shake.offsetX = 0;
          this.shake.offsetY = 0;
        }
      }

      // Clear
      this.ctx.clearRect(0, 0, this.width, this.height);
      
      this.ctx.save();

      // Apply screen shake
      if (this.shake.active) {
        this.ctx.translate(this.shake.offsetX, this.shake.offsetY);
      }

      // Apply the irregular grass edge clipping path
      this.ctx.clip(this.clipPath);

      // Layer 1: Background (gradient + meadow image)
      this.drawBackground();

      // Layer 2: Bokeh orbs (behind everything, cinematic depth)
      this.drawBokeh(deltaTime);

      // Layer 3: Star dust
      this.drawStarDust(deltaTime);

      // Layer 4: Shooting stars
      this.updateAndDrawShootingStars(deltaTime);

      // Layer 5: Cursor aura (behind grass, illuminates nearby words)
      this.drawCursorAura();

      // Layer 6: Fire trail
      this.drawFireTrail();

      // Layer 7: Update and draw systems (grass + particles)
      for (const sys of this.systems) {
        if (sys.update) sys.update(deltaTime, ...this.systems);
      }
      
      for (const sys of this.systems) {
        if (sys.draw) sys.draw(this.ctx);
      }

      // Layer 8: Hand feedback cursor
      this.drawHandFeedback();

      // Layer 9: Vignette (darkens edges, adds focus)
      this.drawVignette();

      // Layer 10: Film grain (top overlay)
      this.drawFilmGrain();

      this.ctx.restore(); // Remove clipping + shake

      requestAnimationFrame(loop);
    };
    
    requestAnimationFrame(loop);
  }
}
