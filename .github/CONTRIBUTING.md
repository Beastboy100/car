# Contributing to MB MOTORS

Thanks for your interest in contributing! Here's how you can help:

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mb-motors.git
   cd mb-motors
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your local values
   ```

## Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and test locally:
   ```bash
   npm run dev
   ```

3. **Run linter**:
   ```bash
   npm run lint
   ```

4. **Commit with clear messages**:
   ```bash
   git commit -m "feat: description of your change"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** with a clear description

## Code Style

- Use `const`/`let` (not `var`)
- Add JSDoc comments for functions
- Follow the existing code style
- Keep functions focused and testable

## Issues

- Check if an issue exists before creating one
- Use provided issue templates
- Include steps to reproduce for bugs
- Be clear and descriptive

## Questions?

Open an issue with the `question` label or reach out to the maintainers.

Happy coding! 🚀
