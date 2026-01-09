# GitHub Pages Hologram

This directory contains the interactive hologram simulation for the GitHub Pages site.

## Setup

### Enable GitHub Pages

1. Go to your repository Settings
2. Navigate to Pages section
3. Under "Source", select the branch containing this directory (usually `main` or `master`)
4. Select `/ (root)` or specify the `github-page-hologram` directory
5. Click Save

If using the root directory approach, you may need to move `index.html` to the repository root or configure GitHub Pages to use this subdirectory.

### Alternative: Using GitHub Actions

You can also use GitHub Actions to deploy to GitHub Pages automatically. See the `.github/workflows` directory for examples.

## Local Testing

To test the hologram simulation locally:

```bash
cd github-page-hologram
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

## Features

- **Interactive 3D Hologram**: Rotating geometric object rendered with WebGL
- **Pepper's Ghost Effect**: CSS-based pyramid demonstration
- **Controls**: Toggle rotation, wireframe mode, color changes, and reset view
- **Responsive Design**: Works on desktop and mobile devices
- **Performance Optimized**: Smooth 60fps animations

## Customization

### Change the 3D Object

Edit the `createHologramObject()` function in `index.html` to use different geometries:

```javascript
// Example: Use a torus instead
const geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
```

Available Three.js geometries:
- `BoxGeometry`
- `SphereGeometry`
- `ConeGeometry`
- `TorusGeometry`
- `OctahedronGeometry` (default)
- And many more...

### Change Colors

Modify the `colors` array to customize the color scheme:

```javascript
const colors = [
    { primary: 0x00ffff, secondary: 0xff00ff }, // Your custom colors
    // Add more color schemes
];
```

### Add Your Logo

Replace the geometric object with a 3D model of your logo:

1. Export your logo as a 3D model (OBJ, GLTF, etc.)
2. Use Three.js loaders to load the model
3. Replace the geometry creation code

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 12+)
- Opera: Full support

WebGL is required. Most modern browsers support WebGL 2.0.

## Performance Tips

- Reduce particle count for slower devices
- Lower resolution for mobile devices
- Disable anti-aliasing if needed
- Use simpler geometries for better performance

## Troubleshooting

**Hologram not displaying:**
- Check browser console for errors
- Ensure WebGL is enabled in browser settings
- Try a different browser

**Controls not working:**
- OrbitControls may not load from CDN, fallback mouse controls should work
- Check JavaScript console for errors

**Mobile performance issues:**
- Reduce canvas resolution
- Lower particle count
- Simplify geometry

## License

This implementation is part of the hologram-lab repository and follows the same MIT license.

