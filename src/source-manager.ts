import type Source from '@/types/source';
import type ChosenFile from '@/types/chosen-file';

import CameraSource from './camera';
import ImageSource from './image';
import BlankSource from './blank';

type CurrentSourceType = 'camera' | 'image' | 'blank';
export default class SourceManager {
    private currentSourceType: CurrentSourceType = 'blank';
    private currentSource: Source = new BlankSource();
    private camera: CameraSource = new CameraSource();

    async initCamera() {
        try {
            await this.camera.load();

            this.currentSource = this.camera;
            this.currentSourceType = 'camera';
        } catch (err) {
            this.camera.destroy();

            this.currentSource = new BlankSource();
            await this.loadCurrent();

            throw err;
        }
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

    async loadCamera() {
        await this.camera.load();
    }

    pauseCurrent() {
        this.currentSource.pause();
    }

    async resumeCurrent() {
        await this.currentSource.resume();
    }

    async resumeCamera() {
        await this.camera.resume();
    }

    destroyCurrent() {
        this.currentSource.destroy();
    }
}
