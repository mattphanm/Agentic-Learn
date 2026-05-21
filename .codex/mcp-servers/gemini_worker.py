#!/usr/bin/env python3
"""Gemini-backed MCP worker for bounded frontend task delegation."""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request


WORKER_NAME = "gemini-frontend"
MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-2.5-pro")
SPECIALTY = "frontend UI, visual design, component implementation, and large-context UI review"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
PLACEHOLDER_VALUES = {"", "REPLACE_ME", "YOUR_GEMINI_API_KEY"}


def respond(message_id, result):
    sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": message_id, "result": result}) + "\n")
    sys.stdout.flush()


def respond_error(message_id, code, message):
    sys.stdout.write(
        json.dumps({"jsonrpc": "2.0", "id": message_id, "error": {"code": code, "message": message}}) + "\n"
    )
    sys.stdout.flush()


def tool_result(text):
    return {"content": [{"type": "text", "text": text}], "isError": False}


def call_gemini(task, context):
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if api_key in PLACEHOLDER_VALUES:
        raise RuntimeError("Set GEMINI_API_KEY before using gemini-frontend.")

    prompt = (
        f"You are the {WORKER_NAME} worker for this project.\n"
        f"Specialty: {SPECIALTY}.\n"
        "You are not alone in the codebase; do not revert unrelated edits.\n"
        "Return changed files, key decisions, verification steps, and unresolved risks.\n\n"
        f"Context:\n{context or '(none provided)'}\n\n"
        f"Task:\n{task}"
    )
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": float(os.environ.get("GEMINI_TEMPERATURE", "0.4")),
            "maxOutputTokens": int(os.environ.get("GEMINI_MAX_OUTPUT_TOKENS", "4096")),
        },
    }
    model = urllib.parse.quote(MODEL_NAME, safe="")
    url = GEMINI_API_URL.format(model=model) + "?" + urllib.parse.urlencode({"key": api_key})
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=int(os.environ.get("GEMINI_TIMEOUT_SECONDS", "120"))) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini API error {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Gemini API request failed: {exc.reason}") from exc

    parts = payload.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    text = "".join(part.get("text", "") for part in parts).strip()
    if not text:
        raise RuntimeError(f"Gemini API returned no text: {json.dumps(payload)}")
    return text


def handle_request(request):
    method = request.get("method")
    message_id = request.get("id")

    if method == "initialize":
        respond(
            message_id,
            {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": WORKER_NAME, "version": "0.1.0"},
            },
        )
        return

    if method == "tools/list":
        respond(
            message_id,
            {
                "tools": [
                    {
                        "name": "delegate_task",
                        "description": f"Delegate a bounded task to a {MODEL_NAME} worker specializing in {SPECIALTY}.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "task": {"type": "string", "description": "The task to perform."},
                                "context": {"type": "string", "description": "Relevant project context."},
                            },
                            "required": ["task"],
                        },
                    }
                ]
            },
        )
        return

    if method == "tools/call":
        params = request.get("params", {})
        if params.get("name") != "delegate_task":
            respond_error(message_id, -32601, "Unknown tool")
            return

        args = params.get("arguments", {})
        task = args.get("task", "")
        context = args.get("context", "")
        try:
            respond(message_id, tool_result(call_gemini(task, context)))
        except Exception as exc:
            respond_error(message_id, -32603, str(exc))
        return

    if message_id is not None:
        respond_error(message_id, -32601, f"Unsupported method: {method}")


def main():
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            handle_request(json.loads(line))
        except Exception as exc:
            sys.stdout.write(json.dumps({"jsonrpc": "2.0", "error": {"code": -32603, "message": str(exc)}}) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
