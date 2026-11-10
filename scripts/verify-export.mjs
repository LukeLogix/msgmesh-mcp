// Verifies that the exported source snapshot still matches export-manifest.json.
// The manifest is written by the release workflow; files it lists must not be
// edited by hand. Usage: node scripts/verify-export.mjs [root-dir]
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.argv[2] ?? fileURLToPath(new URL('../', import.meta.url)));
const hint = 'These files are exported from a release and cannot be edited here; open an issue instead (see CONTRIBUTING.md).';

let manifest;
try {
  manifest = JSON.parse(await readFile(join(root, 'export-manifest.json'), 'utf8'));
} catch (error) {
  assert.fail(`export-manifest.json is missing or unreadable (${error.code ?? error.message}). ${hint}`);
}

assert.equal(manifest.schemaVersion, 1, 'unsupported export-manifest.json schemaVersion');
assert.ok(Array.isArray(manifest.managedPaths) && manifest.managedPaths.length > 0, 'manifest.managedPaths must be a non-empty array');
assert.ok(manifest.files && typeof manifest.files === 'object', 'manifest.files must be an object');

const listed = new Set(Object.keys(manifest.files));
const mismatches = [];

// 1. Every listed file exists and its SHA-256 matches.
for (const [path, expected] of Object.entries(manifest.files)) {
  assert.ok(!path.startsWith('/') && !path.split('/').includes('..'), `unsafe path in manifest: ${path}`);
  let data;
  try {
    data = await readFile(join(root, path));
  } catch {
    mismatches.push(`missing: ${path}`);
    continue;
  }
  const actual = `sha256:${createHash('sha256').update(data).digest('hex')}`;
  if (actual !== expected) mismatches.push(`modified: ${path}`);
}

// 2. Every file under a managed directory is listed (no extra files).
for (const managed of manifest.managedPaths) {
  if (!managed.endsWith('/')) {
    if (!listed.has(managed)) mismatches.push(`not in manifest: ${managed}`);
    continue;
  }
  const dir = join(root, managed);
  const info = await stat(dir).catch(() => null);
  if (!info?.isDirectory()) {
    mismatches.push(`missing directory: ${managed}`);
    continue;
  }
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    const full = join(entry.parentPath ?? entry.path, entry.name);
    const rel = full.slice(root.length + 1).split(sep).join('/');
    if (!listed.has(rel)) mismatches.push(`unexpected file: ${rel}`);
  }
}

assert.equal(mismatches.length, 0, `exported source differs from export-manifest.json:\n  ${mismatches.join('\n  ')}\n${hint}`);

// 3. package.json version matches the manifest.
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
assert.equal(pkg.version, manifest.package?.version, 'package.json version differs from export-manifest.json');

console.log(`✓ exported source matches manifest: ${manifest.package.name}@${manifest.package.version} (${listed.size} files, ${manifest.source?.tag || 'no tag'})`);
