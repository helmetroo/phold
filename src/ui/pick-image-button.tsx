import { createRef } from 'preact';
import { useSignal } from '@preact/signals';

import type { FileCallback } from '@/types/callback';

import Icon from './icon';

interface Props {
    chooseCallback: FileCallback
}
export default function PickImageButton({ chooseCallback }: Props) {
    const animating = useSignal(false);

    const fileInput = createRef<HTMLInputElement>();

    function onPress() {
        animating.value = true;

        if (!fileInput.current)
            return;

        fileInput.current.value = '';
        fileInput.current.click();
    }

    function onChangeFile(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files && target.files[0];
        if (!file)
            return;

        const imageUrl = URL.createObjectURL(file);
        chooseCallback({
            file,
            url: imageUrl
        });
    }

    return (
        <button
            aria-label='Choose image'
            class={`${animating.value ? 'animate-button-press' : ''} no-highlight-btn w-full h-full p-4 flex justify-center items-center rounded-[50%] bg-neutral-600 cursor-pointer transition ease-out duration-10 origin-center hover:scale-[1.1] hover:bg-neutral-900`}
            onClick={onPress}
            onAnimationEnd={() => animating.value = false}
        >
            <Icon name='upload' classes='w-full h-full stroke-white' />
            <input
                type='file'
                accept='image/*'
                onChange={onChangeFile}
                ref={fileInput}
                hidden
            />
        </button >
    );
}
