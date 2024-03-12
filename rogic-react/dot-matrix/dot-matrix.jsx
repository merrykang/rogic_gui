import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import DotMatrixComponent from '../components/dot-matrix/dot-matrix.jsx';
import {connect} from 'react-redux';

import exampleData from '../components/dot-matrix/storage/storage.json';

class DotMatrix extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleCancel',
            'handleOk',
            'handleChangeDotData',
            'handleBrushButtonClick',
            'handleEraserButtonClick',
            'handleExchangeButtonClick',
            'handleControlButtonClick',
            'handleRotateLeftButtonClick',
            'handleRotateRightButtonClick',
            'handleSaveButtonClick',
            'handleStoredDataClick',
            'handleDeleteButtonClick',
            'onDrag',
            'dragOver',
            'handleResize'  //rogic-mobile
        ]);
        this.state = {
            useCancelButton: true,
            useFooter: true,
            useHeader: true,  // rogic-mobile
            matrixSize: [],
            dot: null,
            isDrag: false,
            clickMode: 0,
            clearMode: 0,
            storedData: null,
            changedStoredData: false,
            rotateStatus: 0,
            height: window.innerHeight,  //rogic-mobile
            width: window.innerWidth
        };
    }

    componentDidMount () {
        const data = this.props.json.value;
        const column = this.props.json.column;
        const row = this.props.json.row;

        let clickMode = 1;
        if (column == 5 && row == 7) {
            clickMode = 2;
        }

        let maxLength = column * row;
        if (data.length < maxLength) {
            while (true) {
                data += '0';
                if (data.length >= maxLength) break;
            }
        }

        this.setState({
            dot: data,
            matrixSize: [column, row],
            clickMode: clickMode
        });

        this.exampleData = exampleData;

        if (localStorage.storedData && localStorage.storedData !== 'null') {
            this.setState({storedData: JSON.parse(localStorage.storedData)});
        } else {
            const exampleKeys = Object.keys(this.exampleData);
            let storedData = this.state.storedData = {};
            exampleKeys.forEach(function (key) {
                storedData[key] = {dot: []};
            });
        }
        this.setState({changedStoredData: true});
        this.handleResize();  // rogic-mobile
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount () {
        if (this.state.storedData === null) localStorage.storedData = null;
        else localStorage.storedData = JSON.stringify(this.state.storedData);
        window.removeEventListener('resize', this.handleResize);  // rogic-mobile
    }

    shouldComponentUpdate (nextProps, nextState) {
        if (nextState.dot !== this.state.dot) {
            var length = nextState.dot.length;
            for (var index = 0; index < length; index++) {
                if (1 == nextState.dot[index]) break;
            }
            if (index == length) {
                this.setState({
                    clearMode: 1
                });
            }
            else {
                this.setState({
                    clearMode: 0
                });
            }
        }

        return (
            nextState.matrixSize !== this.state.matrixSize ||
            nextState.dot !== this.state.dot ||
            nextState.isDrag !== this.state.isDrag ||
            nextState.clickMode !== this.state.clickMode ||
            nextState.clearMode !== this.state.clearMode ||
            nextState.rotateStatus !== this.state.rotateStatus ||
            nextState.changedStoredData ||
            nextState.width !== this.state.width ||  // rogic-mobile
            nextState.height !== this.state.height
        );
    }

    componentDidUpdate () {
        if (this.state.changedStoredData) this.setState({changedStoredData: false});
    }

    onDrag () {
        this.setState({isDrag: true});
        document.addEventListener('mouseup', this.dragOver);
    }

    dragOver () {
        this.setState({isDrag: false});
        document.removeEventListener('mouseup', this.dragOver);
    }

    handleChangeDotData (index, data) {
        this.onDrag();
        let dotdata = this.state.dot;
        let inputdata;
        if (dotdata[index] == data) inputdata = 0;
        else inputdata = data;
        let newdata = dotdata.substr(0, index) + inputdata + dotdata.substr(index + 1);
        this.setState({
            dot: newdata
        });
    }

    handleBrushButtonClick () {
        if (this.state.matrixSize.toString() === [5, 7].toString()) {
            if (this.state.clickMode === 2) this.setState({clickMode: 3});
            else if (this.state.clickMode === 3) this.setState({clickMode: 4});
            else this.setState({clickMode: 2});
        }
        else {this.setState({clickMode: 1});}
    }

    handleEraserButtonClick () {
        this.oldClickMode = this.state.clickMode;
        this.setState({clickMode: 0});
    }

    handleExchangeButtonClick (e) {
        const isUpDown = !!e.currentTarget.firstChild.getAttribute("style");
        //0도, 180도 회전 상태 도트매트릭스 좌우반전 / 90도, 270도 회전 상태 도트매트릭스 상하반전
        const flipHorizontal = function () {
            let dots = '';
            for (let height = 0; height < this.state.matrixSize[1]; height++) {
                for (let width = this.state.matrixSize[0] - 1; width >= 0; width--) {
                    let beforeIndex = height * this.state.matrixSize[0] + width;
                    dots += this.state.dot[beforeIndex];
                }
            }
            return dots;
        }.bind(this);
        //0도, 180도 회전 상태 도트매트릭스 상하반전 / 90도, 270도 회전 상태 도트매트릭스 좌우반전
        const flipVertical = function () {
            let dots = '';
            for (let height = this.state.matrixSize[1] - 1; height >= 0; height--) {
                for (let width = 0; width < this.state.matrixSize[0]; width++) {
                    let beforeIndex = height * this.state.matrixSize[0] + width;
                    dots += this.state.dot[beforeIndex];
                }
            }
            return dots;
        }.bind(this);

        //회전 상태에 따른 함수호출
        if (isUpDown ^ (this.state.rotateStatus % 2 == 0)) {
            this.setState({dot: flipHorizontal()});
        } else {
            this.setState({dot: flipVertical()});
        }
    }

    handleControlButtonClick () {
        var string = '';
        var length = this.state.dot.length;
        if (this.state.clearMode === 1) {
            let clearColor = this.state.clickMode;
            if (0 === this.state.clickMode) clearColor = this.oldClickMode;
            for (var index = 0; index < length; index++) {
                string += String(clearColor);
            }
        } else if (this.state.clearMode === 0) {
            for (var index = 0; index < length; index++) {
                string += '0';
            }
        }
        this.setState({
            dot: string
        });
    }

    handleRotateLeftButtonClick () {
        if (this.state.rotateStatus === 0) this.state.rotateStatus = 4;
        this.setState({rotateStatus: this.state.rotateStatus - 1});
    }
    handleRotateRightButtonClick () {
        if (this.state.rotateStatus === 3) this.state.rotateStatus = -1;
        this.setState({rotateStatus: this.state.rotateStatus + 1});
    }

    handleSaveButtonClick () {
        let lastJson = JSON.stringify(this.state.storedData);
        this.state.storedData[this.state.matrixSize.toString()].dot.push(this.state.dot);
        let nowJson = JSON.stringify(this.state.storedData);

        this.setState({changedStoredData: (lastJson !== nowJson)});
    }

    handleStoredDataClick (data) {
        this.setState({dot: data});
    }

    handleDeleteButtonClick (index) {
        let lastJson = JSON.stringify(this.state.storedData);
        let array = this.state.storedData[this.state.matrixSize.toString()].dot;
        array = array.slice(0, index).concat(array.slice(Number(index) + 1));
        this.state.storedData[this.state.matrixSize.toString()].dot = array;
        let nowJson = JSON.stringify(this.state.storedData);

        this.setState({changedStoredData: (lastJson !== nowJson)});
    }

    handleCancel () {
        this.props.onRequestClose();
    }

    handleOk () {
        var json = {value: this.state.dot};

        this.props.callback(json);
        this.props.onRequestClose();
    }

    handleResize = () => {  //rogic-mobile: scratch-gui 파라미터 이용
        this.setState({
            height: window.innerHeight - (3 * 16),
            width: window.innerWidth
        });
    };

    render () {
        const storageSpaceStyle = {width: 512};
        if (this.state.matrixSize.toString() == [15, 7].toString()) {
            storageSpaceStyle.width = 560;
        }

        return (
            <DotMatrixComponent
                useFooter={this.state.useFooter}
                useHeader={this.state.useHeader}
                useCancelButton={this.state.useCancelButton}
                onCancel={this.handleCancel}
                onOk={this.handleOk}
                matrixSize={this.state.matrixSize}
                dot={this.state.dot}
                storedData={this.state.storedData}
                changedStoredData={this.state.changedStoredData}
                clearMode={this.state.clearMode}
                clickMode={this.state.clickMode}
                exampleData={this.exampleData}
                gridVisible={true}
                isDrag={this.state.isDrag}
                rotateStatus={this.state.rotateStatus}
                onDrag={this.onDrag}
                changeDotData={this.handleChangeDotData}
                onBrushButtonClick={this.handleBrushButtonClick}
                onControlButtonClick={this.handleControlButtonClick}
                onDeleteButtonClick={this.handleDeleteButtonClick}
                onEraserButtonClick={this.handleEraserButtonClick}
                onExchangeButtonClick={this.handleExchangeButtonClick}
                onRotateLeftButtonClick={this.handleRotateLeftButtonClick}
                onRotateRightButtonClick={this.handleRotateRightButtonClick}
                onSaveButtonClick={this.handleSaveButtonClick}
                onStoredDataClick={this.handleStoredDataClick}
                setStorageSpace={this.setStorageSpace}
                storageSpaceStyle={storageSpaceStyle}
                height={this.state.height}  //rogic-mobile
                width={this.state.width}
            />
        );
    }
}

DotMatrix.propTypes = {
    onRequestClose: PropTypes.func.isRequired,
    type: PropTypes.string,
    json: PropTypes.object,
    callback: PropTypes.func,
};

DotMatrix.defaultOptions = {

};

DotMatrix.defaultProps = {

};

const mapStateToProps = state => ({
    json: state.scratchGui.dotMatrix.json,
    callback: state.scratchGui.dotMatrix.callback
});

export default connect(
    mapStateToProps
)(DotMatrix);
