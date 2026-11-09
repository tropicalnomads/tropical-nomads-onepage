import { existsSync, lstatSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const rootNext = join(repoRoot, 'node_modules', 'next');
const appNext = join(repoRoot, 'apps', 'web', 'node_modules', 'next');

function isRealPackage(path) {
  if (!existsSync(path) || lstatSync(path).isSymbolicLink()) {
    return false;
  }
  return existsSync(join(path, 'package.json'));
}

if (!isRealPackage(rootNext)) {
  throw new Error(
    'Amplify requires a real node_modules/next directory at the repository root. A pnpm symlink is not enough. Set nodeLinker: hoisted in pnpm-workspace.yaml and reinstall.',
  );
}

// A symlink here points at the pnpm store. Amplify copies the link without its
// target, then reports that next is missing. The hoisted package at the root
// is the one the server runs.
if (existsSync(appNext) && lstatSync(appNext).isSymbolicLink()) {
  rmSync(appNext);
}

const { version } = JSON.parse(readFileSync(join(rootNext, 'package.json'), 'utf8'));
console.log(`Amplify next runtime ready (${version})`);
