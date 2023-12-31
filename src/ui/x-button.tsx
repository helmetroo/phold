import { useSignal } from '@preact/signals';

import type Callback from '@/types/callback';

import Icon from './icon';

interface Props {
    label: string,
    classes?: string,
    callback: Callback,
}
export default function XButton({ label, classes, callback }: Props) {
    const animating = useSignal(false);

    function onPress() {
        animating.value = true;
        callback();
    }

    return (
        <button
            aria-label={label}
            class={`${classes || ''} ${animating.value ? 'animate-button-press' : ''} flex justify-center items-center rounded-[50%] w-16 h-16 p-4 bg-neutral-600 cursor-pointer transition ease-out duration-10 origin-center hover:scale-[1.1] hover:bg-neutral-900`}
            onClick={onPress}
            onAnimationEnd={() => animating.value = false}
        >
            <Icon name='close' classes='w-full h-full stroke-white' />
        </button>
    );
}
