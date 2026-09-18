<div align="center">
  <img src="assets/logo.svg" width="96" height="96" alt="MsgMesh logo">
  <h1>MsgMesh MCP Server</h1>
  <p>Let AI agents publish, consume, and watch durable event streams through MCP.</p>

  [Website](https://msgmesh.alderflux.com) · [MCP guide](https://msgmesh.alderflux.com/en/integrations/mcp) · [npm](https://www.npmjs.com/package/@msgmesh/mcp-server) · [繁體中文](README.zh.md)
</div>

## What this repository is

This is the public installation and discovery repository for
[`@msgmesh/mcp-server`](https://www.npmjs.com/package/@msgmesh/mcp-server).
It contains the files MCP directories and automated installers need: verified setup instructions, a
Dockerfile, machine-readable server metadata, and reusable brand assets.

The server implementation is distributed as a public MIT-licensed npm package. It is deliberately
not copied here: one published package remains the executable source of truth, while this repository
stays a small, auditable entry point.

## Install in an MCP client

You need Node.js 18 or newer and a MsgMesh API key. Create an account in the
[MsgMesh panel](https://msgmesh-panel.alderflux.com), then issue a key from the **Keys** page.

Add this to Claude Desktop, Cursor, or another client that accepts MCP JSON configuration:

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

Replace `mk_xxxxxxxx` with your real key. Do not commit the resulting configuration when it contains
a secret. The hosted API URLs are built in; self-hosters can override them as documented below.

The unpinned command `npx -y @msgmesh/mcp-server` follows the newest release. The version above is
pinned so directory builds and examples remain reproducible.

## What agents can do

The current server exposes 29 tools for:

- publishing, consuming, and waiting for events with `watch_topic`;
- managing topics, schemas, webhooks, functions, and API keys;
- inspecting usage, audit events, plans, billing, presence, and connection snippets;
- inspecting and replaying dead-lettered webhook deliveries.

`watch_topic` long-polls until events arrive, allowing an agent to follow a
**watch → react → watch again** loop without periodic polling.

> `consume_messages`, `watch_topic`, and `dlq_peek` advance a consumer-group position. They are
> at-most-once operations, not side-effect-free reads.

Most management tools require an `admin`-scope key. A producer or consumer key can only use the
data-plane operations granted to it. If a client returns 401 or 403, issue the appropriate key in the
panel instead of asking the agent to call `create_key`—creating a key also requires admin scope.

## Run with Docker

Build the pinned image:

```bash
docker build -t msgmesh-mcp .
```

MCP over stdio needs an interactive stdin stream:

```bash
docker run --rm -i \
  -e MQ_API_KEY \
  msgmesh-mcp
```

Pass secrets at runtime; never bake them into the image. MCP directories such as Glama can build the
same Dockerfile and inject `MQ_API_KEY` through their secret configuration.

## Configuration

| Variable | Required | Default | Purpose |
|---|---:|---|---|
| `MQ_API_KEY` | Yes | — | MsgMesh API key. An admin-scope key enables all management tools. |
| `MQ_CONTROL_PLANE_URL` | No | `https://msgmesh-api.alderflux.com` | Topics, keys, usage, and other management APIs. |
| `MQ_GATEWAY_URL` | No | `https://msgmesh-api.alderflux.com` | Publish, consume, and DLQ APIs. |
| `MQ_REALTIME_URL` | No | `https://msgmesh-api.alderflux.com` | Realtime presence API. |

For a self-hosted deployment, override all three URLs. See [`examples/mcp-config.example.json`](examples/mcp-config.example.json)
for a complete configuration shape.

## For AI coding agents

[`llms-install.md`](llms-install.md) contains a short, safety-aware installation procedure intended
for coding agents. It explicitly separates actions an agent may perform from the step where the user
must supply a secret.

## Verification

CI verifies that:

- `server.json`, the Dockerfile, examples, npm, and the official MCP Registry all agree on the version;
- the 400×400 PNG directory logo has the required dimensions;
- the container refuses to start without `MQ_API_KEY`;
- the container completes an MCP `initialize` handshake without contacting a tenant account.

The check runs on every change and daily to detect a new upstream package release.

## Security and support

- Never commit `MQ_API_KEY` or paste it into an issue.
- Use the minimum capabilities needed when an agent only publishes or consumes data.
- Report security concerns privately as described in [`SECURITY.md`](SECURITY.md).
- For setup questions, open a GitHub issue or email `alderflux@gmail.com`.

## License

MIT. See [`LICENSE`](LICENSE).
