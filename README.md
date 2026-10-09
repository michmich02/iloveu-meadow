# I Love U Meadow

> A romantic interactive meadow with gesture-driven fire.

[**View live demo →**](https://michmich02.github.io/iloveu-meadow/)

## Overview

I Love U Meadow explores how a small hand gesture can make a digital scene feel intimate and alive. Camera input drives a cinematic meadow, light, sound, and fire effects.

## Interaction

- Allow camera access.
- Keep your hand visible in the frame.
- Use the on-screen gesture cues to activate the scene.

## Built with

`JavaScript` · `MediaPipe` · `Three.js` · `Web Audio`

## Run locally

```sh
python3 -m http.server 8000 --directory docs
```

Open [http://localhost:8000](http://localhost:8000) in a desktop browser. Camera and microphone APIs require localhost or HTTPS; external models and CDN dependencies require an internet connection.

## Design notes

- Immediate visual feedback keeps the gesture-to-effect relationship legible.
- The experience is designed as a focused, full-screen interaction.
- Processing happens in the browser; camera and microphone streams are not uploaded by this project.
