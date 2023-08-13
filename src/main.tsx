import { render } from 'preact';
import { inject } from '@vercel/analytics';

import App from './app';
import SettingsCtx, { createSettingsState } from '@/contexts/settings';

import './index.css';

// Analytics
inject();

// Render app
const app = (
    <SettingsCtx.Provider value={createSettingsState()}>
        <App />
    </SettingsCtx.Provider>
);
render(app, document.getElementById('app') as HTMLElement);
