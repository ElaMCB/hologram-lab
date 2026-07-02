#!/usr/bin/env python3
"""
Weekly hologram generation script for GitHub Actions.
Creates a new animated GIF of a rotating hologram simulation each week.
Keeps only the 4 most recent GIFs and updates docs/weekly-gallery.json for the main page.
"""

import glob
import json
import os
from datetime import datetime

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.animation import FuncAnimation, PillowWriter

KEEP_GIF_COUNT = 4
GALLERY_MANIFEST = "docs/weekly-gallery.json"
REPO_SLUG = "ElaMCB/hologram-lab"


def generate_hologram_frame(ax, angle, frame_num):
    """Generate a single frame of the hologram animation."""
    ax.clear()

    x = np.linspace(-5, 5, 100)
    y = np.linspace(-5, 5, 100)
    X, Y = np.meshgrid(x, y)

    Z = np.sin(np.sqrt(X**2 + Y**2) - angle + np.pi / 4) * np.cos(angle)
    Z += 0.5 * np.sin(2 * np.sqrt(X**2 + Y**2) - 2 * angle)

    R = np.sqrt(X**2 + Y**2)
    interference = np.cos(2 * np.pi * R / 2 - angle * 2)
    pattern = (Z + interference) / 2

    im = ax.imshow(
        pattern,
        cmap="hsv",
        extent=[-5, 5, -5, 5],
        origin="lower",
        vmin=-1,
        vmax=1,
        interpolation="bilinear",
    )

    ax.set_xlim(-5, 5)
    ax.set_ylim(-5, 5)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_title(
        f"Weekly Hologram - Week {frame_num // 10 + 1}",
        color="cyan",
        fontsize=14,
        pad=10,
    )

    return [im]


def prune_old_gifs(keep=KEEP_GIF_COUNT):
    """Remove older weekly GIFs, keeping only the newest `keep` files."""
    files = sorted(glob.glob("demos/weekly-hologram-*.gif"), reverse=True)
    for old in files[keep:]:
        os.remove(old)
        print(f"Removed old GIF: {old}")


def write_gallery_manifest(keep=KEEP_GIF_COUNT):
    """Write manifest consumed by docs/index.html weekly gallery section."""
    files = sorted(glob.glob("demos/weekly-hologram-*.gif"), reverse=True)[:keep]
    items = []
    for path in files:
        stamp = os.path.basename(path).replace("weekly-hologram-", "").replace(".gif", "")
        items.append(
            {
                "file": path.replace("\\", "/"),
                "date": f"{stamp[:4]}-{stamp[4:6]}-{stamp[6:8]}",
            }
        )

    os.makedirs("docs", exist_ok=True)
    with open(GALLERY_MANIFEST, "w", encoding="utf-8") as out:
        json.dump({"repo": REPO_SLUG, "items": items}, out, indent=2)
        out.write("\n")
    print(f"Updated gallery manifest: {GALLERY_MANIFEST} ({len(items)} items)")


def create_hologram_animation():
    """Create animated GIF of rotating hologram pattern."""
    os.makedirs("demos", exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d")
    output_path = f"demos/weekly-hologram-{timestamp}.gif"

    fig = plt.figure(figsize=(8, 8), facecolor="black")
    ax = fig.add_subplot(111)
    fig.patch.set_facecolor("black")
    ax.set_facecolor("black")

    frames = 60
    interval = 50

    def animate(frame):
        angle = (frame / frames) * 2 * np.pi
        return generate_hologram_frame(ax, angle, frame)

    anim = FuncAnimation(
        fig, animate, frames=frames, interval=interval, blit=True, repeat=True
    )

    print(f"Generating hologram animation: {output_path}")
    writer = PillowWriter(fps=20, bitrate=1800)
    anim.save(output_path, writer=writer, dpi=80)
    print(f"Animation saved to {output_path}")

    plt.close()

    prune_old_gifs()
    write_gallery_manifest()


if __name__ == "__main__":
    create_hologram_animation()
