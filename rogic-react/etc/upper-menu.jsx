import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';
import styles from './upper-menu.css';
import {FormattedMessage} from 'react-intl';

import Input from '../../forms/input.jsx';
import BufferedInputHOC from '../../forms/buffered-input-hoc.jsx';
import {handleFileUpload, soundUpload} from '../../../lib/file-uploader.js';

import addSoundFromRecordingIcon from './icon--add-sound-record.svg';
import fileUploadIcon from './icon--file-upload.svg';
import deleteBlueIcon from './icon--delete-blue.svg';
import deleteRedIcon from './icon--delete-red.svg';


const BufferedInput = BufferedInputHOC(Input);

class UpperMenuComponent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'buttonSpaceWidthCalculator',
            'handleClick',
            'setButtonSpaceWidth',
            'setFileInput',
            'setHeader',
            'handleFileChange',
            'handleChangeName',
            'handleDelete'
        ]);
    }
    componentDidMount () {
        window.addEventListener('resize', this.setButtonSpaceWidth);
    }
    componentWillUnmount () {
        window.addEventListener('resize', this.setButtonSpaceWidth);
    }
    handleClick () {
        this.fileInput.click();
    }
    handleChangeName (name) {
        this.props.onChangeName(name, this.props.selectedItem);
    }
    setButtonSpaceWidth () {
        const style = this.buttonSpaceWidthCalculator();
        if (this.buttonSpace) {
            this.buttonSpace.style.width = style.width;
        }
    }
    buttonSpaceWidthCalculator () {
        const convertRemToPixels = function (rem) {
            return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
        }
        //const headerButton = 7;
        //const headerButtonMargin = 1;
        //const inputField = 11.5;
        //const inputFieldMargin = 0.75;
        //const inputLabel = 3;
        //const inputLabelMargin = 0.5;
        //const lineMargin = 0.5;
        const allRem = (7 * 3) + (1 * 3) + 11.5 + 0.75 + 3 + 0.5 + 0.5;

        //if (!this.header) {  // rogic-mobile
        //    //let str = this.props.headerStyle.width;  
        //    str = str.replace(/[^0-9]/g, '');
        //    let width = Number(str) - convertRemToPixels(allRem);
        //    if (width < 0) width = 0;
        //    return {width: (Number(str) - convertRemToPixels(allRem)) + 'px'};
        // } else {
        //    //let str = this.props.headerStyle.width;  // rogic-mobile
        //     str = str.replace(/[^0-9]/g, '');
        //     let width = Number(str) - convertRemToPixels(allRem);
        //     if (width < 0) width = 0;
        //     return {width: (Number(str) - convertRemToPixels(allRem)) + 'px'};
        // }
    }
    setFileInput (input) {
        this.fileInput = input;
    }
    setHeader (ref) {
        this.header = ref;
        this.props.setUpperMenu(ref);
    }
    setButtonSpace (ref) {
        this.buttonSpace = ref;
        this.forceUpdate();
    }
    handleFileChange (e) {
        const storage = this.props.vm.runtime.storage;
        handleFileUpload(e.target, (buffer, fileType, fileName, fileIndex, fileCount) => {
            soundUpload(buffer, fileType, storage, newSound => {
                const audioContext = this.props.vm.runtime.audioEngine.audioContext;
                const bufferCopy = newSound.asset.data.buffer.slice(0);
                const decodeAudioData = function (audioContext, buffer) {
                    // Check for newer promise-based API
                    if (audioContext.decodeAudioData.length === 1) {
                        return audioContext.decodeAudioData(buffer);
                    }
                    // Fall back to callback API
                    return new Promise((resolve, reject) => {
                        audioContext.decodeAudioData(buffer,
                            decodedAudio => resolve(decodedAudio),
                            error => reject(error)
                        );
                    });
                };
                decodeAudioData(audioContext, bufferCopy)
                    .then(
                        newBuffer => {
                            newSound.name = fileName;
                            newSound.sampleCount = newBuffer.length;
                            newSound.rate = newBuffer.sampleRate;
                            this.props.onNewSound(newSound);
                        },
                        error => {
                            console.warn('audio data could not be decoded', error);
                        }
                );
            });
        }, null);
    }

    handleDelete (e) {
        if (this.deleteIndex !== null) {
            this.props.onDelete(e, this.props.selectedItem);
        }
    }

    render () {
        const isBaseSound = this.props.tabIndex === 0;
        const isAddable = !isBaseSound;
        const isDeleteable = this.props.tabIndex !== 0 && this.props.selectedItem !== null;
        const isModifiable = !isBaseSound && this.props.selectedItem !== null;
        const buttonSpaceStyle = this.buttonSpaceWidthCalculator();

        return (
            <div
                className={styles.header}
                ref={this.setHeader}
                style={this.props.headerStyle}
            >
                <div
                    className={styles.inputWrapper}
                >
                    <div className={styles.inputLabel} >
                        <FormattedMessage
                            defaultMessage="소리"
                            description="소리"
                            id="gui.soundModal.sound"
                        />
                    </div>
                    <BufferedInput
                        className={styles.nameInput}
                        disabled={!isModifiable}
                        tabIndex="0"
                        type="text"
                        value={this.props.selectedName}
                        onSubmit={this.handleChangeName}
                    />
                </div>
                <div
                    className={styles.line}
                />

                <div
                    className={styles.headerButtonWrapper}
                >
                    <div
                        className={classNames(
                            styles.headerButton,
                            styles.deleteButton
                        )}
                        onClick={isDeleteable ? this.handleDelete : null}
                    >
                        <img
                            className={classNames(
                                styles.headerButtonImage,
                                isDeleteable ? null : styles.headerButtonImageDisable
                            )}
                            src={isDeleteable ? deleteRedIcon : deleteBlueIcon}
                        />
                        <div
                            className={classNames(
                                styles.headerButtonLabel,
                                isDeleteable ? null : styles.headerButtonLabelDisable
                            )}
                        >
                            <FormattedMessage
                                defaultMessage="삭제"
                                description="삭제"
                                id="gui.soundModal.delete"
                            />
                        </div>
                    </div>
                    <div
                        ref={ref => this.buttonSpace = ref}
                        style={buttonSpaceStyle}
                    />
                    <div
                        className={styles.headerButton}
                        onClick={isAddable ? this.props.onChangeRecordPhase : null}
                    >
                        <img
                            className={classNames(
                                styles.headerButtonImage,
                                isAddable ? null : styles.headerButtonImageDisable
                            )}
                            src={addSoundFromRecordingIcon}
                        />
                        <div
                            className={classNames(
                                styles.headerButtonLabel,
                                isAddable ? null : styles.headerButtonLabelDisable
                            )}
                        >
                            <FormattedMessage
                                defaultMessage="녹음"
                                description="녹음"
                                id="gui.soundModal.record"
                            />
                        </div>
                    </div>
                    <div
                        className={styles.headerButton}
                        onClick={isAddable ? this.handleClick : null}
                    >
                        <img
                            className={classNames(
                                styles.headerButtonImage,
                                isAddable ? null : styles.headerButtonImageDisable
                            )}
                            src={fileUploadIcon}
                        />
                        <div
                            className={classNames(
                                styles.headerButtonLabel,
                                isAddable ? null : styles.headerButtonLabelDisable
                            )}
                        >
                            <FormattedMessage
                                defaultMessage="업로드"
                                description="업로드"
                                id="gui.soundModal.upload"
                            />
                        </div>
                        <input
                            accept='.wav, .mp3'
                            ref={this.setFileInput}
                            style={{display: 'none'}}
                            type="file"
                            multiple={true}
                            onChange={this.handleFileChange}
                        />
                    </div>
                </div>
            </div>
        )
    }
}

UpperMenuComponent.propTypes = {
    onChangeRecordPhase: PropTypes.func,
    onChangeName: PropTypes.func,
    onDelete: PropTypes.func,
    onNewSound: PropTypes.func,
    tabIndex: PropTypes.number,
    selectedItem: PropTypes.number,
    selectedName: PropTypes.string,
    setUpperMenu: PropTypes.func,
    headerStyle: PropTypes.object,
    storageSounds: PropTypes.arrayOf(PropTypes.object),
    customSounds: PropTypes.arrayOf(PropTypes.object),
    vm: PropTypes.instanceOf(VM).isRequired
};

UpperMenuComponent.defaultProps = {

};

export default UpperMenuComponent;
