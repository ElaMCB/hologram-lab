# Computer-Generated Holograms (CGH)

This section contains algorithms and implementations for generating holograms computationally.

## Overview

Computer-Generated Holograms (CGH) allow us to create holographic patterns digitally without physical recording. This enables:
- Precise control over object geometry
- Real-time hologram generation
- Integration with computer graphics pipelines
- Applications in 3D displays and optical systems

## Algorithm Types

### Fourier Holograms
Fourier holograms reconstruct in the far field (Fraunhofer region). The object's Fourier transform is encoded in the hologram.

**Use Cases:**
- Far-field image reconstruction
- Optical pattern recognition
- Beam shaping

### Fresnel Holograms
Fresnel holograms reconstruct in the near field using Fresnel diffraction. More suitable for 3D objects with depth.

**Use Cases:**
- 3D object display
- Near-field projection
- Holographic 3D printing

### Kinoform Holograms
Kinoform holograms use phase-only encoding, making them highly efficient for phase-modulating displays like SLMs.

**Use Cases:**
- Spatial Light Modulator (SLM) applications
- High-efficiency holographic displays
- Phase-only optical systems

## Getting Started

### Prerequisites
```bash
pip install numpy scipy matplotlib jupyter
```

### Basic Example: Fourier Hologram

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy.fft import fft2, ifft2, fftshift

def generate_fourier_hologram(object_image):
    """
    Generate a Fourier hologram from an object image.
    
    Parameters:
    object_image: 2D array representing the object
    
    Returns:
    hologram: Complex hologram pattern
    """
    # Fourier transform the object
    object_ft = fft2(object_image)
    
    # Add reference beam (off-axis)
    reference = np.exp(1j * 2 * np.pi * np.linspace(0, 10, object_image.shape[0]))
    reference = np.tile(reference, (object_image.shape[1], 1)).T
    
    # Interference pattern
    hologram = object_ft + reference
    intensity = np.abs(hologram)**2
    
    return intensity, hologram
```

### Basic Example: Fresnel Hologram

```python
def generate_fresnel_hologram(object_points, wavelength, z_distance, pixel_size, size):
    """
    Generate a Fresnel hologram from 3D object points.
    
    Parameters:
    object_points: Array of (x, y, z) coordinates
    wavelength: Wavelength of light in meters
    z_distance: Distance from object to hologram plane
    pixel_size: Physical size of each pixel
    size: Output hologram size (N, N)
    
    Returns:
    hologram: Complex hologram pattern
    """
    k = 2 * np.pi / wavelength
    x = np.linspace(-size/2, size/2, size) * pixel_size
    y = np.linspace(-size/2, size/2, size) * pixel_size
    X, Y = np.meshgrid(x, y)
    
    hologram = np.zeros((size, size), dtype=complex)
    
    for x_obj, y_obj, z_obj in object_points:
        r = np.sqrt((X - x_obj)**2 + (Y - y_obj)**2 + (z_distance + z_obj)**2)
        hologram += np.exp(1j * k * r) / r
    
    return np.abs(hologram)**2
```

## Jupyter Notebooks

### Available Notebooks

1. **fourier_hologram_demo.ipynb**
   - Basic Fourier hologram generation
   - Reconstruction demonstration
   - Parameter exploration

2. **fresnel_hologram_demo.ipynb**
   - 3D point cloud to hologram
   - Depth reconstruction
   - Multiple object planes

3. **kinoform_generation.ipynb**
   - Phase-only encoding
   - Gerchberg-Saxton algorithm
   - Iterative optimization

4. **inline_hologram_simulation.ipynb**
   - Inline holography setup
   - Digital reconstruction
   - Applications in microscopy

## Reference Implementations

### External Repositories

1. **JackHCC/Computer-Generated-Hologram**
   - Comprehensive CGH algorithms
   - Python implementations
   - Multiple hologram types
   - [GitHub Repository](https://github.com/JackHCC/Computer-Generated-Hologram)

2. **kmdouglass.github.io**
   - Educational content on inline holography
   - Python scripts for simulation
   - Digital holographic microscopy
   - [Website](https://kmdouglass.github.io)

## Advanced Topics

### Neural Holography
Deep learning approaches to hologram generation and optimization.

### Real-time Hologram Generation
GPU-accelerated algorithms for interactive holographic displays.

### Holographic 3D Printing
Using CGH for volumetric 3D printing applications.

## Performance Optimization

### GPU Acceleration
Use CUDA or OpenCL for large-scale hologram computation:
```python
# Example with CuPy (CUDA)
import cupy as cp
# Convert arrays to GPU
object_gpu = cp.asarray(object_image)
hologram_gpu = cp.fft.fft2(object_gpu)
```

### Parallel Processing
Leverage multiprocessing for multiple hologram generation:
```python
from multiprocessing import Pool
# Process multiple frames in parallel
```

## Visualization

### Hologram Display
```python
def display_hologram(hologram):
    plt.figure(figsize=(10, 10))
    plt.imshow(hologram, cmap='gray')
    plt.title('Computer-Generated Hologram')
    plt.colorbar()
    plt.show()
```

### Reconstruction Visualization
```python
def reconstruct_hologram(hologram, wavelength, z_distance):
    # Numerical reconstruction
    reconstruction = propagate_wavefront(hologram, wavelength, z_distance)
    plt.imshow(np.abs(reconstruction), cmap='hot')
    plt.show()
```

## Resources

### Books
- *Introduction to Fourier Optics* by Joseph W. Goodman
- *Digital Holography* by Ulf Schnars and Werner Jueptner

### Papers
- "Computer-Generated Holograms for 3D Display" - Recent advances
- "Neural Holography" - Deep learning approaches
- "Real-time Hologram Generation" - Performance optimization

### Software Tools
- odak - Python library for computational optics
- DeepCGH - Deep learning for hologram generation
- HoloPy - Hologram processing and reconstruction

## Contributing

Contributions welcome! Please:
1. Add your algorithm implementations
2. Create Jupyter notebooks with examples
3. Document your code thoroughly
4. Include test cases and validation

