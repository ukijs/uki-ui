/* globals d3, uki */
import { ThemeableMixin } from '../ThemeableMixin/ThemeableMixin.js';
import { ButtonView } from '../ButtonView/ButtonView.js';
import defaultStyle from './style.less';
import template from './template.html';

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
        this._buttonSpecs = options.buttonSpecs || [
          {
            label: 'Cancel',
            onclick: () => { this.hide(); }
          },
          {
            label: 'OK',
            primary: true,
            onclick: () => { this.hide(); }
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
      }

      async draw () {
        await super.draw(...arguments);

        if (this.visible) {
          this.modalShadowEl.style('display', this.shadow ? null : 'none');

          if (typeof this.content === 'string') {
            this.modalContentEl.html(this.content);
          } else if (this.content instanceof uki.View) {
            await this.content.render(this.modalContentEl);
          } else if (typeof content === 'function') {
            await this.content(this.modalContentEl);
          }

          let buttons = this.modalButtonEl.selectAll('.ButtonView')
            .data(this.buttonSpecs, (d, i) => i);
          buttons.exit().remove();
          const buttonsEnter = buttons.enter().append('div');
          buttons = buttons.merge(buttonsEnter);

          const buttonPromises = [];
          buttons.each(function (d) {
            const buttonOptions = Object.assign({}, d);
            buttonOptions.d3el = d3.select(this);
            if (this.__modalButtonView) {
              Object.assign(this.__modalButtonView, buttonOptions);
            } else {
              this.__modalButtonView = new ButtonView(buttonOptions);
            }
            buttonPromises.push(this.__modalButtonView.render());
          });

          await Promise.all(buttonPromises);
        }

        this.d3el.style('display', this.visible ? null : 'none');
      }
    }
    return ModalView;
  }
});
export { ModalView, ModalViewMixin };
