/* eslint-disable react/sort-comp */
import PropTypes from 'prop-types';
import React from 'react';
import {compose} from 'redux';
import {connect} from 'react-redux';
import ReactModal from 'react-modal';
import VM from 'scratch-vm';
import {injectIntl, intlShape} from 'react-intl';

import ErrorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import {
    getIsError,
    getIsShowingProject
} from '../reducers/project-state';
import {
    activateEditorTab,
    BLOCKS_TAB_INDEX,
    PARAMS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX,
    CODE_TAB_INDEX,
    DEV_CODE_TAB_INDEX,
    COSTUMES_EDIT_TAB_INDEX,
} from '../reducers/editor-tab';
import {
    closeCostumeLibrary,
    closeBackdropLibrary,
    openExtensionLibrary
} from '../reducers/modals';
import {setWindowResize} from '../reducers/stage-size';

import FontLoaderHOC from '../lib/font-loader-hoc.jsx';
import LocalizationHOC from '../lib/localization-hoc.jsx';
import SBFileUploaderHOC from '../lib/sb-file-uploader-hoc.jsx';
import ProjectFetcherHOC from '../lib/project-fetcher-hoc.jsx';
import TitledHOC from '../lib/titled-hoc.jsx';
import DesktopHOC from '../lib/desktop-hoc.jsx';
import ProjectSaverHOC from '../lib/project-saver-hoc.jsx';
import storage from '../lib/storage';
import vmListenerHOC from '../lib/vm-listener-hoc.jsx';
import vmManagerHOC from '../lib/vm-manager-hoc.jsx';

import GUIComponent from '../components/gui/gui.jsx';
import {setIsScratchDesktop} from '../lib/isScratchDesktop.js';

class GUI extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            faceDetector: '',
            tabsHeight: window.innerHeight,  //rogic-mobile
            tabsWidth: window.innerWidth,
        };
        this.handleTabsResize = this.handleTabsResize.bind(this);
    }
    componentDidMount () {
        setIsScratchDesktop(this.props.isScratchDesktop);
        this.props.onStorageInit(storage);
        this.props.onVmInit(this.props.vm);
        this.handleTabsResize();
        window.addEventListener('resize', this.handleTabsResize);  // rogic-mobile
    }
    componentWillUnmount () {
        window.removeEventListener('resize', this.handleTabsResize);  // rogic-mobile
    }
    componentDidUpdate (prevProps, prevState) {
        if (this.props.projectId !== prevProps.projectId && this.props.projectId !== null) {
            this.props.onUpdateProjectId(this.props.projectId);
        }
        if (this.props.isShowingProject && !prevProps.isShowingProject) {
            // this only notifies container when a project changes from not yet loaded to loaded
            // At this time the project view in www doesn't need to know when a project is unloaded
            this.props.onProjectLoaded();
        }
        if (!this.props.vm.editingTarget) return;
        if (this.lastTarget === undefined || this.lastTarget === null) {
            // eslint-disable-next-line max-len
            this.lastTarget = this.props.vm.editingTarget.isStage ? 'stage' : !!this.props.vm.editingTarget.isDevice ? 'device' : 'sprite';
            return;
        }
        if (this.props.isTargetEditScreen) {
            // eslint-disable-next-line max-len
            const nowTarget = this.props.vm.editingTarget.isStage ? 'stage' : !!this.props.vm.editingTarget.isDevice ? 'device' : 'sprite';
            const prevTabIndex = prevProps.activeEditorTabIndex;

            if (prevTabIndex === BLOCKS_TAB_INDEX || this.lastTarget !== nowTarget) {
                switch (nowTarget) {
                case 'stage': // 모양, 소리
                    this.props.onActivateEditorTab(COSTUMES_TAB_INDEX);
                    break;
                case 'device': // 속성
                    this.props.onActivateEditorTab(PARAMS_TAB_INDEX);
                    break;
                case 'sprite': // 속성, 모양, 소리
                    this.props.onActivateEditorTab(PARAMS_TAB_INDEX);
                    break;
                default:
                    break;
                }
            }
        }
        // eslint-disable-next-line max-len
        this.lastTarget = this.props.vm.editingTarget.isStage ? 'stage' : !!this.props.vm.editingTarget.isDevice ? 'device' : 'sprite';
        if (prevState.tabsWidth !== this.state.tabsWidth ||  // rogic-mobile
            prevState.tabsHeight !== this.state.tabsHeight) {
            return true;
        }
    }
    handleTabsResize = () => {  //rogic-mobile
        this.setState({
            tabsHeight: window.innerHeight,
            tabsWidth: window.innerWidth
        });
    };
    render () {
        if (this.props.isError) {
            throw new Error(
                `Error in Scratch GUI [location=${window.location}]: ${this.props.error}`);
        }
        const {
            /* eslint-disable no-unused-vars */
            assetHost,
            blockLoading,
            error,
            isError,
            isScratchDesktop,
            isShowingProject,
            onProjectLoaded,
            onStorageInit,
            onUpdateProjectId,
            onVmInit,
            projectHost,
            projectId,
            children,
            fetchingProject,
            isLoading,
            loadingStateVisible,
            ...componentProps
        } = this.props;

        return (
            <GUIComponent
                loading={fetchingProject || isLoading || loadingStateVisible || blockLoading}
                faceDetector={this.state.faceDetector}
                tabsHeight={this.state.tabsHeight}  //rogic-mobile
                tabsWidth={this.state.tabsWidth}
                {...componentProps}
            >
                {children}
            </GUIComponent>
        );
    }
}

GUI.propTypes = {
    assetHost: PropTypes.string,
    children: PropTypes.node,
    desktopAppUpdateDownload: PropTypes.bool,
    desktopAppDownloadParcent: PropTypes.number,
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    fetchingProject: PropTypes.bool,
    intl: intlShape,
    isError: PropTypes.bool,
    isLoading: PropTypes.bool,
    isScratchDesktop: PropTypes.bool,
    isShowingProject: PropTypes.bool,
    loadingStateVisible: PropTypes.bool,
    stageResize: PropTypes.number,
    onProjectLoaded: PropTypes.func,
    onStorageInit: PropTypes.func,
    onUpdateProjectId: PropTypes.func,
    onVmInit: PropTypes.func,
    projectHost: PropTypes.string,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    vm: PropTypes.instanceOf(VM).isRequired
};

GUI.defaultProps = {
    aboutInformation: {},
    isScratchDesktop: false,
    onStorageInit: storageInstance => storageInstance.addOfficialScratchWebStores(),
    onProjectLoaded: () => { },
    onUpdateProjectId: () => { },
    onVmInit: (/* vm */) => { }
};

const mapStateToProps = state => {
    const loadingState = state.scratchGui.projectState.loadingState;

    return {
        activeEditorTabIndex: state.scratchGui.editorTab.activeTabIndex,
        alertsVisible: state.scratchGui.alerts.visible,
        backdropLibraryVisible: state.scratchGui.modals.backdropLibrary,
        blockLoading: state.scratchGui.projectState.workspaceBlockLoading,
        blocksTabVisible: state.scratchGui.editorTab.activeTabIndex === BLOCKS_TAB_INDEX,
        codeTabVisible: (
            state.scratchGui.targets.devices[state.scratchGui.targets.editingTarget] === undefined ?
                state.scratchGui.editorTab.activeTabIndex === CODE_TAB_INDEX :
                state.scratchGui.editorTab.activeTabIndex === DEV_CODE_TAB_INDEX
        ),
        connectionModalVisible: state.scratchGui.modals.connectionModal,
        costumeLibraryVisible: state.scratchGui.modals.costumeLibrary,
        costumesTabVisible: state.scratchGui.editorTab.activeTabIndex === COSTUMES_TAB_INDEX,
        error: state.scratchGui.projectState.error,
        isError: getIsError(loadingState),
        isFullScreen: state.scratchGui.mode.isFullScreen,
        isRightStage: state.scratchGui.mode.isRightStage,
        isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
        isRtl: state.locales.isRtl,
        isShowingProject: getIsShowingProject(loadingState),
        loadingStateVisible: state.scratchGui.modals.loadingProject,
        projectId: state.scratchGui.projectState.projectId,
        soundsTabVisible: (
            state.scratchGui.editorTab.activeTabIndex === SOUNDS_TAB_INDEX &&
            state.scratchGui.targets.devices[state.scratchGui.targets.editingTarget] === undefined
        ),
        soundSyncVisible: state.scratchGui.modals.soundSync,
        targetIsStage: (
            state.scratchGui.targets.stage &&
            state.scratchGui.targets.stage.id === state.scratchGui.targets.editingTarget
        ),
        targetIsSprite: (
            state.scratchGui.targets.sprites[state.scratchGui.targets.editingTarget] !== undefined
        ),
        targetIsDevice: (
            state.scratchGui.targets.devices[state.scratchGui.targets.editingTarget] !== undefined
        ),
        faceDetectorVisible: state.scratchGui.modals.faceDetector,
        uploadModalVisible: state.scratchGui.modals.uploadModal,
        vm: state.scratchGui.vm,
        isTargetEditScreen: state.scratchGui.mode.isTargetEditScreen, // 블록 코딩 화면인가, 편집 화면(가칭)인가 확인하기 위한 플래그
        paramsTabVisible: state.scratchGui.editorTab.activeTabIndex === PARAMS_TAB_INDEX, // 현재 활성화된 탭이 속성 탭인지 여부 확인
        costumesEditTabVisible: state.scratchGui.editorTab.activeTabIndex === COSTUMES_EDIT_TAB_INDEX, // test
    };
};

const mapDispatchToProps = dispatch => ({
    onActivateCodeTab: () => dispatch(activateEditorTab(CODE_TAB_INDEX)),
    onActivateCostumesTab: () => dispatch(activateEditorTab(COSTUMES_TAB_INDEX)),
    onActivateEditorTab: tab => dispatch(activateEditorTab(tab)),
    onActivateSoundsTab: () => dispatch(activateEditorTab(SOUNDS_TAB_INDEX)),
    onActivateDevCodeTab: () => dispatch(activateEditorTab(DEV_CODE_TAB_INDEX)),
    onExtensionButtonClick: () => dispatch(openExtensionLibrary()),
    onRequestCloseBackdropLibrary: () => dispatch(closeBackdropLibrary()),
    onRequestCloseCostumeLibrary: () => dispatch(closeCostumeLibrary()),
    onActivateParamsTab: () => dispatch(activateEditorTab(PARAMS_TAB_INDEX)) // 속성 편집 탭을 누르면 동작
});

const ConnectedGUI = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(GUI));

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGui = compose(
    LocalizationHOC,
    ErrorBoundaryHOC('Top Level App'),
    FontLoaderHOC,
    ProjectFetcherHOC,
    TitledHOC,
    DesktopHOC,
    ProjectSaverHOC,
    vmListenerHOC,
    vmManagerHOC,
    SBFileUploaderHOC,
)(ConnectedGUI);

WrappedGui.setAppElement = ReactModal.setAppElement;
export default WrappedGui;
