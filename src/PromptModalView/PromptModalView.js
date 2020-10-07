/* globals uki */
import { ModalView } from '../ModalView/ModalView.js';

const { PromptModalView, PromptModalViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: ModalView,
  classDefFunc: SuperClass => {
    class PromptModalView extends SuperClass {
      constructor (options = {}) {
        super(options);

        this._message = options.message;
        this._defaultValue = options.defaultValue;
        this._validate = options.validate || (() => true);
      }

      async setup () {
        await super.setup(...arguments);

        let content = this._message;
        if (content) {
          content += '<br/>';
        }
        this.modalContentEl.html(content);

        this.promptInputEl = this.modalContentEl.append('input')
          .classed('promptInputEl', true)
          .on('keyup.PromptModalView change.PromptModalView', () => {
            this.render();
          });

        if (this._defaultValue !== undefined) {
          this.promptInputEl.node().value = this._defaultValue;
        }
      }

      validateForm () {
        const currentValue = this.promptInputEl.node().value;
        if (!this._validate(currentValue)) {
          return ['.promptInputEl'];
        } else {
          return [];
        }
      }
    }
    return PromptModalView;
  }
});
export { PromptModalView, PromptModalViewMixin };
