import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';

import costumeLibraryContent from '../lib/libraries/costumes.json';
import spriteTags from '../lib/libraries/sprite-tags';
import LibraryComponent from '../components/library/library.jsx';

/**
 * rogic-mobile
 * */
import {handleFileUpload, spriteUpload} from '../lib/file-uploader.js';
import {
    activateEditorTab,
    BLOCKS_TAB_INDEX
} from '../reducers/editor-tab';
import {
    activateObjectTab
} from '../reducers/object-tab';
import {connect} from 'react-redux';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';
import {emptyCostume} from '../lib/empty-assets';
import sharedMessages from '../lib/shared-messages';

let messages = defineMessages({
    libraryTitle: {
        defaultMessage: 'Choose a Costume',
        description: 'Heading for the costume library',
        id: 'gui.costumeLibrary.chooseACostume'
    }
});
messages = {...messages, ...sharedMessages};

class CostumeLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleOk',
            'handleItemDoubleClick',
            'handleItemSelect',
            /** rogic-mobile */
            'handleFileUploadClick',
            'handleSpriteUpload',
            'setFileInput',
            'handleNewSprite',
            'handleNewCostume',
            'handleNewBlankCostume'
        ]);
        this.selected = null;
    }
    handleOk () {
        if (this.selected) {
            const vmCostume = {
                name: this.selected.name,
                rotationCenterX: this.selected.rotationCenterX,
                rotationCenterY: this.selected.rotationCenterY,
                bitmapResolution: this.selected.bitmapResolution,
                skinId: null
            };
            this.props.vm.addCostumeFromLibrary(this.selected.md5ext, vmCostume);
        }
        this.props.onRequestClose();
    }

    handleItemSelect (item) {
        this.selected = item;
    }
    handleItemDoubleClick (item) {
        const vmCostume = {
            name: item.name,
            rotationCenterX: item.rotationCenterX,
            rotationCenterY: item.rotationCenterY,
            bitmapResolution: item.bitmapResolution,
            skinId: null
        };
        this.props.vm.addCostumeFromLibrary(item.md5ext, vmCostume);
    }
    /**
     * rogic-mobile
     * */
    handleFileUploadClick () {
        this.fileInput.click();
    }
    handleSpriteUpload (e) {
        const storage = this.props.vm.runtime.storage;
        this.props.onShowImporting();
        this.props.onRequestClose();
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
    handleNewSprite (spriteJSONString) {
        return this.props.vm.addSprite(spriteJSONString)
            .then(this.handleActivateBlocksTab());
    }
    handleActivateBlocksTab () {
        this.props.onActivateEditorTab(BLOCKS_TAB_INDEX);
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
    handleNewBlankCostume () {
        const name = this.props.vm.editingTarget.isStage ?
            this.props.intl.formatMessage(messages.backdrop, {index: 1}) :
            this.props.intl.formatMessage(messages.costume, {index: 1});
        this.props.onRequestClose();
        this.handleNewCostume(emptyCostume(name));
    }
    render () {
        return (
            <LibraryComponent
                data={costumeLibraryContent}
                id="costumeLibrary"
                tags={spriteTags}
                title={this.props.intl.formatMessage(messages.libraryTitle)}
                onOk={this.handleOk}
                onItemSelected={this.handleItemSelect}
                onItemDoubleClick={this.handleItemDoubleClick}
                onRequestClose={this.props.onRequestClose}
                onFileUploadClick={this.handleFileUploadClick}
                onSpriteUpload={this.handleSpriteUpload}
                spriteFileInput={this.setFileInput}
                isCostume={true}
                onPaintCostumeClick={this.handleNewBlankCostume}
            />
        );
    }
}

CostumeLibrary.propTypes = {
    intl: intlShape.isRequired,
    onRequestClose: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired,
    onCloseImporting: PropTypes.func,  // rogic-mobile
    onActivateEditorTab: PropTypes.func,
    onShowImporting: PropTypes.func
};
/**
 * rogic-mobile
 */
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
)(CostumeLibrary));
