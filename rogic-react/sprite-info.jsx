import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {injectIntl, intlShape, defineMessages, FormattedMessage} from 'react-intl';

import Box from '../box/box.jsx';
import Label from '../forms/label.jsx';
import Input from '../forms/input.jsx';
import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import DirectionPicker from '../../containers/direction-picker.jsx';
import {isWideLocale} from '../../lib/locale-utils.js';

import styles from './sprite-info.css';

import showIcon from './icon--show.svg';
import hideIcon from './icon--hide.svg';

const BufferedInput = BufferedInputHOC(Input);
const messages = defineMessages({
    spritePlaceholder: {
        id: 'gui.spriteInfo.spritePlaceholder',
        defaultMessage: 'Name',
        description: 'Placeholder text for sprite name'
    }
});

class SpriteInfo extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'scrollSensor'
        ]);
        this.state = {
            infoWidth: null
        };
    }

    shouldComponentUpdate (nextProps, nextStates) {
        return (
            this.props.rotationStyle !== nextProps.rotationStyle ||
            this.props.disabled !== nextProps.disabled ||
            this.props.name !== nextProps.name ||
            this.props.visible !== nextProps.visible ||
            // Only update these if rounded value has changed
            Math.round(this.props.direction) !== Math.round(nextProps.direction) ||
            Math.round(this.props.size) !== Math.round(nextProps.size) ||
            Math.round(this.props.x) !== Math.round(nextProps.x) ||
            Math.round(this.props.y) !== Math.round(nextProps.y) ||
            this.state.infoWidth !== nextStates.infoWidth
        );
    }
    componentDidMount () {
        window.addEventListener('resize', this.scrollSensor);
    }
    componentWillUnmount () {
        window.removeEventListener('resize', this.scrollSensor);
    }
    scrollSensor () {
        var width = document.body.getElementsByClassName(styles.spriteInfo)[0].offsetWidth;
        if (this.state.scrollSensor != width) {
            this.setState({
                infoWidth: width
            })
        }
    }

    render () {
        const sprite = (
            <FormattedMessage
                defaultMessage="Sprite"
                description="Sprite info label"
                id="gui.spriteInfo.sprite"
            />
        );
        const showLabel = (
            <FormattedMessage
                defaultMessage="Show"
                description="Sprite info show label"
                id="gui.spriteInfo.show"
            />
        );
        const sizeLabel = (
            <FormattedMessage
                defaultMessage="Size"
                description="Sprite info size label"
                id="gui.spriteInfo.size"
            />
        );
        const labelAbove = isWideLocale(this.props.intl.locale);
        const spriteNameInput = (
            <BufferedInput
                className={classNames(
                    styles.nameInput,
                    {
                        [styles.columnInput]: labelAbove
                    }
                )}
                disabled={this.props.disabled}
                placeholder={this.props.intl.formatMessage(messages.spritePlaceholder)}
                tabIndex="0"
                type="text"
                value={this.props.disabled ? '' : this.props.name}
                onSubmit={this.props.onChangeName}
            />
        );
        const xPosition = (
            <div className={classNames(styles.column, styles.group, styles.columnLeft)}>
                <Label text="x" />
                <BufferedInput
                    className={classNames(styles.spriteInput, styles.smallInput)}
                    disabled={this.props.disabled}
                    placeholder="x"
                    tabIndex="0"
                    type="text"
                    value={this.props.disabled ? '' : Math.round(this.props.x)}
                    onSubmit={this.props.onChangeX}
                />
            </div>
        );
        const yPosition = (
            <div className={classNames(styles.column, styles.group, styles.columnRight)}>
                <Label text="y" />
                <BufferedInput
                    className={classNames(styles.spriteInput, styles.smallInput)}
                    disabled={this.props.disabled}
                    placeholder="y"
                    tabIndex="0"
                    type="text"
                    value={this.props.disabled ? '' : Math.round(this.props.y)}
                    onSubmit={this.props.onChangeY}
                />
            </div>
        );

        return (
            <Box className={styles.spriteInfo}>
                <div className={classNames(styles.column, styles.rowPrimary)}>
                    <Label
                        above={labelAbove}
                        text={sprite}
                    />
                    {spriteNameInput}
                </div>

                <div className={classNames(styles.row, styles.rowPrimary)}>
                    {xPosition}
                    {yPosition}
                </div>

                <div className={classNames(styles.row, styles.rowPrimary)}>
                    <div className={classNames(styles.column, styles.group, styles.columnLeft)}>
                        <Label
                            secondary
                            above={labelAbove}
                            text={sizeLabel}
                        />

                        <BufferedInput
                            className={classNames(styles.spriteInput, styles.smallInput)}
                            disabled={this.props.disabled}
                            label={sizeLabel}
                            tabIndex="0"
                            type="text"
                            value={this.props.disabled ? '' : Math.round(this.props.size)}
                            onSubmit={this.props.onChangeSize}
                        />
                    </div>

                    <DirectionPicker
                        className={classNames(styles.directionPickerWrapper, styles.directionPicker)}
                        direction={Math.round(this.props.direction)}
                        disabled={this.props.disabled}
                        labelAbove={labelAbove}
                        rotationStyle={this.props.rotationStyle}
                        onChangeDirection={this.props.onChangeDirection}
                        onChangeRotationStyle={this.props.onChangeRotationStyle}
                    />
                </div>


                <div className={classNames(styles.column, styles.group)}>
                    <Label
                        secondary
                        text={showLabel}
                    />

                    <div className={styles.radioWrapper}>
                        <div
                            className={classNames(
                                styles.radio,
                                styles.radioFirst,
                                styles.iconWrapper,
                                {
                                    [styles.isActive]: this.props.visible && !this.props.disabled,
                                    [styles.isDisabled]: this.props.disabled
                                }
                            )}
                            tabIndex="0"
                            onClick={this.props.onClickVisible}
                            onKeyPress={this.props.onPressVisible}
                        >
                            <img
                                className={styles.icon}
                                src={showIcon}
                            />
                        </div>
                        <div
                            className={classNames(
                                styles.radio,
                                styles.radioLast,
                                styles.iconWrapper,
                                {
                                    [styles.isActive]: !this.props.visible && !this.props.disabled,
                                    [styles.isDisabled]: this.props.disabled
                                }
                            )}
                            tabIndex="0"
                            onClick={this.props.onClickNotVisible}
                            onKeyPress={this.props.onPressNotVisible}
                        >
                            <img
                                className={styles.icon}
                                src={hideIcon}
                            />
                        </div>
                    </div>
                </div>
            </Box>
        );
    }
}

SpriteInfo.propTypes = {
    direction: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ]),
    disabled: PropTypes.bool,
    intl: intlShape,
    name: PropTypes.string,
    onChangeDirection: PropTypes.func,
    onChangeName: PropTypes.func,
    onChangeRotationStyle: PropTypes.func,
    onChangeSize: PropTypes.func,
    onChangeX: PropTypes.func,
    onChangeY: PropTypes.func,
    onClickNotVisible: PropTypes.func,
    onClickVisible: PropTypes.func,
    onPressNotVisible: PropTypes.func,
    onPressVisible: PropTypes.func,
    rotationStyle: PropTypes.string,
    size: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ]),
    visible: PropTypes.bool,
    x: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ]),
    y: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ])
};

export default injectIntl(SpriteInfo);
