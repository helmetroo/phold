import { useSignal } from '@preact/signals';

import type Callback from '@/types/callback';

import Icon from './icon';

interface Props {
    pressCallback: Callback,
}
export default function SwapCameraButton({ pressCallback }: Props) {
    const animating = useSignal(false);

    function onPress() {
        animating.value = true;
        pressCallback();
    }

    return (
        <button
            aria-label='Swap camera'
            class={`${animating.value ? 'animate-button-press animate-spin-once' : ''} w-full h-full p-4 no-highlight-btn flex justify-center items-center rounded-[50%] bg-neutral-600 cursor-pointer transition ease-out duration-10 origin-center hover:scale-[1.1] hover:bg-neutral-900`
            }
            onClick={onPress}
            onAnimationEnd={() => animating.value = false}
        >
            <Icon name='swap-camera' classes='w-full h-full fill-white stroke-white' />
        </button>
    );
}
