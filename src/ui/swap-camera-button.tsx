import { useState } from 'preact/hooks';

//import type Callback from '@/types/callback';

import Icon from './icon';

interface Props {
}
export default function SwapCameraButton({ }: Props) {
    const [animating, setAnimating] = useState(false);
    function onPress() {
        //pressCallback();
        setAnimating(true);
    }
    return (
        <button
            aria-label='Swap camera'
            class={`${animating && 'animate-button-press'} w-full h-full p-4 no-highlight-btn flex justify-center items-center rounded-[50%] bg-neutral-600 cursor-pointer transition ease-out duration-10 origin-center hover:scale-[1.1] hover:bg-neutral-900`
            }
            onClick={onPress}
            onAnimationEnd={() => setAnimating(false)}
        >
            <Icon name='swap-camera' classes='w-full h-full fill-white stroke-white' />
        </button>
    );
}
