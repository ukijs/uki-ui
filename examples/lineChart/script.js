/* globals d3, uki */
class LineView extends uki.ui.utils.LoadingViewMixin(uki.ui.vis.LineChartView) {
  constructor (options) {
    options.resources = options.resources || [];
    options.resources.push({
      type: 'json',
      url: 'lineData.json',
      name: 'lineData',
      then: rawData => {
        return rawData.map(point => {
          point.timestamp = new Date(point.timestamp);
          return point;
        });
      }
    });
    super(options);
    this.ready.then(() => {
      this.timeSeries = this.getNamedResource('lineData');
    });
  }

  getXScale (width) {
    return d3.scaleTime()
      .domain(d3.extent(this.timeSeries, d => d.timestamp))
      .range([0, width]);
  }

  getYScale (height) {
    return d3.scaleLinear()
      .domain(d3.extent(this.timeSeries, d => d.count))
      .range([height, 0]);
  }

  getLineGenerator () {
    return d3.line()
      .x(d => this.xScale(d.timestamp))
      .y(d => this.yScale(d.count));
  }
}
const lineView = new LineView({
  d3el: d3.select('#histogram')
});

const button = new uki.ui.components.Button({ // eslint-disable-line no-unused-vars
  d3el: d3.select('#updateButton'),
  label: 'Update w/Random Data',
  onclick: () => {
    // Generate random data to replace the contents of the line chart
    const now = +(new Date());
    lineView.timeSeries = Array.from({ length: Math.floor(Math.random() * 300) }, (d, i) => {
      return { timestamp: new Date(now + i * 60 * 1000), count: Math.random() * 300 };
    });
  }
});
