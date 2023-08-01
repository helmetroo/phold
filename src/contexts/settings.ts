import { createContext } from 'preact';
import { signal, computed } from '@preact/signals';

import FoldsSettings from '@/types/folds-settings';
//import AppSettings from '@/types/app-settings';

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

        }
    };
}

const SettingsCtx = createContext({
    settings: createDefaultSettings()
});

function createSettingsState() {
    // TODO load from IndexedDB here?
    const settings = createDefaultSettings();
    return { settings };
}

export default SettingsCtx;
export {
    DEFAULT_FOLDS_SETTINGS,

    createSettingsState,
};
