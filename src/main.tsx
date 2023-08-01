import { render } from 'preact';

import App from './app';
import SettingsCtx, { createSettingsState } from '@/contexts/settings';

import './index.css';

const app = (
    <SettingsCtx.Provider value={createSettingsState()}>
        <App />
    </SettingsCtx.Provider>
);
render(app, document.getElementById('app') as HTMLElement);
