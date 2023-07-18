import type Source from '@/types/source';
import type Callback from '@/types/callback';

import CameraSource from './camera';
import BlankSource from './blank';

interface Events {
    beforeCameraReloads: Callback,
    onCameraReloaded: Callback
}
export default class SourceManager {
    private currentSource: Source = new BlankSource();
    private camera: CameraSource = new CameraSource();

    private beforeCameraReloads: Callback;
    private onCameraReloaded: Callback;

    constructor(events: Events) {
        this.beforeCameraReloads = events.beforeCameraReloads;
        this.onCameraReloaded = events.onCameraReloaded;
    }

    async initCamera() {
        try {
            await this.camera.load();
            this.currentSource = this.camera;
            this.watchForNeededCameraRefresh();
        } catch (err) {
            this.camera.destroy();

            this.currentSource = new BlankSource();
            await this.loadCurrent();

            throw new Error('Camera unavailable.');
        }
    }

    private watchForNeededCameraRefresh() {
        if (screen && screen.orientation) {
            screen.orientation.addEventListener(
                'change',
                this.refreshCamera.bind(this)
            );
        } else {
            window.addEventListener(
                'orientationchange',
                this.refreshCamera.bind(this)
            );
        }
    }

    private async refreshCamera() {
        this.beforeCameraReloads();
        await this.loadCurrent();
        this.onCameraReloaded();
    }

    get current() {
        return this.currentSource;
    }

    async loadCurrent() {
        await this.currentSource.load();
    }

    pauseCurrent() {
        this.currentSource.pause();
    }

    resumeCurrent() {
        this.currentSource.resume();
    }

    destroyCurrent() {
        this.currentSource.destroy();
    }
}
