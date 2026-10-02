// https://docs.expo.dev/versions/latest/config/metro/
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// backend/ is a separate Next.js app with its own node_modules; keep Metro from crawling or bundling it.
const backendDir = path.resolve(__dirname, "backend").replace(/[/\\]/g, "[/\\\\]");
config.resolver.blockList = [].concat(config.resolver.blockList ?? [], new RegExp(`^${backendDir}[/\\\\].*`));

module.exports = config;
