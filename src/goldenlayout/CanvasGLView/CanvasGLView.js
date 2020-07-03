/* globals uki */
import { CanvasViewMixin } from '../../components/CanvasView/CanvasView.js';
import { GLView } from '../GLView/GLView.js';
import download from './download.svg';

const { CanvasGLView, CanvasGLViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: GLView,
  classDefFunc: SuperClass => {
    class CanvasGLView extends CanvasViewMixin(SuperClass) {
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
        return this.glEl.append('canvas')
          .attr('src', this.src)
          .on('load', () => { this.trigger('viewLoaded'); });
      }
    }
    return CanvasGLView;
  }
});
export { CanvasGLView, CanvasGLViewMixin };
