import GlobalUI from './GlobalUI.js';

import * as utils from './utils/utils.js';
import * as components from './components/components.js';
import * as goldenlayout from './goldenlayout/goldenlayout.js';
import * as tables from './tables/tables.js';
import * as vis from './vis/vis.js';

if (globalThis.uki) {
  globalThis.uki.ui = {
    utils,
    components,
    goldenlayout,
    tables,
    vis,
    globalUI: new GlobalUI(globalThis.uki.globalOptions || {})
  };
}

export { utils };
export { components };
export { goldenlayout };
export { tables };
export { vis };
