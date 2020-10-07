/* globals d3, uki */
import { ThemeableMixin } from '../ThemeableMixin/ThemeableMixin.js';
import { ButtonView } from '../ButtonView/ButtonView.js';
import defaultStyle from './style.less';

const { TooltipView, TooltipViewMixin } = uki.utils.createMixinAndDefault({
  DefaultSuperClass: uki.View,
  classDefFunc: SuperClass => {
    class TooltipView extends ThemeableMixin({
      SuperClass, defaultStyle, className: 'TooltipView'
    }) {
      constructor (options = {}) {
        super(options);

        this._content = options.content === undefined ? '' : options.content;
        this._visible = options.visible || false;
        this._showEvent = options.showEvent || null;
        this._target = options.target || null;
        this._targetBounds = options.targetBounds || null;
        this._anchor = options.anchor || null;
        this._hideAfterMs = options.hideAfterMs || 1000;
        this._interactive = options.interactive || false;
        this._nestLevel = options.nestLevel || 0;
        this._contextMenuEntries = options._contextMenuEntries || null;
        this._currentSubMenu = undefined;
        this._rootTooltip = options.rootTooltip || this;
        this._hideVote = this._rootTooltip !== this;
      }

      get content () {
        return this._content;
      }

      set content (value) {
        this._content = value;
        this._contextMenuEntries = null;
        delete this._currentSubMenu;
        this.resetHideTimer();
        this.render();
      }

      get visible () {
        return this._visible;
      }

      set visible (value) {
        this._visible = value;
        this.resetHideTimer();
        this.render();
      }

      get target () {
        return this._target;
      }

      set target (d3el) {
        this._target = d3el;
        delete this._targetBounds;
        this.render();
      }

      get targetBounds () {
        return this._targetBounds || this._target?.node().getBoundingClientRect();
      }

      set targetBounds (value) {
        this._targetBounds = value;
        delete this._target;
        this.render();
      }

      get anchor () {
        return this._anchor;
      }

      set anchor (value) {
        this._anchor = value;
        this.render();
      }

      get hideAfterMs () {
        return this._hideAfterMs;
      }

      set hideAfterMs (value) {
        this._hideAfterMs = value;
        this.resetHideTimer();
        this.render();
      }

      get interactive () {
        return this._interactive;
      }

      set interactive (value) {
        this._interactive = value;
        this.render();
      }

      async show ({
        content,
        hide,
        target,
        targetBounds,
        anchor,
        hideAfterMs,
        interactive,
        showEvent,
        isContextMenu = false
      } = {}) {
        if (content !== undefined) {
          this._content = content;
        }
        if (target !== undefined) {
          this._target = target;
          delete this._targetBounds;
        }
        if (targetBounds !== undefined) {
          this._targetBounds = targetBounds;
          delete this._target;
        }
        if (anchor !== undefined) {
          this._anchor = anchor;
        }
        if (hideAfterMs !== undefined) {
          this._hideAfterMs = hideAfterMs;
        }
        if (interactive !== undefined) {
          this._interactive = interactive;
        }
        if (showEvent !== undefined) {
          this._showEvent = showEvent;
        }
        if (!isContextMenu) {
          this._contextMenuEntries = null;
        }
        delete this._currentSubMenu;
        this._visible = !hide;
        this.resetHideTimer();
        await this.render();
      }

      async showContextMenu ({
        menuEntries = [],
        target,
        targetBounds,
        anchor,
        hideAfterMs,
        interactive,
        showEvent
      } = {}) {
        if (this._contextMenuEntries === null) {
          this._clearForContextMenu = true;
        }
        this._contextMenuEntries = menuEntries;
        delete this._currentSubMenu;
        await this.show({
          content: null,
          target,
          targetBounds,
          anchor: anchor || { x: 1, y: 0 },
          hideAfterMs: hideAfterMs,
          interactive: true,
          isContextMenu: true,
          showEvent
        });
      }

      async hide () {
        await this.show({ hide: true });
      }

      resetHideTimer () {
        globalThis.clearTimeout(this._tooltipTimeout);
        if (this.d3el) {
          this.d3el
            .on('mouseleave.tooltip', null)
            .on('mouseenter.tooltip', null);
        }
        if (this.hideAfterMs) {
          if (this.interactive && this.d3el) {
            // Only start the timer if the user's mouse moves outside of the
            // tooltip, and cancel it if it moves back in
            this.d3el.on('mouseleave.tooltip', () => {
              this._tooltipTimeout = globalThis.setTimeout(() => {
                this._hideVote = true;
                this._rootTooltip.hideIfAllVotesCast();
              }, this.hideAfterMs);
            }).on('mouseenter.tooltip', () => {
              this._hideVote = false;
              globalThis.clearTimeout(this._tooltipTimeout);
            });
          } else {
            // Start the timer immediately if not interactive
            this._tooltipTimeout = globalThis.setTimeout(() => {
              this._hideVote = true;
              this._rootTooltip.hideIfAllVotesCast();
            }, this.hideAfterMs);
          }
        }
      }

      hideIfAllVotesCast () {
        // Debounce tallying the votes until all events have had a chance to
        // be handled
        globalThis.clearTimeout(this._allVoteTimeout);
        this._allVoteTimeout = globalThis.setTimeout(() => {
          // All the submenus have to agree that the context menu tree should
          // be hidden, otherwise it stays visible
          let contextMenu = this._rootTooltip;
          let hide = true;
          while (contextMenu) {
            hide = hide && contextMenu._hideVote;
            contextMenu = contextMenu._currentSubMenu;
          }
          if (hide) {
            this.hide();
          }
        }, 0);
      }

      async setup () {
        await super.setup(...arguments);
        this.d3el.style('display', 'none')
          .style('left', '-1000em')
          .style('top', '-1000em');
        this.resetHideTimer();
      }

      computeTooltipPosition (tooltipBounds, targetBounds) {
        const anchor = Object.assign({}, this.anchor || {});
        let left, top, right, bottom;

        // *** Lots of helper functions for this
        function computeX () {
          left = (targetBounds.left + targetBounds.right) / 2 +
                 anchor.x * targetBounds.width / 2 -
                 tooltipBounds.width / 2 +
                 anchor.x * tooltipBounds.width / 2;
          right = left + tooltipBounds.width;
        }
        function computeY () {
          top = (targetBounds.top + targetBounds.bottom) / 2 +
                anchor.y * targetBounds.height / 2 -
                tooltipBounds.height / 2 +
                anchor.y * tooltipBounds.height / 2;
          bottom = top + tooltipBounds.height;
        }
        function clampX () {
          if (right > window.innerWidth) {
            right = window.innerWidth;
            left = right - tooltipBounds.width;
          }
          if (left < 0) {
            left = 0;
            right = tooltipBounds.width;
          }
        }
        function clampY () {
          if (bottom > window.innerHeight) {
            bottom = window.innerHeight;
            top = bottom - tooltipBounds.height;
          }
          if (top < 0) {
            top = 0;
            bottom = tooltipBounds.height;
          }
        }
        function overrideXAnchor () {
          if (targetBounds.left > window.innerWidth - targetBounds.right) {
            // there's more space on the left; try to put it there
            anchor.x = -1;
          } else {
            // more space on the right; try to put it there
            anchor.x = 1;
          }
        }
        function overrideYAnchor () {
          if (targetBounds.top > window.innerHeight - targetBounds.bottom) {
            // more space above; try to put it there
            anchor.y = -1;
          } else {
            // more space below; try to put it there
            anchor.y = 1;
          }
        }
        function xOverlaps () {
          return left < targetBounds.right && right > targetBounds.left;
        }
        function yOverlaps () {
          return top < targetBounds.top && bottom > targetBounds.bottom;
        }
        // *** End helper functions

        // First deal with the case that there isn't an anchor preference
        if (anchor.x === undefined) {
          if (anchor.y !== undefined) {
            // with y defined, default is to center x
            anchor.x = 0;
          } else {
            overrideXAnchor();
          }
        }
        if (anchor.y === undefined) {
          if (anchor.x !== undefined) {
            // with x defined, default is to center y
            anchor.y = 0;
          } else {
            overrideYAnchor();
          }
        }

        // Compute where the tooltip would end up
        computeX();
        computeY();

        // Clamp if offscreen
        clampX();
        clampY();

        // If we're overlapping the target, override the anchor and try again
        if (xOverlaps() && yOverlaps()) {
          // First try overriding X...
          const tempLeft = left;
          const tempRight = right;
          overrideXAnchor();
          computeX();
          clampX();
          if (xOverlaps()) {
            // Okay, X is impossible, restore what we had before and
            // try overriding Y...
            left = tempLeft;
            right = tempRight;
            overrideYAnchor();
            computeY();
            clampY();
          }
        }

        // At this point, we've done all we can to put it somewhere sensible
        return { left, top };
      }

      async draw () {
        await super.draw(...arguments);

        if (this._clearForContextMenu) {
          this.d3el.html('');
          delete this._clearForContextMenu;
        }

        this.d3el
          .classed('interactive', this.interactive)
          .style('display', this.visible ? null : 'none');

        if (!this.visible) {
          // Move the element offscreen to reduce flicker / seeing old states
          // next time the tooltip is shown
          this.d3el
            .style('left', '-1000em')
            .style('top', '-1000em');
          d3.select('body').on(`click.tooltip${this._nestLevel}`, null);
        } else {
          if (this.content instanceof uki.View) {
            await this.content.render(this.d3el);
          } else if (typeof this.content === 'function') {
            await this.content(this.d3el);
          } else if (typeof this.content === 'string') {
            this.d3el.html(this.content);
          }

          if (this._contextMenuEntries) {
            await this.drawContextMenu();
          }

          let tooltipPosition = {};

          const tooltipBounds = this.getBounds();
          const targetBounds = this.targetBounds;
          if (!targetBounds) {
            // Without a target, center the tooltip
            tooltipPosition.left = window.innerWidth / 2 - tooltipBounds.width / 2;
            tooltipPosition.top = window.innerHeight / 2 - tooltipBounds.height / 2;
          } else {
            tooltipPosition = this.computeTooltipPosition(tooltipBounds, targetBounds);
          }

          this.d3el.style('left', tooltipPosition.left + 'px')
            .style('top', tooltipPosition.top + 'px');

          d3.select('body').on(`click.tooltip${this._nestLevel}`, event => {
            if (
              (!this.interactive ||
               !this.d3el.node().contains(event.target)) &&
              event !== this._showEvent
            ) {
              // Vote to hide the tooltip if this isn't an interactive tooltip,
              // or if we click outside of an interactive tooltip, as long as
              // the current mouse event isn't the one that is trying to open
              // a tooltip
              this._hideVote = true;
              this._rootTooltip.hideIfAllVotesCast();
            }
          });
        }

        await this.drawSubMenu();
      }

      async drawContextMenu () {
        const contentFuncPromises = [];
        this.d3el.selectAll(':scope > :not(.menuItem)').remove();
        let menuEntries = this.d3el.selectAll(':scope > .menuItem')
          .data(this._contextMenuEntries, (d, i) => i);
        menuEntries.exit().remove();
        const menuEntriesEnter = menuEntries.enter().append('div')
          .classed('menuItem', true);
        menuEntries = menuEntries.merge(menuEntriesEnter);

        const self = this;
        menuEntries.classed('submenu', d => d && d.subEntries)
          .classed('checked', d => d && d.checked)
          .classed('separator', d => d === undefined || d === null)
          .each(function (d) {
            if (d === undefined || d === null) {
              d3.select(this).html('');
            } else if (d instanceof uki.View) {
              contentFuncPromises.push(d.render(d3.select(this)));
            } else if (typeof d === 'function') {
              contentFuncPromises.push(d(d3.select(this)));
            } else {
              const buttonOptions = {
                d3el: d3.select(this),
                borderless: true
              };
              if (typeof d === 'string') {
                buttonOptions.label = d;
              } else {
                Object.assign(buttonOptions, d);
              }
              if (this.__contextMenuButtonView) {
                Object.assign(this.__contextMenuButtonView, buttonOptions);
              } else {
                this.__contextMenuButtonView = new ButtonView(buttonOptions);
              }
              contentFuncPromises.push(this.__contextMenuButtonView.render());
            }
          }).on('click.TooltipView, keypress.TooltipView1', (event, d) => {
            if (event.type === 'keypress' && event.keyCode !== 32) {
              return;
            }
            if (d && d.onclick && !d.disabled) {
              d.onclick();
              this._rootTooltip.hide();
            }
          }).on('mouseenter.TooltipView, keypress.TooltipView2', function (event, d) {
            if (event.type === 'keypress' && event.keyCode !== 32) {
              return;
            }
            if (d && d.subEntries) {
              // Use the menu item, including its margins, as targetBounds
              let targetBounds = this.getBoundingClientRect();
              const targetStyle = globalThis.getComputedStyle(this);
              const targetMargins = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft']
                .map(m => parseFloat(targetStyle[m]));
              targetBounds = {
                top: targetBounds.top - targetMargins[0],
                right: targetBounds.right + targetMargins[1],
                bottom: targetBounds.bottom + targetMargins[2],
                left: targetBounds.left - targetMargins[3],
                width: targetBounds.width + targetMargins[0] + targetMargins[2],
                height: targetBounds.height + targetMargins[1] + targetMargins[3]
              };
              if (self._currentSubMenu) {
                self._currentSubMenu._targetBounds = targetBounds;
                self._currentSubMenu._contextMenuEntries = d.subEntries;
                delete self._currentSubMenu._currentSubMenu;
              } else {
                self._currentSubMenu = new TooltipView({
                  content: null,
                  visible: true,
                  nestLevel: self._nestLevel + 1,
                  targetBounds,
                  _contextMenuEntries: d.subEntries,
                  anchor: { x: 1, y: 0 },
                  interactive: true,
                  rootTooltip: self._rootTooltip
                });
              }
              self.render();
            }
          });
        await Promise.all(contentFuncPromises);
      }

      async drawSubMenu () {
        let d3el = d3.select(`.nestedContextMenu[data-nest-level="${this._nestLevel + 1}"]`);
        if (!this._currentSubMenu) {
          // Remove any context menus deeper than our level
          let level = this._nestLevel + 1;
          while (d3el.node() !== null) {
            d3el.remove();
            d3.select('body').on(`click.tooltip${level}`, null);
            level += 1;
            d3el = d3.select(`.nestedContextMenu[data-nest-level="${level}"]`);
          }
        } else {
          if (!d3el.node()) {
            d3el = d3.select('body').append('div')
              .classed('nestedContextMenu', true)
              .attr('data-nest-level', this._nestLevel + 1);
          }
          await this._currentSubMenu.render(d3el);
        }
      }
    }
    return TooltipView;
  }
});

export { TooltipView, TooltipViewMixin };
