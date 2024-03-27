import classNames from 'classnames';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import MediaQuery from 'react-responsive';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import tabStyles from 'react-tabs/style/react-tabs.css';
import VM from 'scratch-vm';
import Renderer from 'scratch-render';

import {setStageSize} from '../../reducers/stage-size';
import Blocks from '../../containers/blocks.jsx';
import CostumeTab from '../../containers/costume-tab.jsx';
import SoundTab from '../../containers/sound-tab.jsx';
import ParamsTab from '../../containers/params-tab.jsx';
import StageWrapper from '../../containers/stage-wrapper.jsx';
import Loader from '../loader/loader.jsx';
import Box from '../box/box.jsx';
import MenuBar from '../menu-bar/menu-bar.jsx';
import CostumeLibrary from '../../containers/costume-library.jsx';
import BackdropLibrary from '../../containers/backdrop-library.jsx';

import WebGlModal from '../../containers/webgl-modal.jsx';
import Alerts from '../../containers/alerts.jsx';
import DragLayer from '../../containers/drag-layer.jsx';
import ConnectionModal from '../../containers/connection-modal/connection-modal.jsx';
import SoundSyncModal from '../../containers/sound-sync-modal/sound-sync-modal.jsx';
import UploadModal from '../../containers/upload-modal.jsx';
import AboutRogicModal from '../about-rogic/about-rogic.jsx';
import MessageModal from '../../containers/message-modal.jsx';
import layout, {STAGE_DISPLAY_SIZES, STAGE_SIZE_MODES} from '../../lib/layout-constants';
import {resolveStageSize, getStageDimensions} from '../../lib/screen-utils';

import styles from './gui.css';
import addExtensionIcon from './icon--extensions.svg';
import {
    COSTUMES_EDIT_TAB_INDEX,
    SOUNDS_EDIT_TAB_INDEX
} from '../../reducers/editor-tab';

const messages = defineMessages({
    addExtension: {
        id: 'gui.gui.addExtension',
        description: 'Button to add an extension in the target pane',
        defaultMessage: 'Add Extension'
    }
});

// Cache this value to only retrieve it once the first time.
// Assume that it doesn't change for a session.
let isRendererSupported = null;

const GUIComponent = props => {
    const {
        aboutInformation,
        aboutRogicVisible,
        activeEditorTabIndex,
        alertsVisible,
        basePath,
        backdropLibraryVisible,
        backpackHost,
        backpackVisible,
        blocksId,
        blocksTabVisible,
        canChangeLanguage,
        canCreateNew,
        canEditTitle,
        canManageFiles,
        canSave,
        canCreateCopy,
        children,
        codeTabVisible,
        connectionModalVisible,
        costumeLibraryVisible,
        faceDetectorVisible,
        costumesTabVisible,
        desktopAppUpdateDownload,
        desktopAppDownloadParcent,
        intl,
        isCreating,
        isFullScreen,
        isPlayerOnly,
        isRtl,
        isRightStage,
        loading,
        messageModalVisible,
        onOpenRegistration,
        onActivateCostumesTab,
        onActivateCodeTab,
        onActivateDevCodeTab,
        onActivateSoundsTab,
        onActivateEditorTab,
        onExtensionButtonClick,
        onRequestCloseBackdropLibrary,
        onRequestCloseCostumeLibrary,
        onRequestSetFaceDetector,
        onRequestWindowResize,
        onShowPrivacyPolicy,
        onStartSelectingFileUpload,
        showComingSoon,
        soundsTabVisible,
        soundSyncVisible,
        stageSizeMode,
        stageResize,
        onSetStageLarge,
        onSetStageSmall,
        targetIsStage,
        targetIsSprite,
        targetIsDevice,
        uploadModalVisible,
        faceDetector,
        vm,
        isTargetEditScreen, // 블록 코딩 화면인가, 편집 화면(가칭)인가 확인하기 위한 플래그
        paramsTabVisible, // 현재 활성화된 탭이 속성 탭인지 여부 확인
        onActivateParamsTab, // 속성 편집 탭을 누르면 동작
        editingTarget, // test
        sprites, // test
        stage, // test
        costumesEditTabVisible, // test
        tabsHeight,  // rogic-mobile
        tabsWidth,
        ...componentProps
    } = omit(props, 'dispatch');

    if (children) {
        return <Box {...componentProps}>{children}</Box>;
    }
    const tabClassNames = {
        tabs: styles.tabs,
        tab: classNames(tabStyles.reactTabsTab, styles.tab),
        tabList: classNames(tabStyles.reactTabsTabList, styles.tabList),
        tabPanel: classNames(tabStyles.reactTabsTabPanel, styles.tabPanel),
        tabPanelSelected: classNames(tabStyles.reactTabsTabPanelSelected, styles.isSelected),
        tabSelected: classNames(tabStyles.reactTabsTabSelected, styles.isSelected)
    };
    if (isRendererSupported === null) {
        isRendererSupported = Renderer.isSupported();
    }
    const resizeMaxWidth = function (stageSize) {
        // eslint-disable-next-line max-len
        const width = Number(getStageDimensions(STAGE_SIZE_MODES.resize).width) + Number(parseFloat(getComputedStyle(document.documentElement).fontSize)) + 2;
        const style = {
            maxWidth: width
        };
        if (stageSize === STAGE_DISPLAY_SIZES.resize) return style;
        else if (stageSize === STAGE_DISPLAY_SIZES.resizeConstrained) return style;
        return null;
    };

    return (<MediaQuery
        minHeight={layout.fullSizeMinHeight}
        minWidth={layout.fullSizeMinWidth}
    >
        {isFullSize => {
            const stageSize = resolveStageSize(stageSizeMode, isFullSize);         
            const paramsTab = (
                <Tab
                    className={tabClassNames.tab}
                    onClick={onActivateParamsTab}
                    style={{display: targetIsStage ? 'none' : 'flex'}}
                >
                    {'속성'} {/* FormattedMessage 추후 적용 */}
                </Tab>
            );           
            const costumeTab = (
                // eslint-disable-next-line no-negated-condition
                !targetIsDevice ?
                    (<Tab
                        className={tabClassNames.tab}
                        onClick={onActivateCostumesTab}
                    >
                        {targetIsStage ? (
                            <FormattedMessage
                                defaultMessage="Backdrops"
                                description="Button to get to the backdrops panel"
                                id="gui.gui.backdropsTab"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Costumes"
                                description="Button to get to the costumes panel"
                                id="gui.gui.costumesTab"
                            />
                        )}
                    </Tab>) :
                    null
            );
            const soundTab = (
                !targetIsDevice ?
                    (<Tab
                        className={tabClassNames.tab}
                        onClick={onActivateSoundsTab}
                    >
                        <FormattedMessage
                            defaultMessage="Sounds"
                            description="Button to get to the sounds panel"
                            id="gui.gui.soundsTab"
                        />
                    </Tab>) :
                    null
            );
            const targetEditScreen = () => {
                if (activeEditorTabIndex === COSTUMES_EDIT_TAB_INDEX) {
                    return (
                        <CostumeTab vm={vm}/>
                    );
                } else if (activeEditorTabIndex === SOUNDS_EDIT_TAB_INDEX) {
                    return (
                        <SoundTab vm={vm}/>
                    );
                }
                return (
                    <Box
                        className={styles.stageAndTargetWrapper}
                    >
                        <Box
                            className={styles.targetWrapper}
                        >
                            {/* 타겟 편집 화면 내 탭 영역 */}
                            <Tabs
                                forceRenderTabPanel
                                className={targetIsDevice ? styles.tabsDevice : tabClassNames.tabs}  // rogic-mobile
                                selectedIndex={activeEditorTabIndex}
                                selectedTabClassName={tabClassNames.tabSelected}
                                selectedTabPanelClassName={tabClassNames.tabPanelSelected}
                                onSelect={onActivateEditorTab}
                            >
                                <TabList className={tabClassNames.tabList}>
                                    {paramsTab}
                                    {costumeTab}
                                    {soundTab}
                                </TabList>

                                <TabPanel className={tabClassNames.tabPanel}>
                                    {paramsTabVisible ? <ParamsTab vm={vm}/> : null}
                                </TabPanel>

                                {targetIsDevice ?
                                    null :
                                    <TabPanel className={tabClassNames.tabPanel}>
                                        {costumesTabVisible ? <CostumeTab vm={vm}/> : null}
                                    </TabPanel>
                                }
                                {targetIsDevice ?
                                    null :
                                    <TabPanel className={tabClassNames.tabPanel}>
                                        {soundsTabVisible ? <SoundTab vm={vm}/> : null}
                                    </TabPanel>
                                }
                            </Tabs>
                            {/* end targetWrapper*/}
                        </Box>
                        {/* end stageAndTargetWrapper */}
                    </Box>
                );
            };
            return isPlayerOnly ? (
                <StageWrapper
                    isFullScreen={isFullScreen}
                    isRendererSupported={isRendererSupported}
                    isRtl={isRtl}
                    isRightStage={isRightStage}
                    loading={loading}
                    stageSize={STAGE_SIZE_MODES.large}
                    vm={vm}
                >
                    {alertsVisible ? (
                        <Alerts className={styles.alertsContainer} />
                    ) : null}
                </StageWrapper>
            ) : (
                <Box
                    className={styles.pageWrapper}
                    dir={isRtl ? 'rtl' : 'ltr'}
                    // Stage가 위치 하는 방향 true - right / false - left
                    // stagedir={isRightStage ? 'right' : 'left'}
                    {...componentProps}
                >
                    {messageModalVisible ? (
                        <MessageModal />
                    ) : null}
                    {loading ? (
                        <Loader />
                    ) : null}
                    {isCreating ? (
                        <Loader messageId="gui.loader.creating" />
                    ) : null}
                    {isRendererSupported ? null : (
                        <WebGlModal isRtl={isRtl} />
                    )}
                    {alertsVisible ? (
                        <Alerts className={styles.alertsContainer} />
                    ) : null}
                    {connectionModalVisible ? (
                        <ConnectionModal
                            vm={vm}
                        />
                    ) : null}
                    {uploadModalVisible ? (
                        <UploadModal
                            vm={vm}
                        />
                    ) : null}
                    {soundSyncVisible ? (
                        <SoundSyncModal
                            vm={vm}
                        />
                    ) : null}
                    {costumeLibraryVisible ? (
                        <CostumeLibrary
                            vm={vm}
                            onRequestClose={onRequestCloseCostumeLibrary}
                        />
                    ) : null}
                    {backdropLibraryVisible ? (
                        <BackdropLibrary
                            vm={vm}
                            onRequestClose={onRequestCloseBackdropLibrary}
                        />
                    ) : null}
                    {aboutRogicVisible ? (
                        <AboutRogicModal
                            productName={aboutInformation.productName}
                            version={aboutInformation.version}
                        />
                    ) : null}
                    <MenuBar
                        canChangeLanguage={canChangeLanguage}
                        canCreateCopy={canCreateCopy}
                        canCreateNew={canCreateNew}
                        canEditTitle={canEditTitle}
                        canManageFiles={canManageFiles}
                        canSave={canSave}
                        className={styles.menuBarPosition}
                        desktopAppUpdateDownload={desktopAppUpdateDownload}
                        desktopAppDownloadParcent={desktopAppDownloadParcent}
                        showComingSoon={showComingSoon}
                        onOpenRegistration={onOpenRegistration}
                        onStartSelectingFileUpload={onStartSelectingFileUpload}
                        isTargetEditScreen={isTargetEditScreen} // 화면 설계 변경에 의해 다시 삭제할 수 있음
                        activeEditorTabIndex={activeEditorTabIndex} // test
                        targetIsStage={targetIsStage}
                    />
                        <Box
                            className={styles.bodyWrapper}
                            style={isTargetEditScreen ? {height: 'auto'} : {height: `calc(100% - ${16 * 5}px)`}}  // rogic-mobile
                        >
                        <Box className={isTargetEditScreen ? styles.flexWrapper : styles.blockWrapper}>
                            <Box
                                className={styles.editorWrapper}
                                style={{display: isTargetEditScreen ? 'none' : 'flex'}}
                            >
                                <Box className={styles.blocksWrapper}>
                                    <Blocks
                                        key={blocksId}
                                        grow={1}
                                        isVisible={!isTargetEditScreen}
                                        options={{
                                            media: `${basePath}static/blocks-media/`
                                        }}
                                        stageSize={stageSize}
                                        stageResize={stageResize}
                                        isRightStage={isRightStage}
                                        faceDetector={faceDetector}
                                        vm={vm}
                                    />
                                </Box>
                                <Box className={styles.extensionButtonContainer}>
                                    <button
                                        className={styles.extensionButton}
                                        title={intl.formatMessage(messages.addExtension)}
                                        onClick={onExtensionButtonClick}
                                    >
                                        <img
                                            className={styles.extensionButtonIcon}
                                            draggable={false}
                                            src={addExtensionIcon}
                                        />
                                    </button>
                                </Box> {/* end extensionButtonContainer */}
                            </Box> {/* end editorWrapper */}
                            { isTargetEditScreen ? targetEditScreen() : null }
                            <StageWrapper
                                isFullScreen={isFullScreen}
                                isRendererSupported={isRendererSupported}
                                isRtl={isRtl}
                                stageSize={stageSize}
                                vm={vm}
                                isTargetEditScreen={isTargetEditScreen}
                                activeEditorTabIndex={activeEditorTabIndex}
                            />
                        </Box> {/* end flexWrapper */}
                    </Box> {/* end bodyWrapper */}
                    <DragLayer />
                </Box>
            );
        }}</MediaQuery >);
};

GUIComponent.propTypes = {
    aboutInformation: PropTypes.object,
    activeEditorTabIndex: PropTypes.number,
    backdropLibraryVisible: PropTypes.bool,
    backpackHost: PropTypes.string,
    backpackVisible: PropTypes.bool,
    basePath: PropTypes.string,
    blocksTabVisible: PropTypes.bool,
    blocksId: PropTypes.string,
    canChangeLanguage: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canSave: PropTypes.bool,
    children: PropTypes.node,
    codeTabVisible: PropTypes.bool,
    costumeLibraryVisible: PropTypes.bool,
    faceDetectorVisible: PropTypes.bool,
    costumesTabVisible: PropTypes.bool,
    desktopAppUpdateDownload: PropTypes.bool,
    desktopAppDownloadParcent: PropTypes.number,
    intl: intlShape.isRequired,
    isCreating: PropTypes.bool,
    isFullScreen: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    isRightStage: PropTypes.bool,
    isShared: PropTypes.bool,
    loading: PropTypes.bool,
    messageModalVisible: PropTypes.bool,
    onActivateCostumesTab: PropTypes.func,
    onActivateCodeTab: PropTypes.func,
    onActivateDevCodeTab: PropTypes.func,
    onActivateSoundsTab: PropTypes.func,
    onActivateEditorTab: PropTypes.func,
    onExtensionButtonClick: PropTypes.func,
    onOpenRegistration: PropTypes.func,
    onRequestCloseBackdropLibrary: PropTypes.func,
    onRequestCloseCostumeLibrary: PropTypes.func,
    onRequestSetFaceDetector: PropTypes.func,
    onRequestWindowResize: PropTypes.func,
    onShowPrivacyPolicy: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onTabSelect: PropTypes.func,
    showComingSoon: PropTypes.bool,
    soundsTabVisible: PropTypes.bool,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    stageResize: PropTypes.number,
    targetIsStage: PropTypes.bool,
    targetIsSprite: PropTypes.bool,
    targetIsDevice: PropTypes.bool,
    faceDetector: PropTypes.string,
    vm: PropTypes.instanceOf(VM).isRequired,
    isTargetEditScreen: PropTypes.bool, // 블록 코딩 화면인가, 편집 화면(가칭)인가 확인하기 위한 플래그
    paramsTabVisible: PropTypes.bool, // 현재 활성화된 탭이 속성 탭인지 여부 확인
    onActivateParamsTab: PropTypes.func, // 속성 편집 탭을 누르면 동작
    costumesEditTabVisible: PropTypes.bool, // test
    tabsHeight: PropTypes.number,  // rogic-mobile
    tabsWidth: PropTypes.number
};

GUIComponent.defaultProps = {
    backpackHost: null,
    backpackVisible: false,
    basePath: './',
    canChangeLanguage: true,
    canCreateNew: false,
    canEditTitle: false,
    canManageFiles: true,
    canSave: false,
    canCreateCopy: false,
    isCreating: false,
    isRightStage: false,
    loading: false,
    showComingSoon: false,
    stageSizeMode: STAGE_SIZE_MODES.large
};

const mapStateToProps = state => ({
    aboutRogicVisible: state.scratchGui.modals.aboutRogic,
    messageModalVisible: state.scratchGui.modals.messageModal,
    stageSizeMode: state.scratchGui.stageSize.stageSize
});

const mapDispatchToProps = dispatch => ({
    onSetStageLarge: () => dispatch(setStageSize(STAGE_SIZE_MODES.large)),
    onSetStageSmall: () => dispatch(setStageSize(STAGE_SIZE_MODES.small))
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(GUIComponent));
