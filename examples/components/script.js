/* globals d3, uki */
import * as ui from './uki-ui.esm.js';

/*
 * WARNING: The capabilities in this example are still totally undocumented and
 * prone to rapid revision + breaking changes; use at your own risk!!
 */

/* eslint-disable indent */
class BasicDemoView extends ui.InformativeViewMixin(
                            ui.GLView) {
  constructor (options) {
    options.resources = [{
      type: 'text',
      url: 'lipsum.html',
      name: 'lipsum'
    }];
    super(options);
  }

  setup () {
    super.setup(...arguments);
    this.d3el.html(this.getNamedResource('lipsum'));
  }
}

class ModalLauncherView extends ui.GLView {
  get title () {
    return 'Buttons, Tooltips, and Modals';
  }

  setup () {
    super.setup({
      lessArgs: {
        modifyVars: {
          '@contentPadding': '2em'
        }
      }
    });
    this.d3el.style('padding', '1em');

    for (const disabled of [false, true]) {
      for (const primary of [false, true]) {
        for (const showBadge of [false, true]) {
          const wrapper = this.d3el.append('div');
          for (const img of [undefined, 'openIcon.svg']) {
            for (const label of [undefined, 'Show Modal']) {
              this.createButton(wrapper, img, label, showBadge, disabled, primary);
            }
          }
        }
      }
    }
  }

  createButton (wrapper, img, label, showBadge, disabled, primary) {
    const container = wrapper.append('div')
      .style('display', 'inline-block')
      .style('margin-bottom', '2em');
    let count = 0;
    const button = new ui.ButtonView({
      d3el: container.append('div').style('margin-right', '2em'),
      label,
      img,
      badge: showBadge ? 0 : undefined,
      disabled,
      primary
    });
    const modalResult = container.append('div')
      .style('position', 'absolute')
      .style('font-size', '0.5em')
      .style('margin-top', '-1em');
    const showModalFunc = () => {
      uki.showModal({
        content: 'This is an example modal',
        buttonSpecs: [
          {
            label: 'Cancel',
            onclick: () => {
              modalResult.text('Clicked Cancel');
              uki.hideModal();
              count -= 1;
              button.badge = count;
            }
          },
          {
            label: 'OK',
            primary: true,
            onclick: () => {
              modalResult.text('Clicked OK');
              uki.hideModal();
              count += 1;
              button.badge = count;
            }
          }
        ]
      });
    };
    button.onclick = showModalFunc;
    button.d3el.on('mouseenter', function () {
      const generateRandomEntries = length => {
        return Array.from({ length }, () => {
          const childLength = Math.floor(Math.random() * length / 2);
          const result = { label: childLength };
          if (childLength > 0) {
            result.subEntries = generateRandomEntries(childLength);
          } else {
            result.checked = true;
          }
          return result;
        });
      };

      uki.showContextMenu({
        targetBounds: this.getBoundingClientRect(),
        menuEntries: [
          { label, img, badge: count, disabled, primary, onclick: showModalFunc },
          null,
          {
            label: 'Button properties',
            subEntries: [
              { label: 'badge: ' + (count === 0 && !showBadge ? 'hidden' : count) },
              { label: 'label: ' + (label || '(no label)') },
              { label: 'img: ' + (img || '(no img)') },
              { label: 'primary: ' + primary.toString() },
              { label: 'disabled: ' + disabled.toString() }
            ]
          },
          null,
          {
            label: 'Random Submenu Test',
            subEntries: generateRandomEntries(100)
          }
        ]
      });
    });
  }
}

class SvgDemoView extends ui.InformativeViewMixin(
                          ui.SvgGLView) {
  get emptyMessage () {
    return 'This is an SVG view';
  }

  setup () {
    super.setup(...arguments);
    const circle = this.d3el.append('circle')
      .attr('r', 20)
      .style('fill', 'var(--text-color-softer)');
    this.d3el.on('mousemove', event => {
      const coords = d3.pointer(event);
      circle
        .attr('cx', coords[0])
        .attr('cy', coords[1]);
    });
  }

  drawFrame () {
    console.log('frame');
  }
}

class IFrameView extends ui.InformativeViewMixin(
                         ui.IFrameGLViewMixin(
                         ui.GLView)) {
  constructor (options) {
    options.src = 'https://github.com/ukijs/uki';
    super(options);
  }

  get emptyMessage () {
    return 'This is an iframe view';
  }
}

class LineView extends ui.LineChartViewMixin(
                       ui.InformativeViewMixin(
                       ui.SvgGLView)) {
  constructor (options) {
    super(options);
    globalThis.setTimeout(() => {
      // Simulate loading for a while so that we can demo the
      // InformativeViewMixin spinner
      this.generateRandomData();
    }, 4000);
  }

  generateRandomData () {
    const now = +(new Date());
    this.timeSeries = Array.from({ length: Math.floor(Math.random() * 300) }, (d, i) => {
      return { timestamp: new Date(now + i * 60 * 1000), count: Math.random() * 300 };
    });
  }

  getXScale (width) {
    return d3.scaleTime()
      .domain(d3.extent(this.timeSeries, d => d.timestamp))
      .range([0, width]);
  }

  getYScale (height) {
    return d3.scaleLinear()
      .domain(d3.extent(this.timeSeries, d => d.count))
      .range([height, 0]);
  }

  getLineGenerator () {
    return d3.line()
      .x(d => this.xScale(d.timestamp))
      .y(d => this.yScale(d.count));
  }

  updateTimeSeries () {
    const now = +(new Date());
    this.timeSeries = Array.from({ length: Math.floor(Math.random() * 300) }, (d, i) => {
      return { timestamp: new Date(now + i * 60 * 1000), count: Math.random() * 300 };
    });
  }
}

class VegaView extends ui.VegaViewMixin(
                       ui.InformativeViewMixin(
                       ui.GLView)) {
  constructor (options) {
    options.resources = options.resources || [];
    options.resources.push({
      type: 'json', url: 'vegaLiteSpec.json', name: 'liteSpec'
    });
    options.liteSpec = 'liteSpec';
    super(options);
  }

  async draw () {
    await super.draw(...arguments);

    throw new Error('Sorry, VegaView is not fully implemented just yet');
  }
}

class RootView extends ui.GLRootView {
  constructor (options) {
    options.viewClassLookup = {
      BasicDemoView,
      SvgDemoView,
      IFrameView,
      ModalLauncherView,
      LineView,
      VegaView
    };
    options.glSettings = {
      content: [{
        type: 'row',
        isCloseable: false,
        content: [
          {
            type: 'column',
            content: [
              {
                type: 'row',
                content: [
                  { type: 'component', componentName: 'BasicDemoView', componentState: {} },
                  { type: 'component', componentName: 'IFrameView', componentState: {} },
                  { type: 'component', componentName: 'SvgDemoView', componentState: {} }
                ]
              },
              { type: 'component', componentName: 'ModalLauncherView', componentState: {} }
            ]
          },
          {
            type: 'stack',
            content: [
              { type: 'component', componentName: 'LineView', componentState: {} },
              { type: 'component', componentName: 'VegaView', componentState: {} }
            ]
          }
        ]
      }]
    };
    super(options);
  }
}

window.rootView = new RootView({ d3el: d3.select('#glRoot') });
