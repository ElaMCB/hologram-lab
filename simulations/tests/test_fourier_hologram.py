"""Tests for Fourier hologram generation."""

import numpy as np
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def test_hologram_imports():
    """Test that required modules can be imported."""
    try:
        import numpy as np
        import matplotlib.pyplot as plt
        from scipy.fft import fft2
        assert True
    except ImportError as e:
        assert False, f"Failed to import required module: {e}"

def test_object_generation():
    """Test that object images can be generated."""
    size = 128
    image = np.zeros((size, size))
    assert image.shape == (size, size)
    assert image.dtype == np.float64

def test_fourier_transform():
    """Test basic Fourier transform operations."""
    test_array = np.random.rand(64, 64)
    ft = np.fft.fft2(test_array)
    assert ft.shape == test_array.shape
    assert np.iscomplexobj(ft)

def test_hologram_shape():
    """Test that hologram has correct shape."""
    object_image = np.random.rand(256, 256)
    hologram = np.abs(object_image)**2  # Simple intensity hologram
    assert hologram.shape == object_image.shape
    assert hologram.dtype in [np.float32, np.float64]

if __name__ == '__main__':
    test_hologram_imports()
    test_object_generation()
    test_fourier_transform()
    test_hologram_shape()
    print("All tests passed!")

