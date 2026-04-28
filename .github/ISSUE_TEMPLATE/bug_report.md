name: Bug Report
description: Report a bug or issue
title: "[BUG] "
labels: ["bug"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thanks for reporting a bug! Please fill in the details below.

  - type: textarea
    id: description
    attributes:
      label: Description
      description: Clear description of the bug
      placeholder: "What's the issue?"
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: How to reproduce the bug
      placeholder: |
        1. Navigate to...
        2. Click on...
        3. See error...
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What should happen?
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      description: What actually happens?
    validations:
      required: true

  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: |
        OS, browser, Node version, etc.
      placeholder: |
        - OS: Windows 10
        - Browser: Chrome 120
        - Node: 18.0.0
    validations:
      required: true

  - type: textarea
    id: logs
    attributes:
      label: Error Logs/Screenshots
      description: Any relevant error messages or screenshots
