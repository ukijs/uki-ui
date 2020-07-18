/* globals d3, uki */
import { ThemeableMixin } from '../../utils/utils.js';
import { SvgView, SvgViewMixin } from '../../components/SvgView/SvgView.js';
import defaultStyle from './style.less';
import template from './template.html';

const { LineChartView, LineChartViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: SvgView,
  classDefFunc: SuperClass => {
    class LineChartView extends SvgViewMixin(ThemeableMixin({
      SuperClass, defaultStyle, className: 'LineChartView'
    })) {
      constructor (options) {
        super(options);

        this._margins = options.margins || { bottom: 30, top: 20, left: 40, right: 20 };
        this._timeSeries = options.timeSeries || [];
      }

      get margins () {
        return this._margins;
      }

      set margins (value) {
        this._margins = value;
        this.render();
      }

      get timeSeries () {
        return this._timeSeries;
      }

      set timeSeries (value) {
        this._timeSeries = value;
        this.render();
      }

      async setup () {
        await super.setup(...arguments);

        // Ensure clipPath has a unique ID across the page
        this.clipPathId = 'lineChartView' + LineChartView.CLIP_PATH_NEXT_ID;
        LineChartView.CLIP_PATH_NEXT_ID += 1;

        this.d3el.html(template);
        this.d3el.select('clipPath')
          .attr('id', this.clipPathId);
      }

      async draw () {
        await super.draw(...arguments);
        if (this.isHidden) {
          return;
        }

        const bounds = this.getBounds();

        // Position chart and axes, and adjust clipPath accordingly
        this.d3el.selectAll('.chart, .y.axis')
          .attr('transform', `translate(${this.margins.left},${this.margins.top})`);
        this.d3el.select('.x.axis')
          .attr('transform', `translate(${this.margins.left},${bounds.height - this.margins.bottom})`);

        const width = bounds.width - this.margins.left - this.margins.right;
        const height = bounds.height - this.margins.top - this.margins.bottom;

        this.d3el.select(`#${this.clipPathId} rect`)
          .attr('width', width)
          .attr('height', height);

        // Update the scales
        this.xScale = this.getXScale(width);
        this.yScale = this.getYScale(height);

        // Update the axes
        this.d3el.select('.x.axis')
          .call(d3.axisBottom(this.xScale));
        this.d3el.select('.y.axis')
          .call(d3.axisLeft(this.yScale));

        // Update the lines
        const lineGenerator = this.getLineGenerator();
        this.d3el.select('.chart path')
          .datum(this.timeSeries)
          .attr('d', lineGenerator);
      }

      getXScale (width) {
        return d3.scaleLinear()
          .domain(d3.extent(this.timeSeries, d => d.x))
          .range([0, width]);
      }

      getYScale (height) {
        return d3.scaleLinear()
          .domain(d3.extent(this.timeSeries, d => d.y))
          .range([height, 0]);
      }

      getLineGenerator () {
        return d3.line()
          .x(d => this.xScale(d.x))
          .y(d => this.yScale(d.y));
      }
    }
    LineChartView.CLIP_PATH_NEXT_ID = 0;
    return LineChartView;
  }
});
export { LineChartView, LineChartViewMixin };
