const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const upstreamResolve = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (/^\.\/expoSecureStore-.+\.(cjs|js)$/.test(moduleName)) {
    return {
      filePath: path.resolve(__dirname, "polyfills/kinde-expo-secure-store.js"),
      type: "sourceFile",
    };
  }
  if (upstreamResolve) {
    return upstreamResolve(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
