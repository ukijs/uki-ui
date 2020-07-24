/* globals uki */
import { ParentSizeViewMixin } from '../ParentSizeView/ParentSizeView.js';

const { IFrameView, IFrameViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: uki.View,
  classDefFunc: SuperClass => {
    class IFrameView extends ParentSizeViewMixin(SuperClass) {
      constructor (options) {
        super(options);
        this._src = options.src;
        this.frameLoaded = !this._src; // We are loaded if no src is initially provided
      }

      async setup () {
        const tagName = this.d3el.node().tagName.toUpperCase();
        if (tagName !== 'IFRAME') {
          throw new Error(`IFrameView's d3el is ${tagName}, not IFRAME`);
        }
        await super.setup(...arguments);
        this.d3el
          .on('load', () => { this.trigger('viewLoaded'); })
          .attr('src', this.src);
      }

      get src () {
        return this._src;
      }

      set src (src) {
        this.frameLoaded = !src;
        this._src = src;
        this.d3el.attr('src', this._src);
        this.render();
      }

      get isLoading () {
        return super.isLoading || !this.frameLoaded;
      }

      openAsTab () {
        window.open(this._src, '_blank');
      }
    }
    return IFrameView;
  }
});
export { IFrameView, IFrameViewMixin };
