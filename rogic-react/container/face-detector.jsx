// nodejs module 항목
import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';
import {connect} from 'react-redux';

// ../components 항목
import FaceDetectorComponent from '../components/face-detector/face-detector.jsx';

// ../lib 항목
import ModalResizer from '../lib/modal-resizer';
import ModalVideoManager from '../lib/video/modal-video-manager.js';
import ModalCameraModuleManager from '../lib/camera-module/modal-camera-module-manager.js';

// ../reducers 항목
import {requestResetChanged} from '../reducers/face-detector.js';

import ImageProcessing from 'scratch-vm/src/extensions/image_processing/index.js';

class FaceDetector extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleExportUser',
            'handleAddButtonClick',
            'handleAccess',
            'handleRecordCamera',
            'handleChangeName',
            'handleClearUserImages',
            'handleError',
            'handleUploadUserImage',
            'handleLoaded',
            'handleTrainingButton',
            'handleAddUserImage',
            'handleOnCancel',
            'handleOnOk',
            'handleRemoveUser',
            'handleSetCameraType',
            'handleSelectIndex',
            'handleLoadUser',
            'setCanvas',
            'getStageCamera',
            'handleResize'  //rogic-mobile
        ]);

        this.state = {
            changingNameIndex: null,
            cameraType: null,
            capture: null,
            access: false,
            cameraLoaded: true,
            training: false,
            recordIndex: -1,
            height: window.innerHeight,  //rogic-mobile
            width: window.innerWidth
        };

        this.modalResizer = new ModalResizer();  //rogic-mobile
        this.modalResizer.Preferences = {
            fullHeigthpx: 650,
            fullWidthpx: 900,
            haederHeigth: 3,
            footerHeigth: 3.5,
            filterHeight: 0,
            borderWidthpx: 8
        };
        const styleForSize = this.modalResizer.calculator();
        var style = {};
        style.height = styleForSize.itemWrapper.height;
        style.width = styleForSize.itemWrapper.width;
        this.state.itemWrapperStyle = style;
        this.props.onRequestResetFaceDetectorChanged();
    }

    componentDidMount () {
        window.addEventListener('resize', this.handleWindowResize);
        this.handleResize();  // rogic-mobile
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount () {
        this.props.faceDetectorUtils.saveChanges();
        this.props.flyoutRefresh();
        if (this._renderPreviewTimeout) clearTimeout(this._renderPreviewTimeout);
        window.removeEventListener('resize', this.handleResize);  // rogic-mobile
    }

    componentDidUpdate (prevProps, prevState) {
        if (this.props.changedFaceDetector) {
            this.props.onRequestResetFaceDetectorChanged();
        }
        if (this.state.cameraType !== prevState.cameraType) {
            const cameraType = this.state.cameraType;
            if (cameraType == ImageProcessing.CameraType.WEBCAM) {
                if (this._videoManager) return;
                this.setState({cameraLoaded: false});
                if (this._renderPreviewTimeout) clearTimeout(this._renderPreviewTimeout);

                if (this._cameraModuleManager) this._cameraModuleManager.disable();
                delete this._cameraModuleManager;
                this._videoManager = new ModalVideoManager(this.canvas);

                this._provider = this._videoManager._provider;
                this._videoManager.enable(this.handleAccess, this.handleLoaded, this.handleError);
            } else if (cameraType == ImageProcessing.CameraType.CAMERAMODULE) {
                if (this._cameraModuleManager) return;
                this.setState({cameraLoaded: false});
                if (this._renderPreviewTimeout) clearTimeout(this._renderPreviewTimeout);

                if (this._videoManager) this._videoManager.disable();
                delete this._videoManager;
                this._cameraModuleManager = new ModalCameraModuleManager(this.canvas);

                this._provider = this._cameraModuleManager._provider;
                this._cameraModuleManager.enable(this.handleAccess, this.handleLoaded, this.handleError);
            }
        }
    }

    shouldComponentUpdate (nextProps, nextState) {
        return (
            this.state.changingNameIndex !== nextState.changingNameIndex ||
            this.state.cameraType !== nextState.cameraType ||
            this.state.capture !== nextState.capture ||
            this.state.access !== nextState.access ||
            this.state.cameraLoaded !== nextState.cameraLoaded ||
            this.state.selectedIndex !== nextState.selectedIndex ||
            this.state.training !== nextState.training ||
            this.state.recordIndex !== nextState.recordIndex ||
            this.state.itemWrapperStyle.width !== nextState.itemWrapperStyle.width ||
            this.state.itemWrapperStyle.height !== nextState.itemWrapperStyle.height ||
            this.props.changedFaceDetector !== nextProps.changedFaceDetector ||
            this.props.moduleLoaded !== nextProps.moduleLoaded ||
            this.state.width !== nextState.width ||  // rogic-mobile
            this.state.height !== nextState.height
        );
    }

    handleAddUserImage (userPicture) {
        this.props.faceDetectorUtils.uploadUserImage(this.state.selectedIndex, userPicture);
    }

    handleAccess () {
        this.setState({access: true});
    }
    handleLoaded () {
        this.setState({cameraLoaded: true});
        const stageCamera = this.getStageCamera();
        let count = 0;
        this._renderPreviewFrame = () => {
            count++;
            clearTimeout(this._renderPreviewTimeout);
            if (!this._renderPreviewFrame) return;

            this._renderPreviewTimeout = setTimeout(this._renderPreviewFrame,
                this.props.vm.runtime.currentStepTime);

            if (this._provider) {
                let imageData = this._provider.getFrame({
                    format: stageCamera.FORMAT_IMAGE_DATA,
                    cacheTimeout: this.props.vm.runtime.currentStepTime
                });
                if (imageData && count % 3 == 0) {
                    if (this.state.recordIndex != -1)
                        this.props.faceDetectorUtils.uploadSampleForImageData
                            (imageData, this.state.selectedIndex);
                }
            }
        };
        this._renderPreviewFrame();
    }
    handleError () {
        this.setState({
            cameraLoaded: true,
            access: false,
            cameraType: null
        });

        const ctx = this.canvas.getContext('2d');
        let img = ctx.createImageData(this.canvas.width, this.canvas.height);
        for (var i = img.data.length; --i >= 0;)
            img.data[i] = 0;
        ctx.putImageData(img, 0, 0);
    }
    handleOnCancel () {
        this.props.onRequestClose();
    }
    handleOnOk () {
        this.props.onRequestClose();
    }

    setCanvas (canvas) {
        this.canvas = canvas;
    }

    // 사용자 추가 버튼 클릭
    handleAddButtonClick () {
        this.props.faceDetectorUtils.addNewUser();
    }
    // 사용자 이름 변경
    handleChangeName (e) {
        e.stopPropagation();
        const index = e.currentTarget.getAttribute('index');
        if (e.type == 'click') {
            const inputElement = e.currentTarget.getElementsByTagName('input')[0];
            this.setState({
                changingNameIndex: Number(index),
                selectedIndex: Number(index)
            }, () => {
                inputElement.focus();
                inputElement.select();
            });
        }
        else if (e.type == 'blur') {
            this.setState({changingNameIndex: null});
            this.props.faceDetectorUtils.changeUserName(e.currentTarget.value, index);
        }
        else if (e.type == 'keydown') {
            // enter, esc입력될때 처리
            switch (e.nativeEvent.keyCode) {
                case 13: // enter
                    e.currentTarget.blur();
                    break;
                case 27: // esc
                    e.currentTarget.value = e.currentTarget.parentElement.getAttribute('name');
                    e.currentTarget.blur();
                    break;
            }
        }
    }
    handleClearUserImages (index) {
        this.props.faceDetectorUtils.removeUserAllImage(index);
    }
    handleTrainingButton () {
        this.setState({training: true});
        const userData = this.props.faceDetectorUtils.trainUsers();
        Promise.all(userData).then(() => this.setState({training: false}))
            .catch((e) => {
                console.warn(e);
                this.setState({training: false});
            });
    }
    handleRecordCamera (e) {
        const eventType = e.nativeEvent.type;
        const index = e.currentTarget.getAttribute('index');
        if (eventType == 'mousedown') {
            this.setState({recordIndex: index});
        } else if (eventType == 'mouseup' || eventType == 'mouseout') {
            this.setState({recordIndex: -1});
        }
    }
    handleRemoveUser (index) {
        this.setState({selectedIndex: null});
        this.props.faceDetectorUtils.removeUser(index);
    }
    handleSetCameraType (e) {
        const cameraType = e.currentTarget.getAttribute('type');
        if (!this.canvas) return;

        this.setState({cameraType: cameraType});
    }
    handleSelectIndex (e) {
        const index = e.currentTarget.getAttribute('index');
        this.setState({selectedIndex: Number(index)})
    }

    // 사용자 저장
    handleExportUser (index, zip) {
        // 저장할 사용자 정보가 있는지 확인
        this.props.faceDetectorUtils.exportUser(index, zip);
    }

    // 사용자 불러오기
    handleLoadUser (uint8Array, index) {
        this.props.faceDetectorUtils.uploadUserForBuffer(uint8Array, index);
    }

    // 이미지 불러오기
    handleUploadUserImage (uint8Array, userIndex) {
        this.props.faceDetectorUtils.uploadSampleForUint8Array(uint8Array, userIndex);
    }

    getStageCamera () {
        const cameraType = this.state.cameraType;
        let ioCamera;
        if (cameraType == ImageProcessing.CameraType.WEBCAM) {
            ioCamera = this.props.vm.runtime.ioDevices.video;
        } else if (cameraType == ImageProcessing.CameraType.CAMERAMODULE) {
            ioCamera = this.props.vm.runtime.ioDevices.cameraModule;
        }
        return ioCamera;
    }

    handleResize = () => {  //rogic-mobile: scratch-gui 파라미터 이용
        this.setState({
            height: window.innerHeight - (5 * 16), // header: 5rem
            width: window.innerWidth
        });
    };

    render () {
        return <FaceDetectorComponent
            useFooter={true}
            useHeader={true}
            useCancelButton={false}
            useOkButton={true}
            onCancel={this.handleOnCancel}
            onOk={this.handleOnOk}

            access={this.state.access}
            addUser={this.handleAddButtonClick}
            addUserImage={this.handleAddUserImage}
            bodyStyle={this.state.itemWrapperStyle}
            cameraType={this.state.cameraType}
            capture={this.state.capture}
            canvasRef={this.setCanvas}
            cameraLoaded={this.state.cameraLoaded}
            changeName={this.handleChangeName}
            changingNameIndex={this.state.changingNameIndex}
            clearUserImage={this.handleClearUserImages}
            downloadUser={this.handleExportUser}
            users={this.props.faceDetector.users}
            moduleLoaded={this.props.moduleLoaded}
            onTrain={this.handleTrainingButton}
            recordCamera={this.handleRecordCamera}
            removeUser={this.handleRemoveUser}
            setCameraType={this.handleSetCameraType}
            selectedIndex={this.state.selectedIndex}
            selectIndex={this.handleSelectIndex}
            training={this.state.training}
            uploadUser={this.handleLoadUser}
            uploadUserImage={this.handleUploadUserImage}
            height={this.state.height}  //rogic-mobile
            width={this.state.width}
        />
    }
}

FaceDetector.propTypes = {
    flyoutRefresh: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func.isRequired,
    faceDetectorUtils: PropTypes.object.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired,
};

const mapStateToProps = state => ({
    faceDetector: state.scratchGui.faceDetector.faceDetector,
    changedFaceDetector: state.scratchGui.faceDetector.changed,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onRequestResetFaceDetectorChanged: () => dispatch(requestResetChanged())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FaceDetector);
