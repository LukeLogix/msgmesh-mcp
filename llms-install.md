# Installing the MsgMesh MCP server

Use these instructions when a user asks you to install or configure MsgMesh in an MCP client.

## Safety boundary

- You may inspect the client configuration and prepare a config entry.
- Do not invent, retrieve, expose, or commit an API key.
- Ask the user to create a key at <https://msgmesh-panel.alderflux.com> → **Keys**.
- Prefer the client's secret store when it has one. Otherwise explain that its local config contains
  the key in plaintext and confirm the file is excluded from version control.
- Do not ask the agent to call `create_key` after a 403. That tool also requires admin scope.

## Requirements

- Node.js 18 or newer
- An MCP client that supports local stdio servers
- `MQ_API_KEY`

## Command

Use the public npm package; cloning this repository is not required:

```text
npx -y @msgmesh/mcp-server@0.1.8
```

## Configuration

Merge this entry into the client's existing MCP configuration without deleting unrelated servers:

```json
{
  "mcpServers": {
    "msgmesh": {
      "command": "npx",
      "args": ["-y", "@msgmesh/mcp-server@0.1.8"],
      "env": {
        "MQ_API_KEY": "mk_xxxxxxxx"
      }
    }
  }
}
```

Replace `mk_xxxxxxxx` only with a value supplied by the user through an appropriate secret-handling
path. The hosted control-plane, gateway, and realtime URLs are defaults and should not be added unless
the user explicitly uses a self-hosted deployment.

## Verify

1. Restart or reload the MCP client.
2. Confirm the server completes initialization and exposes tools.
3. Call `get_plan` first. Success confirms the key is valid and has admin scope.
4. For a non-destructive functional check, call `list_topics` only after the user agrees to contact
   their MsgMesh account.

Interpret failures as follows:

- Startup error mentioning `MQ_API_KEY`: the value is missing or still a placeholder.
- 401: the key is invalid or revoked.
- 403: the key lacks the required scope or capability; the user must issue a suitable key in the panel.

## Important semantics

`consume_messages`, `watch_topic`, and `dlq_peek` advance consumer-group offsets. Do not use them as
read-only verification calls. When watching a stream, keep the same group across the
**watch → react → watch again** loop.
