import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import VM from 'scratch-vm';
import AudioEngine from 'scratch-audio';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import Modal from '../../../containers/modal.jsx';
import Box from '../../box/box.jsx';
import PlayButton from '../../../containers/play-button.jsx';
import UpperMenu from '../upper-menu/upper-menu.jsx';
import Tabs from '../tabs/tabs.jsx';
import Filter from '../../filter/filter.jsx';
import TagButton from '../../../containers/tag-button.jsx';
import Spinner from '../../spinner/spinner.jsx';
import Divider from '../../divider/divider.jsx';
import soundTags from '../../../lib/libraries/sound-tags';

import styles from './sound-list.css';
import libraryStyles from '../../library/library.css';
import libraryItemStyles from '../../library-item/library-item.css';

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
    }
});

const ALL_TAG = {tag: 'all', intlLabel: messages.allTag};
const tagListPrefix = [ALL_TAG];

class SoundListComponent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'itemFilter',
            'setUpperMenu',
            'stopPlayingSound',
            'playSound',
            'handleItemClick',
            'handleItemMouseEnter',
            'handleItemMouseLeave',
            'handleItemDoubleClick',
            'handleFilterChange',
            'handleFilterClear',
            'handleScrollMove',
            'handleKeyPress',
            'handleTagClick',
            'handlePlay',
            'handleStop',
            'onStop',
            'getSoundData',
            'handleResize',   // rogic-mobile
            'setSoundTabIndex'  // rogic-mobile
        ]);
        this.state = {
            playingItem: null,
            filterQuery: '',
            selectedTag: ALL_TAG.tag,
            filterHeight: window.innerHeight,  //rogic-mobile
            width: window.innerWidth,
            showSoundTabs: true,
            soundTabIndex: 0
        };
        /**
         * AudioEngine that will decode and play sounds for us.
         * @type {AudioEngine}
         */
        this.audioEngine = null;
    }
    componentDidMount () {
        this.audioEngine = new AudioEngine();
        this.playingSoundPromise = null;
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
    }
    componentWillUnmount () {
        this.stopPlayingSound();
        window.removeEventListener('resize', this.handleResize);  // rogic-mobile
    }
    componentDidUpdate (prevProps, prevState) {  // rogic-mobile
        if (prevState.width !== this.state.width || 
            prevState.height !== this.state.height) {
            return true;
        }
    }
    itemFilter (item) {
        if (this.state.selectedTag === ALL_TAG.tag) {
            if (!this.state.filterQuery) return true;
            return ((item.tags || [])
                // Second argument to map sets `this`
                .map(String.prototype.toLowerCase.call, String.prototype.toLowerCase)
                .concat(item.name ?
                    (typeof item.name === 'string' ?
                        // Use the name if it is a string, else use formatMessage to get the translated name
                        item.name : this.props.intl.formatMessage(item.name.props)
                    ).toLowerCase() :
                    null)
                .join('\n') // unlikely to partially match newlines
                .indexOf(this.state.filterQuery.toLowerCase()) !== -1)
        } else {
            return (item.tags &&
                item.tags
                    .map(String.prototype.toLowerCase.call, String.prototype.toLowerCase)
                    .indexOf(this.state.selectedTag) !== -1)
        }
    }
    setUpperMenu (ref) {
        this.upperMenu = ref;
    }
    stopPlayingSound () {
        // [재생이 대기 중이거나 재생 중이거나 최근에 재생되고 정상적으로 종료되었습니다.]
        if (this.playingSoundPromise !== null) {
            // [소리를 강제로 중지하므로 소리가 끝나는 것을 듣지 마십시오.]
            this.playingSoundPromise.then(soundPlayer => {
                return soundPlayer.removeListener('stop', this.onStop);
            });
            // [이 방법 전에 대기 재생이 시작되었습니다.]
            if (this.playingSoundPromise.isPlaying) {
                // [Promise에서 플레이어를 가져오고 곧 재생을 중지합니다.]
                this.playingSoundPromise.then(soundPlayer => {
                    soundPlayer.stop();
                });
            } else {
                // [Promise에서 플레이어를 가져오고 즉시 중지하십시오. 사운드가
                // 아직 재생되지 않았기 때문에이 콜백은 사운드 재생이 시작된 직
                // 후에 호출됩니다.즉시 중지하면 소리가 재생되지 않는 효과가 있
                // 습니다.]
                this.playingSoundPromise.then(soundPlayer => {
                    soundPlayer.stopImmediately();
                });
            }
            // [이 Promise와 soundPlayer에 대해 더 이상의 작업을 수행해서는 안됩니다.]
            this.playingSoundPromise = null;
        }
    }
    playSound (soundItem) {
        // [엔터가 두 번 호출되는 경우 해당 리가없이 두 번 호출되면 새 사운드를
        // 대기열에 추가하기 전에 마지막 재생을 중지합니다.]
        this.stopPlayingSound();

        let getSoundPlayerPromise = null;

        if (soundItem.asset) {
            const soundAsset = soundItem.asset;
            getSoundPlayerPromise = new Promise((resolve) => {
                resolve(this.audioEngine.decodeSoundPlayer({data: soundAsset.data}));
            });
        } else {
            const idParts = soundItem._md5.split('.');
            const md5 = idParts[0];

            getSoundPlayerPromise = this.props.vm.runtime.storage.load(this.props.vm.runtime.storage.AssetType.Sound, md5)
                .then(soundAsset => {
                    return this.audioEngine.decodeSoundPlayer({data: soundAsset.data});
                });
        }

        // [Promise를 저장하면 사운드를 중지하는 코드가 재생 명령 다음에 중지
        // 명령을 대기열에 넣을 수 있습니다.]
        this.playingSoundPromise = getSoundPlayerPromise.then(soundPlayer => {
            soundPlayer.connect(this.audioEngine);
            // [소리를 재생합니다. 사운드가 일찍 중지되어야하는 경우 사운드
            // 재생은 항상 페어링 된 중지 전에옵니다.]
            soundPlayer.play();
            soundPlayer.addListener('stop', this.onStop);
            // [소리가 재생되도록 설정합니다. 이는 사운드가 일찍 중지되어야하는
            // 경우 제공되는 중지 명령 유형에 영향을줍니다.]
            if (this.playingSoundPromise !== null) {
                this.playingSoundPromise.isPlaying = true;
            }
            return soundPlayer;
        });
    }
    handleItemClick (e) {
        // handleItemMouseEnter 전 클릭
        if (!this.focused) {
            const id = e.currentTarget.getAttribute("id");
            this.focused = id;
        }
        this.props.setSelectedItem(this.focused);
    }
    handleItemMouseEnter (e) {
        const id = e.currentTarget.getAttribute("id");
        this.focused = id;
    }
    handleItemMouseLeave () {
        this.stopPlayingSound();
        this.focused = null;
    }
    handleItemDoubleClick () {
        this.props.onOk();
    }
    handleFilterChange (event) {
        this.setState({
            filterQuery: event.target.value,
            selectedTag: ALL_TAG.tag
        });
        if (this.state.playingItem !== null) {
            this.props.setSelectedItem(null);
        }
    }
    handleFilterClear () {
        this.setState({filterQuery: ''});
    }
    handleScrollMove (e) {
        this.tagWrapper.scrollLeft += (e.deltaY / 10);
    }
    handleKeyPress (e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this.handleItemDoubleClick();
        }
    }
    handleTagClick (tag) {
        this.setState({
            filterQuery: '',
            selectedTag: tag.toLowerCase()
        });
        if (this.props.selectedItem !== null) {
            this.props.setSelectedItem(null);
        }
    }
    handlePlay (e) {
        // handleItemMouseEnter 전 재생 될때
        if (!this.focused) {
            const id = e.currentTarget.parentElement.getAttribute("id");
            this.focused = id;
        }
        const soundItem = this.getSoundData()[this.focused];
        this.setState({
            playingItem: Number(this.focused)
        })
        this.playSound(soundItem);
    }
    handleStop () {
        this.stopPlayingSound();
        this.setState({
            playingItem: null
        })
    }
    onStop () {
        if (this.playingSoundPromise !== null) {
            this.playingSoundPromise.then(soundPlayer => soundPlayer.removeListener('stop', this.onStop));
            if (this.handleStop) this.handleStop();
        }
    }
    getSoundData () {
        if (this.state.soundTabIndex == 0) {
            return this.props.storageSounds
        } else if (this.state.soundTabIndex == 1) {
            return this.props.customSounds;
        }
    }
    handleResize = () => {  //rogic-mobile
        this.setState({
            filterHeight: window.innerHeight - (3 * 16 + 4.5 * 16),  // header: 3rem, filter: 4.5rem
            width: window.innerWidth 
        });
    };
    setSoundTabIndex (index) {  // rogic-mobile
        this.setState({soundTabIndex: index});
    };
    render () {
        let soundData = this.getSoundData();

        return (
            <Modal
                className={null}
                useFooter={true}
                useHeader={true}  // rogic-mobile
                onRequestClose={this.props.onCancel}
                useCancelButton={true}
                onCancel={this.props.onCancel}
                onOk={this.props.onOk}
                setSoundTabIndex={this.setSoundTabIndex}
                onSyncClick={this.props.onSyncClick}
                soundTabIndex={this.state.soundTabIndex}
                showSoundTabs={this.state.showSoundTabs}
            >
                {this.state.showSoundTabs && (this.state.soundTabIndex == 0 ? (
                    <div
                        className={libraryStyles.filterBar}
                        ref={ref => this.filterBar = ref}
                        style={{width: `${this.state.width}px`}}
                    >
                        <Filter
                            className={classNames(
                                libraryStyles.filterBarItem,
                                libraryStyles.filter
                            )}
                            filterQuery={this.state.filterQuery}
                            inputClassName={libraryStyles.filterInput}
                            placeholderText={this.props.intl.formatMessage(messages.filterPlaceholder)}
                            onChange={this.handleFilterChange}
                            onClear={this.handleFilterClear}
                        />
                        <Divider className={classNames(libraryStyles.filterBarItem, libraryStyles.divider)} />
                        <div
                            className={libraryStyles.tagWrapper}
                            ref={ref => this.tagWrapper = ref}
                            onWheel={(e) => this.handleScrollMove(e)}
                        >
                            {tagListPrefix.concat(soundTags).map((tagProps, id) => (
                                <TagButton
                                    active={this.state.selectedTag === tagProps.tag.toLowerCase()}
                                    className={classNames(
                                        libraryStyles.filterBarItem,
                                        libraryStyles.tagButton,
                                        tagProps.className
                                    )}
                                    key={`tag-button-${id}`}
                                    onClick={this.handleTagClick}
                                    {...tagProps}
                                />
                            ))}
                        </div>
                    </div>
                ) : <UpperMenu
                        onChangeRecordPhase={this.props.onChangeRecordPhase}
                        onChangeName={this.props.onChangeName}
                        onDelete={this.props.onDelete}
                        onNewSound={this.props.onNewSound}
                        tabIndex={this.state.soundTabIndex}
                        selectedItem={this.props.selectedItem}
                        selectedName={soundData[this.props.selectedItem] ?
                            soundData[this.props.selectedItem].name : ''}
                        setUpperMenu={this.setUpperMenu}
                        storageSounds={this.props.storageSounds}
                        customSounds={this.props.customSounds}
                        vm={this.props.vm}
                    />
                )
                }
                <div
                    className={classNames(libraryStyles.libraryScrollGrid)}
                    ref={ref => this.libraryScrollGrid = ref}
                    style={{  // rogic-mobile
                        height: `${this.state.filterHeight}px`,
                        width: `${this.state.width}px`
                    }}
                >
                    {this.props.soundLoaded ? soundData.map((dataItem, index) => {
                        // 소리 저장소에만 필터가 적용
                        if (this.state.soundTabIndex == 0 && !this.itemFilter(dataItem)) return null;
                        return (
                            <Box
                                className={classNames(
                                    styles.libraryItem,
                                    index === this.props.selectedItem ? styles.libraryItemFocus : null
                                )}
                                key={typeof dataItem.name === 'string' ? dataItem.name : dataItem.rawURL}
                                id={index}
                                role="button"
                                tabIndex="0"
                                onClick={this.handleItemClick}
                                onDoubleClick={this.handleItemDoubleClick}
                                onKeyPress={this.handleKeyPress}
                                onMouseEnter={this.handleItemMouseEnter}
                                onMouseLeave={this.handleItemMouseLeave}
                            >
                                {/* Layers of wrapping is to prevent layout thrashing on animation */}
                                <Box className={libraryItemStyles.libraryItemImageContainerWrapper}>
                                    <Box
                                        className={libraryItemStyles.libraryItemImageContainer}
                                    >
                                        <img
                                            className={libraryItemStyles.libraryItemImage}
                                            src={this.props.iconURL}
                                        />
                                    </Box>
                                </Box>
                                <span className={libraryItemStyles.libraryItemName}>{dataItem.name}</span>
                                <PlayButton
                                    isPlaying={this.state.playingItem === index}
                                    onPlay={this.handlePlay}
                                    onStop={this.handleStop}
                                />
                            </Box>
                        )
                    }) : (
                            <div
                                className={libraryStyles.spinnerWrapper}
                                style={{height: '100%'}}
                            >
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
};

SoundListComponent.propTypes = {
    iconURL: PropTypes.string,
    intl: intlShape.isRequired,
    storageSounds: PropTypes.arrayOf(PropTypes.object),
    customSounds: PropTypes.arrayOf(PropTypes.object),
    onCancel: PropTypes.func,
    onChangeOptionPhase: PropTypes.func,
    onChangeRecordPhase: PropTypes.func,
    onChangeName: PropTypes.func,
    onDelete: PropTypes.func,
    onNewSound: PropTypes.func,
    onOk: PropTypes.func,
    onSyncClick: PropTypes.func,
    soundLoaded: PropTypes.bool,
    selectedItem: PropTypes.number,
    setSelectedItem: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default injectIntl(SoundListComponent);
