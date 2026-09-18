import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const server = JSON.parse(await read('server.json'));
const example = JSON.parse(await read('examples/mcp-config.example.json'));
const dockerfile = await read('Dockerfile');
const readme = await read('README.md');
const readmeZh = await read('README.zh.md');

const expectedName = 'com.alderflux/msgmesh';
const expectedPackage = '@msgmesh/mcp-server';
const pkg = server.packages?.[0];

assert.equal(server.name, expectedName);
assert.equal(server.title, 'MsgMesh');
assert.equal(pkg?.identifier, expectedPackage);
assert.equal(pkg?.version, server.version);
assert.equal(pkg?.transport?.type, 'stdio');
assert.equal(pkg?.runtimeHint, 'npx');
assert.equal(pkg?.registryBaseUrl, 'https://registry.npmjs.org');

const args = example.mcpServers?.msgmesh?.args;
assert.deepEqual(args, ['-y', `${expectedPackage}@${server.version}`]);
assert.equal(example.mcpServers.msgmesh.command, 'npx');
assert.equal(example.mcpServers.msgmesh.env.MQ_API_KEY, 'mk_xxxxxxxx');

assert.match(dockerfile, new RegExp(`ARG MSGMESH_MCP_VERSION=${server.version.replaceAll('.', '\\.')}`));
assert.match(readme, new RegExp(`${expectedPackage.replace('/', '\\/')}@${server.version.replaceAll('.', '\\.')}`));
assert.match(readmeZh, new RegExp(`${expectedPackage.replace('/', '\\/')}@${server.version.replaceAll('.', '\\.')}`));

const logo = await readFile(new URL('assets/logo.png', root));
assert.equal(logo.toString('hex', 0, 8), '89504e470d0a1a0a', 'assets/logo.png must be a PNG');
assert.equal(logo.readUInt32BE(16), 400, 'assets/logo.png must be 400 px wide');
assert.equal(logo.readUInt32BE(20), 400, 'assets/logo.png must be 400 px high');

const npmResponse = await fetch('https://registry.npmjs.org/@msgmesh%2fmcp-server/latest');
assert.equal(npmResponse.status, 200, `npm registry returned ${npmResponse.status}`);
const npmPackage = await npmResponse.json();
assert.equal(npmPackage.version, server.version, 'server.json is behind the npm latest version');
assert.equal(npmPackage.mcpName, expectedName, 'npm mcpName differs from server.json');
assert.equal(npmPackage.license, 'MIT');

const registryUrl = 'https://registry.modelcontextprotocol.io/v0/servers?search=msgmesh&version=latest';
const registryResponse = await fetch(registryUrl);
assert.equal(registryResponse.status, 200, `official MCP Registry returned ${registryResponse.status}`);
const registry = await registryResponse.json();
const official = registry.servers
  ?.map(entry => entry.server)
  .find(entry => entry.name === expectedName);
assert.ok(official, 'MsgMesh is missing from the official MCP Registry');
assert.equal(official.version, server.version, 'official MCP Registry version differs from server.json');
assert.equal(official.packages?.[0]?.identifier, expectedPackage);
assert.equal(official.packages?.[0]?.version, server.version);

console.log(`✓ metadata, npm, official registry, examples, and logo agree on ${expectedPackage}@${server.version}`);
