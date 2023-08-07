import { useSignal, useComputed } from '@preact/signals';
import type { Signal } from '@preact/signals';

import type { PromisedCallback } from '@/types/callback';

import Icon from './icon';

interface Props {
    camActionsDisabled: Signal<boolean>,
    pressCallback: PromisedCallback,
}
export default function SwapCameraButton({ camActionsDisabled, pressCallback }: Props) {
    const animating = useSignal(false);

    // Disabled status
    const locked = useSignal(false);
    const disabled = useComputed(
        () => locked.value || camActionsDisabled.value
    );

    function lock() {
        locked.value = true;
    }

    function unlock() {
        locked.value = false;
    }

    async function onPress() {
        lock();

        animating.value = true;

        try {
            await pressCallback();
        } finally {
            unlock();
        }
    }

    return (
        <button
            aria-label='Swap camera'
            class={`${animating.value ? 'animate-button-press animate-spin-once' : ''} w-full h-full p-4 no-highlight-btn flex justify-center items-center rounded-[50%] bg-neutral-600 cursor-pointer transition ease-out duration-10 origin-center hover:scale-[1.1] hover:bg-neutral-900`
            }
            disabled={disabled}
            onClick={onPress}
            onAnimationEnd={() => animating.value = false}
        >
            <Icon name='swap-camera' classes='w-full h-full fill-white stroke-white' />
        </button>
    );
}
