import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import LibraryItem from '../../containers/library-item.jsx';
import Modal from '../../containers/modal.jsx';
import Divider from '../divider/divider.jsx';
import Filter from '../filter/filter.jsx';
import TagButton from '../../containers/tag-button.jsx';
import Spinner from '../spinner/spinner.jsx';

import styles from './library.css';

/**
 * rogic-mobile
 * */
import ActionMenu from '../action-menu/action-menu.jsx';
import fileUploadIcon from '../action-menu/icon--file-upload.svg';
import paintIcon from '../action-menu/icon--paint.svg';
import sharedMessages from '../../lib/shared-messages';

const messages = defineMessages({
    filterPlaceholder: {
        id: 'gui.library.filterPlaceholder',
        defaultMessage: 'Search',
        description: 'Placeholder text for library search field'
    },
    allTag: {
        id: 'gui.library.allTag',
        defaultMessage: 'All',
        description: 'Label for library tag to revert to all items after filtering by tag.'
    },
    addSpriteFromFile: {  // rogic-mobile
        id: 'gui.spriteSelector.addSpriteFromFile',
        description: 'Button to add a sprite in the target pane from file',
        defaultMessage: 'Upload Sprite'
    },
    addSpriteFromPaint: {
        id: 'gui.spriteSelector.addSpriteFromPaint',
        description: 'Button to add a sprite in the target pane from paint',
        defaultMessage: 'Paint'
    },
    addFileCostume: {
        defaultMessage: 'Upload Costume',
        description: 'Button to add a costume by uploading a file in the editor tab',
        id: 'gui.costumeTab.addFileCostume'
    },
    addBlankCostume: {
        defaultMessage: 'Paint',
        description: 'Button to add a blank costume in the editor tab',
        id: 'gui.costumeTab.addBlankCostume'
    },
    addFileBackdrop: {
        defaultMessage: 'Upload Backdrop',
        description: 'Button to add a backdrop by uploading a file in the editor tab',
        id: 'gui.costumeTab.addFileBackdrop'
    }
});

const ALL_TAG = {tag: 'all', intlLabel: messages.allTag};
const tagListPrefix = [ALL_TAG];

class LibraryComponent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClose',
            'handleDoubleClick',
            'handleFilterChange',
            'handleFilterClear',
            'handleMouseEnter',
            'handleMouseLeave',
            'handlePlayingEnd',
            'handleSelect',
            'handleScrollMove',
            'handleTagClick',
            'setFilteredDataRef',
            'setTapWrapper',
            'handleResize'  //rogic-mobile
        ]);
        this.state = {
            playingItem: null,
            filterQuery: '',
            selectedTag: ALL_TAG.tag,
            loaded: false,
            height: window.innerHeight,  //rogic-mobile
            width: window.innerWidth,
            filterHeight: window.innerHeight,
            isMobileUpload: true,
            isMobilePaint: true
        };
        this.isExtension = (this.props.id == 'deviceLibrary') || (this.props.id == 'extensionLibrary');
    }

    componentDidMount () {
        // Allow the spinner to display before loading the content
        setTimeout(() => {
            this.setState({loaded: true});
        });
        if (this.props.setStopHandler) this.props.setStopHandler(this.handlePlayingEnd);
        this.handleResize();  
        window.addEventListener('resize', this.handleResize);
    }
    componentWillUnmount () {
        window.removeEventListener('resize', this.handleResize);  // rogic-mobile
    }
    componentDidUpdate (prevProps, prevState) {
        if (prevState.filterQuery !== this.state.filterQuery ||
            prevState.selectedTag !== this.state.selectedTag) {
            this.scrollToTop();
        }
        if (prevState.width !== this.state.width ||  // rogic-mobile
            prevState.height !== this.state.height) {
            return true;
        }
    }
    handleSelect (id) {
        this.props.onItemSelected(this.getFilteredData()[id]);
    }
    handleDoubleClick (id) {
        this.handleClose();
        this.props.onItemDoubleClick(this.getFilteredData()[id]);
    }
    handleClose () {
        this.props.onRequestClose();
    }
    handleTagClick (tag) {
        if (this.state.playingItem === null) {
            this.setState({
                filterQuery: '',
                selectedTag: tag.toLowerCase()
            });
        } else {
            this.props.onItemMouseLeave(this.getFilteredData()[[this.state.playingItem]]);
            this.setState({
                filterQuery: '',
                playingItem: null,
                selectedTag: tag.toLowerCase()
            });
        }
    }
    handleMouseEnter (id) {
        // don't restart if mouse over already playing item
        if (this.props.onItemMouseEnter && this.state.playingItem !== id) {
            this.props.onItemMouseEnter(this.getFilteredData()[id]);
            this.setState({
                playingItem: id
            });
        }
    }
    handleMouseLeave (id) {
        if (this.props.onItemMouseLeave) {
            this.props.onItemMouseLeave(this.getFilteredData()[id]);
            this.setState({
                playingItem: null
            });
        }
    }
    handlePlayingEnd () {
        if (this.state.playingItem !== null) {
            this.setState({
                playingItem: null
            });
        }
    }
    handleFilterChange (event) {
        if (this.state.playingItem === null) {
            this.setState({
                filterQuery: event.target.value,
                selectedTag: ALL_TAG.tag
            });
        } else {
            this.props.onItemMouseLeave(this.getFilteredData()[[this.state.playingItem]]);
            this.setState({
                filterQuery: event.target.value,
                playingItem: null,
                selectedTag: ALL_TAG.tag
            });
        }
    }
    handleFilterClear () {
        this.setState({filterQuery: ''});
    }
    getFilteredData () {
        if (this.state.selectedTag === 'all') {
            if (!this.state.filterQuery) return this.props.data;
            return this.props.data.filter(dataItem => (
                (dataItem.tags || [])
                    // Second argument to map sets `this`
                    .map(String.prototype.toLowerCase.call, String.prototype.toLowerCase)
                    .concat(dataItem.name ?
                        (typeof dataItem.name === 'string' ?
                            // Use the name if it is a string, else use formatMessage to get the translated name
                            dataItem.name : this.props.intl.formatMessage(dataItem.name.props)
                        ).toLowerCase() :
                        null)
                    .join('\n') // unlikely to partially match newlines
                    .indexOf(this.state.filterQuery.toLowerCase()) !== -1
            ));
        }
        return this.props.data.filter(dataItem => (
            dataItem.tags &&
            dataItem.tags
                .map(String.prototype.toLowerCase.call, String.prototype.toLowerCase)
                .indexOf(this.state.selectedTag) !== -1
        ));
    }
    scrollToTop () {
        this.filteredDataRef.scrollTop = 0;
    }
    setFilteredDataRef (ref) {
        this.filteredDataRef = ref;
    }
    setTapWrapper (ref) {
        this.tapWrapper = ref;
    }
    handleScrollMove (e) {
        this.tapWrapper.scrollLeft += (e.deltaY / 10);
    }
    handleResize = () => {  //rogic-mobile
        this.setState({
            height: window.innerHeight - (5 * 16),  // header: 5rem
            width: window.innerWidth,
            filterHeight: window.innerHeight - (5 * 16 + 4.5 * 16),  // header: 3rem, filter: 4.5rem
        });
    };
    render () {
        return (
            <Modal
                fullScreen={this.props.fullScreen}
                contentLabel={this.props.title} 
                id={this.props.id}
                onCancel={this.handleClose}
                onOk={this.props.onOk}
                onRequestClose={this.handleClose}
                setTabIndex={this.props.setTabIndex}  // rogic-mobile
                tabIndex={this.props.tabIndex}
                showTabs={this.props.showTabs}
            >
                {(this.props.filterable || this.props.tags) && (
                    <div className={styles.filterBar} style={{width: `${this.state.width}px`}}>
                        {this.props.filterable && (
                            <Filter
                                className={classNames(
                                    styles.filterBarItem,
                                    styles.filter
                                )}
                                filterQuery={this.state.filterQuery}
                                inputClassName={styles.filterInput}
                                placeholderText={this.props.intl.formatMessage(messages.filterPlaceholder)}
                                onChange={this.handleFilterChange}
                                onClear={this.handleFilterClear}
                            />
                        )}
                        {this.props.filterable && this.props.tags && (
                            <Divider className={classNames(styles.filterBarItem, styles.divider)} />
                        )}
                        {this.props.tags &&
                            <div
                                className={styles.tagWrapper}
                                ref={this.setTapWrapper}
                                onWheel={this.handleScrollMove}
                            >
                                {tagListPrefix.concat(this.props.tags).map((tagProps, id) => (
                                    <TagButton
                                        active={this.state.selectedTag === tagProps.tag.toLowerCase()}
                                        className={classNames(
                                            styles.filterBarItem,
                                            styles.tagButton,
                                            tagProps.className
                                        )}
                                        key={`tag-button-${id}`}
                                        onClick={this.handleTagClick}
                                        {...tagProps}
                                    />
                                ))}
                            </div>
                        }
                    </div>
                )}
                <div
                    className={this.isExtension ? classNames(styles.libraryScrollGrid, styles.extensionLibraryScrollGrid) : classNames(styles.libraryScrollGrid)}
                    ref={this.setFilteredDataRef}
                    id='library_library-item-wrapper'
                    style={{  // rogic-mobile
                        height: this.props.filterable ? `${this.state.filterHeight}px` : `${this.state.height}px`,
                        width: `${this.state.width}px`
                    }}
                >
                    {this.props.filterable ?  // rogic-mobile
                        <div style={{
                            position: 'sticky',
                            zIndex: 100,
                            top: 0
                        }}>
                            <>
                                <ActionMenu
                                    className={styles.addButton}
                                    isMobileUpload={this.state.isMobileUpload}
                                    img={fileUploadIcon}
                                    title={this.props.isCostume ? this.props.intl.formatMessage(messages.addFileCostume) :
                                        this.props.isBackdrop ? this.props.intl.formatMessage(messages.addFileBackdrop) :
                                            this.props.intl.formatMessage(messages.addSpriteFromFile)}
                                    onClick={this.props.onFileUploadClick}
                                />
                                <ActionMenu
                                    className={styles.addButton}
                                    isMobilePaint={this.state.isMobilePaint}
                                    img={paintIcon}
                                    title={(this.props.isCostume || this.props.isBackdrop) ? this.props.intl.formatMessage(messages.addBlankCostume) : this.props.intl.formatMessage(messages.addSpriteFromPaint)}
                                    onClick={(this.props.isCostume || this.props.isBackdrop) ? this.props.onPaintCostumeClick : this.props.onPaintSpriteClick}
                                />
                                {this.state.isMobileUpload ?
                                    <input
                                        accept='.rso, .svg, .png, .jpg, .jpeg, .sprite2, .sprite3, .gif'
                                        className={styles.fileInput}
                                        multiple={true}
                                        ref={this.props.fileInputRef}
                                        type="file"
                                        onChange={this.props.isBackdrop ? this.props.onBackdropFileUpload : this.props.onSpriteUpload}
                                    />
                                    : null
                                }
                            </>
                        </div>
                        : null                        
                    }
                    {this.state.loaded ? this.getFilteredData().map((dataItem, index) => (
                        <LibraryItem
                            description={dataItem.description}
                            disabled={dataItem.disabled}
                            extensionId={dataItem.extensionId}
                            deviceId={dataItem.deviceId}
                            featured={dataItem.featured}
                            hidden={dataItem.hidden}
                            iconMd5={dataItem.costumes ? dataItem.costumes[0].md5ext : dataItem.md5ext}
                            iconRawURL={dataItem.rawURL}
                            icons={dataItem.costumes}
                            id={index}
                            insetIconURL={dataItem.insetIconURL}
                            isPlaying={this.state.playingItem === index}
                            key={typeof dataItem.name === 'string' ? dataItem.name : dataItem.rawURL}
                            name={dataItem.name}
                            showPlayButton={this.props.showPlayButton}
                            onMouseEnter={this.handleMouseEnter}
                            onMouseLeave={this.handleMouseLeave}
                            onSelect={this.handleSelect}
                            onDoubleClick={this.handleDoubleClick}
                        />
                    )) : (
                        <div className={styles.spinnerWrapper}>
                            <Spinner
                                large
                                level="primary"
                            />
                        </div>
                    )}
                </div>
            </Modal>
        );
    }
}

LibraryComponent.propTypes = {
    data: PropTypes.arrayOf(
        /* eslint-disable react/no-unused-prop-types, lines-around-comment */
        // An item in the library
        PropTypes.shape({
            // @todo remove md5/rawURL prop from library, refactor to use storage
            md5: PropTypes.string,
            name: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.node
            ]),
            rawURL: PropTypes.string
        })
        /* eslint-enable react/no-unused-prop-types, lines-around-comment */
    ),
    filterable: PropTypes.bool,
    fullScreen: PropTypes.bool,
    id: PropTypes.string.isRequired,
    intl: intlShape.isRequired,
    onItemMouseEnter: PropTypes.func,
    onItemMouseLeave: PropTypes.func,
    onItemSelected: PropTypes.func,
    onItemDoubleClick: PropTypes.func,
    onOk: PropTypes.func,
    onRequestClose: PropTypes.func,
    setStopHandler: PropTypes.func,
    showPlayButton: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.shape(TagButton.propTypes)),
    title: PropTypes.string.isRequired,
    setTabIndex: PropTypes.func,  // rogic-mobile
    tabIndex: PropTypes.number,
    showTabs: PropTypes.bool,
    onFileUploadClick: PropTypes.func,
    onSpriteUpload: PropTypes.func,
    fileInputRef: PropTypes.func,
    onPaintSpriteClick: PropTypes.func,
    isCostume: PropTypes.bool,
    onPaintCostumeClick: PropTypes.func,
    isBackdrop: PropTypes.bool,
    onBackdropFileUpload: PropTypes.func
};

LibraryComponent.defaultProps = {
    filterable: true,
    showPlayButton: false
};

export default injectIntl(LibraryComponent);
