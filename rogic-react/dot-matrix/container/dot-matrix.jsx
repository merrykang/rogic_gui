import PropTypes, {object} from 'prop-types';
import React, {useState, useEffect} from 'react';
import classNames from 'classnames';

import Modal from '../../containers/modal.jsx';
import Box from '../box/box.jsx';

import VirtualMatrix from './virtual-matrix/virtual-matrix.jsx'
import Storage from './storage/storage.jsx'
import styles from './dot-matrix.css';

import brushButtonImage from './icon/brush.svg'
import clearButtonImage from './icon/clear.svg'
import eraserButtonImage from './icon/eraser.svg'
import exchangeButtonImage from './icon/exchange.svg'
import opaqueButtonImage from './icon/opaque.svg'
import rotateLeftButtonImage from './icon/rotate-left.svg'
import rotateRightButtonImage from './icon/rotate-right.svg'
import saveButtonImage from './icon/save.svg'

const deactiveColor = {}

const activeColor = {
    backgroundColor: '#4B96FF'
}

const redColor = {
    backgroundColor: '#FF0000'
}

const yellowColor = {
    backgroundColor: '#FFCC33'
}

const greenColor = {
    backgroundColor: '#00FF00'
}


const DotMatrixComponent = props => {
    const {
        onCancel,
        onOk,
        onBrushButtonClick,
        onControlButtonClick,
        onDeleteButtonClick,
        onEraserButtonClick,
        onExchangeButtonClick,
        onRotateLeftButtonClick,
        onRotateRightButtonClick,
        onSaveButtonClick,
        onStoredDataClick,
        useFooter,
        useHeader,
        useCancelButton,
        changeDotData,
        clearMode,
        clickMode,
        dot,
        exampleData,
        gridVisible,
        matrixSize,
        isDrag,
        rotateStatus,
        onDrag,
        storedData,
        changedStoredData,
        storageSpaceStyle,
        height,  // rogic-mobile
        width
    } = props;
    let controlButtonImage

    clearMode == 0 ?
        controlButtonImage = clearButtonImage :
        controlButtonImage = opaqueButtonImage

    const rotateMode = rotateStatus % 4;
    let brushButtonStyle
    let eraserButtonStyle

    switch (clickMode) {
        case 0:
            brushButtonStyle = deactiveColor;
            eraserButtonStyle = activeColor;
            break;
        case 1:
            brushButtonStyle = activeColor;
            eraserButtonStyle = deactiveColor;
            break;
        case 2:
            brushButtonStyle = redColor;
            eraserButtonStyle = deactiveColor;
            break;
        case 3:
            brushButtonStyle = yellowColor;
            eraserButtonStyle = deactiveColor;
            break;
        case 4:
            brushButtonStyle = greenColor;
            eraserButtonStyle = deactiveColor;
            break;
        default:
            brushButtonStyle = deactiveColor;
            eraserButtonStyle = deactiveColor;
            break;
    }

    return (
        <Modal
            className={styles.modalContent}
            useFooter={useFooter}
            useHeader={useHeader}
            onRequestClose={onCancel}
            useCancelButton={useCancelButton}
            onCancel={onCancel}
            onOk={onOk}
            id='robo_matrix' 
        >
            <Box
                className={styles.matrixWrapper}
                direction="column"
                style={{ // rogic-mobile
                    height: `${height}px`,
                    width: `${width}px`
                }}
            >
                <Box
                    className={styles.workspace}
                    direction="row"
                >
                    <div className={styles.matrixSpace}>
                        <VirtualMatrix
                            changeDotData={changeDotData}
                            clickMode={clickMode}
                            dot={dot}
                            gridVisible={gridVisible}
                            isDrag={isDrag}
                            matrixSize={matrixSize}
                            onDrag={onDrag}
                            rotateMode={rotateMode}
                        />
                    </div>
                </Box>
                <Box className={styles.buttonWrapper}
                >
                    <div className={styles.drawButton}>
                        <div
                            className={styles.button}
                            onClick={onRotateLeftButtonClick}
                        >
                            <img
                                className={styles.buttonImage}
                                src={rotateLeftButtonImage}
                            />
                        </div>
                        <div
                            className={styles.button}
                            onClick={onRotateRightButtonClick}
                        >
                            <img
                                className={styles.buttonImage}
                                src={rotateRightButtonImage}
                            />
                        </div>
                        <div
                            className={styles.button}
                            onClick={onSaveButtonClick}
                        >
                            <img
                                className={styles.buttonImage}
                                src={saveButtonImage}
                            />
                        </div>
                    </div>
                    <div className={styles.statusButton}>
                        <div
                            className={styles.button}
                            onClick={onExchangeButtonClick}
                        >
                            <img
                                className={styles.buttonImage}
                                src={exchangeButtonImage}
                            />
                        </div>
                        <div
                            className={styles.button}
                            onClick={onExchangeButtonClick}
                        >
                            <img
                                className={styles.buttonImage}
                                src={exchangeButtonImage}
                                style={{transform: 'rotate(-90deg)'}}
                            />
                        </div>

                        <div className={styles.separation} />

                        <div
                            className={styles.button}
                            onClick={onControlButtonClick}
                        >
                            <img
                                className={styles.buttonImage}
                                src={controlButtonImage}
                            />
                        </div>
                        <div
                            className={styles.button}
                            style={brushButtonStyle}
                            onClick={onBrushButtonClick}
                        >
                            <img
                                className={styles.buttonImage}
                                src={brushButtonImage}
                                style={clickMode == 0 ? null :{filter: "brightness(0) invert(1)"}}
                            />
                        </div>
                        <div
                            className={styles.button}
                            style={eraserButtonStyle}
                            onClick={onEraserButtonClick}
                        >
                            <img
                                className={classNames(styles.buttonImage, styles.imageFlip)}
                                src={eraserButtonImage}
                                style={clickMode == 0 ? {filter: "brightness(0) invert(1)"} : null}
                            />
                        </div>
                    </div>
                </Box>
                <Box
                    className={styles.dataStorageSpace}
                    style={storageSpaceStyle}
                >
                    <Storage
                        changedStoredData={changedStoredData}
                        storedData={storedData}
                        onStoredDataClick={onStoredDataClick}
                        onDeleteButtonClick={onDeleteButtonClick}
                        matrixSize={matrixSize}
                        exampleData={exampleData}
                        dot={dot}
                    />
                </Box>
            </Box>
        </Modal>
    );
};

DotMatrixComponent.propTypes = {
    useCancelButton: PropTypes.bool,
    useFooter: PropTypes.bool,
    useHeader: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onOk: PropTypes.func.isRequired,
    onBrushButtonClick: PropTypes.func,
    onControlButtonClick: PropTypes.func,
    onDeleteButtonClick: PropTypes.func,
    onEraserButtonClick: PropTypes.func,
    onExchangeButtonClick: PropTypes.func,
    onRotateLeftButtonClick: PropTypes.func,
    onRotateRightButtonClick: PropTypes.func,
    onSaveButtonClick: PropTypes.func,
    onStoredDataClick: PropTypes.func,
    changeDotData: PropTypes.func,
    clearMode: PropTypes.number,
    clickMode: PropTypes.number,
    dot: PropTypes.string,
    exampleData: PropTypes.object,
    gridVisible: PropTypes.bool,
    matrixSize: PropTypes.arrayOf(PropTypes.number),
    isDrag: PropTypes.bool,
    rotateStatus: PropTypes.number,
    onDrag: PropTypes.func,
    storedData: PropTypes.object,
    changedStoredData: PropTypes.bool,
    dimensions: PropTypes.object,
    height: PropTypes.number,  // rogic-mobile
    width: PropTypes.number
};

export default DotMatrixComponent;
