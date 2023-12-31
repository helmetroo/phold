import { useSignal } from '@preact/signals';

import FoldsSettingsDrawer from './folds-settings-drawer';
import Icon from './icon';

export default function SettingsBar() {
    const foldsSettingsActive = useSignal(false);

    function toggleFoldsSettingsActive() {
        foldsSettingsActive.value = !foldsSettingsActive.value;
    }

    return (
        <section class='relative z-10 w-full h-[4rem] landscape:w-[4rem] landscape:h-full'>
            <menu class='relative z-10 w-full h-full bg-neutral-950 portrait:px-6 landscape:py-6 flex flex-row landscape:flex-col justify-start items-center'>
                <li class="w-8 h-8">
                    <button
                        aria-label='Folds settings'
                        class='w-full h-full cursor-pointer no-highlight-btn transition-colors ease-out duration-10'
                        onClick={toggleFoldsSettingsActive}
                    >
                        <Icon name='folds-settings' classes={`w-full h-full ${foldsSettingsActive.value ? 'stroke-amber-400' : 'stroke-white'}`} />
                    </button>
                </li>
            </menu>
            <FoldsSettingsDrawer
                visible={foldsSettingsActive}
            />
        </section>
    );
}
