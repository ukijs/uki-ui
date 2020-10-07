/* globals uki */
import { ThemeableMixin } from '../ThemeableMixin/ThemeableMixin.js';
import { ButtonView } from '../ButtonView/ButtonView.js';
import defaultStyle from './style.less';
import template from './template.html';
import spinnerImg from '../InformativeView/spinner.png';

const { ModalView, ModalViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: uki.View,
  classDefFunc: SuperClass => {
    class ModalView extends ThemeableMixin({
      SuperClass, defaultStyle, className: 'ModalView'
    }) {
      constructor (options = {}) {
        super(options);

        this._content = options.content;
        this._visible = options.visible || false;
        this._shadow = options.shadow || true;
        this._confirmAction = options.confirmAction || (async () => {});
        this._cancelAction = options.cancelAction || (async () => {});
        this._validateForm = options.validateForm || (async () => null);
        this.drawValidationErrors = false;
        this.drawWaitingState = false;
        this._usesDefaultSpecs = options._buttonSpecs === undefined;
        this._buttonSpecs = options.buttonSpecs || [
          {
            label: 'Cancel',
            onclick: async () => {
              this.drawWaitingState = true;
              await this.render();
              await this.cancelAction();
              this.hide();
            }
          },
          {
            label: 'OK',
            primary: true,
            onclick: async () => {
              this.drawWaitingState = true;
              await this.render();
              await this.confirmAction();
              this.hide();
            },
            onDisabledClick: () => {
              this.drawValidationErrors = true;
              this.render();
            }
          }
        ];
      }

      get content () {
        return this._content;
      }

      set content (value) {
        this._content = value;
        this.render();
      }

      get visible () {
        return this._visible;
      }

      set visible (value) {
        this._visible = value;
        this.render();
      }

      get shadow () {
        return this._shadow;
      }

      set shadow (value) {
        this._shadow = value;
        this.render();
      }

      get buttonSpecs () {
        return this._buttonSpecs;
      }

      set buttonSpecs (specs) {
        this._buttonSpecs = specs;
        this._usesDefaultSpecs = false;
        this.render();
      }

      setButtonViewSpec (index, spec) {
        this._buttonSpecs[index] = spec;
        this.render();
      }

      get buttonViews () {
        return this.modalButtonEl?.selectAll('.ButtonView').nodes().map(el => {
          return el.__modalButtonView;
        });
      }

      get confirmAction () {
        return this._confirmAction;
      }

      set confirmAction (value) {
        this._confirmAction = value;
      }

      get cancelAction () {
        return this._cancelAction;
      }

      set cancelAction (value) {
        this._cancelAction = value;
      }

      get validateForm () {
        return this._validateForm;
      }

      set validateForm (value) {
        this._validateForm = value;
      }

      async show ({
        content,
        hide,
        shadow,
        buttonSpecs
      } = {}) {
        this.visible = !hide;
        if (content !== undefined) {
          this._content = content;
        }
        if (buttonSpecs !== undefined) {
          this._buttonSpecs = buttonSpecs;
        }
        if (shadow !== undefined) {
          this._shadow = shadow;
        }
        await this.render();
      }

      async hide () {
        await this.show({ hide: true });
      }

      async setup () {
        // As ModalView might be reusing a d3el from a different ModalView,
        // reset its class first (its contents will be reset by the html() call
        // below)
        this.d3el.attr('class', null);
        await super.setup(...arguments);
        this.d3el.style('display', 'none')
          .html(template);

        this.modalShadowEl = this.d3el.select('.modalShadowEl');
        this.modalContentEl = this.d3el.select('.modalContentEl');
        this.modalButtonEl = this.d3el.select('.modalButtonEl');

        await this.applyContent();
        await this.updateButtons();
      }

      async applyContent (skipString = false) {
        if (typeof this.content === 'string' && !skipString) {
          this.modalContentEl.html(this.content);
        } else if (this.content instanceof uki.View) {
          await this.content.render(this.modalContentEl);
        } else if (typeof this.content === 'function') {
          await this.content(this.modalContentEl);
        }
      }

      async updateButtons () {
        let buttons = this.modalButtonEl.selectAll('.ButtonView')
          .data(this.buttonSpecs, (d, i) => i);
        buttons.exit().remove();
        const buttonsEnter = buttons.enter().append('div');
        buttons = buttons.merge(buttonsEnter);

        await ButtonView.initForD3Selection(buttonsEnter, d => Object.assign({}, d));
        await ButtonView.iterD3Selection(buttons, async (buttonView, d) => {
          Object.assign(buttonView, d);
          if (this._usesDefaultSpecs && buttonView.label === 'OK') {
            buttonView.disabled = !!this.validationErrors;
          }
        });
      }

      async draw () {
        await super.draw(...arguments);

        if (this.visible) {
          this.modalShadowEl.style('display', this.shadow ? null : 'none');

          const priorErrors = this.validationErrors;
          this.validationErrors = await this.validateForm();
          await this.applyContent();
          await this.updateButtons();

          if (this.drawValidationErrors && this.validationErrors) {
            for (const selection of this.validationErrors) {
              this.d3el.select(selection).classed('error', true);
            }
          } else if (priorErrors) {
            for (const selection of priorErrors) {
              this.d3el.select(selection).classed('error', false);
            }
          }

          if (this.drawWaitingState) {
            this.modalButtonEl.insert('img', ':first-child')
              .attr('src', spinnerImg)
              .classed('waitingSpinner', true);
            ButtonView.iterD3Selection(this.modalButtonEl.selectAll('.ButtonView'), buttonView => {
              buttonView.disabled = true;
            });
          }
        }

        this.d3el.style('display', this.visible ? null : 'none');
      }
    }
    return ModalView;
  }
});
export { ModalView, ModalViewMixin };
