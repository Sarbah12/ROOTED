const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

function escapedPathRegex(folderName) {
  return new RegExp(`^${path.resolve(projectRoot, folderName).replace(/[/\\]/g, '[/\\\\]')}[/\\\\].*$`);
}

config.watchFolders = [projectRoot];
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : [config.resolver.blockList]),
  escapedPathRegex('Rooted'),
  escapedPathRegex('dist'),
  escapedPathRegex('.expo'),
].filter(Boolean);

module.exports = config;
