/* globals uki */
import { ThemeableMixin, RecolorableImageViewMixin } from '../../utils/utils.js';
import defaultStyle from './style.less';

const { Button, ButtonMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: uki.View,
  classDefFunc: SuperClass => {
    class Button extends RecolorableImageViewMixin(ThemeableMixin({
      SuperClass, defaultStyle, className: 'UkiButton'
    })) {
      constructor (options) {
        super(options);

        this._size = options.size;
        this._label = options.label === undefined ? null : options.label;
        this._img = options.img;
        this._disabled = options.disabled || false;
        this._primary = options.primary || false;
        this._badge = options.badge === undefined ? null : options.badge;
        this._borderless = options.borderless || false;
        this._tooltip = options.tooltip;
        this._onclick = options.onclick || null;
      }
      set size (value) {
        this._size = value;
        this.render();
      }
      get size () {
        return this._size;
      }
      set label (value) {
        this._label = value === undefined ? null : value;
        this.render();
      }
      get label () {
        return this._label;
      }
      set img (value) {
        this._img = value;
        this.render();
      }
      get img () {
        return this._img;
      }
      set disabled (value) {
        this._disabled = value;
        this.render();
      }
      get disabled () {
        return this._disabled;
      }
      set primary (value) {
        this._primary = value;
        this.render();
      }
      get primary () {
        return this._primary;
      }
      set borderless (value) {
        this._borderless = value;
        this.render();
      }
      get borderless () {
        return this._borderless;
      }
      set badge (value) {
        this._badge = value === undefined ? null : value;
        this.render();
      }
      get badge () {
        return this._badge;
      }
      set tooltip (value) {
        this._tooltip = value;
        this.render();
      }
      get tooltip () {
        return this._tooltip;
      }
      set onclick (value) {
        this._onclick = value;
        this.render();
      }
      get onclick () {
        return this._onclick;
      }
      setup () {
        super.setup(...arguments);
        this.d3el.classed('button', true);
        this.d3el.append('img')
          .style('display', 'none');
        this.d3el.append('div')
          .classed('label', true)
          .style('display', 'none');
        this.d3el.append('div')
          .classed('badge', true)
          .style('display', 'none');

        this.d3el.on('click.UkiButton', () => {
          if (!this.disabled) {
            if (this.onclick) {
              this.onclick();
            }
            this.trigger('click');
          }
        }).on('mouseenter.UkiButton', () => {
          if (this.tooltip) {
            const tooltipArgs = Object.assign({
              targetBounds: this.d3el.node().getBoundingClientRect()
            }, this.tooltip);
            globalThis.uki.showTooltip(tooltipArgs);
          }
        });
      }
      draw () {
        super.draw(...arguments);

        this.d3el
          .classed('large', this.size === 'large')
          .classed('button-primary', this.primary)
          .classed('button-disabled', this.disabled)
          .classed('button-borderless', this.borderless)
          .classed('hasImg', this.img)
          .classed('imgOnly', this.img && this.label === null);

        this.d3el.select('img')
          .style('display', this.img ? null : 'none')
          .attr('src', this.img);

        this.d3el.select('.label')
          .style('display', this.label === null ? 'none' : null)
          .text(this.label);

        this.d3el.select('.badge')
          .style('display', this.badge === null ? 'none' : null)
          .text(this.badge);
      }
    }
    return Button;
  }
});
export { Button, ButtonMixin };
