import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import ReactModal from 'react-modal';
import {FormattedMessage} from 'react-intl';
import Tabs from '../sprite-selector/tabs/tabs.jsx';  // rogic-mobile
import SoundTabs from '../sound-modal/tabs/tabs.jsx';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import helpIcon from '../../lib/assets/icon--help.svg';
import cancelIcon from './icon--cancel.svg';
import oklIcon from './icon--ok.svg';

import styles from './modal.css';

/*
 * 대화 상자의 기본 구조로 header, body, footer로 구성 되어 있으며 body는 children을 사용한다.
*/
const ModalComponent = props => {
    const showTabs = props.showTabs;  // rogic-mobile
    const showSoundTabs = props.showSoundTabs;
    return (
        <ReactModal
            isOpen
            className={classNames(styles.modalContent, props.className, {
                [styles.fullScreen]: props.fullScreen
            })}
            contentLabel={props.useHeader ? String(props.contentLabel) : null}
            overlayClassName={styles.modalOverlay}
            onRequestClose={props.onRequestClose}
        >
            <Box
                dir={props.isRtl ? 'rtl' : 'ltr'}
                direction="column"
                grow={1}
            >
                {props.useHeader
                    ? (props.header
                        ? props.header
                        : <div className={classNames(styles.header, props.headerClassName)}>
                            {props.onHelp ? (
                                <div
                                    className={classNames(
                                        styles.headerItem,
                                        styles.headerItemHelp
                                    )}
                                >
                                    <Button
                                        className={styles.helpButton}
                                        iconSrc={helpIcon}
                                        onClick={props.onHelp}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Help"
                                            description="Help button in modal"
                                            id="gui.modal.help"
                                        />
                                    </Button>
                                </div>
                            ) : null}
                            {props.useCancelButton ?
                                <Button
                                    className={props.disableCancelButton ? styles.disableCancelButton : styles.cancelButton}
                                    iconSrc={cancelIcon}
                                    onClick={props.disableCancelButton ? null : props.onCancel}
                                >
                                </Button>
                            : null}
                            <div
                                className={classNames(
                                    styles.headerItem,
                                    styles.headerItemTitle
                                )}
                            >
                                {props.headerImage ? (
                                    <img
                                        className={styles.headerImage}
                                        src={props.headerImage}
                                    />
                                ) : null}
                                {showTabs ?
                                    <Tabs
                                        setTabIndex={props.setTabIndex}
                                        tabIndex={props.tabIndex}
                                    /> : props.contentLabel
                                }
                                {showSoundTabs ?
                                    <SoundTabs
                                        setTabIndex={props.setSoundTabIndex}
                                        onSyncClick={props.onSyncClick}
                                        tabIndex={props.soundTabIndex}
                                    /> : null
                                }
                            </div>
                            {props.useOkButton ?
                                <Button
                                    className={props.disableOkButton ? styles.disableOkButton : styles.okButton}
                                    iconSrc={oklIcon}
                                    onClick={props.disableOkButton ? null : props.onOk}
                                >
                                </Button>
                                : null
                            }
                        </div>
                    )
                    : null
                }
                {props.children}
            </Box>
        </ReactModal>
    ); 
};
ModalComponent.propTypes = {
    children: PropTypes.node, //body
    className: PropTypes.string,
    contentLabel: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object
    ]),
    footer: PropTypes.node,
    fullScreen: PropTypes.bool,
    header: PropTypes.node,
    headerClassName: PropTypes.string,
    headerImage: PropTypes.string,
    isRtl: PropTypes.bool,
    onCancel: PropTypes.func,
    onOk: PropTypes.func,
    onHelp: PropTypes.func,
    onRequestClose: PropTypes.func,
    useFooter: PropTypes.bool,  // footer 사용 여부 기본 true, 사용하지 않을 경우 false 
    useHeader: PropTypes.bool,   // header 사용 여부 기본 true, 사용하지 않을 경우 false
    useCancelButton: PropTypes.bool,
    useOkButton: PropTypes.bool,
    setTabIndex: PropTypes.func,  // rogic-mobile
    tabIndex: PropTypes.number,
    showTabs: PropTypes.bool,
    setSoundTabIndex: PropTypes.func,
    onSyncClick: PropTypes.func,
    soundTabIndex: PropTypes.number,
    showSoundTabs: PropTypes.bool
};
ModalComponent.defaultProps = {
    useHeader: true,
    useFooter: true,
    useCancelButton: true,
    useOkButton: true,
    disableOkButton: false
};
export default ModalComponent;
