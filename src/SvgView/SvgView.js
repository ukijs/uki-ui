/* globals d3, uki, XMLSerializer, Blob */

const { SvgView, SvgViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: uki.View,
  classDefFunc: SuperClass => {
    class SvgView extends SuperClass {
      async setup () {
        const tagName = this.d3el.node().tagName.toUpperCase();
        if (tagName !== 'SVG') {
          throw new Error(`SvgView's d3el is ${tagName}, not SVG`);
        }
        await super.setup(...arguments);
      }

      download () {
        // Adapted from https://stackoverflow.com/a/37387449/1058935
        const containerElements = ['svg', 'g'];
        const relevantStyles = {
          svg: ['width', 'height'],
          rect: ['fill', 'stroke', 'stroke-width', 'opacity'],
          p: ['font', 'opacity'],
          '.node': ['cursor', 'opacity'],
          path: ['fill', 'stroke', 'stroke-width', 'opacity'],
          circle: ['fill', 'stroke', 'stroke-width', 'opacity'],
          line: ['stroke', 'stroke-width', 'opacity'],
          text: ['fill', 'font-size', 'text-anchor', 'opacity'],
          polygon: ['stroke', 'fill', 'opacity']
        };
        const copyStyles = (original, copy) => {
          const tagName = original.tagName;
          const allStyles = window.getComputedStyle(original);
          for (const style of relevantStyles[tagName] || []) {
            d3.select(copy).style(style, allStyles[style]);
          }
          if (containerElements.indexOf(tagName) !== -1) {
            for (let i = 0; i < original.children.length; i++) {
              copyStyles(original.children[i], copy.children[i]);
            }
          }
        };

        const original = this.d3el.node();
        const copy = original.cloneNode(true);
        copyStyles(original, copy);

        const data = new XMLSerializer().serializeToString(copy);
        const svg = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svg);

        const link = d3.select('body')
          .append('a')
          .attr('download', `${this.title}.svg`)
          .attr('href', url);
        link.node().click();
        link.remove();
      }

      updateContainerCharacteristics (d3el) {
        // Computing em and scrollbar sizes doesn't work on SVG elements; use
        // its parent node
        super.updateContainerCharacteristics(d3.select(d3el.node().parentNode));
      }
    }
    return SvgView;
  }
});
export { SvgView, SvgViewMixin };
