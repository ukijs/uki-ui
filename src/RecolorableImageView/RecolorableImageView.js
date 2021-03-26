/* globals d3, uki */

const DEFAULT_EXTRA_RECOLORS = [
  '--text-color-richer',
  '--text-color',
  '--text-color-softer',
  '--error-color',
  '--accent-color',
  '--accent-color-hover',
  '--accent-color-disabled',
  '--disabled-color',
  '--border-color-richer',
  '--border-color',
  '--border-color-softer',
  '--background-color',
  '--background-color-softer',
  '--background-color-richer',
  '--shadow-color',
  '--shadow-color-rgb',
  '--inverted-shadow-color'
];

const { RecolorableImageView, RecolorableImageViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: uki.View,
  classDefFunc: SuperClass => {
    class RecolorableImageView extends SuperClass {
      constructor (options) {
        super(options);
        this._recolorFilters = {};
        this._extraRecolorFilters = options.extraRecolorFilters || DEFAULT_EXTRA_RECOLORS;
        window.matchMedia('(prefers-color-scheme: dark)').addListener(() => {
          this.updateRecolorFilters();
        });
      }

      async setup () {
        await super.setup(...arguments);
        this.updateRecolorFilters();
      }

      parseColor (string, tempElement) {
        // First check for CSS variables
        const cssVar = /#recolorImageTo(--[^)"]*)/.exec(string);
        if (cssVar && cssVar[1]) {
          tempElement.setAttribute('style', `color: var(${cssVar[1]})`);
          const styles = window.getComputedStyle(tempElement);
          // Check that the variable exists
          if (styles.getPropertyValue(cssVar[1])) {
            // Convert the computed 0-255 rgb color to 0-1
            const rgbChunks = /rgba?\((\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(styles.color);
            if (rgbChunks[1] && rgbChunks[2] && rgbChunks[3]) {
              this._recolorFilters[cssVar[1]] = {
                r: parseInt(rgbChunks[1]) / 255,
                g: parseInt(rgbChunks[2]) / 255,
                b: parseInt(rgbChunks[3]) / 255
              };
            }
          }
        } else {
          // Try for raw hex codes
          const hexCode = cssVar || /#recolorImageTo(......)/.exec(string);
          if (hexCode && hexCode[1]) {
            // Convert the hex code to 0-1 rgb
            this._recolorFilters[hexCode[1]] = {
              r: parseInt(hexCode[1].slice(0, 2), 16) / 255,
              g: parseInt(hexCode[1].slice(2, 4), 16) / 255,
              b: parseInt(hexCode[1].slice(4, 6), 16) / 255
            };
          }
        }
      }

      updateRecolorFilters () {
        if (!this.d3el) {
          return;
        }
        const temp = this.d3el.append('p');

        // Parse any styles that were in extraRecolorFilters
        for (const extraFilter of this._extraRecolorFilters) {
          this.parseColor('#recolorImageTo' + extraFilter, temp.node());
        }

        // Extract all CSS rules that look like
        // filter: url(#recolorImageToFFFFFF)
        // or
        // filter: url(#recolorImageTo--some-css-variable)
        // from this view's style resources
        for (const resource of this.resources) {
          const sheet = resource?.styleTag?.sheet || resource?.linkTag?.sheet || null;
          if (!sheet) {
            continue;
          }
          let rules;
          try {
            rules = sheet?.cssRules || sheet?.rules || [];
          } catch (e) {
            // If loading a stylesheet from a different domain (e.g. we hit
            // this with goldenlayout stylesheets), CORS will throw an error if
            // we attempt to access sheet.cssRules directly
            continue;
          }

          for (const rule of rules) {
            if (rule.style && rule.style.filter) {
              this.parseColor(rule.style.filter, temp.node());
            }
          }
        }

        temp.remove();

        // Create a special hidden SVG element if it doesn't already exist
        if (d3.select('#recolorImageFilters').size() === 0) {
          const svg = d3.select('body').append('svg')
            .attr('id', 'recolorImageFilters')
            .attr('width', 0)
            .attr('height', 0);
          svg.append('defs');
        }

        // Generate / update SVG filters for any colors that haven't already
        // been created
        let recolorFilters = d3.select('#recolorImageFilters')
          .selectAll('filter.recolor')
          .data(Object.entries(this._recolorFilters), d => d[0]);
        // Note that we do NOT mess with / remove exit() filters; these things
        // might be added from many sources, and we want to leave stuff that's
        // already there
        const recolorFiltersEnter = recolorFilters.enter().append('filter')
          .attr('class', 'recolor')
          .attr('id', d => 'recolorImageTo' + d[0]);
        recolorFilters = recolorFilters.merge(recolorFiltersEnter);
        const cmpTransferEnter = recolorFiltersEnter.append('feComponentTransfer')
          .attr('in', 'SourceAlpha')
          .attr('result', 'color');
        cmpTransferEnter.append('feFuncR')
          .attr('type', 'linear')
          .attr('slope', 0);
        recolorFilters.select('feFuncR')
          .attr('intercept', d => Math.pow(d[1].r, 2));
        cmpTransferEnter.append('feFuncG')
          .attr('type', 'linear')
          .attr('slope', 0);
        recolorFilters.select('feFuncG')
          .attr('intercept', d => Math.pow(d[1].g, 2));
        cmpTransferEnter.append('feFuncB')
          .attr('type', 'linear')
          .attr('slope', 0);
        recolorFilters.select('feFuncB')
          .attr('intercept', d => Math.pow(d[1].b, 2));
        cmpTransferEnter.append('feFuncA')
          .attr('type', 'identity');
      }
    }
    return RecolorableImageView;
  }
});
export { RecolorableImageView, RecolorableImageViewMixin };
