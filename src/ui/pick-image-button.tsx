import { createRef } from 'preact';
import { useState } from 'preact/hooks';

import type { FileCallback } from '@/types/callback';

import Icon from './icon';

interface Props {
    chooseCallback: FileCallback
}
export default function PickImageButton({ chooseCallback }: Props) {
    const fileInput = createRef<HTMLInputElement>();
    const [animating, setAnimating] = useState(false);

    function onPress() {
        if (!fileInput.current)
            return;

        fileInput.current.value = '';
        fileInput.current.click();
        setAnimating(true);
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
            class={`${animating ? 'animate-button-press' : ''} no-highlight-btn w-full h-full p-4 flex justify-center items-center rounded-[50%] bg-neutral-600 cursor-pointer transition ease-out duration-10 origin-center hover:scale-[1.1] hover:bg-neutral-900`}
            onClick={onPress}
            onAnimationEnd={() => setAnimating(false)}
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
