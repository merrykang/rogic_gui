// nodejs module 항목
import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';
import {connect} from 'react-redux';
import JSZip from 'jszip';

// ../components 항목
import ClassifierComponent from '../components/classifier/classifier.jsx';

// ../lib 항목
import ModalResizer from '../lib/modal-resizer';
import ModalVideoManager from '../lib/video/modal-video-manager.js';
import ModalCameraModuleManager from '../lib/camera-module/modal-camera-module-manager.js';
import {handleFileUpload} from '../lib/file-uploader.js';
import downloadBlob from '../lib/download-blob';

// ../reducers 항목
import {closeClassifierModal} from '../reducers/modals.js';
import {showModuleRequestAlert} from '../reducers/alerts';

import ImageProcessing from 'scratch-vm/src/extensions/image_processing/index.js';

const classifierSaveDataVersion = "1.0.0";
class Classifier extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleAccess',
            'handleAddExample',
            'handleRecordCamera',
            'handleAddClass',
            'handleClearClass',
            'handleChangeName',
            'handleDatasetUpload',
            'handleClassifierDataDownload',
            'handleLoaded',
            'handleError',
            'handleOnCancel',
            'handleOnOk',
            'handleTrainingButton',
            'handleRemoveClass',
            'handleSelectIndex',
            'handleSetClassifierData',
            'handleUploadClick',
            'handleUploadSample',
            'handleDownloadSamples',
            'setCanvas',
            'setUploadElement',
            'handleSetCameraType',
            'getFirstClass',
            'getStageCamera',
            'handleResize'  //rogic-mobile
        ]);

        this.state = {
            changingNameIndex: null,
            cameraType: null,
            capture: null,
            access: false,
            cmeraLoaded: true,
            training: false,
            selectedIndex: null,
            classes: {
                name: [],
                exampleLength: [],
                enable: []
            },
            results: {
                name: [],
                rate: []
            },
            height: window.innerHeight,  //rogic-mobile
            width: window.innerWidth
        };
        this.classifierManager = this.props.vm.runtime.classifierManager;
    }

    componentWillMount () {
        this.modalResizer = new ModalResizer();
        this.classifierManager.setThumbnail(true);
        // this.classifierManager.examples가 없다고 에러가 떳었음.
        //this.state.selectedIndex = this.getFirstClass();
    }
    componentDidMount () {
        this.classifierManager.callback = () => {
            this.setState({});
        };
        this.handleResize();  // rogic-mobile
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount () {
        this.props.flyoutRefresh();
        if (this._renderPreviewTimeout) clearTimeout(this._renderPreviewTimeout);
        this.classifierManager.callback = undefined;
        this.classifierManager.setThumbnail(false);
        window.removeEventListener('resize', this.handleResize);  // rogic-mobile
    }
    componentDidUpdate (prevProps, prevState) {
        if (this.props.moduleLoaded === 'Error') {
            this.props.showModuleRequestAlert('classifierModuleLoadingError');
            this.props.closeClassifierModal();
        }
        if (this.state.cameraType !== prevState.cameraType) {
            const cameraType = this.state.cameraType;
            if (cameraType == ImageProcessing.CameraType.WEBCAM) {
                if (this._videoManager) return;
                this.setState({cmeraLoaded: false});
                if (this._renderPreviewTimeout) clearTimeout(this._renderPreviewTimeout);

                if (this._cameraModuleManager) this._cameraModuleManager.disable();
                delete this._cameraModuleManager;
                this._videoManager = new ModalVideoManager(this.canvas);

                this._provider = this._videoManager._provider;
                this._videoManager.enable(this.handleAccess, this.handleLoaded, this.handleError);
            } else if (cameraType == ImageProcessing.CameraType.CAMERAMODULE) {
                if (this._cameraModuleManager) return;
                this.setState({cmeraLoaded: false});
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
        // 모듈 로딩, 학습, 카메라 켜는중 일때 화면 갱신.
        if (this.state.cmeraLoaded !== nextState.cmeraLoaded ||
            this.state.cameraType !== nextState.cameraType ||
            this.state.training !== nextState.training ||
            this.state.selectedIndex !== nextState.selectedIndex ||
            this.state.changingNameIndex !== nextState.changingNameIndex ||
            this.props.moduleLoaded !== nextProps.moduleLoaded ||
            this.state.width !== nextState.width ||  // rogic-mobile
            this.state.height !== nextState.height) {
            return true;
        }

        const classes = this.classifierManager.classes;
        const results = this.classifierManager.results;
        for (let i = 0; i < classes.length; i++) {
            if (classes[i].enable !== this.state.classes.enable[i] ||
                classes[i].examples.length !== this.state.classes.exampleLength[i] ||
                classes[i].name !== this.state.classes.name[i] ||
                results[i].rate !== this.state.results.rate[i] ||
                results[i].name !== this.state.results.name[i]) {
                this.state.classes.enable[i] = classes[i].enable;
                this.state.classes.exampleLength[i] = classes[i].examples.length;
                this.state.classes.name[i] = classes[i].name;
                this.state.results.rate[i] = results[i].rate;
                this.state.results.name[i] = results[i].name;
                return true;
            }
        }
        return false;
    }

    handleSelectIndex (e) {
        const index = e.currentTarget.getAttribute('index');
        this.setState({selectedIndex: Number(index)})
    }
    handleTrainingButton (e) {
        // onTraining 으로 넘어가면서 걸리는 부하 때문에 setState로 화면갱신이 일어나지 않음.
        this.setState({training: true}, () => setTimeout(() => {
            if (this.state.training) this.classifierManager.onTraining()
                .then(() => this.setState({training: false}));
        }, 100));
    }
    handleAddExample (imageData, index) {
        this.classifierManager.onAddExample(imageData, index);
    }
    handleRecordCamera (e) {
        const eventType = e.nativeEvent.type;
        if (eventType == 'mousedown') {
            const index = e.currentTarget.getAttribute('index');
            this.classifierManager.recordCamera(index);
        } else if (eventType == 'mouseup' || eventType == 'mouseout') {
            this.classifierManager.recordCamera(-1);
        }
    }
    handleClearClass (index) {
        this.classifierManager.onClearClass(index);
    }
    handleAddClass (e) {
        const index = e.currentTarget.getAttribute('index');
        this.classifierManager.addClass(index);
        this.setState({selectedIndex: index});
    }
    handleChangeName (e) {
        e.stopPropagation();
        const target = e.currentTarget;
        const index = target.getAttribute('index');
        if (e.type == 'click') {
            this.setState({
                changingNameIndex: Number(index),
                selectedIndex: Number(index)
            }, () => {
                const inputElement = target.getElementsByTagName('input')[0];
                inputElement.focus();
                inputElement.select();
            });
        }
        else if (e.type == 'blur') {
            this.setState({changingNameIndex: null});
            this.classifierManager.rename(index, target.value);
        }
        else if (e.type == 'keydown') {
            // enter, esc입력될때 처리
            switch (e.nativeEvent.keyCode) {
                case 13: // enter
                    target.blur();
                    break;
                case 27: // esc
                    target.value = target.parentElement.getAttribute('name');
                    target.blur();
                    break;
            }
        }
    }
    handleDatasetUpload (e) {
        handleFileUpload(e.target, (buffer) => {
            let input = new Uint8Array(buffer);
            // zip 파일 형식안에 tset.json 파일 읽어 오는 작업
            this.unzip(input);
        }, undefined);
    }
    handleRemoveClass (index) {
        if (index == this.state.selectedIndex) this.setState({selectedIndex: null});
        this.classifierManager.removeClass(index);
    }
    handleSetClassifierData (json) {
        // 데이터 셋 추출, 이름 적용, 결과값 이름 적용
        const dataset = [];
        for (let index = 0; index < json.length; index++) {
            const item = json[index];
            if (item.enable) {
                this.classifierManager.addClass(index);
                this.classifierManager.rename(index, item.name);
            }

            this.classifierManager.setResultName(index, item.result.name);
            if (item.result.name === null) continue;
            delete item.result.name;
            dataset.push(item.result.dataset);
        }
        this.classifierManager.setClassifierDataset(dataset);
    }
    handleClassifierDataDownload (e) {
        // 저장 파일에 모든 파일 추가
        const dataset = this.classifierManager.getClassifierDataset();
        const stringUtil = this.props.vm.getStringUtil();

        dataset.then(datasetJson => {
            // 저장파일용 json 파일 작성
            const obj = [];
            this.classifierManager.classes.map((item, index) => {
                const {
                    enable,
                    name,
                    ...otherData
                } = item;

                if (!obj[index]) obj[index] = {};
                obj[index].name = name;
                obj[index].enable = enable;
                obj[index].version = classifierSaveDataVersion;
            });

            this.classifierManager.results.map((item, index) => {
                const {
                    name,
                    ...otherData
                } = item;

                if (!obj[index].result) obj[index].result = {};
                obj[index].result.name = name;
            });

            datasetJson.map((item) => {
                if (!obj[item.classId].result) obj[item.classId].result = {};
                obj[item.classId].result.dataset = item;
            });
            const string = stringUtil.stringify(obj);

            // 저장하기 위한 zip 생성
            const zip = new JSZip();
            zip.file(`classifier.collection.json`, string);

            let allSamples = [];
            const classes = this.classifierManager.classes;
            for (let i = 0; i < classes.length; i++) {
                allSamples.push(this.handleDownloadSamples(i, classes[i].examples, zip));
            }

            Promise.all(allSamples).then(() => zip.generateAsync({
                type: typeof optZipType === 'string' ? optZipType : 'blob',
                mimeType: 'application/x.scratch.sprite3',
                compression: 'DEFLATE',
                compressionOptions: {level: 6}
            })).then(content => {
                downloadBlob(`classifier.ipcc`, content)
            });
        });
    }
    handleAccess () {
        this.setState({access: true});
    }
    handleLoaded () {
        this.setState({cmeraLoaded: true});

        const stageCamera = this.getStageCamera();
        this._renderPreviewFrame = () => {
            clearTimeout(this._renderPreviewTimeout);
            if (!this._renderPreviewFrame) return;

            this._renderPreviewTimeout = setTimeout(this._renderPreviewFrame,
                this.props.vm.runtime.currentStepTime);

            if (this._provider) {
                let imageData = this._provider.getFrame({
                    format: stageCamera.FORMAT_IMAGE_DATA,
                    cacheTimeout: this.props.vm.runtime.currentStepTime
                });
                if (imageData) {
                    if (!stageCamera.isReady.enabled)
                        this.classifierManager.setFrame(imageData);
                    this.classifierManager.onAddExample(imageData);
                }
            }
        };
        this._renderPreviewFrame();
    }
    handleError () {
        this.setState({
            cmeraLoaded: true,
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
        this.props.closeClassifierModal();
    }
    handleOnOk () {
        this.props.closeClassifierModal();
    }
    handleUploadClick () {
        this.input.click();
    }
    handleSetCameraType (e) {
        const cameraType = e.currentTarget.getAttribute('type');
        if (!this.canvas) return;

        this.setState({cameraType: cameraType});
    }
    setCanvas (canvas) {
        this.canvas = canvas;
    }
    setUploadElement (input) {
        this.input = input;
    }
    unzip (input) {
        //압축을 품
        return JSZip.loadAsync(input)
            .then((zip) => {
                const classifierJson = zip.file('classifier.collection.json');
                if (classifierJson) classifierJson.async('string')
                    .then(string => this.handleSetClassifierData(JSON.parse(string)))
                    .then(() => {
                        // 이미지 파일만 읽음.
                        const regExp = /\.(svg|jpg|jpeg|png|gif|SVG|JPG|JPEG|PNG|GIF)/;
                        return zip.file(regExp);
                    })
                    .then((imageFiles) => {
                        imageFiles.map(file => {
                            //양식에 맞게 저장된 파일을 읽어서 샘플에 추가.
                            const index = String(file.name).substring(0, file.name.lastIndexOf('-'));
                            file.async('uint8array').then((image) => this.handleUploadSample(image, Number(index)));
                        })
                    })
            }).catch(function (err) {
                console.error(err);
            });
    }
    handleUploadSample (uint8array, index) {
        var img = new Image();
        img.addEventListener('load', () => {
            // ImageData로 전환.
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            let imageData = ctx.getImageData(0, 0, img.width, img.height);
            // 사이즈 조정은 vm에서 진행
            this.handleAddExample(imageData, index);
        });
        let blob = new Blob([uint8array], {type: "image/jpeg"});
        let urlCreator = window.URL || window.webkitURL;
        let imageUrl = urlCreator.createObjectURL(blob);
        img.src = imageUrl;
    }
    handleDownloadSamples (index, examples, jszip) {
        //Uint8ClampedArray => Uint8Array 로 바꾸어야 zip.file 추가 가능
        const arrayBuffers = examples.map((example, index) => {
            const canvas = document.createElement("canvas");
            canvas.width = example.width;
            canvas.height = example.height;
            canvas.getContext('2d').putImageData(example, 0, 0);
            return new Promise((resolve, reject) => canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.addEventListener('loadend', () => {
                    resolve({data: reader.result, index: index});
                });
                reader.addEventListener('error', (err) => {
                    reject(err);
                });
                reader.readAsArrayBuffer(blob);
            }, 'image/jpeg'));
        });

        return Promise.all(arrayBuffers).then(array => array.map(item =>
            jszip.file(`${index}-${item.index}.jpg`, new Uint8Array(item.data))));
    }
    getFirstClass () {
        const classifier = this.classifierManager.classes;
        if (!classifier && classifier.length < 1) return false;
        for (let i = 0; i < classifier.length; i++) {
            if (classifier[i].enable === true) return i;
        }
        return false;
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

    handleResize = () => {  //rogic-mobile
        this.setState({
            height: window.innerHeight - (5 * 16),  // header: 5rem
            width: window.innerWidth
        });
    };

    render () {
        return (
            <ClassifierComponent
                useFooter={true}
                useHeader={true}
                useCancelButton={false}
                useOkButton={true}
                onCancel={this.handleOnCancel}
                onOk={this.handleOnOk}

                access={this.state.access}
                addClass={this.handleAddClass}
                addExample={this.handleAddExample}
                bodyStyle={this.state.bodyStyle}
                cameraType={this.state.cameraType}
                capture={this.state.capture}
                canvasRef={this.setCanvas}
                changeName={this.handleChangeName}
                changingNameIndex={this.state.changingNameIndex}
                classes={this.classifierManager.classes}
                clearClass={this.handleClearClass}
                cmeraLoaded={this.state.cmeraLoaded}
                download={this.handleClassifierDataDownload}
                downloadSamples={this.handleDownloadSamples}
                moduleLoaded={this.props.moduleLoaded}
                onTrain={this.handleTrainingButton}
                recordCamera={this.handleRecordCamera}
                removeClass={this.handleRemoveClass}
                results={this.classifierManager.results}
                setUpload={this.setUploadElement}
                setCameraType={this.handleSetCameraType}
                selectedIndex={this.state.selectedIndex}
                selectIndex={this.handleSelectIndex}
                training={this.state.training}
                upload={this.handleDatasetUpload}
                uploadClick={this.handleUploadClick}
                uploadSample={this.handleUploadSample}
                height={this.state.height}  //rogic-mobile
                width={this.state.width}
            />
        );
    }
}

Classifier.propTypes = {
    flyoutRefresh: PropTypes.func,
    moduleLoaded: PropTypes.bool,
    closeClassifierModal: PropTypes.func,
    showModuleRequestAlert: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    closeClassifierModal: () => dispatch(closeClassifierModal()),
    showModuleRequestAlert: (alertId) => dispatch(showModuleRequestAlert(alertId))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Classifier);
