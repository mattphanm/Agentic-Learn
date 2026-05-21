# Project Agent Instructions

## Codex Multi-Model Orchestration

Use Codex as the primary orchestrator for this project. For learning purposes, model the system as if Codex can delegate bounded subtasks to MCP-registered workers backed by different models, then integrate their outputs locally.

This repository is a learning scaffold. Do not assume the Gemini or Claude workers are actually registered unless `codex mcp list` shows them.

## Product / Brand Context

When building frontend UI, websites, landing pages, or using the `frontend-design` skill, first read:

- `docs/brand.md`

Treat `docs/brand.md` as the source of truth for product positioning, audience, tone, visual direction, copy constraints, required content, and design constraints.

### Available Worker Roles

- `gemini-frontend`: Frontend UI, layout, visual systems, interaction polish, large-context UI review, and component-level changes.
- `claude-backend`: Backend architecture, APIs, data flow, server logic, integration code, and shared application behavior.
- `codex-tests`: Test planning, test implementation, regression checks, and verification commands.
- `codex-review`: Final code review, integration consistency, local verification, and merge readiness.

### When To Delegate

Delegate when the work has separable parts that can run in parallel, such as frontend/backend/tests, investigation plus implementation, or independent bug reproduction paths.

Keep work local when the task is small, tightly coupled, urgent, or when the next step depends directly on one answer.

### Delegation Rules

- Give each worker a concrete, self-contained task.
- Define the worker's ownership area, including files or modules if known.
- Tell workers they are not alone in the codebase and must not revert unrelated edits.
- Ask workers to return changed files, key decisions, verification steps, and unresolved risks.
- Do not assign overlapping write scopes to multiple workers.
- Review worker output before integrating it.

### Orchestrator Workflow

1. Understand the user request and inspect relevant local context.
2. Decide whether delegation is useful.
3. If delegating, split work by ownership and send precise prompts to the MCP workers.
4. Continue local non-overlapping work while workers run.
5. Review worker results, integrate compatible changes, and resolve conflicts.
6. Run focused verification.
7. Report the final result, including what was delegated and what was verified.

### Example Worker Prompts

Frontend:

```text
You are the Gemini frontend worker for this project. Implement or review the UI portion of the requested feature. Own only frontend files you need to change. You are not alone in the codebase; do not revert unrelated edits. Return changed files, design choices, screenshots or visual verification if available, and unresolved risks.
```

Backend:

```text
You are the Claude backend worker for this project. Implement or review the server/data-flow portion of the requested feature. Own only backend and integration files needed for your task. You are not alone in the codebase; do not revert unrelated edits. Return changed files, behavior changes, assumptions, verification steps, and unresolved risks.
```

Tests:

```text
You are the test worker for this project. Add or update focused tests for the requested change. Own only test files and minimal fixtures. You are not alone in the codebase; do not revert unrelated edits. Return changed files, commands run, and remaining coverage gaps.
```

Review:

```text
You are the Codex review worker for this project. Review the integrated frontend, backend, and test changes for correctness, consistency, regressions, and missing verification. Do not modify files unless explicitly asked. Return findings first, ordered by severity, with file references.
```
