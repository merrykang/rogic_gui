import PropTypes from 'prop-types';
import React from 'react';
import keyMirror from 'keymirror';
import {FormattedMessage} from 'react-intl';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';

import ScanningStep from '../../containers/sound-sync-modal/scanning-step.jsx';
import ErrorStep from './error-step.jsx';
import WarningStep from './warning-step.jsx';
import CopyStep from './copy-step.jsx';
import CompleteStep from './complete-step.jsx';
import UnavailableStep from './unavailable-step.jsx';

import styles from './sound-sync-modal.css';

const PHASES = keyMirror({
    scanning: null,
    warning: null,
    load: null,
    delete: null,
    write: null,
    complete: null,
    error: null,
    unavailable: null
});

const SoundSyncModalComponent = props => (

    <Modal
        className={styles.modalContent}
        contentLabel={
            <FormattedMessage
                defaultMessage='소리 동기화'
                description=''
                id='gui.soundSync.sync'
            />
        }
        headerClassName={styles.header}
        id="soundSync"
        onCancel={props.onCancel}
        useCancelButton={props.phase !== PHASES.complete}
        onOk={props.onOk}
        useOkButton={props.phase === PHASES.warning || props.phase === PHASES.complete}
        onRequestClose={null}
    >
        <Box
            className={styles.body}
            style={{ // rogic-mobile
                height: `${props.height}px`,
                width: `${props.width}px`
            }}
        >
            {props.phase === PHASES.scanning && <ScanningStep {...props} />}
            {props.phase === PHASES.warning && <WarningStep {...props} />}
            {(props.phase === PHASES.load || props.phase === PHASES.delete || props.phase === PHASES.write) && <CopyStep {...props} />}
            {props.phase === PHASES.complete && <CompleteStep {...props} />}
            {props.phase === PHASES.error && <ErrorStep {...props} />}
            {props.phase === PHASES.unavailable && <UnavailableStep {...props} />}
        </Box>
    </Modal>
);

SoundSyncModalComponent.propTypes = {
    onCancel: PropTypes.func.isRequired,
    phase: PropTypes.oneOf(Object.keys(PHASES)).isRequired,
    height: PropTypes.number,  // rogic-mobile
    width: PropTypes.number
};

export {
    SoundSyncModalComponent as default,
    PHASES
};
