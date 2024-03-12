import bindAll from 'lodash.bindall';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {intlShape, injectIntl} from 'react-intl';

import {
    openSpriteLibrary,
    closeSpriteLibrary,
    openDeviceLibrary,
    closeDeviceLibrary
} from '../reducers/modals';
import {
    activateEditorTab,
    COSTUMES_TAB_INDEX,
    BLOCKS_TAB_INDEX
} from '../reducers/editor-tab';
import {
    activateObjectTab,
    spriteTargetObject,
    deviceTargetObject,
    BACKDROPS_TAB_INDEX,
    SPRITES_TAB_INDEX,
    DEVICES_TAB_INDEX
} from '../reducers/object-tab';

import {setReceivedBlocks} from '../reducers/hovered-target';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';
import {setRestore} from '../reducers/restore-deletion';
import DragConstants from '../lib/drag-constants';
import TargetPaneComponent from '../components/target-pane/target-pane.jsx';
import {BLOCKS_DEFAULT_SCALE} from '../lib/layout-constants';
import spriteLibraryContent from '../lib/libraries/sprites.json';
import {handleFileUpload, spriteUpload} from '../lib/file-uploader.js';
import sharedMessages from '../lib/shared-messages';
import {emptySprite} from '../lib/empty-assets';
import {highlightTarget} from '../reducers/targets';
import {fetchSprite, fetchCode} from '../lib/backpack-api';
import randomizeSpritePosition from '../lib/randomize-sprite-position';
import downloadBlob from '../lib/download-blob';
import {getStageDimensions} from '../lib/screen-utils';
import BlockDisable from '../lib/block-disable';

class TargetPane extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleActivateBlocksTab',
            'handleBlockDragEnd',
            'handleChangeDeviceName',
            'handleChangeSpriteRotationStyle',
            'handleChangeSpriteDirection',
            'handleChangeSpriteName',
            'handleChangeSpriteSize',
            'handleChangeSpriteVisibility',
            'handleChangeSpriteX',
            'handleChangeSpriteY',
            'handleDeleteSprite',
            'handleDrop',
            'handleDuplicateSprite',
            'handleExportSprite',
            'handleExportSpriteToScratch',
            'handleNewSprite',
            'handleSelectSprite',
            'handleSurpriseSpriteClick',
            'handlePaintSpriteClick',
            'handleFileUploadClick',
            'handleSpriteUpload',
            'setFileInput',
            'shareBlocks',
            'handleRaiseSpritesInfo',
            'setTabIndex'  // rogic-mobile
        ]);
        // object type를 블록 복사 시킬 오브젝트 정보를 state에
        this.state = {
            raiseSpritesInfo: null,
            tabIndex: 0,  // rogic-mobile
            showTabs: true
        };
    }
    componentDidMount () {
        this.props.vm.addListener('BLOCK_DRAG_END', this.handleBlockDragEnd);
    }
    componentWillUnmount () {
        this.props.vm.removeListener('BLOCK_DRAG_END', this.handleBlockDragEnd);
    }
    componentWillUpdate (nextProps, nextState) {
        if (this.props.editingTarget != nextProps.editingTarget) {
            // editingTarget이 변하면 state에 저장, target의 종류와 탭이 일치 하지 않으면 탭 변경
            if (nextProps.devices[nextProps.editingTarget]) {
                this.props.saveDeviceTarget(nextProps.editingTarget);
                if (nextProps.activeObjectTabIndex != 2) this.props.onActivateDevicesTab();
            }
            else if (nextProps.editingTarget != nextProps.stage.id) {
                this.props.saveSprtieTarget(nextProps.editingTarget);
                if (nextProps.activeObjectTabIndex != 1) this.props.onActivateSpritesTab();
            }

            // 블록 비활성화를 위한 타겟 정보 변경
            BlockDisable.editingTarget = this.props.vm.editingTarget;
            BlockDisable.checkCodeBlock();
            BlockDisable.checkFlyoutBlock();
        }
        // 블록이 밖에 나갔을 때, 안으로 들어왔을 때 동작
        if (this.props.raiseSprites !== nextProps.raiseSprites) {
            this.handleRaiseSpritesInfo(nextProps, nextProps.raiseSprites);
        }
        //활성화 탭이 변경되고 targetChangeEvent가 true일때 선택된 스프라이트를 바꿔줌
        if (this.props.activeObjectTabIndex != nextProps.activeObjectTabIndex && nextProps.targetChangeEvent) {
            switch (nextProps.activeObjectTabIndex) {
                case 0:
                    this.handleSelectSprite(nextProps.stage.id);
                    break;
                case 1:
                    this.handleSelectSprite(this.props.spriteTargetId);
                    break;
                case 2:
                    this.handleSelectSprite(this.props.deviceTargetId);
                    break;
            }
        }
    }
    handleChangeDeviceName (name) {
        this.props.vm.renameSprite(this.props.editingTarget, name);
    }
    handleChangeSpriteDirection (direction) {
        this.props.vm.postSpriteInfo({direction});
    }
    handleChangeSpriteRotationStyle (rotationStyle) {
        this.props.vm.postSpriteInfo({rotationStyle});
    }
    handleChangeSpriteName (name) {
        this.props.vm.renameSprite(this.props.editingTarget, name);
    }
    handleChangeSpriteSize (size) {
        this.props.vm.postSpriteInfo({size});
    }
    handleChangeSpriteVisibility (visible) {
        this.props.vm.postSpriteInfo({visible});
    }
    handleChangeSpriteX (x) {
        this.props.vm.postSpriteInfo({x});
    }
    handleChangeSpriteY (y) {
        this.props.vm.postSpriteInfo({y});
    }
    handleDeleteSprite (id) {
        const target = this.props.vm.runtime.getTargetById(id);
        if (target) {
            const restoreSprite = this.props.vm.deleteSprite(id);
            const restoreFun = () => restoreSprite().then(this.handleActivateBlocksTab);
            if (target.isDevice) {
                this.props.dispatchUpdateRestore({
                    restoreFun: restoreFun,
                    deletedItem: 'Device'
                });
            } else {
                this.props.dispatchUpdateRestore({
                    restoreFun: restoreFun,
                    deletedItem: 'Sprite'
                });
            }
        }

    }
    handleDuplicateSprite (id) {
        this.props.vm.duplicateSprite(id);
    }
    handleExportSprite (id) {
        const spriteName = this.props.vm.runtime.getTargetById(id).getName();
        const saveLink = document.createElement('a');
        document.body.appendChild(saveLink);

        this.props.vm.exportRso(id).then(content => {
            downloadBlob(`${spriteName}.rso`, content);
        });
    }
    handleExportSpriteToScratch (id) {
        const spriteName = this.props.vm.runtime.getTargetById(id).getName();
        const saveLink = document.createElement('a');
        document.body.appendChild(saveLink);

        this.props.vm.exportSprite(id).then(content => {
            downloadBlob(`${spriteName}.sprite3`, content);
        });
    }
    handleSelectSprite (id) {
        this.props.vm.setEditingTarget(id);

        if (this.props.stage && id !== this.props.stage.id) {
            this.props.onHighlightTarget(id);
        }
    }
    handleSurpriseSpriteClick () {
        const surpriseSprites = spriteLibraryContent.filter(sprite =>
            (sprite.tags.indexOf('letters') === -1) && (sprite.tags.indexOf('numbers') === -1)
        );
        const item = surpriseSprites[Math.floor(Math.random() * surpriseSprites.length)];
        randomizeSpritePosition(item);
        this.props.vm.addSprite(JSON.stringify(item))
            .then(this.handleActivateBlocksTab);
    }
    handlePaintSpriteClick () {
        const formatMessage = this.props.intl.formatMessage;
        const emptyItem = emptySprite(
            formatMessage(sharedMessages.sprite, {index: 1}),
            formatMessage(sharedMessages.pop),
            formatMessage(sharedMessages.costume, {index: 1})
        );
        this.props.vm.addSprite(JSON.stringify(emptyItem)).then(() => {
            setTimeout(() => { // Wait for targets update to propagate before tab switching
                this.props.onActivateEditorTab(COSTUMES_TAB_INDEX);
            });
        });
    }
    handleActivateBlocksTab () {
        this.props.onActivateEditorTab(BLOCKS_TAB_INDEX);
    }
    handleNewSprite (spriteJSONString) {
        return this.props.vm.addSprite(spriteJSONString)
            .then(this.handleActivateBlocksTab());
    }
    handleFileUploadClick () {
        this.fileInput.click();
    }
    handleSpriteUpload (e) {
        const storage = this.props.vm.runtime.storage;
        this.props.onShowImporting();
        handleFileUpload(e.target, (buffer, fileType, fileName, fileIndex, fileCount) => {
            spriteUpload(buffer, fileType, fileName, storage, newSprite => {
                this.handleNewSprite(newSprite)
                    .then(() => {
                        if (fileIndex === fileCount - 1) {
                            this.props.onCloseImporting();
                        }
                    })
                    .catch(this.props.onCloseImporting);
            }, this.props.onCloseImporting);
        }, this.props.onCloseImporting);
    }
    setFileInput (input) {
        this.fileInput = input;
    }
    //블록복사 서로 오브잭트 종류가 같아야 복사 되게끔 설정
    handleBlockDragEnd (blocks) {
        // hoveredTarget이 없으면 종료
        if (!this.props.hoveredTarget.sprite) return;
        // 같은 target에 복사 중이면 종료
        if (this.props.hoveredTarget.sprite === this.props.editingTarget) return;

        const hoveredTarget = this.props.vm.runtime.getTargetById(this.props.hoveredTarget.sprite);
        const target = this.props.vm.editingTarget;
        // 무대 블록 복사 중이면 종료 (스프라이트 - 무대 사용 블록 종류가 다름)
        if (hoveredTarget.isStage || target.isStage) return;
        // 장치 - 스프라이트 복사 중이면 종료
        if (hoveredTarget.isDevice !== target.isDevice) return;
        // 장치 종류가 다르면 종료
        const isDevice = (hoveredTarget.isDevice && target.isDevice);
        if (isDevice && hoveredTarget.device.deviceId !== target.device.deviceId) return;

        this.shareBlocks(blocks, this.props.hoveredTarget.sprite, this.props.editingTarget);
        this.props.onReceivedBlocks(true);
    }
    shareBlocks (blocks, targetId, optFromTargetId) {
        // Position the top-level block based on the scroll position.
        const topBlock = blocks.find(block => block.topLevel);
        if (topBlock) {
            let metrics;
            if (this.props.workspaceMetrics.targets[targetId]) {
                metrics = this.props.workspaceMetrics.targets[targetId];
            } else {
                metrics = {
                    scrollX: 0,
                    scrollY: 0,
                    scale: BLOCKS_DEFAULT_SCALE
                };
            }
            // Determine position of the top-level block based on the target's workspace metrics.
            const {scrollX, scrollY, scale} = metrics;
            const posY = -scrollY + 30;
            let posX;
            if (this.props.isRtl) {
                posX = scrollX + 30;
            } else {
                posX = -scrollX + 30;
            }

            // Actually apply the position!
            topBlock.x = posX / scale;
            topBlock.y = posY / scale;
        }
        return this.props.vm.shareBlocksToTarget(blocks, targetId, optFromTargetId);
    }
    handleDrop (dragInfo) {
        const {sprite: targetId} = this.props.hoveredTarget;
        if (dragInfo.dragType === DragConstants.SPRITE) {
            // Add one to both new and target index because we are not counting/moving the stage
            this.props.vm.reorderTarget(dragInfo.index + 1, dragInfo.newIndex + 1, this.props.activeObjectTabIndex);
        } else if (dragInfo.dragType === DragConstants.BACKPACK_SPRITE) {
            // TODO storage does not have a way of loading zips right now, and may never need it.
            // So for now just grab the zip manually.
            fetchSprite(dragInfo.payload.bodyUrl)
                .then(sprite3Zip => this.props.vm.addSprite(sprite3Zip));
        } else if (targetId) {
            // Something is being dragged over one of the sprite tiles or the backdrop.
            // Dropping assets like sounds and costumes duplicate the asset on the
            // hovered target. Shared costumes also become the current costume on that target.
            // However, dropping does not switch the editing target or activate that editor tab.
            // This is based on 2.0 behavior, but seems like it keeps confusing switching to a minimum.
            // it allows the user to share multiple things without switching back and forth.
            if (dragInfo.dragType === DragConstants.COSTUME) {
                this.props.vm.shareCostumeToTarget(dragInfo.index, targetId);
            } else if (targetId && dragInfo.dragType === DragConstants.SOUND) {
                this.props.vm.shareSoundToTarget(dragInfo.index, targetId);
            } else if (dragInfo.dragType === DragConstants.BACKPACK_COSTUME) {
                // In scratch 2, this only creates a new sprite from the costume.
                // We may be able to handle both kinds of drops, depending on where
                // the drop happens. For now, just add the costume.
                this.props.vm.addCostume(dragInfo.payload.body, {
                    name: dragInfo.payload.name
                }, targetId);
            } else if (dragInfo.dragType === DragConstants.BACKPACK_SOUND) {
                this.props.vm.addSound({
                    md5: dragInfo.payload.body,
                    name: dragInfo.payload.name
                }, targetId);
            } else if (dragInfo.dragType === DragConstants.BACKPACK_CODE) {
                fetchCode(dragInfo.payload.bodyUrl)
                    .then(blocks => this.shareBlocks(blocks, targetId))
                    .then(() => this.props.vm.refreshWorkspace());
            }
        }
    }
    handleRaiseSpritesInfo (nextProps, raiseSprites) {
        if (raiseSprites) {
            let targetDeviceinfo;
            if (!nextProps.vm.editingTarget.isDevice) targetDeviceinfo = 'sprite';
            else targetDeviceinfo = nextProps.vm.editingTarget.sprite.deviceId;
            this.setState({raiseSpritesInfo: targetDeviceinfo});
        } else {
            this.setState({raiseSpritesInfo: null});
        }
    }
    setTabIndex (index) {  // rogic-mobile
        this.setState({tabIndex: index});
    };
    render () {
        const {
            dispatchUpdateRestore,
            isRtl,
            onActivateEditorTab,
            onCloseImporting,
            onHighlightTarget,
            onReceivedBlocks,
            onShowImporting,
            raiseSprites, // this.state.raiseSpritesInfo 로 값을 보냄
            workspaceMetrics,
            ...componentProps
        } = this.props;
        /* eslint-enable no-unused-vars */
        const convertRemToPixels = function (rem) {
            return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
        }
        let height = this.props.windowHeight
        height -= convertRemToPixels(3); // menu bar height
        height -= convertRemToPixels(2.75) * 2; // stage munu height 2개
        height -= getStageDimensions(this.props.stageSize, this.props.isFullScreen).height; // stage height
        height -= convertRemToPixels(2.5); // target pane tab height
        height -= 3;// target pane tab bottom padding
        return (
            <TargetPaneComponent
                {...componentProps}
                fileInputRef={this.setFileInput}
                onActivateBlocksTab={this.handleActivateBlocksTab}
                onChangeDeviceName={this.handleChangeDeviceName}
                onChangeSpriteDirection={this.handleChangeSpriteDirection}
                onChangeSpriteName={this.handleChangeSpriteName}
                onChangeSpriteRotationStyle={this.handleChangeSpriteRotationStyle}
                onChangeSpriteSize={this.handleChangeSpriteSize}
                onChangeSpriteVisibility={this.handleChangeSpriteVisibility}
                onChangeSpriteX={this.handleChangeSpriteX}
                onChangeSpriteY={this.handleChangeSpriteY}
                onDeleteSprite={this.handleDeleteSprite}
                onDrop={this.handleDrop}
                onDuplicateSprite={this.handleDuplicateSprite}
                onExportSprite={this.handleExportSprite}
                onExportSpriteToScratch={this.handleExportSpriteToScratch}
                onFileUploadClick={this.handleFileUploadClick}
                onPaintSpriteClick={this.handlePaintSpriteClick}
                onSelectSprite={this.handleSelectSprite}
                onSpriteUpload={this.handleSpriteUpload}
                onSurpriseSpriteClick={this.handleSurpriseSpriteClick}
                selectorHeight={height}
                raiseSpritesInfo={this.state.raiseSpritesInfo}
                tabIndex={this.state.tabIndex}  // rogic-mobile
                setTabIndex={this.setTabIndex}
                showTabs={this.state.showTabs}
            />
        );
    }
}

const {
    onSelectSprite, // eslint-disable-line no-unused-vars
    onActivateBlocksTab, // eslint-disable-line no-unused-vars
    ...targetPaneProps
} = TargetPaneComponent.propTypes;

TargetPane.propTypes = {
    intl: intlShape.isRequired,
    onCloseImporting: PropTypes.func,
    onShowImporting: PropTypes.func,
    windowHeight: PropTypes.number,
    windowWidth: PropTypes.number,
    ...targetPaneProps
};

const mapStateToProps = state => ({
    activeObjectTabIndex: state.scratchGui.objectTab.activeTabIndex,
    targetChangeEvent: state.scratchGui.objectTab.targetChangeEvent,
    spriteTargetId: state.scratchGui.objectTab.spriteTargetId,
    deviceTargetId: state.scratchGui.objectTab.deviceTargetId,
    editingTarget: state.scratchGui.targets.editingTarget,
    hoveredTarget: state.scratchGui.hoveredTarget,
    isRtl: state.locales.isRtl,
    spriteLibraryVisible: state.scratchGui.modals.spriteLibrary,
    sprites: state.scratchGui.targets.sprites,
    devices: state.scratchGui.targets.devices,
    stage: state.scratchGui.targets.stage,
    raiseSprites: state.scratchGui.blockDrag,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   eSprites: state.scratchGui.blockDrag,
    deviceLibraryVisible: state.scratchGui.modals.deviceLibrary,
    spriteLibraryVisible: state.scratchGui.modals.spriteLibrary,
    stageResize: state.scratchGui.stageSize.stageResize,
    windowHeight: state.scratchGui.stageSize.windowHeight,
    windowWidth: state.scratchGui.stageSize.windowWidth,
    workspaceMetrics: state.scratchGui.workspaceMetrics
});

const mapDispatchToProps = dispatch => ({

    onNewDeviceClick: e => {
        e.preventDefault();
        dispatch(openDeviceLibrary());
    },
    onRequestCloseDeviceLibrary: () => {
        dispatch(closeDeviceLibrary());
    },
    onNewSpriteClick: e => {
        e.preventDefault();
        dispatch(openSpriteLibrary());
    },
    onRequestCloseSpriteLibrary: () => {
        dispatch(closeSpriteLibrary());
    },
    onActivateEditorTab: tab => {
        dispatch(activateEditorTab(tab));
    },
    onActivateObjectTab: tab => {
        dispatch(activateObjectTab(tab));
    },
    onActivateBackdropsTab: () => dispatch(activateObjectTab(BACKDROPS_TAB_INDEX)),
    onActivateSpritesTab: () => dispatch(activateObjectTab(SPRITES_TAB_INDEX)),
    onActivateDevicesTab: () => dispatch(activateObjectTab(DEVICES_TAB_INDEX)),

    onReceivedBlocks: receivedBlocks => {
        dispatch(setReceivedBlocks(receivedBlocks));
    },
    dispatchUpdateRestore: restoreState => {
        dispatch(setRestore(restoreState));
    },
    onHighlightTarget: id => {
        dispatch(highlightTarget(id));
    },
    onCloseImporting: () => dispatch(closeAlertWithId('importingAsset')),
    onShowImporting: () => dispatch(showStandardAlert('importingAsset')),
    saveSprtieTarget: (id) => dispatch(spriteTargetObject(id)),
    saveDeviceTarget: (id) => dispatch(deviceTargetObject(id)),
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(TargetPane));
