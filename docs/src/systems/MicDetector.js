export class MicDetector {
  constructor(onBlow) {
    this.onBlow = onBlow;
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.isListening = false;
    this.blowThreshold = 30; // Threshold for blowing detection
    this.consecutiveHighFrames = 0;
    this.requiredFrames = 5; // Need sustained high volume to count as blow
  }

  async start() {
    if (this.isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      
      this.analyser.fftSize = 256;
      this.microphone.connect(this.analyser);
      
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isListening = true;
      
      this.listenLoop();
    } catch (err) {
      console.warn('Microphone access denied or not available.', err);
    }
  }

  listenLoop() {
    if (!this.isListening) return;

    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate average volume
    let sum = 0;
    // Look mainly at lower frequencies for blowing
    for (let i = 0; i < 20; i++) {
      sum += this.dataArray[i];
    }
    const average = sum / 20;

    if (average > this.blowThreshold) {
      this.consecutiveHighFrames++;
      if (this.consecutiveHighFrames > this.requiredFrames) {
        this.onBlow();
        this.consecutiveHighFrames = 0; // Reset after triggering
      }
    } else {
      this.consecutiveHighFrames = 0;
    }

    requestAnimationFrame(() => this.listenLoop());
  }

  stop() {
    this.isListening = false;
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
