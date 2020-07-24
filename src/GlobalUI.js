/* globals d3, uki */
import { ThemeableMixin } from './ThemeableMixin/ThemeableMixin.js';
import { TooltipView } from './TooltipView/TooltipView.js';
import { ModalView } from './ModalView/ModalView.js';
import defaultVars from './style/defaultVars.css';
import normalize from '../node_modules/normalize.css/normalize.css';
import honegumi from './style/honegumi.css'; // TODO: npm install this one too

const defaultStyle = normalize + honegumi;

class GlobalUI extends ThemeableMixin({
  SuperClass: uki.Model,
  defaultStyle,
  className: 'GlobalUI',
  cnNotOnD3el: true // not actually used, because there's no d3el anyway
}) {
  constructor (options) {
    options.resources = options.resources || [];
    // defaultVars is required, but only contains variables that can be ignored
    // / overridden
    options.resources.unshift({
      type: 'css', raw: defaultVars, name: 'defaultVars'
    });
    // Users can manipulate the global theme via globalThis.uki
    if (uki.theme !== undefined) {
      options.theme = uki.theme;
    }
    super(options);
    this.tooltip = options.tooltip || null;
    uki.showTooltip = tooltipArgs => { this.showTooltip(tooltipArgs); };
    uki.hideTooltip = () => { this.hideTooltip(); };
    uki.showContextMenu = menuArgs => { this.showContextMenu(menuArgs); };
    this.modal = options.modal || null;
    uki.showModal = modalArgs => { this.showModal(modalArgs); };
    uki.hideModal = () => { this.hideModal(); };
  }

  async setTheme (value) {
    await this.ready;
    const oldGlobalTheme = this.getNamedResource('GlobalUIDefaultTheme');
    if (oldGlobalTheme) {
      // Remove the stylesheet if it has already been added to the head element
      oldGlobalTheme.remove();
    }
    if (value) {
      value.name = 'GlobalUIDefaultTheme';
      await this.loadLateResource(value);
    }
  }

  async initTooltip () {
    if (!this.tooltip) {
      // Create the tooltip layer, and make sure it's on top of the ModalView if it exists
      this.tooltip = new TooltipView({
        d3el: d3.select('body').insert('div', '.ModalView + *')
      });
      await this.tooltip.render();
    }
  }

  async showContextMenu (menuArgs) {
    await this.initTooltip();
    this.tooltip.showContextMenu(menuArgs);
  }

  async showTooltip (tooltipArgs) {
    await this.initTooltip();
    this.tooltip.show(tooltipArgs);
  }

  hideTooltip () {
    if (this.tooltip) {
      this.tooltip.hide();
    }
  }

  async showModal (modalArgs) {
    if (!this.modal) {
      // Create the modal layer, and make sure it's under the TooltipView if it exists
      this.modal = new ModalView({
        d3el: d3.select('body').insert('div', '.TooltipView')
      });
      await this.modal.render();
    }
    this.modal.show(modalArgs);
  }

  hideModal () {
    if (this.modal) {
      this.modal.hide();
    }
  }
}
export default GlobalUI;
