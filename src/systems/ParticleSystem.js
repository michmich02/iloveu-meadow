export class ParticleSystem {
  constructor(width, height, finalMessage = 'for you') {
    this.width = width;
    this.height = height;
    this.finalMessage = finalMessage;
    this.particles = [];
    this.swarm = [];
    // Phases: 0=inactive, 1=float, 2=heart, 3=hold, 4=burst, 5=fall, 6=formText, 7=done
    this.swarmPhase = 0;
    this.swarmPhaseTimer = 0;
    this.time = 0;
    this.onHeartFormed = null; // callback to hide grass
    this.forYouTargets = [];
    
    // ── Drawing trail (for pinch-draw heart) ──
    this.drawTrail = [];  // {x, y, alpha, age}
    this.isTrailActive = false;
    
    // ── Heart gesture waiting ──
    this.waitingForHeartGesture = false;

    this.generateForYouMask();
  }

  generateForYouMask() {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#fff';
    // Auto-size font based on text length
    const maxFontSize = Math.min(this.width / 6, 120);
    const scaledSize = Math.min(maxFontSize, this.width / (this.finalMessage.length * 0.7));
    ctx.font = `italic ${scaledSize}px "Playfair Display", "Noto Serif SC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.finalMessage, this.width / 2, this.height / 2);
    const data = ctx.getImageData(0, 0, this.width, this.height).data;
    
    // Sample target positions from the text mask
    const step = 4;
    for (let y = 0; y < this.height; y += step) {
      for (let x = 0; x < this.width; x += step) {
        const idx = (y * this.width + x) * 4;
        if (data[idx + 3] > 128) {
          this.forYouTargets.push({ x, y });
        }
      }
    }
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  addSpark(x, y) {
    // A burst of golden sparks at the interaction point
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        color: ['#f4a261', '#e76f51', '#ffd6ba', '#ff8a5c'][Math.floor(Math.random() * 4)],
        size: 1 + Math.random() * 3,
        type: 'spark'
      });
    }
  }

  spawnEmber(x, y) {
    this.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -0.5 - Math.random() * 1.5, // float up
      life: 1,
      decay: 0.01 + Math.random() * 0.02,
      color: ['#e63946', '#ff6b6b', '#f4a261'][Math.floor(Math.random() * 3)],
      size: 1 + Math.random() * 2,
      type: 'ember'
    });
  }

  spawnSmoke(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.2 - Math.random() * 0.5,
      life: 0.5, // lower initial alpha
      decay: 0.005 + Math.random() * 0.01,
      color: 'rgba(50, 40, 40, 0.4)',
      size: 5 + Math.random() * 15,
      type: 'smoke'
    });
  }

  // ── Drawing Trail (for pinch-draw) ──
  addTrailPoint(x, y) {
    this.drawTrail.push({
      x, y,
      alpha: 1,
      age: 0,
      size: 2 + Math.random() * 2
    });
    // Spawn small sparkle particles along the trail
    if (Math.random() < 0.3) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        color: ['#ffecd2', '#fcb69f', '#ff9a9e', '#ffffff'][Math.floor(Math.random() * 4)],
        size: 0.8 + Math.random() * 1.5,
        type: 'trail_sparkle'
      });
    }
  }

  clearTrail() {
    // Fade out the trail gracefully
    for (const p of this.drawTrail) {
      p.fading = true;
    }
  }

  // ── Swarm ──
  spawnFireflySwarm(blades) {
    this.swarmPhase = 1;
    this.swarmPhaseTimer = 0;

    // We want a large, dense, filled heart — spawn extra particles beyond just the blades
    const totalParticles = Math.max(Math.floor(blades.length / 2), 1000);

    for (let i = 0; i < totalParticles; i++) {
      const b = blades[i % blades.length];
      this.swarm.push({
        x: b.x + (Math.random() - 0.5) * 10,
        y: b.y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.5 - Math.random() * 1.5,
        targetX: 0,
        targetY: 0,
        phase: Math.random() * Math.PI * 2,
        alpha: 1,
        // Rose-gold / warm champagne Valentine palette
        color: ['#ffecd2', '#fcb69f', '#ff9a9e', '#ffd6ba', '#ffffff', '#f4a261'][Math.floor(Math.random() * 6)],
        size: 0.8 + Math.random() * 2.2
      });
    }

    // Pre-calculate target positions: FILLED heart, not just outline
    const heartScale = Math.min(this.width, this.height) / 5;
    const centerX = this.width / 2;
    const centerY = this.height / 2.2;

    for (let i = 0; i < this.swarm.length; i++) {
       // parametric heart equation for the outline
       const t = Math.PI * 2 * Math.random();
       const hx = 16 * Math.pow(Math.sin(t), 3);
       const hy = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
       
       // Fill the interior by scaling from center with sqrt for even distribution
       const fillFactor = Math.sqrt(Math.random());
       
       this.swarm[i].targetX = centerX + hx * heartScale / 16 * fillFactor;
       this.swarm[i].targetY = centerY - hy * heartScale / 16 * fillFactor;
    }
  }

  update(deltaTime, grassSystem) {
    this.time += deltaTime;

    // ── Update drawing trail ──
    for (let i = this.drawTrail.length - 1; i >= 0; i--) {
      const p = this.drawTrail[i];
      p.age += deltaTime;
      if (p.fading) {
        p.alpha -= 0.02;
      } else {
        // Slow natural fade
        p.alpha = Math.max(0.2, 1 - p.age * 0.0003);
      }
      if (p.alpha <= 0) {
        this.drawTrail.splice(i, 1);
      }
    }

    // Ambient fireflies
    if (Math.random() < 0.08) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 1,
        decay: 0.002 + Math.random() * 0.002,
        color: ['#ffd6ba', '#f4a261', '#fcb69f', '#ffe0cc'][Math.floor(Math.random() * 4)], // warm golden embers
        size: 1 + Math.random() * 2,
        type: 'firefly',
        phase: Math.random() * Math.PI * 2
      });
    }

    // Spawn dense golden fire particles from burning characters
    for (const blade of grassSystem.blades) {
      if (blade.state === 'burning') {
        // Dense golden sparks rising up (the main fire effect)
        if (Math.random() < 0.15) {
          this.particles.push({
            x: blade.x + (Math.random() - 0.5) * 12,
            y: blade.y + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -1 - Math.random() * 3,  // Rise upward
            life: 1,
            decay: 0.015 + Math.random() * 0.02,
            color: ['#ffd700', '#ffb800', '#ff9500', '#ffe066', '#fff4cc', '#ffcc00'][Math.floor(Math.random() * 6)],
            size: 1 + Math.random() * 2.5,
            type: 'fire_spark',
            phase: Math.random() * Math.PI * 2
          });
        }
        // Occasional larger glowing embers
        if (Math.random() < 0.03) {
          this.spawnEmber(blade.x, blade.y);
        }
      } else if (blade.state === 'igniting') {
        // Quick sparks at ignition point
        if (Math.random() < 0.08) {
          this.particles.push({
            x: blade.x + (Math.random() - 0.5) * 6,
            y: blade.y + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 2,
            vy: -0.5 - Math.random() * 2,
            life: 1,
            decay: 0.03 + Math.random() * 0.03,
            color: ['#ffcc33', '#ffe066', '#ffffff'][Math.floor(Math.random() * 3)],
            size: 0.5 + Math.random() * 1.5,
            type: 'fire_spark',
            phase: Math.random() * Math.PI * 2
          });
        }
      } else if (blade.state === 'glowing_text') {
        if (Math.random() < 0.006) {
          this.spawnEmber(blade.x, blade.y);
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.type === 'spark' || p.type === 'ember') {
        p.vx += (Math.random() - 0.5) * 0.2; // turbulence
        p.life -= p.decay;
      } 
      else if (p.type === 'fire_spark') {
        // Golden fire sparks: rise up with gentle turbulence
        p.vx += (Math.random() - 0.5) * 0.15;
        p.vy -= 0.02; // slight upward acceleration
        p.life -= p.decay;
      }
      else if (p.type === 'firefly' || p.type === 'trail_sparkle') {
        p.x += Math.sin(this.time * 0.002 + p.phase) * 0.5;
        p.y += Math.cos(this.time * 0.001 + p.phase) * 0.2;
        p.life -= p.decay;
      }
      else if (p.type === 'smoke') {
        p.size += 0.2; // Smoke expands
        p.life -= p.decay;
      }

      if (p.life <= 0 || p.y < 0 || p.x < 0 || p.x > this.width) {
        this.particles.splice(i, 1);
      }
    }

    // Update Swarm
    if (this.swarmPhase > 0 && this.swarmPhase < 7) {
       this.swarmPhaseTimer += deltaTime;
       
       // Phase transitions
       if (this.swarmPhase === 1 && this.swarmPhaseTimer > 1500) {
          this.swarmPhase = 2; // Lerp to heart
          this.swarmPhaseTimer = 0;
       } else if (this.swarmPhase === 2 && this.swarmPhaseTimer > 2500) {
          this.swarmPhase = 3; // Hold heart, wait for click
          this.swarmPhaseTimer = 0;
          if (this.onHeartFormed) this.onHeartFormed();
       }
       // Phase 3 (hold) waits for external burstHeart() call
       // Phase 4 (burst) transitions after 0.8s
       else if (this.swarmPhase === 4 && this.swarmPhaseTimer > 800) {
          this.swarmPhase = 5; // Fall
          this.swarmPhaseTimer = 0;
       }
       // Phase 5 (fall) transitions after 2s
       else if (this.swarmPhase === 5 && this.swarmPhaseTimer > 2000) {
          this.swarmPhase = 6; // Form text
          this.swarmPhaseTimer = 0;
          // Assign "for you" targets
          this.assignForYouTargets();
       }

       for (const p of this.swarm) {
         if (this.swarmPhase === 1) {
            // Swirling up organically
            p.x += Math.sin(this.time * 0.002 + p.phase) * 1.5 + p.vx;
            p.y += p.vy;
         } else if (this.swarmPhase === 2) {
            // Lerp to heart
            p.x += (p.targetX - p.x) * 0.05 * (deltaTime / 16);
            p.y += (p.targetY - p.y) * 0.05 * (deltaTime / 16);
            p.x += Math.sin(this.time * 0.005 + p.phase) * 0.3;
            p.y += Math.cos(this.time * 0.005 + p.phase) * 0.3;
         } else if (this.swarmPhase === 3) {
            // Hold heart with gentle breathing
            p.x += Math.sin(this.time * 0.003 + p.phase) * 0.4;
            p.y += Math.cos(this.time * 0.003 + p.phase) * 0.4;
         } else if (this.swarmPhase === 4) {
            // Burst explosion outward
            p.x += p.burstVx * (deltaTime / 16);
            p.y += p.burstVy * (deltaTime / 16);
            p.burstVx *= 0.96;
            p.burstVy *= 0.96;
            // Change color to petal pink
            p.color = p.petalColor;
         } else if (this.swarmPhase === 5) {
            // Gravity fall like petals
            p.burstVy = (p.burstVy || 0) + 0.05 * (deltaTime / 16);
            p.x += Math.sin(this.time * 0.003 + p.phase) * 0.8; // drift sideways
            p.y += p.burstVy * (deltaTime / 16);
            p.rotation = (p.rotation || 0) + 0.02; // tumble
         } else if (this.swarmPhase === 6) {
            // Lerp to custom final text positions
            p.x += (p.textTargetX - p.x) * 0.04 * (deltaTime / 16);
            p.y += (p.textTargetY - p.y) * 0.04 * (deltaTime / 16);
            p.x += Math.sin(this.time * 0.004 + p.phase) * 0.15;
            p.y += Math.cos(this.time * 0.004 + p.phase) * 0.15;
         }
       }
    }
  }

  burstHeart() {
    if (this.swarmPhase !== 3) return false;
    this.swarmPhase = 4;
    this.swarmPhaseTimer = 0;
    
    const centerX = this.width / 2;
    const centerY = this.height / 2.2;
    
    for (const p of this.swarm) {
      const angle = Math.atan2(p.y - centerY, p.x - centerX) + (Math.random() - 0.5) * 1.5;
      const speed = 3 + Math.random() * 8;
      p.burstVx = Math.cos(angle) * speed;
      p.burstVy = Math.sin(angle) * speed;
      p.rotation = Math.random() * Math.PI * 2;
      // Pre-assign petal colors
      p.petalColor = ['#e63946', '#ff6b6b', '#ffb3b3', '#ffd6d6', '#c1292e', '#ff8a8a'][Math.floor(Math.random() * 6)];
    }
    return true;
  }

  assignForYouTargets() {
    for (let i = 0; i < this.swarm.length; i++) {
      const target = this.forYouTargets[i % this.forYouTargets.length];
      // Add slight randomness to avoid a perfectly rigid look
      this.swarm[i].textTargetX = target.x + (Math.random() - 0.5) * 3;
      this.swarm[i].textTargetY = target.y + (Math.random() - 0.5) * 3;
      this.swarm[i].burstVy = 0;
    }
  }

  draw(ctx) {
    // ── Draw the pinch-draw trail ──
    if (this.drawTrail.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      for (let i = 1; i < this.drawTrail.length; i++) {
        const prev = this.drawTrail[i - 1];
        const curr = this.drawTrail[i];
        
        // Glowing line
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.strokeStyle = `rgba(255, 200, 180, ${curr.alpha * 0.8})`;
        ctx.lineWidth = curr.size;
        ctx.shadowColor = '#ff9a9e';
        ctx.shadowBlur = 15 * curr.alpha;
        ctx.stroke();
        
        // Bright core
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.strokeStyle = `rgba(255, 255, 240, ${curr.alpha * 0.6})`;
        ctx.lineWidth = curr.size * 0.4;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8 * curr.alpha;
        ctx.stroke();
      }
      
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // ── Heart Breathing Glow (Phase 3: Hold) ──
    if (this.swarmPhase === 3) {
      const breathe = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.time * 0.003));
      const centerX = this.width / 2;
      const centerY = this.height / 2.2;
      const heartScale = Math.min(this.width, this.height) / 5;

      // Large soft outer glow
      const outerGrad = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, heartScale * 1.8
      );
      outerGrad.addColorStop(0, `rgba(230, 57, 70, ${0.12 * breathe})`);
      outerGrad.addColorStop(0.4, `rgba(244, 162, 97, ${0.06 * breathe})`);
      outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = outerGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Tight core glow
      const coreGrad = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, heartScale * 0.6
      );
      coreGrad.addColorStop(0, `rgba(255, 200, 180, ${0.08 * breathe})`);
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      
      if (p.type === 'firefly' || p.type === 'trail_sparkle') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * (0.5 + 0.5 * Math.sin(this.time * 0.005 + p.phase));
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
      } else if (p.type === 'fire_spark') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 0.9;
        ctx.shadowBlur = 8 + p.size * 3;
        ctx.shadowColor = p.color;
      } else if (p.type === 'spark' || p.type === 'ember') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.shadowBlur = p.type === 'spark' ? 20 : 15;
        ctx.shadowColor = p.color;
      } else if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
      }
      
      ctx.fill();
    }
    
    // Draw Swarm
    for (const p of this.swarm) {
      if (p.alpha <= 0) continue;
      
      if (this.swarmPhase >= 4) {
        // Draw as petal shape
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.scale(0.7, 0.7);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        // Organic petal using bezier curves
        ctx.moveTo(0, -7);
        ctx.bezierCurveTo(4, -5, 5, 0, 0, 7);
        ctx.bezierCurveTo(-5, 0, -4, -5, 0, -7);
        ctx.fill();
        ctx.restore();
      } else {
        // Draw as glowing dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(this.time * 0.005 + p.phase));
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fill();
      }
    }
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}
