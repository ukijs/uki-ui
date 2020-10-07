/* globals d3, uki */
import { ThemeableMixin } from './ThemeableMixin/ThemeableMixin.js';
import { TooltipView } from './TooltipView/TooltipView.js';
import { ModalView } from './ModalView/ModalView.js';
import { PromptModalView } from './PromptModalView/PromptModalView.js';
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
      type: 'css', raw: defaultVars, name: 'defaultVars', unshift: true
    });
    // Users can manipulate the global theme via globalThis.uki
    if (uki.theme !== undefined) {
      options.theme = uki.theme;
    }
    super(options);
    this.tooltip = options.tooltip || null;
    uki.showTooltip = async tooltipArgs => { return await this.showTooltip(tooltipArgs); };
    uki.hideTooltip = async () => { return await this.hideTooltip(); };
    uki.showContextMenu = async menuArgs => { return await this.showContextMenu(menuArgs); };
    this.modal = options.modal || null;
    uki.showModal = async modalArgs => { return await this.showModal(modalArgs); };
    uki.hideModal = async () => { return await this.hideModal(); };
    uki.alert = async () => { return await this.alert(...arguments); };
    uki.prompt = async () => { return await this.prompt(...arguments); };
    uki.confirm = async () => { return await this.confirm(...arguments); };
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
    await this.tooltip.showContextMenu(menuArgs);
    return this.tooltip;
  }

  async showTooltip (tooltipArgs) {
    await this.initTooltip();
    await this.tooltip.show(tooltipArgs);
    return this.tooltip;
  }

  async hideTooltip () {
    if (this.tooltip) {
      await this.tooltip.hide();
    }
    return this.tooltip;
  }

  async showModal (modalArgs) {
    if (!this._modalEl) {
      this._modalEl = (this.modal && this.modal.d3el) || d3.select('body').insert('div', '.TooltipView');
    }
    if (modalArgs instanceof ModalView) {
      this.modal = modalArgs;
    } else if (!this.modal || this.modal.constructor.name !== 'ModalView') {
      this.modal = new ModalView();
    } else {
      this.modal.dirty = true;
    }
    await this.modal.render(this._modalEl);
    await this.modal.show(modalArgs instanceof ModalView ? {} : modalArgs);
    return this.modal;
  }

  async hideModal () {
    if (this.modal) {
      await this.modal.hide();
    }
    return this.modal;
  }

  async alert (message) {
    return new Promise((resolve, reject) => {
      this.showModal({
        content: message,
        buttonSpecs: ['defaultOK'],
        confirmAction: resolve
      });
    });
  }

  async confirm (message) {
    return new Promise((resolve, reject) => {
      this.showModal({
        content: message,
        buttonSpecs: 'default',
        cancelAction: () => { resolve(false); },
        confirmAction: () => { resolve(true); }
      });
    });
  }

  async prompt (message, defaultValue, validate) {
    validate = validate || (() => true);
    return new Promise((resolve, reject) => {
      this.showModal(new PromptModalView({
        message,
        defaultValue,
        validate,
        confirmAction: () => {
          const currentValue = this.modal.modalContentEl
            .select('.promptInputEl').node().value;
          resolve(currentValue);
        },
        cancelAction: () => { resolve(null); }
      }));
    });
  }
}
export default GlobalUI;
