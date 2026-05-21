# MCP Worker Stubs

These files are learning scaffolds for model-specific MCP workers.

## Workers

- `gemini_worker.py`: placeholder `gemini-frontend` server.
- `claude_worker.py`: placeholder `claude-backend` server.

Each server exposes a `delegate_task` tool and returns a stub response. They do not call real Gemini or Claude APIs yet.

## Example Registration

From the project root:

```bash
codex mcp add gemini-frontend -- python3 .codex/mcp-servers/gemini_worker.py
codex mcp add claude-backend -- python3 .codex/mcp-servers/claude_worker.py
```

Restart Codex after registering MCP servers so the tools appear in a new session.

## Real Implementation Later

To make these real, replace the stub response in `tools/call` with:

1. API key loading from environment variables.
2. A provider SDK call or HTTP request.
3. A structured response containing changed files, decisions, verification, and risks.
