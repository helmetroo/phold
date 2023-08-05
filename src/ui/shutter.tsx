import { useSignal } from '@preact/signals';

import type Callback from '@/types/callback';

interface ShutterProps {
    pressCallback: Callback,
}
export default function Shutter({ pressCallback }: ShutterProps) {
    const animating = useSignal(false);

    function onPress() {
        animating.value = true;
        pressCallback();
    }

    return (
        <button
            aria-label='Take photo'
            class='w-full h-full rounded-[50%] outline-none bg-transparent justify-center items-center'
            onClick={onPress}
            onAnimationEnd={() => animating.value = false}
        >
            <div class='rounded-[50%] w-full h-full border-8 border-neutral-50 flex justify-center items-center'>
                <div class={`${animating.value ? 'animate-shutter-press' : ''} rounded-[50%] bg-neutral-50 w-[86%] h-[86%] duration-[25]`} />
            </div>
        </button>
    );
}
