# GitHub Pages Hologram

This is the GitHub Pages deployment directory. The `index.html` file in this folder will be served when GitHub Pages is enabled with the `/docs` folder as the source.

## Setup Instructions

1. Go to your repository on GitHub
2. Navigate to **Settings** > **Pages**
3. Under **Source**, select:
   - **Branch**: `main` (or your default branch)
   - **Folder**: `/docs`
4. Click **Save**

Your hologram simulation will be available at:
`https://elamcb.github.io/hologram-lab/`

## Local Testing

To test locally:

```bash
cd docs
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

## Adding a New Live Demo

Every interactive WebGL demo **must** be linked from the main page (`docs/index.html`).

1. Copy the demo into `docs/<demo-name>/` (GitHub Pages only serves files under `docs/`).
2. Optionally keep a source copy at the repo root (e.g. `robotic-face-hologram/`).
3. Add a card to the **Live Demos** grid in `docs/index.html` (search for `<!-- Live Demos:`).
4. Update the root `README.md` live demos list if the demo is user-facing.

Current live demos:

| Demo | Path |
|------|------|
| Triangle Hologram | `/` (this page) |
| Robotic Face Hologram | `/robotic-face-hologram/` |
| Weekly GIF gallery | `/` — **Weekly Hologram Gallery** section (fed by `weekly-gallery.json`) |

## Files

- `index.html` - Main page with Live Demos grid + triangle simulation
- `robotic-face-hologram/` - Robotic face WebGL demo
- `README.md` - This file
