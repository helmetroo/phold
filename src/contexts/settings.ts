import { createContext } from 'preact';
import { signal, computed } from '@preact/signals';
import type { Signal } from '@preact/signals';

import FoldsSettings from '@/types/folds-settings';
//import AppSettings from '@/types/app-settings';

import getOrientationType from '@/utils/get-orientation-type';

const DEFAULT_FOLDS_SETTINGS: FoldsSettings = {
    pX: 3,
    pY: 1.4,
    mP: 0.85,
    scale: 1.5,
}

/*
const DEFAULT_APP_SETTINGS: AppSettings = {

};
*/

function createDefaultSettings() {
    return {
        folds: {
            pX: signal(DEFAULT_FOLDS_SETTINGS.pX),
            pY: signal(DEFAULT_FOLDS_SETTINGS.pY),
            mP: signal(DEFAULT_FOLDS_SETTINGS.mP),
            scale: signal(DEFAULT_FOLDS_SETTINGS.scale),

            // Function necessary to self-reference above properties
            all: function() {
                return computed(() => {
                    return {
                        pX: this.pX.value,
                        pY: this.pY.value,
                        mP: this.mP.value,
                        scale: this.scale.value,
                    };
                });
            }
        },

        app: {

        },
    };
}

function watchForWindowAspectRatioChange(signal: Signal<OrientationType>) {
    function updateOrientationType() {
        signal.value = getOrientationType();
    }

    const resizeObserver = new ResizeObserver(updateOrientationType);
    resizeObserver.observe(document.body);

    if (screen && screen.orientation) {
        screen.orientation.addEventListener(
            'change',
            updateOrientationType
        );
    } else {
        window.addEventListener(
            'orientationchange',
            updateOrientationType
        );
    }
}

const SettingsCtx = createContext({
    settings: createDefaultSettings(),
    orientationType: signal(getOrientationType())
});

function createSettingsState() {
    // TODO load from IndexedDB here?
    const settings = createDefaultSettings();

    const orientationType = signal(getOrientationType());
    watchForWindowAspectRatioChange(orientationType);

    return {
        settings,
        orientationType,
    };
}

export default SettingsCtx;
export {
    DEFAULT_FOLDS_SETTINGS,

    createSettingsState,
};
