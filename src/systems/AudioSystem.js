export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.fireGain = null;
    
    // Nodes
    this.noiseSource = null;
    this.fireFilter = null;
    
    // State
    this.isInitialized = false;
    this.isBurning = false;
    this.crackleInterval = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.5; // Overall volume

      // --- Fire ambient rumble ---
      const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Brown noise approximation
        const white = Math.random() * 2 - 1;
        data[i] = (this.lastOut || 0) + (0.02 * white) / 1.02;
        this.lastOut = data[i];
        data[i] *= 3.5; // compensate gain
      }

      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = buffer;
      this.noiseSource.loop = true;
      
      this.fireFilter = this.ctx.createBiquadFilter();
      this.fireFilter.type = 'lowpass';
      this.fireFilter.frequency.value = 400; // Warm low rumble
      
      this.fireGain = this.ctx.createGain();
      this.fireGain.gain.value = 0; // Starts silent

      this.noiseSource.connect(this.fireFilter);
      this.fireFilter.connect(this.fireGain);
      this.fireGain.connect(this.masterGain);
      
      this.noiseSource.start();
      
      this.isInitialized = true;
      
      // Start the crackle loop
      this.startCrackleLoop();
      
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  startCrackleLoop() {
    const playCrackle = () => {
      if (this.isBurning && this.ctx && this.ctx.state === 'running') {
        // Only play crackle randomly
        if (Math.random() > 0.4) {
          this.playSingleCrackle();
        }
      }
      // Random interval between 50ms and 300ms
      const nextTime = 50 + Math.random() * 250;
      this.crackleInterval = setTimeout(playCrackle, nextTime);
    };
    playCrackle();
  }

  playSingleCrackle() {
    // Sharp high-pass filtered noise burst
    const dur = 0.05 + Math.random() * 0.1;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    // Instead of true noise, a rapid freq sweep mimics a snap/crackle
    osc.type = 'square';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + dur);
    
    filter.type = 'bandpass';
    filter.frequency.value = 1000 + Math.random() * 2000;
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3 + Math.random() * 0.3, this.ctx.currentTime + dur * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  setBurning(burning) {
    if (!this.isInitialized) {
      if (burning) this.init(); // Initialize on first interaction
      else return;
    }
    
    if (this.ctx.state === 'suspended' && burning) {
      this.ctx.resume();
    }

    if (burning !== this.isBurning) {
      this.isBurning = burning;
      
      // Fade in/out the rumble
      const now = this.ctx.currentTime;
      this.fireGain.gain.cancelScheduledValues(now);
      if (burning) {
        this.fireGain.gain.linearRampToValueAtTime(1.0, now + 0.5);
      } else {
        this.fireGain.gain.linearRampToValueAtTime(0, now + 1.0);
      }
    }
  }
}
