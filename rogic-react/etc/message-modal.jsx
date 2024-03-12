import PropTypes from 'prop-types';
import React from 'react';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';

import styles from './message-modal.css';

const MessageModalComponent = (props) => {
    return (
        <Modal
            className={styles.modalContent}
            contentLabel={props.contentLabel}
            onRequestClose={props.onRequestClose}
            onCancel={props.onCancel}
            onOk={props.onOk}
            useCancelButton={props.useCancelButton}
            useOkButton={props.useOkButton}
        >
            <Box
                className={styles.body}
                style={{ // rogic-mobile
                    height: `${props.height}px`,
                    width: `${props.width}px`
                }}
            >
                {props.children}
            </Box>
        </Modal>
    );
};

MessageModalComponent.propTypes = {
    contentLabel: PropTypes.oneOfType([
        PropTypes.string, PropTypes.object
    ]),
    children: PropTypes.node,
    onRequestClose: PropTypes.func,
    onCancel: PropTypes.func,
    onOk: PropTypes.func,
    useOkButton: PropTypes.bool,
    useCancelButton: PropTypes.bool,
    height: PropTypes.number,  // rogic-mobile
    width: PropTypes.number
};

export default MessageModalComponent;
