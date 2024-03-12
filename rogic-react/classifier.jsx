import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import Modal from '../../containers/modal.jsx';
import Box from '../box/box.jsx';
import ClassifierItem from './classifier-item.jsx';
import ResultsItem from './results-item.jsx';
import PopoverTypeMenu from './popover-type-menu.jsx';

import exportImage from '../action-menu/icon--file-download.svg';
import importImage from '../action-menu/icon--file-upload.svg';

import styles from './classifier.css';

const messages = defineMessages({
    loadingCameraMessage: {
        defaultMessage: 'Loading Camera...',
        description: 'Notification to the user that the camera is loading',
        id: 'gui.cameraModal.loadingCameraMessage'
    },
    permissionRequest: {
        defaultMessage: 'We need your permission to use your camera',
        description: 'Notification to the user that the app needs camera access',
        id: 'gui.cameraModal.permissionRequest'
    },
    selectCameraType: {
        defaultMessage: '카메라를 선택해 주세요.',
        description: '웹캠 or 카메라 모듈 선택을 유도하기 위한 글',
        id: 'gui.cameraModal.selectCameraType'
    },
    train: {
        defaultMessage: '학습하기',
        description: '학습 하기 버튼 클릭시 Classes 에 들어간 정보를 학습함.',
        id: 'gui.cameraModal.train'
    },
    training: {
        defaultMessage: '학습중',
        description: 'Classes 에 들어간 정보를 학습 중임을 나타내는 버튼 label',
        id: 'gui.cameraModal.training'
    },
    recordWith: {
        defaultMessage: '(으)로 촬영하기',
        description: '카메라 타입 선택 메세지',
        id: 'gui.cameraModal.recordWith'
    },
    classifierLabel: {
        defaultMessage: '분류기',
        description: 'modal 상단 메세지',
        id: 'gui.classifierModal.label'
    }
});

const ClassifierComponent = ({intl, ...props}) => {
    const {
        useFooter,
        useHeader,
        useCancelButton,
        useOkButton,
        onCancel,
        onOk,

        access,
        addClass,
        addExample,
        bodyStyle,  // rogic-mobile
        cameraType,
        capture,
        canvasRef,
        changeName,
        changingNameIndex,
        classes,
        clearClass,
        cmeraLoaded,
        download,
        downloadSamples,
        moduleLoaded,
        onTrain,
        recordCamera,
        removeClass,
        results,
        setUpload,
        setCameraType,
        selectedIndex,
        selectIndex,
        training,
        upload,
        uploadClick,
        uploadSample,
        height,  // rogic-mobile
        width
    } = props;

    return (
        <Modal
            contentLabel={intl.formatMessage(messages.classifierLabel)}
            useFooter={useFooter}
            useHeader={useHeader}
            onRequestClose={onCancel}
            useCancelButton={useCancelButton}
            useOkButton={useOkButton}
            onCancel={onCancel}
            onOk={onOk}
            id='classifier'
        >
            <div
                className={styles.body}
                style={{ // rogic-mobile
                    height: `${height}px`,
                    width: `${width}px`
                }}
            >
                <Box className={styles.cameraLayer}>
                    <div className={styles.typeOptionWrapper}>
                        <PopoverTypeMenu
                            setCameraType={setCameraType}
                            cameraType={cameraType}
                        />
                        {intl.formatMessage(messages.recordWith)}
                    </div>
                    <Box className={styles.cameraFeedContainer}>
                        <div className={styles.loadingText}>
                            {props.access ?
                                intl.formatMessage(messages.loadingCameraMessage) :
                                (cmeraLoaded ?
                                    intl.formatMessage(messages.selectCameraType) :
                                    `↖️ \u00A0${intl.formatMessage(messages.permissionRequest)}`
                                )
                            }
                        </div>
                        <canvas
                            className={styles.canvas}
                            // height and (below) width of the actual image
                            // double stage dimensions to avoid the need for
                            // resizing the captured image when importing costume
                            // to accommodate double resolution bitmaps
                            height="720"
                            ref={canvasRef}
                            width="960"
                        />
                        {capture ? (
                            <div className={styles.flashOverlay} />
                        ) : null}
                    </Box>
                    <div className={styles.resultLayer}>
                        {results.map((item, index) => {
                            if (item.name === null) return null;
                            return (<ResultsItem
                                name={item.name}
                                rate={item.rate}
                                key={`classifier-result-${index}`}
                            />)
                        })}
                    </div>
                    <div className={styles.underButtonWarpper}>
                        <input
                            className={styles.upperButton}
                            onChange={upload}
                            style={{display: 'none'}}
                            ref={setUpload}
                            type='file'
                            accept={'.ipcc'}
                        />
                        <div className={styles.underLeftButton}>
                            <div
                                className={styles.underButton}
                                onClick={uploadClick}
                            >
                                <img
                                    className={styles.underButtonImage}
                                    src={importImage}
                                />
                            </div>
                            <div
                                className={styles.underButton}
                                onClick={download}
                            >
                                <img
                                    className={styles.underButtonImage}
                                    src={exportImage}
                                />
                            </div>
                        </div>
                        <div className={styles.underRightButton}>
                            <div
                                className={styles.underButton}
                                onClick={onTrain}
                            >
                                <label className={styles.upperButtonLabel} >
                                    {training ?
                                        intl.formatMessage(messages.training) :
                                        intl.formatMessage(messages.train)}
                                </label>
                            </div>
                        </div>
                    </div>
                </Box>
                <div className={styles.exampleLayer}>
                    {classes.map((item, index) => {
                        return (<ClassifierItem
                            addClass={addClass}
                            addExample={addExample}
                            changeName={changeName}
                            changingNameIndex={changingNameIndex}
                            clearClass={clearClass}
                            downloadSamples={downloadSamples}
                            enable={item.enable}
                            examples={item.examples}
                            index={index}
                            key={`classifier-item-${index}`}
                            name={item.name}
                            recordCamera={recordCamera}
                            removeClass={removeClass}
                            selectedIndex={selectedIndex}
                            selectIndex={selectIndex}
                            uploadSample={uploadSample}
                        />)
                    })}
                </div>
                {!cmeraLoaded || !moduleLoaded || training ?
                    <div
                        className={styles.loading}
                        style={bodyStyle}  // rogic-mobile
                    /> : null
                }
            </div>
        </Modal>
    );
};

ClassifierComponent.propTypes = {
    useFooter: PropTypes.bool,
    useHeader: PropTypes.bool,
    useCancelButton: PropTypes.bool,
    useOkButton: PropTypes.bool,
    onCancel: PropTypes.func,
    onOk: PropTypes.func,

    access: PropTypes.bool,
    addClass: PropTypes.func,
    addExample: PropTypes.func,
    bodyStyle: PropTypes.object,
    cameraType: PropTypes.string,
    capture: PropTypes.bool,
    canvasRef: PropTypes.func,
    changeName: PropTypes.func,
    changingNameIndex: PropTypes.number,
    classes: PropTypes.arrayOf(PropTypes.object),
    clearClass: PropTypes.func,
    cmeraLoaded: PropTypes.bool,
    download: PropTypes.func,
    downloadSamples: PropTypes.func,
    moduleLoaded: PropTypes.bool,
    onTrain: PropTypes.func,
    recordCamera: PropTypes.func,
    removeClass: PropTypes.func,
    results: PropTypes.arrayOf(PropTypes.object),
    setUpload: PropTypes.func,
    setCameraType: PropTypes.func,
    selectedIndex: PropTypes.number,
    selectIndex: PropTypes.func,
    training: PropTypes.bool,
    upload: PropTypes.func,
    uploadClick: PropTypes.func,
    uploadSample: PropTypes.func,

    intl: intlShape.isRequired,
    height: PropTypes.number,  // rogic-mobile
    width: PropTypes.number
};

export default injectIntl(ClassifierComponent);
