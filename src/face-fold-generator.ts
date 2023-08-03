import type { FaceLandmarks68 } from 'face-api.js';
import { utils as faceApiUtils } from 'face-api.js';
import { Point } from 'face-api.js';

import {
    getRadius,
    normalize,
    toClipSpace
} from '@/utils/point';

import Rect from '@/types/rect';
import type { SignaledFoldsSettings } from '@/types/folds-settings';

import type { DetectedFace } from './face-watcher';

const NINETY_DEGS = Math.PI / 2;

export default function generateFolds(
    face: DetectedFace,
    normDivisor: Point,
    settings: SignaledFoldsSettings
) {
    const { landmarks } = face;
    const jaw = landmarks.getJawOutline();
    const faceCenter = toClipSpace(
        normalize(
            faceApiUtils.getCenterPoint(jaw),
            normDivisor
        )
    );

    const {
        rects: eyeRects,
        m: eyeSlope,
        a: eyeAngle,
        bL: eyeIntcptLeft,
        bR: eyeIntcptRight,
    } = computeEyeFoldRects(
        landmarks,
        settings,
        faceCenter,
        normDivisor
    );

    const {
        ul: eyeBottomLeft,
        ur: eyeBottomRight,
    } = eyeRects.clipSpace;

    const {
        rects: mouthRects
    } = computeMouthFoldRects(
        landmarks,
        settings,
        faceCenter,
        normDivisor,
        eyeBottomLeft,
        eyeBottomRight,
        eyeSlope,
        eyeAngle,
        eyeIntcptLeft,
        eyeIntcptRight
    );

    return {
        eyes: eyeRects,
        mouth: mouthRects,
    };
}

function computeEyeFoldRects(
    landmarks: FaceLandmarks68,
    { pX: in_pX, pY: in_pY, mP, scale }: SignaledFoldsSettings,
    faceCenter: Point,
    normDivisor: Point,
) {
    // Always assuming right eye is always right of left eye (no upside down)
    const lEye = landmarks.getLeftEye();
    const lEyeRadius = getRadius(lEye);

    const rEye = landmarks.getRightEye();
    const rEyeRadius = getRadius(rEye);

    // Eye size determined from "larger" eye, compute padding
    const r = Math.max(lEyeRadius, rEyeRadius);
    let pX = in_pX.value * r;
    let pY = in_pY.value * r;

    const lCenter = faceApiUtils.getCenterPoint(lEye);
    const rCenter = faceApiUtils.getCenterPoint(rEye);

    // Angle and slope
    const diff = rCenter.sub(lCenter);
    const m = diff.y / diff.x;
    const a = Math.atan(m);

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

    const rect = new Rect({
        ul: new Point(ulX, ulY),
        ur: new Point(urX, urY),
        br: new Point(brX, brY),
        bl: new Point(blX, blY),
    });

    const normRect = rect.normalize(normDivisor);
    const scalePt = new Point(scale.value, scale.value);
    const mpPt = new Point(mP.value, mP.value);
    const texSpaceRect = normRect;
    const clipSpaceRect = normRect
        .toClipSpace()
        .scaleFromOrigin(faceCenter, scalePt);
    const leftHeight = clipSpaceRect.ul.sub(clipSpaceRect.bl)
        .mul(mpPt);
    clipSpaceRect.ul = clipSpaceRect.ul.add(leftHeight);
    clipSpaceRect.bl = clipSpaceRect.bl.add(leftHeight);

    const rightHeight = clipSpaceRect.ur.sub(clipSpaceRect.br)
        .mul(mpPt);
    clipSpaceRect.ur = clipSpaceRect.ur.add(rightHeight);
    clipSpaceRect.br = clipSpaceRect.br.add(rightHeight);

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

function computeMouthFoldRects(
    landmarks: FaceLandmarks68,
    { mP, scale }: SignaledFoldsSettings,
    faceCenter: Point,
    normDivisor: Point,
    eyeBottomLeft: Point,
    eyeBottomRight: Point,
    m: number,
    a: number,
    bL: number | null,
    bR: number | null,
) {
    const mouth = landmarks.getMouth();
    const r = getRadius(mouth);
    const p = mP.value * r;
    const center = faceApiUtils.getCenterPoint(mouth);

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

    const rect = new Rect({
        ul: new Point(ulX, ulY),
        ur: new Point(urX, urY),
        br: new Point(brX, brY),
        bl: new Point(blX, blY),
    });

    const normRect = rect.normalize(normDivisor);
    const texSpaceRect = normRect;
    const clipSpaceRect = normRect
        .toClipSpace()
        .scaleFromOrigin(faceCenter, new Point(scale.value, scale.value));

    // Move mouth verts towards provided eye verts to close gap
    const eyeMouthLeftGap = eyeBottomLeft.sub(clipSpaceRect.bl);
    clipSpaceRect.ul = clipSpaceRect.ul.add(eyeMouthLeftGap);
    clipSpaceRect.bl = clipSpaceRect.bl.add(eyeMouthLeftGap);

    const eyeMouthRightGap = eyeBottomRight.sub(clipSpaceRect.br);
    clipSpaceRect.ur = clipSpaceRect.ur.add(eyeMouthRightGap);
    clipSpaceRect.br = clipSpaceRect.br.add(eyeMouthRightGap);

    return {
        rects: {
            textureSpace: texSpaceRect,
            clipSpace: clipSpaceRect
        }
    };
}
