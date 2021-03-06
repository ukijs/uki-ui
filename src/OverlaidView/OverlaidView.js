/* globals d3, uki */

import { ThemeableMixin } from '../ThemeableMixin/ThemeableMixin.js';
import defaultStyle from './style.less';

const { OverlaidView, OverlaidViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: uki.View,
  classDefFunc: SuperClass => {
    class OverlaidView extends ThemeableMixin({
      SuperClass, defaultStyle, className: 'OverlaidView', cnNotOnD3el: true
    }) {
      constructor (options = {}) {
        super(options);

        this._overlayContent = options.overlayContent || null;
        this._overlayShadow = options.overlayShadow || true;
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
        if (this.overlayVisible) {
          if (typeof this.overlayContent === 'string') {
            this.overlayContentEl.html(this.overlayContent);
          } else if (this.overlayContent instanceof uki.View) {
            this.overlayContent.render(this.overlayContentEl);
          } else if (typeof this.overlayContent === 'function') {
            this.overlayContent(this.overlayContentEl);
          }
        }

        this.overlayShadowEl.style('display', this.overlayVisible ? null : 'none');

        await super.draw(...arguments);

        if (this.overlayVisible) {
          this.updateOverlaySize();
        }
      }

      updateOverlaySize () {
        // Make sure the overlay covers both this.d3el and its parent, whichever
        // is larger (e.g. this.d3el might be scrolled)
        const bounds = this.getBounds();
        const parentBounds = this.getBounds(d3.select(this.d3el.node().parentNode));
        this.overlayShadowEl
          .style('top', '0px')
          .style('left', '0px')
          .style('width', Math.max(bounds.width, parentBounds.width) + 'px')
          .style('height', Math.max(bounds.height, parentBounds.height) + 'px')
          .classed('shadowed', this.overlayShadow);
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
