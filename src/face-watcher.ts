import {
    nets as faceApiNets,
    detectAllFaces,
    TinyFaceDetectorOptions
} from 'face-api.js';

import type Source from '@/types/source';
import BlankSource from './blank';

const MODEL_DIR = '/weights';
const DEFAULT_INPUT_SIZE = 224;
const DEFAULT_SCORE_THRESHOLD = 0.5;

export type DetectedFaces = Awaited<ReturnType<FaceWatcher['detectFaces']>>;
export type DetectedFace = DetectedFaces[number];
export type FaceDetectCallback = (faces: DetectedFaces) => void;

export default class FaceWatcher {
    private loaded = false;
    private currentSource: Source = new BlankSource();
    private timeoutId: NodeJS.Timeout | null = null;

    private options: TinyFaceDetectorOptions
        = new TinyFaceDetectorOptions({
            inputSize: DEFAULT_INPUT_SIZE,
            scoreThreshold: DEFAULT_SCORE_THRESHOLD
        });

    constructor(
        private onDetect: FaceDetectCallback
    ) { }

    set source(newSource: Source) {
        this.currentSource = newSource;
    }

    start() {
        if (!this.loaded)
            return;

        setTimeout(this.watchFaces.bind(this), 0);
    }

    stop() {
        if (!this.timeoutId)
            return;

        clearTimeout(this.timeoutId);
    }

    async load() {
        await Promise.all([
            faceApiNets.tinyFaceDetector.loadFromUri(MODEL_DIR),
            faceApiNets.faceLandmark68TinyNet.loadFromUri(MODEL_DIR),
        ]);

        this.loaded = true;
    }

    private async watchFaces() {
        const newFaces = await this.detectFaces();
        this.onDetect(newFaces);

        this.timeoutId = setTimeout(this.watchFaces.bind(this), 0);
    }

    async detectFaces() {
        const rawImageSrc = this.currentSource.getRaw();
        const faces = await detectAllFaces(rawImageSrc, this.options)
            .withFaceLandmarks(true);

        return faces;
    }
}
