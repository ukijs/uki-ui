/* globals d3, uki */
import { ThemeableMixin } from './utils/utils.js';
import { TooltipView } from './components/TooltipView/TooltipView.js';
import defaultVars from './style/defaultVars.css';
import normalize from '../node_modules/normalize.css/normalize.css';
import honegumi from './style/honegumi.css'; // TODO: npm install this one too

const defaultStyle = normalize + honegumi;

class GlobalUI extends ThemeableMixin({
  SuperClass: uki.Model,
  defaultStyle,
  className: 'root',
  cnNotOnD3el: true // not actually used, because there's no d3el anyway
}) {
  constructor (options) {
    options.resources = options.resources || [];
    // defaultVars is required, but only contains variables that can be ignored
    // / overridden
    options.resources.unshift({
      type: 'css', raw: defaultVars
    });
    // Users can manipulate the global theme via globalThis.uki
    if (uki.theme !== undefined) {
      options.theme = uki.theme;
    }
    super(options);
    this.tooltip = options.tooltip || null;
    uki.showTooltip = tooltipArgs => { this.showTooltip(tooltipArgs); };
  }
  async showTooltip (tooltipArgs) {
    if (!this.tooltip) {
      this.tooltip = new TooltipView({
        d3el: d3.select('body').append('div')
      });
      await this.tooltip.render();
    }
    this.tooltip.show(tooltipArgs);
  }
}
export default GlobalUI;
