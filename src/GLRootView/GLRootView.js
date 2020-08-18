/* globals GoldenLayout, uki */
import { ThemeableMixin } from '../ThemeableMixin/ThemeableMixin.js';
import { RecolorableImageViewMixin } from '../RecolorableImageView/RecolorableImageView.js';
import defaultStyle from './style.less';

const { GLRootView, GLRootViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: uki.View,
  classDefFunc: SuperClass => {
    class GLRootView extends RecolorableImageViewMixin(ThemeableMixin({
      SuperClass, defaultStyle, className: 'GLRootView'
    })) {
      constructor (options) {
        options.resources = options.resources || [];

        // Core CSS Styles
        if (options.glCoreStyleResource) {
          options.resources.unshift(options.glCoreStyleResource);
        } else {
          options.resources.unshift({
            type: 'css',
            url: 'https://golden-layout.com/files/latest/css/goldenlayout-base.css'
          });
        }

        // JS Dependencies if they aren't already loaded
        if (!window.jQuery) {
          options.resources.push({
            type: 'js',
            url: 'https://code.jquery.com/jquery-3.4.1.min.js',
            extraAttributes: {
              integrity: 'sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=',
              crossorigin: 'anonymous'
            },
            name: 'jQuery'
          });
        }
        if (!window.GoldenLayout) {
          options.resources.push({
            type: 'js',
            url: 'https://golden-layout.com/files/latest/js/goldenlayout.min.js',
            loadAfter: ['jQuery']
          });
        }
        super(options);

        this.glSettings = options.glSettings || {
          content: [{
            type: 'stack',
            content: []
          }]
        };
        this.viewClassLookup = options.viewClassLookup;
      }

      setupLayout () {
        // Add some default settings if they're not already set
        this.glSettings.dimensions = this.glSettings.dimensions || {};
        this.glSettings.dimensions.headerHeight =
          this.glSettings.dimensions.headerHeight ||
          parseInt(this.d3el.style('--form-element-height'));

        // Create the GoldenLayout instance and infrastructure for creating /
        // referencing views
        this.goldenLayout = new GoldenLayout(this.glSettings, this.d3el.node());
        this.views = {};
        for (const [className, ViewClass] of Object.entries(this.viewClassLookup)) {
          const self = this;
          this.goldenLayout.registerComponent(className, function (container, state) {
            const view = self.createView(ViewClass, container, state);
            self.views[view.viewID] = view;
            view.on('tabDrawn', () => { self.fixTabs(); });
          });
        }
        this.goldenLayout.on('windowOpened', () => {
          // TODO: deal with popouts
        });
        this.goldenLayout.on('itemDestroyed', component => {
          const recurse = (component) => {
            if (component.instance) {
              this.handleViewDestruction(component.instance);
            } else if (component.contentItems) {
              for (const childComponent of component.contentItems) {
                recurse(childComponent);
              }
            }
          };
          recurse(component);
          this.renderAllViews();
        });
        window.addEventListener('resize', () => {
          this.goldenLayout.updateSize();
          this.render();
        });
        this.goldenLayout.init();
      }

      createView (ViewClass, glContainer, glState) {
        return new ViewClass({ glContainer, glState });
      }

      handleViewDestruction (view) {
        // Prevent the view from rendering and remove it from our lookup
        view.pauseRender = true;
        delete this.views[view.viewID];
      }

      raiseView (view) {
        let child = view.glContainer;
        let parent = child.parent;
        while (parent !== null && parent.setActiveContentItem) {
          child = child.parent;
          parent = parent.parent;
        }
        if (parent.setActiveContentItem) {
          parent.setActiveContentItem(child);
        }
      }

      setLayout (layout) {
        while (this.goldenLayout.root.contentItems.length > 0) {
          this.goldenLayout.root.contentItems[0].remove();
        }
        this.goldenLayout.root.addChild(layout);
      }

      async setup () {
        await super.setup(...arguments);

        this.setupLayout();
        this.renderAllViews();
      }

      async draw () {
        const bounds = this.getBounds();
        if (bounds.width !== this.goldenLayout.width ||
            bounds.height !== this.goldenLayout.height) {
          this.goldenLayout.updateSize();
        }
        await super.draw(...arguments);
        this.renderAllViews();
      }

      async renderAllViews () {
        return Promise.all(Object.values(this.views).map(view => view.render()));
      }

      fixTabs () {
        globalThis.clearTimeout(this._fixTabsTimeout);
        this._fixTabsTimeout = globalThis.setTimeout(() => {
          // Sometimes tabs add extra stuff, which can invalidate
          // GoldenLayout's initial calculation of which tabs should be visible
          this.goldenLayout.updateSize();
        }, 50);
      }
    }
    return GLRootView;
  }
});

export { GLRootView, GLRootViewMixin };
