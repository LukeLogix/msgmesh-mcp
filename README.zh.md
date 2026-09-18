<div align="center">
  <img src="assets/logo.svg" width="96" height="96" alt="MsgMesh 標誌">
  <h1>MsgMesh MCP Server</h1>
  <p>讓 AI agent 透過 MCP 發布、消費與等待持久事件流。</p>

  [官網](https://msgmesh.alderflux.com) · [MCP 教學](https://msgmesh.alderflux.com/integrations/mcp) · [npm](https://www.npmjs.com/package/@msgmesh/mcp-server) · [English](README.md)
</div>

## 這個 repo 是什麼

這是 [`@msgmesh/mcp-server`](https://www.npmjs.com/package/@msgmesh/mcp-server) 的公開安裝與
目錄落腳點，放置 MCP 目錄與自動安裝器需要的 Dockerfile、安裝說明與品牌素材。

MCP server 實作以公開、MIT 授權的 npm 套件發佈，刻意不複製到這裡：可執行內容只有一份
真相源，本 repo 維持小而可稽核。

## 加入 MCP client

需要 Node.js 18 以上與一把 MsgMesh API Key。先到
[MsgMesh 面板](https://msgmesh-panel.alderflux.com)註冊，再到 **Keys** 頁簽發金鑰。

把以下設定加入 Claude Desktop、Cursor 或其他支援 JSON 設定的 MCP client：

```json
{
  "mcpServers": {
    "msgmesh": {
      "command": "npx",
      "args": ["-y", "@msgmesh/mcp-server"],
      "env": {
        "MQ_API_KEY": "mk_xxxxxxxx"
      }
    }
  }
}
```

將 `mk_xxxxxxxx` 換成真實金鑰。設定含機密時不得 commit。官方託管位址已有預設值，只有
自架時才需要覆寫。

`npx -y @msgmesh/mcp-server` 會跟隨最新版；上游發版流程負責讓 npm 與官方 MCP Registry
維持同版。

## Agent 能做什麼

目前提供的 tools 可用於：

- 以 `publish_message`、`consume_messages`、`watch_topic` 收發與等待事件；
- 管理 topic、schema、webhook、function 與 API key；
- 查用量、稽核、方案、帳務、presence 與接入片段；
- 查看與重放 Webhook 死信。

`watch_topic` 會長輪詢到事件抵達，讓 agent 以 **watch → 反應 → 再 watch** 的方式監看，
不必每分鐘輪詢。

> `consume_messages`、`watch_topic`、`dlq_peek` 會推進 consumer group 位移，屬 at-most-once，
> 不是沒有副作用的查詢。

多數治理工具需要 `admin` scope。若收到 401／403，請回面板簽發正確權限的 key；不要叫 agent
以 `create_key` 自助開通，因為簽發 key 本身也需要 admin。

## 用 Docker 執行

```bash
docker build -t msgmesh-mcp .
docker run --rm -i -e MQ_API_KEY msgmesh-mcp
```

需要可重現建置時，可以明確傳入已發布版本：

```bash
version=$(npm view @msgmesh/mcp-server version)
docker build --build-arg "MSGMESH_MCP_VERSION=$version" -t "msgmesh-mcp:$version" .
```

stdio MCP 必須保留 stdin。金鑰只在執行時注入，不得寫入 image。Glama 等目錄可直接建置同一份
Dockerfile，再用其 secret 設定注入 `MQ_API_KEY`。

## 環境變數

| 變數 | 必填 | 預設 | 用途 |
|---|---:|---|---|
| `MQ_API_KEY` | 是 | — | MsgMesh API key；admin scope 可使用完整治理工具。 |
| `MQ_CONTROL_PLANE_URL` | 否 | `https://msgmesh-api.alderflux.com` | Topic、key、用量等管理 API。 |
| `MQ_GATEWAY_URL` | 否 | `https://msgmesh-api.alderflux.com` | 發布、消費與 DLQ API。 |
| `MQ_REALTIME_URL` | 否 | `https://msgmesh-api.alderflux.com` | Realtime presence API。 |

自架時覆寫三個 URL。完整設定形狀見
[`examples/mcp-config.example.json`](examples/mcp-config.example.json)。

## 驗證與安全

CI 會動態讀取 npm 最新版、確認官方 MCP Registry 同版，再把該精確版本傳給 Docker 建置；
同時檢查 400×400 目錄圖示、缺 key 會拒絕啟動，以及 MCP `initialize` 握手可用。因此一般
套件發版不需要修改本 repo。

- 不要 commit `MQ_API_KEY`，也不要貼進 issue。
- 只需收發資料時，使用最小能力的 key。
- 安全問題請依 [`SECURITY.md`](SECURITY.md) 私下回報。
- 一般安裝問題可開 GitHub issue 或寄信至 `alderflux@gmail.com`。

## 授權

MIT，見 [`LICENSE`](LICENSE)。
