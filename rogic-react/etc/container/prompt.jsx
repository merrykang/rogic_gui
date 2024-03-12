import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import PromptComponent from '../components/prompt/prompt.jsx';
import VM from 'scratch-vm';

class Prompt extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleOk',
            'handleScopeOptionSelection',
            'handleCancel',
            'handleChange',
            'handleKeyPress',
            'handleResize'  //rogic-mobile
        ]);
        this.state = {
            inputValue: '',
            globalSelected: true,
            height: window.innerHeight,  //rogic-mobile
            width: window.innerWidth
        };
    }
    componentDidMount () {  // rogic-mobile
        this.handleResize();  
        window.addEventListener('resize', this.handleResize);
    }
    componentWillUnmount () {
        window.removeEventListener('resize', this.handleResize);  // rogic-mobile
    }
    shouldComponentUpdate (nextProps, nextState) {
        if (this.state.width !== nextState.width ||  // rogic-mobile
            this.state.height !== nextState.height) {
            return true;
        }
        return false;
    }
    handleKeyPress (event) {
        if (event.key === 'Enter') this.handleOk();
    }
    handleFocus (event) {
        event.target.select();
    }
    handleOk () {
        this.props.onOk(this.state.inputValue, {
            scope: this.state.globalSelected ? 'global' : 'local',
        });
    }
    handleCancel () {
        this.props.onCancel();
    }
    handleChange (e) {
        this.setState({inputValue: e.target.value});
    }
    handleScopeOptionSelection (e) {
        this.setState({globalSelected: (e.target.value === 'global')});
    }
    handleResize = () => {  //rogic-mobile
        this.setState({
            height: window.innerHeight - (5 * 16),  // header: 5rem
            width: window.innerWidth
        });
    };
    render () {
        return (
            <PromptComponent
                defaultValue={this.props.defaultValue}
                globalSelected={this.state.globalSelected}
                isStage={this.props.isStage}
                showListMessage={this.props.showListMessage}
                label={this.props.label}
                showVariableOptions={this.props.showVariableOptions}
                title={this.props.title}
                onCancel={this.handleCancel}
                onChange={this.handleChange}
                onFocus={this.handleFocus}
                onKeyPress={this.handleKeyPress}
                onOk={this.handleOk}
                onScopeOptionSelection={this.handleScopeOptionSelection}
                height={this.state.height}  //rogic-mobile
                width={this.state.width}
            />
        );
    }
}

Prompt.propTypes = {
    defaultValue: PropTypes.string,
    isStage: PropTypes.bool.isRequired,
    showListMessage: PropTypes.bool.isRequired,
    label: PropTypes.string.isRequired,
    onCancel: PropTypes.func.isRequired,
    onOk: PropTypes.func.isRequired,
    showVariableOptions: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    vm: PropTypes.instanceOf(VM)
};

export default Prompt;
