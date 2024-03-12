import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import Modal from '../../containers/modal.jsx';
import Box from '../box/box.jsx';
import FaceDetectorItem from './face-detector-item.jsx';
import PopoverTypeMenu from '../classifier/popover-type-menu.jsx';

import styles from './face-detector.css';

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
        id: 'gui.cameraModal.recordWith',
    },
    classifierLabel: {
        defaultMessage: '사용자 정보',
        description: 'modal 상단 메세지',
        id: 'gui.faceDetectorModal.label',
    }
});

const FaceDetectorComponent = ({intl, ...props}) => {
    const {
        useFooter,
        useHeader,
        useCancelButton,
        useOkButton,
        onCancel,
        onOk,

        access,
        addUser,
        addUserImage,
        //bodyStyle,  // rogic-mobile
        cameraType,
        capture,
        canvasRef,
        cameraLoaded,
        changeName,
        changingNameIndex,
        clearUserImage,
        download,
        downloadUser,
        users,
        moduleLoaded,
        onTrain,
        recordCamera,
        removeUser,
        results,
        //setUpload,
        setCameraType,
        selectedIndex,
        selectIndex,
        training,
        //uploadClick,
        uploadUser,
        uploadUserImage,
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
                                (cameraLoaded ?
                                    intl.formatMessage(messages.selectCameraType) :
                                    `↖️ \u00A0${intl.formatMessage(messages.permissionRequest)}`
                                )
                            }
                        </div>
                        <canvas
                            className={styles.canvas}
                            height="720"
                            ref={canvasRef}
                            width="960"
                        />
                        {capture ? (
                            <div className={styles.flashOverlay} />
                        ) : null}
                    </Box>
                    <div className={styles.underButtonWarpper}>
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
                </Box>
                <div className={styles.exampleLayer}>
                    {users.map((user, index) => {
                        return (<FaceDetectorItem
                            addUser={addUser}
                            addUserImage={addUserImage}
                            changeName={changeName}
                            changingNameIndex={changingNameIndex}
                            clearUserImage={clearUserImage}
                            downloadUser={downloadUser}
                            enable={user.enable}
                            costumes={user.datas}
                            index={index}
                            key={`users-item-${index}`}
                            name={user.name}
                            recordCamera={recordCamera}
                            removeUser={removeUser}
                            selectedIndex={selectedIndex}
                            selectIndex={selectIndex}
                            uploadUser={uploadUser}
                            uploadUserImage={uploadUserImage}
                        />)
                    })}
                    {users.length < 8 ? <div
                        className={styles.classAddButton}
                        onClick={addUser}
                    /> : null}
                </div>
                {!cameraLoaded || !moduleLoaded || training ?
                    <div
                        className={styles.loading}
                        //style={bodyStyle}  // rogic-mobile
                        style={{ 
                            height: `${height}px`,
                            width: `${width}px`
                        }}
                    /> : null
                }
            </div>
        </Modal>
    );
};

FaceDetectorComponent.propTypes = {
    useFooter: PropTypes.bool,
    useHeader: PropTypes.bool,
    useCancelButton: PropTypes.bool,
    useOkButton: PropTypes.bool,
    onCancel: PropTypes.func,
    onOk: PropTypes.func,

    access: PropTypes.bool,
    addUser: PropTypes.func,
    addUserImage: PropTypes.func,
    //bodyStyle: PropTypes.object,  // rogic-mobile
    cameraType: PropTypes.string,
    capture: PropTypes.bool,
    canvasRef: PropTypes.func,
    cameraLoaded: PropTypes.bool,
    changeName: PropTypes.func,
    changingNameIndex: PropTypes.number,
    clearUserImage: PropTypes.func,
    download: PropTypes.func,
    downloadUser: PropTypes.func,
    users: PropTypes.arrayOf(PropTypes.shape({
        enable: PropTypes.bool,
        costumes: PropTypes.PropTypes.arrayOf(PropTypes.object),
        name: PropTypes.string
    })),
    moduleLoaded: PropTypes.bool,
    onTrain: PropTypes.func,
    recordCamera: PropTypes.func,
    removeUser: PropTypes.func,
    results: PropTypes.object,
    setCameraType: PropTypes.func,
    selectedIndex: PropTypes.number,
    selectIndex: PropTypes.func,
    training: PropTypes.bool,
    uploadUser: PropTypes.func,
    uploadUserImage: PropTypes.func,

    intl: intlShape.isRequired,
    height: PropTypes.number,  // rogic-mobile
    width: PropTypes.number
};

export default injectIntl(FaceDetectorComponent);
