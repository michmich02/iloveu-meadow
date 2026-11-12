# I Love U Meadow

Draw fire through a meadow and reveal a message that becomes a heart.

[Live demo ↗](https://michmich02.github.io/iloveu-meadow/) · [Michelle Guan](https://github.com/michmich02)

## Try it

Enter a closing message and start the experience. Pinch and move your hand to draw fire, then make a heart gesture to dissolve the scene into a particle heart. A larger heart gesture bursts it.

Mouse and touch also work: drag to draw, click when prompted to dissolve, then click the formed heart to burst it. The `msg` and `end` URL parameters carry the messages for sharing.

## How it works

A state machine coordinates drawing, glowing text, dissolution, heart formation, and the final burst. Canvas 2D renders the grass and particles; hand tracking and pointer controls feed the same interaction flow.

**Stack:** JavaScript, Canvas 2D, MediaPipe, Web Audio, Vite.

Start with [src/interaction.js](src/interaction.js) for the sequence and [src/systems](src/systems) for rendering, grass, particles, and audio.

## Develop locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Build with `npm run build`.

To preview the committed static demo:

```sh
python3 -m http.server 8000 --directory docs
```

Open [localhost:8000](http://localhost:8000). Camera access needs localhost or HTTPS; tracking models need an internet connection.
