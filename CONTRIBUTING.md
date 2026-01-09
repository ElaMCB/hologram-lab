# Contributing to Hologram Lab

Thank you for your interest in contributing to Hologram Lab! This document provides guidelines and instructions for contributing.

## Getting Help

**Is your hologram blurry? Need help troubleshooting?**

- Open an issue with the `help-wanted` label
- Join our community discussions
- Check existing issues for similar problems

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/ElaMCB/hologram-lab/issues)
2. If not, open a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Python version, etc.)
   - Screenshots if applicable

### Suggesting Enhancements

1. Check existing issues and discussions
2. Open an issue with the `enhancement` label
3. Describe the feature and its benefits
4. Discuss implementation approach if you have ideas

### Contributing Code

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/hologram-lab.git
   cd hologram-lab
   ```

2. **Set up development environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -e ".[dev]"
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes**
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed
   - Run tests: `pytest`

5. **Commit your changes**
   ```bash
   git commit -m "Add: your feature description"
   ```
   Use clear, descriptive commit messages.

6. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a PR on GitHub with a clear description of your changes.

## Good First Issues

Look for issues labeled `good-first-issue` - these are great for new contributors! Examples:
- Convert resources bullet list to table (if not already done)
- Add more example holograms
- Improve documentation
- Add unit tests
- Fix typos or improve clarity

## Code Style

- Follow PEP 8 for Python code
- Use type hints where appropriate
- Add docstrings to functions and classes
- Keep functions focused and small
- Write meaningful variable names

We use `black` for formatting:
```bash
black simulations/
```

## Testing

- Write tests for new features
- Ensure all tests pass: `pytest`
- Aim for good test coverage
- Include both unit and integration tests where appropriate

## Documentation

- Update README.md if adding new features
- Add docstrings to code
- Update this CONTRIBUTING.md if needed
- Include examples in docstrings

## Project Structure

```
hologram-lab/
├── real-holograms/     # Physical hologram tutorials
├── simulations/        # CGH algorithms and code
├── github-page-hologram/  # WebGL hologram demo
├── resources/          # Curated resources
├── demos/             # Example outputs
└── .github/           # GitHub Actions and templates
```

## Git Submodules

If you're working with the CGH library submodule:

```bash
# Initialize submodules
git submodule update --init --recursive

# Update submodule to latest
git submodule update --remote cgh-lib
```

## Pull Request Process

1. Ensure your code passes all tests
2. Update documentation as needed
3. Add a clear description of changes
4. Reference related issues
5. Request review from maintainers
6. Address review feedback promptly

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue with the `question` label or reach out to maintainers directly.

Thank you for contributing to Hologram Lab!

