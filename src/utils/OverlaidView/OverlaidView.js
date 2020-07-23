/* globals d3, uki */

import { ThemeableMixin } from '../ThemeableMixin/ThemeableMixin.js';
import defaultStyle from './style.less';

const { OverlaidView, OverlaidViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: uki.View,
  classDefFunc: SuperClass => {
    class OverlaidView extends ThemeableMixin({
      SuperClass, defaultStyle, className: 'OverlaidView'
    }) {
      constructor (options = {}) {
        super(options);

        this._overlayContent = options.overlayContent || null;
        this._overlayShadow = options.overlayShadow || false;
        this._overlayVisible = options.overlayVisible || false;
      }

      get overlayContent () {
        return this._overlayContent;
      }

      set overlayContent (value) {
        this._overlayContent = value;
        this.render();
      }

      get overlayShadow () {
        return this._overlayShadow;
      }

      set overlayShadow (value) {
        this._overlayShadow = value;
        this.render();
      }

      get overlayVisible () {
        return this._overlayVisible;
      }

      set overlayVisible (value) {
        this._overlayVisible = value;
        this.render();
      }

      async setup () {
        await super.setup(...arguments);
        // Place a layer on top of this.d3el
        const parent = d3.select(this.d3el.node().parentNode);
        this.overlayShadowEl = parent.append('div')
          .classed('overlayShadowEl', true)
          .style('display', 'none');
        this.overlayContentEl = this.overlayShadowEl.append('div')
          .classed('overlayContentEl', true);
      }

      async draw () {
        // Match the position / size of this.d3el, relative to its parent
        const bounds = this.getBounds();
        const parentBounds = this.getBounds(d3.select(this.d3el.node().parentNode));
        this.overlayShadowEl
          .style('top', bounds.top - parentBounds.top)
          .style('left', bounds.left - parentBounds.left)
          .style('right', bounds.right - parentBounds.right)
          .style('bottom', bounds.bottom - parentBounds.bottom)
          .classed('shadowed', this.overlayShadow);

        if (this.overlayVisible) {
          if (this.overlayContent === null || typeof this.overlayContent === 'string') {
            this.overlayContentEl.html(this.overlayContent);
          } else if (this.overlayContent instanceof uki.View) {
            this.overlayContent.render(this.overlayContentEl);
          } else if (typeof this.overlayContent === 'function') {
            this.overlayContent(this.overlayContentEl);
          }
        }

        this.overlayShadowEl.style('display', this.overlayVisible ? null : 'none');

        await super.draw(...arguments);
      }

      async showOverlay ({
        content,
        hide,
        shadow
      } = {}) {
        this._overlayVisible = !hide;
        if (content !== undefined) {
          this._overlayContent = content;
        }
        if (shadow !== undefined) {
          this._overlayShadow = shadow;
        }
        await this.render();
      }

      async hideOverlay () {
        this.showOverlay({ hide: true });
      }
    }
    return OverlaidView;
  }
});
export { OverlaidView, OverlaidViewMixin };
