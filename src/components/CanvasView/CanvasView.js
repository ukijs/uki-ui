/* globals d3, uki */
import { ParentSizeViewMixin } from '../../utils/utils.js';

const { CanvasView, CanvasViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: uki.View,
  classDefFunc: SuperClass => {
    class CanvasView extends ParentSizeViewMixin(SuperClass) {
      async setup () {
        const tagName = this.d3el.node().tagName.toUpperCase();
        if (tagName !== 'CANVAS') {
          throw new Error(`CanvasView's d3el is ${tagName}, not CANVAS`);
        }
        await super.setup(...arguments);
      }

      download () {
        const link = d3.select('body')
          .append('a')
          .attr('download', `${this.title}.png`)
          .attr('href', this.d3el.node().toDataURL('image/png;base64'));
        link.node().click();
        link.remove();
      }
    }
    return CanvasView;
  }
});
export { CanvasView, CanvasViewMixin };
