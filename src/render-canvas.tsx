import { Component, createRef } from 'preact';
import type { FaceLandmarks68 } from 'face-api.js';
import * as faceApi from 'face-api.js';
import { Point } from 'face-api.js';

import type { Source, Rect } from '@/types';
import { normalize, toClipSpace } from '@/types/rect';
import CameraSource from './camera';
import BlankSource from './blank';

import Renderer from './renderer';
import FaceWatcher from './face-watcher';
import { getRadius } from '@/utils/point';

export default class RenderCanvas extends Component {
    private ref = createRef();

    private renderer: Renderer | null = null;
    private currentSource: Source = new BlankSource();

    private faceWatcher: FaceWatcher = new FaceWatcher();

    async initInitialSource() {
        this.currentSource = new CameraSource();

        try {
            await this.currentSource.load();
        } catch (err) {
            // TODO call err callback so a parent component can show err
            this.currentSource.destroy();

            this.currentSource = new BlankSource();
            await this.currentSource.load();
        }
    }

    async componentDidMount() {
        await this.initInitialSource();
        await this.initFaceWatcher();
        this.initRenderer();
    }

    componentWillUnmount() {
        this.renderer?.stop();
        this.currentSource.destroy();
    }

    private initRenderer() {
        const canvasElem = this.ref.current as HTMLCanvasElement;
        this.renderer = new Renderer(canvasElem, this.currentSource);

        this.renderer.start();
    }

    private async initFaceWatcher() {
        try {
            await this.faceWatcher.load();
            setTimeout(this.watchFaces.bind(this), 0);
        } catch (_) {
            // TODO display error
        }
    }

    private async watchFaces() {
        const faces =
            await this.faceWatcher.detectFaces(this.currentSource);

        const sourceDims = this.currentSource.getDimensions();
        const normDivisor = new Point(
            sourceDims.width - 1,
            sourceDims.height - 1
        );

        const newFolds = faces.map(face => {
            const { landmarks } = face;

            const eyeFold = this.computeEyeFoldRect(landmarks);
            const eyeTextureSpaceRect = normalize(eyeFold.rect, normDivisor);
            const eyeClipSpaceRect = toClipSpace(eyeTextureSpaceRect);

            // const mouthFold = this.computeMouthFoldRect(landmarks);
            // const textureSpaceRect = normalize(eyeFold.rect, normDivisor);
            // const clipSpaceRect = toClipSpace(textureSpaceRect);
            return {
                eyes: {
                    clipSpace: eyeClipSpaceRect,
                    textureSpace: eyeTextureSpaceRect
                },
                /* mouth: {
                 *     clipSpace: mouthClipSpaceRect,
                 *     textureSpace: mouthTextureSpaceRect
                 * }, */
            };
        });

        this.renderer!.faces = newFolds;

        setTimeout(this.watchFaces.bind(this), 0);
    }

    private computeEyeFoldRect(landmarks: FaceLandmarks68) {
        // Always assuming right eye is always right of left eye (no upside down)
        const lEye = landmarks.getLeftEye();
        const lEyeRadius = getRadius(lEye);

        const rEye = landmarks.getRightEye();
        const rEyeRadius = getRadius(rEye);

        const r = Math.max(lEyeRadius, rEyeRadius);

        const lCenter = faceApi.utils.getCenterPoint(lEye);
        const rCenter = faceApi.utils.getCenterPoint(rEye);

        const diff = rCenter.sub(lCenter);
        const p = 2.0 * r;

        // a = angle, m = slope, b = intercept
        const a = Math.atan2(diff.y, diff.x);
        const m = diff.y / diff.x;
        const ninetyDegs = Math.PI / 2;
        const bU =
            rCenter.y + p * Math.sin(a + ninetyDegs)
            - m * (rCenter.x + p * Math.cos(a + ninetyDegs));

        const bB =
            rCenter.y + p * Math.sin(a - ninetyDegs)
            - m * (rCenter.x + p * Math.cos(a - ninetyDegs));

        const pY = p * Math.sin(a);
        const pX = p * Math.cos(a);
        if (m !== 0) {
            const bR = rCenter.y + pY + (rCenter.x + pX) / m;
            const bL = lCenter.y - pY + (lCenter.x - pX) / m;
            const factor = m / (m * m + 1);

            const ulX = factor * (bL - bU);
            const ulY = m * ulX + bU;

            const blX = factor * (bL - bB);
            const blY = m * blX + bB;

            const urX = factor * (bR - bU);
            const urY = m * urX + bU;

            const brX = factor * (bR - bB);
            const brY = m * brX + bB;

            return {
                slope: m,
                angle: a,
                interceptLeft: bL,
                interceptRight: bR,
                rect: {
                    ul: new Point(ulX, ulY),
                    ur: new Point(urX, urY),
                    br: new Point(brX, brY),
                    bl: new Point(blX, blY)
                } satisfies Rect
            };
        }

        const ulX = lCenter.x - p;
        const blX = ulX;

        const urX = rCenter.x + p;
        const brX = urX;

        return {
            slope: m,
            angle: a,
            interceptLeft: null,
            interceptRight: null,
            rect: {
                ul: new Point(ulX, bU),
                ur: new Point(urX, bU),
                br: new Point(brX, bB),
                bl: new Point(blX, bB),
            } satisfies Rect
        }
    }

    /*
    private computeMouthFoldRect(
        landmarks: FaceLandmarks68,
        slope: number,
        angle: number,
        interceptLeft: number | null,
        interceptRight: number | null,
    ) {
        const mouth = landmarks.getMouth();
        const center = faceApi.utils.getCenterPoint(mouth);
        const r = getRadius(mouth);
        const p = 2.0 * r;

        const m = slope;
        const a = angle;
        const bL = interceptLeft;
        const bR = interceptRight;
        const ninetyDegs = Math.PI / 2;

        const bU = center.y + p * Math.sin(a + ninetyDegs)
            - m * (center.x + p * Math.cos(a + ninetyDegs));

        const bB = center.y + p * Math.sin(a - ninetyDegs)
            - m * (center.x + p * Math.cos(a - ninetyDegs));

        if (bL === null || bR === null) {
            const ulX = lCenter.x - p;
            const blX = ulX;

            const urX = rCenter.x + p;
            const brX = urX;

            return {
                ul: new Point(ulX, ulY),
                ur: new Point(urX, urY),
                br: new Point(brX, brY),
                bl: new Point(blX, blY)
            } satisfies Rect;
        }

        return {
            ul: new Point(ulX, ulY),
            ur: new Point(urX, urY),
            br: new Point(brX, brY),
            bl: new Point(blX, blY)
        } satisfies Rect;
    }
    */

    render() {
        return (
            <canvas
                ref={this.ref}
                class='w-full h-full' />
        );
    }
}
