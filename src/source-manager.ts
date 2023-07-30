import type Source from '@/types/source';
import type Callback from '@/types/callback';
import type ChosenFile from '@/types/chosen-file';

import CameraSource from './camera';
import ImageSource from './image';
import BlankSource from './blank';

type CurrentSourceType = 'camera' | 'image' | 'blank';
interface Events {
    beforeCameraReloads: Callback,
    onCameraReloaded: Callback
}
export default class SourceManager {
    private currentSourceType: CurrentSourceType = 'blank';
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
            this.currentSourceType = 'camera';

            this.watchForNeededCameraRefresh();
        } catch (err) {
            this.camera.destroy();

            this.currentSource = new BlankSource();
            await this.loadCurrent();

            throw err;
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

    async refreshCamera() {
        this.beforeCameraReloads();
        await this.loadCurrent();
        this.onCameraReloaded();
    }

    async setAndLoadFromImage(chosenFile: ChosenFile) {
        const imageSource = new ImageSource(chosenFile);

        await imageSource.load();
        this.currentSource = imageSource;
        this.currentSourceType = 'image';
    }

    switchToCamera() {
        this.destroyCurrent();
        this.currentSource = this.camera;
        this.currentSourceType = 'camera';
    }

    async swapCamera() {
        await this.camera.swapFacingMode();
    }

    get current() {
        return this.currentSource;
    }

    get currentType() {
        return this.currentSourceType;
    }

    async loadCurrent() {
        await this.currentSource.load();
    }

    pauseCurrent() {
        this.currentSource.pause();
    }

    async resumeCurrent() {
        await this.currentSource.resume();
    }

    destroyCurrent() {
        this.currentSource.destroy();
    }
}
