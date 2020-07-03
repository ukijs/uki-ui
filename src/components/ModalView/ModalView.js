/* globals uki */
import { ThemeableMixin } from '../../utils/utils.js';
import { Button } from '../Button/Button.js';
import defaultStyle from './style.less';
import template from './template.html';

const { ModalView, ModalViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: uki.View,
  classDefFunc: SuperClass => {
    class ModalView extends ThemeableMixin({
      SuperClass, defaultStyle, className: 'ModalView'
    }) {
      get defaultButtons () {
        return [
          {
            label: 'Cancel',
            className: 'cancel',
            onclick: () => { this.hide(); }
          },
          {
            label: 'OK',
            className: 'ok',
            primary: true,
            onclick: () => { this.hide(); }
          }
        ];
      }
      get defaultContent () {
        return '';
      }
      async show (options = {}) {
        const content = options.content || this.defaultContent;
        if (content instanceof ModalView) {
          await content.render(this.d3el);
          this.d3el.style('display', null);
        } else if (typeof content === 'function') {
          await content(this.contents);
        } else {
          this.contents.html(content);
        }
        if (options.buttons !== null) {
          this.setupButtons(options.buttons || this.defaultButtons);
        }
        this.d3el.style('display', options.hide ? 'none' : null);
      }
      async hide () {
        await this.show({ hide: true });
      }
      setup () {
        super.setup(...arguments);
        this.d3el
          .style('display', 'none')
          .html(template);

        this.contents = this.d3el.select('.contents')
          .classed(this.type, true);
        this.buttonWrapper = this.d3el.select('.buttonWrapper');

        this.setupButtons();
      }
      setupButtons (buttonSpecs = this.defaultButtons) {
        this.buttonWrapper.html('');
        for (const spec of buttonSpecs) {
          spec.d3el = this.buttonWrapper.append('div');
          new Button(spec); // eslint-disable-line no-new
        }
      }
    }
    return ModalView;
  }
});
export { ModalView, ModalViewMixin };
