# Hologram Lab

[![Live Interactive Hologram](https://img.shields.io/badge/Live_Interactive_Hologram-View_Now-00ffff?style=for-the-badge&logo=github)](https://elamcb.github.io/hologram-lab/)

**[View Interactive Hologram Simulation](https://elamcb.github.io/hologram-lab/)** - Experience the live WebGL hologram effect

**Need help?** Is your hologram blurry? Open an issue with the `help-wanted` label or check [CONTRIBUTING.md](CONTRIBUTING.md).

---

A comprehensive repository covering real hologram creation, hands-on demos, resources, and a GitHub Pages hologram simulation.

![Hologram Simulation](demos/hologram-preview.gif)

## Overview

This repository provides everything you need to learn about holography—from creating real physical holograms to simulating them computationally. Whether you're interested in DIY laser holograms, computer-generated holograms (CGH), or interactive web-based hologram effects, this lab has you covered.

## Repository Structure

### `/real-holograms`
Tutorials and guides for making actual physical holograms:
- **DIY Laser Holograms** using LitiHolo kits—no chemicals, self-developing film
- **MIT-style holography course materials** (open-source)
- **Step-by-step guides** from INTEGRAF for reflection & transmission holograms

### `/simulations`
Computer-Generated Hologram (CGH) algorithms and implementations:
- Fork or clone [JackHCC/Computer-Generated-Hologram](https://github.com/JackHCC/Computer-Generated-Hologram) for Fourier, Fresnel, and Kinoform holograms
- Jupyter notebooks replicating results
- Python/MATLAB scripts from [kmdouglass.github.io](https://kmdouglass.github.io) for inline hologram simulation

### `/github-page-hologram`
Interactive hologram effect for your GitHub Pages site:
- **WebGL + Three.js** floating 3D hologram of your repo logo or rotating object
- **Pepper's Ghost pyramid simulator** (CSS + JS) that works on mobile/desktop
- Optional: webcam-based interaction using Instructables interactive hologram guide

### `/resources`
Curated list of holography resources:
- **Books**: Introduction to Fourier Optics by Goodman
- **Papers**: Neural Holography, Deep Learning in Holography
- **Tools**: odak, DeepCGH, realistic_holography GitHub repos
- **Hardware**: SLM controllers, holographic displays, DIY kits

### `/demos`
Short videos or GIFs of:
- Real holograms you made
- Simulated holograms rotating in 3D
- GitHub Pages hologram effect in action

## Quick Start

Get up and running in 5 minutes:

```bash
# Clone the repository
git clone https://github.com/ElaMCB/hologram-lab.git
cd hologram-lab

# Install dependencies (recommended: use a virtual environment)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Or install as a package
pip install -e .

# Launch Jupyter to explore simulations
jupyter notebook simulations/

# Try the Fourier hologram demo
python simulations/fourier_hologram_demo.py
```

### Alternative: Docker

```bash
docker build -t hologram-lab .
docker run -p 8080:8080 hologram-lab
```

Visit `http://localhost:8080` to see the hologram simulation.

### Using Git Submodules (CGH Library)

To include the Computer-Generated-Hologram library as a submodule:

```bash
git submodule add https://github.com/JackHCC/Computer-Generated-Hologram.git cgh-lib
git submodule update --init --recursive
```

This keeps upstream updates one command away: `git submodule update --remote cgh-lib`

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

Visit the [GitHub Pages site](https://yourusername.github.io/hologram-lab) to see the interactive hologram effect in action. The implementation includes:
- Real-time 3D rendering with WebGL
- Mobile-responsive Pepper's Ghost effect
- Smooth animations and interactions

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Areas where contributions are especially appreciated:
- Additional hologram tutorials and guides
- New CGH algorithms and implementations
- Improvements to the web-based hologram simulation
- Documentation and examples

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

## CLI Usage

Install the package and use the command-line interface:

```bash
pip install -e .

# Generate a Fresnel hologram from an image
holo-sim --method fresnel --image input.png --z 0.05 --out output.png

# Generate a Fourier hologram
holo-sim --method fourier --image input.png --out output.png

# See all options
holo-sim --help
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Good first issues:**
- Look for issues labeled `good-first-issue`
- Add more example holograms
- Improve documentation
- Add unit tests
- Convert resources to table format (in progress)

## Contact

For questions, suggestions, or collaboration opportunities, please open an issue or reach out through the repository discussions.
