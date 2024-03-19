
'use strict';

goog.provide('Blockly.FieldSpeed');

goog.require('Blockly.DropDownDiv');
goog.require('Blockly.FieldTextInput');

goog.require('goog.math');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
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
Blockly.FieldSpeed = function (opt_value, opt_validator) {
  // Add degree symbol: '360°' (LTR) or '°360' (RTL)
  this.symbol_ = Blockly.utils.createSvgElement('tspan', {}, null);
  this.symbol_.appendChild(document.createTextNode('\u00B0'));

  var numRestrictor = new RegExp("[\\d]");

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
  this.mouseTextDown_ = false;

  this.mouseEnterWrappers_ = [];
  this.mouseDownWrappers_ = [];
  this.mouseHoverWrappers_ = [];
  this.mouseLeaveWrappers_ = [];

  this.mouseUpWrapper_ = null;
  this.mouseMoveWrapper_ = null;
  this.touchMoveWrapper_ = null; // rogic-mobile

  opt_value = (opt_value && !isNaN(opt_value)) ? String(opt_value) : '0';
  Blockly.FieldSpeed.superClass_.constructor.call(this, opt_value, opt_validator, numRestrictor);
  this.addArgType('speed');
};

goog.inherits(Blockly.FieldSpeed, Blockly.FieldTextInput);

/**
 * Construct a FieldSpeed from a JSON arg object.
 * @param {!Object} options A JSON object with options (angle).
 * @returns {!Blockly.FieldSpeed} The new field instance.
 * @package
 * @nocollapse
 */
Blockly.FieldSpeed.fromJson = function (options) {
  return new Blockly.FieldSpeed(options['speed']);
};

Blockly.FieldSpeed.ROUND = 15;
Blockly.FieldSpeed.HALF = 180 / 2;
Blockly.FieldSpeed.CLOCKWISE = true;
Blockly.FieldSpeed.OFFSET = 202.5;
Blockly.FieldSpeed.WRAP = 180;
Blockly.FieldSpeed.HANDLE_RADIUS = Blockly.FieldSpeed.HALF / 6;
Blockly.FieldSpeed.HANDLE_GLOW_WIDTH = 3;
Blockly.FieldSpeed.RADIUS = Blockly.FieldSpeed.HALF - Blockly.FieldSpeed.HANDLE_RADIUS - Blockly.FieldSpeed.HANDLE_GLOW_WIDTH;
Blockly.FieldSpeed.CENTER_RADIUS = 2;
Blockly.FieldSpeed.GAUGE_RANGE = Blockly.FieldSpeed.RADIUS - (Blockly.FieldSpeed.RADIUS * (1 / 1.618));

// 버튼 크기
Blockly.FieldSpeed.BUTTON_HEIGHT = 30;
Blockly.FieldSpeed.BUTTON_WIDTH = Blockly.FieldSpeed.BUTTON_HEIGHT;
//버튼 곡선
Blockly.FieldSpeed.BUTTON_RADIUS = Blockly.FieldSpeed.BUTTON_HEIGHT / 3;
//버튼 사이 마진
Blockly.FieldSpeed.BUTTON_MARGIN = Blockly.FieldSpeed.BUTTON_HEIGHT / 3;
//버튼 색상
Blockly.FieldSpeed.FILL = '#8F8F8F';
Blockly.FieldSpeed.SELECTED_FILL = '#4B96FF';

//핀크기
Blockly.FieldSpeed.PIN_HEIGHT = 50;
Blockly.FieldSpeed.PIN_WIDTH = 10;

//버튼 안 모양 사진
Blockly.FieldSpeed.ARROW_SVG_PATH = 'icons/speed_pin.svg';
Blockly.FieldSpeed.PLUS_PATH = 'icons/plus.svg';
Blockly.FieldSpeed.SELECTED_PLUS_PATH = 'icons/plus_blue.svg';
Blockly.FieldSpeed.MINUS_PATH = 'icons/minus.svg';
Blockly.FieldSpeed.SELECTED_MINUS_PATH = 'icons/minus_blue.svg';;
Blockly.FieldSpeed.SELECTED_SIZE = 3;

//사진 크기
Blockly.FieldSpeed.ICON_WIDTH = Blockly.FieldSpeed.BUTTON_HEIGHT / 6 * 5;
Blockly.FieldSpeed.ICON_HEIGHT = Blockly.FieldSpeed.ICON_WIDTH;

Blockly.FieldSpeed.BUTTON_INFO = [
  {name: 'handle', option: 0},
  {name: '+', option: 1},
  {name: '[]', option: 2},
  {name: '-', option: 3}
];

//버튼 모양 path
Blockly.FieldSpeed.prototype.getButtonKeyPath_ = function (x, y, width, height) {
  return 'M' + x + ' ' + (y + Blockly.FieldSpeed.BUTTON_RADIUS) + ' ' +
    'L' + x + ' ' + (y + height - Blockly.FieldSpeed.BUTTON_RADIUS) + ' ' +
    'Q' + x + ' ' + (y + height) + ' ' +
    (x + Blockly.FieldSpeed.BUTTON_RADIUS) + ' ' + (y + height) + ' ' +
    'L' + (x + width - Blockly.FieldSpeed.BUTTON_RADIUS) + ' ' + (y + height) + ' ' +
    'Q' + (x + width) + ' ' + (y + height) + ' ' +
    (x + width) + ' ' + (y + height - Blockly.FieldSpeed.BUTTON_RADIUS) + ' ' +
    'L' + (x + width) + ' ' + (y + Blockly.FieldSpeed.BUTTON_RADIUS) + ' ' +
    'Q' + (x + width) + ' ' + y + ' ' +
    (x + width - Blockly.FieldSpeed.BUTTON_RADIUS) + ' ' + y + ' ' +
    'L' + (x + Blockly.FieldSpeed.BUTTON_RADIUS) + ' ' + y + ' ' +
    'Q' + x + ' ' + y + ' ' +
    x + ' ' + (y + Blockly.FieldSpeed.BUTTON_RADIUS) + ' ';
};

Blockly.FieldSpeed.prototype.widgetDispose_ = function () {
  var thisField = this;
  return function () {
    Blockly.FieldSpeed.superClass_.widgetDispose_.call(thisField);
    thisField.unbindEvents_(thisField.htmlInput);
    thisField.gauge_ = null;
    if (thisField.mouseUpWrapper_) {
      Blockly.unbindEvent_(thisField.mouseUpWrapper_);
    }
    if (thisField.mouseMoveWrapper_) {
      Blockly.unbindEvent_(thisField.mouseMoveWrapper_);
    }
    if (thisField.touchMoveWrapper_) {  // rogic-mobile
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

Blockly.FieldSpeed.prototype.showEditor_ = function () {
  // Mobile browsers have issues with in-line textareas (focus & keyboards).
  Blockly.FieldSpeed.superClass_.showEditor_.call(this, this.useTouchInteraction_);
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
    'height': (Blockly.FieldSpeed.HALF + Blockly.FieldSpeed.RADIUS - Blockly.FieldSpeed.GAUGE_RANGE + Blockly.FieldSpeed.BUTTON_HEIGHT + Blockly.FieldSpeed.BUTTON_MARGIN * 2) + 'px',
    'width': (Blockly.FieldSpeed.HALF * 2) + 'px'
  }, div);

  this.gauge_ = Blockly.utils.createSvgElement('path', {}, svg);

  var first = 22.5;
  var amount = 5;
  var range = 225 / amount;
  var start = first
  for (var i = 0; i < amount; i++) {
    var color;
    switch (i) {
      case 0:
        color = "#EE3B50";
        break;
      case 1:
        color = "#F9A161";
        break;
      case 2:
        color = "#FEC55E";
        break;
      case 3:
        color = "#A1C45E";
        break;
      case 4:
        color = "#6BBF67";
        break;
    }
    this.drawGauge(start, start + range + 1, svg, color);
    start += range
  }

  var centerCircleR = (Blockly.FieldSpeed.RADIUS - Blockly.FieldSpeed.GAUGE_RANGE);
  //원 그리는
  Blockly.utils.createSvgElement('circle', {
    'cx': Blockly.FieldSpeed.HALF, 'cy': Blockly.FieldSpeed.HALF,
    'r': centerCircleR,
    'fill': '#FFFFFF'
  }, svg);

  // Handle group: a circle and the arrow image
  this.handle_ = Blockly.utils.createSvgElement('g', {}, svg);
  Blockly.utils.createSvgElement('rect', {
    'x': - Blockly.FieldSpeed.PIN_WIDTH / 2,
    'y': -centerCircleR,
    'width': Blockly.FieldSpeed.PIN_WIDTH,
    'height': centerCircleR * 2,
    'fill-opacity': "0"
  }, this.handle_);

  this.arrowSvg_ = Blockly.utils.createSvgElement('g', {}, this.handle_);

  Blockly.utils.createSvgElement('rect', {
    'x': - Blockly.FieldSpeed.PIN_WIDTH * 1.5,
    'y': -centerCircleR,
    'width': Blockly.FieldSpeed.PIN_WIDTH * 3,
    'height': centerCircleR,
    'fill-opacity': "0",
    'cursor': 'pointer'
  }, this.arrowSvg_);

  var image = Blockly.utils.createSvgElement('image',
    {
      'width': Blockly.FieldSpeed.PIN_WIDTH,
      'height': Blockly.FieldSpeed.PIN_HEIGHT,
      'x': -Blockly.FieldSpeed.PIN_WIDTH / 2,
      'y': -centerCircleR,
      'class': 'blocklySpeedDragArrow'
    },
    this.arrowSvg_);

  image.setAttributeNS(
    'http://www.w3.org/1999/xlink',
    'xlink:href',
    Blockly.mainWorkspace.options.pathToMedia + Blockly.FieldSpeed.ARROW_SVG_PATH
  );

  this.handle_.setAttribute('transform', 'translate(' + Blockly.FieldSpeed.HALF + ',' + Blockly.FieldSpeed.HALF + ')');

  // Center point
  Blockly.utils.createSvgElement('circle', {
    'cx': Blockly.FieldSpeed.HALF, 'cy': Blockly.FieldSpeed.HALF,
    'r': Blockly.FieldSpeed.CENTER_RADIUS,
    'class': 'blocklySpeedCenterPoint'
  }, svg);


  Blockly.DropDownDiv.setColour('#ffffff', '#dddddd');

  Blockly.DropDownDiv.setCategory(this.sourceBlock_.parentBlock_.getCategory());
  Blockly.DropDownDiv.showPositionedByBlock(this, this.sourceBlock_);

  this.buttonSVGs_[0] = this.arrowSvg_;
  this.mouseDownWrappers_[0] = Blockly.bindEvent_(this.arrowSvg_, 'mousedown', this, this.onMouseHandleDown);

  //빈 버튼 그룹 선언
  var buttonGroup = Blockly.utils.createSvgElement('g', {}, svg);
  //update에서 사용하 기위한 초기화
  this.buttonSVGs_ = [];
  //버튼 그룹에 각 버튼을 그려서 저장시킴
  this.addButton_(buttonGroup, this.buttonSVGs_);

  this.arrowSvg_.setAttribute('button-option', Blockly.FieldSpeed.BUTTON_INFO[0].option);
  this.arrowSvg_.setAttribute('button-name', Blockly.FieldSpeed.BUTTON_INFO[0].name);

  this.buttonInserter_(1, false, false);
  this.buttonInserter_(3, true, false);

  this.htmlInput = Blockly.FieldTextInput.htmlInput_;

  var bBox = this.gauge_.ownerSVGElement.getBoundingClientRect();
  this.dropdowndx = bBox.left;
  this.dropdowndy = bBox.top;

  this.textLeft = (Blockly.FieldSpeed.HALF - 30);
  this.textTop = (Blockly.FieldSpeed.HALF + Blockly.FieldSpeed.RADIUS - Blockly.FieldSpeed.GAUGE_RANGE +
    Blockly.FieldSpeed.BUTTON_HEIGHT / 2 + Blockly.FieldSpeed.BUTTON_MARGIN - Blockly.FieldSpeed.BUTTON_HEIGHT / 2);

  this.textButton = Blockly.utils.createSvgElement('g', {}, svg);

  Blockly.utils.createSvgElement('rect', {
    'rx': Blockly.BlockSvg.NUMBER_FIELD_CORNER_RADIUS,
    'ry': Blockly.BlockSvg.NUMBER_FIELD_CORNER_RADIUS,
    'x': this.textLeft,
    'y': this.textTop,
    'width': '60px',
    'height': (Blockly.FieldSpeed.BUTTON_HEIGHT) + 'px',
    'fill': '#FFFFFF',
    'stroke': '#C6C6C6',
    'stroke-width': '1px',
    'cursor': 'text'
  }, this.textButton);

  this.textView = Blockly.utils.createSvgElement('text',
    {
      'x': this.textLeft + 60 / 2,
      'y': this.textTop + 1 + Blockly.FieldSpeed.BUTTON_HEIGHT / 2,
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


Blockly.FieldSpeed.prototype.inputBindEvents_ = function (htmlInput, bindGlobalKeypress) {
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

Blockly.FieldSpeed.prototype.onInputChange_ = function (e) {
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
    htmlInput.oldValue_ = text;
    this.setText(text);
    this.validate_();
    this.setValue(this.text_);
  } else if (goog.userAgent.WEBKIT) {
    this.sourceBlock_.render();
  }
  this.resizeTextEditor_();
};

Blockly.FieldSpeed.prototype.onHtmlInputKeyDown_ = function (e) {
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

Blockly.FieldSpeed.prototype.inputUnbindEvents_ = function (htmlInput) {
  if (htmlInput.onKeyDownWrapper_) Blockly.unbindEvent_(htmlInput.onKeyDownWrapper_);
  if (htmlInput.onKeyUpWrapper_) Blockly.unbindEvent_(htmlInput.onKeyUpWrapper_);
  if (htmlInput.onKeyPressWrapper_) Blockly.unbindEvent_(htmlInput.onKeyPressWrapper_);

  if (htmlInput.onInputWrapper_) Blockly.unbindEvent_(htmlInput.onInputWrapper_);
  this.workspace_.removeChangeListener(htmlInput.onWorkspaceChangeWrapper_);

  if (htmlInput.onDocumentKeyDownWrapper_) {
    Blockly.unbindEvent_(htmlInput.onDocumentKeyDownWrapper_);
  }
}

Blockly.FieldSpeed.prototype.resizeTextEditor_ = function () {
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

Blockly.FieldSpeed.prototype.textEditordipose_ = function () {

  var div = Blockly.WidgetDiv.DIV;

  this.inputUnbindEvents_(this.htmlInput);
  this.bindEvents_(this.htmlInput);

  div.style.boxShadow = '0px 0px 0px 4px ' + Blockly.Colours.fieldShadow;
  this.resizeEditor_();
}

//버튼 생성기
Blockly.FieldSpeed.prototype.addButton_ = function (buttonGroup, buttonSVGarray) {
  var x, y, width, height;

  //버튼 그리기 3개 그리기
  for (var num = 1; num <= 3; num += 2) {
    x = (-Blockly.FieldSpeed.BUTTON_WIDTH / 2);
    y = (-Blockly.FieldSpeed.BUTTON_HEIGHT / 2);
    width = Blockly.FieldSpeed.BUTTON_WIDTH;
    height = Blockly.FieldSpeed.BUTTON_HEIGHT;

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
        'width': Blockly.FieldSpeed.ICON_WIDTH,
        'height': Blockly.FieldSpeed.ICON_HEIGHT,
        'x': -Blockly.FieldSpeed.ICON_WIDTH / 2,
        'y': -Blockly.FieldSpeed.ICON_HEIGHT / 2,
        'cursor': 'pointer'
      }, button);

    // 버튼 위치
    x = Blockly.FieldSpeed.BUTTON_WIDTH * (num - 2) + (Blockly.FieldSpeed.BUTTON_MARGIN * 3) * (num - 2) + Blockly.FieldSpeed.HALF;
    y = Blockly.FieldSpeed.HALF + Blockly.FieldSpeed.RADIUS - Blockly.FieldSpeed.GAUGE_RANGE + Blockly.FieldSpeed.BUTTON_HEIGHT / 2 + Blockly.FieldSpeed.BUTTON_MARGIN;
    button.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    if (buttonSVGarray) {
      buttonSVGarray[num] = button;
      button.setAttribute('button-option', Blockly.FieldSpeed.BUTTON_INFO[num].option);
      button.setAttribute('button-name', Blockly.FieldSpeed.BUTTON_INFO[num].name);

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

Blockly.FieldSpeed.prototype.mouseMinusHover = function () {
  this.buttonInserter_(1, false, true);
};

Blockly.FieldSpeed.prototype.mousePlusHover = function () {
  this.buttonInserter_(3, true, true);
};

Blockly.FieldSpeed.prototype.mouseMinusLeave = function () {
  this.buttonInserter_(1, false, false);
};

Blockly.FieldSpeed.prototype.mousePlusLeave = function () {
  this.buttonInserter_(3, true, false);
};

Blockly.FieldSpeed.prototype.onMouseButtonDown = function (e) {
  this.textEditordipose_();
  this.mouseIsDown_ = true;
  this.mouseUpWrapper_ = Blockly.bindEvent_(document.body, 'mouseup', this, this.onMouseButtonUp);
  this.selectKeyWithMouseEvent_(e);
};

Blockly.FieldSpeed.prototype.onMouseTextDown = function () {
  this.mouseTextDown_ = true;
  this.mouseUpWrapper_ = Blockly.bindEvent_(document.body, 'mouseup', this, this.onMouseTextUp);
};

Blockly.FieldSpeed.prototype.onMouseHandleDown = function (e) {
  if ((e instanceof MouseEvent && e.button !== 0) || (e instanceof TouchEvent && (e.type !== "touchmove" && e.type !== "touchstart"))) return;  // rogic-mobile
  this.textEditordipose_();
  this.mouseIsDown_ = true;
  this.mouseMoveWrapper_ = Blockly.bindEvent_(document.body, 'mousemove', this, this.onMouseMove);
  this.touchMoveWrapper_ = Blockly.bindEvent_(document.body, 'touchmove', this, this.onTouchMove);  // rogic-mobile
  this.mouseUpWrapper_ = Blockly.bindEvent_(document.body, 'mouseup', this, this.onMouseHandleUp);
  this.selectKeyWithMouseEvent_(e);
};

Blockly.FieldSpeed.prototype.onMouseHandleUp = function () {
  this.mouseIsDown_ = false;
  Blockly.unbindEvent_(this.mouseMoveWrapper_);
  Blockly.unbindEvent_(this.mouseUpWrapper_);
};

Blockly.FieldSpeed.prototype.onMouseTextUp = function (e) {
  this.mouseTextDown_ = false;
  Blockly.unbindEvent_(this.mouseUpWrapper_);
};

Blockly.FieldSpeed.prototype.onMouseButtonUp = function () {
  this.mouseIsDown_ = false;
  Blockly.unbindEvent_(this.mouseUpWrapper_);
  if (this.buttonNum == 1) {
    this.buttonClickEvent_(this.buttonNum, this.mouseIsDown_);
  }
  else if (this.buttonNum == 3) {
    this.buttonClickEvent_(this.buttonNum, this.mouseIsDown_);
  }
};

Blockly.FieldSpeed.prototype.onMouseEnter_ = function (e) {
  if (this.mouseIsDown_) {
    this.selectKeyWithMouseEvent_(e);
  }
};

Blockly.FieldSpeed.prototype.selectKeyWithMouseEvent_ = function (e) {
  this.buttonNum = Number(e.target.parentElement.getAttribute('button-option'));

  if (this.buttonNum == 1) {
    var angle = Number(this.getText()) - 1;
    if (angle < 0) angle = 0;
    this.setValue(angle);
    Blockly.FieldTextInput.htmlInput_.value = angle;
    this.updateGraph_();

    this.buttonClickEvent_(this.buttonNum, this.mouseIsDown_);
  }
  else if (this.buttonNum == 3) {
    var angle = Number(this.getText()) + 1;
    if (angle > 15) angle = 15;
    this.setValue(angle);
    Blockly.FieldTextInput.htmlInput_.value = angle;
    this.updateGraph_();

    this.buttonClickEvent_(this.buttonNum, this.mouseIsDown_);
  }
};

Blockly.FieldSpeed.prototype.buttonClickEvent_ = function (num, click) {
  if (click) {
    this.buttonSVGs_[num].querySelector('image').setAttribute('width', Blockly.FieldSpeed.ICON_WIDTH + Blockly.FieldSpeed.SELECTED_SIZE);
    this.buttonSVGs_[num].querySelector('image').setAttribute('height', Blockly.FieldSpeed.ICON_HEIGHT + Blockly.FieldSpeed.SELECTED_SIZE);
    this.buttonSVGs_[num].querySelector('image').setAttribute('x', -(Blockly.FieldSpeed.ICON_WIDTH + Blockly.FieldSpeed.SELECTED_SIZE) / 2);
    this.buttonSVGs_[num].querySelector('image').setAttribute('y', -(Blockly.FieldSpeed.ICON_HEIGHT + Blockly.FieldSpeed.SELECTED_SIZE) / 2);
  }
  else {
    this.buttonSVGs_[num].querySelector('image').setAttribute('width', Blockly.FieldSpeed.ICON_WIDTH);
    this.buttonSVGs_[num].querySelector('image').setAttribute('height', Blockly.FieldSpeed.ICON_HEIGHT);
    this.buttonSVGs_[num].querySelector('image').setAttribute('x', -Blockly.FieldSpeed.ICON_WIDTH / 2);
    this.buttonSVGs_[num].querySelector('image').setAttribute('y', -Blockly.FieldSpeed.ICON_HEIGHT / 2);
  }
};

Blockly.FieldSpeed.prototype.buttonInserter_ = function (num, plus, select) {
  var path;
  if (plus) {
    if (select) {
      path = Blockly.FieldSpeed.SELECTED_PLUS_PATH;
    }
    else {
      path = Blockly.FieldSpeed.PLUS_PATH;
    }
  }
  else {
    if (select) {
      path = Blockly.FieldSpeed.SELECTED_MINUS_PATH;
    }
    else {
      path = Blockly.FieldSpeed.MINUS_PATH;
    }
  }

  this.buttonSVGs_[num].querySelector('image').setAttributeNS(
    'http://www.w3.org/1999/xlink',
    'xlink:href',
    Blockly.mainWorkspace.options.pathToMedia + path
  );
};

Blockly.FieldSpeed.prototype.onMouseMove = function (e) {  // rogic-mobile
  this.calculateAngleAndSetValue(e, e.clientX, e.clientY);
};

Blockly.FieldSpeed.prototype.onTouchMove = function (e) {  // rogic-mobile
  this.calculateAngleAndSetValue(e, e.touches[0].clientX, e.touches[0].clientY);
};

Blockly.FieldSpeed.prototype.calculateAngleAndSetValue = function (e, clientX, clientY) {  // rogic-mobile
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

  if (Blockly.FieldSpeed.CLOCKWISE) {
    angle = Blockly.FieldSpeed.OFFSET + 360 - angle;
  } else {
    angle -= Blockly.FieldSpeed.OFFSET;
  }

  if (Blockly.FieldSpeed.ROUND) {
    angle = Math.round(angle / Blockly.FieldSpeed.ROUND) * Blockly.FieldSpeed.ROUND;
  }
  angle = this.callValidator(angle);

  angle = angle % 360;
  angle = Number(angle / 15);
  this.setValue(angle);
  Blockly.FieldTextInput.htmlInput_.value = angle;
  this.validate_();
};

/**
 * Insert a degree symbol.
 * @param {?string} text New text.
 */
Blockly.FieldSpeed.prototype.setText = function (text) {
  Blockly.FieldSpeed.superClass_.setText.call(this, text);
  if (!this.textElement_) {
    // Not rendered yet.
    return;
  }
  this.updateGraph_();
  // Cached width is obsolete.  Clear it.
  this.size_.width = 0;
};

/**
 * Redraw the graph with the current angle.
 * @private
 */
Blockly.FieldSpeed.prototype.updateGraph_ = function () {
  if (!this.gauge_) {
    return;
  }

  var angle = Number(this.getText());
  if (angle > 15) {
    angle = 15;
    this.setValue(angle);
    Blockly.FieldTextInput.htmlInput_.value = angle;
  }
  else if (angle < 0) {
    angle = 0;
    this.setValue(angle);
    Blockly.FieldTextInput.htmlInput_.value = angle;
  }

  var angle = angle * 15;
  var angleDegrees = angle % 360 + Blockly.FieldSpeed.OFFSET;

  if (Blockly.FieldSpeed.CLOCKWISE) {
    var imageRotation = angleDegrees + 2 * Blockly.FieldSpeed.OFFSET;
  } else {
    var imageRotation = -angleDegrees;
  }
  this.arrowSvg_.setAttribute('transform', 'rotate(' + (imageRotation) + ')');

  this.textView.textContent = this.getText();
};

/* *
 * startAngle 시작지점 endAngle 끝나는 지점 svgdom 넣고자하는 집단? color 채워질색
 * */
Blockly.FieldSpeed.prototype.drawGauge = function (startAngle, endAngle, svgdom, color) {
  var gauge = Blockly.utils.createSvgElement('path',
    {
      'fill': color,
      'fill-opacity': 1,
    }, svgdom);

  var radius = Blockly.FieldSpeed.RADIUS - 1;

  var angleRadians = goog.math.toRadians(endAngle);
  var path = ['M ', Blockly.FieldSpeed.HALF, ',', Blockly.FieldSpeed.HALF];
  var x2 = Blockly.FieldSpeed.HALF;
  var y2 = Blockly.FieldSpeed.HALF;

  if (!isNaN(angleRadians)) {
    var angle1 = goog.math.toRadians(startAngle);
    var x1 = Math.cos(angle1) * radius;
    var y1 = Math.sin(angle1) * -radius;
    if (Blockly.FieldSpeed.CLOCKWISE) {
      angleRadians = 2 * angle1 - angleRadians;
    }
    x2 += Math.cos(angleRadians) * (radius);
    y2 -= Math.sin(angleRadians) * (radius);

    var largeFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    var sweepFlag = Number(Blockly.FieldSpeed.CLOCKWISE);
    if (endAngle < startAngle) {
      sweepFlag = 1 - sweepFlag;
    }
    path.push(' l ', x1, ',', y1,
      ' A ', radius, ',', radius,
      ' 0 ', largeFlag, ' ', sweepFlag, ' ', x2, ',', y2, ' z');
  }
  gauge.setAttribute('d', path.join(''));
};

/**
 * Ensure that only an angle may be entered.
 * @param {string} text The user's text.
 * @return {?string} A string representing a valid angle, or null if invalid.
 */
Blockly.FieldSpeed.prototype.classValidator = function (text) {
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

  if (n > Blockly.FieldSpeed.WRAP) {
    n -= 360;
  }

  if (0 < n) return String(n);
  else if (n > -67.5) return String(0);
  else if (n > -135 && n <= -67.5) return String(225);
  else return String(360 + n);
};

Blockly.Field.register('field_speed', Blockly.FieldSpeed);
