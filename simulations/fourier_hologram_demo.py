#!/usr/bin/env python3
"""
Fourier Hologram Generation Demo
Demonstrates basic Fourier hologram creation and reconstruction.
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy.fft import fft2, ifft2, fftshift, ifftshift


def generate_object_image(size=512):
    """Generate a simple test object (letter 'H')."""
    image = np.zeros((size, size))
    
    # Draw letter H
    thickness = size // 20
    bar_length = size // 2
    
    # Vertical bars
    start_y = size // 4
    end_y = start_y + bar_length
    
    # Left vertical bar
    image[start_y:end_y, size//4:size//4+thickness] = 1
    
    # Right vertical bar
    image[start_y:end_y, 3*size//4-thickness:3*size//4] = 1
    
    # Horizontal bar
    bar_y = size // 2 - thickness // 2
    image[bar_y:bar_y+thickness, size//4:3*size//4] = 1
    
    return image


def generate_fourier_hologram(object_image, reference_angle=0.1):
    """
    Generate a Fourier hologram using off-axis reference beam.
    
    Parameters:
    object_image: 2D array representing the object
    reference_angle: Angle for off-axis reference (controls fringe spacing)
    
    Returns:
    hologram: Intensity pattern of the hologram
    """
    # Fourier transform the object
    object_ft = fftshift(fft2(object_image))
    
    # Create reference beam (plane wave with tilt)
    size = object_image.shape[0]
    x = np.linspace(-size/2, size/2, size)
    y = np.linspace(-size/2, size/2, size)
    X, Y = np.meshgrid(x, y)
    
    # Off-axis reference wave
    reference = np.exp(1j * 2 * np.pi * reference_angle * X / size)
    reference_ft = fftshift(fft2(reference))
    
    # Interference pattern in Fourier domain
    interference = object_ft + reference_ft
    
    # Hologram intensity
    hologram = np.abs(interference)**2
    
    return hologram, interference


def reconstruct_hologram(hologram, reference_angle=0.1, filter_side='left'):
    """
    Reconstruct image from Fourier hologram.
    
    Parameters:
    hologram: Intensity pattern of the hologram
    reference_angle: Angle of reference beam (must match recording)
    filter_side: Which sideband to filter ('left', 'right', 'center')
    
    Returns:
    reconstruction: Reconstructed object image
    """
    # Simulate illumination with reference beam
    size = hologram.shape[0]
    x = np.linspace(-size/2, size/2, size)
    y = np.linspace(-size/2, size/2, size)
    X, Y = np.meshgrid(x, y)
    
    reference = np.exp(1j * 2 * np.pi * reference_angle * X / size)
    reference_ft = fftshift(fft2(reference))
    
    # Multiply hologram by reference
    illuminated = np.sqrt(hologram) * reference_ft
    
    # Fourier transform to reconstruct
    reconstruction_ft = ifftshift(illuminated)
    reconstruction = ifft2(reconstruction_ft)
    
    # Filter desired sideband
    center = size // 2
    mask = np.zeros((size, size), dtype=bool)
    
    if filter_side == 'left':
        mask[:, :center] = True
    elif filter_side == 'right':
        mask[:, center:] = True
    else:  # center
        mask[center-size//4:center+size//4, center-size//4:center+size//4] = True
    
    reconstruction_ft_filtered = ifftshift(reconstruction_ft) * mask
    reconstruction = ifft2(reconstruction_ft_filtered)
    
    return np.abs(reconstruction)


def main():
    """Run Fourier hologram demo."""
    print("Generating test object...")
    object_image = generate_object_image(512)
    
    print("Creating Fourier hologram...")
    hologram, interference = generate_fourier_hologram(object_image, reference_angle=0.15)
    
    print("Reconstructing image...")
    reconstruction = reconstruct_hologram(hologram, reference_angle=0.15, filter_side='left')
    
    # Display results
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    
    axes[0].imshow(object_image, cmap='gray')
    axes[0].set_title('Original Object')
    axes[0].axis('off')
    
    axes[1].imshow(hologram, cmap='gray')
    axes[1].set_title('Fourier Hologram')
    axes[1].axis('off')
    
    axes[2].imshow(reconstruction, cmap='hot')
    axes[2].set_title('Reconstruction')
    axes[2].axis('off')
    
    plt.tight_layout()
    plt.savefig('demos/fourier_hologram_demo.png', dpi=150, bbox_inches='tight')
    print("Results saved to demos/fourier_hologram_demo.png")
    plt.show()


if __name__ == '__main__':
    main()

