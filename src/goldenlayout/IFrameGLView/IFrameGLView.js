/* globals uki */
import { IFrameViewMixin } from '../../components/IFrameView/IFrameView.js';
import { GLView } from '../GLView/GLView.js';
import linkIcon from './link.svg';

const { IFrameGLView, IFrameGLViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: GLView,
  classDefFunc: SuperClass => {
    class IFrameGLView extends IFrameViewMixin(SuperClass) {
      constructor (options) {
        options.icons = [{
          svg: linkIcon,
          onclick: () => {
            this.openAsTab();
          }
        }];
        super(options);
      }

      setupD3El () {
        return this.glEl.append('iframe')
          .style('border', 'none');
      }
    }
    return IFrameGLView;
  }
});
export { IFrameGLView, IFrameGLViewMixin };
