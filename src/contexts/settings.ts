import { createContext } from 'preact';
import { signal, computed } from '@preact/signals';
import type { Signal } from '@preact/signals';

import FoldsSettings from '@/types/folds-settings';
//import AppSettings from '@/types/app-settings';

import getOrientationType from '@/utils/get-orientation-type';

const DEFAULT_FOLDS_SETTINGS: FoldsSettings = {
    oX: 0,
    oY: 0,
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
            oX: signal(DEFAULT_FOLDS_SETTINGS.oX),
            oY: signal(DEFAULT_FOLDS_SETTINGS.oY),
            pX: signal(DEFAULT_FOLDS_SETTINGS.pX),
            pY: signal(DEFAULT_FOLDS_SETTINGS.pY),
            mP: signal(DEFAULT_FOLDS_SETTINGS.mP),
            scale: signal(DEFAULT_FOLDS_SETTINGS.scale),

            // Function necessary to self-reference above properties
            all: function() {
                return computed(() => {
                    return {
                        oX: this.oX.value,
                        oY: this.oY.value,
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

function watchForWindowDimsChange(
    orientation: Signal<OrientationType>,
    lastResizeTime: Signal<number>
) {
    function updateSignals() {
        orientation.value = getOrientationType();
        lastResizeTime.value = new Date().getTime();
    }

    const resizeObserver = new ResizeObserver(updateSignals);
    resizeObserver.observe(document.body, {
        box: 'border-box'
    });

    if (screen && screen.orientation) {
        screen.orientation.addEventListener(
            'change',
            updateSignals
        );
    } else {
        window.addEventListener(
            'orientationchange',
            updateSignals
        );
    }
}

const SettingsCtx = createContext({
    settings: createDefaultSettings(),
    orientationType: signal(getOrientationType()),
    lastResizeTime: signal(new Date().getTime()),
});

function createSettingsState() {
    // TODO load from IndexedDB here?
    const settings = createDefaultSettings();

    const orientationType = signal(getOrientationType());
    const lastResizeTime = signal(new Date().getTime());
    watchForWindowDimsChange(orientationType, lastResizeTime);

    return {
        settings,
        orientationType,
        lastResizeTime,
    };
}

export default SettingsCtx;
export {
    DEFAULT_FOLDS_SETTINGS,

    createSettingsState,
};
