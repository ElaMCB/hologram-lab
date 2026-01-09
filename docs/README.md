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

## Files

- `index.html` - The main hologram simulation page
- `README.md` - This file

