/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2013 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Angle input field.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.FieldAngleLimited');

goog.require('Blockly.DropDownDiv');
goog.require('Blockly.FieldTextInput');
goog.require('goog.math');
goog.require('goog.userAgent');


/**
 * Class for an editable angle field.
 * @param {(string|number)=} opt_value The initial content of the field. The
 *     value should cast to a number, and if it does not, '0' will be used.
 * @param {Function=} opt_validator An optional function that is called
 *     to validate any constraints on what the user entered.  Takes the new
 *     text as an argument and returns the accepted text or null to abort
 *     the change.
 * @extends {Blockly.FieldTextInput}
 * @constructor
 */
Blockly.FieldAngleLimited = function (opt_value, opt_validator) {
  // Add degree symbol: '360°' (LTR) or '°360' (RTL)
  this.symbol_ = Blockly.utils.createSvgElement('tspan', {}, null);
  this.symbol_.appendChild(document.createTextNode('\u00B0'));

  var numRestrictor = new RegExp("[\\d]|[\\.]|[\\-]");

  this.buttonNum_ = null;
  this.handle_ = null;
  this.arrowSvg_ = null;
  this.iconSvg_ = null;

  //화면 크기
  this.fieldEditorHeight_ = 0;
  this.fieldEditorWidth_ = 0;

  this.buttonSVGs_ = [];

  //마우스 동작
  this.mouseIsDown_ = false;

  this.mouseEnterWrappers_ = [];
  this.mouseDownWrappers_ = [];
  this.mouseHoverWrappers_ = [];
  this.mouseLeaveWrappers_ = [];

  this.mouseUpWrapper_ = null;
  this.mouseMoveWrapper_ = null;
  this.touchMoveWrapper_ = null;  // rogic-mobile

  opt_value = (opt_value && !isNaN(opt_value)) ? String(opt_value) : '0';
  Blockly.FieldAngleLimited.superClass_.constructor.call(
    this, opt_value, opt_validator, numRestrictor);
  this.addArgType('angle_limited');
};
goog.inherits(Blockly.FieldAngleLimited, Blockly.FieldTextInput);

/**
 * Construct a FieldSubAngle from a JSON arg object.
 * @param {!Object} options A JSON object with options (angle).
 * @returns {!Blockly.FieldAngleLimited} The new field instance.
 * @package
 * @nocollapse
 */
Blockly.FieldAngleLimited.fromJson = function (options) {
  return new Blockly.FieldAngleLimited(options['angle_limited']);
};

/**
 * Round angles to the nearest 15 degrees when using mouse.
 * Set to 0 to disable rounding.
 */
Blockly.FieldAngleLimited.ROUND = 1;

/**
 * Half the width of protractor image.
 */
Blockly.FieldAngleLimited.HALF = 180 / 2;


/**
 * Angle increases clockwise (true) or counterclockwise (false).
 */
Blockly.FieldAngleLimited.CLOCKWISE = true;

/**
 * Offset the location of 0 degrees (and all angles) by a constant.
 * Usually either 0 (0 = right) or 90 (0 = up).
 */
Blockly.FieldAngleLimited.OFFSET = 90;

/**
 * Maximum allowed angle before wrapping.
 * Usually either 360 (for 0 to 359.9) or 180 (for -179.9 to 180).
 */
Blockly.FieldAngleLimited.WRAP = 180;

/**
 * Radius of drag handle
 */
Blockly.FieldAngleLimited.HANDLE_RADIUS = Blockly.FieldAngleLimited.HALF / 6;

/**
 * Width of drag handle arrow
 */
Blockly.FieldAngleLimited.ARROW_WIDTH = Blockly.FieldAngleLimited.HANDLE_RADIUS;

/**
 * Half the stroke-width used for the "glow" around the drag handle, rounded up to nearest whole pixel
 */

Blockly.FieldAngleLimited.HANDLE_GLOW_WIDTH = Blockly.FieldAngleLimited.HALF / 20;

/**
 * Radius of protractor circle.  Slightly smaller than protractor size since
 * otherwise SVG crops off half the border at the edges.
 */
Blockly.FieldAngleLimited.RADIUS = Blockly.FieldAngleLimited.HALF
  - Blockly.FieldAngleLimited.HANDLE_RADIUS - Blockly.FieldAngleLimited.HANDLE_GLOW_WIDTH;

/**
 * Radius of central dot circle.
 */
Blockly.FieldAngleLimited.CENTER_RADIUS = Blockly.FieldAngleLimited.HALF / 6;

// 버튼 크기
Blockly.FieldAngleLimited.BUTTON_HEIGHT = 30;
Blockly.FieldAngleLimited.BUTTON_WIDTH = Blockly.FieldAngleLimited.BUTTON_HEIGHT;
//버튼 곡선
Blockly.FieldAngleLimited.BUTTON_RADIUS = Blockly.FieldAngleLimited.BUTTON_HEIGHT / 3;
//버튼 사이 마진
Blockly.FieldAngleLimited.BUTTON_MARGIN = Blockly.FieldAngleLimited.BUTTON_HEIGHT / 3;
//버튼 색상
Blockly.FieldAngleLimited.FILL = '#8F8F8F';
Blockly.FieldAngleLimited.SELECTED_FILL = '#4B96FF';

//버튼 안 모양 사진
Blockly.FieldAngleLimited.ARROW_SVG_PATH = 'icons/arrow_white.svg';
Blockly.FieldAngleLimited.SYNC_SVG_PATH = 'icons/icon_sync_white.svg';
Blockly.FieldAngleLimited.PLUS_PATH = 'icons/plus.svg';
Blockly.FieldAngleLimited.SELECTED_PLUS_PATH = 'icons/plus_blue.svg';
Blockly.FieldAngleLimited.MINUS_PATH = 'icons/minus.svg';
Blockly.FieldAngleLimited.SELECTED_MINUS_PATH = 'icons/minus_blue.svg';;
Blockly.FieldAngleLimited.SELECTED_SIZE = 3;

//사진 크기
Blockly.FieldAngleLimited.ICON_WIDTH = Blockly.FieldAngleLimited.BUTTON_HEIGHT / 6 * 5;
Blockly.FieldAngleLimited.ICON_HEIGHT = Blockly.FieldAngleLimited.ICON_WIDTH;

Blockly.FieldAngleLimited.BUTTON_INFO = [
  {name: 'handle', option: 0},
  {name: '+', option: 1},
  {name: '[]', option: 2},
  {name: '-', option: 3},
  {name: 'sync', option: 4}
];

//버튼 모양 path
Blockly.FieldAngleLimited.prototype.getButtonKeyPath_ = function (x, y, width, height) {
  return 'M' + x + ' ' + (y + Blockly.FieldAngleLimited.BUTTON_RADIUS) + ' ' +
    'L' + x + ' ' + (y + height - Blockly.FieldAngleLimited.BUTTON_RADIUS) + ' ' +
    'Q' + x + ' ' + (y + height) + ' ' +
    (x + Blockly.FieldAngleLimited.BUTTON_RADIUS) + ' ' + (y + height) + ' ' +
    'L' + (x + width - Blockly.FieldAngleLimited.BUTTON_RADIUS) + ' ' + (y + height) + ' ' +
    'Q' + (x + width) + ' ' + (y + height) + ' ' +
    (x + width) + ' ' + (y + height - Blockly.FieldAngleLimited.BUTTON_RADIUS) + ' ' +
    'L' + (x + width) + ' ' + (y + Blockly.FieldAngleLimited.BUTTON_RADIUS) + ' ' +
    'Q' + (x + width) + ' ' + y + ' ' +
    (x + width - Blockly.FieldAngleLimited.BUTTON_RADIUS) + ' ' + y + ' ' +
    'L' + (x + Blockly.FieldAngleLimited.BUTTON_RADIUS) + ' ' + y + ' ' +
    'Q' + x + ' ' + y + ' ' +
    x + ' ' + (y + Blockly.FieldAngleLimited.BUTTON_RADIUS) + ' ';
};

Blockly.FieldAngleLimited.prototype.widgetDispose_ = function () {
  this.isRealtime = false;
  var thisField = this;
  return function () {
    Blockly.FieldAngleLimited.superClass_.widgetDispose_.call(thisField);
    thisField.unbindEvents_(thisField.htmlInput);
    thisField.gauge_ = null;
    if (thisField.mouseUpWrapper_) {
      Blockly.unbindEvent_(thisField.mouseUpWrapper_);
    }
    if (thisField.mouseMoveWrapper_) {
      Blockly.unbindEvent_(thisField.mouseMoveWrapper_);
    }
    if (thisField.touchMoveWrapper_) {
      Blockly.unbindEvent_(thisField.touchMoveWrapper_);
    }
    thisField.mouseDownWrappers_.forEach(function (wrapper) {
      Blockly.unbindEvent_(wrapper);
    });
    thisField.mouseHoverWrappers_.forEach(function (wrapper) {
      Blockly.unbindEvent_(wrapper);
    });
    thisField.mouseLeaveWrappers_.forEach(function (wrapper) {
      Blockly.unbindEvent_(wrapper);
    });
    thisField.mouseEnterWrappers_.forEach(function (wrapper) {
      Blockly.unbindEvent_(wrapper);
    });
  };
};

/**
 * Show the inline free-text editor on top of the text.
 * @private
 */
Blockly.FieldAngleLimited.prototype.showEditor_ = function () {
  // Mobile browsers have issues with in-line textareas (focus & keyboards).
  Blockly.FieldAngleLimited.superClass_.showEditor_.call(this, this.useTouchInteraction_);
  // If there is an existing drop-down someone else owns, hide it immediately and clear it.
  Blockly.DropDownDiv.hideWithoutAnimation();
  Blockly.DropDownDiv.clearContent();
  var div = Blockly.DropDownDiv.getContentDiv();
  // Build the SVG DOM.
  var svg = Blockly.utils.createSvgElement('svg', {
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:html': 'http://www.w3.org/1999/xhtml',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    'version': '1.1',
    'height': (Blockly.FieldAngleLimited.HALF * 2 + Blockly.FieldAngleLimited.BUTTON_MARGIN + Blockly.FieldAngleLimited.BUTTON_HEIGHT) + 'px',
    'width': (Blockly.FieldAngleLimited.HALF * 2) + 'px'
  }, div);
  //update에서 사용하 기위한 초기화
  this.buttonSVGs_ = [];
  // 짙은 파란색 원 그리는 거
  Blockly.utils.createSvgElement('circle', {
    'cx': Blockly.FieldAngleLimited.HALF, 'cy': Blockly.FieldAngleLimited.HALF,
    'r': Blockly.FieldAngleLimited.RADIUS,
    'class': 'blocklyAngleLimitedCircle'
  }, svg);
  // 범위 색칠하는 친구
  this.gauge_ = Blockly.utils.createSvgElement('path',
    {'class': 'blocklyAngleLimitedGauge'}, svg);
  this.rowGauge_ = Blockly.utils.createSvgElement('path',
    {'class': 'blocklyAngleLimitedRowGauge'}, svg);

  // 눈금
  // draw markers around the edge.
  for (var angle = 0; angle < 360; angle += 15) {
    Blockly.utils.createSvgElement('line', {
      'x1': Blockly.FieldAngleLimited.HALF + Blockly.FieldAngleLimited.RADIUS - 13,
      'y1': Blockly.FieldAngleLimited.HALF,
      'x2': Blockly.FieldAngleLimited.HALF + Blockly.FieldAngleLimited.RADIUS - 7,
      'y2': Blockly.FieldAngleLimited.HALF,
      'class': 'blocklyAngleLimitedMarks',
      'transform': 'rotate(' + angle + ',' +
        Blockly.FieldAngleLimited.HALF + ',' + Blockly.FieldAngleLimited.HALF + ')'
    }, svg);
  }
  // Center point
  var centerPoint = Blockly.utils.createSvgElement('g', {}, svg);

  centerPoint.setAttribute('transform', 'translate(' + Blockly.FieldAngleLimited.HALF + ',' + Blockly.FieldAngleLimited.HALF + ')');

  Blockly.utils.createSvgElement('circle', {
    'cx': 0, 'cy': 0,
    'r': Blockly.FieldAngleLimited.CENTER_RADIUS,
    'stroke': '#4C97FF',
    'stroke-width': '5',
    'stroke-opacity': '0',
    'fill': Blockly.FieldAngleLimited.FILL,
    'cursor': 'pointer'
  }, centerPoint);

  var syncImage = Blockly.utils.createSvgElement('image',
    {
      'width': Blockly.FieldAngleLimited.ICON_WIDTH,
      'height': Blockly.FieldAngleLimited.ICON_HEIGHT,
      'x': -Blockly.FieldAngleLimited.ICON_WIDTH / 2,
      'y': -Blockly.FieldAngleLimited.ICON_WIDTH / 2,
      'transform': 'scale(0.85)',
      'class': 'blocklyAngleLimitedDragArrow',
      'cursor': 'pointer'
    },
    centerPoint);

  syncImage.setAttributeNS(
    'http://www.w3.org/1999/xlink',
    'xlink:href',
    Blockly.mainWorkspace.options.pathToMedia + Blockly.FieldAngleLimited.SYNC_SVG_PATH
  );

  this.isRealtime = false;
  this.buttonSVGs_[4] = centerPoint;
  centerPoint.setAttribute('button-option', Blockly.FieldAngleLimited.BUTTON_INFO[4].option);
  centerPoint.setAttribute('button-name', Blockly.FieldAngleLimited.BUTTON_INFO[4].name);
  this.mouseDownWrappers_[5] = Blockly.bindEvent_(centerPoint, 'mousedown', this, function (e) {
    if (this.isRealtime) {
      this.buttonSVGs_[4].querySelector('circle').setAttribute('fill', Blockly.FieldAngleLimited.FILL);
      this.buttonSVGs_[4].querySelector('circle').setAttribute('stroke-opacity', '0');
      this.isRealtime = false;
    }
    else {
      this.buttonSVGs_[4].querySelector('circle').setAttribute('fill', Blockly.FieldAngleLimited.SELECTED_FILL);
      this.buttonSVGs_[4].querySelector('circle').setAttribute('stroke-opacity', '0.25');
      this.isRealtime = true;
      Blockly.Events.fire(new Blockly.Events.BlockChange(this.sourceBlock_.getParent(), 'realtime', this.name, null, null));
    }
    this.onMouseButtonDown(e);
  });

  // Handle group: a circle and the arrow image
  this.handle_ = Blockly.utils.createSvgElement('g', {}, svg);
  Blockly.utils.createSvgElement('circle', {
    'cx': 0,
    'cy': 0,
    'r': Blockly.FieldAngleLimited.HANDLE_RADIUS,
    'class': 'blocklyAngleLimitedDragHandle',
    'cursor': 'pointer'
  }, this.handle_);
  this.arrowSvg_ = Blockly.utils.createSvgElement('image',
    {
      'width': Blockly.FieldAngleLimited.ARROW_WIDTH,
      'height': Blockly.FieldAngleLimited.ARROW_WIDTH,
      'x': -Blockly.FieldAngleLimited.ARROW_WIDTH / 2,
      'y': -Blockly.FieldAngleLimited.ARROW_WIDTH / 2,
      'class': 'blocklyAngleLimitedDragArrow',
      'cursor': 'pointer'
    },
    this.handle_);
  this.arrowSvg_.setAttributeNS(
    'http://www.w3.org/1999/xlink',
    'xlink:href',
    Blockly.mainWorkspace.options.pathToMedia + Blockly.FieldAngleLimited.ARROW_SVG_PATH
  );

  Blockly.DropDownDiv.setColour(this.sourceBlock_.parentBlock_.getColour(),
    this.sourceBlock_.getColourTertiary());
  Blockly.DropDownDiv.setCategory(this.sourceBlock_.parentBlock_.getCategory());
  Blockly.DropDownDiv.showPositionedByBlock(this, this.sourceBlock_);

  this.rowGuage_();

  Blockly.DropDownDiv.setColour('#ffffff', '#dddddd');


  this.buttonSVGs_[0] = this.handle_;
  this.mouseDownWrappers_[0] = Blockly.bindEvent_(this.handle_, 'mousedown', this, this.onMouseHandleDown);

  //빈 버튼 그룹 선언
  var buttonGroup = Blockly.utils.createSvgElement('g', {}, svg);
  //버튼 그룹에 각 버튼을 그려서 저장시킴
  this.addButton_(buttonGroup, this.buttonSVGs_);

  this.handle_.setAttribute('button-option', Blockly.FieldAngleLimited.BUTTON_INFO[0].option);
  this.handle_.setAttribute('button-name', Blockly.FieldAngleLimited.BUTTON_INFO[0].name);

  this.buttonInserter_(1, false, false);
  this.buttonInserter_(3, true, false);

  this.htmlInput = Blockly.FieldTextInput.htmlInput_;

  var bBox = this.gauge_.ownerSVGElement.getBoundingClientRect();
  this.dropdowndx = bBox.left;
  this.dropdowndy = bBox.top;

  this.textLeft = (Blockly.FieldAngleLimited.HALF - 30);
  this.textTop = (Blockly.FieldAngleLimited.HALF * 2);

  this.textButton = Blockly.utils.createSvgElement('g', {}, svg);

  Blockly.utils.createSvgElement('rect', {
    'rx': Blockly.BlockSvg.NUMBER_FIELD_CORNER_RADIUS,
    'ry': Blockly.BlockSvg.NUMBER_FIELD_CORNER_RADIUS,
    'x': this.textLeft,
    'y': this.textTop,
    'width': '60px',
    'height': (Blockly.FieldAngleLimited.BUTTON_HEIGHT) + 'px',
    'fill': '#FFFFFF',
    'stroke': '#C6C6C6',
    'stroke-width': '1px',
    'cursor': 'text'
  }, this.textButton);

  this.textView = Blockly.utils.createSvgElement('text',
    {
      'x': this.textLeft + 60 / 2,
      'y': this.textTop + 1 + Blockly.FieldAngleLimited.BUTTON_HEIGHT / 2,
      'fill': '#000',
      'font-family': '"Helvetica Neue", Helvetica, sans-serif',
      'font-size': '12pt',
      'font-weight': '500',
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      'transform': 'scale(1)',
      'cursor': 'text'
    }, this.textButton);

  this.mouseEnterWrappers_[2] = Blockly.bindEvent_(this.textButton, 'mouseenter',
    this, function () {this.textButton.querySelector('rect').setAttribute('stroke', '#4B96FF');});
  this.mouseLeaveWrappers_[2] = Blockly.bindEvent_(this.textButton, 'mouseleave',
    this, function () {this.textButton.querySelector('rect').setAttribute('stroke', '#C6C6C6');});
  this.mouseDownWrappers_[2] = Blockly.bindEvent_(this.textButton, 'mousedown', this, this.onMouseTextDown);

  this.mouseDownWrappers_[4] = Blockly.bindEvent_(this.textButton, 'mouseup', this, function () {
    if (this.mouseTextDown_) {
      var textDiv = Blockly.WidgetDiv.DIV;
      textDiv.appendChild(this.htmlInput);

      this.unbindEvents_(this.htmlInput);
      this.inputBindEvents_(this.htmlInput);
      this.htmlInput.select();

      this.resizeTextEditor_();
      textDiv.style.boxShadow = '0px 0px 0px 4px ' + 'rgba(75,150,255,0.3)';//Blockly.Colours.fieldShadow;
    }
  });
  this.updateGraph_();
};

Blockly.FieldAngleLimited.prototype.inputBindEvents_ = function (htmlInput, bindGlobalKeypress) {
  htmlInput.onKeyDownWrapper_ = Blockly.bindEventWithChecks_(htmlInput, 'keydown', this, this.onHtmlInputKeyDown_);
  htmlInput.onKeyUpWrapper_ = Blockly.bindEventWithChecks_(htmlInput, 'keyup', this, this.onInputChange_);
  htmlInput.onKeyPressWrapper_ = Blockly.bindEventWithChecks_(htmlInput, 'keypress', this, this.onInputChange_);

  htmlInput.onInputWrapper_ = Blockly.bindEvent_(htmlInput, 'input', this, this.onInputChange_);
  htmlInput.onWorkspaceChangeWrapper_ = this.resizeTextEditor_.bind(this);
  this.workspace_.addChangeListener(htmlInput.onWorkspaceChangeWrapper_);

  if (bindGlobalKeypress) {
    htmlInput.onDocumentKeyDownWrapper_ = Blockly.bindEventWithChecks_(document, 'keydown', this, this.onDocumentKeyDown_);
  }
};

Blockly.FieldAngleLimited.prototype.onInputChange_ = function (e) {
  if (e.type === 'keypress' && this.restrictor_) {
    var keyCode;
    var isWhitelisted = false;
    if (goog.userAgent.GECKO) {
      keyCode = e.charCode;
      if (keyCode < 32 || keyCode == 127) {
        isWhitelisted = true;
      } else if (e.metaKey || e.ctrlKey) {
        isWhitelisted = Blockly.FieldTextInput.GECKO_KEYCODE_WHITELIST.indexOf(keyCode) > -1;
      }
    } else {
      keyCode = e.keyCode;
    }
    var char = String.fromCharCode(keyCode);
    if (!isWhitelisted && !this.restrictor_.test(char) && e.preventDefault) {
      e.preventDefault();
      return;
    }
  }
  else if (e.type === 'input' && this.restrictor_) {
    var char = e.data;
    if (e.inputType === 'insertFromPaste' || e.inputType === 'insertCompositionText') {
      var string = Blockly.FieldTextInput.htmlInput_.value;
      var result = this.restrictor_.exec(string);
      var resultString = '';
      while (result !== null) {
        resultString += result[0];
        string = string.slice(result.index + 1);
        result = this.restrictor_.exec(string);
      }
      Blockly.FieldTextInput.htmlInput_.value = resultString
    }
  }
  var htmlInput = this.htmlInput;
  var text = htmlInput.value;
  if (text !== htmlInput.oldValue_) {
    this.setValue(text);
    this.validate_();
    htmlInput.oldValue_ = text;
  } else if (goog.userAgent.WEBKIT) {
    this.sourceBlock_.render();
  }
  this.resizeTextEditor_();
};

Blockly.FieldAngleLimited.prototype.onHtmlInputKeyDown_ = function (e) {
  var tabKey = 9, enterKey = 13, escKey = 27;
  var htmlInput = this.htmlInput;
  if (e.keyCode == enterKey) {
    this.textEditordipose_();
    Blockly.WidgetDiv.hide();
    Blockly.DropDownDiv.hideWithoutAnimation();
  } else if (e.keyCode == escKey) {
    htmlInput.value = htmlInput.defaultValue;
    this.textEditordipose_();
    Blockly.WidgetDiv.hide();
    Blockly.DropDownDiv.hideWithoutAnimation();
  } else if (e.keyCode == tabKey) {
    this.textEditordipose_();
    Blockly.WidgetDiv.hide();
    Blockly.DropDownDiv.hideWithoutAnimation();
    this.sourceBlock_.tab(this, !e.shiftKey);
    e.preventDefault();
  }
};

Blockly.FieldAngleLimited.prototype.inputUnbindEvents_ = function (htmlInput) {
  if (htmlInput.onKeyDownWrapper_) Blockly.unbindEvent_(htmlInput.onKeyDownWrapper_);
  if (htmlInput.onKeyUpWrapper_) Blockly.unbindEvent_(htmlInput.onKeyUpWrapper_);
  if (htmlInput.onKeyPressWrapper_) Blockly.unbindEvent_(htmlInput.onKeyPressWrapper_);

  if (htmlInput.onInputWrapper_) Blockly.unbindEvent_(htmlInput.onInputWrapper_);
  this.workspace_.removeChangeListener(htmlInput.onWorkspaceChangeWrapper_);

  if (htmlInput.onDocumentKeyDownWrapper_) {
    Blockly.unbindEvent_(htmlInput.onDocumentKeyDownWrapper_);
  }
}

Blockly.FieldAngleLimited.prototype.resizeTextEditor_ = function () {
  var div = Blockly.WidgetDiv.DIV;
  div.style.width = (60) + 'px';
  div.style.height = (Blockly.FieldSpeed.BUTTON_HEIGHT) + 'px';
  div.style.borderRadius = Blockly.BlockSvg.NUMBER_FIELD_CORNER_RADIUS + 'px';
  div.style.borderColor = '#4B96FF';
  div.style.transform = 'scale(1)';

  var bBox = {width: this.sourceBlock_.width, height: this.sourceBlock_.height};
  var position = this.sourceBlock_.getSvgRoot().getBoundingClientRect();
  var primaryX = position.left + bBox.width / 2;
  var primaryY = position.top + bBox.height;
  var secondaryX = primaryX;
  var secondaryY = position.top;

  var metrics = Blockly.DropDownDiv.getPositionMetrics(primaryX, primaryY, secondaryX, secondaryY);

  div.style.left = (this.dropdowndx + this.textLeft) + 'px';
  metrics.arrowAtTop ? div.style.top = (this.dropdowndy + this.textTop + 20) + 'px' : div.style.top = (this.dropdowndy + this.textTop - 20) + 'px'
};

Blockly.FieldAngleLimited.prototype.textEditordipose_ = function () {
  var div = Blockly.WidgetDiv.DIV;

  this.inputUnbindEvents_(this.htmlInput);
  this.bindEvents_(this.htmlInput);

  div.style.boxShadow = '0px 0px 0px 4px ' + Blockly.Colours.fieldShadow;
  this.resizeEditor_();
}

//버튼 생성기
Blockly.FieldAngleLimited.prototype.addButton_ = function (buttonGroup, buttonSVGarray) {
  var x, y, width, height;

  //버튼 그리기 3개 그리기
  for (var num = 1; num <= 3; num += 2) {
    x = (-Blockly.FieldAngleLimited.BUTTON_WIDTH / 2);
    y = (-Blockly.FieldAngleLimited.BUTTON_HEIGHT / 2);
    width = Blockly.FieldAngleLimited.BUTTON_WIDTH;
    height = Blockly.FieldAngleLimited.BUTTON_HEIGHT;

    //버튼 path 불러오기
    var attr = {
      'd': this.getButtonKeyPath_(x, y, width, height),
      'fill': "#FFFFFF",
      'fill-opacity': "0",
      'cursor': 'pointer'
    };

    //버튼 공간 및 그리기
    var button = Blockly.utils.createSvgElement('g', {}, buttonGroup);
    Blockly.utils.createSvgElement('path', attr, button);

    //이미지 넣을 공간 확보
    this.iconSvg_ = Blockly.utils.createSvgElement('image',
      {
        'width': Blockly.FieldAngleLimited.ICON_WIDTH,
        'height': Blockly.FieldAngleLimited.ICON_HEIGHT,
        'x': -Blockly.FieldAngleLimited.ICON_WIDTH / 2,
        'y': -Blockly.FieldAngleLimited.ICON_HEIGHT / 2,
        'cursor': 'pointer'
      }, button);

    // 버튼 위치
    x = Blockly.FieldAngleLimited.BUTTON_WIDTH * (num - 2) + (Blockly.FieldAngleLimited.BUTTON_MARGIN * 3) * (num - 2) + Blockly.FieldAngleLimited.HALF;
    y = Blockly.FieldAngleLimited.HALF * 2 + Blockly.FieldAngleLimited.BUTTON_HEIGHT / 2;
    button.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    if (buttonSVGarray) {
      buttonSVGarray[num] = button;
      button.setAttribute('button-option', Blockly.FieldAngleLimited.BUTTON_INFO[num].option);
      button.setAttribute('button-name', Blockly.FieldAngleLimited.BUTTON_INFO[num].name);

      if (num == 1) {
        this.mouseHoverWrappers_[1] = Blockly.bindEvent_(button, 'mouseenter', this, this.mouseMinusHover);
        this.mouseLeaveWrappers_[1] = Blockly.bindEvent_(button, 'mouseleave', this, this.mouseMinusLeave);
      }
      if (num == 3) {
        this.mouseHoverWrappers_[3] = Blockly.bindEvent_(button, 'mouseenter', this, this.mousePlusHover);
        this.mouseLeaveWrappers_[3] = Blockly.bindEvent_(button, 'mouseleave', this, this.mousePlusLeave);
      }
      this.mouseDownWrappers_[num] = Blockly.bindEvent_(button, 'mousedown', this, this.onMouseButtonDown);
      this.mouseEnterWrappers_[num] = Blockly.bindEvent_(button, 'mouseenter', this, this.onMouseEnter_);
    }
  }
};

Blockly.FieldAngleLimited.prototype.mouseMinusHover = function () {
  this.buttonInserter_(1, false, true);
};

Blockly.FieldAngleLimited.prototype.mousePlusHover = function () {
  this.buttonInserter_(3, true, true);
};

Blockly.FieldAngleLimited.prototype.mouseMinusLeave = function () {
  this.buttonInserter_(1, false, false);
};

Blockly.FieldAngleLimited.prototype.mousePlusLeave = function () {
  this.buttonInserter_(3, true, false);
};

Blockly.FieldAngleLimited.prototype.onMouseTextDown = function () {
  this.mouseTextDown_ = true;
  this.mouseUpWrapper_ = Blockly.bindEvent_(document.body, 'mouseup', this, this.onMouseTextUp);
};

Blockly.FieldAngleLimited.prototype.onMouseButtonDown = function (e) {
  this.textEditordipose_();
  this.mouseIsDown_ = true;
  this.mouseUpWrapper_ = Blockly.bindEvent_(document.body, 'mouseup', this, this.onMouseButtonUp);
  this.selectKeyWithMouseEvent_(e);
};

Blockly.FieldAngleLimited.prototype.onMouseHandleDown = function (e) {
  if ((e instanceof MouseEvent && e.button !== 0) || (e instanceof TouchEvent && (e.type !== "touchmove" && e.type !== "touchstart"))) return;  // rogic-mobile
  this.textEditordipose_();
  this.mouseIsDown_ = true;
  this.mouseMoveWrapper_ = Blockly.bindEvent_(document.body, 'mousemove', this, this.onMouseMove);
  this.mouseUpWrapper_ = Blockly.bindEvent_(document.body, 'mouseup', this, this.onMouseHandleUp);
  this.selectKeyWithMouseEvent_(e);
  this.touchMoveWrapper_ = Blockly.bindEvent_(document.body, 'touchmove', this, this.onTouchMove);  // rogic-mobile
};

Blockly.FieldAngleLimited.prototype.onMouseTextUp = function (e) {
  this.mouseTextDown_ = false;
  Blockly.unbindEvent_(this.mouseUpWrapper_);
};

Blockly.FieldAngleLimited.prototype.onMouseHandleUp = function () {
  //this.textEditordipose_();
  this.mouseIsDown_ = false;
  Blockly.unbindEvent_(this.mouseMoveWrapper_);
  Blockly.unbindEvent_(this.mouseUpWrapper_);
};

Blockly.FieldAngleLimited.prototype.onMouseButtonUp = function () {
  this.mouseIsDown_ = false;
  Blockly.unbindEvent_(this.mouseUpWrapper_);
  if (this.buttonNum == 1) {
    this.buttonClickEvent_(this.buttonNum, this.mouseIsDown_);
  }
  else if (this.buttonNum == 3) {
    this.buttonClickEvent_(this.buttonNum, this.mouseIsDown_);
  }
  else if (this.buttonNum == 4) {
    this.buttonClickEvent_(this.buttonNum, this.mouseIsDown_);
  }
};

Blockly.FieldAngleLimited.prototype.onMouseEnter_ = function (e) {
  if (this.mouseIsDown_) {
    this.selectKeyWithMouseEvent_(e);
  }
};

Blockly.FieldAngleLimited.prototype.selectKeyWithMouseEvent_ = function (e) {
  this.buttonNum = Number(e.target.parentElement.getAttribute('button-option'));

  if (this.buttonNum == 1) {
    var angle = Number(this.getText()) - 1;
    if (angle < -120) angle = -120;
    this.setValue(angle);
    Blockly.FieldTextInput.htmlInput_.value = angle;
    this.updateGraph_();

    this.buttonClickEvent_(this.buttonNum, this.mouseIsDown_);
  }
  else if (this.buttonNum == 3) {
    var angle = Number(this.getText()) + 1;
    if (angle > 120) angle = 120;
    this.setValue(angle);
    Blockly.FieldTextInput.htmlInput_.value = angle;
    this.updateGraph_();

    this.buttonClickEvent_(this.buttonNum, this.mouseIsDown_);
  }
  else if (this.buttonNum == 4) {
    this.buttonClickEvent_(this.buttonNum, this.mouseIsDown_);
  }
};


Blockly.FieldAngleLimited.prototype.buttonClickEvent_ = function (num, click) {
  if (click) {
    this.buttonSVGs_[num].querySelector('image').setAttribute('width', Blockly.FieldAngleLimited.ICON_WIDTH + Blockly.FieldAngleLimited.SELECTED_SIZE);
    this.buttonSVGs_[num].querySelector('image').setAttribute('height', Blockly.FieldAngleLimited.ICON_HEIGHT + Blockly.FieldAngleLimited.SELECTED_SIZE);
    this.buttonSVGs_[num].querySelector('image').setAttribute('x', -(Blockly.FieldAngleLimited.ICON_WIDTH + Blockly.FieldAngleLimited.SELECTED_SIZE) / 2);
    this.buttonSVGs_[num].querySelector('image').setAttribute('y', -(Blockly.FieldAngleLimited.ICON_HEIGHT + Blockly.FieldAngleLimited.SELECTED_SIZE) / 2);
  }
  else {
    this.buttonSVGs_[num].querySelector('image').setAttribute('width', Blockly.FieldAngleLimited.ICON_WIDTH);
    this.buttonSVGs_[num].querySelector('image').setAttribute('height', Blockly.FieldAngleLimited.ICON_HEIGHT);
    this.buttonSVGs_[num].querySelector('image').setAttribute('x', -Blockly.FieldAngleLimited.ICON_WIDTH / 2);
    this.buttonSVGs_[num].querySelector('image').setAttribute('y', -Blockly.FieldAngleLimited.ICON_HEIGHT / 2);
  }
};

Blockly.FieldAngleLimited.prototype.buttonInserter_ = function (num, plus, select) {
  var path;
  if (plus) {
    if (select) {
      path = Blockly.FieldAngleLimited.SELECTED_PLUS_PATH;
    }
    else {
      path = Blockly.FieldAngleLimited.PLUS_PATH;
    }
  }
  else {
    if (select) {
      path = Blockly.FieldAngleLimited.SELECTED_MINUS_PATH;
    }
    else {
      path = Blockly.FieldAngleLimited.MINUS_PATH;
    }
  }

  this.buttonSVGs_[num].querySelector('image').setAttributeNS(
    'http://www.w3.org/1999/xlink',
    'xlink:href',
    Blockly.mainWorkspace.options.pathToMedia + path
  );
};

/**
 * Set the angle to match the mouse's position.
 * @param {!Event} e Mouse move event.
 */
Blockly.FieldAngleLimited.prototype.onMouseMove = function (e) {  // rogic-mobile
  this.calculateAngleAndSetValue(e, e.clientX, e.clientY);
};

Blockly.FieldAngleLimited.prototype.onTouchMove = function (e) {  // rogic-mobile
  this.calculateAngleAndSetValue(e, e.touches[0].clientX, e.touches[0].clientY);
};

Blockly.FieldAngleLimited.prototype.calculateAngleAndSetValue = function (e, clientX, clientY) {  // rogic-mobile
  e.preventDefault();
  var bBox = this.gauge_.ownerSVGElement.getBoundingClientRect();
  var dx = clientX - bBox.left - Blockly.FieldSpeed.HALF;
  var dy = clientY - bBox.top - Blockly.FieldSpeed.HALF;
  var angle = Math.atan(-dy / dx);
  if (isNaN(angle)) {
    return;
  }
  angle = goog.math.toDegrees(angle);
  if (dx < 0) {
    angle += 180;
  } else if (dy > 0) {
    angle += 360;
  }

  if (Blockly.FieldAngleLimited.CLOCKWISE) {
    angle = Blockly.FieldAngleLimited.OFFSET + 360 - angle;
  } else {
    angle -= Blockly.FieldAngleLimited.OFFSET;
  }

  if (Blockly.FieldAngleLimited.ROUND) {
    angle = Math.round(angle / Blockly.FieldAngleLimited.ROUND) * Blockly.FieldAngleLimited.ROUND;
  }
  angle = this.callValidator(angle);

  angle = angle % 360;
  Blockly.FieldTextInput.htmlInput_.value = angle;
  this.setValue(angle);
  this.validate_();
  this.resizeEditor_();
};

/**
 * Insert a degree symbol.
 * @param {?string} text New text.
 */
Blockly.FieldAngleLimited.prototype.setText = function (text) {
  Blockly.FieldAngleLimited.superClass_.setText.call(this, text);
  if (!this.textElement_) {
    // Not rendered yet.
    return;
  }
  this.updateGraph_();
  // Cached width is obsolete.  Clear it.
  this.size_.width = 0;
};

Blockly.FieldAngleLimited.prototype.setValue = function (newValue) {
  if (newValue === null) {
    // No change if null.
    return;
  }
  var oldValue = this.getValue();
  if (oldValue == newValue) {
    return;
  }
  if (this.sourceBlock_ && Blockly.Events.isEnabled()) {
    Blockly.Events.fire(new Blockly.Events.BlockChange(this.sourceBlock_, 'field', this.name, oldValue, newValue));
    if (this.isRealtime) {
      Blockly.Events.fire(new Blockly.Events.BlockChange(this.sourceBlock_.getParent(), 'realtime', this.name, null, null));
    }
  }
  this.setText(newValue);
};

/**
 * Redraw the graph with the current angle.
 * @private
 */
Blockly.FieldAngleLimited.prototype.updateGraph_ = function () {
  if (!this.gauge_) {
    return;
  }

  var angleDegrees = Number(this.getText());
  if (angleDegrees > 120) {
    angleDegrees = 120;
    this.setValue(angleDegrees);
    Blockly.FieldTextInput.htmlInput_.value = angleDegrees;
  }
  else if (angleDegrees < -120) {
    angleDegrees = -120;
    this.setValue(angleDegrees);
    Blockly.FieldTextInput.htmlInput_.value = angleDegrees;
  }

  var angleDegrees = Number(this.getText()) % 360 + Blockly.FieldAngleLimited.OFFSET;

  if (330 <= angleDegrees || 210 >= angleDegrees) {
    //var radius = Blockly.FieldAngleLimited.RADIUS + Blockly.FieldAngleLimited.RADIUS / 10;
    var angleRadians = goog.math.toRadians(angleDegrees);
    var path = ['M ', Blockly.FieldAngleLimited.HALF, ',', Blockly.FieldAngleLimited.HALF];
    var x2 = Blockly.FieldAngleLimited.HALF;
    var y2 = Blockly.FieldAngleLimited.HALF;

    if (!isNaN(angleRadians)) {
      var angle1 = goog.math.toRadians(Blockly.FieldAngleLimited.OFFSET);
      var x1 = Math.cos(angle1) * Blockly.FieldAngleLimited.RADIUS;
      var y1 = Math.sin(angle1) * -Blockly.FieldAngleLimited.RADIUS;
      if (Blockly.FieldAngleLimited.CLOCKWISE) {
        angleRadians = 2 * angle1 - angleRadians;
      }
      x2 += Math.cos(angleRadians) * Blockly.FieldAngleLimited.RADIUS;
      y2 -= Math.sin(angleRadians) * Blockly.FieldAngleLimited.RADIUS;
      // Use large arc only if input value is greater than wrap
      var largeFlag = Math.abs(angleDegrees - Blockly.FieldAngleLimited.OFFSET) > 180 ? 1 : 0;
      var sweepFlag = Number(Blockly.FieldAngleLimited.CLOCKWISE);
      if (angleDegrees < Blockly.FieldAngleLimited.OFFSET) {
        sweepFlag = 1 - sweepFlag; // Sweep opposite direction if less than the offset
      }
      path.push(' l ', x1, ',', y1,
        ' A ', Blockly.FieldAngleLimited.RADIUS, ',', Blockly.FieldAngleLimited.RADIUS,
        ' 0 ', largeFlag, ' ', sweepFlag, ' ', x2, ',', y2, ' z');

      // Image rotation needs to be set in degrees
      if (Blockly.FieldAngleLimited.CLOCKWISE) {
        var imageRotation = angleDegrees + 2 * Blockly.FieldAngleLimited.OFFSET;
      } else {
        var imageRotation = -angleDegrees;
      }
      this.arrowSvg_.setAttribute('transform', 'rotate(' + (imageRotation) + ')');
    }
    this.gauge_.setAttribute('d', path.join(''));
    this.handle_.setAttribute('transform', 'translate(' + x2 + ',' + y2 + ')');
  }

  this.textView.textContent = this.getText();
};

Blockly.FieldAngleLimited.prototype.rowGuage_ = function () {
  if (!this.gauge_) {
    return;
  }
  var angleDegrees = Number(240) % 360 + 210; // Guage 범위 설정
  var angleRadians = goog.math.toRadians(angleDegrees);
  var path = ['M ', Blockly.FieldAngleLimited.HALF, ',', Blockly.FieldAngleLimited.HALF];
  var x2 = Blockly.FieldAngleLimited.HALF;
  var y2 = Blockly.FieldAngleLimited.HALF;

  if (!isNaN(angleRadians)) {
    var angle1 = goog.math.toRadians(210);
    var x1 = Math.cos(angle1) * Blockly.FieldAngleLimited.RADIUS;
    var y1 = Math.sin(angle1) * -Blockly.FieldAngleLimited.RADIUS;
    if (Blockly.FieldAngleLimited.CLOCKWISE) {
      angleRadians = 2 * angle1 - angleRadians;
    }
    x2 += Math.cos(angleRadians) * Blockly.FieldAngleLimited.RADIUS;
    y2 -= Math.sin(angleRadians) * Blockly.FieldAngleLimited.RADIUS;
    // Use large arc only if input value is greater than wrap
    var largeFlag = Math.abs(angleDegrees - 210) > 180 ? 1 : 0;
    var sweepFlag = Number(Blockly.FieldAngleLimited.CLOCKWISE);
    if (angleDegrees < 210) {
      sweepFlag = 1 - sweepFlag; // Sweep opposite direction if less than the offset
    }
    path.push(' l ', x1, ',', y1,
      ' A ', Blockly.FieldAngleLimited.RADIUS, ',', Blockly.FieldAngleLimited.RADIUS,
      ' 0 ', largeFlag, ' ', sweepFlag, ' ', x2, ',', y2, ' z');
  }
  this.rowGauge_.setAttribute('d', path.join(''));
};


/**
 * Ensure that only an angle may be entered.
 * @param {string} text The user's text.
 * @return {?string} A string representing a valid angle, or null if invalid.
 */
Blockly.FieldAngleLimited.prototype.classValidator = function (text) {
  if (text === null) {
    return null;
  }
  var n = parseFloat(text || 0);
  if (isNaN(n)) {
    return null;
  }
  n = n % 360;
  if (n < 0) {
    n += 360;
  }
  if (n > Blockly.FieldAngleLimited.WRAP) {
    n -= 360;
  }
  if (n > 120) {
    return String(120);
  } else if (n < -120) {
    return String(-120);
  }
  return String(n);
};

Blockly.Field.register('field_angle_limited', Blockly.FieldAngleLimited);
