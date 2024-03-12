import PropTypes from 'prop-types';
import React from 'react';
import keyMirror from 'keymirror';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';

import ScanningStep from '../../containers/connection-modal/scanning-step.jsx';
import AutoScanningStep from '../../containers/connection-modal/auto-scanning-step.jsx';
import ConnectingStep from './connecting-step.jsx';
import ConnectedStep from './connected-step.jsx';
import ErrorStep from './error-step.jsx';
import UnavailableStep from './unavailable-step.jsx';

import styles from './connection-modal.css';

const PHASES = keyMirror({
    scanning: null,
    connecting: null,
    connected: null,
    error: null,
    unavailable: null
});

const ConnectionModalComponent = props => (

    <Modal
        className={styles.modalContent}
        contentLabel={props.device.isExtension ? props.info.name : props.device.name}
        headerClassName={styles.header}
        headerImage={props.info.connectionSmallIconURL}
        id="connectionModal"
        onCancel={props.onCancel}
        useOkButton={false}
        onRequestClose={props.onCancel}
    >
        <Box
            className={styles.body}
            style={{ // rogic-mobile
                height: `${props.height}px`,
                width: `${props.width}px`
            }}
        >
            {props.phase === PHASES.scanning && !props.info.useAutoScan && <ScanningStep {...props} />}
            {props.phase === PHASES.scanning && props.info.useAutoScan && <AutoScanningStep {...props} />}
            {props.phase === PHASES.connecting && <ConnectingStep {...props} />}
            {props.phase === PHASES.connected && <ConnectedStep {...props} />}
            {props.phase === PHASES.error && <ErrorStep {...props} />}
            {props.phase === PHASES.unavailable && <UnavailableStep {...props} />}
        </Box>
    </Modal>
);

ConnectionModalComponent.propTypes = {
    info: PropTypes.object.isRequired,
    device: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired,
    phase: PropTypes.oneOf(Object.keys(PHASES)).isRequired,
    height: PropTypes.number,  // rogic-mobile
    width: PropTypes.number
};

ConnectionModalComponent.defaultProps = {
    connectingMessage: 'Connecting'
};

export {
    ConnectionModalComponent as default,
    PHASES
};
