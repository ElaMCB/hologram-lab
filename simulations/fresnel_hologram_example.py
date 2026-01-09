#!/usr/bin/env python3
"""
Fresnel Hologram Generation Example
Creates a hologram from 3D point cloud data using Fresnel diffraction.
"""

import numpy as np
import matplotlib.pyplot as plt


def generate_point_cloud():
    """Generate a simple 3D point cloud (cube)."""
    points = []
    size = 0.5
    n_points = 20
    
    # Generate points on a cube surface
    for x in np.linspace(-size, size, n_points):
        for y in np.linspace(-size, size, n_points):
            points.append([x, y, -size])  # Front face
            points.append([x, y, size])   # Back face
            points.append([x, -size, y])  # Bottom face
            points.append([x, size, y])   # Top face
            points.append([-size, x, y])  # Left face
            points.append([size, x, y])   # Right face
    
    return np.array(points)


def generate_fresnel_hologram(object_points, wavelength=632.8e-9, z_distance=0.5, 
                              pixel_size=10e-6, size=512):
    """
    Generate a Fresnel hologram from 3D object points.
    
    Parameters:
    object_points: Array of (x, y, z) coordinates in meters
    wavelength: Wavelength of light in meters (default: 632.8 nm, HeNe laser)
    z_distance: Distance from object center to hologram plane in meters
    pixel_size: Physical size of each pixel in meters
    size: Output hologram size (N, N)
    
    Returns:
    hologram: Intensity pattern of the hologram
    """
    k = 2 * np.pi / wavelength
    x = np.linspace(-size/2, size/2, size) * pixel_size
    y = np.linspace(-size/2, size/2, size) * pixel_size
    X, Y = np.meshgrid(x, y)
    
    # Initialize hologram
    hologram = np.zeros((size, size), dtype=complex)
    
    print(f"Generating Fresnel hologram from {len(object_points)} points...")
    
    # Add contribution from each object point
    for i, (x_obj, y_obj, z_obj) in enumerate(object_points):
        if i % 100 == 0:
            print(f"Processing point {i}/{len(object_points)}")
        
        # Distance from point to each pixel
        r = np.sqrt((X - x_obj)**2 + (Y - y_obj)**2 + (z_distance + z_obj)**2)
        
        # Fresnel approximation: spherical wavefront
        # Amplitude decreases with distance, phase accumulates
        amplitude = 1.0 / r
        phase = k * r
        
        hologram += amplitude * np.exp(1j * phase)
    
    # Add reference beam (plane wave)
    reference_angle = 0.1
    reference = np.exp(1j * k * reference_angle * X)
    
    # Interference between object and reference
    total_wave = hologram + reference
    
    # Hologram intensity
    hologram_intensity = np.abs(total_wave)**2
    
    # Normalize
    hologram_intensity = hologram_intensity / np.max(hologram_intensity)
    
    return hologram_intensity


def main():
    """Run Fresnel hologram generation example."""
    print("Generating 3D point cloud...")
    object_points = generate_point_cloud()
    print(f"Generated {len(object_points)} points")
    
    print("\nCreating Fresnel hologram...")
    hologram = generate_fresnel_hologram(
        object_points,
        wavelength=632.8e-9,  # HeNe laser wavelength
        z_distance=0.5,        # 50 cm from object to hologram
        pixel_size=10e-6,      # 10 micron pixels
        size=512               # 512x512 hologram
    )
    
    # Display results
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    
    # Plot point cloud
    ax = axes[0]
    ax = fig.add_subplot(121, projection='3d')
    ax.scatter(object_points[:, 0], object_points[:, 1], object_points[:, 2], 
               c=object_points[:, 2], cmap='viridis', s=1)
    ax.set_xlabel('X (m)')
    ax.set_ylabel('Y (m)')
    ax.set_zlabel('Z (m)')
    ax.set_title('3D Object (Point Cloud)')
    
    # Plot hologram
    axes[1].imshow(hologram, cmap='gray')
    axes[1].set_title('Fresnel Hologram')
    axes[1].axis('off')
    
    plt.tight_layout()
    
    # Save
    output_path = 'demos/fresnel_hologram_example.png'
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    print(f"\nResults saved to {output_path}")
    plt.show()


if __name__ == '__main__':
    main()

