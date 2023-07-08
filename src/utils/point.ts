import { Point } from 'face-api.js';

export type MinMax = {
    min: Point,
    max: Point,
};

export function getMinMax(points: Point[]): MinMax {
    const worstMin = new Point(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    const worstMax = new Point(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

    return points.reduce(({ min, max }, point) => {
        const newMinX = Math.min(point.x, min.x);
        const newMinY = Math.min(point.y, min.y);
        const newMin = new Point(newMinX, newMinY);

        const newMaxX = Math.max(point.x, max.x);
        const newMaxY = Math.max(point.y, max.y);
        const newMax = new Point(newMaxX, newMaxY);

        return {
            min: newMin,
            max: newMax
        };
    }, {
        min: worstMin,
        max: worstMax
    });
}

export function getRadius(pts: Point[]) {
    const ptsMinMax = getMinMax(pts);
    const xDiff = ptsMinMax.max.x - ptsMinMax.min.x;
    const yDiff = ptsMinMax.max.y - ptsMinMax.min.y;
    return Math.max(xDiff, yDiff) / 2;
}

export function normalize(p: Point, divisor: Point) {
    const normX = p.x / divisor.x;
    const normY = 1.0 - (p.y / divisor.y);
    return new Point(normX, normY);
}

export function toClipSpace(p: Point) {
    return p.mul(new Point(2.0, 2.0))
        .sub(new Point(1.0, 1.0));
}

