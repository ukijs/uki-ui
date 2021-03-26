/* globals d3, uki */

const { CanvasView, CanvasViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: uki.View,
  classDefFunc: SuperClass => {
    class CanvasView extends SuperClass {
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

      updateContainerCharacteristics (d3el) {
        // Computing em and scrollbar sizes doesn't work on canvas elements; use
        // its parent node
        super.updateContainerCharacteristics(d3.select(d3el.node().parentNode));
      }
    }
    return CanvasView;
  }
});
export { CanvasView, CanvasViewMixin };
