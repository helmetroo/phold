import { Point } from 'face-api.js';
import {
    normalize as normalizePoint,
    toClipSpace as toClipSpacePoint
} from '@/utils/point';

export interface RectPoints {
    ul: Point,
    ur: Point,
    br: Point,
    bl: Point
}

export default class Rect implements RectPoints {
    ul: Point;
    ur: Point;
    br: Point;
    bl: Point;

    constructor({ ul, ur, br, bl }: RectPoints) {
        this.ul = ul;
        this.ur = ur;
        this.br = br;
        this.bl = bl;
    }

    normalize(divisor: Point) {
        const { ul, ur, br, bl } = this;

        return new Rect({
            ul: normalizePoint(ul, divisor),
            ur: normalizePoint(ur, divisor),
            br: normalizePoint(br, divisor),
            bl: normalizePoint(bl, divisor),
        });
    }

    toClipSpace() {
        const { ul, ur, br, bl } = this;

        return new Rect({
            ul: toClipSpacePoint(ul),
            ur: toClipSpacePoint(ur),
            br: toClipSpacePoint(br),
            bl: toClipSpacePoint(bl),
        });
    }

    // Doing the array way like face-api.js is overkill lmao
    center() {
        const { ul, ur, br, bl } = this;

        const centerX = (ul.x + ur.x + br.x + bl.x) / 4;
        const centerY = (ul.y + ur.y + br.y + bl.y) / 4;

        return new Point(centerX, centerY);
    }

    scaleFromOrigin(origin: Point, scale: Point) {
        let {
            ul: newUl,
            bl: newBl,
            ur: newUr,
            br: newBr
        } = this;

        newUl = newUl.sub(origin);
        newBl = newBl.sub(origin);
        newUr = newUr.sub(origin);
        newBr = newBr.sub(origin);

        newUl = newUl.mul(scale);
        newBl = newBl.mul(scale);
        newUr = newUr.mul(scale);
        newBr = newBr.mul(scale);

        newUl = newUl.add(origin);
        newBl = newBl.add(origin);
        newUr = newUr.add(origin);
        newBr = newBr.add(origin);

        return new Rect({
            ul: newUl,
            ur: newUr,
            bl: newBl,
            br: newBr,
        });
    }
}

export interface RectPair {
    clipSpace: Rect, // [-1, 1]
    textureSpace: Rect // [0, 1]
}

