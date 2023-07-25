import { TNetInput, Point } from 'face-api.js';

import Dimensions from './dimensions';

type OpenGLImageSource =
    ImageBitmap
    | ImageData
    | HTMLImageElement
    | HTMLCanvasElement
    | HTMLVideoElement;

type RawSource =
    OpenGLImageSource & TNetInput;

export default abstract class Source {
    static readonly IDENTIFIER: string;

    protected hasLoaded = false;
    get loaded() {
        return this.hasLoaded;
    }

    abstract getRaw(): RawSource;
    abstract getDimensions(): Dimensions;

    abstract load(): Promise<void>;
    abstract destroy(): void;

    abstract pause(): void;
    abstract resume(): Promise<void>;

    getNormDivisor() {
        const sourceDims = this.getDimensions();
        return new Point(sourceDims.width - 1, sourceDims.height - 1);
    }
}
