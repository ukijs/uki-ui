/* globals d3, uki */
import { goldenlayout, components, utils, vis } from './uki-ui.esm.js';

/*
 * WARNING: The capabilities in this example are still totally undocumented and
 * prone to rapid revision + breaking changes; use at your own risk!!
 */

/* eslint-disable indent */
class BasicDemoView extends utils.LoadingViewMixin(goldenlayout.GLView) {
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

class ModalLauncherView extends goldenlayout.GLView {
  get title () {
    return 'Buttons, Tooltips, and Modals';
  }
  setup () {
    super.setup({ lessArgs: { modifyVars: {
      '@contentPadding': '2em'
    } } });
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
    const button = new components.Button({
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
        content: `
          <div>This is an example modal</div>
          <div>It accepts arbitrary html</div>
        `,
        buttons: [
          {
            label: 'Cancel',
            className: 'cancel',
            onclick: () => {
              modalResult.text('Clicked Cancel');
              uki.hideModal();
              count -= 1;
              button.badge = count;
            }
          },
          {
            label: 'OK',
            className: 'ok',
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
    button.on('click', showModalFunc);
    button.d3el.on('mouseenter', function () {
      const generateRandomEntries = length => {
        return Array.from({ length }, () => {
          const childLength = Math.floor(Math.random() * length / 2);
          const result = { content: childLength };
          if (childLength > 0) {
            result.subEntries = generateRandomEntries(childLength);
          }
          return result;
        });
      };

      uki.showContextMenu({
        targetBounds: this.getBoundingClientRect(),
        menuEntries: [
          { content: { label, img, badge: count, disabled, primary }, onclick: showModalFunc },
          { content: null },
          { content: 'Button properties',
            subEntries: [
            { content: 'badge: ' + (count === 0 && !showBadge ? 'hidden' : count) },
            { content: 'label: ' + (label || '(no label)') },
            { content: 'img: ' + (img || '(no img)') },
            { content: 'primary: ' + primary.toString() },
            { content: 'disabled: ' + disabled.toString() }
          ] },
          { content: null },
          { content: 'Random Submenu Test',
            subEntries: generateRandomEntries(100) }
        ]
      });
    });
  }
}

class SvgDemoView extends utils.LoadingViewMixin(
                          utils.EmptyStateViewMixin(goldenlayout.SvgGLView)) {
  get emptyMessage () {
    return `This is an SVG view`;
  }
  setup () {
    super.setup(...arguments);
    const circle = this.d3el.append('circle').attr('r', 20);
    this.d3el.on('mousemove', function () {
      const coords = d3.mouse(this);
      circle
        .attr('cx', coords[0])
        .attr('cy', coords[1])
        .style('fill', 'var(--text-color-softer)');
    });
  }
  drawFrame () {
    console.log('frame');
  }
}

class IFrameView extends utils.LoadingViewMixin(
                         utils.EmptyStateViewMixin(
                         goldenlayout.IFrameGLViewMixin(goldenlayout.GLView))) {
  constructor (options) {
    options.src = 'https://www.xkcd.com';
    super(options);
  }
  get emptyMessage () {
    return 'This is an iframe view';
  }
}

class LineView extends utils.LoadingViewMixin(
                       utils.EmptyStateViewMixin(
                       vis.LineChartViewMixin(goldenlayout.SvgGLView))) {
  constructor (options) {
    options.resources = options.resources || [];
    options.resources.push({
      type: 'json',
      url: 'lineData.json',
      name: 'lineData',
      then: rawData => {
        return rawData.map(point => {
          point.timestamp = new Date(point.timestamp);
          return point;
        });
      }
    });
    super(options);
    this.ready.then(() => {
      this.timeSeries = this.getNamedResource('lineData');
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

class RootView extends goldenlayout.GLRootView {
  constructor (options) {
    options.viewClassLookup = {
      BasicDemoView,
      SvgDemoView,
      IFrameView,
      ModalLauncherView,
      LineView
    };
    options.glSettings = {
      content: [{
        type: 'stack',
        isCloseable: false,
        content: [
          { type: 'component', componentName: 'BasicDemoView', componentState: {} },
          { type: 'component', componentName: 'IFrameView', componentState: {} },
          { type: 'component', componentName: 'SvgDemoView', componentState: {} },
          { type: 'component', componentName: 'ModalLauncherView', componentState: {} },
          { type: 'component', componentName: 'LineView', componentState: {} }
        ]
      }]
    };
    super(options);
  }
}

window.rootView = new RootView({ d3el: d3.select('#glRoot') });
