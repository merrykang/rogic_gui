import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';

import Box from '../box/box.jsx';
import {STAGE_DISPLAY_SIZES} from '../../lib/layout-constants.js';
import {getStageDimensions} from '../../lib/screen-utils';
import StageHeader from '../../containers/stage-header.jsx';
import StageControls from '../../containers/stage-controls.jsx';
import Stage from '../../containers/stage.jsx';
import Loader from '../loader/loader.jsx';

import styles from './stage-wrapper.css';

import classNames from 'classnames';
import {BLOCKS_TAB_INDEX} from '../../reducers/editor-tab.js';

const StageWrapperComponent = function (props) {
    const {
        isFullScreen,
        // isRtl,
        isRendererSupported,
        loading,
        stageSize,
        vm,
        isTargetEditScreen, // 블록 코딩 화면인가, 편집 화면(가칭)인가 확인하기 위한 플래그
        activeEditorTabIndex
    } = props;
    const stageDimensions = getStageDimensions(stageSize, false);
    const stageInTargetEditScreen = (
        <Box
            // eslint-disable-next-line max-len
            className={activeEditorTabIndex > BLOCKS_TAB_INDEX ? classNames(styles.stageWrapper, styles.stageWrapperHidden) : styles.stageWrapper}
        >
            <Box className={styles.stageMenuWrapper}>
                <StageHeader stageSize={stageSize} />
            </Box>
            <Box className={styles.stageCanvasWrapper}>
                    {isRendererSupported ?
                    <Stage
                        className={styles.stageCanvas}
                        isFullScreen={isFullScreen}
                        stageSize={stageSize}
                        vm={vm}
                        /> :
                        null
                }
                <div className={styles.stageCanvasControls}>
                    {isFullScreen ?
                        <Box
                            className={styles.stageDummy}
                            style={{
                                width: `calc(${stageDimensions.width}px + 0.125rem)`,
                                height: `calc(${stageDimensions.height}px + 0.125rem)`
                            }}
                        /> : null}
                        <StageControls
                            isFullScreen={false}
                            vm={vm}
                    />
                </div>
            </Box>
            {loading ? (
                <Loader isFullScreen={isFullScreen} />
            ) : null}
        </Box>
    );
    const stageInBlockScreen = (
        <Box className={styles.stageWrapper}>
            <Box className={styles.stageCanvasWrapper}>
                {isRendererSupported ?
                    <Stage
                        isFullScreen={isFullScreen}
                        stageSize={stageSize}
                        vm={vm}
                    /> : null}
                <StageControls
                    isFullScreen={false}
                    vm={vm}
                    isBlocklyWorkspaceUse
                />
            </Box>
        </Box>
    );

    return (
        isTargetEditScreen ? stageInTargetEditScreen : stageInBlockScreen
    );
    
};

StageWrapperComponent.propTypes = {
    isFullScreen: PropTypes.bool,
    isRendererSupported: PropTypes.bool.isRequired,
    // isRtl: PropTypes.bool.isRequired,
    loading: PropTypes.bool,
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    vm: PropTypes.instanceOf(VM).isRequired,
    isTargetEditScreen: PropTypes.bool, // 블록 코딩 화면인가, 편집 화면(가칭)인가 확인하기 위한 플래그
    activeEditorTabIndex: PropTypes.number
};

export default StageWrapperComponent;
