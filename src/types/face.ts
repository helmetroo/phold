import type Rect from './rect';

interface RectPair {
    clipSpace: Rect, // [-1, 1]
    textureSpace: Rect // [0, 1]
}

export default interface Face {
    eyes: RectPair,
    mouth?: RectPair
}
