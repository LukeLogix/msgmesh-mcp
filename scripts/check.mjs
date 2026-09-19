import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const example = JSON.parse(await read('examples/mcp-config.example.json'));
const dockerfile = await read('Dockerfile');
const readme = await read('README.md');
const readmeZh = await read('README.zh.md');

const expectedName = 'com.alderflux/msgmesh';
const expectedPackage = '@msgmesh/mcp-server';

const args = example.mcpServers?.msgmesh?.args;
assert.deepEqual(args, ['-y', expectedPackage]);
assert.equal(example.mcpServers.msgmesh.command, 'npx');
assert.equal(example.mcpServers.msgmesh.env.MQ_API_KEY, 'mk_xxxxxxxx');

assert.match(dockerfile, /ARG MSGMESH_MCP_VERSION=latest/);
assert.match(dockerfile, /@msgmesh\/mcp-server@\$\{MSGMESH_MCP_VERSION\}/);
assert.match(readme, /"@msgmesh\/mcp-server"/);
assert.match(readmeZh, /"@msgmesh\/mcp-server"/);
await assert.rejects(access(new URL('server.json', root)), /ENOENT/, 'server.json must remain upstream-only');

const glama = JSON.parse(await read('glama.json'));
assert.equal(glama.$schema, 'https://glama.ai/mcp/schemas/server.json');
assert.ok(glama.maintainers?.includes('LukeLogix'), 'glama.json must keep a maintainer who can edit the listing');
assert.deepEqual(Object.keys(glama).sort(), ['$schema', 'maintainers'], 'glama.json stays maintainer-only; no second version source');

const logo = await readFile(new URL('assets/logo.png', root));
assert.equal(logo.toString('hex', 0, 8), '89504e470d0a1a0a', 'assets/logo.png must be a PNG');
assert.equal(logo.readUInt32BE(16), 400, 'assets/logo.png must be 400 px wide');
assert.equal(logo.readUInt32BE(20), 400, 'assets/logo.png must be 400 px high');

const npmResponse = await fetch('https://registry.npmjs.org/@msgmesh%2fmcp-server/latest');
assert.equal(npmResponse.status, 200, `npm registry returned ${npmResponse.status}`);
const npmPackage = await npmResponse.json();
assert.equal(npmPackage.mcpName, expectedName, 'npm mcpName differs from the official namespace');
assert.equal(npmPackage.license, 'MIT');

const registryUrl = 'https://registry.modelcontextprotocol.io/v0/servers?search=msgmesh&version=latest';
const registryResponse = await fetch(registryUrl);
assert.equal(registryResponse.status, 200, `official MCP Registry returned ${registryResponse.status}`);
const registry = await registryResponse.json();
const official = registry.servers
  ?.map(entry => entry.server)
  .find(entry => entry.name === expectedName);
assert.ok(official, 'MsgMesh is missing from the official MCP Registry');
assert.equal(official.version, npmPackage.version, 'official MCP Registry is behind npm latest');
assert.equal(official.packages?.[0]?.identifier, expectedPackage);
assert.equal(official.packages?.[0]?.version, npmPackage.version);
assert.equal(official.packages?.[0]?.transport?.type, 'stdio');

if (process.argv.includes('--print-version')) {
  console.log(npmPackage.version);
} else {
  console.log(`✓ npm, official registry, versionless entry points, and logo agree on ${expectedPackage}@${npmPackage.version}`);
}
