/* globals d3, uki */
import { ThemeableMixin } from '../../utils/utils.js';
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
        this._buttonSpecs = options.buttons || [
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
        this.parseButtonViewSpecs();
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
        this.parseButtonViewSpecs();
        this.render();
      }

      setButtonViewSpec (index, spec) {
        this._buttonSpecs[index] = spec;
        this._buttons[index] = new ButtonView(spec);
        this.render();
      }

      get buttons () {
        return this._buttons;
      }

      set buttons (buttons) {
        this._buttons = buttons;
        this.render();
      }

      parseButtonViewSpecs () {
        this._buttons = this._buttonSpecs.map(spec => new ButtonView(spec));
      }

      async show ({
        content,
        hide,
        shadow,
        buttonSpecs,
        buttons
      } = {}) {
        this.visible = !hide;
        if (content !== undefined) {
          this._content = content;
        }
        if (buttons !== undefined) {
          this._buttons = buttons;
        } else if (buttonSpecs !== undefined) {
          this._buttonSpecs = buttonSpecs;
          this.parseButtonViewSpecs();
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

          if (this.content === null || typeof this.content === 'string') {
            this.modalContentEl.html(this.content);
          } else if (this.content instanceof uki.View) {
            await this.content.render(this.modalContentEl);
          } else if (typeof content === 'function') {
            await this.content(this.modalContentEl);
          }

          this.modalButtonEl.selectAll('.ButtonView')
            .data(this.buttons).join('div')
            .each(function (d) { d.render(d3.select(this)); });
        }

        this.d3el.style('display', this.visible ? null : 'none');
      }
    }
    return ModalView;
  }
});
export { ModalView, ModalViewMixin };
