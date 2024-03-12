import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall'; 
import {connect} from 'react-redux';

import {FormattedMessage} from 'react-intl';
import keyMirror from 'keymirror';

import warningIcon from '../components/message-modal/icon--warning.svg';
import infoIcon from '../components/message-modal/icon--info.svg';
import errorIcon from '../components/message-modal/icon--error.svg';

import MessageModalComponent from '../components/message-modal/message-modal.jsx';
import Box from '../components/box/box.jsx';
import styles from '../components/message-modal/message-modal.css';

const TYPE = keyMirror({
    warning: null,
    error: null,
    info: null
});

const _getContent = (type) => {
    let iconUrl = '';
    let contentLabel = '';
    if (type === TYPE.warning) {
        iconUrl = warningIcon;
        contentLabel = (
            <FormattedMessage
                defaultMessage="주의"
                description="경고 내용이 발생 했을때"
                id="gui.messageModal.warning"
            />
        );
    } else if (type === TYPE.error) {
        iconUrl = errorIcon;
        contentLabel = (
            <FormattedMessage
                defaultMessage="문제 발생"
                description="문제가 발생 했을때"
                id="gui.messageModal.error"
            />
        );
    } else if (type === TYPE.info) {
        iconUrl = infoIcon;
        contentLabel = (
            <FormattedMessage
                defaultMessage="안내"
                description="기본 정보 안내 할때"
                id="gui.messageModal.info"
            />
        );
    }
    return [iconUrl, contentLabel];
};

class MessageModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleCheckboxChange',
            'handleMakeCheckboxNode',
            'handleResize'  //rogic-mobile
        ]);
        this.state = {
            height: window.innerHeight,  //rogic-mobile
            width: window.innerWidth
        };
    }
    componentDidMount () {  // rogic-mobile
        this.handleResize();  
        window.addEventListener('resize', this.handleResize);
    }
    componentWillUnmount () {  // rogic-mobile
        window.removeEventListener('resize', this.handleResize);  
    }  
    shouldComponentUpdate (nextProps, nextState) {  // rogic-mobile
        if (this.state.width !== nextState.width ||  
            this.state.height !== nextState.height) {
            return true;
        }
        return false;
    }
    handleCheckboxChange (index, callback) {
        let checkboxItems = this.props.state.checkboxItems;
        checkboxItems[index].checked = !checkboxItems[index].checked;
        if (callback) callback();
        this.forceUpdate();
    }
    handleMakeCheckboxNode (checkboxItems) {
        return checkboxItems.map((item, index) => {
            const onCheckboxChange = () => this.handleCheckboxChange(index, item.onChange)

            return (
                <Box
                    className={styles.checkboxWrapper}
                    key={`message-modal-checkbox-option-${index}`}
                >
                    <input
                        className={styles.checkbox}
                        type="checkbox"
                        checked={item.checked}
                        onChange={onCheckboxChange}
                    />
                    <Box className={styles.checkboxLabel}>
                        {item.lebel}
                    </Box>
                </Box>
            );
        });
    }
    handleResize = () => {  //rogic-mobile
        this.setState({
            height: window.innerHeight - (5 * 16),  // header: 5rem
            width: window.innerWidth
        });
    };
    render () {
        const defaultState = {
            contentLabel: '',
            checkboxItems: [],
            type: TYPE.info,
            typeLabel: '',
            onOk: () => { },
            onCancel: () => { },
            onRequestClose: () => { },
            useOkButton: true,
            useCancelButton: true,
        }
        let {
            contentLabel,
            checkboxItems,
            onOk,
            onCancel,
            onRequestClose,
            type,
            typeLabel,
            useOkButton,
            useCancelButton
        } = Object.assign(defaultState, this.props.state);

        const contents = _getContent(type);
        const iconUrl = contents[0];
        contentLabel = contentLabel != '' ? contentLabel : contents[1];

        const checkboxNodes = this.handleMakeCheckboxNode(checkboxItems);
        return (
            <MessageModalComponent
                contentLabel={contentLabel}
                onOk={onOk}
                onCancel={onCancel}
                onRequestClose={onRequestClose}
                useOkButton={useOkButton}
                useCancelButton={useCancelButton}
                height={this.state.height}  //rogic-mobile
                width={this.state.width}
            >
                <Box className={styles.messageWrapper}>
                    <img
                        className={styles.iconImage}
                        src={iconUrl}
                    />
                    <div>
                        <Box className={styles.label}>
                            {typeLabel}
                        </Box>
                        {checkboxNodes.map(item => item)}
                    </div>
                </Box>
            </MessageModalComponent>
        );
    }
}

MessageModal.propTypes = {
    state: PropTypes.shape({
        contentLabel: PropTypes.oneOfType([
            PropTypes.string, PropTypes.object
        ]),
        onOk: PropTypes.func,
        onCancel: PropTypes.func,
        onRequestCloseMessageModal: PropTypes.func,
        type: PropTypes.oneOf(Object.keys(TYPE)),
        useOkButton: PropTypes.bool,
        useCancelButton: PropTypes.bool,
        iconUrl: PropTypes.string,
        typeLabel: PropTypes.string,
        checkboxItems: PropTypes.arrayOf(PropTypes.shape({
            label: PropTypes.string,
            checked: PropTypes.bool,
            onCheckboxChange: PropTypes.func
        }))
    })
};

const mapStateToProps = state => ({
    state: state.scratchGui.messageModal.state
});

export default connect(
    mapStateToProps
)(MessageModal);
export {TYPE};
