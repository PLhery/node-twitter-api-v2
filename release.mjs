#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

function run(cmd, options = {}) {
  return execSync(cmd, { encoding: 'utf8', ...options }).trim();
}

const bump = process.argv[2];
if (!['major', 'minor', 'patch'].includes(bump)) {
  console.error('Usage: node release.mjs <major|minor|patch>');
  process.exit(1);
}

async function main() {
  const latestTag = run('git describe --tags --abbrev=0');
  const commitLines = run(`git log ${latestTag}..HEAD --pretty=format:%s`)
    .split('\n')
    .filter(Boolean);

  const entries = [];
  for (const line of commitLines) {
    const match = line.match(/^(.*) \(#(\d+)\)$/);
    if (!match) continue;
    const [, description, pr] = match;
    try {
      const res = await fetch(`https://api.github.com/repos/plhery/node-twitter-api-v2/pulls/${pr}`);
      const json = await res.json();
      const user = json.user?.login || 'unknown';
      entries.push(`- ${description} #${pr} (@${user})`);
    } catch {
      entries.push(`- ${description} #${pr}`);
    }
  }

  if (entries.length === 0) {
    console.error('No commit entries found.');
    process.exit(1);
  }

  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const [maj, min, pat] = pkg.version.split('.').map(Number);
  let newVersion;
  switch (bump) {
    case 'major':
      newVersion = `${maj + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${maj}.${min + 1}.0`;
      break;
    default:
      newVersion = `${maj}.${min}.${pat + 1}`;
  }

  pkg.version = newVersion;
  writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

  const changelog = readFileSync('changelog.md', 'utf8');
  const newChangelog = `${newVersion}\n------\n${entries.join('\n')}\n\n${changelog}`;
  writeFileSync('changelog.md', newChangelog);

  execSync('npm install --package-lock-only', { stdio: 'inherit' });

  run('git add package.json package-lock.json changelog.md');
  run(`git commit -m "upgrade to ${newVersion}"`);

  console.log(`Release ${newVersion} ready.`);
}

await main();
