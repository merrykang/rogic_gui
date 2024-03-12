import bindAll from 'lodash.bindall';
import PropTypes, {object} from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

import isScratchDesktop from '../lib/isScratchDesktop';

import SoundModalComponent, {PHASES} from '../components/sound-modal/sound-modal.jsx';
import {openSoundSync} from '../reducers/modals';

import soundIcon from '../components/library-item/lib-icon--sound.svg';

class SoundModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleCancel',
            'handleChangeListPhase',
            'handleChangeName',
            'handleChangeRecordPhase',
            'handleDelete',
            'handleNewSound',
            'handleOk',
            'handleSetTabIndex',
            'handleSync',
            'setSelectedItem',
        ]);
        this.state = {
            selectedItem: null,
            soundLoaded: false,
            phase: PHASES.sounds,
            tabIndex: 0
        };
    }
    componentDidMount () {
        setTimeout(() => {
            this.setState({
                soundLoaded: true
            });
        }, 100);
    }
    componentDidUpdate (prevProps, prevState) {
        if (this.state.tabIndex !== prevState.tabIndex) {
            this.setState({
                selectedItem: null
            });
            setTimeout(() => {
                this.setState({
                    soundLoaded: true
                });
            }, 100);
        }
    }
    handleCancel () {
        if (isScratchDesktop()) {
            this.props.soundModalUtils.saveCustomSounds();
        }
        this.props.onRequestClose();
    }
    handleChangeListPhase () {
        this.setState({
            phase: PHASES.sounds
        });
    }
    handleChangeName (name, index) {
        this.props.soundModalUtils.changeName(name, index, this.state.tabIndex);
        this.forceUpdate();
    }
    handleChangeRecordPhase () {
        this.setState({
            phase: PHASES.record
        });
    }
    handleDelete (e) {
        e.stopPropagation();
        if (this.state.selectedItem === null) {
            return;
        }
        this.props.soundModalUtils.soundDelete(this.state.selectedItem, this.state.tabIndex);
        this.setState({
            selectedItem: null
        });
    }
    handleNewSound (newSound) {
        this.props.soundModalUtils.makeNewSound(newSound);
        if (this.state.tabIndex === 1) {
            this.forceUpdate();
        }
    }
    handleOk () {
        if (this.state.selectedItem !== null) {
            // text: 파일 이름
            // index: 재생될 번호
            let index = this.state.selectedItem;
            let text = '';
            if (this.state.tabIndex == 1) {
                text = this.props.customSounds[index].name;
                index += this.props.storageSounds.length;
            } else {
                text = this.props.storageSounds[index].name;
            }
            this.props.callback({
                value: String(index + 1),
                text: text
            });
        }
        this.handleCancel();
    }
    handleSetTabIndex (index) {
        if (index !== this.state.tabIndex) {
            this.setState({
                tabIndex: index,
                soundLoaded: false
            });
        }
    }
    handleSync () {
        this.props.onSoundSyncClick();
        this.handleCancel();
    }
    setSelectedItem (focused) {
        this.setState({
            selectedItem: Number(focused)
        });
    }
    render () {
        return (
            <SoundModalComponent
                iconURL={soundIcon}
                tabIndex={this.state.tabIndex}
                storageSounds={this.props.storageSounds}
                customSounds={this.props.customSounds}
                onCancel={this.handleCancel}
                onChangeListPhase={this.handleChangeListPhase}
                onChangeOptionPhase={this.handleChangeOptionPhase}
                onChangeRecordPhase={this.handleChangeRecordPhase}
                onChangeSavingPhase={this.handleChangeSavingPhase}
                onChangeScanninPhase={this.handleChangeScanningPhase}
                onChangeName={this.handleChangeName}
                onDelete={this.handleDelete}
                onNewSound={this.handleNewSound}
                onOk={this.handleOk}
                onRequestClose={this.props.onRequestClose}
                onSyncClick={this.handleSync}
                phase={this.state.phase}
                playingItem={this.state.playingItem}
                selectedItem={this.state.selectedItem}
                setTabIndex={this.handleSetTabIndex}
                setSelectedItem={this.setSelectedItem}
                soundLoaded={this.state.soundLoaded}
                vm={this.props.vm}
            />
        );
    }
}

SoundModal.propTypes = {
    json: PropTypes.object.isRequired,
    callback: PropTypes.func.isRequired,
    customSounds: PropTypes.arrayOf(object).isRequired,
    onRequestClose: PropTypes.func.isRequired,
    onSoundSyncClick: PropTypes.func.isRequired,
    soundModalUtils: PropTypes.object.isRequired,
    storageSounds: PropTypes.arrayOf(object).isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    json: state.scratchGui.soundModal.json,
    callback: state.scratchGui.soundModal.callback,
    customSounds: state.scratchGui.soundSync.custom,
    storageSounds: state.scratchGui.soundSync.storage,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onSoundSyncClick: () => dispatch(openSoundSync())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SoundModal);
