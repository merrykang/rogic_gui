import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl, intlShape, defineMessages} from 'react-intl';
import VM from 'scratch-vm';

import spriteLibraryContent from '../lib/libraries/sprites.json';
import randomizeSpritePosition from '../lib/randomize-sprite-position';
import spriteTags from '../lib/libraries/sprite-tags';

import LibraryComponent from '../components/library/library.jsx';

/**
 * rogic-mobile
 * */
import {handleFileUpload, spriteUpload} from '../lib/file-uploader.js';
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
import {connect} from 'react-redux';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';
import {emptySprite} from '../lib/empty-assets';
import sharedMessages from '../lib/shared-messages';

const messages = defineMessages({
    libraryTitle: {
        defaultMessage: 'Choose a Sprite',
        description: 'Heading for the sprite library',
        id: 'gui.spriteLibrary.chooseASprite'
    }
});

class SpriteLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleOk',
            'handleItemSelect',
            'handleItemDoubleClick',
            /** rogic-mobile */
            'handleFileUploadClick',
            'handleSpriteUpload',
            'setFileInput',
            'handleNewSprite',
            'handlePaintSpriteClick'
        ]);
        this.selected = null;
    }

    handleOk () {
        if (this.selected) {
            randomizeSpritePosition(this.selected);
            this.props.vm.addSprite(JSON.stringify(this.selected)).then(() => {
                this.props.onActivateBlocksTab();
            });
        }
        this.props.onRequestClose();
    }
    handleItemSelect (item) {
        this.selected = item;
    }
    handleItemDoubleClick (item) {
        // Randomize position of library sprite
        randomizeSpritePosition(item);
        this.props.vm.addSprite(JSON.stringify(item)).then(() => {
            this.props.onActivateBlocksTab();
        });
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
    handlePaintSpriteClick () {
        const formatMessage = this.props.intl.formatMessage;
        this.props.onRequestClose();
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
    render () {
        return (
            <LibraryComponent
                data={spriteLibraryContent}
                id="spriteLibrary"
                tags={spriteTags}
                title={this.props.intl.formatMessage(messages.libraryTitle)}
                onOk={this.handleOk}
                onItemSelected={this.handleItemSelect}
                onItemDoubleClick={this.handleItemDoubleClick}
                onRequestClose={this.props.onRequestClose}
                setTabIndex={this.props.setTabIndex}  // rogic-mobile
                tabIndex={this.props.tabIndex}
                showTabs={this.props.showTabs}
                onFileUploadClick={this.handleFileUploadClick}
                onSpriteUpload={this.handleSpriteUpload}
                fileInputRef={this.setFileInput}
                onPaintSpriteClick={this.handlePaintSpriteClick}
            />
        );
    }
}

SpriteLibrary.propTypes = {
    intl: intlShape.isRequired,
    onActivateBlocksTab: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired,
    setTabIndex: PropTypes.func,  // rogic-mobile
    tabIndex: PropTypes.number,
    showTabs: PropTypes.bool,
    onCloseImporting: PropTypes.func,
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
)(SpriteLibrary));
