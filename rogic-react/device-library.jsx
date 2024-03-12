import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import deviceLibraryContent from '../lib/libraries/devices/index.jsx';
import storage from '../lib/storage';

import LibraryComponent from '../components/library/library.jsx';
import extensionIcon from '../components/action-menu/icon--sprite.svg';

import robokitRS from '!raw-loader!../lib/libraries/devices/robokit-rs/robokit-rs-small.svg';
import roduino from '!raw-loader!../lib/libraries/devices/roduino/roduino-small.svg';
import rdrone from '!raw-loader!../lib/libraries/devices/rdrone/rdrone-small.svg';
import cube from '!raw-loader!../lib/libraries/devices/cube/cube-small.svg';
import roe from '!raw-loader!../lib/libraries/devices/roe/roe-illustration.svg'; // 흰색으로 인해 테두리 있는 버전 사용
import kiro from '!raw-loader!../lib/libraries/devices/kiro/kiro-small.svg';

const messages = defineMessages({
    deviceTitle: {
        defaultMessage: 'Choose an Device',
        description: 'Heading for the device library',
        id: 'gui.deviceLibrary.chooseADevice'
    },
    deviceUrl: {
        defaultMessage: 'Enter the URL of the device',
        description: 'Prompt for unoffical device url',
        id: 'gui.extensionLibrary.extensionUrl'
    },
});

class DeviceLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleOk',
            'handleItemSelect',
            'handleItemDoubleClick'
        ]);
        this.selected = null;
    }

    handleOk () {
        if (this.selected) {
            const asset = this.getAssets(this.selected.deviceId);
            this.props.vm.addDevice(JSON.stringify(this.itemToJson(this.selected)), asset)
                .then(() => {
                    this.props.onActivateBlocksTab();
                });
        }
        this.props.onRequestClose();
    }

    handleItemSelect (item) {
        this.selected = item;
    }

    handleItemDoubleClick (item) {
        this.handleItemSelect(item);
        this.handleOk();
    }

    itemToJson (item) {
        let device = {
            objName: this.props.intl.formatMessage({
                id: item.name.props.id,
                description: item.name.props.description,
                defaultMessage: item.name.props.defaultMessage
            }),
            //objName:item.name,
            sounds: [],
            costumes: [],
            currentCostumeIndex: 0,
            deviceId: item.deviceId,
            scratchX: 0,
            scratchY: 0,
            scale: 1,
            direction: 90,
            rotationStyle: "normal",
            isDraggable: false,
            visible: true,
            spriteInfo: {}
        };
        return device;
    }

    getAssets (id) {
        const TextEncoder = require('text-encoding').TextEncoder;
        const encoder = new TextEncoder();
        switch (id) {
            case "robokitRS": {
                const asset = storage.createAsset(
                    storage.AssetType.ImageVector,
                    storage.DataFormat.SVG,
                    encoder.encode(robokitRS),
                    null,
                    true // generate md5
                );

                return {
                    assetId: asset.assetId,
                    name: "robokitRS-a",
                    bitmapResolution: 1,
                    md5: `${asset.assetId}.${asset.dataFormat}`,
                    dataFormat: asset.dataFormat,
                    rotationCenterX: 90,
                    rotationCenterY: 90,
                    asset: asset
                };
            } break;
            case "kiro": {
                const asset = storage.createAsset(
                    storage.AssetType.ImageVector,
                    storage.DataFormat.SVG,
                    encoder.encode(kiro),
                    null,
                    true // generate md5
                );

                return {
                    assetId: asset.assetId,
                    name: "kiro-a",
                    bitmapResolution: 1,
                    md5: `${asset.assetId}.${asset.dataFormat}`,
                    dataFormat: asset.dataFormat,
                    rotationCenterX: 90,
                    rotationCenterY: 90,
                    asset: asset
                };
            } break;
            case "roduino": {
                const asset = storage.createAsset(
                    storage.AssetType.ImageVector,
                    storage.DataFormat.SVG,
                    encoder.encode(roduino),
                    null,
                    true // generate md5
                );

                return {
                    assetId: asset.assetId,
                    name: "roduino-a",
                    bitmapResolution: 1,
                    md5: `${asset.assetId}.${asset.dataFormat}`,
                    dataFormat: asset.dataFormat,
                    rotationCenterX: 90,
                    rotationCenterY: 90,
                    asset: asset
                };
            } break;
            case "rdrone": {
                const asset = storage.createAsset(
                    storage.AssetType.ImageVector,
                    storage.DataFormat.SVG,
                    encoder.encode(rdrone),
                    null,
                    true // generate md5
                );

                return {
                    assetId: asset.assetId,
                    name: "rdrone-a",
                    bitmapResolution: 1,
                    md5: `${asset.assetId}.${asset.dataFormat}`,
                    dataFormat: asset.dataFormat,
                    rotationCenterX: 90,
                    rotationCenterY: 90,
                    asset: asset
                };
            } break;
            case "cube": {
                const asset = storage.createAsset(
                    storage.AssetType.ImageVector,
                    storage.DataFormat.SVG,
                    encoder.encode(cube),
                    null,
                    true // generate md5
                );

                return {
                    assetId: asset.assetId,
                    name: "cube-a",
                    bitmapResolution: 1,
                    md5: `${asset.assetId}.${asset.dataFormat}`,
                    dataFormat: asset.dataFormat,
                    rotationCenterX: 90,
                    rotationCenterY: 90,
                    asset: asset
                };
            } break;
            case "roe": {
                const asset = storage.createAsset(
                    storage.AssetType.ImageVector,
                    storage.DataFormat.SVG,
                    encoder.encode(roe),
                    null,
                    true // generate md5
                );

                return {
                    assetId: asset.assetId,
                    name: "roe-a",
                    bitmapResolution: 1,
                    md5: `${asset.assetId}.${asset.dataFormat}`,
                    dataFormat: asset.dataFormat,
                    rotationCenterX: 90,
                    rotationCenterY: 90,
                    asset: asset
                };
            } break;
        }
        return null;
    }

    render () {
        const deviceLibraryThumbnailData = deviceLibraryContent.map(device => ({
            rawURL: device.iconURL || extensionIcon,
            ...device
        }));
        return (
            <LibraryComponent
                data={deviceLibraryThumbnailData}
                filterable={false}
                id="deviceLibrary"
                title={this.props.intl.formatMessage(messages.deviceTitle)}
                visible={this.props.visible}
                onOk={this.handleOk}
                onItemSelected={this.handleItemSelect}
                onItemDoubleClick={this.handleItemDoubleClick}
                onRequestClose={this.props.onRequestClose}
                setTabIndex={this.props.setTabIndex}  // rogic-mobile
                tabIndex={this.props.tabIndex}
                showTabs={this.props.showTabs}
            />
        );
    }
}

DeviceLibrary.propTypes = {
    intl: intlShape.isRequired,
    onCategorySelected: PropTypes.func,
    onRequestClose: PropTypes.func,
    visible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired, // eslint-disable-line react/no-unused-prop-types
    setTabIndex: PropTypes.func,  // rogic-mobile
    tabIndex: PropTypes.number,
    showTabs: PropTypes.bool
};

export default injectIntl(DeviceLibrary);
