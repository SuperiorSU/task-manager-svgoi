const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch monorepo packages
config.watchFolders = [monorepoRoot];

// `watchFolders` above covers the whole monorepo so mobile can pick up
// changes in shared packages/*. But it also picks up build-output churn
// from sibling apps (`next dev`'s .next/cache, api's dist, turbo's cache),
// which run concurrently under root `pnpm dev`. Each of those file writes
// looked like a source change to Metro and triggered a Fast Refresh reload
// of whatever RN screen was mounted, resetting focus mid-typing on forms
// like Create User. Block those directories from the watcher.
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList]),
  /apps\/web\/\.next\/.*/,
  /apps\/web\/node_modules\/.*/,
  /apps\/api\/dist\/.*/,
  /apps\/api\/node_modules\/.*/,
  /\.turbo\/.*/,
  // Additional watch noise found still triggering reloads after the above:
  // VSCode/git polling touches .git/index, .git/FETCH_HEAD, etc. on every
  // status check; each workspace package's own dist/ build output and .expo
  // caches churn the same way as the sibling app outputs blocked above.
  //
  // This must stay scoped to `packages/*/dist` — an earlier version used a
  // bare `/\/dist\/.*/`, which also matched `/dist/` inside node_modules
  // (e.g. whatwg-fetch's `dist/fetch.umd.js`, its actual entry point) and
  // made Metro treat real, needed package files as blocked/nonexistent.
  /\.git\/.*/,
  /packages\/[^/]+\/dist\/.*/,
  /\.expo\/.*/,
  /\.log$/,
];

// Resolve packages from monorepo root first
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// pnpm's node_modules is a tree of symlinks into a shared content-addressed
// store, and packages resolve their own dependencies via "exports" fields
// scoped to their own private node_modules folder (e.g. @expo/metro-runtime
// -> whatwg-fetch). Metro's resolver doesn't follow either of those by
// default, so transitive deps that aren't hoisted next to the app fail to
// resolve, and packages with an "exports" map fall back to guessed paths.
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
