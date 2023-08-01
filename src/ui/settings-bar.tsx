import { useState } from 'preact/hooks';

import FoldsSettingsBar from './folds-settings-bar';
import Icon from './icon';

interface Props {
    orientationType: OrientationType,
}
export default function SettingsBar(props: Props) {
    const {
        orientationType,
    } = props;

    const [
        foldsSettingsActive,
        setFoldsSettingsActive
    ] = useState(false);

    function toggleFoldsSettingsActive() {
        setFoldsSettingsActive(!foldsSettingsActive);
    }

    return (
        <section class='relative z-10 w-full h-[4rem] landscape:w-[4rem] landscape:h-full'>
            <menu class='w-full h-full bg-neutral-950 portrait:px-6 landscape:py-6 flex flex-row landscape:flex-col justify-start items-center'>
                <li class="w-8 h-8">
                    <button
                        aria-label='Folds settings'
                        class='w-full h-full cursor-pointer no-highlight-btn transition-colors ease-out duration-10'
                        onClick={toggleFoldsSettingsActive}
                    >
                        <Icon name='folds-settings' classes={`w-full h-full ${foldsSettingsActive ? 'stroke-amber-400' : 'stroke-white'}`} />
                    </button>
                </li>
            </menu>
            <FoldsSettingsBar
                visible={foldsSettingsActive}
                orientationType={orientationType}
            />
        </section>
    );
}
