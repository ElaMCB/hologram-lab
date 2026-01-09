#!/usr/bin/env python3
"""
Weekly hologram generation script for GitHub Actions.
Creates a new animated GIF of a rotating hologram simulation each week.
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation, PillowWriter
from mpl_toolkits.mplot3d import Axes3D
import os
from datetime import datetime

def generate_hologram_frame(ax, angle, frame_num):
    """Generate a single frame of the hologram animation."""
    ax.clear()
    
    # Create a holographic pattern (interference pattern simulation)
    x = np.linspace(-5, 5, 100)
    y = np.linspace(-5, 5, 100)
    X, Y = np.meshgrid(x, y)
    
    # Rotating wavefront interference pattern
    Z = np.sin(np.sqrt(X**2 + Y**2) - angle + np.pi/4) * np.cos(angle)
    Z += 0.5 * np.sin(2 * np.sqrt(X**2 + Y**2) - 2*angle)
    
    # Holographic fringes (circular interference pattern)
    R = np.sqrt(X**2 + Y**2)
    interference = np.cos(2 * np.pi * R / 2 - angle * 2)
    
    # Combine patterns
    pattern = (Z + interference) / 2
    
    # Create holographic appearance
    im = ax.imshow(pattern, cmap='hsv', extent=[-5, 5, -5, 5], 
                    origin='lower', vmin=-1, vmax=1, interpolation='bilinear')
    
    ax.set_xlim(-5, 5)
    ax.set_ylim(-5, 5)
    ax.set_aspect('equal')
    ax.axis('off')
    ax.set_title(f'Weekly Hologram - Week {frame_num//10 + 1}', 
                color='cyan', fontsize=14, pad=10)
    
    return [im]

def create_hologram_animation():
    """Create animated GIF of rotating hologram pattern."""
    # Create output directory if it doesn't exist
    os.makedirs('demos', exist_ok=True)
    
    # Generate timestamp for unique filename
    timestamp = datetime.now().strftime('%Y%m%d')
    output_path = f'demos/weekly-hologram-{timestamp}.gif'
    
    # Setup figure
    fig = plt.figure(figsize=(8, 8), facecolor='black')
    ax = fig.add_subplot(111)
    fig.patch.set_facecolor('black')
    ax.set_facecolor('black')
    
    # Animation parameters
    frames = 60  # 60 frames for smooth rotation
    interval = 50  # 50ms per frame
    
    def animate(frame):
        angle = (frame / frames) * 2 * np.pi
        return generate_hologram_frame(ax, angle, frame)
    
    # Create animation
    anim = FuncAnimation(fig, animate, frames=frames, interval=interval, 
                        blit=True, repeat=True)
    
    # Save as GIF
    print(f"Generating hologram animation: {output_path}")
    writer = PillowWriter(fps=20, bitrate=1800)
    anim.save(output_path, writer=writer, dpi=80)
    print(f"Animation saved to {output_path}")
    
    plt.close()

if __name__ == '__main__':
    create_hologram_animation()

