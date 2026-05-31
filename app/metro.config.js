// 1. FORCE THE POLYFILL AT THE ABSOLUTE TOP OF METRO INITIALIZATION
require('./utils/metro-polyfill.js'); 

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
