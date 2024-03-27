// Add LKW

import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';

import MonacoManager from '../lib/monaco-config/monaco-manager';
import CodeViewerComponent from '../components/code-viewer/code-viewer.jsx';

import * as monaco from 'monaco-editor';

class CodeViewer extends React.Component {
    static get TITLE () {
        return {
            ARDUINO_C: 'Arduino C',
            PYTHON: 'Python'
        };
    }
    constructor (props) {
        super(props);

        bindAll(this, [
            'setTitleAreaRef',
            'handleOnClickToggle',
            'setParsedCode',
            'updateEditor',
            'handleOnClickResizeBar',
            'resize',
            'endResize',
            'resizeViewer'
        ]);
        this.state = {
            isShowing: false
        };
        /**
         * @type {monaco.editor.IStandaloneCodeEditor}
         */
        this._editor = null;
        /**
         * @type {monaco.editor.ITextModel}
         */
        this._editorModel = null;
        this._titleRef = null;
        this._rootNode = null;
        this._parentNode = null;
        this._minWidth = 0;
        this._maxWidth = 0;
        this._baseWidth = 0;
        this._currentWidth = 0;
        this._prevPosX = 0;
        this._ratio = 0; // 자식 (코드뷰어) / 부모 (워크스페이스)
    }

    componentDidMount () {
        this._editor = MonacoManager.getInstance().createEditor(this._editorAreaRef, true, false);
        if (!this._editor) throw new Error('[componentDidMount] internal exception : this._editor not exist');

        this.props.vm.addListener('REQUEST_PARSED_CODE', this.setParsedCode);

        this._rootNode = ReactDOM.findDOMNode(this._refSelf);
        this._parentNode = this._rootNode.parentNode;

        this._baseWidth = Math.round(this._parentNode.offsetWidth * 0.3);
        this._currentWidth = this._baseWidth;
        this._ratio = Number((this._currentWidth / this._parentNode.offsetWidth).toFixed(2));
    }
    componentWillUnmount () {
        this.props.vm.removeListener('REQUEST_PARSED_CODE', this.setParsedCode);
        if (this._editor) {
            this._editor.dispose();
            this._editor = null;
        }
    }
    setTitleAreaRef (element) {
        this._titleRef = element;
    }

    // vm에서 번역된 코드를 받아 출력
    setParsedCode (parsedCode) {
        const isDevice = this.props.vm.editingTarget.isDevice;

        if (!this._editorModel) {
            this._editorModel = MonacoManager.getInstance().createEditorModel(
                isDevice ? MonacoManager.LANGUAGE.ROBOKIT_RS : MonacoManager.LANGUAGE.ROBO_PYTHON
            );
            this._editor.setModel(this._editorModel);
            if (this._titleRef) {
                this._titleRef.innerText = isDevice ? CodeViewer.TITLE.ARDUINO_C : CodeViewer.TITLE.PYTHON;
            }
        }

        const language = isDevice ? MonacoManager.LANGUAGE.ROBOKIT_RS : MonacoManager.LANGUAGE.ROBO_PYTHON;

        if (MonacoManager.getInstance().getModelLanguage(this._editorModel) === language) {
            this._editor.setValue(parsedCode);
        } else {
            this.updateEditor(language, parsedCode);
        }
    }

    // 뷰어 ON/OFF를 위한 함수
    handleOnClickToggle (e) {
        // console.log(`[1] ${this.state.isShowing}`);
        this.setState(prev => ({
            isShowing: !prev.isShowing
        }), () => {
            // console.log(`[2] ${this.state.isShowing}`);
            this._editor.layout();
        });
    }

    updateEditor (language, value) {
        if (this._titleRef) {
            if (language === MonacoManager.LANGUAGE.ROBOKIT_RS) {
                this._titleRef.innerText = CodeViewer.TITLE.ARDUINO_C;
            } else {
                this._titleRef.innerText = CodeViewer.TITLE.PYTHON;
            }
        }
        const oldModel = this._editorModel;
        this._editorModel = MonacoManager.getInstance().createEditorModel(language, value);
        this._editor.setModel(this._editorModel);
        if (oldModel) oldModel.dispose();
    }

    handleOnClickResizeBar (e) {
        const parentWidth = this._parentNode.offsetWidth;
        this._minWidth = Math.round(parentWidth * 0.08);
        this._maxWidth = Math.round(parentWidth * 0.6);
        this._baseWidth = Math.round(parentWidth * 0.3);
        this._prevPosX = e.clientX;

        document.addEventListener('mousemove', this.resize, false);
        document.addEventListener('mouseup', this.endResize, false);
    }

    resize (e) {
        const offset = this._prevPosX - e.clientX;

        let result = this._rootNode.offsetWidth + offset;
        if (result <= this._minWidth) {
            result = this._minWidth;
            this.setState(() => ({
                isShowing: false
            }), () => {
                this._currentWidth = this._baseWidth;
                this._ratio = Number((this._currentWidth / this._parentNode.offsetWidth).toFixed(2));
                document.removeEventListener('mousemove', this.resize, false);
                document.removeEventListener('mouseup', this.endResize, false);
            });
            return;
        } else if (result > this._maxWidth) {
            result = this._maxWidth;
        }

        if (this._rootNode.offsetWidth === result) return;

        this._rootNode.style = `width: ${result}px`;
        this._prevPosX = this._rootNode.getBoundingClientRect().left + 34; // toggle width == 34px
        this._editor.layout();
    }

    endResize (e) {
        document.removeEventListener('mousemove', this.resize, false);
        document.removeEventListener('mouseup', this.endResize, false);
        this._currentWidth = this._rootNode.offsetWidth;
        this._ratio = Number((this._currentWidth / this._parentNode.offsetWidth).toFixed(2));
    }

    // 앱 전체 화면의 크기를 조정할 때 호출
    resizeViewer (parentWidth) {
        this._minWidth = Math.round(parentWidth * 0.08);
        this._maxWidth = Math.round(parentWidth * 0.6);
        this._baseWidth = Math.round(parentWidth * 0.3);
        this._currentWidth = Math.round(parentWidth * this._ratio);
        if (this.state.isShowing) {
            this._rootNode.style = `width: ${this._currentWidth}px`;
            this._editor.layout();
        }
    }

    render () {
        return (
            <CodeViewerComponent
                ref={ref => {
                    this._refSelf = ref;
                }}
                setTitleAreaRef={this.setTitleAreaRef}
                isShowing={this.state.isShowing}
                targetIsDevice={this.props.targetIsDevice}
                currentWidth={this._currentWidth}
                onClickToggle={this.handleOnClickToggle}
                onClickResizeBar={this.handleOnClickResizeBar}
            >
                <div
                    ref={ref => {
                        this._editorAreaRef = ref;
                    }}
                    style={{
                        width: '100%',
                        height: '100%'
                    }}
                />
            </CodeViewerComponent>
        );
    }
}

CodeViewer.propTypes = {
    targetIsDevice: PropTypes.bool.isRequired,
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm
});

export default connect(
    mapStateToProps
)(CodeViewer);
