# Stereo Pair Assets

This directory should contain left and right eye stereo pair images for the parallax barrier effect.

## Required Files

- `left.png` - Left eye view (512x512 recommended)
- `right.png` - Right eye view (512x512 recommended)

## Generating Stereo Pairs

### Using Blender

1. Open Blender
2. Delete default cube
3. Add Icosphere (Subdivision: 3)
4. Apply Shade Smooth
5. Camera → Stereoscopy settings:
   - Check "Stereoscopy"
   - Convergence Plane Distance: 2 m
   - Inter-ocular Distance: 6.5 cm
6. Render → Left & Right views
7. Save as `left.png` and `right.png` (512x512 PNG)

### Stereo Parameters

- **Inter-ocular Distance**: 6.5 cm (standard human eye separation)
- **Convergence Plane**: 2 m (where both eyes converge)
- **Image Size**: 512x512 pixels (matches barrier resolution)

## Fallback

If stereo images are not available, the hologram.js will automatically generate a procedural stereo pair as a fallback.

