import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import VM from 'scratch-vm';

import Box from '../box/box.jsx';
import DOMElementRenderer from '../../containers/dom-element-renderer.jsx';
import Loupe from '../loupe/loupe.jsx';
import MonitorList from '../../containers/monitor-list.jsx';
import TargetHighlight from '../../containers/target-highlight.jsx';
import GreenFlagOverlay from '../../containers/green-flag-overlay.jsx';
import Question from '../../containers/question.jsx';
import StageControls from '../../containers/stage-controls.jsx';

import MicIndicator from '../mic-indicator/mic-indicator.jsx';
import layout, {STAGE_DISPLAY_SIZES} from '../../lib/layout-constants.js';
import {getStageDimensions} from '../../lib/screen-utils.js';
import styles from './stage.css';

const StageComponent = props => {
    const {
        canvas,
        colorInfo,
        dragRef,
        isColorPicking,
        isFullScreen,
        isStarted,
        micIndicator,
        onDeactivateColorPicker,
        onDoubleClick,
        onQuestionAnswered,
        question,
        stageSize,
        useEditorDragStyle,
        vm,
        ...boxProps
    } = props;

    const stageDimensions = getStageDimensions(stageSize, isFullScreen);
    // isFullScreen 일때 화면 크기 제한
    if (isFullScreen) {
        if (stageDimensions.height < layout.fullSizeMinHeight) stageDimensions.height = layout.fullSizeMinHeight;
        if (stageDimensions.width < parseInt(layout.fullSizeMinHeight * (4 / 3))) stageDimensions.width = parseInt(layout.fullSizeMinHeight * (4 / 3));
    }

    stageDimensions.width = isFullScreen ? stageDimensions.width * 0.85 : stageDimensions.width;
    stageDimensions.height = isFullScreen ? stageDimensions.height * 0.85 : stageDimensions.height;

    // console.log(stageDimensions);
    // #건욱 (To do) : 미디어쿼리? 인지는 모르겠지만 해상도에 의해 무대 크기가 변경되는 것으로 이해 (편집 화면(가칭)에서 무대 사이즈를 키우려면... (일단 추후 다시 진행하는 것으로))

    return (
        <React.Fragment>
            <Box
                className={classNames(
                    styles.stageWrapper,
                    {
                        [styles.fullScreen]: isFullScreen,
                        [styles.withColorPicker]: !isFullScreen && isColorPicking
                    }
                )}
                onDoubleClick={onDoubleClick}
            >
                <Box
                    className={classNames(
                        styles.stage,
                        {[styles.fullScreen]: isFullScreen}
                    )}
                >
                    <DOMElementRenderer
                        domElement={canvas}
                        style={{
                            width: stageDimensions.width,
                            height: stageDimensions.height
                        }}
                        {...boxProps}
                    />

                    {isFullScreen ?
                        <Box className={styles.controlWrapper}>
                            <StageControls
                                isFullScreen={isFullScreen}
                                vm={vm}
                            />
                        </Box> :
                        null
                    }

                    <Box
                        className={styles.monitorWrapper}
                    >
                        <MonitorList
                            draggable={useEditorDragStyle}
                            stageSize={stageDimensions}
                        />
                    </Box>
                    <Box className={styles.frameWrapper}>
                        <TargetHighlight
                            className={styles.frame}
                            stageHeight={stageDimensions.height}
                            stageWidth={stageDimensions.width}
                        />
                    </Box>
                    {isColorPicking && colorInfo ? (
                        <Box className={styles.colorPickerWrapper}>
                            <Loupe colorInfo={colorInfo} />
                        </Box>
                    ) : null}
                </Box>

                <Box
                    className={classNames(
                        styles.stageOverlays,
                        {[styles.fullScreen]: isFullScreen}
                    )}
                >
                    <div
                        className={classNames(
                            styles.stageBottomWrapper,
                            {[styles.fullScreen]: isFullScreen}
                        )}
                        style={{
                            width: stageDimensions.width,
                            height: stageDimensions.height
                        }}
                    >
                        {micIndicator ? (
                            <MicIndicator
                                className={styles.micIndicator}
                                stageSize={stageDimensions}
                            />
                        ) : null}
                        {question === null ? null : (
                            <div
                                className={styles.questionWrapper}
                                style={{width: stageDimensions.width}}
                            >
                                <Question
                                    question={question}
                                    onQuestionAnswered={onQuestionAnswered}
                                />
                            </div>
                        )}
                    </div>
                    <canvas
                        className={styles.draggingSprite}
                        height={0}
                        ref={dragRef}
                        width={0}
                    />
                </Box>

                {/* Playground mode에서 스테이지 가운데 실행 버튼*/}
                {isStarted ? null : (
                    <GreenFlagOverlay
                        className={styles.greenFlagOverlay}
                        wrapperClass={styles.greenFlagOverlayWrapper}
                    />
                )}
            </Box>
            {/*{isColorPicking ? (*/}
            {/*    <Box*/}
            {/*        className={styles.colorPickerBackground}*/}
            {/*        onClick={onDeactivateColorPicker}*/}
            {/*    />*/}
            {/*) : null}*/}
        </React.Fragment>
    );
};
StageComponent.propTypes = {
    canvas: PropTypes.instanceOf(Element).isRequired,
    colorInfo: Loupe.propTypes.colorInfo,
    dragRef: PropTypes.func,
    isColorPicking: PropTypes.bool,
    isFullScreen: PropTypes.bool.isRequired,
    isStarted: PropTypes.bool,
    micIndicator: PropTypes.bool,
    onDeactivateColorPicker: PropTypes.func,
    onDoubleClick: PropTypes.func,
    onQuestionAnswered: PropTypes.func,
    question: PropTypes.string,
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    useEditorDragStyle: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};
StageComponent.defaultProps = {
    dragRef: () => { }
};
export default StageComponent;
