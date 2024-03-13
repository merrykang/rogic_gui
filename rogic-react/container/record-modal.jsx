import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';
import {encodeAndAddSoundToVM, encodeAndAddSoundToLibrary} from '../lib/audio/audio-util.js';

import RecordModalComponent from '../components/record-modal/record-modal.jsx';

import {
    closeSoundRecorder
} from '../reducers/modals';

class RecordModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleRecord',
            'handleStopRecording',
            'handlePlay',
            'handleStopPlaying',
            'handleBack',
            'handleSubmit',
            'handleCancel',
            'handleSetPlayhead',
            'handleSetTrimStart',
            'handleSetTrimEnd',
            'handleResize'  //rogic-mobile
        ]);

        this.state = {
            samples: null,
            encoding: false,
            levels: null,
            playhead: null,
            playing: false,
            recording: false,
            sampleRate: null,
            trimStart: 0,
            trimEnd: 1,
            height: window.innerHeight,  //rogic-mobile
            width: window.innerWidth
        };

        if (this.props.onClose) this.onClose = this.props.onClose;
        else this.onClose = this.props.onDefaultClose;
    }
    componentDidMount () {
        this.handleResize();  // rogic-mobile
        window.addEventListener('resize', this.handleResize);
    }
    componentWillUnmount () {  // rogic-mobile
        window.removeEventListener('resize', this.handleResize);
    }
    shouldComponentUpdate (nextProps, nextState) {  // rogic-mobile
        if (this.state.width !== nextState.width ||
            this.state.height !== nextState.height ||
            this.state.recording !== nextState.recording ||
            this.state.samples !== nextState.samples ||
            this.state.sampleRate !== nextState.sampleRate ||
            this.state.levels !== nextState.levels ||
            this.state.trimStart !== nextState.trimStart ||
            this.state.trimEnd !== nextState.trimEnd ||
            this.state.playing !== nextState.playing) {
            return true;
        }
        return false;
    }
    handleRecord () {
        this.setState({recording: true});
    }
    handleStopRecording (samples, sampleRate, levels, trimStart, trimEnd) {
        if (samples.length > 0) {
            this.setState({samples, sampleRate, levels, trimStart, trimEnd, recording: false});
        }
    }
    handlePlay () {
        this.setState({playing: true});
    }
    handleStopPlaying () {
        this.setState({playing: false, playhead: null});
    }
    handleBack () {
        this.setState({playing: false, samples: null});
    }
    handleSetTrimEnd (trimEnd) {
        this.setState({trimEnd});
    }
    handleSetTrimStart (trimStart) {
        this.setState({trimStart});
    }
    handleSetPlayhead (playhead) {
        this.setState({playhead});
    }
    handleSubmit () {
        this.setState({encoding: true}, () => {
            const sampleCount = this.state.samples.length;
            const startIndex = Math.floor(this.state.trimStart * sampleCount);
            const endIndex = Math.floor(this.state.trimEnd * sampleCount);
            const clippedSamples = this.state.samples.slice(startIndex, endIndex);

            let encodeFn, callback;
            if (this.props.isSaveToVm) {
                encodeFn = encodeAndAddSoundToVM;
                callback = () => {
                    this.onClose();
                    this.props.onRequestClose();  // rogic-mobile
                    this.props.onNewSound();
                }
            } else {
                encodeFn = encodeAndAddSoundToLibrary;
                callback = soundAsset => {
                    this.onClose();
                    this.props.onNewSound(soundAsset);
                }
            }
            encodeFn(this.props.vm, clippedSamples, this.state.sampleRate, 'recording1', callback);
        });
    }
    handleCancel () {
        this.onClose();
    }
    handleResize = () => {  //rogic-mobile
        this.setState({
            height: window.innerHeight - (5 * 16),  // header: 5rem
            width: window.innerWidth
        });
    };
    render () {
        return (
            <RecordModalComponent
                encoding={this.state.encoding}
                levels={this.state.levels}
                playhead={this.state.playhead}
                playing={this.state.playing}
                recording={this.state.recording}
                sampleRate={this.state.sampleRate}
                samples={this.state.samples}
                trimEnd={this.state.trimEnd}
                trimStart={this.state.trimStart}
                onBack={this.handleBack}
                onCancel={this.handleCancel}
                onPlay={this.handlePlay}
                onRecord={this.handleRecord}
                onSetPlayhead={this.handleSetPlayhead}
                onSetTrimEnd={this.handleSetTrimEnd}
                onSetTrimStart={this.handleSetTrimStart}
                onStopPlaying={this.handleStopPlaying}
                onStopRecording={this.handleStopRecording}
                onSubmit={this.handleSubmit}
                height={this.state.height}  //rogic-mobile
                width={this.state.width}
            />
        );
    }
}

RecordModal.propTypes = {
    onClose: PropTypes.func,
    onDefaultClose: PropTypes.func,
    onNewSound: PropTypes.func,
    isSaveToVm: PropTypes.bool,
    vm: PropTypes.instanceOf(VM),
    onRequestClose: PropTypes.func
};

RecordModal.defaultProps = {
    isSaveToVm: true
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onDefaultClose: () => dispatch(closeSoundRecorder())
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RecordModal);
