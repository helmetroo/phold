import { Component, createRef } from 'preact';
import type { FaceLandmarks68 } from 'face-api.js';
import * as faceApi from 'face-api.js';
import { Point } from 'face-api.js';

import type { Source, Rect, RectPair } from '@/types';
import { normalize, toClipSpace } from '@/types/rect';
import CameraSource from './camera';
import BlankSource from './blank';

import Renderer from './renderer';
import FaceWatcher from './face-watcher';
import { getRadius } from '@/utils/point';

const NINETY_DEGS = Math.PI / 2;

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

            const {
                rects: eyeRects,
                m: eyeSlope,
                a: eyeAngle,
                bL: eyeIntcptLeft,
                bR: eyeIntcptRight,
            } = this.computeEyeFoldRects(landmarks, normDivisor);

            const {
                bl: eyeLeftGap,
                br: eyeRightGap,
            } = eyeRects.clipSpace;

            const {
                rects: mouthRects
            } = this.computeMouthFoldRects(
                landmarks,
                normDivisor,
                eyeLeftGap,
                eyeRightGap,
                eyeSlope,
                eyeAngle,
                eyeIntcptLeft,
                eyeIntcptRight
            );

            return {
                eyes: eyeRects,
                mouth: mouthRects,
            };
        });

        this.renderer!.faces = newFolds;

        setTimeout(this.watchFaces.bind(this), 0);
    }

    private computeEyeFoldRects(
        landmarks: FaceLandmarks68,
        normDivisor: Point
    ) {
        // Always assuming right eye is always right of left eye (no upside down)
        const lEye = landmarks.getLeftEye();
        const lEyeRadius = getRadius(lEye);

        const rEye = landmarks.getRightEye();
        const rEyeRadius = getRadius(rEye);

        const r = Math.max(lEyeRadius, rEyeRadius);
        let pX = 9.0 * r; // Horiz padding
        let pY = 2.0 * r; // Vert padding

        const lCenter = faceApi.utils.getCenterPoint(lEye);
        const rCenter = faceApi.utils.getCenterPoint(rEye);

        // Angle and slope
        const diff = rCenter.sub(lCenter);
        const a = Math.atan2(diff.y, diff.x);
        const m = diff.y / diff.x;

        // Intercepts
        const bU =
            rCenter.y + pY * Math.sin(a + NINETY_DEGS)
            - m * (rCenter.x + pX * Math.cos(a + NINETY_DEGS));

        const bB =
            rCenter.y + pY * Math.sin(a - NINETY_DEGS)
            - m * (rCenter.x + pX * Math.cos(a - NINETY_DEGS));

        let bR: number | null = null;
        let bL: number | null = null;

        // Rect points
        let ulX = 0;
        let ulY = bU;

        let blX = 0;
        let blY = bB;

        let urX = 0;
        let urY = bU;

        let brX = 0;
        let brY = bB;

        if (m !== 0) {
            pY *= Math.sin(a);
            pX *= Math.cos(a);

            bR = rCenter.y + pY + (rCenter.x + pX) / m;
            bL = lCenter.y - pY + (lCenter.x - pX) / m;
            const factor = m / (m * m + 1);

            ulX = factor * (bL - bU);
            ulY += m * ulX;

            blX = factor * (bL - bB);
            blY += m * blX;

            urX = factor * (bR - bU);
            urY += m * urX;

            brX = factor * (bR - bB);
            brY += m * brX;
        } else {
            ulX = lCenter.x - pX;
            blX = ulX;

            urX = rCenter.x + pX;
            brX = urX;
        }

        const rect = {
            ul: new Point(ulX, ulY),
            ur: new Point(urX, urY),
            br: new Point(brX, brY),
            bl: new Point(blX, blY),
        } satisfies Rect;

        const texSpaceRect = normalize(rect, normDivisor);
        const clipSpaceRect = toClipSpace(texSpaceRect);
        return {
            m,
            a,
            bL,
            bR,
            rects: {
                textureSpace: texSpaceRect,
                clipSpace: clipSpaceRect
            }
        };
    }

    private computeMouthFoldRects(
        landmarks: FaceLandmarks68,
        normDivisor: Point,
        eyeLeftGap: Point,
        eyeRightGap: Point,
        m: number,
        a: number,
        bL: number | null,
        bR: number | null,
    ) {
        const mouth = landmarks.getMouth();
        const r = getRadius(mouth);
        const p = 0.8 * r;
        const center = faceApi.utils.getCenterPoint(mouth);

        // Intercepts
        const bU =
            center.y + p * Math.sin(a + NINETY_DEGS)
            - m * (center.x + p * Math.cos(a + NINETY_DEGS));

        const bB =
            center.y + p * Math.sin(a - NINETY_DEGS)
            - m * (center.x + p * Math.cos(a - NINETY_DEGS));

        // Rect points
        let ulX = 0;
        let ulY = bU;

        let blX = 0;
        let blY = bB;

        let urX = 0;
        let urY = bU;

        let brX = 0;
        let brY = bB;

        if (bL !== null && bR !== null) {
            const factor = m / (m * m + 1);

            ulX = factor * (bL - bU);
            ulY += m * ulX;

            blX = factor * (bL - bB);
            blY += m * blX;

            urX = factor * (bR - bU);
            urY += m * urX;

            brX = factor * (bR - bB);
            brY += m * brX;
        } else {
            ulX = center.x - p;
            blX = ulX;

            urX = center.x + p;
            brX = urX;
        }

        const rect = {
            ul: new Point(ulX, ulY),
            ur: new Point(urX, urY),
            br: new Point(brX, brY),
            bl: new Point(blX, blY),
        } satisfies Rect;

        const texSpaceRect = normalize(rect, normDivisor);
        const clipSpaceRect = toClipSpace(texSpaceRect);

        // Move mouth verts towards provided eye verts to close gap
        const eyeMouthLeftGap = eyeLeftGap.sub(clipSpaceRect.bl).mul(new Point(0.5, 0.5));
        //const bottomLeftGap = clipSpaceRect.ul.sub(clipSpaceRect.bl).mul(new Point(0.5, 0.5));
        clipSpaceRect.ul = clipSpaceRect.ul.add(eyeMouthLeftGap);
        clipSpaceRect.bl = clipSpaceRect.bl.add(eyeMouthLeftGap);

        const eyeMouthRightGap = eyeRightGap.sub(clipSpaceRect.br).mul(new Point(0.5, 0.5));
        //const bottomRightGap = clipSpaceRect.ur.sub(clipSpaceRect.br).mul(new Point(0.5, 0.5));
        clipSpaceRect.ur = clipSpaceRect.ur.add(eyeMouthRightGap);
        clipSpaceRect.br = clipSpaceRect.br.add(eyeMouthRightGap);

        return {
            rects: {
                textureSpace: texSpaceRect,
                clipSpace: clipSpaceRect
            }
        };
    }

    render() {
        return (
            <canvas
                ref={this.ref}
                class='w-full h-full' />
        );
    }
}
