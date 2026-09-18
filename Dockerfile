FROM node:22-alpine

ARG MSGMESH_MCP_VERSION=0.1.8

LABEL org.opencontainers.image.title="MsgMesh MCP Server" \
      org.opencontainers.image.description="MCP server for publishing, consuming, and watching MsgMesh event streams" \
      org.opencontainers.image.source="https://github.com/LukeLogix/msgmesh-mcp" \
      org.opencontainers.image.url="https://msgmesh.alderflux.com/en/integrations/mcp" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="${MSGMESH_MCP_VERSION}"

RUN npm install --global --omit=dev --ignore-scripts "@msgmesh/mcp-server@${MSGMESH_MCP_VERSION}" \
    && npm cache clean --force

USER node
WORKDIR /home/node

ENTRYPOINT ["msgmesh-mcp"]
