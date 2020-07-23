/* globals uki */

import { OverlaidView, OverlaidViewMixin } from '../OverlaidView/OverlaidView.js';
import spinnerImg from './spinner.gif';
import warningImg from './warning.img.svg';

const { InformativeView, InformativeViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: OverlaidView,
  classDefFunc: SuperClass => {
    class InformativeView extends OverlaidViewMixin(SuperClass) {
      constructor (options) {
        super(options);
        this._error = options.error || null;
        this._loadingMessage = options.loadingMessage || 'Loading...';
        this._loading = options.loading || false;
        this._firstRenderCompleted = false;
        this._resourcesLoaded = false;
        this.on('load', () => {
          this._resourcesLoaded = true;
          this.render();
        });
      }

      get error () {
        return this._error;
      }

      set error (value) {
        this._error = value;
        this.render();
      }

      get loading () {
        return this._loading || !this._resourcesLoaded || !this._firstRenderCompleted;
      }

      set loading (value) {
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
        return this.loading || super.overlayVisible;
      }

      async loadLateResource () {
        this._resourcesLoaded = false;
        this.render();
        await super.loadLateResource(...arguments);
      }

      async setup () {
        await super.setup(...arguments);

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
          this.informativeMessageEl = this.overlayContentEl.append('div')
            .classed('informativeMessageEl', true);
        }
        if (!this.informativeErrorEl) {
          this.informativeErrorEl = this.overlayContentEl.append('details')
            .style('display', 'none');
          this.informativeErrorEl.append('pre');
        }
      }

      async draw () {
        this._firstRenderCompleted = true;

        await super.draw(...arguments);

        if (this._error) {
          await this.drawError(this.d3el, this._error);
        } else {
          this.informativeIconEl.attr('src', this.loading ? spinnerImg : null)
            .style('display', this.loading ? null : 'none');
          this.informativeMessageEl.text(this.loading ? this.loadingMessage : '')
            .style('display', this.loading ? null : 'none');
          this.informativeErrorEl.style('display', 'none');
        }
      }

      async drawError (d3el, error) {
        // In the event that there are multiple errors (i.e. this._error could
        // be different than error), we want to show the earliest one (e.g. one
        // from setup() or from some custom source) before showing an error from
        // draw()
        error = this._error || error;

        // Force the overlay to display; it may not have displayed
        // properly if there was an error
        this.overlayShadowEl.style('display', null);

        this.informativeIconEl.attr('src', warningImg);
        this.informativeMessageEl.text(error.toString());
        this.informativeErrorEl.style('display', null)
          .select('pre')
          .text(error.stack);
      }
    }
    return InformativeView;
  }
});
export { InformativeView, InformativeViewMixin };
