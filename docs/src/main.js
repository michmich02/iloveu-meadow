import { AudioSystem } from './systems/AudioSystem.js';
import { GrassSystem } from './systems/GrassSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { Renderer } from './systems/Renderer.js';
import { HandTracking } from './handTracking.js';
import { InteractionManager } from './interaction.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('output_canvas');
  const videoElement = document.getElementById('input_video');
  const faceCam = document.getElementById('face_cam');
  const faceCamVideo = document.getElementById('face_cam_video');
  const loading = document.getElementById('loading');
  const instructions = document.getElementById('instructions');

  // ── Welcome Screen & Custom Text ──
  const welcomeScreen = document.getElementById('welcome_screen');
  const btnStart = document.getElementById('btn_start');
  const inputFinal = document.getElementById('input_final_msg');

  // Hint elements
  const hintDraw = document.getElementById('hint_draw');
  const hintTapDissolve = document.getElementById('hint_tap_dissolve');
  const hintTapHeart = document.getElementById('hint_tap_heart');

  // ── Read URL params (for sharing) ──
  const params = new URLSearchParams(window.location.search);
  const urlMsg = params.get('msg');
  const urlEnd = params.get('end');

  if (urlEnd && inputFinal) {
    inputFinal.value = urlEnd;
  }
  
  // ── Start Experience ──
  btnStart.addEventListener('click', () => {
    const hiddenMsg = urlMsg || 'I ♥ you';
    const finalMsg = (inputFinal ? inputFinal.value.trim() : '') || urlEnd || 'for you';

    // Update URL for sharing (without reloading)
    const shareUrl = new URL(window.location);
    shareUrl.searchParams.set('msg', hiddenMsg);
    shareUrl.searchParams.set('end', finalMsg);
    window.history.replaceState({}, '', shareUrl);

    // Fade out welcome screen
    welcomeScreen.classList.add('hiding');
    setTimeout(() => {
      welcomeScreen.style.display = 'none';
    }, 1200);

    // Initialize everything with custom text
    initExperience(hiddenMsg, finalMsg);
  });

  function initExperience(hiddenMsg, finalMsg) {
    // Initialize Systems
    const renderer = new Renderer(canvas);
    const audioSystem = new AudioSystem();
    const grassSystem = new GrassSystem(window.innerWidth, window.innerHeight, hiddenMsg, audioSystem);
    const particleSystem = new ParticleSystem(window.innerWidth, window.innerHeight, finalMsg);

    renderer.addSystem(grassSystem);
    renderer.addSystem(particleSystem);

    // Interaction (pass hint manager)
    const hintManager = {
      showDraw: () => showHint(hintDraw),
      hideDraw: () => hideHint(hintDraw),
      showTapDissolve: () => showHint(hintTapDissolve),
      hideTapDissolve: () => hideHint(hintTapDissolve),
      showTapHeart: () => showHint(hintTapHeart),
      hideTapHeart: () => hideHint(hintTapHeart),
    };

    const interactionManager = new InteractionManager(renderer, grassSystem, particleSystem, hintManager);

    // Hand Tracking setup
    const handTracking = new HandTracking(videoElement, (error) => {
      loading.style.opacity = '0';
      setTimeout(() => {
        loading.style.display = 'none';
      }, 1000);

      if (error) {
        console.warn("Continuing with desktop fallback mode.", error);
      } else {
        // Show face-cam container with entrance animation
        setTimeout(() => faceCam.classList.add('visible'), 500);
      }
    });

    // Bind events
    handTracking.onHandUpdate = (handData) => interactionManager.handleHandUpdate(handData);
    handTracking.onPinchStart = (x, y) => interactionManager.handlePinchStart(x, y);
    handTracking.onPinchEnd = () => interactionManager.handlePinchEnd();
    handTracking.onHeartGestureDetected = () => interactionManager.handleHeartGesture();
    handTracking.onBigHeartGestureDetected = () => interactionManager.handleBigHeartGesture();

    // Pass handTracking reference so interaction can enable/disable heart gesture
    interactionManager.setHandTracking(handTracking);

    // Start Rendering
    renderer.start();
  }

  // ── Hint Utilities ──
  function showHint(el) {
    if (!el) return;
    // Hide all hints first
    document.querySelectorAll('.stage-hint').forEach(h => {
      h.classList.remove('visible');
      h.classList.remove('fading');
    });
    // Show the requested one
    setTimeout(() => { if (el) el.classList.add('visible'); }, 100);
  }

  function hideHint(el) {
    if (!el) return;
    el.classList.add('fading');
    el.classList.remove('visible');
  }
});
