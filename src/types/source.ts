import { TNetInput } from 'face-api.js';

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

    abstract getRaw(): RawSource;
    abstract getDimensions(): Dimensions;
    abstract load(): Promise<void>;
    abstract destroy(): void;
}
