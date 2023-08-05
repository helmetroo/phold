import type { Signal } from '@preact/signals';

import CloseButton from './x-button';

function wrapLine(line: string) {
    return (
        <p class='text-white text-lg'>{line}</p>
    );
}

interface Props {
    visible: Signal<boolean>,
    message: Signal<string[]>,
}
export default function ErrorOverlay({ visible, message }: Props) {
    const msgLength = message.value.length;
    const msgText = message.value.map((line, index) => {
        return (
            <>
                {wrapLine(line)}
                {index !== msgLength - 1 ? <br /> : false}
            </>
        );
    });

    function close() {
        visible.value = false;
    }

    return (
        <section class={`${visible.value ? 'flex' : 'hidden'} flex-col justify-center items-center z-20 bg-black/75 w-full h-full fixed inset-0 m-auto`}>
            <section class='flex flex-col text-center m-8 p-6 rounded-md bg-neutral-800 border-neutral-700 border-2 border-solid'>
                <section>
                    {msgText}
                </section>
            </section>
            <CloseButton
                label='Dismiss'
                classes='relative'
                callback={close} />
        </section>
    );
}
