/* globals d3, less */

class Model {
  constructor (options = {}) {
    this._eventHandlers = {};
    this._stickyTriggers = {};
    this._resourceSpecs = options.resources || [];
    this._resourceLookup = {};
    this.ready = this._loadResources(this._resourceSpecs)
      .then(() => { this.trigger('load'); });
  }

  _loadJS (url, raw, extraAttrs = {}) {
    if (Model.JS_PROMISES[url || raw]) {
      // We've already loaded the script
      return Model.JS_PROMISES[url || raw];
      // TODO: probably not worth the extra check for
      // document.querySelector(`script[src="${url}"]`)
      // because we have no way of knowing if its onload() has already been
      // been fired. Better to rely on clients to check on their own if a
      // library already exists (i.e. was loaded outside uki) before trying to
      // have uki load it
    }
    const script = document.createElement('script');
    script.type = 'application/javascript';
    for (const [key, value] of Object.entries(extraAttrs)) {
      script.setAttribute(key, value);
    }
    if (url !== undefined) {
      script.src = url;
    } else if (raw !== undefined) {
      script.innerText = raw;
    } else {
      throw new Error('Either a url or raw argument is required for JS resources');
    }
    Model.JS_PROMISES[url || raw] = new Promise((resolve, reject) => {
      script.addEventListener('load', () => { resolve(script); });
    });
    document.getElementsByTagName('head')[0].appendChild(script);
    return Model.JS_PROMISES[url];
  }

  _loadCSS (url, raw, extraAttrs = {}) {
    if (url !== undefined) {
      if (document.querySelector(`link[href="${url}"]`)) {
        // We've already added this stylesheet
        return Promise.resolve(document.querySelector(`link[href="${url}"]`));
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.media = 'screen';
      for (const [key, value] of Object.keys(extraAttrs)) {
        link.setAttribute(key, value);
      }
      const loadPromise = new Promise((resolve, reject) => {
        link.onload = () => { resolve(link); };
      });
      link.href = url;
      document.getElementsByTagName('head')[0].appendChild(link);
      return loadPromise;
    } else if (raw !== undefined) {
      if (Model.RAW_CSS_PROMISES[raw]) {
        return Model.RAW_CSS_PROMISES[raw];
      }
      const style = document.createElement('style');
      style.type = 'text/css';
      for (const [key, value] of Object.keys(extraAttrs)) {
        style.setAttribute(key, value);
      }
      if (style.styleSheet) {
        style.styleSheet.cssText = raw;
      } else {
        style.innerHTML = raw;
      }
      document.getElementsByTagName('head')[0].appendChild(style);
      Model.RAW_CSS_PROMISES[raw] = Promise.resolve(style);
      return Model.RAW_CSS_PROMISES[raw];
    } else {
      throw new Error('Either a url or raw argument is required for CSS resources');
    }
  }

  async _loadLESS (url, raw, extraAttrs = {}, lessArgs = {}) {
    if (url !== undefined) {
      if (Model.LESS_PROMISES[url]) {
        return Model.LESS_PROMISES[url];
      } else if (document.querySelector(`link[href="${url}"]`)) {
        return Promise.resolve(document.querySelector(`link[href="${url}"]`));
      }
    } else if (raw !== undefined) {
      if (Model.LESS_PROMISES[raw]) {
        return Model.LESS_PROMISES[raw];
      }
    } else {
      throw new Error('Either a url or raw argument is required for LESS resources');
    }
    const cssPromise = url ? less.render(`@import '${url}';`) : less.render(raw, lessArgs);
    Model.LESS_PROMISES[url || raw] = cssPromise.then(result => {
      // TODO: maybe do magic here to make LESS variables accessible under
      // this.resources?
      return this._loadCSS(undefined, result.css, extraAttrs);
    });
    return Model.LESS_PROMISES[url || raw];
  }

  async _getCoreResourcePromise (spec) {
    let p;
    if (spec instanceof Promise) {
      // An arbitrary promise
      return spec;
    } else if (spec.type === 'css') {
      // Load pure css directly
      p = this._loadCSS(spec.url, spec.raw, spec.extraAttributes || {});
    } else if (spec.type === 'less') {
      // Convert LESS to CSS
      p = this._loadLESS(spec.url, spec.raw, spec.extraAttributes || {}, spec.lessArgs || {});
    } else if (spec.type === 'fetch') {
      // Raw fetch request
      p = window.fetch(spec.url, spec.init || {});
    } else if (spec.type === 'js') {
      // Load a legacy JS script (i.e. something that can't be ES6-imported)
      p = this._loadJS(spec.url, spec.raw, spec.extraAttributes || {});
    } else if (d3[spec.type]) {
      // One of D3's native types
      const args = [];
      if (spec.init) {
        args.push(spec.init);
      }
      if (spec.row) {
        args.push(spec.row);
      }
      if (spec.type === 'dsv') {
        p = d3[spec.type](spec.delimiter, spec.url, ...args);
      } else {
        p = d3[spec.type](spec.url, ...args);
      }
    } else {
      throw new Error(`Can't load resource ${spec.url} of type ${spec.type}`);
    }
    if (spec.then) {
      if (spec.storeOriginalResult) {
        p.then(spec.then);
      } else {
        p = p.then(spec.then);
      }
    }
    return p;
  }

  async ensureLessIsLoaded () {
    if (!window.less || !window.less.render) {
      if (!window.less) {
        // Initial settings
        window.less = { logLevel: 0 };
        window._ukiLessPromise = this._loadJS('https://cdnjs.cloudflare.com/ajax/libs/less.js/3.11.1/less.min.js');
      }
      await window._ukiLessPromise;
    }
  }

  async loadLateResource (spec) {
    await this.ready;
    if (spec.type === 'less') {
      await this.ensureLessIsLoaded();
    }
    if (spec.name) {
      this._resourceLookup[spec.name] = this.resources.length;
    }
    this.resources.push(await this._getCoreResourcePromise(spec));
    this.trigger('load');
  }

  async _loadResources (specs = []) {
    // uki itself needs d3.js; make sure it exists
    if (!window.d3) {
      await this._loadJS('https://d3js.org/d3.v5.min.js');
    }

    // Don't need to do anything else; this makes some code cleaner below
    if (specs.length === 0) {
      return;
    }

    // First, construct a lookup of named dependencies
    specs.forEach((spec, i) => {
      if (spec.name) {
        this._resourceLookup[spec.name] = i;
      }
    });
    // Next, collect dependencies, with a deep copy for Kahn's algorithm to delete
    let hasLESSresources = false;
    const tempDependencies = [];
    const dependencies = specs.map((spec, i) => {
      const result = [];
      if (spec.type === 'less') {
        hasLESSresources = true;
      }
      for (const name of spec.loadAfter || []) {
        if (this._resourceLookup[name] === undefined) {
          throw new Error(`Can't loadAfter unknown resource: ${name}`);
        }
        result.push(this._resourceLookup[name]);
      }
      tempDependencies.push(Array.from(result));
      return result;
    });
    // Add and await LESS script if needed
    if (hasLESSresources) {
      await this.ensureLessIsLoaded();
    }
    // Now do Kahn's algorithm to topologically sort the graph, starting from
    // the resources with no dependencies
    const roots = Object.keys(specs)
      .filter(index => dependencies[index].length === 0);
    // Ensure that there's at least one root with no dependencies
    if (roots.length === 0) {
      throw new Error('No resource without loadAfter dependencies');
    }
    const topoSortOrder = [];
    while (roots.length > 0) {
      const index = parseInt(roots.shift());
      topoSortOrder.push(index);
      // Remove references to index from the graph
      for (const [childIndex, refList] of Object.entries(tempDependencies)) {
        const refIndex = refList.indexOf(index);
        if (refIndex > -1) {
          refList.splice(refIndex, 1);
          // If we removed this child's last dependency, it can go into the roots
          if (refList.length === 0) {
            roots.push(childIndex);
          }
        }
      }
    }
    if (topoSortOrder.length !== specs.length) {
      throw new Error('Cyclic loadAfter resource dependency');
    }
    // Load dependencies in topological order
    const resourcePromises = [];
    for (const index of topoSortOrder) {
      const parentPromises = dependencies[index]
        .map(parentIndex => resourcePromises[parentIndex]);
      resourcePromises[index] = Promise.all(parentPromises)
        .then(() => this._getCoreResourcePromise(specs[index]));
    }

    this.resources = await Promise.all(resourcePromises);
  }

  getNamedResource (name) {
    return this._resourceLookup[name] === undefined ? null
      : this.resources[this._resourceLookup[name]];
  }

  on (eventName, callback) {
    const [event, namespace] = eventName.split('.');
    this._eventHandlers[event] = this._eventHandlers[event] ||
      { '': [] };
    if (!namespace) {
      this._eventHandlers[event][''].push(callback);
    } else {
      this._eventHandlers[event][namespace] = callback;
    }
  }

  off (eventName, callback) {
    const [event, namespace] = eventName.split('.');
    if (this._eventHandlers[event]) {
      if (!namespace) {
        if (!callback) {
          this._eventHandlers[event][''] = [];
        } else {
          const index = this._eventHandlers[event][''].indexOf(callback);
          if (index >= 0) {
            this._eventHandlers[event][''].splice(index, 1);
          }
        }
      } else {
        delete this._eventHandlers[event][namespace];
      }
    }
  }

  trigger (event, ...args) {
    // TODO: maybe promise-ify this, so that anyone triggering an event has a
    // way of knowing that everyone has finished responding to it?
    const handleCallback = callback => {
      window.setTimeout(() => { // Timeout to prevent blocking
        callback.apply(this, args);
      }, 0);
    };
    if (this._eventHandlers[event]) {
      for (const namespace of Object.keys(this._eventHandlers[event])) {
        if (namespace === '') {
          this._eventHandlers[event][''].forEach(handleCallback);
        } else {
          handleCallback(this._eventHandlers[event][namespace]);
        }
      }
    }
  }

  stickyTrigger (eventName, argObj, delay = 10) {
    this._stickyTriggers[eventName] = this._stickyTriggers[eventName] || { argObj: {} };
    Object.assign(this._stickyTriggers[eventName].argObj, argObj);
    clearTimeout(this._stickyTriggers.timeout);
    this._stickyTriggers.timeout = setTimeout(() => {
      const argObj = this._stickyTriggers[eventName].argObj;
      delete this._stickyTriggers[eventName];
      this.trigger(eventName, argObj);
    }, delay);
  }
}
Model.LESS_PROMISES = {};
Model.JS_PROMISES = {};
Model.RAW_CSS_PROMISES = {};

/**
 * View classes
 */
class View extends Model {
  constructor (options = {}) {
    super(options);
    this.d3el = this.checkForEmptySelection(options.d3el || null);
    this.dirty = true;
    this._pauseRender = false;
    this._drawTimeout = null;
    this._renderResolves = [];
    this.debounceWait = options.debounceWait || 100;
    if (!options.suppressInitialRender) {
      this.render();
    }
  }

  checkForEmptySelection (d3el) {
    if (d3el && d3el.node() === null) {
      // Only trigger a warning if an empty selection gets passed in; undefined
      // is still just fine because render() doesn't always require an argument
      console.warn('Empty d3 selection passed to uki.js View');
      return null;
    } else {
      return d3el;
    }
  }

  get pauseRender () {
    return this._pauseRender;
  }

  set pauseRender (value) {
    this._pauseRender = value;
    if (!this._pauseRender) {
      // Automatically start another render call if we unpause
      this.render();
    }
  }

  async render (d3el = this.d3el) {
    d3el = this.checkForEmptySelection(d3el);
    if (!this.d3el || (d3el && d3el.node() !== this.d3el.node())) {
      this.d3el = d3el;
      this.dirty = true;
    }

    await this.ready;
    if (!this.d3el || this._pauseRender) {
      // Don't execute any render calls until all resources are loaded,
      // we've actually been given a d3 element to work with, and we're not
      // paused
      return new Promise((resolve, reject) => {
        this._renderResolves.push(resolve);
      });
    }

    if (this.dirty && this._setupPromise === undefined) {
      // Need a fresh render; call setup immediately
      this.updateContainerCharacteristics(this.d3el);
      this._setupPromise = this.setup(this.d3el);
      this.dirty = false;
      try {
        await this._setupPromise;
      } catch (err) {
        if (this.setupError) {
          this._setupPromise = this.setupError(this.d3el, err);
          await this._setupPromise;
        } else {
          throw err;
        }
      }
      delete this._setupPromise;
      this.trigger('setupFinished');
    }

    // Debounce the actual draw call, and return a promise that will resolve
    // when draw() actually finishes
    return new Promise((resolve, reject) => {
      this._renderResolves.push(resolve);
      clearTimeout(this._drawTimeout);
      this._drawTimeout = setTimeout(async () => {
        this._drawTimeout = null;
        if (this._setupPromise) {
          // Don't try / catch here because if there's an error, it will
          // be handled exactly once in the original context
          await this._setupPromise;
        }
        if (this._pauseRender) {
          // Do a _pauseRender check immediately before we do a draw call;
          // resolve for this Promise has already been added to _renderResolves
          return;
        }
        let result;
        try {
          result = await this.draw(this.d3el);
        } catch (err) {
          if (this.drawError) {
            result = await this.drawError(this.d3el, err);
          } else {
            throw err;
          }
        }
        this.trigger('drawFinished');
        const temp = this._renderResolves;
        this._renderResolves = [];
        for (const r of temp) {
          r(result);
        }
      }, this.debounceWait);
    });
  }

  async setup (d3el = this.d3el) {}

  async draw (d3el = this.d3el) {}

  updateContainerCharacteristics (d3el) {
    this.emSize = parseFloat(d3el.style('font-size'));
    this.scrollBarSize = this.computeScrollBarSize(d3el);
  }

  getBounds (d3el = this.d3el) {
    if (d3el) {
      return d3el.node().getBoundingClientRect();
    } else {
      return { width: 0, height: 0, left: 0, top: 0, right: 0, bottom: 0 };
    }
  }

  computeScrollBarSize (d3el) {
    // blatantly adapted from SO thread:
    // http://stackoverflow.com/questions/13382516/getting-scroll-bar-width-using-javascript
    var outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.width = '100px';
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps

    d3el.node().appendChild(outer);

    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = 'scroll';

    // add innerdiv
    var inner = document.createElement('div');
    inner.style.width = '100%';
    outer.appendChild(inner);

    var widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    return widthNoScroll - widthWithScroll;
  }
}

const createMixinAndDefault = function ({
  DefaultSuperClass = Object,
  classDefFunc,
  requireDefault = true,
  allowRemixinHandler = () => false,
  mixedInstanceOfDefault = true
}) {
  // Mixin function
  const Mixin = function (SuperClass) {
    if (SuperClass instanceof Mixin && !allowRemixinHandler(SuperClass)) {
      // If the same mixin is used more than once, generally we don't want to
      // remix; allowRemixinHandler can return true if we really allow for this,
      // and/or do special things in the event of a remix
      return SuperClass;
    }
    // Mixed class definition can inherit any arbitrary SuperClass...
    const MixedClass = classDefFunc(SuperClass);
    if (requireDefault &&
        SuperClass !== DefaultSuperClass &&
        !(MixedClass.prototype instanceof DefaultSuperClass)) {
      // ... but in most cases, we require that it EVENTUALLY inherits from
      // DefaultSuperClass. Can be overridden with requireDefault = false
      throw new Error(`${MixedClass.name} must inherit from ${DefaultSuperClass.name}`);
    }
    // Add a hidden property to the mixed class so we can handle instanceof
    // checks properly
    MixedClass.prototype[`_instanceOf${MixedClass.name}`] = true;
    return MixedClass;
  };
  // Default class definition inherits directly from DefaultSuperClass
  const DefaultClass = Mixin(DefaultSuperClass);
  // Make the Mixin function behave like a class for instanceof Mixin checks
  Object.defineProperty(Mixin, Symbol.hasInstance, {
    value: i => !!i[`_instanceOf${DefaultClass.name}`]
  });
  if (mixedInstanceOfDefault) {
    // Make instanceof DefaultClass true for anything that technically is only
    // an instanceof Mixin
    Object.defineProperty(DefaultClass, Symbol.hasInstance, {
      value: i => !!i[`_instanceOf${DefaultClass.name}`]
    });
  }
  // Return both the default class and the mixin function
  const wrapper = {};
  wrapper[DefaultClass.name] = DefaultClass;
  wrapper[DefaultClass.name + 'Mixin'] = Mixin;
  return wrapper;
};

const { Introspectable, IntrospectableMixin } = createMixinAndDefault({
  DefaultSuperClass: Object,
  requireDefault: false,
  classDefFunc: SuperClass => {
    class Introspectable extends SuperClass {
      get type () {
        return this.constructor.type;
      }

      get lowerCamelCaseType () {
        return this.constructor.lowerCamelCaseType;
      }

      get humanReadableType () {
        return this.constructor.humanReadableType;
      }
    }
    Object.defineProperty(Introspectable, 'type', {
      // This can / should be overridden by subclasses that follow a common string
      // pattern, such as RootToken, KeysToken, ParentToken, etc.
      configurable: true,
      get () { return this.name; }
    });
    Object.defineProperty(Introspectable, 'lowerCamelCaseType', {
      get () {
        const temp = this.type;
        return temp.replace(/./, temp[0].toLocaleLowerCase());
      }
    });
    Object.defineProperty(Introspectable, 'humanReadableType', {
      get () {
        // CamelCase to Sentence Case
        return this.type.replace(/([a-z])([A-Z])/g, '$1 $2');
      }
    });
    return Introspectable;
  }
});

var utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  createMixinAndDefault: createMixinAndDefault,
  Introspectable: Introspectable,
  IntrospectableMixin: IntrospectableMixin
});

var name = "uki";
var version = "0.6.9";
var description = "Minimal, d3-based Model-View library";
var module = "dist/uki.esm.js";
var scripts = {
	example: "bash examples/run.sh",
	build: "rollup -c",
	lint: "eslint **/*.js --quiet",
	dev: "rollup -c -w"
};
var repository = {
	type: "git",
	url: "git+https://github.com/ukijs/uki.git"
};
var author = "Alex Bigelow";
var license = "MIT";
var bugs = {
	url: "https://github.com/ukijs/uki/issues"
};
var homepage = "https://github.com/ukijs/uki#readme";
var devDependencies = {
	"@rollup/plugin-json": "^4.1.0",
	eslint: "^7.4.0",
	"eslint-config-semistandard": "^15.0.1",
	"eslint-config-standard": "^14.1.1",
	"eslint-plugin-import": "^2.22.0",
	"eslint-plugin-node": "^11.1.0",
	"eslint-plugin-promise": "^4.2.1",
	"eslint-plugin-standard": "^4.0.1",
	rollup: "^2.17.1",
	"rollup-plugin-execute": "^1.1.1",
	serve: "^11.3.2"
};
var peerDependencies = {
	d3: "^5.16.0"
};
var optionalDependencies = {
	less: "^3.11.3"
};
var pkg = {
	name: name,
	version: version,
	description: description,
	module: module,
	"jsnext:main": "dist/uki.esm.js",
	scripts: scripts,
	repository: repository,
	author: author,
	license: license,
	bugs: bugs,
	homepage: homepage,
	devDependencies: devDependencies,
	peerDependencies: peerDependencies,
	optionalDependencies: optionalDependencies
};

const version$1 = pkg.version;

globalThis.uki = globalThis.uki || {};
globalThis.uki.Model = Model;
globalThis.uki.View = View;
globalThis.uki.utils = utils;
globalThis.uki.version = version$1;

export { Model, View, utils, version$1 as version };
