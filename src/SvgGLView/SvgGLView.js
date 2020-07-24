/* globals uki */
import { SvgViewMixin } from '../SvgView/SvgView.js';
import { GLView } from '../GLView/GLView.js';
import download from './download.text.svg';

const { SvgGLView, SvgGLViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: GLView,
  classDefFunc: SuperClass => {
    class SvgGLView extends SvgViewMixin(SuperClass) {
      constructor (options) {
        options.icons = [{
          svg: download,
          onclick: () => {
            this.download();
          }
        }];
        super(options);
      }

      setupD3El () {
        return this.glEl.append('svg')
          .attr('src', this.src)
          .on('load', () => { this.trigger('viewLoaded'); });
      }
    }
    return SvgGLView;
  }
});
export { SvgGLView, SvgGLViewMixin };
