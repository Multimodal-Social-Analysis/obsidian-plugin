import { WorkspaceLeaf } from 'obsidian';

import { Settings } from 'settingsTab';
import MyPlugin from 'main';

import { BaseMapView } from 'src/Map/src/baseMapView';
import { ViewSettings } from 'src/Map/src/mapContainer';

export class MainMapView extends BaseMapView {
    constructor(
        leaf: WorkspaceLeaf,
        settings: Settings,
        plugin: MyPlugin
    ) {
        const viewSettings: ViewSettings = {
            showZoomButtons: true,
            showMapControls: true,
            showFilters: true,
            showView: true,
            viewTabType: 'regular',
            showEmbeddedControls: false,
            showPresets: true,
            showSearch: true,
            showRealTimeButton: true,
            showLockButton: false,
            showOpenButton: false,
        };

        super(leaf, settings, viewSettings, plugin);
    }

    getViewType() {
        return 'map';
    }

    getDisplayText() {
        return 'Interactive Map View';
    }
}
