import {
    nets as faceApiNets,
    detectAllFaces,
    TinyFaceDetectorOptions
} from 'face-api.js';
import type Source from '@/types/source';

const MODEL_DIR = '/weights';
const DEFAULT_INPUT_SIZE = 224;
const DEFAULT_SCORE_THRESHOLD = 0.5;

export default class FaceWatcher {
    private loaded: boolean = false;

    private options: TinyFaceDetectorOptions
        = new TinyFaceDetectorOptions({
            inputSize: DEFAULT_INPUT_SIZE,
            scoreThreshold: DEFAULT_SCORE_THRESHOLD
        });

    async load() {
        await Promise.all([
            faceApiNets.tinyFaceDetector.loadFromUri(MODEL_DIR),
            faceApiNets.faceRecognitionNet.loadFromUri(MODEL_DIR),
            faceApiNets.faceLandmark68TinyNet.loadFromUri(MODEL_DIR),
        ]);

        this.loaded = true;
    }

    async detectFaces(source: Source) {
        if (!this.loaded)
            return [];

        const rawImageSrc = source.getRaw();
        const faces = await detectAllFaces(rawImageSrc, this.options)
            .withFaceLandmarks(true);

        return faces;
    }
}
