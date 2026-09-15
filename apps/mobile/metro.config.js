const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch shared workspace source (product-engine, types) imported via tsconfig paths.
// SDK 52+ handles monorepo node_modules resolution automatically — do NOT set
// nodeModulesPaths or disableHierarchicalLookup (breaks react-native-web internals).
config.watchFolders = [workspaceRoot];

module.exports = withNativeWind(config, { input: "./global.css" });
