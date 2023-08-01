import type { Signal, ReadonlySignal } from '@preact/signals';

export default interface FoldsSettings {
    pX: number, // X padding
    pY: number, // Y padding
    mP: number, // Mouth padding
    scale: number, // Both folds scale
}

export interface SignaledFoldsSettings {
    pX: Signal<FoldsSettings['pX']>,
    pY: Signal<FoldsSettings['pY']>,
    mP: Signal<FoldsSettings['mP']>,
    scale: Signal<FoldsSettings['scale']>,
    all: () => ReadonlySignal<FoldsSettings>,
}
