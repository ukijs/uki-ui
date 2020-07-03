/* globals uki, vega, vegaLite */

const { VegaView, VegaViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: uki.View,
  classDefFunc: SuperClass => {
    class VegaView extends SuperClass {
      constructor (options) {
        options.resources = options.resources || [];
        if (!globalThis.vega) {
          // Ensure that vega-core is loaded (d3 already should be)
          options.resources.push({
            type: 'js', url: 'https://cdn.jsdelivr.net/npm/vega@5/build/vega-core.min.js'
          });
        }
        if (options.liteSpec && !globalThis.vegaLite) {
          // Ensure that vega-lite is loaded if we know that we're going to need it
          options.resources.push({
            type: 'js', url: 'https://cdn.jsdelivr.net/npm/vega-lite@4'
          });
        }
        super(options);

        this.spec = options.spec;
        this.liteSpec = options.spec;
        this.renderer = options.renderer || 'svg';
        this.vegaView = null;
      }
      get isLoading () {
        return super.isLoading || this.vegaView === null;
      }
      getBounds () {
        // Temporarily set the rendered element's size to 0,0 so that it doesn't
        // influence the natural bounds calculation
        const renderedEl = this.d3el.select(this.renderer);
        const previousBounds = {
          width: renderedEl.attr('width'),
          height: renderedEl.attr('height')
        };
        renderedEl
          .attr('width', 0)
          .attr('height', 0);
        const bounds = this.d3el.node().getBoundingClientRect();
        // Restore the bounds
        renderedEl
          .attr('width', previousBounds.width)
          .attr('height', previousBounds.height);
        return bounds;
      }
      setup () {
        super.setup(...arguments);

        const parsedSpec = vega.parse(this.spec || vegaLite.compile(this.liteSpec));

        this.vegaView = new vega.View(parsedSpec, {
          renderer: this.renderer,
          container: this.d3el.node(),
          // tooltip: (...args) => this.showTooltip(...args),
          hover: true
        });
      }
      draw () {
        super.draw(...arguments);

        const bounds = this.getBounds();

        this.vegaView
          .width(bounds.width)
          .height(bounds.height)
          .runAsync();
      }
    }
    return VegaView;
  }
});
export { VegaView, VegaViewMixin };
