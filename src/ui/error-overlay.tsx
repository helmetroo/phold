import CloseButton from './x-button';

import type Callback from '@/types/callback';

function wrapLine(line: string) {
    return (
        <p class='text-white text-lg'>{line}</p>
    );
}

interface Props {
    visible: boolean,
    message: string[] | string,
    onClose: Callback,
}
export default function ErrorOverlay({ visible, message, onClose }: Props) {
    const msgLength = message.length;
    const msgText = Array.isArray(message)
        ? message.map((line, index) => {
            return (
                <>
                    {wrapLine(line)}
                    {index !== msgLength - 1 ? <br /> : false}
                </>
            );
        })
        : wrapLine(message);
    return (
        <section class={`${visible ? 'flex' : 'hidden'} flex-col justify-center items-center z-20 bg-black/75 w-full h-full fixed inset-0 m-auto`}>
            <section class='flex flex-col text-center m-8 p-6 rounded-md bg-neutral-800 border-neutral-700 border-2 border-solid'>
                <section>
                    {msgText}
                </section>
            </section>
            <CloseButton
                classes='relative'
                callback={onClose} />
        </section>
    );
}
