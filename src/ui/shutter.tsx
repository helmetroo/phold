import { useState } from 'preact/hooks';

import type Callback from '@/types/callback';

interface ShutterProps {
    pressCallback: Callback,
}
export default function Shutter({ pressCallback }: ShutterProps) {
    const [animating, setAnimating] = useState(false);
    function onPress() {
        pressCallback();
        setAnimating(true);
    }

    return (
        <button
            aria-label='Take photo'
            class='w-full h-full rounded-[50%] outline-none bg-transparent justify-center items-center'
            onClick={onPress}
            onAnimationEnd={() => setAnimating(false)}
        >
            <div class='rounded-[50%] w-full h-full border-8 border-neutral-50 flex justify-center items-center'>
                <div class={`${animating && 'animate-shutter-press'} rounded-[50%] bg-neutral-50 w-[86%] h-[86%] duration-[25]`} />
            </div>
        </button>
    );
}
