import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';

import backdropLibraryContent from '../lib/libraries/backdrops.json';
import backdropTags from '../lib/libraries/backdrop-tags';
import LibraryComponent from '../components/library/library.jsx';

/**
 * rogic-mobile
 * */
import {handleFileUpload, costumeUpload} from '../lib/file-uploader.js';
import {activateEditorTab, COSTUMES_TAB_INDEX} from '../reducers/editor-tab';
import {connect} from 'react-redux';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';
import {emptyCostume} from '../lib/empty-assets';
import sharedMessages from '../lib/shared-messages';

let messages = defineMessages({
    libraryTitle: {
        defaultMessage: 'Choose a Backdrop',
        description: 'Heading for the backdrop library',
        id: 'gui.costumeLibrary.chooseABackdrop'
    }
});
messages = {...messages, ...sharedMessages};

class BackdropLibrary extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleOk',
            'handleItemSelect',
            'handleItemDoubleClick',
            'handleFileUploadClick',  // rogic-mobile
            'setFileInput',
            'handleBackdropUpload',
            'handleNewBackdrop',
            'handleNewBlankCostume',
            'handleNewCostume'
        ]); this.selected = null;
    }
    handleOk () {
        if (this.selected) {
            const vmBackdrop = {
                name: this.selected.name,
                rotationCenterX: this.selected.rotationCenterX,
                rotationCenterY: this.selected.rotationCenterY,
                bitmapResolution: this.selected.bitmapResolution,
                skinId: null
            };
            // Do not switch to stage, just add the backdrop
            this.props.vm.addBackdrop(this.selected.md5ext, vmBackdrop);
        }
        this.props.onRequestClose();
    }
    handleItemSelect (item) {
        this.selected = item;
    }
    handleItemDoubleClick (item) {
        const vmBackdrop = {
            name: item.name,
            rotationCenterX: item.rotationCenterX,
            rotationCenterY: item.rotationCenterY,
            bitmapResolution: item.bitmapResolution,
            skinId: null
        };
        // Do not switch to stage, just add the backdrop
        this.props.vm.addBackdrop(item.md5ext, vmBackdrop);
    }
    /**
     * rogic-mobile
     * */
    handleFileUploadClick () {
        //e.stopPropagation(); // Prevent click from selecting the stage, that is handled manually in backdrop upload
        console.log('this.fileInput: ', this.fileInput);
        this.fileInput.click();
    }
    setFileInput (input) {
        this.fileInput = input;
    }
    handleBackdropUpload (e) {
        const storage = this.props.vm.runtime.storage;
        this.props.onShowImporting();
        this.props.onRequestClose();
        handleFileUpload(e.target, (buffer, fileType, fileName, fileIndex, fileCount) => {
            costumeUpload(buffer, fileType, storage, vmCostumes => {
                this.props.vm.setEditingTarget(this.props.id);
                vmCostumes.forEach((costume, i) => {
                    costume.name = `${fileName}${i ? i + 1 : ''}`;
                });
                this.handleNewBackdrop(vmCostumes).then(() => {
                    if (fileIndex === fileCount - 1) {
                        this.props.onCloseImporting();
                    }
                });
            }, this.props.onCloseImporting);
        }, this.props.onCloseImporting);
    }
    handleNewBackdrop (backdrops_, shouldActivateTab = true) {
        const backdrops = Array.isArray(backdrops_) ? backdrops_ : [backdrops_];
        return Promise.all(backdrops.map(backdrop =>
            this.props.vm.addBackdrop(backdrop.md5, backdrop)
        )).then(() => {
            if (shouldActivateTab) {
                return this.props.onActivateEditorTab(COSTUMES_TAB_INDEX);
            }
        });
    }
    handleNewBlankCostume () {
        const name = this.props.vm.editingTarget.isStage ?
            this.props.intl.formatMessage(messages.backdrop, {index: 1}) :
            this.props.intl.formatMessage(messages.costume, {index: 1});
        this.props.onRequestClose();
        this.handleNewCostume(emptyCostume(name));
    }
    handleNewCostume (costume, fromCostumeLibrary, targetId) {
        const costumes = Array.isArray(costume) ? costume : [costume];

        return Promise.all(costumes.map(c => {
            if (fromCostumeLibrary) {
                return this.props.vm.addCostumeFromLibrary(c.md5, c);
            }
            // If targetId is falsy, VM should default it to editingTarget.id
            // However, targetId should be provided to prevent #5876,
            // if making new costume takes a while
            return this.props.vm.addCostume(c.md5, c, targetId);
        }));
    }

    render () {
        return (
            <LibraryComponent
                data={backdropLibraryContent}
                id="backdropLibrary"
                tags={backdropTags}
                title={this.props.intl.formatMessage(messages.libraryTitle)}
                onOk={this.handleOk}
                onItemSelected={this.handleItemSelect}
                onItemDoubleClick={this.handleItemDoubleClick}
                onRequestClose={this.props.onRequestClose}
                isBackdrop={true}  // rogic-mobile
                onFileUploadClick={this.handleFileUploadClick}
                onBackdropFileUpload={this.handleBackdropUpload}
                fileInputRef={this.setFileInput}
                onPaintCostumeClick={this.handleNewBlankCostume}
            />
        );
    }
}

BackdropLibrary.propTypes = {
    intl: intlShape.isRequired,
    onRequestClose: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired,
    onCloseImporting: PropTypes.func,  // rogic-mobile
    onActivateEditorTab: PropTypes.func,
    onActivateBlocksTab: PropTypes.func,
    onShowImporting: PropTypes.func
};
const mapDispatchToProps = dispatch => ({
    onActivateEditorTab: tab => {
        dispatch(activateEditorTab(tab));
    },
    onActivateObjectTab: tab => {
        dispatch(activateObjectTab(tab));
    },
    onCloseImporting: () => dispatch(closeAlertWithId('importingAsset')),
    onShowImporting: () => dispatch(showStandardAlert('importingAsset'))
});

export default injectIntl(connect(
    null,
    mapDispatchToProps
)(BackdropLibrary));
