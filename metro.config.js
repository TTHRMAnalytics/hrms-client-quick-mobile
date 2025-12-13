// metro.config.js

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    blockList: [
      /android\/app\/build\/.*/,
      /android\/build\/.*/,
      /android\/\.gradle\/.*/,
      /ios\/build\/.*/,
      /ios\/Pods\/.*/,
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
