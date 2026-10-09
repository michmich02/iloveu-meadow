export class InteractionManager {
  constructor(renderer, grassSystem, particleSystem, hintManager) {
    this.renderer = renderer;
    this.grassSystem = grassSystem;
    this.particleSystem = particleSystem;
    this.hintManager = hintManager;
    
    this.isDrawing = false;       // Mouse/touch drawing fire
    this.hasDrawn = false;        // User has drawn at least once
    this.isPinchDrawing = false;  // Hand pinch drawing mode
    this.lastDrawTime = 0;
    
    // ── Flow state ──
    // 'idle' → 'drawing' → 'text_glowing' → 'waiting_heart_gesture' → 
    // 'heart_detected' → 'dissolving' → 'swarm_forming' → 'heart_hold' → 'done'
    this.flowState = 'idle';
    this.hintShown = {};  // Track which hints have been shown
    
    // Reference to handTracking (set from main.js via callback)
    this.handTracking = null;
    
    this.setupDesktopFallback();
  }

  setupDesktopFallback() {
    // --- Drawing (mousedown/touchstart → move → up) ---
    const handleDown = (e) => {
      // If heart is holding (swarm phase 3), burst it on click
      if (this.particleSystem.swarmPhase === 3) {
        this.particleSystem.burstHeart();
        this.renderer.triggerShake(12);
        if (this.hintManager) this.hintManager.hideTapHeart();
        return;
      }

      // If text is glowing and we're waiting for heart gesture,
      // in desktop mode: click to trigger dissolve (fallback for no camera)
      if (this.flowState === 'text_glowing' || this.flowState === 'waiting_heart_gesture') {
        this.triggerDissolve();
        return;
      }

      // Start drawing fire (only if we haven't entered later phases)
      if (!this.particleSystem.swarmPhase && this.flowState !== 'dissolving') {
        this.isDrawing = true;
        this.flowState = 'drawing';
        if (this.hintManager) this.hintManager.hideDraw();
        const pos = this.getPos(e);
        this.igniteAtPos(pos.x, pos.y);
      }
    };

    const handleMove = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = this.getPos(e);
      this.igniteAtPos(pos.x, pos.y);
    };

    const handleUp = () => {
      if (this.isDrawing) {
        this.isDrawing = false;
        this.hasDrawn = true;
        this.checkTextGlowing();
      }
    };

    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    
    // Double click to instantly trigger dissolve while burning
    window.addEventListener('dblclick', () => {
      if ((this.flowState === 'drawing' || this.flowState === 'text_glowing') && this.hasDrawn) {
        console.log('Double click detected! Triggering dissolve instantly.');
        this.isDrawing = false;
        this.triggerDissolve();
      }
    });
    window.addEventListener('touchstart', handleDown, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
  }

  getPos(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  igniteAtPos(x, y) {
    const isMobile = 'ontouchstart' in window;
    const radius = isMobile ? 50 : 30;
    
    this.grassSystem.igniteAt(x, y, radius);
    this.particleSystem.addSpark(x, y);
    this.renderer.addTrailPoint(x, y);

    // Enable heart gesture as soon as user starts drawing
    if (!this._heartGestureEnabled && this.handTracking) {
      this.handTracking.enableHeartGesture();
      this._heartGestureEnabled = true;
    }
  }

  // ── Check if text is fully glowing (called after each draw stroke) ──
  checkTextGlowing() {
    // Enable heart gesture immediately after first draw
    if (this.handTracking) {
      this.handTracking.enableHeartGesture();
    }
    
    // Poll periodically to see if burn animation completed
    const check = () => {
      if (this.grassSystem.isTextFullyGlowing() && this.flowState === 'drawing') {
        this.flowState = 'text_glowing';
        if (this.hintManager) {
          this.hintManager.showTapDissolve();
        }
        setTimeout(() => {
          if (this.flowState === 'text_glowing') {
            this.flowState = 'waiting_heart_gesture';
          }
        }, 2000);
      } else if (this.flowState === 'drawing') {
        setTimeout(check, 500);
      }
    };
    setTimeout(check, 500);
  }

  // ── Trigger the dissolve sequence ──
  triggerDissolve() {
    if (this.flowState === 'dissolving' || this.flowState === 'done') return;
    
    this.flowState = 'dissolving';
    if (this.hintManager) {
      this.hintManager.hideTapDissolve();
      this.hintManager.hideTapHeart();
    }
    
    this.grassSystem.extinguishFire(this.particleSystem);
    this.particleSystem.onHeartFormed = () => {
      // Don't hide grass — it transitions into 3D depth background
      this.flowState = 'heart_hold';
      // Show hint for the heart
      if (this.hintManager) {
        this.hintManager.showTapHeart();
      }
      
      if (this.handTracking) {
        this.handTracking.enableBigHeartGesture();
      }
    };
  }

  // ── Hand tracking callbacks ──

  handleHandUpdate(handData) {
    this.renderer.setHandData(handData);
    
    // If pinch-drawing, add trail points
    if (this.isPinchDrawing && handData && handData.isPinching) {
      this.particleSystem.addTrailPoint(handData.x, handData.y);
      this.igniteAtPos(handData.x, handData.y);
    }
  }

  handlePinchStart(x, y) {
    // Pinch to burst is removed in favor of Big Heart gesture, 
    // but mouse click still falls back to burst in setupDesktopFallback.
    
    // If waiting for heart gesture (not drawing), pinch can trigger dissolve
    if (this.flowState === 'text_glowing' || this.flowState === 'waiting_heart_gesture') {
      this.triggerDissolve();
      return;
    }
    
    // Start pinch-drawing (casting spell)
    if (!this.particleSystem.swarmPhase && this.flowState !== 'dissolving') {
      this.isPinchDrawing = true;
      this.flowState = 'drawing';
      if (this.hintManager) this.hintManager.hideDraw();
      this.igniteAtPos(x, y);
    }
  }

  handlePinchEnd() {
    if (this.isPinchDrawing) {
      this.isPinchDrawing = false;
      this.hasDrawn = true;
      // Keep the trail visible (don't clear immediately)
      this.particleSystem.clearTrail();
      this.checkTextGlowing();
    }
  }

  // ── Heart gesture detected (from HandTracking) ──
  handleHeartGesture() {
    // Allow heart gesture any time after user has drawn anything
    if (this.flowState === 'drawing' || this.flowState === 'waiting_heart_gesture' || this.flowState === 'text_glowing' || this.hasDrawn) {
      console.log('Heart gesture detected! Triggering dissolve from state:', this.flowState);
      this.isPinchDrawing = false; // Stop drawing mode
      this.triggerDissolve();
    }
  }

  handleBigHeartGesture() {
    if (this.particleSystem.swarmPhase === 3) {
      console.log('Big Heart gesture detected! Bursting 3D heart.');
      this.particleSystem.burstHeart();
      this.renderer.triggerShake(12);
      if (this.hintManager) this.hintManager.hideTapHeart();
      
      if (this.handTracking) {
        this.handTracking.disableBigHeartGesture();
      }
      
      this.flowState = 'done';
    }
  }

  // Allow main.js to pass handTracking reference
  setHandTracking(ht) {
    this.handTracking = ht;
  }
}
