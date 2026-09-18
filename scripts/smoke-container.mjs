import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';

const image = process.argv[2] || 'msgmesh-mcp:test';

const missingKey = spawnSync('docker', ['run', '--rm', image], {
  encoding: 'utf8',
  timeout: 15_000,
});
assert.notEqual(missingKey.status, 0, 'container must reject startup without MQ_API_KEY');
assert.match(`${missingKey.stdout}\n${missingKey.stderr}`, /MQ_API_KEY/);

const child = spawn('docker', [
  'run', '--rm', '-i',
  '-e', 'MQ_API_KEY=mk_test_0123456789abcdef',
  image,
], { stdio: ['pipe', 'pipe', 'pipe'] });

let stdout = '';
let stderr = '';
child.stdout.setEncoding('utf8');
child.stderr.setEncoding('utf8');
child.stdout.on('data', chunk => { stdout += chunk; });
child.stderr.on('data', chunk => { stderr += chunk; });

const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'msgmesh-mcp-repo-smoke', version: '1.0.0' },
  },
};
child.stdin.write(`${JSON.stringify(request)}\n`);

const result = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`initialize timed out; stderr: ${stderr}`)), 15_000);
  const poll = setInterval(() => {
    const line = stdout.split('\n').find(candidate => candidate.includes('"id":1'));
    if (!line) return;
    clearInterval(poll);
    clearTimeout(timer);
    resolve(JSON.parse(line));
  }, 50);
  child.once('error', error => {
    clearInterval(poll);
    clearTimeout(timer);
    reject(error);
  });
  child.once('exit', code => {
    if (stdout.includes('"id":1')) return;
    clearInterval(poll);
    clearTimeout(timer);
    reject(new Error(`container exited ${code}; stderr: ${stderr}`));
  });
}).finally(() => {
  child.stdin.end();
  child.kill('SIGTERM');
});

assert.equal(result.jsonrpc, '2.0');
assert.equal(result.id, 1);
assert.equal(result.result?.serverInfo?.name, 'msgmesh');
assert.match(result.result?.serverInfo?.version ?? '', /^\d+\.\d+\.\d+$/);
assert.ok(result.result?.capabilities?.tools, 'initialize response must advertise tools');

console.log(`✓ container rejects missing secrets and initializes as MsgMesh ${result.result.serverInfo.version}`);
