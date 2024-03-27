import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {defineMessages, intlShape, injectIntl} from 'react-intl';
import VM from 'scratch-vm';

import AssetPanel from '../components/asset-panel/asset-panel.jsx';
import soundIcon from '../components/asset-panel/icon--sound.svg';
import soundIconRtl from '../components/asset-panel/icon--sound-rtl.svg';
import addSoundFromLibraryIcon from '../components/asset-panel/icon--add-sound-lib.svg';
import addSoundFromRecordingIcon from '../components/asset-panel/icon--add-sound-record.svg';
import fileUploadIcon from '../components/action-menu/icon--file-upload.svg';
import surpriseIcon from '../components/action-menu/icon--surprise.svg';
import searchIcon from '../components/action-menu/icon--search.svg';

import RecordModal from './record-modal.jsx';
import SoundEditor from './sound-editor.jsx';
import SoundLibrary from './sound-library.jsx';

import soundLibraryContent from '../lib/libraries/sounds.json';
import {handleFileUpload, soundUpload} from '../lib/file-uploader.js';
import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import DragConstants from '../lib/drag-constants';
import downloadBlob from '../lib/download-blob';

import {connect} from 'react-redux';

import {
    closeSoundLibrary,
    openSoundLibrary,
    openSoundRecorder
} from '../reducers/modals';

import {
    activateEditorTab,
    activateEditorTabAndSetSoundIndex,
    COSTUMES_TAB_INDEX,
    SOUNDS_EDIT_TAB_INDEX
} from '../reducers/editor-tab';

import {setRestore} from '../reducers/restore-deletion';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';

class SoundTab extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSelectSound',
            'handleDeleteSound',
            'handleDuplicateSound',
            'handleExportSound',
            'handleNewSound',
            'handleSurpriseSound',
            'handleFileUploadClick',
            'handleSoundUpload',
            'handleDrop',
            'setDetailArea',
            'setFileInput',
            'handleSelectedItemClick' // test
        ]);
        console.log(`[consturctor] START - activeSoundIndex : ${this.props.activeSoundIndex}`);
        this.state = {
            selectedSoundIndex: this.props.activeSoundIndex > -1 ? this.props.activeSoundIndex : 0,
            detailArea: null
        };
    }

    componentWillReceiveProps (nextProps) {
        // 컴포넌트 생성 후 첫 렌더링을 마친 후 호출 (props를 받아 state를 변경할 경우 유용)
        // 컴포넌트가 처음 마운트 되는 시점에서는 호출되지 않는다. (여기서 setState를 사용해도 추가적인 렌더링이 발생하지 않음)
        const {
            editingTarget,
            sprites,
            stage
        } = nextProps;

        const target = editingTarget && sprites[editingTarget] ? sprites[editingTarget] : stage;
        if (!target || !target.sounds) {
            return;
        }

        // If switching editing targets, reset the sound index
        if (this.props.editingTarget !== editingTarget) {
            this.setState({selectedSoundIndex: 0});
        } else if (this.state.selectedSoundIndex > target.sounds.length - 1) {
            this.setState({selectedSoundIndex: Math.max(target.sounds.length - 1, 0)});
        }
    }

    handleSelectSound (soundIndex) {
        this.setState({selectedSoundIndex: soundIndex});
    }

    handleDeleteSound (soundIndex) {
        const restoreFun = this.props.vm.deleteSound(soundIndex);
        if (soundIndex >= this.state.selectedSoundIndex) {
            this.setState({selectedSoundIndex: Math.max(0, soundIndex - 1)});
        }
        this.props.dispatchUpdateRestore({restoreFun, deletedItem: 'Sound'});
    }

    handleExportSound (soundIndex) {
        const item = this.props.vm.editingTarget.sprite.sounds[soundIndex];
        const blob = new Blob([item.asset.data], {type: item.asset.assetType.contentType});
        downloadBlob(`${item.name}.${item.asset.dataFormat}`, blob);
    }

    handleDuplicateSound (soundIndex) {
        this.props.vm.duplicateSound(soundIndex).then(() => {
            this.setState({selectedSoundIndex: soundIndex + 1});
        });
    }

    handleNewSound () {
        if (!this.props.vm.editingTarget) {
            return null;
        }
        const sprite = this.props.vm.editingTarget.sprite;
        const sounds = sprite.sounds ? sprite.sounds : [];
        this.setState({selectedSoundIndex: Math.max(sounds.length - 1, 0)});
    }

    handleSurpriseSound () {
        const soundItem = soundLibraryContent[Math.floor(Math.random() * soundLibraryContent.length)];
        const vmSound = {
            format: soundItem.dataFormat,
            md5: soundItem.md5ext,
            rate: soundItem.rate,
            sampleCount: soundItem.sampleCount,
            name: soundItem.name
        };
        this.props.vm.addSound(vmSound).then(() => {
            this.handleNewSound();
        });
    }

    handleFileUploadClick () {
        this.fileInput.click();
    }

    handleSoundUpload (e) {
        const storage = this.props.vm.runtime.storage;
        const targetId = this.props.vm.editingTarget.id;
        this.props.onShowImporting();
        handleFileUpload(e.target, (buffer, fileType, fileName, fileIndex, fileCount) => {
            soundUpload(buffer, fileType, storage, newSound => {
                newSound.name = fileName;
                this.props.vm.addSound(newSound, targetId).then(() => {
                    this.handleNewSound();
                    if (fileIndex === fileCount - 1) {
                        this.props.onCloseImporting();
                    }
                });
            }, this.props.onCloseImporting);
        }, this.props.onCloseImporting);
    }

    handleDrop (dropInfo) {
        if (dropInfo.dragType === DragConstants.SOUND) {
            const sprite = this.props.vm.editingTarget.sprite;
            const activeSound = sprite.sounds[this.state.selectedSoundIndex];

            this.props.vm.reorderSound(this.props.vm.editingTarget.id,
                dropInfo.index, dropInfo.newIndex);

            this.setState({selectedSoundIndex: sprite.sounds.indexOf(activeSound)});
        } else if (dropInfo.dragType === DragConstants.BACKPACK_COSTUME) {
            this.props.onActivateCostumesTab();
            this.props.vm.addCostume(dropInfo.payload.body, {
                name: dropInfo.payload.name
            });
        } else if (dropInfo.dragType === DragConstants.BACKPACK_SOUND) {
            this.props.vm.addSound({
                md5: dropInfo.payload.body,
                name: dropInfo.payload.name
            }).then(this.handleNewSound);
        }
    }

    setDetailArea (element) {
        this.setState({
            detailArea: element
        });
    }

    setFileInput (input) {
        this.fileInput = input;
    }

    handleSelectedItemClick () { // test
        console.log(`handleSelectedItemClick START - selectedSoundIndex : ${this.state.selectedSoundIndex}`);
        this.props.onActivateSoundEditorTab(this.state.selectedSoundIndex);
    }

    render () {
        const {
            dispatchUpdateRestore, // eslint-disable-line no-unused-vars
            intl,
            isRtl,
            vm,
            onNewSoundFromLibraryClick,
            onNewSoundFromRecordingClick,
            activeEditorTabIndex // test
        } = this.props;

        console.log(`[render] selectedSoundIndex ? ${this.state.selectedSoundIndex}`);

        if (!vm.editingTarget) {
            return null;
        }

        const sprite = vm.editingTarget.sprite;

        const sounds = sprite.sounds ? sprite.sounds.map(sound => (
            {
                url: isRtl ? soundIconRtl : soundIcon,
                name: sound.name,
                details: (sound.sampleCount / sound.rate).toFixed(2),
                dragPayload: sound
            }
        )) : [];

        const messages = defineMessages({
            fileUploadSound: {
                defaultMessage: 'Upload Sound',
                description: 'Button to upload sound from file in the editor tab',
                id: 'gui.soundTab.fileUploadSound'
            },
            surpriseSound: {
                defaultMessage: 'Surprise',
                description: 'Button to get a random sound in the editor tab',
                id: 'gui.soundTab.surpriseSound'
            },
            recordSound: {
                defaultMessage: 'Record',
                description: 'Button to record a sound in the editor tab',
                id: 'gui.soundTab.recordSound'
            },
            addSound: {
                defaultMessage: 'Choose a Sound',
                description: 'Button to add a sound in the editor tab',
                id: 'gui.soundTab.addSoundFromLibrary'
            }
        });

        const assetPanel = (
            <AssetPanel
                buttons={[{
                    title: intl.formatMessage(messages.addSound),
                    img: addSoundFromLibraryIcon,
                    onClick: onNewSoundFromLibraryClick
                }, {
                    title: intl.formatMessage(messages.fileUploadSound),
                    img: fileUploadIcon,
                    onClick: this.handleFileUploadClick,
                    fileAccept: '.wav, .mp3',
                    fileChange: this.handleSoundUpload,
                    fileInput: this.setFileInput,
                    fileMultiple: true
                }, {
                    title: intl.formatMessage(messages.surpriseSound),
                    img: surpriseIcon,
                    onClick: this.handleSurpriseSound
                }, {
                    title: intl.formatMessage(messages.recordSound),
                    img: addSoundFromRecordingIcon,
                    onClick: onNewSoundFromRecordingClick
                }, {
                    title: intl.formatMessage(messages.addSound),
                    img: searchIcon,
                    onClick: onNewSoundFromLibraryClick
                }]}
                dragType={DragConstants.SOUND}
                isRtl={isRtl}
                items={sounds}
                selectedItemIndex={this.state.selectedSoundIndex}
                onDeleteClick={this.handleDeleteSound}
                onDrop={this.handleDrop}
                onDuplicateClick={this.handleDuplicateSound}
                onExportClick={this.handleExportSound}
                onItemClick={this.handleSelectSound}
                setDetailArea={this.setDetailArea}
                onSelectedItemClick={this.handleSelectedItemClick} // test
            >
                {/*{sprite.sounds && sprite.sounds[this.state.selectedSoundIndex] ? (*/}
                {/*    <SoundEditor*/}
                {/*        soundIndex={this.state.selectedSoundIndex}*/}
                {/*        detailArea={this.state.detailArea}*/}
                {/*    />*/}
                {/*) : null}*/}
                {/*{this.props.soundRecorderVisible ? (*/}
                {/*    <RecordModal*/}
                {/*        onNewSound={this.handleNewSound}*/}
                {/*        onRequestClose={this.props.onRequestCloseSoundLibrary} // rogic-mobile*/}
                {/*    />*/}
                {/*) : null}*/}
                {this.props.soundLibraryVisible ? (
                    <SoundLibrary
                        vm={this.props.vm}
                        onNewSound={this.handleNewSound}
                        onRequestClose={this.props.onRequestCloseSoundLibrary}
                    />
                ) : null}
            </AssetPanel>
        );

        const soundEditor = (
            sprite.sounds && sprite.sounds[this.state.selectedSoundIndex] ? (
                <SoundEditor
                    soundIndex={this.state.selectedSoundIndex}
                    // detailArea={this.state.detailArea}
                />
            ) : null
        );

        return (
        // <AssetPanel
        //    buttons={[{
        //        title: intl.formatMessage(messages.addSound),
        //        img: addSoundFromLibraryIcon,
        //        onClick: onNewSoundFromLibraryClick
        //    }, {
        //        title: intl.formatMessage(messages.fileUploadSound),
        //        img: fileUploadIcon,
        //        onClick: this.handleFileUploadClick,
        //        fileAccept: '.wav, .mp3',
        //        fileChange: this.handleSoundUpload,
        //        fileInput: this.setFileInput,
        //        fileMultiple: true
        //    }, {
        //        title: intl.formatMessage(messages.surpriseSound),
        //        img: surpriseIcon,
        //        onClick: this.handleSurpriseSound
        //    }, {
        //        title: intl.formatMessage(messages.recordSound),
        //        img: addSoundFromRecordingIcon,
        //        onClick: onNewSoundFromRecordingClick
        //    }, {
        //        title: intl.formatMessage(messages.addSound),
        //        img: searchIcon,
        //        onClick: onNewSoundFromLibraryClick
        //    }]}
        //    dragType={DragConstants.SOUND}
        //    isRtl={isRtl}
        //    items={sounds}
        //    selectedItemIndex={this.state.selectedSoundIndex}
        //    onDeleteClick={this.handleDeleteSound}
        //    onDrop={this.handleDrop}
        //    onDuplicateClick={this.handleDuplicateSound}
        //    onExportClick={this.handleExportSound}
        //    onItemClick={this.handleSelectSound}
        //    tabsStyle={this.props.tabsStyle}
        //    setDetailArea={this.setDetailArea}
        //    onSelectedItemClick={this.handleSelectedItemClick} // test
        // >
        //    {sprite.sounds && sprite.sounds[this.state.selectedSoundIndex] ? (
        //        <SoundEditor
        //            soundIndex={this.state.selectedSoundIndex}
        //            detailArea={this.state.detailArea}
        //        />
        //    ) : null}

        //    {this.props.soundRecorderVisible ? (
        //        <RecordModal
        //            onNewSound={this.handleNewSound}
        //        />
        //    ) : null}

        //    {this.props.soundLibraryVisible ? (
        //        <SoundLibrary
        //            vm={this.props.vm}
        //            onNewSound={this.handleNewSound}
        //            onRequestClose={this.props.onRequestCloseSoundLibrary}
        //        />
        //    ) : null}
        // </AssetPanel>

            activeEditorTabIndex === SOUNDS_EDIT_TAB_INDEX ? soundEditor : assetPanel
        );
    }
}

SoundTab.propTypes = {
    dispatchUpdateRestore: PropTypes.func,
    editingTarget: PropTypes.string,
    intl: intlShape,
    isRtl: PropTypes.bool,
    onActivateCostumesTab: PropTypes.func.isRequired,
    onCloseImporting: PropTypes.func.isRequired,
    onNewSoundFromLibraryClick: PropTypes.func.isRequired,
    onNewSoundFromRecordingClick: PropTypes.func.isRequired,
    onRequestCloseSoundLibrary: PropTypes.func.isRequired,
    onShowImporting: PropTypes.func.isRequired,
    soundLibraryVisible: PropTypes.bool,
    soundRecorderVisible: PropTypes.bool,
    sprites: PropTypes.shape({
        id: PropTypes.shape({
            sounds: PropTypes.arrayOf(PropTypes.shape({
                name: PropTypes.string.isRequired
            }))
        })
    }),
    stage: PropTypes.shape({
        sounds: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired
        }))
    }),
    vm: PropTypes.instanceOf(VM).isRequired,
    onActivateSoundEditorTab: PropTypes.func, // test
    activeEditorTabIndex: PropTypes.number, // test
    activeSoundIndex: PropTypes.number // test
};

const mapStateToProps = state => ({
    editingTarget: state.scratchGui.targets.editingTarget,
    isRtl: state.locales.isRtl,
    sprites: state.scratchGui.targets.sprites,
    stage: state.scratchGui.targets.stage,
    soundLibraryVisible: state.scratchGui.modals.soundLibrary,
    soundRecorderVisible: state.scratchGui.modals.soundRecorder,
    activeEditorTabIndex: state.scratchGui.editorTab.activeTabIndex, // test
    activeSoundIndex: state.scratchGui.editorTab.soundIndex // test
});

const mapDispatchToProps = dispatch => ({
    onActivateCostumesTab: () => dispatch(activateEditorTab(COSTUMES_TAB_INDEX)),
    onNewSoundFromLibraryClick: e => {
        e.preventDefault();
        dispatch(openSoundLibrary());
    },
    onNewSoundFromRecordingClick: () => {
        dispatch(openSoundRecorder());
    },
    onRequestCloseSoundLibrary: () => {
        dispatch(closeSoundLibrary());
    },
    dispatchUpdateRestore: restoreState => {
        dispatch(setRestore(restoreState));
    },
    onCloseImporting: () => dispatch(closeAlertWithId('importingAsset')),
    onShowImporting: () => dispatch(showStandardAlert('importingAsset')),
    onActivateSoundEditorTab: selectedSoundIndex => { // test
        dispatch(activateEditorTabAndSetSoundIndex(SOUNDS_EDIT_TAB_INDEX, selectedSoundIndex));
    }

});

export default errorBoundaryHOC('Sound Tab')(
    injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps
    )(SoundTab))
);
