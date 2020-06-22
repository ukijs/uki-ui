/* globals d3 */
import { goldenlayout, tables } from './uki-ui.esm.js';

/*
 * WARNING: The capabilities in this example are still totally undocumented and
 * prone to rapid revision + breaking changes; use at your own risk!!
 */

const data = [
  { this: 3, is: 1, a: 4, test: 'one', table: new Date('5 May 2020') },
  { this: 9, is: 2, a: 6, test: 'five', table: new Date('3 May 2020') },
  { this: 5, is: 8, a: 9, test: 'seven', table: new Date('9 May 2020') },
  { this: 3, is: 2, a: 3, test: 'eight', table: new Date('4 May 2020') },
  { this: 6, is: 2, a: 6, test: 'one', table: new Date('4 May 2020') },
  { this: 3, is: 3, a: 8, test: 'three', table: new Date('2 May 2020') },
  { this: 7, is: 9, a: 5, test: 'zero', table: new Date('2 May 2020') },
  { this: 8, is: 8, a: 4, test: 'one', table: new Date('9 May 2020') },
  { this: 7, is: 1, a: parseInt('NaN'), test: null, table: undefined }
];

class BaseDemoView extends goldenlayout.GLViewMixin(tables.BaseTableView) {
  getRawRows () {
    return data;
  }
}

class FlexDemoView extends goldenlayout.GLViewMixin(tables.FlexTableView) {
  getRawRows () {
    return data;
  }
}

class RootView extends goldenlayout.GLRootView {
  constructor (options) {
    options.viewClassLookup = {
      BaseDemoView,
      FlexDemoView
    };
    options.glSettings = {
      settings: {
        // GoldenLayout has a (really buggy) feature for popping a view out in a
        // separate browser window; I usually disable this unless there is a
        // clear user need
        showPopoutIcon: false
      },
      content: [{
        type: 'row',
        isCloseable: false,
        content: [
          {
            type: 'column',
            isCloseable: false,
            content: [
              { type: 'component', componentName: 'BaseDemoView', componentState: {} }
            ]
          },
          {
            type: 'column',
            isCloseable: false,
            content: [
              { type: 'component', componentName: 'FlexDemoView', componentState: {} }
            ]
          }
        ]
      }]
    };
    super(options);
  }
}

window.rootView = new RootView({ d3el: d3.select('#glRoot') });
