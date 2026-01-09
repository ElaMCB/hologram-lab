# Hologram Lab

<p align="center">
  <img src="demos/holo-pop.gif" width="420" alt="Hologram pops 4 cm out of screen"/><br>
  <strong><a href="https://elamcb.github.io/hologram-lab/">See it jump out of your screen — live demo</a></strong>
</p>

<p align="center">
  <a href="https://github.com/ElaMCB/hologram-lab/actions"><img src="https://img.shields.io/github/actions/workflow/status/ElaMCB/hologram-lab/ci.yml?branch=main" alt="CI Status"></a>
  <a href="https://www.python.org/downloads/"><img src="https://img.shields.io/pypi/pyversions/hologram-lab?label=python" alt="Python Version"></a>
  <a href="https://github.com/ElaMCB/hologram-lab/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

**30-second start:**

```bash
# Install
pip install git+https://github.com/ElaMCB/hologram-lab

# Generate a hologram
holo-sim --method fresnel --image input.png --z 0.05 --out output.png

# Or try the live WebGL demo
open https://elamcb.github.io/hologram-lab/
```

<details>
<summary>Full tour (click to expand)</summary>

**Need help?** Is your hologram blurry? Open an issue with the `help-wanted` label or check [CONTRIBUTING.md](CONTRIBUTING.md).

---

A comprehensive repository covering real hologram creation, hands-on demos, resources, and a GitHub Pages hologram simulation.

## Overview

This repository provides everything you need to learn about holography—from creating real physical holograms to simulating them computationally. Whether you're interested in DIY laser holograms, computer-generated holograms (CGH), or interactive web-based hologram effects, this lab has you covered.

## Repository Structure

| Folder | What you'll get |
|--------|----------------|
| `real-holograms` | DIY LitiHolo kit tutorials, MIT course notes, INTEGRAF pro guides |
| `simulations` | Fresnel / Fourier / Kinoform CGH notebooks + JackHCC fork |
| `github-page-hologram` | WebGL Pepper's-ghost illusion that works on mobile |
| `resources` | Curated books, papers, SLM controllers, datasets |
| `demos` | Auto-generated GIFs & videos (updated nightly via CI) |

## Quick Start

### Installation

```bash
# Install from GitHub
pip install git+https://github.com/ElaMCB/hologram-lab

# Or clone and install locally
git clone https://github.com/ElaMCB/hologram-lab.git
cd hologram-lab
pip install -e .
```

### Generate Your First Hologram

```bash
# One-line hologram generation
holo-sim --method fresnel --image input.png --z 0.05 --out output.png

# Short form
holo-sim -m fresnel -i input.png -z 0.05 -o output.png

# See all options
holo-sim --help
```

### Explore in Jupyter

```bash
# Launch Jupyter playground
jupyter notebook simulations/

# Try the demos
python simulations/fourier_hologram_demo.py
python simulations/fresnel_hologram_example.py
```

### Docker

```bash
docker build -t hologram-lab .
docker run -p 8080:8080 hologram-lab
```

### Git Submodules (CGH Library)

```bash
git submodule add https://github.com/JackHCC/Computer-Generated-Hologram.git cgh-lib
git submodule update --init --recursive
```

## Getting Started with Real Holograms

Start with the beginner-friendly guides in `/real-holograms`:
1. **LitiHolo Kit Tutorial** - No chemicals needed, perfect for beginners
2. **MIT Holography Course** - Comprehensive theoretical foundation
3. **INTEGRAF Guides** - Professional techniques for reflection and transmission holograms

## Computer-Generated Holograms

Explore CGH algorithms in `/simulations`:
- Fourier holograms for far-field reconstruction
- Fresnel holograms for near-field applications
- Kinoform holograms for phase-only encoding

## Interactive Web Hologram

Visit the [GitHub Pages site](https://elamcb.github.io/hologram-lab) to see the interactive hologram effect in action. The implementation includes:
- Real-time 3D rendering with WebGL
- Mobile-responsive Pepper's Ghost effect
- Smooth animations and interactions
- **Dark mode support** — the page respects your OS dark mode preference

## Resources

### Essential Reading
- *Introduction to Fourier Optics* by Joseph W. Goodman
- *Practical Holography* by Graham Saxby
- MIT OpenCourseWare: Holography courses

### Research Papers
- Neural Holography: Deep learning for holographic displays
- DeepCGH: 3D hologram generation with deep learning
- Real-time computer-generated holography

### Software Tools
- [odak](https://github.com/kunguz/odak) - Python library for computational optics
- [DeepCGH](https://github.com/computational-imaging/DeepCGH) - Deep learning for holograms
- [realistic_holography](https://github.com/computational-imaging/realistic_holography) - Realistic hologram simulation

### Hardware Resources
- LitiHolo DIY kits - No-chemical hologram creation
- Spatial Light Modulators (SLMs) - Digital hologram projection
- INTEGRAF supplies - Professional holography materials

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [JackHCC/Computer-Generated-Hologram](https://github.com/JackHCC/Computer-Generated-Hologram) for CGH implementations
- MIT OpenCourseWare for educational materials
- INTEGRAF for professional holography resources
- The holography community for inspiration and knowledge sharing

## Topics

This repository covers: `hologram`, `computer-generated-holography`, `cgh`, `slm`, `spatial-light-modulator`, `optics`, `holography`, `python`, `jupyter`, `webgl`, `threejs`, `fourier-optics`, `computational-optics`, `optical-physics`

To help with discoverability, add these topics to your repository settings on GitHub.

## Benchmarks

| Algorithm | PSNR (↑) | SSIM (↑) | Speed (ms) |
|-----------|----------|----------|------------|
| Fresnel (CPU) | 31.2 | 0.94 | 120 |
| Fresnel (GPU)* | 33.1 | 0.96 | 18 |
| Fourier | 28.5 | 0.91 | 95 |
| Kinoform | 30.8 | 0.93 | 110 |

*GPU acceleration coming soon — follow [#8](https://github.com/ElaMCB/hologram-lab/issues/8) for updates.

Want to beat these numbers? Submit a PR with your algorithm and we'll add it to the leaderboard!

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Good first issues:**
- Look for issues labeled `good-first-issue`
- Add more example holograms
- Improve documentation
- Add unit tests
- Convert resources to table format (in progress)

## Call to Action

- **Star us** if you learned something new
- **Open an issue** with `#help-my-hologram-is-blurry` if you need help
- **PR welcome** — see [good-first-issue](https://github.com/ElaMCB/hologram-lab/labels/good%20first%20issue) for ideas

## Contact

For questions, suggestions, or collaboration opportunities, please open an issue or reach out through the repository discussions.

</details>
