import GlobalUI from './GlobalUI.js';

import { ThemeableMixin } from './ThemeableMixin/ThemeableMixin.js';
import { OverlaidView, OverlaidViewMixin } from './OverlaidView/OverlaidView.js';
import { InformativeView, InformativeViewMixin } from './InformativeView/InformativeView.js';
import { ParentSizeView, ParentSizeViewMixin } from './ParentSizeView/ParentSizeView.js';
import { AnimatedView, AnimatedViewMixin } from './AnimatedView/AnimatedView.js';
import { RecolorableImageView, RecolorableImageViewMixin } from './RecolorableImageView/RecolorableImageView.js';
import { SvgView, SvgViewMixin } from './SvgView/SvgView.js';
import { CanvasView, CanvasViewMixin } from './CanvasView/CanvasView.js';
import { IFrameView, IFrameViewMixin } from './IFrameView/IFrameView.js';
import { ModalView, ModalViewMixin } from './ModalView/ModalView.js';
import { TooltipView, TooltipViewMixin } from './TooltipView/TooltipView.js';
import { ButtonView, ButtonViewMixin } from './ButtonView/ButtonView.js';
import { GLRootView, GLRootViewMixin } from './GLRootView/GLRootView.js';
import { GLView, GLViewMixin } from './GLView/GLView.js';
import { SvgGLView, SvgGLViewMixin } from './SvgGLView/SvgGLView.js';
import { CanvasGLView, CanvasGLViewMixin } from './CanvasGLView/CanvasGLView.js';
import { IFrameGLView, IFrameGLViewMixin } from './IFrameGLView/IFrameGLView.js';
import { BaseTableView, BaseTableViewMixin } from './BaseTableView/BaseTableView.js';
import { FlexTableView, FlexTableViewMixin } from './FlexTableView/FlexTableView.js';
import { LineChartView, LineChartViewMixin } from './LineChartView/LineChartView.js';
import { VegaView, VegaViewMixin } from './VegaView/VegaView.js';

import pkg from '../package.json';
const version = pkg.version;

const jqueryVersion = pkg.optionalDependencies.jquery.match(/[\d.]+/)[0];
const glVersion = pkg.optionalDependencies['golden-layout'].match(/[\d.]+/)[0];
const vegaVersion = pkg.optionalDependencies.vega.match(/[\d.]+/)[0];
const vegaLiteVersion = pkg.optionalDependencies['vega-lite'].match(/[\d.]+/)[0];

const dynamicDependencies = {
  jquery: `https://code.jquery.com/jquery-${jqueryVersion}.min.js`,
  jqueryIntegrity: 'sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=', // TODO: find a way to automate this after running ncu -u?
  'golden-layout': `https://cdnjs.cloudflare.com/ajax/libs/golden-layout/${glVersion}/goldenlayout.min.js`,
  glCSS: `https://cdnjs.cloudflare.com/ajax/libs/golden-layout/${glVersion}/css/goldenlayout-base.css`,
  vega: `https://cdnjs.cloudflare.com/ajax/libs/vega/${vegaVersion}/vega.min.js`,
  'vega-lite': `https://cdnjs.cloudflare.com/ajax/libs/vega-lite/${vegaLiteVersion}/vega-lite.min.js`
};

const globalUI = new GlobalUI(globalThis.uki.globalOptions || {});

const showTooltip = options => globalUI.showTooltip(options);
const showContextMenu = options => globalUI.showContextMenu(options);
const hideTooltip = options => globalUI.hideTooltip(options);
const showModal = options => globalUI.showModal(options);
const hideModal = options => globalUI.hideModal(options);

globalThis.uki.ui = {
  version,
  dynamicDependencies,
  globalUI,
  showTooltip,
  showContextMenu,
  hideTooltip,
  showModal,
  hideModal,
  ThemeableMixin,
  OverlaidView,
  OverlaidViewMixin,
  InformativeView,
  InformativeViewMixin,
  ParentSizeView,
  ParentSizeViewMixin,
  AnimatedView,
  AnimatedViewMixin,
  RecolorableImageView,
  RecolorableImageViewMixin,
  SvgView,
  SvgViewMixin,
  CanvasView,
  CanvasViewMixin,
  IFrameView,
  IFrameViewMixin,
  ButtonView,
  ButtonViewMixin,
  ModalView,
  ModalViewMixin,
  TooltipView,
  TooltipViewMixin,
  GLRootView,
  GLRootViewMixin,
  GLView,
  GLViewMixin,
  SvgGLView,
  SvgGLViewMixin,
  CanvasGLView,
  CanvasGLViewMixin,
  IFrameGLView,
  IFrameGLViewMixin,
  BaseTableView,
  BaseTableViewMixin,
  FlexTableView,
  FlexTableViewMixin,
  LineChartView,
  LineChartViewMixin,
  VegaView,
  VegaViewMixin
};

export {
  version,
  dynamicDependencies,
  globalUI,
  showTooltip,
  showContextMenu,
  hideTooltip,
  showModal,
  hideModal,
  ThemeableMixin,
  OverlaidView,
  OverlaidViewMixin,
  InformativeView,
  InformativeViewMixin,
  ParentSizeView,
  ParentSizeViewMixin,
  AnimatedView,
  AnimatedViewMixin,
  RecolorableImageView,
  RecolorableImageViewMixin,
  SvgView,
  SvgViewMixin,
  CanvasView,
  CanvasViewMixin,
  IFrameView,
  IFrameViewMixin,
  ButtonView,
  ButtonViewMixin,
  ModalView,
  ModalViewMixin,
  TooltipView,
  TooltipViewMixin,
  GLRootView,
  GLRootViewMixin,
  GLView,
  GLViewMixin,
  SvgGLView,
  SvgGLViewMixin,
  CanvasGLView,
  CanvasGLViewMixin,
  IFrameGLView,
  IFrameGLViewMixin,
  BaseTableView,
  BaseTableViewMixin,
  FlexTableView,
  FlexTableViewMixin,
  LineChartView,
  LineChartViewMixin,
  VegaView,
  VegaViewMixin
};
