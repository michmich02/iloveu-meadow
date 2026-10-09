export class GrassSystem {
  constructor(width, height, hiddenMessage = 'I ♥ you', audioSystem = null) {
    this.width = width;
    this.height = height;
    this.hiddenMessage = hiddenMessage;
    this.audioSystem = audioSystem;
    this.chars = [];     // Each character individually tracked
    this.time = 0;
    this.textMask = null;
    
    this.isExtinguished = false;
    this.hidden = false;

    // ── Parallax ──
    this.mouseX = 0.5;
    this.mouseY = 0.5;
    this.smoothMouseX = 0.5;
    this.smoothMouseY = 0.5;

    // ── 3D Depth transition ──
    this.depthMode = false;
    this.depthTransition = 0;
    this.depthTransitionSpeed = 0.0008;
    this.hazeAlpha = 0;

    // ── Love letter — continuous dense text ──
    this.letterText = [
      "Dear you, to the one who holds my heart in ways words can never fully capture — I have been carrying these feelings inside me for longer than you know. Every single day you cross my mind in a thousand quiet moments, and each time my heart beats a little faster, a little louder, a little more certain that this is real.",
      "I don't know exactly when it all started. Maybe it was the way you laughed that afternoon when the sunlight caught your eyes just right, or maybe it was the way you said my name, so softly and so easily, as if it was the most natural thing in the world to say. All I know is that somewhere along the way, you became the first person I think of when I wake up and the last thought before I fall asleep.",
      "I remember every little detail about that day. The way the light fell through the window, the way your hair moved when you turned to look at me, the way the world seemed to slow down just for a moment so I could memorize the exact shape of your smile. I didn't know it then, but that was the moment everything changed.",
      "I have tried so many times to pretend that I don't feel this way, to convince myself that this is nothing more than a passing thought, a temporary feeling that would fade with time. But every time you walk into a room, the whole world falls silent, and suddenly you are the only thing I can see, the only voice I can hear, the only person who matters in this entire universe.",
      "I love the way you get so completely lost in the things you care about, the way your eyes light up when you talk about your dreams. I love the way you tilt your head slightly when you're deep in thought, the way you make everyone around you feel seen and understood without even trying. I love the way your laughter fills a room with warmth, the way you pause before you speak when something really matters, the way kindness seems to live naturally in everything you do.",
      "There are so many little things about you that I have memorized without meaning to. The way you hold your cup with both hands when it's cold, the way you hum songs you don't even realize you're humming, the way your voice gets softer when you're telling someone something important, the way you look at the sky when you need a moment to breathe.",
      "I notice the way you always check on the people you love even when you're the one having a hard day. The way you apologize for things that aren't your fault because you care too much about how others feel. The way you carry the weight of the world on your shoulders and still find a way to smile at strangers.",
      "I remember the first time we stayed up talking until the sun came up and neither of us wanted to say goodbye. I remember how the air felt different that night, like the whole world had gone quiet just so it could listen to us. I keep that memory somewhere safe inside me, and I take it out on the days when I miss you the most.",
      "You make me want to be braver than I am. You make me want to try harder, dream bigger, love deeper. Before you, I didn't know that a single person could change the entire color of my world. But you did, and now everything I see is softer, warmer, more beautiful — because you're in it.",
      "I think about all the places I want to take you. The quiet bookshops with dusty shelves and warm light, the rooftops where we could watch the city breathe at night, the beaches where the waves sound like they're whispering secrets only we can understand, the small cafes where time doesn't seem to exist.",
      "I think about lazy Sunday mornings with you, when neither of us has anywhere to be and the whole world is just the space between us. I think about rainy afternoons and shared blankets and the comfortable silence that comes from being with someone who feels like home.",
      "I have written you a hundred letters I never sent. I have typed out a thousand messages I deleted before hitting send. I have rehearsed a million different ways to tell you how I feel. But every single time I look at you, all the words just disappear, and all that's left is this feeling — this overwhelming, undeniable, beautiful feeling that refuses to stay silent any longer.",
      "So I hid everything I wanted to say right here, in this moment, hidden behind these burning letters, waiting for you to find it, buried inside every single spark and every dancing particle of light. A secret written in fire, meant only for your eyes.",
      "If you would let me, I would be the one who stays. The one who holds your hand through every storm and every sunset. The one who remembers how you take your coffee and what songs make you cry. I would be the one who shows up on your worst days and your best days, the one who learns your silences and loves your chaos, the one who chooses you over and over and over again without a single moment of hesitation.",
      "I want to be the person you call at 2am when you can't sleep, the one who drives you home when you're too tired, the one who knows exactly which words to say and which ones to hold back. I want to build a thousand ordinary days with you that somehow feel extraordinary just because you're there.",
      "I want to learn every version of you — the morning version who hates alarms, the late night version who whispers secrets, the brave version and the scared version, the silly version and the serious one. I want all of it. I want all of you.",
      "I want to be there for all of your firsts and your lasts and everything in between. I want to know what makes you laugh until you cry and what keeps you awake at three in the morning. I want to know your favorite constellations and the songs you sing in the shower and the dreams you've never told anyone.",
      "Sometimes I wonder if you can feel it too — this invisible thread that pulls me toward you no matter where I am. Sometimes I catch you looking at me and I forget how to breathe, and I wonder if maybe, just maybe, your heart is saying the same things mine has been screaming all along.",
      "I wonder if you know how often I replay our conversations in my head, searching for hidden meanings in every pause, every smile, every accidental touch. I wonder if you have any idea how completely and thoroughly and irreversibly you have changed my life just by being in it.",
      "There are nights when I lie awake thinking about what it would feel like to hold your hand without letting go, to fall asleep listening to your breathing, to wake up and know that the first face I see is yours. Those thoughts keep me company in the dark.",
      "I know the world is wide and the future is beautifully uncertain, but I would walk through all of it with you — slowly, gently, patiently — from this heartbeat to the next, from this breath to forever, from the person I am today to whoever I become, as long as I become that person beside you.",
      "I promise to celebrate your victories like they are my own, to hold you through your tears without trying to fix everything, to laugh at your terrible jokes and mean it, to never stop choosing you even on the days when love feels more like a quiet Tuesday than a fireworks show.",
      "I promise to remember the small things — the way you like your toast, the playlist that helps you fall asleep, the exact spot on your back where you carry all your stress. I promise to pay attention to the things no one else notices, because those are the things that make you, you.",
      "I promise to fight for us even when it's hard, to choose patience when I want to scream, to choose understanding when I want to be right, to choose love over pride every single time.",
      "Because you are the answer to a question I didn't even know I was asking. You are the reason I believe that something this extraordinary can exist between two people in this vast, spinning, impossible universe. You are the proof that magic is real.",
      "You don't need to be perfect — you never did — you just need to be you. Thank you for existing in the same world, in the same timeline, in the same story as me. Thank you for being the reason I believe in something truly and deeply beautiful.",
      "I don't know what tomorrow looks like, but I know I want you in it. I know that whatever comes next, I want to face it standing next to you, holding your hand, with your laughter as the soundtrack to my life.",
      "If I could freeze any moment in time, it would be every moment I've ever spent with you. Not the grand ones or the dramatic ones, but the quiet ones — the ones where we were just existing in the same space, breathing the same air, sharing the same silence.",
      "This is my heart, laid bare and burning, right here in front of you. Every word is true. Every spark is real. And if you look closely enough, you will find the words I have been too afraid to say —",
    ].join(" ");

    this.generateTextMask();
    this.generateChars();

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX / this.width;
      this.mouseY = e.clientY / this.height;
    });
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.generateTextMask();
    this.generateChars();
  }

  generateTextMask() {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    const maxFontSize = Math.min(this.width / 3, 300);
    const scaledSize = Math.min(maxFontSize, this.width / (this.hiddenMessage.length * 0.6));
    ctx.font = `italic ${scaledSize}px "Playfair Display", "Noto Serif SC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.hiddenMessage, this.width / 2, this.height / 2);

    this.textMask = ctx.getImageData(0, 0, this.width, this.height).data;
  }

  isPixelInText(x, y) {
    if (!this.textMask) return false;
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    if (xi < 0 || xi >= this.width || yi < 0 || yi >= this.height) return false;
    const index = (yi * this.width + xi) * 4;
    return this.textMask[index + 3] > 128;
  }

  generateChars() {
    this.chars = [];

    // ── Word-wrap the letter to fill the screen with margins ──
    const padding = 120;
    const availableWidth = this.width - padding * 2;
    const availableHeight = this.height - padding * 2;

    // Choose font size: small, dense text with no gaps
    const targetRows = Math.round(availableHeight / 22);
    const fontSize = Math.floor(availableHeight / (targetRows * 1.15));
    const lineHeight = Math.floor(fontSize * 1.15);
    const indentWidth = fontSize * 2; // Paragraph indent

    const measureCanvas = document.createElement('canvas');
    const mCtx = measureCanvas.getContext('2d');
    mCtx.font = `${fontSize}px "Playfair Display", "Noto Serif SC", serif`;

    // Simple word-wrap: continuous dense text, no paragraph breaks
    const words = this.letterText.split(' ').filter(w => w);
    const wrappedLines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const testWidth = mCtx.measureText(testLine).width;

      if (testWidth > availableWidth && currentLine) {
        wrappedLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) wrappedLines.push(currentLine);

    const startY = padding + fontSize * 0.6;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    for (let lineIdx = 0; lineIdx < wrappedLines.length; lineIdx++) {
      const line = wrappedLines[lineIdx];
      const y = startY + lineIdx * lineHeight;
      if (y > this.height - padding) break;
      let x = padding;

      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const ch = line[charIdx];
        const charWidth = mCtx.measureText(ch).width;

        if (ch !== ' ') {
          const dx = x - cx;
          const dy = y - cy;
          const distFromCenter = Math.sqrt(dx * dx + dy * dy) / maxDist;

          // Depth layer for 3D transition
          let depthLayer;
          const rnd = Math.random();
          if (distFromCenter > 0.65 && rnd < 0.3) depthLayer = 2;
          else if (distFromCenter < 0.35 && rnd < 0.4) depthLayer = 0;
          else depthLayer = 1;

          if (depthLayer === 2 && Math.random() > 0.4) depthLayer = 1;

          const depth3D = this.getDepthProperties(depthLayer, distFromCenter);

          this.chars.push({
            char: ch,
            x: x, y: y,
            flatX: x, flatY: y,
            depthX: x + dx * (depthLayer === 2 ? 0.2 : depthLayer === 0 ? -0.05 : 0.05),
            depthY: y + dy * (depthLayer === 2 ? 0.2 : depthLayer === 0 ? -0.05 : 0.05),
            lineIdx,
            charIdx,
            depthLayer,
            depth3D,
            distFromCenter,
            flatFontSize: fontSize,
            flatAlpha: 0.85 + Math.random() * 0.15,  // High alpha — readable white text
            swayPhase: Math.random() * Math.PI * 2,
            driftPhase: Math.random() * Math.PI * 2,
            state: 'normal',  // 'normal', 'igniting', 'burning', 'glowing_text', 'dissolved'
            ignitionTime: 0,
            burnDuration: 2500 + Math.random() * 2000,
            isText: this.isPixelInText(x + charWidth / 2, y),
          });
        }

        x += charWidth;
      }
    }

    // Sort by depth layer for 3D mode
    // But keep a reference to original order for proper rendering
    this.chars.sort((a, b) => a.depthLayer - b.depthLayer);
  }

  getDepthProperties(layer, distFromCenter) {
    const configs = [
      { // FAR
        fontSize: 9 + Math.random() * 3,
        alpha: 0.1 + Math.random() * 0.08,
        color: { r: 90, g: 18, b: 25 },
        swaySpeed: 0.0003, swayAmount: 0.6,
        driftSpeed: 0.005, parallaxFactor: 0.008, blur: 0.4
      },
      { // MID
        fontSize: 14 + Math.random() * 8,
        alpha: 0.3 + Math.random() * 0.2,
        color: { r: 145, g: 32, b: 42 },
        swaySpeed: 0.0006, swayAmount: 1.8,
        driftSpeed: 0.01, parallaxFactor: 0.025, blur: 0
      },
      { // NEAR
        fontSize: 50 + Math.random() * 40,
        alpha: 0.12 + Math.random() * 0.1,
        color: { r: 180, g: 40, b: 50 },
        swaySpeed: 0.001, swayAmount: 5.0,
        driftSpeed: 0.018, parallaxFactor: 0.08,
        blur: 3 + Math.random() * 3
      }
    ];
    const cfg = configs[layer];
    if (distFromCenter < 0.25) cfg.alpha *= 0.3;
    return cfg;
  }

  morphToDepthBackground() {
    this.depthMode = true;
  }

  // ── Blades-compatible API (used by interaction.js) ──
  get blades() { return this.chars; }

  igniteAt(x, y, radius = 30) {
    if (this.isExtinguished) return false;
    const now = Date.now();
    let ignitedAny = false;

    for (const ch of this.chars) {
      if (ch.state === 'normal') {
        const dx = ch.x - x;
        const dy = ch.y - y;
        if (dx * dx + dy * dy < radius * radius) {
          ch.state = 'igniting';
          ch.ignitionTime = now + Math.random() * 60;
          ignitedAny = true;
        }
      }
    }
    return ignitedAny;
  }

  isTextFullyGlowing() {
    if (this.isExtinguished) return false;
    const hasIgniting = this.chars.some(c => c.state === 'igniting');
    const hasBurning = this.chars.some(c => c.state === 'burning');
    const hasGlowing = this.chars.some(c => c.state === 'glowing_text');
    return !hasIgniting && !hasBurning && hasGlowing;
  }

  extinguishFire(particleSystem) {
    // Collect burning characters as firefly sources, so they burst from the flames!
    let glowingChars = [];
    for (const ch of this.chars) {
      if (ch.state === 'burning' || ch.state === 'igniting' || ch.state === 'glowing_text') {
        glowingChars.push(ch);
      }
      ch.state = 'dissolved';
    }
    
    // Fallback: if they somehow triggered it with no fire, use the text mask
    if (glowingChars.length === 0) {
      for (const ch of this.chars) {
        if (ch.isText) glowingChars.push(ch);
      }
    }
    if (glowingChars.length > 0 && !this.isExtinguished) {
      this.isExtinguished = true;
      this.morphToDepthBackground();
      if (particleSystem) {
        particleSystem.spawnFireflySwarm(glowingChars);
      }
    }
  }

  update(deltaTime) {
    this.time += deltaTime;
    const now = Date.now();

    // Parallax
    this.smoothMouseX += (this.mouseX - this.smoothMouseX) * 0.04;
    this.smoothMouseY += (this.mouseY - this.smoothMouseY) * 0.04;
    const centerOffsetX = (this.smoothMouseX - 0.5);
    const centerOffsetY = (this.smoothMouseY - 0.5);

    // Depth transition
    if (this.depthMode && this.depthTransition < 1) {
      this.depthTransition = Math.min(1, this.depthTransition + this.depthTransitionSpeed * deltaTime);
      this.hazeAlpha = this.depthTransition * 0.15;
    }

    const t = this.depthTransition;

    for (const ch of this.chars) {
      const d3 = ch.depth3D;

      // Position interpolation
      const baseX = ch.flatX * (1 - t) + ch.depthX * t;
      const baseY = ch.flatY * (1 - t) + ch.depthY * t;

      const parallax = t * (d3.parallaxFactor || 0.025);
      const parallaxX = centerOffsetX * this.width * parallax;
      const parallaxY = centerOffsetY * this.height * parallax;

      const driftScale = 0.3 + t * 0.7;
      const driftX = Math.sin(this.time * (d3.driftSpeed || 0.01) + ch.driftPhase) * driftScale;
      const driftY = Math.cos(this.time * (d3.driftSpeed || 0.01) * 0.7 + ch.driftPhase) * driftScale * 0.6;

      ch.x = baseX + parallaxX + driftX;
      ch.y = baseY + parallaxY + driftY;

      // State transitions
      if (ch.state === 'igniting' && now > ch.ignitionTime) {
        ch.state = 'burning';
      } else if (ch.state === 'burning') {
        if (now - ch.ignitionTime > ch.burnDuration) {
          ch.state = ch.isText ? 'glowing_text' : 'dissolved';
        }
      }
    }
    
    // Update audio system based on fire presence
    if (this.audioSystem) {
      const hasFire = this.chars.some(c => c.state === 'burning' || c.state === 'igniting');
      this.audioSystem.setBurning(hasFire);
    }
  }

  draw(ctx) {
    if (this.hidden) return;
    const now = Date.now();
    const t = this.depthTransition;

    ctx.textBaseline = 'middle';

    for (const ch of this.chars) {
      if (ch.state === 'dissolved') continue;

      const d3 = ch.depth3D;

      // Font size interpolation
      const fontSize = Math.round(ch.flatFontSize * (1 - t) + d3.fontSize * t);
      const weight = ch.depthLayer === 0 ? '300' : ch.depthLayer === 2 ? '600' : '400';
      const fontStyle = t > 0.5 ? 'italic' : '';
      ctx.font = `${fontStyle} ${weight} ${fontSize}px "Playfair Display", "Noto Serif SC", serif`;
      ctx.textAlign = 'left';

      const drawX = ch.x;
      const drawY = ch.y;

      // ── Normal — clean white/cream readable text ──
      if (ch.state === 'normal') {
        if (t < 0.01) {
          // Flat mode: clean poem text
          ctx.fillStyle = `rgba(220, 210, 200, ${ch.flatAlpha})`;
        } else {
          // Transitioning to depth mode
          const dr = 220 * (1 - t) + d3.color.r * t;
          const dg = 210 * (1 - t) + d3.color.g * t;
          const db = 200 * (1 - t) + d3.color.b * t;
          let alpha = ch.flatAlpha * (1 - t) + d3.alpha * t;
          const twinkle = 0.7 + 0.3 * Math.sin(this.time * 0.001 + ch.swayPhase * 3);
          alpha *= twinkle;
          ctx.fillStyle = `rgba(${Math.floor(dr)}, ${Math.floor(dg)}, ${Math.floor(db)}, ${alpha})`;

          const blur = d3.blur * t;
          if (blur > 0.5) {
            ctx.shadowColor = `rgba(${Math.floor(dr)}, ${Math.floor(dg)}, ${Math.floor(db)}, ${alpha * 0.5})`;
            ctx.shadowBlur = blur * 3;
          }
        }
        ctx.fillText(ch.char, drawX, drawY);
        ctx.shadowBlur = 0;
      }
      // ── Igniting — yellow spark flash ──
      else if (ch.state === 'igniting') {
        const sparkle = 0.5 + 0.5 * Math.sin(now * 0.04 + ch.swayPhase);
        ctx.fillStyle = `rgba(255, 220, 80, ${sparkle})`;
        ctx.shadowColor = '#ffcc33';
        ctx.shadowBlur = 10;
        ctx.fillText(ch.char, drawX, drawY);
        ctx.shadowBlur = 0;
      }
      // ── Burning — golden fire consuming the character ──
      else if (ch.state === 'burning') {
        const progress = (now - ch.ignitionTime) / ch.burnDuration;

        if (ch.isText) {
          // Hidden message chars burn bright white-gold
          const r = 255;
          const g = Math.floor(220 - progress * 80);
          const b = Math.floor(100 - progress * 60);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
          ctx.shadowColor = `rgba(255, ${Math.floor(180 - progress * 80)}, 50, 0.9)`;
          ctx.shadowBlur = 18;
        } else {
          // Poem text burns away: white → gold → orange → fade
          if (progress < 0.3) {
            const p = progress / 0.3;
            ctx.fillStyle = `rgba(255, ${Math.floor(255 - 50 * p)}, ${Math.floor(200 - 120 * p)}, 1)`;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
          } else if (progress < 0.6) {
            const p = (progress - 0.3) / 0.3;
            ctx.fillStyle = `rgba(255, ${Math.floor(200 - 120 * p)}, ${Math.floor(80 - 60 * p)}, ${1 - p * 0.3})`;
            ctx.shadowColor = '#ff8c00';
            ctx.shadowBlur = 12 * (1 - p * 0.3);
          } else {
            const p = (progress - 0.6) / 0.4;
            ctx.fillStyle = `rgba(${Math.floor(200 - 150 * p)}, ${Math.floor(60 - 50 * p)}, ${Math.floor(20 - 15 * p)}, ${0.7 - p * 0.7})`;
            ctx.shadowColor = '#e63946';
            ctx.shadowBlur = 6 * (1 - p);
          }
        }
        ctx.fillText(ch.char, drawX, drawY);
        ctx.shadowBlur = 0;
      }
      // ── Glowing text (hidden message revealed) ──
      else if (ch.state === 'glowing_text') {
        const flicker = 0.7 + 0.3 * Math.sin(now * 0.008 + ch.swayPhase * 10);
        ctx.fillStyle = `rgba(255, ${Math.floor(180 + flicker * 40)}, ${Math.floor(80 + flicker * 40)}, ${flicker})`;
        ctx.shadowColor = '#ffa040';
        ctx.shadowBlur = 20 * flicker;
        ctx.fillText(ch.char, drawX, drawY);
        ctx.shadowBlur = 0;
      }
    }

    // ── Atmospheric haze for depth mode ──
    if (t > 0.05) {
      const hcx = this.width / 2;
      const hcy = this.height / 2;
      const maxR = Math.max(this.width, this.height) * 0.5;
      const hazeGrad = ctx.createRadialGradient(hcx, hcy, 0, hcx, hcy, maxR);
      hazeGrad.addColorStop(0, `rgba(15, 5, 10, ${this.hazeAlpha * 0.8})`);
      hazeGrad.addColorStop(0.3, `rgba(10, 3, 8, ${this.hazeAlpha * 0.3})`);
      hazeGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
      hazeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }
}
