# Robotic Face Hologram

A standalone WebGL demo — a real scanned human head rendered as a holographic android that pops out of the screen.

This is a **separate project** from the main triangle/octahedron demo in `docs/`. It is listed on the [main GitHub Pages site](https://elamcb.github.io/hologram-lab/) in the **Live Demos** grid.

When updating this demo, keep `docs/robotic-face-hologram/` in sync (that folder is what GitHub Pages serves).

## Run locally

```bash
cd robotic-face-hologram
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

## 3D Model

Uses the **LeePerrySmith** scanned head bust (`assets/head.glb`) from the [Three.js examples](https://threejs.org/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb). If the local file is missing, the demo loads from the Three.js CDN automatically.

## Features

- Real high-resolution head scan (not procedural primitives)
- Holographic android material — metallic skin with normal-map detail
- ~7 cm pop-out animation toward the viewer
- Mouse parallax head tracking
- Scan lines, particle field, wireframe overlay
- Toggle rotation, wireframe mode, and color themes
- Drag to rotate, scroll to zoom

## Files

| File | Purpose |
|------|---------|
| `index.html` | Demo page |
| `face-hologram.js` | Three.js scene + GLTF loader |
| `assets/head.glb` | LeePerrySmith head scan (~395 KB) |

## Controls

| Action | Input |
|--------|-------|
| Head tracking | Move mouse |
| Rotate face | Click and drag |
| Zoom | Mouse wheel |
| Toggle rotation | Button |
| Wireframe mode | Button |
| Change colors | Button |
| Reset view | Button |
