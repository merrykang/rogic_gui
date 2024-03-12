import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import {FormattedMessage} from 'react-intl';
import styles from './tabs.css';

/**
 * [TODO]
 *  - 스프라이트 고르기 / 장치 고르기에 알맞은 formatted message 작성 (얘는 형식일뿐)
 * */
class TabsComponent extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleChangeList'
        ]);
    }
    handleChangeList (index) {
        this.props.setTabIndex(Number(index));
    }
    render () {
        return (
            <div
                className={styles.header}
            >
                <div
                    className={styles.headerWapper}
                >
                    <div
                        className={classNames(
                            styles.headerButton,
                            this.props.tabIndex !== 0 ? styles.headerButtonDisable : null
                        )}
                        onClick={() => this.handleChangeList(0)}
                        index={0}
                    >
                        <FormattedMessage  
                            defaultMessage="스프라이트 고르기"
                            description="스프라이트 고르기"
                            id="gui.spriteLibrary.chooseASprite"
                        />
                    </div>
                    <div
                        className={styles.line}
                    />
                    <div
                        className={classNames(
                            styles.headerButton,
                            this.props.tabIndex !== 1 ? styles.headerButtonDisable : null
                        )}
                        onClick={() => this.handleChangeList(1)}
                        index={1}
                    >
                        <FormattedMessage
                            defaultMessage="장치 고르기"
                            description="장치 고르기"
                            id="gui.deviceLibrary.chooseADevice"
                        />
                    </div>
                </div>
            </div>
        );
    }
}
TabsComponent.propTypes = {
    setTabIndex: PropTypes.func,
    tabIndex: PropTypes.number
};
TabsComponent.defaultProps = {

};
export default TabsComponent;
