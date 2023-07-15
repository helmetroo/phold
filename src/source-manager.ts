import { Point } from 'face-api.js';

import type Source from '@/types/source';
import CameraSource from './camera';
import BlankSource from './blank';

export default class SourceManager {
    private currentSource: Source = new BlankSource();

    async initCamera() {
        this.currentSource = new CameraSource();

        try {
            await this.load();
        } catch (err) {
            // TODO call err callback so a parent component can show err
            this.destroy();

            this.currentSource = new BlankSource();
            await this.load();
        }
    }

    get current() {
        return this.currentSource;
    }

    async load() {
        await this.currentSource.load();
    }

    pause() {
        this.currentSource.pause();
    }

    resume() {
        this.currentSource.resume();
    }

    destroy() {
        this.currentSource.destroy();
    }
}
