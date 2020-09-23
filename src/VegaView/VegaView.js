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
            type: 'js', url: uki.ui.dynamicDependencies.vega
          });
        }
        if (options.liteSpec && !globalThis.vegaLite) {
          // Ensure that vega-lite is loaded if we know that we're going to need it
          options.resources.push({
            type: 'js', url: uki.ui.dynamicDependencies['vega-lite']
          });
        }
        super(options);

        this.spec = options.spec;
        this.liteSpec = options.liteSpec;
        this.renderer = options.renderer || 'canvas';
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
        const bounds = super.getBounds();
        // Restore the bounds
        renderedEl
          .attr('width', previousBounds.width)
          .attr('height', previousBounds.height);
        return bounds;
      }

      async setup () {
        await super.setup(...arguments);

        let vegaSpec;
        if (typeof this.spec === 'string') {
          vegaSpec = this.getNamedResource(this.spec);
        } else if (typeof this.spec === 'object') {
          vegaSpec = this.spec;
        } else if (typeof this.liteSpec === 'string') {
          vegaSpec = vegaLite.compile(this.getNamedResource(this.liteSpec)).spec;
        } else if (typeof this.liteSpec === 'object') {
          vegaSpec = vegaLite.compile(this.liteSpec).spec;
        } else {
          throw new Error("Can't parse vega spec; either spec or liteSpec should be a string or object");
        }

        this.vegaView = new vega.View(vega.parse(vegaSpec), {
          renderer: this.renderer,
          container: this.d3el.node(),
          // tooltip: (...args) => this.showTooltip(...args),
          hover: true
        });
      }

      async draw () {
        await super.draw(...arguments);

        const bounds = this.getBounds();

        this.vegaView
          .height(bounds.height)
          .width(bounds.width)
          .runAsync();
      }
    }
    return VegaView;
  }
});
export { VegaView, VegaViewMixin };
