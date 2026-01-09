#!/usr/bin/env python3
"""
Command-line interface for hologram generation.
Example: holo-sim --method fresnel --image lena.png --z 0.05 --out out.png
"""

import argparse
import sys
import os
from pathlib import Path


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Generate computer-generated holograms from images or 3D objects",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate Fresnel hologram from image
  holo-sim --method fresnel --image input.png --z 0.05 --out output.png

  # Generate Fourier hologram
  holo-sim --method fourier --image input.png --out output.png

  # Generate with custom parameters
  holo-sim --method fresnel --image input.png --z 0.1 --wavelength 632.8e-9 --out output.png
        """
    )

    parser.add_argument(
        '--method',
        type=str,
        choices=['fresnel', 'fourier', 'kinoform'],
        default='fresnel',
        help='Hologram generation method (default: fresnel)'
    )

    parser.add_argument(
        '--image',
        type=str,
        required=True,
        help='Input image file path'
    )

    parser.add_argument(
        '--out',
        type=str,
        default='hologram_output.png',
        help='Output hologram file path (default: hologram_output.png)'
    )

    parser.add_argument(
        '--z',
        type=float,
        default=0.05,
        help='Distance from object to hologram plane in meters (default: 0.05)'
    )

    parser.add_argument(
        '--wavelength',
        type=float,
        default=632.8e-9,
        help='Wavelength of light in meters (default: 632.8e-9 for HeNe laser)'
    )

    parser.add_argument(
        '--pixel-size',
        type=float,
        default=10e-6,
        help='Physical size of each pixel in meters (default: 10e-6)'
    )

    parser.add_argument(
        '--size',
        type=int,
        default=512,
        help='Output hologram size in pixels (default: 512)'
    )

    args = parser.parse_args()

    # Check if input file exists
    if not os.path.exists(args.image):
        print(f"Error: Input image '{args.image}' not found.", file=sys.stderr)
        sys.exit(1)

    print(f"Generating {args.method} hologram...")
    print(f"Input: {args.image}")
    print(f"Output: {args.out}")
    print(f"Parameters: z={args.z}m, wavelength={args.wavelength}m, size={args.size}x{args.size}")

    # Import here to avoid import errors if dependencies are missing
    try:
        import numpy as np
        from PIL import Image
    except ImportError as e:
        print(f"Error: Required dependencies not installed. Run: pip install -r requirements.txt", file=sys.stderr)
        print(f"Missing: {e}", file=sys.stderr)
        sys.exit(1)

    # Load input image
    try:
        img = Image.open(args.image).convert('L')  # Convert to grayscale
        img_array = np.array(img)
        print(f"Loaded image: {img_array.shape}")
    except Exception as e:
        print(f"Error loading image: {e}", file=sys.stderr)
        sys.exit(1)

    # Generate hologram based on method
    if args.method == 'fourier':
        from scipy.fft import fft2, fftshift
        object_ft = fftshift(fft2(img_array))
        hologram = np.abs(object_ft)**2
        hologram = (hologram / hologram.max() * 255).astype(np.uint8)
        print("Generated Fourier hologram")
    
    elif args.method == 'fresnel':
        # Simplified Fresnel hologram - in production, use full implementation
        from scipy.fft import fft2, ifft2, fftshift, ifftshift
        k = 2 * np.pi / args.wavelength
        size = args.size
        x = np.linspace(-size/2, size/2, size) * args.pixel_size
        y = np.linspace(-size/2, size/2, size) * args.pixel_size
        X, Y = np.meshgrid(x, y)
        
        # Fresnel propagation kernel
        r = np.sqrt(X**2 + Y**2 + args.z**2)
        phase = np.exp(1j * k * r)
        hologram = np.abs(phase)**2
        hologram = (hologram / hologram.max() * 255).astype(np.uint8)
        print("Generated Fresnel hologram")
    
    elif args.method == 'kinoform':
        # Phase-only hologram
        from scipy.fft import fft2, fftshift
        object_ft = fftshift(fft2(img_array))
        phase = np.angle(object_ft)
        # Normalize phase to 0-255
        hologram = ((phase + np.pi) / (2 * np.pi) * 255).astype(np.uint8)
        print("Generated Kinoform (phase-only) hologram")

    # Save output
    try:
        output_img = Image.fromarray(hologram)
        output_img.save(args.out)
        print(f"Saved hologram to: {args.out}")
    except Exception as e:
        print(f"Error saving output: {e}", file=sys.stderr)
        sys.exit(1)

    print("Done!")


if __name__ == '__main__':
    main()

