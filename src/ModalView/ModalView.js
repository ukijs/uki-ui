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
        this._validateForm = options.validateForm || (async () => []);
        this._drawValidationErrors = false;
        this._drawWaitingState = false;
        this._buttonSpecSetterHelper(options.buttonSpecs || 'default');
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

      get buttonSpecs () {
        return this._buttonSpecs;
      }

      _buttonSpecSetterHelper (specs) {
        this._nukePriorButtons = true;
        this._usesDefaultSpecs = specs === 'default';
        if (this._usesDefaultSpecs) {
          this._buttonSpecs = this.defaultButtonSpecs;
        } else {
          this._buttonSpecs = specs;
        }
        this._buttonSpecs = this._buttonSpecs.map(spec => {
          if (spec === 'defaultCancel') {
            return this._defaultCancelButtonSpec;
          } else if (spec === 'defaultOK') {
            return this._defaultOkButtonSpec;
          } else {
            return spec;
          }
        });
      }

      set buttonSpecs (specs) {
        this._buttonSpecSetterHelper(specs);
        this.render();
      }

      get defaultButtonSpecs () {
        return ['defaultCancel', 'defaultOK'];
      }

      get _defaultCancelButtonSpec () {
        return {
          label: 'Cancel',
          onclick: async () => {
            this._drawWaitingState = true;
            await this.render();
            await this.cancelAction();
            this.hide();
          }
        };
      }

      get _defaultOkButtonSpec () {
        return {
          label: 'OK',
          primary: true,
          onclick: async () => {
            this._drawWaitingState = true;
            await this.render();
            await this.confirmAction();
            this.hide();
          },
          onDisabledClick: () => {
            this._drawValidationErrors = true;
            this.render();
          }
        };
      }

      async show ({
        content,
        hide,
        shadow,
        buttonSpecs,
        confirmAction,
        cancelAction,
        validateForm
      } = {}) {
        this.visible = !hide;
        if (!this.visible) {
          this._drawValidationErrors = false;
          this._drawWaitingState = false;
        }
        if (content !== undefined) {
          this._content = content;
        }
        if (buttonSpecs !== undefined) {
          this._buttonSpecSetterHelper(buttonSpecs);
        }
        if (shadow !== undefined) {
          this._shadow = shadow;
        }
        if (confirmAction !== undefined) {
          this._confirmAction = confirmAction;
        }
        if (cancelAction !== undefined) {
          this._cancelAction = cancelAction;
        }
        if (validateForm !== undefined) {
          this._validateForm = validateForm;
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
        if (this._nukePriorButtons) {
          this.modalButtonEl.selectAll('.ButtonView').data([])
            .exit().remove();
          this._nukePriorButtons = false;
        }
        let buttons = this.modalButtonEl.selectAll('.ButtonView')
          .data(this.buttonSpecs, (d, i) => i);
        buttons.exit().remove();
        const buttonsEnter = buttons.enter().append('div');
        buttons = buttons.merge(buttonsEnter);

        await ButtonView.initForD3Selection(buttonsEnter, d => Object.assign({}, d));
        await ButtonView.iterD3Selection(buttons, async (buttonView, d) => {
          Object.assign(buttonView, d);
          if (this._usesDefaultSpecs && buttonView.label === 'OK') {
            buttonView.disabled = this.validationErrors?.length > 0;
          }
        });
      }

      async draw () {
        await super.draw(...arguments);

        if (this.visible) {
          this.modalShadowEl.style('display', this.shadow ? null : 'none');

          const priorErrors = this.validationErrors || [];
          this.validationErrors = await this.validateForm();
          await this.applyContent();
          await this.updateButtons();

          if (this._drawValidationErrors && this.validationErrors.length > 0) {
            for (const selection of this.validationErrors) {
              this.d3el.select(selection).classed('error', true);
            }
          } else if (priorErrors.length > 0) {
            for (const selection of priorErrors) {
              this.d3el.select(selection).classed('error', false);
            }
          }

          if (this._drawWaitingState) {
            const spinner = this.modalButtonEl.select('.waitingSpinner');
            if (!spinner.node()) {
              this.modalButtonEl.insert('img', ':first-child')
                .attr('src', spinnerImg)
                .classed('waitingSpinner', true);
            }
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
