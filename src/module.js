import GlobalUI from './GlobalUI.js';

import * as utils from './utils/utils.js';
import * as components from './components/components.js';
import * as goldenlayout from './goldenlayout/goldenlayout.js';
import * as tables from './tables/tables.js';
import * as vis from './vis/vis.js';

import pkg from '../package.json';
const version = pkg.version;

const globalUI = new GlobalUI(globalThis.uki.globalOptions || {});

globalThis.uki.ui = {
  utils,
  components,
  goldenlayout,
  tables,
  vis,
  version,
  globalUI
};

export { utils, components, goldenlayout, tables, vis, version, globalUI };
