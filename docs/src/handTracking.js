export class HandTracking {
  constructor(videoElement, onReady) {
    this.videoElement = videoElement;
    this.onReady = onReady;
    
    // Callbacks
    this.onPinchStart = null;
    this.onPinchEnd = null;
    this.onHandUpdate = null;
    this.onHeartGestureDetected = null;
    
    this.isPinched = false;
    this.pinchThreshold = 0.05; // Normalized distance

    // ── Heart gesture detection ──
    this.heartGestureActive = false;
    this.heartGestureStartTime = 0;
    this.heartGestureRequiredMs = 150; // Instantly responsive heart gesture
    this.heartGestureEnabled = false; // Only enabled when waiting for it
    
    // ── Big Heart (Above Head) gesture ──
    this.onBigHeartGestureDetected = null;
    this.bigHeartGestureActive = false;
    this.bigHeartGestureStartTime = 0;
    this.bigHeartGestureRequiredMs = 100; // Instantly responsive big heart
    this.bigHeartGestureEnabled = false;

    this.init();
  }

  async init() {
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 2, // Support both hands for heart gesture
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults((results) => this.onResults(results));

    this.camera = new Camera(this.videoElement, {
      onFrame: async () => {
        await this.hands.send({ image: this.videoElement });
      },
      width: 640,
      height: 480
    });

    try {
      await this.camera.start();
      if (this.onReady) this.onReady();
    } catch (e) {
      console.error("Camera error:", e);
      // Fallback works without camera
      if (this.onReady) this.onReady(e);
    }
  }

  enableHeartGesture() {
    this.heartGestureEnabled = true;
    this.heartGestureActive = false;
  }

  disableHeartGesture() {
    this.heartGestureEnabled = false;
    this.heartGestureActive = false;
  }

  enableBigHeartGesture() {
    this.bigHeartGestureEnabled = true;
    this.bigHeartGestureActive = false;
  }

  disableBigHeartGesture() {
    this.bigHeartGestureEnabled = false;
    this.bigHeartGestureActive = false;
  }

  detectBigHeartGesture(hand1, hand2) {
    if (!hand1 || !hand2) return false;
    
    // Check if hands are high in the frame (y < 0.6 to be more forgiving)
    // In MediaPipe, y=0 is top, y=1 is bottom
    const avgWristY = (hand1[0].y + hand2[0].y) / 2;
    const isHighUp = avgWristY < 0.6;

    // Check if hands are touching or very close at the top
    // For an overhead heart, hands touch in the middle
    // Increased distance threshold so it's easier to trigger
    const indexDist = this.dist3D(hand1[8], hand2[8]);
    const wristDist = this.dist3D(hand1[0], hand2[0]);
    const thumbDist = this.dist3D(hand1[4], hand2[4]);
    
    const handsTouching = indexDist < 0.35 || wristDist < 0.35 || thumbDist < 0.35;

    return isHighUp && handsTouching;
  }

  /**
   * Detect a heart shape formed by two hands.
   * We check if:
   * 1. Both hands' index+thumb tips are close together at the top (forming the top of the heart)
   * 2. Both hands' pinky bases are close together at the bottom (forming the bottom point)
   * 3. The overall shape roughly matches a heart silhouette
   * 
   * Simplified approach: check if the thumbs and index fingers of both hands
   * are touching/close at the top, and wrists spread apart, with pinkies meeting at bottom.
   */
  detectHeartGesture(hand1, hand2) {
    if (!this.heartGestureEnabled) return false;

    // Landmark indices:
    // 4 = thumb tip, 8 = index tip, 12 = middle tip
    // 0 = wrist, 5 = index MCP, 17 = pinky MCP

    const l1 = hand1;
    const l2 = hand2;

    // Check if thumb tips are close to each other (top of heart, left side)
    const thumbDist = this.dist3D(l1[4], l2[4]);
    
    // Check if index finger tips are close (top of heart, right side)
    const indexDist = this.dist3D(l1[8], l2[8]);
    
    // Check if pinky MCPs or wrists point downward (bottom of heart)
    // The bottom of the heart is where middle fingers meet
    const middleDist = this.dist3D(l1[12], l2[12]);

    // Heart gesture heuristic:
    // - Thumbs touching (< 0.08) OR index fingers touching (< 0.08)
    // - AND some fingertips close together at top
    // - Wrists are spread apart (> 0.15)
    const wristDist = this.dist3D(l1[0], l2[0]);
    
    // More lenient detection: any two corresponding fingertips close
    const anyTipsClose = thumbDist < 0.1 || indexDist < 0.1 || middleDist < 0.1;
    const wristsApart = wristDist > 0.1;
    
    // Check vertical arrangement: fingertips above wrists (heart shape)
    const avgTipY = (l1[8].y + l2[8].y) / 2;
    const avgWristY = (l1[0].y + l2[0].y) / 2;
    const tipsAboveWrists = avgTipY < avgWristY; // y increases downward

    return anyTipsClose && wristsApart && tipsAboveWrists;
  }

  dist3D(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  onResults(results) {
    const hands = results.multiHandLandmarks;

    // ── Two-hand heart gesture detection ──
    if (hands && hands.length >= 2 && this.heartGestureEnabled) {
      const isHeart = this.detectHeartGesture(hands[0], hands[1]);
      
      if (isHeart) {
        if (!this.heartGestureActive) {
          this.heartGestureActive = true;
          this.heartGestureStartTime = Date.now();
        } else {
          // Check if held long enough
          const elapsed = Date.now() - this.heartGestureStartTime;
          if (elapsed >= this.heartGestureRequiredMs) {
            if (this.onHeartGestureDetected) {
              this.onHeartGestureDetected();
            }
            this.heartGestureActive = false;
            // Don't disable — allow retries until dissolve actually happens
          }
        }
      } else {
        this.heartGestureActive = false;
      }
    } else if (!hands || hands.length < 2) {
      this.heartGestureActive = false;
    }

    // ── Big Heart (Above Head) gesture detection ──
    if (hands && hands.length >= 2 && this.bigHeartGestureEnabled) {
      const isBigHeart = this.detectBigHeartGesture(hands[0], hands[1]);
      
      if (isBigHeart) {
        if (!this.bigHeartGestureActive) {
          this.bigHeartGestureActive = true;
          this.bigHeartGestureStartTime = Date.now();
        } else {
          const elapsed = Date.now() - this.bigHeartGestureStartTime;
          if (elapsed >= this.bigHeartGestureRequiredMs) {
            if (this.onBigHeartGestureDetected) {
              this.onBigHeartGestureDetected();
            }
            this.bigHeartGestureActive = false;
          }
        }
      } else {
        this.bigHeartGestureActive = false;
      }
    } else if (!hands || hands.length < 2) {
      this.bigHeartGestureActive = false;
    }

    // ── Single-hand pinch tracking (use first hand) ──
    if (hands && hands.length > 0) {
      const landmarks = hands[0];
      
      // Thumb tip = 4, Index tip = 8
      const thumb = landmarks[4];
      const index = landmarks[8];
      
      // Map to window coordinates (mirror X)
      const x = (1 - index.x) * window.innerWidth;
      const y = index.y * window.innerHeight;
      
      // Calculate distance between thumb and index
      const dx = thumb.x - index.x;
      const dy = thumb.y - index.y;
      const dz = thumb.z - index.z;
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      const currentlyPinched = distance < this.pinchThreshold;
      
      if (this.onHandUpdate) {
        this.onHandUpdate({ x, y, isPinching: currentlyPinched, pinchDistance: distance });
      }

      // Pinch Edge Detection
      if (currentlyPinched && !this.isPinched) {
        this.isPinched = true;
        if (this.onPinchStart) this.onPinchStart(x, y);
      } else if (!currentlyPinched && this.isPinched) {
        this.isPinched = false;
        if (this.onPinchEnd) this.onPinchEnd();
      }
    } else {
      if (this.onHandUpdate) {
         this.onHandUpdate(null);
      }
      if (this.isPinched) {
        this.isPinched = false;
        if (this.onPinchEnd) this.onPinchEnd();
      }
    }
  }
}
