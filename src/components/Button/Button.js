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
        this._label = options.label;
        this._img = options.img;
        this._disabled = options.disabled || false;
        this._primary = options.primary || false;
        this._badge = options.badge;
        this._borderless = options.borderless || false;
      }
      set size (value) {
        this._size = value;
        this.render();
      }
      get size () {
        return this._size;
      }
      set label (value) {
        this._label = value;
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
        this._badge = value;
        this.render();
      }
      get badge () {
        return this._badge;
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

        this.d3el.on('click', () => {
          if (!this.disabled) {
            this.trigger('click');
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
          .classed('imgOnly', this.img && this.label === undefined);

        this.d3el.select('img')
          .style('display', this.img ? null : 'none')
          .attr('src', this.img);

        this.d3el.select('.label')
          .style('display', this.label === undefined ? 'none' : null)
          .text(this.label);

        this.d3el.select('.badge')
          .style('display', this.badge === undefined ? 'none' : null)
          .text(this.badge);
      }
    }
    return Button;
  }
});
export { Button, ButtonMixin };
