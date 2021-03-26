/* globals GoldenLayout, uki */
import { ThemeableMixin } from '../ThemeableMixin/ThemeableMixin.js';
import { RecolorableImageViewMixin } from '../RecolorableImageView/RecolorableImageView.js';
import defaultStyle from './style.less';

/*
  For forwarding each of GoldenLayout's events as uki events
 */
const EVENTS_TO_FORWARD = [
  'initialised',
  'stateChanged',
  'windowOpened',
  'windowClosed',
  'selectionChanged',
  'itemDestroyed',
  'itemCreated',
  'componentCreated',
  'rowCreated',
  'columnCreated',
  'stackCreated',
  'tabCreated'
];

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
            url: uki.ui.dynamicDependencies.glCSS
          });
        }

        // JS Dependencies if they aren't already loaded
        if (!window.jQuery) {
          options.resources.push({
            type: 'js',
            url: uki.ui.dynamicDependencies.jquery,
            extraAttributes: {
              integrity: uki.ui.dynamicDependencies.jqueryIntegrity,
              crossorigin: 'anonymous'
            },
            name: 'jquery'
          });
        }
        if (!window.GoldenLayout) {
          options.resources.push({
            type: 'js',
            url: uki.ui.dynamicDependencies['golden-layout'],
            loadAfter: ['jquery']
          });
        }
        super(options);

        this._useThemeHeaderHeight = options.useThemeHeaderHeight || true;

        // GoldenLayout requires that there be exactly one root item; we
        // abstract that requirement away with options.glLayout referring to
        // the first meaningful layer of items
        if (options.glSettings) {
          this._glSettings = options.glSettings;
        } else {
          this._glSettings = this.getDefaultGLSettings();
          if (options.glLayout) {
            this._glSettings.content[0] = options.glLayout;
          }
        }

        this.viewClassLookup = options.viewClassLookup;
        this._fixingTabs = false;
      }

      getDefaultGLLayout () {
        return {
          type: 'stack',
          content: [],
          isClosable: false
        };
      }

      getDefaultGLSettings () {
        return {
          content: [this.getDefaultGLLayout()]
        };
      }

      setupLayout () {
        const themeHeaderHeight = parseInt(this.d3el.style('--form-element-height'));
        if (this._useThemeHeaderHeight && themeHeaderHeight !== undefined) {
          this._glSettings.dimensions = this._glSettings.dimensions || {};
          this._glSettings.dimensions.headerHeight = themeHeaderHeight;
        }

        // Create the GoldenLayout instance and infrastructure for creating /
        // referencing views
        this.goldenLayout = new GoldenLayout(this._glSettings, this.d3el.node());
        this.views = {};
        for (const [className, ViewClass] of Object.entries(this.viewClassLookup)) {
          const self = this;
          this.goldenLayout.registerComponent(className, function (glContainer, glState) {
            const view = new ViewClass({ glContainer, glState, glRootView: this });
            self.views[view.viewID] = view;
            // Sneaky way to track the view instance *after* the container is
            // created, without needing to take over GoldentLayout's native
            // config ids for uki purposes
            glContainer._config._ukiViewID = view.viewID;
            view.on('tabDrawn', () => { self.fixTabs(); });
          });
        }

        // TODO: deal with popouts

        // Forward GoldenLayout events
        const self = this;
        for (const eventName of EVENTS_TO_FORWARD) {
          this.goldenLayout.on(eventName, function () {
            self.trigger(eventName, Array.from(arguments));
          });
        }
        // Make sure to remove our references to a view when it's destroyed, and
        // prevent it from rendering in a destroyed state
        this.on('itemDestroyed.GLRootView', glItem => {
          const recurse = (glItem) => {
            const view = this.views[glItem.config?._ukiViewID];
            if (view) {
              this.handleViewDestruction(view);
            } else if (glItem.contentItems) {
              for (const childComponent of glItem.contentItems) {
                recurse(childComponent);
              }
            }
          };
          recurse(glItem);
          this.renderAllViews();
        });
        this.goldenLayout.init();
      }

      handleViewDestruction (view) {
        // Prevent the view from rendering and remove it from our lookup
        view.revokeD3elOwnership();
        delete this.views[view.viewID];
      }

      raiseView (view) {
        const child = view.glContainer.parent; // get the glItem, not the glContainer
        const parent = child.parent;
        if (parent.setActiveContentItem) {
          parent.setActiveContentItem(child);
        }
      }

      get glLayout () {
        return this.goldenLayout.toConfig().content[0];
      }

      set glLayout (glLayout) {
        if (this.goldenLayout) {
          // Extract the current glSettings; we only want to change the layout
          this._glSettings = this.goldenLayout.toConfig();
          this._glSettings.content[0] = glLayout;

          // Make sure existing views and elements are properly destroyed
          while (this.goldenLayout.root.contentItems.length > 0) {
            this.goldenLayout.root.contentItems[0].remove();
          }
          this.goldenLayout.destroy();

          // Re-initialize
          this.setupLayout();
        } else {
          // We haven't initialized goldenLayout yet, so just override whatever
          // settings we had before
          this._glSettings.content[0] = glLayout;
        }
      }

      addView (glConfig, glItem, index) {
        const helper = item => {
          let targetItem = glItem(item);
          let index = 0;
          const children = item.contentItems || [];
          while (!targetItem && index < children.length) {
            targetItem = helper(children[index]);
            index += 1;
          }
          return targetItem || null;
        };
        if (typeof glItem === 'function') {
          // Iterate through the hierarchy for which thing to use as a parent...
          glItem = helper(this.goldenLayout.root.contentItems[0]);
        }
        if (!glItem) {
          // ...or default to the root if we can't find a suitable place for it
          glItem = this.goldenLayout.root.contentItems[0];
        }
        if (typeof index === 'function') {
          // Given that we're adding to glItem, where should the new view go?
          index = index(glItem);
        }
        index = index || 0;
        glItem.addChild(glConfig, index);
      }

      clearLayout () {
        this.glLayout = this.getDefaultGLLayout();
      }

      async setup () {
        await super.setup(...arguments);

        this.setupLayout();
        window.addEventListener('resize', () => {
          this.goldenLayout.updateSize();
          this.render();
        });
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
        if (this._fixingTabs) {
          return;
        }
        this._fixingTabs = true;
        globalThis.clearTimeout(this._fixTabsTimeout);
        this._fixTabsTimeout = globalThis.setTimeout(() => {
          // Sometimes tabs add extra stuff, which can invalidate
          // GoldenLayout's initial calculation of which tabs should be visible
          this.goldenLayout.updateSize();
          this._fixingTabs = false;
          this.trigger('tabsRendered');
        }, 50);
      }
    }
    return GLRootView;
  }
});

export { GLRootView, GLRootViewMixin };
