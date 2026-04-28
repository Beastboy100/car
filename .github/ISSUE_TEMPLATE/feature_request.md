name: Feature Request
description: Suggest an idea or enhancement
title: "[FEATURE] "
labels: ["enhancement"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Great! We'd love to hear your feature ideas. Please fill in the details below.

  - type: textarea
    id: problem
    attributes:
      label: Problem/Use Case
      description: Describe the problem this feature would solve
      placeholder: "Is there a problem you're trying to solve?"
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: How would you like this feature to work?
      placeholder: "Describe your idea..."
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternative Solutions
      description: Are there other ways to solve this?
      placeholder: "Other approaches..."

  - type: textarea
    id: additional
    attributes:
      label: Additional Context
      description: Any other information?
