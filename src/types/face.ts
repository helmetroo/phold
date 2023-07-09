import type { Rect, RectPair } from './rect';

export default interface Face {
    eyes: RectPair,
    mouth?: RectPair
}