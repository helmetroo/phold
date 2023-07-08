import type { Point } from 'face-api.js';
import {
    normalize as normalizePoint,
    toClipSpace as toClipSpacePoint
} from '@/utils/point';

export default interface Rect {
    ul: Point,
    ur: Point,
    br: Point,
    bl: Point
}

export function normalize(r: Rect, divisor: Point) {
    return {
        ul: normalizePoint(r.ul, divisor),
        ur: normalizePoint(r.ur, divisor),
        br: normalizePoint(r.br, divisor),
        bl: normalizePoint(r.bl, divisor),
    } satisfies Rect;
}

export function toClipSpace(r: Rect) {
    return {
        ul: toClipSpacePoint(r.ul),
        ur: toClipSpacePoint(r.ur),
        br: toClipSpacePoint(r.br),
        bl: toClipSpacePoint(r.bl),
    } satisfies Rect;
}
