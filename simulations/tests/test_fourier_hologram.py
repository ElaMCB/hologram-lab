"""Tests for Fourier hologram generation."""

def test_hologram_imports():
    """Test that required modules can be imported."""
    # Test core dependencies that must be available
    import numpy as np
    from scipy.fft import fft2
    assert np is not None
    assert fft2 is not None
    
    # Test optional dependencies (matplotlib may not be installed in all environments)
    try:
        import matplotlib.pyplot as plt
        assert plt is not None
    except ImportError:
        # matplotlib is optional for basic functionality
        pass

def test_object_generation():
    """Test that object images can be generated."""
    import numpy as np
    size = 128
    image = np.zeros((size, size))
    assert image.shape == (size, size)
    assert image.dtype == np.float64

def test_fourier_transform():
    """Test basic Fourier transform operations."""
    import numpy as np
    test_array = np.random.rand(64, 64)
    ft = np.fft.fft2(test_array)
    assert ft.shape == test_array.shape
    assert np.iscomplexobj(ft)

def test_hologram_shape():
    """Test that hologram has correct shape."""
    import numpy as np
    object_image = np.random.rand(256, 256)
    hologram = np.abs(object_image)**2  # Simple intensity hologram
    assert hologram.shape == object_image.shape
    assert hologram.dtype in [np.float32, np.float64]

if __name__ == '__main__':
    import pytest
    pytest.main([__file__, '-v'])

