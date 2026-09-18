# Security policy

## Reporting a vulnerability

Please do not disclose a suspected vulnerability in a public issue and do not include API keys,
tokens, tenant data, or request payloads containing private information.

Send a concise report to `alderflux@gmail.com` with:

- the affected package version;
- reproduction steps that do not expose another user's data;
- the observed and expected behavior;
- any suggested mitigation.

You will receive an acknowledgement before any public disclosure is coordinated.

## Supported version

Only the latest published `@msgmesh/mcp-server` version receives fixes. This repository pins that
version for reproducible directory builds and uses a daily CI check to detect when the pin falls behind.
