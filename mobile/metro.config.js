// Nécessaire pour que Metro résolve @paristats/shared, en dehors de mobile/,
// dans ce monorepo npm workspaces. https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// disableHierarchicalLookup cassait la résolution de paquets imbriqués (ex.
// expo-modules-core nichée dans mobile/node_modules/expo/node_modules/) —
// npm ne hisse pas toujours tout à plat. On garde le lookup hiérarchique par défaut.

module.exports = config;
