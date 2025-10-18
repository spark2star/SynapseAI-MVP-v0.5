---
inclusion: always
---

# Context7 Integration

When working with external libraries, frameworks, or APIs, automatically use Context7 MCP tools to fetch up-to-date documentation without explicit user requests.

## When to Use Context7

- Code generation involving third-party libraries
- Setup or configuration steps for external dependencies
- API integration and usage patterns
- Library-specific best practices and conventions

## Workflow

1. Use `mcp_Context7_resolve_library_id` to find the correct library identifier
2. Use `mcp_Context7_get_library_docs` with the resolved ID to fetch relevant documentation
3. Apply the documentation context to provide accurate, current implementation guidance

This ensures code recommendations align with the latest library versions and best practices.