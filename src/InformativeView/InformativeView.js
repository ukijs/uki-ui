/* globals uki */

import { OverlaidView, OverlaidViewMixin } from '../OverlaidView/OverlaidView.js';
import { RecolorableImageViewMixin } from '../RecolorableImageView/RecolorableImageView.js';
import { ThemeableMixin } from '../ThemeableMixin/ThemeableMixin.js';
import { ButtonView } from '../ButtonView/ButtonView.js';
import spinnerImg from './spinner.png';
import warningImg from './warning.img.svg';
import defaultStyle from './style.less';

const { InformativeView, InformativeViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: OverlaidView,
  classDefFunc: SuperClass => {
    class InformativeView extends RecolorableImageViewMixin(OverlaidViewMixin(ThemeableMixin({
      SuperClass, defaultStyle, className: 'InformativeView', cnNotOnD3el: true
    }))) {
      constructor (options) {
        super(options);
        this._error = options.error || null;
        this._loadingMessage = options.loadingMessage || 'Loading...';
        this._informativeMessage = options.informativeMessage || null;
        this._informativeImg = options.informativeImg || null;
        this._loading = options.loading || false;
        this._firstRenderCompleted = false;
        this.on('resourcesLoaded', () => { this.render(); });
        this.on('resourceLoaded', () => { this.render(); });
        this.on('resourceUnloaded', () => { this.render(); });
      }

      get informativeMessage () {
        return this._informativeMessage;
      }

      set informativeMessage (value) {
        this._informativeMessage = value;
        this.render();
      }

      get informativeImg () {
        return this._informativeImg;
      }

      set informativeImg (value) {
        this._informativeImg = value;
      }

      get error () {
        return this._error || this.resources.find(r => r instanceof Error) || null;
      }

      set error (value) {
        this._error = value;
        this.render();
      }

      get isLoading () {
        return super.isLoading || this._loading || !this._firstRenderCompleted;
      }

      set isLoading (value) {
        this._loading = value;
        this.render();
      }

      get loadingMessage () {
        return this._loadingMessage;
      }

      set loadingMessage (value) {
        this._loadingMessage = value;
        this.render();
      }

      get overlayVisible () {
        return this.isLoading || this.informativeMessage || this.informativeImg || super.overlayVisible;
      }

      async loadLateResource () {
        this.render();
        await super.loadLateResource(...arguments);
        this.render();
      }

      async updateResource () {
        this.render();
        await super.updateResource(...arguments);
        this.render();
      }

      async setup () {
        await super.setup(...arguments);

        this.overlayContentEl.classed('InformativeView', true);

        this.setupInformativeElements();
      }

      async setupError (d3el, error) {
        this._error = error;
        this.setupInformativeElements();
      }

      setupInformativeElements () {
        // Only add these if they haven't been created yet (possible for
        // duplication if there's a setup error)
        if (!this.informativeIconEl) {
          this.informativeIconEl = this.overlayContentEl.append('img')
            .classed('informativeIconEl', true);
        }
        if (!this.informativeMessageEl) {
          this.informativeMessageEl = this.overlayContentEl.append('strong')
            .classed('informativeMessageEl', true);
        }
        if (!this.informativeErrorEl) {
          this.informativeErrorEl = this.overlayContentEl.append('details')
            .classed('informativeErrorEl', true)
            .style('display', 'none');
          this.informativeErrorEl.append('pre').classed('body', true);
          this.informativeErrorEl.append('pre').classed('stack', true);
          this.informativeErrorRethrowButton = new ButtonView({
            d3el: this.informativeErrorEl.append('div'),
            label: 'Rethrow in DevTools',
            primary: true
          });
        }
      }

      async draw () {
        this._firstRenderCompleted = true;

        await super.draw(...arguments);

        if (this.error) {
          await this.drawError(this.d3el, this.error);
        } else {
          this.overlayContentEl.classed('error', false);
          this.informativeIconEl.attr('src', this.isLoading ? spinnerImg : this.informativeImg)
            .style('display', this.isLoading || this.informativeImg ? null : 'none')
            .classed('spin', this.isLoading);
          this.informativeMessageEl.text(this.isLoading ? this.loadingMessage : this.informativeMessage)
            .style('display', this.isLoading || this.informativeMessage ? null : 'none');
          this.informativeErrorEl.style('display', 'none');
        }
      }

      async drawError (d3el, error) {
        // In the event that there are multiple errors (i.e. this._error could
        // be different than error), we want to show the earliest one (e.g. one
        // from setup() or one from a subclass overriding the this.error getter)
        // before showing an error from draw()
        error = this._error || error;

        // Force the overlay to display; it may not have displayed
        // properly if there was an error
        this.updateOverlaySize();
        this.overlayShadowEl.style('display', null);
        this.overlayContentEl.classed('error', true);

        this.informativeIconEl.attr('src', warningImg)
          .style('display', null)
          .classed('spin', false);
        this.informativeMessageEl.text('An error occurred while attempting to render this view')
          .style('display', null);
        this.informativeErrorEl.style('display', null);
        let errorBody = error.body || null;
        if (errorBody && errorBody instanceof Object) {
          // Display objects (usually details from a server error) as pretty JSON
          errorBody = JSON.stringify(errorBody, null, 2);
        }
        this.informativeErrorEl.select('.body')
          .text(errorBody);
        this.informativeErrorEl.select('.stack')
          .text(error.stack);
        this.informativeErrorRethrowButton.onclick = () => { throw error; };
      }
    }
    return InformativeView;
  }
});
export { InformativeView, InformativeViewMixin };
