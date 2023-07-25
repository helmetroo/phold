import { useState } from 'preact/hooks';

import type Callback from '@/types/callback';

import Icon from './icon';

interface Props {
    label: string,
    classes?: string,
    callback: Callback,
}
export default function XButton({ label, classes, callback }: Props) {
    const [animating, setAnimating] = useState(false);
    function onPress() {
        setAnimating(true);
        callback();
    }

    return (
        <button
            aria-label={label}
            class={`${classes || ''} ${animating && 'animate-button-press'} flex justify-center items-center rounded-[50%] w-16 h-16 bg-neutral-600 cursor-pointer transition ease-out duration-10 origin-center hover:scale-[1.1] hover:bg-neutral-900 focus:scale-[1.05] focus:bg-neutral-800`}
            onClick={onPress}
            onAnimationEnd={() => setAnimating(false)}
        >
            <Icon name='close' classes='h-8 stroke-white' />
        </button>
    );
}
