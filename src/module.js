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

const globalUI = new GlobalUI(globalThis.uki.globalOptions || {});

const showTooltip = globalUI.showTooltip;
const showContextMenu = globalUI.showContextMenu;
const hideTooltip = globalUI.hideTooltip;
const showModal = globalUI.showModal;
const hideModal = globalUI.hideModal;

globalThis.uki.ui = {
  version,
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
